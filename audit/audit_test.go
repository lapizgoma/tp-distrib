package main

// Este archivo tiene dos regiones bien separadas:
//
//   1. REGIÓN DE MOCK E INFRAESTRUCTURA: fakes, helpers, matchers y armado de
//      sqlmock. Nada de esto es un test; solo sostiene a los tests.
//   2. REGIÓN DE TESTS: los Test... que verifican el enunciado del Hito 3.
//
// Se testea sin Kafka ni MySQL reales: kafka-go se reemplaza por los fakes y
// MySQL por sqlmock.

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/golang-jwt/jwt/v5"
	"github.com/segmentio/kafka-go"
)

// =============================================================================
// REGIÓN DE MOCK E INFRAESTRUCTURA DE TEST
// =============================================================================

const (
	testSecret = "secret-de-test-con-mas-de-32-caracteres-0001"
	testIssuer = "museo-virtual"
)

// mockSeq mantiene unicos los dsn de sqlmock entre tests.
var mockSeq int

// -- auth

// signToken firma un JWT HS256 con los claims que espera AuthMiddleware.
// exp en cero significa "sin claim exp", para poder testear ese rechazo.
func signToken(t *testing.T, secret, issuer, role string, exp time.Time) string {
	t.Helper()

	claims := jwt.MapClaims{
		"sub":    "tester",
		"role":   role,
		"userId": 1,
		"iss":    issuer,
	}
	if !exp.IsZero() {
		claims["exp"] = exp.Unix()
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("no se pudo firmar el token: %v", err)
	}
	return signed
}

// newAuditHandler arma el mismo pipeline que serveHTTP, pero sin abrir un
// listener real: middleware de auth + handler de consulta.
func newAuditHandler(db *sql.DB) http.Handler {
	return AuthMiddleware([]byte(testSecret), testIssuer, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handleAuditEvents(w, r, db)
	}))
}

// doRequest ejecuta una request contra el handler y devuelve el recorder.
func doRequest(t *testing.T, handler http.Handler, method, target, auth string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, target, nil)
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return rr
}

// eventsResponse es el sobre JSON que devuelve GET /api/audit/events.
type eventsResponse struct {
	Content []map[string]any `json:"content"`
	Page    int              `json:"page"`
	Size    int              `json:"size"`
	HasMore bool             `json:"hasMore"`
}

func decodeEvents(t *testing.T, rr *httptest.ResponseRecorder) eventsResponse {
	t.Helper()

	var body eventsResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("la respuesta no es JSON: %v (%s)", err, rr.Body.String())
	}
	return body
}

// -- sqlmock

// recordingConnector envuelve el driver de sqlmock para registrar "insert" en
// el slice de eventos. Asi el test puede verificar el orden insert -> commit.
type recordingConnector struct {
	dsn    string
	inner  driver.Driver
	events *[]string
}

func (c *recordingConnector) Connect(context.Context) (driver.Conn, error) {
	conn, err := c.inner.Open(c.dsn)
	if err != nil {
		return nil, err
	}
	return &recordingConn{Conn: conn, events: c.events}, nil
}

func (c *recordingConnector) Driver() driver.Driver { return c.inner }

type recordingConn struct {
	driver.Conn
	events *[]string
}

func (c *recordingConn) ExecContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	*c.events = append(*c.events, "insert")
	if execer, ok := c.Conn.(driver.ExecerContext); ok {
		return execer.ExecContext(ctx, query, args)
	}
	return nil, driver.ErrSkip
}

func (c *recordingConn) QueryContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	if queryer, ok := c.Conn.(driver.QueryerContext); ok {
		return queryer.QueryContext(ctx, query, args)
	}
	return nil, driver.ErrSkip
}

// newMock arma un *sql.DB de sqlmock envuelto por recordingConnector, y
// devuelve tambien el slice donde se registran los eventos ("insert").
func newMock(t *testing.T) (*sql.DB, sqlmock.Sqlmock, *[]string) {
	t.Helper()

	// NewWithDSN permite abrir el *sql.DB a traves del connector propio, que
	// necesita el mismo dsn registrado en el pool de sqlmock.
	mockSeq++
	dsn := fmt.Sprintf("sqlmock_%s_%d", t.Name(), mockSeq)

	base, mock, err := sqlmock.NewWithDSN(dsn, sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("no se pudo crear el mock de sql: %v", err)
	}

	events := &[]string{}
	db := sql.OpenDB(&recordingConnector{dsn: dsn, inner: base.Driver(), events: events})

	t.Cleanup(func() {
		_ = db.Close()
		_ = base.Close()
	})

	return db, mock, events
}

// timeArg compara un argumento time.Time con time.Equal, sin depender de la
// representacion interna ni de la zona horaria.
type timeArg struct{ want time.Time }

func (m timeArg) Match(value driver.Value) bool {
	got, ok := value.(time.Time)
	return ok && got.Equal(m.want)
}

// auditColumns son las 18 columnas del SELECT de handleAuditEvents.
func auditColumns() []string {
	return []string{
		"id", "message_id", "schema_version", "news_type", "event_id", "event_title",
		"event_datetime", "event_type", "lead_curator_id", "responsible_user_id",
		"occurred_at", "source", "changes_json", "payload_json",
		"kafka_topic", "kafka_partition", "kafka_offset", "consumed_at",
	}
}

// addAuditRow agrega una fila completa y valida a un rowset de sqlmock.
func addAuditRow(rows *sqlmock.Rows, id int64, messageID string, changes, payload any) {
	rows.AddRow(
		id, messageID, 1, "EVENT_UPDATED", int64(7), "Noche de museos",
		time.Date(2026, 11, 15, 20, 0, 0, 0, time.UTC), "CHARLA", int64(2), int64(3),
		time.Date(2026, 10, 30, 4, 0, 0, 0, time.UTC), "backend-rest",
		changes, payload, "museum.events", 2, int64(15),
		time.Date(2026, 10, 30, 4, 0, 1, 0, time.UTC),
	)
}

// -- fakes de Kafka

// fakeCommitter reemplaza a *kafka.Reader en persistLoop y registra "commit".
type fakeCommitter struct {
	events   *[]string
	messages []kafka.Message
	err      error
}

func (f *fakeCommitter) CommitMessages(_ context.Context, msgs ...kafka.Message) error {
	*f.events = append(*f.events, "commit")
	f.messages = append(f.messages, msgs...)
	return f.err
}

// fakeWriter reemplaza a *kafka.Writer en persistLoop y registra "dlq".
type fakeWriter struct {
	events   *[]string
	messages []kafka.Message
	err      error
}

func (f *fakeWriter) WriteMessages(_ context.Context, msgs ...kafka.Message) error {
	*f.events = append(*f.events, "dlq")
	f.messages = append(f.messages, msgs...)
	return f.err
}

// channelOf arma el canal que consume persistLoop, ya cerrado.
func channelOf(msgs ...kafka.Message) <-chan kafka.Message {
	ch := make(chan kafka.Message, len(msgs))
	for _, msg := range msgs {
		ch <- msg
	}
	close(ch)
	return ch
}

// validMessage es un mensaje EVENT_UPDATED que cumple todo el contrato.
func validMessage(messageID string) kafka.Message {
	payload := fmt.Sprintf(`{"schemaVersion":1,"messageId":%q,"newsType":"EVENT_UPDATED","eventId":7,`+
		`"eventTitle":"Noche de museos","eventDateTime":"2026-11-15T20:00:00","eventType":"CHARLA",`+
		`"leadCuratorId":2,"occurredAt":"2026-10-30T01:00:00-03:00","responsibleUserId":3,`+
		`"source":"backend-rest","changes":{"eventTitle":{"previous":"A","current":"B"}}}`, messageID)

	return kafka.Message{
		Topic:     "museum.events",
		Partition: 2,
		Offset:    15,
		Key:       []byte("7"),
		Value:     []byte(payload),
	}
}

// messagePayload arma un payload incompleto o invalido a proposito.
func messagePayload(messageID string, schemaVersion int, newsType string, eventID int64) string {
	return fmt.Sprintf(`{"schemaVersion":%d,"messageId":%q,"newsType":%q,"eventId":%d,`+
		`"eventTitle":"Noche de museos","eventDateTime":"2026-11-15T20:00:00",`+
		`"occurredAt":"2026-10-30T01:00:00-03:00","source":"backend-rest"}`,
		schemaVersion, messageID, newsType, eventID)
}

// expectInsert declara el INSERT esperado con todos los argumentos del mensaje
// valido. consumed_at se compara con AnyArg porque es time.Now().
func expectInsert(mock sqlmock.Sqlmock, messageID string, msg kafka.Message) *sqlmock.ExpectedExec {
	return mock.ExpectExec("INSERT INTO audit_log").WithArgs(
		messageID,
		1,
		"EVENT_UPDATED",
		int64(7),
		"Noche de museos",
		timeArg{time.Date(2026, 11, 15, 20, 0, 0, 0, time.UTC)},
		"CHARLA",
		int64(2),
		int64(3),
		timeArg{time.Date(2026, 10, 30, 4, 0, 0, 0, time.UTC)},
		"backend-rest",
		[]byte(`{"eventTitle":{"previous":"A","current":"B"}}`),
		msg.Value,
		"museum.events",
		2,
		int64(15),
		sqlmock.AnyArg(),
	)
}

// =============================================================================
// REGIÓN DE TESTS
// =============================================================================

// -----------------------------------------------------------------------------
// Grupo 1: contrato del mensaje (eventDateTime sin zona)
// -----------------------------------------------------------------------------

// Verifica LocalDateTime.UnmarshalJSON: acepta la hora local sin zona, con
// fracciones de segundo y RFC3339 con Z; "null" deja el Time en cero y sin
// error; cualquier otro formato (por ejemplo "15/11/2026") devuelve error.
func TestLocalDateTimeUnmarshalJSON(t *testing.T) {
	cases := []struct {
		name    string
		input   string
		want    time.Time
		wantErr bool
	}{
		{"sin fracciones", `"2026-11-15T20:00:00"`, time.Date(2026, 11, 15, 20, 0, 0, 0, time.UTC), false},
		{"con nanosegundos", `"2026-11-15T20:00:00.123456789"`, time.Date(2026, 11, 15, 20, 0, 0, 123456789, time.UTC), false},
		{"rfc3339 con zona", `"2026-11-15T20:00:00Z"`, time.Date(2026, 11, 15, 20, 0, 0, 0, time.UTC), false},
		{"null", `null`, time.Time{}, false},
		{"formato desconocido", `"15/11/2026"`, time.Time{}, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var got LocalDateTime
			err := got.UnmarshalJSON([]byte(tc.input))

			if tc.wantErr {
				if err == nil {
					t.Fatalf("se esperaba error para %s", tc.input)
				}
				return
			}
			if err != nil {
				t.Fatalf("error inesperado: %v", err)
			}
			if !got.Time.Equal(tc.want) {
				t.Fatalf("se esperaba %v, se obtuvo %v", tc.want, got.Time)
			}
		})
	}
}

// -----------------------------------------------------------------------------
// Grupo 2: autenticacion y autorizacion
// -----------------------------------------------------------------------------

// Verifica el middleware de auth y el control de roles del handler:
//   - 401 sin header, con esquema distinto de Bearer, con otro secret, con otro
//     issuer, con token vencido y con token sin exp.
//   - 403 para un rol que no es CURADOR ni ADMINISTRADOR, sin consultar la DB.
//   - 200 para CURADOR y ADMINISTRADOR.
//   - 405 con header Allow: GET para POST.
//
// Todos los errores deben salir como application/problem+json.
func TestAuthAndAuthorization(t *testing.T) {
	valid := func(role string) string {
		return signToken(t, testSecret, testIssuer, role, time.Now().Add(time.Hour))
	}

	cases := []struct {
		name      string
		method    string
		auth      string
		want      int
		wantQuery bool
	}{
		{"sin header", http.MethodGet, "", http.StatusUnauthorized, false},
		{"esquema basic", http.MethodGet, "Basic dXNlcjpwYXNz", http.StatusUnauthorized, false},
		{"token con otro secret", http.MethodGet, "Bearer " + signToken(t, "otro-secret-de-test-con-mas-de-32-chars", testIssuer, "CURADOR", time.Now().Add(time.Hour)), http.StatusUnauthorized, false},
		{"token con otro issuer", http.MethodGet, "Bearer " + signToken(t, testSecret, "otro-emisor", "CURADOR", time.Now().Add(time.Hour)), http.StatusUnauthorized, false},
		{"token vencido", http.MethodGet, "Bearer " + signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(-time.Hour)), http.StatusUnauthorized, false},
		{"token sin exp", http.MethodGet, "Bearer " + signToken(t, testSecret, testIssuer, "CURADOR", time.Time{}), http.StatusUnauthorized, false},
		{"rol visitante", http.MethodGet, "Bearer " + valid("VISITANTE"), http.StatusForbidden, false},
		{"rol curador", http.MethodGet, "Bearer " + valid("CURADOR"), http.StatusOK, true},
		{"rol administrador", http.MethodGet, "Bearer " + valid("ADMINISTRADOR"), http.StatusOK, true},
		{"post con token valido", http.MethodPost, "Bearer " + valid("CURADOR"), http.StatusMethodNotAllowed, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, _ := newMock(t)
			if tc.wantQuery {
				mock.ExpectQuery("ORDER BY occurred_at, id").
					WillReturnRows(sqlmock.NewRows(auditColumns()))
			}

			rr := doRequest(t, newAuditHandler(db), tc.method, "/api/audit/events", tc.auth)

			if rr.Code != tc.want {
				t.Fatalf("se esperaba %d, se obtuvo %d (%s)", tc.want, rr.Code, rr.Body.String())
			}
			if tc.want >= 400 {
				if ct := rr.Header().Get("Content-Type"); ct != "application/problem+json" {
					t.Fatalf("Content-Type esperado application/problem+json, se obtuvo %q", ct)
				}
			}
			if tc.want == http.StatusMethodNotAllowed {
				if allow := rr.Header().Get("Allow"); allow != http.MethodGet {
					t.Fatalf("Allow esperado GET, se obtuvo %q", allow)
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// -----------------------------------------------------------------------------
// Grupo 3: consulta del historial (handleAuditEvents)
// -----------------------------------------------------------------------------

// Verifica los valores por defecto de la consulta: sin parametros usa el orden
// fijo occurred_at, id, pide size+1 filas (LIMIT 51 OFFSET 0), responde
// page=0, size=50, hasMore=false y devuelve content como [] y nunca null.
func TestHandleAuditEventsDefaults(t *testing.T) {
	db, mock, _ := newMock(t)
	mock.ExpectQuery("ORDER BY occurred_at, id").
		WithArgs(51, 0).
		WillReturnRows(sqlmock.NewRows(auditColumns()))

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events",
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))

	if rr.Code != http.StatusOK {
		t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}

	body := decodeEvents(t, rr)
	if body.Page != 0 || body.Size != 50 || body.HasMore {
		t.Fatalf("paginacion inesperada: page=%d size=%d hasMore=%v", body.Page, body.Size, body.HasMore)
	}
	if body.Content == nil {
		t.Fatal("content debe ser [] y nunca null")
	}
	if len(body.Content) != 0 {
		t.Fatalf("se esperaban 0 filas, se obtuvieron %d", len(body.Content))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica que todos los filtros se combinen con AND en el orden esperado y que
// la paginacion se traduzca a LIMIT size+1 OFFSET page*size (11 y 20).
func TestHandleAuditEventsCombinedFilters(t *testing.T) {
	db, mock, _ := newMock(t)
	mock.ExpectQuery(`WHERE 1 = 1 AND event_id = \? AND news_type = \? AND responsible_user_id = \? AND occurred_at >= \? AND occurred_at <= \?`).
		WithArgs(
			int64(7),
			"EVENT_UPDATED",
			int64(3),
			timeArg{time.Date(2026, 10, 1, 3, 0, 0, 0, time.UTC)},
			timeArg{time.Date(2026, 10, 31, 23, 59, 59, 0, time.UTC)},
			11,
			20,
		).
		WillReturnRows(sqlmock.NewRows(auditColumns()))

	target := "/api/audit/events?eventId=7&newsType=EVENT_UPDATED&responsibleUserId=3" +
		"&from=2026-10-01T00:00:00-03:00&to=2026-10-31T23:59:59Z&page=2&size=10"

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, target,
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))

	if rr.Code != http.StatusOK {
		t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica que un from con offset -03:00 llegue a MySQL como el mismo instante
// en UTC (03:00Z), que es el marco en el que esta guardado occurred_at.
func TestHandleAuditEventsNormalizesUTC(t *testing.T) {
	db, mock, _ := newMock(t)
	mock.ExpectQuery(`occurred_at >= \?`).
		WithArgs(
			timeArg{time.Date(2026, 10, 1, 3, 0, 0, 0, time.UTC)},
			51,
			0,
		).
		WillReturnRows(sqlmock.NewRows(auditColumns()))

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events?from=2026-10-01T00:00:00-03:00",
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))

	if rr.Code != http.StatusOK {
		t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica las validaciones de entrada: cada parametro invalido devuelve 400
// con problem+json y no llega a ejecutar ninguna query (el mock no tiene
// expectativas y aun asi ExpectationsWereMet pasa).
func TestHandleAuditEventsBadRequests(t *testing.T) {
	cases := []struct {
		name   string
		target string
	}{
		{"page negativo", "/api/audit/events?page=-1"},
		{"page no numerico", "/api/audit/events?page=abc"},
		{"size cero", "/api/audit/events?size=0"},
		{"size demasiado grande", "/api/audit/events?size=201"},
		{"eventId cero", "/api/audit/events?eventId=0"},
		{"eventId no numerico", "/api/audit/events?eventId=x"},
		{"responsibleUserId negativo", "/api/audit/events?responsibleUserId=-5"},
		{"newsType desconocido", "/api/audit/events?newsType=EVENT_DELETED"},
		{"from invalido", "/api/audit/events?from=ayer"},
		{"to invalido", "/api/audit/events?to=ayer"},
		{"from posterior a to", "/api/audit/events?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z"},
		{"includePayload invalido", "/api/audit/events?includePayload=quizas"},
	}

	token := "Bearer " + signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour))

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, _ := newMock(t)

			rr := doRequest(t, newAuditHandler(db), http.MethodGet, tc.target, token)

			if rr.Code != http.StatusBadRequest {
				t.Fatalf("se esperaba 400, se obtuvo %d (%s)", rr.Code, rr.Body.String())
			}
			if ct := rr.Header().Get("Content-Type"); ct != "application/problem+json" {
				t.Fatalf("Content-Type esperado application/problem+json, se obtuvo %q", ct)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Verifica hasMore sin COUNT(*): se piden size+1 filas; con 3 filas y size=2 se
// devuelven 2 y hasMore=true; con exactamente 2 filas, hasMore=false.
func TestHandleAuditEventsHasMore(t *testing.T) {
	token := "Bearer " + signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour))

	cases := []struct {
		name        string
		rows        int
		wantContent int
		wantHasMore bool
	}{
		{"mas filas que el size", 3, 2, true},
		{"exactamente el size", 2, 2, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, _ := newMock(t)

			rows := sqlmock.NewRows(auditColumns())
			for i := 0; i < tc.rows; i++ {
				addAuditRow(rows, int64(i+1), fmt.Sprintf("m-%d", i+1), nil, nil)
			}
			mock.ExpectQuery("ORDER BY occurred_at, id").
				WithArgs(3, 0).
				WillReturnRows(rows)

			rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events?size=2", token)
			if rr.Code != http.StatusOK {
				t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
			}

			body := decodeEvents(t, rr)
			if len(body.Content) != tc.wantContent {
				t.Fatalf("se esperaban %d filas, se obtuvieron %d", tc.wantContent, len(body.Content))
			}
			if body.HasMore != tc.wantHasMore {
				t.Fatalf("hasMore esperado %v, se obtuvo %v", tc.wantHasMore, body.HasMore)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Verifica includePayload: en false la query selecciona NULL en esa columna y
// el JSON de salida no trae la clave payload; en true selecciona payload_json y
// la devuelve como objeto JSON.
func TestHandleAuditEventsIncludePayload(t *testing.T) {
	token := "Bearer " + signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour))
	payload := `{"messageId":"m-1","schemaVersion":1}`

	cases := []struct {
		name          string
		target        string
		queryFragment string
		rowPayload    any
		wantPayload   bool
	}{
		{"sin payload", "/api/audit/events", "changes_json, NULL,", nil, false},
		{"con payload", "/api/audit/events?includePayload=true", "changes_json, payload_json,", []byte(payload), true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, _ := newMock(t)

			rows := sqlmock.NewRows(auditColumns())
			addAuditRow(rows, 1, "m-1", nil, tc.rowPayload)
			mock.ExpectQuery(tc.queryFragment).WillReturnRows(rows)

			rr := doRequest(t, newAuditHandler(db), http.MethodGet, tc.target, token)
			if rr.Code != http.StatusOK {
				t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
			}

			body := decodeEvents(t, rr)
			if len(body.Content) != 1 {
				t.Fatalf("se esperaba 1 fila, se obtuvieron %d", len(body.Content))
			}

			raw, ok := body.Content[0]["payload"]
			if ok != tc.wantPayload {
				t.Fatalf("presencia de payload esperada %v, se obtuvo %v", tc.wantPayload, ok)
			}
			if tc.wantPayload {
				object, ok := raw.(map[string]any)
				if !ok {
					t.Fatalf("payload deberia ser un objeto JSON, se obtuvo %T", raw)
				}
				if object["messageId"] != "m-1" {
					t.Fatalf("payload inesperado: %v", object)
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Verifica que changes_json salga como objeto JSON con previous y current
// intactos (no como string escapado), que es el antes/despues del PDF.
func TestHandleAuditEventsPreservesChanges(t *testing.T) {
	db, mock, _ := newMock(t)

	rows := sqlmock.NewRows(auditColumns())
	addAuditRow(rows, 1, "m-1", []byte(`{"eventTitle":{"previous":"A","current":"B"}}`), nil)
	mock.ExpectQuery("ORDER BY occurred_at, id").WillReturnRows(rows)

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events",
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))
	if rr.Code != http.StatusOK {
		t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}

	body := decodeEvents(t, rr)
	if len(body.Content) != 1 {
		t.Fatalf("se esperaba 1 fila, se obtuvieron %d", len(body.Content))
	}

	changes, ok := body.Content[0]["changes"].(map[string]any)
	if !ok {
		t.Fatalf("changes deberia ser un objeto JSON, se obtuvo %T", body.Content[0]["changes"])
	}
	title, ok := changes["eventTitle"].(map[string]any)
	if !ok {
		t.Fatalf("eventTitle deberia ser un objeto, se obtuvo %T", changes["eventTitle"])
	}
	if title["previous"] != "A" || title["current"] != "B" {
		t.Fatalf("before/after alterados: %v", title)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica el formato de salida de los campos opcionales: las columnas NULL
// salen como null; event_datetime presente sale como 2006-01-02T15:04:05, sin
// zona; y kafka.topic/partition/offset viajan en la respuesta.
func TestHandleAuditEventsNullsAndFormat(t *testing.T) {
	db, mock, _ := newMock(t)

	rows := sqlmock.NewRows(auditColumns())
	// Fila con todos los opcionales en NULL.
	rows.AddRow(
		int64(1), "m-1", 1, "EVENT_CREATED", int64(7), "Noche de museos",
		nil, nil, nil, nil,
		time.Date(2026, 10, 30, 4, 0, 0, 0, time.UTC), "backend-rest",
		nil, nil, "museum.events", 2, int64(15),
		time.Date(2026, 10, 30, 4, 0, 1, 0, time.UTC),
	)
	// Fila con event_datetime presente.
	addAuditRow(rows, 2, "m-2", nil, nil)
	mock.ExpectQuery("ORDER BY occurred_at, id").WillReturnRows(rows)

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events",
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))
	if rr.Code != http.StatusOK {
		t.Fatalf("se esperaba 200, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}

	body := decodeEvents(t, rr)
	if len(body.Content) != 2 {
		t.Fatalf("se esperaban 2 filas, se obtuvieron %d", len(body.Content))
	}

	first := body.Content[0]
	for _, field := range []string{"eventDateTime", "eventType", "leadCuratorId", "responsibleUserId", "changes"} {
		if value, ok := first[field]; !ok {
			t.Fatalf("falta el campo %s en la respuesta", field)
		} else if value != nil {
			t.Fatalf("%s deberia ser null, se obtuvo %v", field, value)
		}
	}

	second := body.Content[1]
	if got := second["eventDateTime"]; got != "2026-11-15T20:00:00" {
		t.Fatalf("eventDateTime esperado 2026-11-15T20:00:00, se obtuvo %v", got)
	}

	kafkaRef, ok := second["kafka"].(map[string]any)
	if !ok {
		t.Fatalf("kafka deberia ser un objeto, se obtuvo %T", second["kafka"])
	}
	if kafkaRef["topic"] != "museum.events" || kafkaRef["partition"] != float64(2) || kafkaRef["offset"] != float64(15) {
		t.Fatalf("kafka inesperado: %v", kafkaRef)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica que un error de MySQL durante la consulta devuelva 500 con
// application/problem+json, sin filtrar el error interno al cliente.
func TestHandleAuditEventsDBError(t *testing.T) {
	db, mock, _ := newMock(t)
	mock.ExpectQuery("SELECT").WillReturnError(errors.New("mysql caido"))

	rr := doRequest(t, newAuditHandler(db), http.MethodGet, "/api/audit/events",
		"Bearer "+signToken(t, testSecret, testIssuer, "CURADOR", time.Now().Add(time.Hour)))

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("se esperaba 500, se obtuvo %d (%s)", rr.Code, rr.Body.String())
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/problem+json" {
		t.Fatalf("Content-Type esperado application/problem+json, se obtuvo %q", ct)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// -----------------------------------------------------------------------------
// Grupo 4: persistLoop (idempotencia, errores y confirmacion)
// -----------------------------------------------------------------------------

// Verifica el orden persistir -> confirmar: un mensaje valido produce un solo
// INSERT con todos los argumentos esperados, despues un commit, y no toca el
// DLQ. El slice de eventos debe quedar exactamente en insert,commit.
func TestPersistLoopPersistsThenCommits(t *testing.T) {
	db, mock, events := newMock(t)
	msg := validMessage("m-1")
	expectInsert(mock, "m-1", msg).WillReturnResult(sqlmock.NewResult(1, 1))

	committer := &fakeCommitter{events: events}
	writer := &fakeWriter{events: events}
	canceled := false

	persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(msg))

	if got := strings.Join(*events, ","); got != "insert,commit" {
		t.Fatalf("orden esperado insert,commit; se obtuvo %q", got)
	}
	if canceled {
		t.Fatal("no se deberia cancelar el contexto con un mensaje valido")
	}
	if len(writer.messages) != 0 {
		t.Fatalf("el DLQ no deberia recibir mensajes, recibio %d", len(writer.messages))
	}
	if len(committer.messages) != 1 {
		t.Fatalf("se esperaba 1 commit, se obtuvieron %d", len(committer.messages))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica la idempotencia: el SQL incluye ON DUPLICATE KEY UPDATE y una
// reentrega del mismo messageId termina en commit sin ir al DLQ. El mock
// simula la primera insercion (1 fila) y la segunda como duplicada (0 filas).
func TestPersistLoopIsIdempotent(t *testing.T) {
	if !strings.Contains(insertAuditSQL, "ON DUPLICATE KEY UPDATE") {
		t.Fatal("insertAuditSQL debe ignorar duplicados por message_id")
	}

	db, mock, events := newMock(t)
	msg := validMessage("m-1")
	expectInsert(mock, "m-1", msg).WillReturnResult(sqlmock.NewResult(1, 1))
	expectInsert(mock, "m-1", msg).WillReturnResult(sqlmock.NewResult(0, 0))

	committer := &fakeCommitter{events: events}
	writer := &fakeWriter{events: events}
	canceled := false

	persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(msg, msg))

	if got := strings.Join(*events, ","); got != "insert,commit,insert,commit" {
		t.Fatalf("orden esperado insert,commit,insert,commit; se obtuvo %q", got)
	}
	if canceled {
		t.Fatal("un duplicado no deberia cancelar el contexto")
	}
	if len(writer.messages) != 0 {
		t.Fatalf("un duplicado no deberia ir al DLQ, fue %d veces", len(writer.messages))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica que los mensajes que no se pueden procesar no se inserten y vayan
// al DLQ: JSON roto, schemaVersion distinta de 1, messageId vacio, eventId 0 y
// newsType vacio. En todos los casos el DLQ conserva key y value originales,
// agrega x-error, x-original-topic/partition/offset y x-failed-at en RFC3339, y
// despues se confirma el offset (orden dlq,commit).
func TestPersistLoopInvalidMessagesGoToDLQ(t *testing.T) {
	cases := []struct {
		name    string
		payload string
	}{
		{"json roto", `{"schemaVersion":1,`},
		{"schemaVersion no soportada", messagePayload("m-1", 2, "EVENT_UPDATED", 7)},
		{"messageId vacio", messagePayload("", 1, "EVENT_UPDATED", 7)},
		{"eventId cero", messagePayload("m-1", 1, "EVENT_UPDATED", 0)},
		{"newsType vacio", messagePayload("m-1", 1, "", 7)},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, events := newMock(t)
			msg := kafka.Message{
				Topic:     "museum.events",
				Partition: 2,
				Offset:    15,
				Key:       []byte("7"),
				Value:     []byte(tc.payload),
			}

			committer := &fakeCommitter{events: events}
			writer := &fakeWriter{events: events}
			canceled := false

			persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(msg))

			if got := strings.Join(*events, ","); got != "dlq,commit" {
				t.Fatalf("orden esperado dlq,commit; se obtuvo %q", got)
			}
			if canceled {
				t.Fatal("un mensaje invalido no deberia cancelar el contexto")
			}
			if len(writer.messages) != 1 {
				t.Fatalf("se esperaba 1 mensaje en el DLQ, se obtuvieron %d", len(writer.messages))
			}

			dead := writer.messages[0]
			if string(dead.Key) != string(msg.Key) || string(dead.Value) != string(msg.Value) {
				t.Fatal("el DLQ debe conservar key y value originales")
			}

			headers := map[string]string{}
			for _, header := range dead.Headers {
				headers[header.Key] = string(header.Value)
			}
			if headers["x-error"] == "" {
				t.Fatal("falta el header x-error")
			}
			if headers["x-original-topic"] != "museum.events" {
				t.Fatalf("x-original-topic inesperado: %q", headers["x-original-topic"])
			}
			if headers["x-original-partition"] != "2" {
				t.Fatalf("x-original-partition inesperado: %q", headers["x-original-partition"])
			}
			if headers["x-original-offset"] != "15" {
				t.Fatalf("x-original-offset inesperado: %q", headers["x-original-offset"])
			}
			if _, err := time.Parse(time.RFC3339, headers["x-failed-at"]); err != nil {
				t.Fatalf("x-failed-at no es RFC3339: %q", headers["x-failed-at"])
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Verifica el reintento ante un error transitorio de MySQL: el primer INSERT
// falla, el segundo funciona, no se usa el DLQ y hay un solo commit (orden
// insert,insert,commit).
func TestPersistLoopRetriesDBError(t *testing.T) {
	db, mock, events := newMock(t)
	msg := validMessage("m-1")

	mock.ExpectExec("INSERT INTO audit_log").WillReturnError(errors.New("mysql caido"))
	expectInsert(mock, "m-1", msg).WillReturnResult(sqlmock.NewResult(1, 1))

	committer := &fakeCommitter{events: events}
	writer := &fakeWriter{events: events}
	canceled := false

	persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(msg))

	if got := strings.Join(*events, ","); got != "insert,insert,commit" {
		t.Fatalf("orden esperado insert,insert,commit; se obtuvo %q", got)
	}
	if canceled {
		t.Fatal("un error transitorio no deberia cancelar el contexto")
	}
	if len(writer.messages) != 0 {
		t.Fatalf("no deberia ir al DLQ, fue %d veces", len(writer.messages))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica el agujero mas grave: si el DLQ falla, el mensaje no esta en ningun
// lado, asi que no se debe confirmar el offset. Se espera cancel() invocado,
// ningun commit, ningun INSERT y que el mensaje siguiente del canal no se
// procese (persistLoop retorna).
func TestPersistLoopDLQFailureDoesNotCommit(t *testing.T) {
	db, mock, events := newMock(t)

	invalid := kafka.Message{
		Topic:     "museum.events",
		Partition: 2,
		Offset:    15,
		Key:       []byte("7"),
		Value:     []byte(`{"schemaVersion":1,`),
	}
	next := validMessage("m-2")

	committer := &fakeCommitter{events: events}
	writer := &fakeWriter{events: events, err: errors.New("dlq caido")}
	canceled := false

	persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(invalid, next))

	if !canceled {
		t.Fatal("si el DLQ falla se debe cancelar el contexto")
	}
	if got := strings.Join(*events, ","); got != "dlq" {
		t.Fatalf("se esperaba solo dlq, se obtuvo %q", got)
	}
	if len(committer.messages) != 0 {
		t.Fatalf("no se debe confirmar el offset, hubo %d commits", len(committer.messages))
	}
	if strings.Contains(strings.Join(*events, ","), "insert") {
		t.Fatal("no se debe procesar el mensaje siguiente despues de la falla del DLQ")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Verifica la consistencia eventual: 4 entregas (3 messageId distintos y uno
// repetido) producen un INSERT y un commit por entrega, ningun mensaje va al
// DLQ y los message_id insertados son los publicados.
func TestPersistLoopEventualConsistency(t *testing.T) {
	db, mock, events := newMock(t)

	ids := []string{"m-1", "m-2", "m-3", "m-1"} // la ultima es una reentrega
	msgs := make([]kafka.Message, 0, len(ids))
	for _, id := range ids {
		msgs = append(msgs, validMessage(id))
	}
	for i, msg := range msgs {
		expectInsert(mock, ids[i], msg).WillReturnResult(sqlmock.NewResult(1, 1))
	}

	committer := &fakeCommitter{events: events}
	writer := &fakeWriter{events: events}
	canceled := false

	persistLoop(context.Background(), func() { canceled = true }, db, committer, writer, channelOf(msgs...))

	if got := strings.Join(*events, ","); got != "insert,commit,insert,commit,insert,commit,insert,commit" {
		t.Fatalf("orden inesperado: %q", got)
	}
	if canceled {
		t.Fatal("no se deberia cancelar el contexto")
	}
	if len(committer.messages) != len(msgs) {
		t.Fatalf("se esperaban %d commits, se obtuvieron %d", len(msgs), len(committer.messages))
	}
	if len(writer.messages) != 0 {
		t.Fatalf("no deberia ir nada al DLQ, fue %d veces", len(writer.messages))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
