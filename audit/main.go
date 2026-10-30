package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/segmentio/kafka-go"
)

type EventNewsMessage struct {
	SchemaVersion     int                    `json:"schemaVersion"`
	MessageID         string                 `json:"messageId"`
	NewsType          string                 `json:"newsType"`
	EventID           int64                  `json:"eventId"`
	EventTitle        string                 `json:"eventTitle"`
	EventDateTime     *LocalDateTime         `json:"eventDateTime"`
	EventType         *string                `json:"eventType"`
	LeadCuratorID     *int64                 `json:"leadCuratorId"`
	OccurredAt        time.Time              `json:"occurredAt"`
	ResponsibleUserID *int64                 `json:"responsibleUserId"`
	Source            string                 `json:"source"`
	Changes           map[string]FieldChange `json:"changes"`
}

// FieldChange guarda el valor anterior y el posterior de un campo modificado.
// RawMessage conserva el tipo JSON original (texto, numero, enum o null).
type FieldChange struct {
	Previous json.RawMessage `json:"previous"`
	Current  json.RawMessage `json:"current"`
}

const insertAuditSQL = `
INSERT INTO audit_log (
    message_id, schema_version, news_type, event_id, event_title,
    event_datetime, event_type, lead_curator_id, responsible_user_id,
    occurred_at, source, changes_json, payload_json,
    kafka_topic, kafka_partition, kafka_offset, consumed_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE id = id`

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("INFO: no hay .env, se usan las variables del sistema")
	}

	db := connectDB()
	defer db.Close()

	broker := getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
	topic := getenv("KAFKA_TOPIC_EVENTS", "museum.events")
	dlqTopic := getenv("KAFKA_TOPIC_DLQ", "audit-dlq")
	groupID := getenv("KAFKA_GROUP_ID", "audit-service")
	port := getenv("PORT", "8083")

	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET debe tener al menos 32 caracteres y ser igual al de Spring")
	}
	issuer := getenv("JWT_ISSUER", "museo-virtual")

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{broker},
		GroupID:        groupID,
		Topic:          topic,
		StartOffset:    kafka.FirstOffset,
		MinBytes:       1,
		MaxBytes:       10 << 20,        // bitshift para hacer unos 10 * 1024 * 1024 (10mb)
		MaxWait:        5 * time.Second, // high frecuency pero para que se testee más rápido.
		CommitInterval: 0,               // commit manual, despues de persistir
		MaxAttempts:    3,
	})
	defer reader.Close()

	dlq := &kafka.Writer{
		Addr:         kafka.TCP(broker),
		Topic:        dlqTopic,
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireAll,
		MaxAttempts:  3,
	}
	defer dlq.Close()

	signalCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ctx tambien se puede cancelar desde persistLoop si un mensaje no se pudo
	// mover al DLQ. En ese caso no se confirma el offset y el proceso termina
	// para que Kafka lo reentregue al reiniciar.
	ctx, cancel := context.WithCancel(signalCtx)
	defer cancel()

	// Canal con buffer: el poller puede ir unos mensajes adelante mientras el
	// writer persiste. Si el writer se atrasa, el canal llena y el poller
	// espera: eso es backpressure, no perdida de mensajes.
	records := make(chan kafka.Message, 100)

	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		consumeLoop(ctx, reader, records)
	}()

	go func() {
		defer wg.Done()
		persistLoop(ctx, cancel, db, reader, dlq, records)
	}()

	go func() {
		defer wg.Done()
		serveHTTP(ctx, db, port, []byte(secret), issuer)
	}()

	log.Printf("INFO: audit service escuchando %s, grupo %s", topic, groupID)
	wg.Wait()
	log.Println("INFO: audit service detenido")
}

// consumeLoop es el unico goroutine que lee de Kafka. Manda cada registro al
// canal y cierra el canal al salir, para que persistLoop termine solo.
func consumeLoop(ctx context.Context, reader *kafka.Reader, records chan<- kafka.Message) {
	defer close(records)

	for {
		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Println("INFO: poll detenido por shutdown")
				return
			}

			log.Printf("ERROR: fetch de Kafka: %v", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
			continue
		}

		select {
		case records <- msg:
		case <-ctx.Done():
			return
		}
	}
}

// persistLoop transforma el mensaje en una fila de audit_log y recien despues
// confirma el offset. Es un solo goroutine a proposito: asi los commits de un
// mismo partition salen en orden y no se pisa un offset menor con uno mayor.
func persistLoop(ctx context.Context, cancel context.CancelFunc, db *sql.DB, reader *kafka.Reader, dlq *kafka.Writer, records <-chan kafka.Message) {
	for msg := range records {
		var news EventNewsMessage
		cause := ""

		if err := json.Unmarshal(msg.Value, &news); err != nil {
			cause = "json invalido: " + err.Error()
		} else if news.SchemaVersion != 1 || news.MessageID == "" || news.EventID == 0 || news.NewsType == "" {
			cause = fmt.Sprintf("mensaje incompleto o schemaVersion no soportada (schemaVersion=%d, messageId=%q, eventId=%d)",
				news.SchemaVersion, news.MessageID, news.EventID)
		} else {
			var eventDateTime sql.NullTime
			if news.EventDateTime != nil {
				eventDateTime = sql.NullTime{Time: news.EventDateTime.Time, Valid: true}
			}

			var eventType sql.NullString
			if news.EventType != nil {
				eventType = sql.NullString{String: *news.EventType, Valid: true}
			}

			var leadCuratorID sql.NullInt64
			if news.LeadCuratorID != nil {
				leadCuratorID = sql.NullInt64{Int64: *news.LeadCuratorID, Valid: true}
			}

			var responsibleUserID sql.NullInt64
			if news.ResponsibleUserID != nil {
				responsibleUserID = sql.NullInt64{Int64: *news.ResponsibleUserID, Valid: true}
			}

			var changesJSON []byte
			if len(news.Changes) > 0 {
				changesJSON, err = json.Marshal(news.Changes)
			}

			if cause == "" {
				var dbErr error
				for attempt := 1; attempt <= 5; attempt++ {
					_, dbErr = db.ExecContext(ctx, insertAuditSQL,
						news.MessageID, news.SchemaVersion, news.NewsType, news.EventID, news.EventTitle,
						eventDateTime, eventType, leadCuratorID, responsibleUserID,
						news.OccurredAt.UTC(), news.Source, changesJSON, msg.Value,
						msg.Topic, msg.Partition, msg.Offset, time.Now().UTC(),
					)
					if dbErr == nil {
						break
					}
					log.Printf("ERROR: insert audit_log messageId=%s intento %d/5: %v",
						news.MessageID, attempt, dbErr)
					select {
					case <-ctx.Done():
						return
					case <-time.After(time.Duration(attempt) * time.Second):
					}
				}
				if dbErr != nil {
					cause = "db: " + dbErr.Error()
				}
			}
		}

		if cause != "" {
			log.Printf("ERROR: mensaje al DLQ messageId=%q partition=%d offset=%d: %s",
				news.MessageID, msg.Partition, msg.Offset, cause)

			// Se copia el mensaje original al topic de descarte con headers que
			// permiten reconstruir de donde salio.
			//
			// Si el DLQ falla, el mensaje no esta ni en audit_log ni en el topic
			// de descarte. No se confirma el offset: se corta el consumidor y
			// Kafka lo reentrega al reiniciar. Es preferible a perderlo.
			dlqCtx, dlqCancel := context.WithTimeout(ctx, 5*time.Second)
			err := dlq.WriteMessages(dlqCtx, kafka.Message{
				Key:   msg.Key,
				Value: msg.Value,
				Headers: []kafka.Header{
					{Key: "x-error", Value: []byte(cause)},
					{Key: "x-original-topic", Value: []byte(msg.Topic)},
					{Key: "x-original-partition", Value: []byte(strconv.Itoa(msg.Partition))},
					{Key: "x-original-offset", Value: []byte(strconv.FormatInt(msg.Offset, 10))},
					{Key: "x-failed-at", Value: []byte(time.Now().UTC().Format(time.RFC3339))},
				},
			})
			dlqCancel()

			if err != nil {
				log.Printf("ERROR: no se pudo publicar en el DLQ partition=%d offset=%d: %v",
					msg.Partition, msg.Offset, err)
				log.Println("ERROR: se detiene el consumidor sin confirmar el offset")
				cancel()
				return
			}

			commitMessage(reader, msg)
			continue
		}

		log.Printf("INFO: auditado messageId=%s newsType=%s eventId=%d partition=%d offset=%d",
			news.MessageID, news.NewsType, news.EventID, msg.Partition, msg.Offset)
		commitMessage(reader, msg)
	}
}

// commitMessage usa un contexto propio porque el ctx principal puede estar
// cancelado por SIGTERM justo despues de persistir. Si el commit falla, Kafka
// reentrega el mensaje y el unique key de message_id lo absorbe.
func commitMessage(reader *kafka.Reader, msg kafka.Message) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := reader.CommitMessages(ctx, msg); err != nil {
		log.Printf("ERROR: no se pudo confirmar offset=%d: %v", msg.Offset, err)
	}
}

// -- herlpers

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// LocalDateTime existe porque eventDateTime llega como "2026-11-15T20:00:00",
// sin zona horaria. time.Time solo acepta RFC3339 y fallaria al parsearlo.
type LocalDateTime struct {
	time.Time
}

func (d *LocalDateTime) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		return nil
	}
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	layouts := []string{
		"2006-01-02T15:04:05",
		"2006-01-02T15:04:05.999999999",
		time.RFC3339,
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			d.Time = t
			return nil
		}
	}
	return fmt.Errorf("eventDateTime invalido: %q", s)
}
