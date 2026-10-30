package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type auditEvent struct {
	ID                int64           `json:"id"`
	MessageID         string          `json:"messageId"`
	SchemaVersion     int             `json:"schemaVersion"`
	NewsType          string          `json:"newsType"`
	EventID           int64           `json:"eventId"`
	EventTitle        string          `json:"eventTitle"`
	EventDateTime     *string         `json:"eventDateTime"`
	EventType         *string         `json:"eventType"`
	LeadCuratorID     *int64          `json:"leadCuratorId"`
	ResponsibleUserID *int64          `json:"responsibleUserId"`
	OccurredAt        time.Time       `json:"occurredAt"`
	Source            string          `json:"source"`
	Changes           json.RawMessage `json:"changes"`
	Payload           json.RawMessage `json:"payload,omitempty"`
	Kafka             kafkaPosition   `json:"kafka"`
	ConsumedAt        time.Time       `json:"consumedAt"`
}

type kafkaPosition struct {
	Topic     string `json:"topic"`
	Partition int    `json:"partition"`
	Offset    int64  `json:"offset"`
}

func serveHTTP(ctx context.Context, db *sql.DB, port string, secret []byte, issuer string) {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		pingCtx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(pingCtx); err != nil {
			writeProblem(w, r, http.StatusServiceUnavailable, "db no disponible: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "audit"})
	})

	mux.Handle("/api/audit/events", AuthMiddleware(secret, issuer, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handleAuditEvents(w, r, db)
	})))

	server := &http.Server{Addr: ":" + port, Handler: mux}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("INFO: http en http://localhost:%s/health y http://localhost:%s/api/audit/events", port, port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("ERROR: servidor HTTP: %v", err)
	}
}

// handleAuditEvents atiende GET /api/audit/events. Todos los filtros son
// opcionales y se combinan con AND. El orden es fijo: occurred_at, id, porque
// el outbox del backend puede publicar un update viejo despues de uno nuevo y
// el id de la fila no refleja el orden real de los eventos.
func handleAuditEvents(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		writeProblem(w, r, http.StatusMethodNotAllowed, "solo se permite GET")
		return
	}

	user, ok := UserFromContext(r.Context())
	if !ok {
		writeProblem(w, r, http.StatusUnauthorized, "autenticación requerida")
		return
	}
	if user.Role != "CURADOR" && user.Role != "ADMINISTRADOR" {
		writeProblem(w, r, http.StatusForbidden, "no tenés permisos para consultar la auditoría")
		return
	}

	query := r.URL.Query()

	page := 0
	if raw := query.Get("page"); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil || value < 0 {
			writeProblem(w, r, http.StatusBadRequest, "page debe ser un entero >= 0")
			return
		}
		page = value
	}

	size := 50
	if raw := query.Get("size"); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil || value < 1 || value > 200 {
			writeProblem(w, r, http.StatusBadRequest, "size debe ser un entero entre 1 y 200")
			return
		}
		size = value
	}

	includePayload := false
	if raw := query.Get("includePayload"); raw != "" {
		value, err := strconv.ParseBool(raw)
		if err != nil {
			writeProblem(w, r, http.StatusBadRequest, "includePayload debe ser true o false")
			return
		}
		includePayload = value
	}

	conditions := []string{"1 = 1"}
	args := []any{}

	if raw := query.Get("eventId"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || value <= 0 {
			writeProblem(w, r, http.StatusBadRequest, "eventId debe ser un entero positivo")
			return
		}
		conditions = append(conditions, "event_id = ?")
		args = append(args, value)
	}

	if raw := query.Get("newsType"); raw != "" {
		switch raw {
		case "EVENT_CREATED", "EVENT_UPDATED", "EVENT_CANCELLED":
		default:
			writeProblem(w, r, http.StatusBadRequest, "newsType invalido, use EVENT_CREATED, EVENT_UPDATED o EVENT_CANCELLED")
			return
		}
		conditions = append(conditions, "news_type = ?")
		args = append(args, raw)
	}

	if raw := query.Get("responsibleUserId"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || value <= 0 {
			writeProblem(w, r, http.StatusBadRequest, "responsibleUserId debe ser un entero positivo")
			return
		}
		conditions = append(conditions, "responsible_user_id = ?")
		args = append(args, value)
	}

	// occurred_at esta guardado en UTC, asi que los extremos se normalizan.
	var from, to time.Time
	if raw := query.Get("from"); raw != "" {
		value, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			writeProblem(w, r, http.StatusBadRequest, "from debe ser RFC3339, por ejemplo 2026-10-01T00:00:00Z")
			return
		}
		from = value
		conditions = append(conditions, "occurred_at >= ?")
		args = append(args, value.UTC())
	}
	if raw := query.Get("to"); raw != "" {
		value, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			writeProblem(w, r, http.StatusBadRequest, "to debe ser RFC3339, por ejemplo 2026-10-31T23:59:59Z")
			return
		}
		to = value
		conditions = append(conditions, "occurred_at <= ?")
		args = append(args, value.UTC())
	}
	if !from.IsZero() && !to.IsZero() && from.After(to) {
		writeProblem(w, r, http.StatusBadRequest, "from no puede ser posterior a to")
		return
	}

	// para evitar requests caras al pepe
	payloadColumn := "NULL"
	if includePayload {
		payloadColumn = "payload_json"
	}

	
	sqlText := `SELECT
		id, message_id, schema_version, news_type, event_id, event_title,
		event_datetime, event_type, lead_curator_id, responsible_user_id,
		occurred_at, source, changes_json, ` + payloadColumn + `,
		kafka_topic, kafka_partition, kafka_offset, consumed_at
	FROM audit_log
	WHERE ` + strings.Join(conditions, " AND ") + `
	ORDER BY occurred_at, id
	LIMIT ? OFFSET ?`
	args = append(args, size+1, page*size) // Se pide size+1 para saber si hay otra pagina sin hacer un COUNT(*).

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.QueryContext(ctx, sqlText, args...)
	if err != nil {
		log.Printf("ERROR: query audit_log: %v", err)
		writeProblem(w, r, http.StatusInternalServerError, "no se pudo consultar la auditoría")
		return
	}
	defer rows.Close()

	events := make([]auditEvent, 0, size)
	for rows.Next() {
		var (
			event         auditEvent
			eventDateTime sql.NullTime
			eventType     sql.NullString
			leadCuratorID sql.NullInt64
			responsibleID sql.NullInt64
			changes       []byte
			payload       []byte
		)

		if err := rows.Scan(
			&event.ID, &event.MessageID, &event.SchemaVersion, &event.NewsType,
			&event.EventID, &event.EventTitle, &eventDateTime, &eventType,
			&leadCuratorID, &responsibleID, &event.OccurredAt, &event.Source,
			&changes, &payload, &event.Kafka.Topic, &event.Kafka.Partition,
			&event.Kafka.Offset, &event.ConsumedAt,
		); err != nil {
			log.Printf("ERROR: scan audit_log: %v", err)
			writeProblem(w, r, http.StatusInternalServerError, "no se pudo leer la auditoría")
			return
		}

		if eventDateTime.Valid {
			value := eventDateTime.Time.Format("2006-01-02T15:04:05")
			event.EventDateTime = &value
		}
		if eventType.Valid {
			value := eventType.String
			event.EventType = &value
		}
		if leadCuratorID.Valid {
			value := leadCuratorID.Int64
			event.LeadCuratorID = &value
		}
		if responsibleID.Valid {
			value := responsibleID.Int64
			event.ResponsibleUserID = &value
		}
		if len(changes) > 0 {
			event.Changes = json.RawMessage(changes)
		}
		if len(payload) > 0 {
			event.Payload = json.RawMessage(payload)
		}

		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		log.Printf("ERROR: recorriendo audit_log: %v", err)
		writeProblem(w, r, http.StatusInternalServerError, "no se pudo leer la auditoría")
		return
	}

	hasMore := len(events) > size
	if hasMore {
		events = events[:size]
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"content": events,
		"page":    page,
		"size":    size,
		"hasMore": hasMore,
	})
}

// writeJSON es el unico lugar que arma una respuesta 2xx (successssss).
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("ERROR: escribiendo respuesta JSON: %v", err)
	}
}

type problemDetail struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail"`
	Instance string `json:"instance"`
}

func writeProblem(w http.ResponseWriter, r *http.Request, status int, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(problemDetail{
		Type:     "about:blank",
		Title:    http.StatusText(status),
		Status:   status,
		Detail:   detail,
		Instance: r.URL.Path,
	})
}

// -- auth (copiado del backend GraphQL, mismo JWT_SECRET y mismo emisor)

type ctxKey string

const userKey ctxKey = "user"

type User struct {
	ID       int64
	Username string
	Role     string
}

func AuthMiddleware(secret []byte, issuer string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" {
			next.ServeHTTP(w, r)
			return
		}
		if !strings.HasPrefix(header, "Bearer ") {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		token, err := jwt.Parse(tokenStr,
			func(t *jwt.Token) (interface{}, error) { return secret, nil },
			jwt.WithValidMethods([]string{"HS256", "HS384", "HS512"}),
			jwt.WithIssuer(issuer),
			jwt.WithExpirationRequired(),
		)
		if err != nil || !token.Valid {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}

		username, _ := claims["sub"].(string)
		role, _ := claims["role"].(string)
		id, _ := claims["userId"].(float64)

		user := User{ID: int64(id), Username: username, Role: role}
		ctx := context.WithValue(r.Context(), userKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserFromContext(ctx context.Context) (User, bool) {
	u, ok := ctx.Value(userKey).(User)
	return u, ok
}
