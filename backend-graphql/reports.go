package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"sort"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/graphql-go/graphql"
)

/*
 * ENUMS
 */
var statusEnum = graphql.NewEnum(graphql.EnumConfig{
	Name: "EventStatus",
	Values: graphql.EnumValueConfigMap{
		"ENDED":    {Value: "ended"},
		"UPCOMING": {Value: "upcoming"},
		"ALL":      {Value: "all"},
	},
})

var groupByEnum = graphql.NewEnum(graphql.EnumConfig{
	Name: "GroupBy",
	Values: graphql.EnumValueConfigMap{
		"MONTH": {Value: "month"},
		"TYPE":  {Value: "type"},
	},
})

/*
 * GRAPHQL TYPES
 */
var eventType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Event",
	Fields: graphql.Fields{
		"id":          &graphql.Field{Type: graphql.String},
		"name":        &graphql.Field{Type: graphql.String},
		"registrants": &graphql.Field{Type: graphql.Int},
	},
})

type Event struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Registrants int    `json:"registrants"`
}

var groupResultType = graphql.NewObject(graphql.ObjectConfig{
	Name: "GroupResult",
	Fields: graphql.Fields{
		"groupName":         &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"eventCount":        &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"totalRegistrants":  &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"averageAttendance": &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
		"topEvents":         &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(eventType)))},
	},
})

type GroupResult struct {
	GroupName         string         `json:"groupName"`
	EventCount        int            `json:"eventCount"`
	TotalRegistrants  int            `json:"totalRegistrants"`
	AverageAttendance float64        `json:"averageAttendance"`
	TopEvents         []Event        `json:"topEvents"`
	SubGroups         []*GroupResult `json:"subGroups"`
}

func init() {
	groupResultType.AddFieldConfig("subGroups", &graphql.Field{
		Type: graphql.NewList(groupResultType),
	})
}

/*
 * GRAPHQL QUERIES
 */
var reportQuery = graphql.NewObject(graphql.ObjectConfig{
	Name: "AttendanceReportQuery",
	Fields: graphql.Fields{
		"attendanceReport": &graphql.Field{
			Type: graphql.NewList(groupResultType),
			Args: graphql.FieldConfigArgument{
				"startDate": &graphql.ArgumentConfig{Type: graphql.String},
				"endDate":   &graphql.ArgumentConfig{Type: graphql.String},
				"type":      &graphql.ArgumentConfig{Type: graphql.String},
				"status":    &graphql.ArgumentConfig{Type: statusEnum, DefaultValue: "all"},
				"groupBy": &graphql.ArgumentConfig{
					Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(groupByEnum))),
				},
				"topN": &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 3},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				rows, err := fetchReportDataFromDatabase(p.Context, p.Args)
				if err != nil {
					return nil, err
				}

				var byMonth, byType bool
				for _, g := range p.Args["groupBy"].([]interface{}) {
					switch g.(string) {
					case "month":
						byMonth = true
					case "type":
						byType = true
					}
				}

				topN := 3
				if n, ok := p.Args["topN"].(int); ok {
					topN = n
				}

				return buildReport(rows, byMonth, byType, topN), nil
			},
		},
	},
})

// SQL

var db *sql.DB

func initDB() {
	cfg := mysql.NewConfig()
	cfg.User = os.Getenv("TP_DISTRIB_DB_USERNAME")
	cfg.Passwd = os.Getenv("TP_DISTRIB_DB_PASSWORD")
	cfg.Net = "tcp"
	cfg.Addr = os.Getenv("TP_DISTRIB_DB_ADDR")
	cfg.DBName = os.Getenv("TP_DISTRIB_DB_NAME")

	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatalf("error al abrir la base de datos: %v", err)
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("error al conectar la base de datos: %v", err)
	}
}

type EventRow struct {
	ID          string
	Title       string
	EventType   string
	Month       int
	Registrants int
}

func fetchReportDataFromDatabase(ctx context.Context, args map[string]interface{}) ([]EventRow, error) {
	// NOTA: Fo usa esta fecha para referirse al formato YYYY-MM-DD
	const dateFormat = "2006-01-02"
	startDate, _ := args["startDate"].(string)
	if startDate != "" {
		if _, err := time.Parse(dateFormat, startDate); err != nil {
			return nil, fmt.Errorf("'startDate' tiene que tener el formato YYYY-MM-DD: %w", err)
		}
	}

	endDate, _ := args["endDate"].(string)
	if endDate != "" {
		if _, err := time.Parse(dateFormat, endDate); err != nil {
			return nil, fmt.Errorf("'endDate' tiene que tener el formato YYYY-MM-DD: %w", err)
		}
	}
	eventType, _ := args["type"].(string)
	status, _ := args["status"].(string)

	// armado de query
	// es un agregado entre la tabla eventos y la suma de los inscriptos a ese evento.
	query := `
		SELECT
		    e.id,
		    e.title,
		    e.event_type,
		    MONTH(e.datetime) AS event_month,
		    COUNT(er.user_id) AS registrants
		FROM events e
		LEFT JOIN events_registrations er ON er.event_id = e.id
		WHERE 1 = 1` /* NOTA: es necesaria esta obviedad porque lo demás se añade con un "AND" */

	var queryArgs []interface{}

	if startDate != "" {
		query += " AND e.datetime >= ?"
		queryArgs = append(queryArgs, startDate)
	}
	if endDate != "" {
		query += " AND e.datetime < ?"
		queryArgs = append(queryArgs, endDate)
	}
	if eventType != "" {
		query += " AND e.event_type = ?"
		queryArgs = append(queryArgs, eventType)
	}

	if status != "all" {
		switch status {
		case "ended":
			// NOTA: acá se suma la duración a la fecha de comienzo para ver si un evento realmente está terminado al momento de consultarlo.
			query += " AND DATE_ADD(e.datetime, INTERVAL COALESCE(e.duration, 0) MINUTE) < NOW()"
		case "upcoming":
			query += " AND e.datetime >= NOW()"
		default:
			return nil, fmt.Errorf("el 'status' es inválido: %s", status)
		}
	}

	query += `
		GROUP BY e.id, e.title, e.event_type, e.datetime
		ORDER BY event_month, e.event_type`

	// llamada a la base de datos
	rows, err := db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("falló la query: %w", err)
	}
	defer rows.Close()

	// procesamiento de filas devueltas
	var results []EventRow
	for rows.Next() {
		var r EventRow
		if err := rows.Scan(&r.ID, &r.Title, &r.EventType, &r.Month, &r.Registrants); err != nil {
			return nil, fmt.Errorf("falló el escaneo de filas: %w", err)
		}
		results = append(results, r)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("falló la iteración por filas: %w", err)
	}

	return results, nil
}

func aggregate(rows []EventRow, groupName string, topN int) *GroupResult {
	total := 0
	for _, r := range rows {
		total += r.Registrants
	}

	// ordena por registrados
	sorted := make([]EventRow, len(rows))
	copy(sorted, rows)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Registrants > sorted[j].Registrants })

	// selección del top N eventos
	n := min(topN, len(sorted))
	top := make([]Event, n)
	for i := range n {
		top[i] = Event{ID: sorted[i].ID, Name: sorted[i].Title, Registrants: sorted[i].Registrants}
	}

	avg := 0.0
	if len(rows) > 0 {
		avg = float64(total) / float64(len(rows))
	}

	return &GroupResult{
		GroupName:         groupName,
		EventCount:        len(rows),
		TotalRegistrants:  total,
		AverageAttendance: avg,
		TopEvents:         top,
	}
}

func groupByType(rows []EventRow, topN int) []*GroupResult {
	byType := make(map[string][]EventRow)
	for _, r := range rows {
		byType[r.EventType] = append(byType[r.EventType], r)
	}

	// ordena los tipos alfabéticamente
	types := make([]string, 0, len(byType))
	for t := range byType {
		types = append(types, t)
	}
	sort.Strings(types)

	results := make([]*GroupResult, 0, len(types))
	for _, t := range types {
		results = append(results, aggregate(byType[t], t, topN))
	}
	return results
}

func buildReport(rows []EventRow, byMonth, byType bool, topN int) []*GroupResult {
	if !byMonth && !byType {
		return nil
		// return []*GroupResult{aggregate(rows, "All", topN)}
	}

	if byType && !byMonth {
		return groupByType(rows, topN)
	}

	// agrupa los registros por mes y los ordena (de enero: 1 a diciembre: 12)
	byMonthMap := make(map[int][]EventRow)
	for _, r := range rows {
		byMonthMap[r.Month] = append(byMonthMap[r.Month], r)
	}
	months := make([]int, 0, len(byMonthMap))
	for m := range byMonthMap {
		months = append(months, m)
	}
	sort.Ints(months)

	// hace el agregado por cada mes
	results := make([]*GroupResult, 0, len(months))
	for _, m := range months {
		monthRows := byMonthMap[m]
		group := aggregate(monthRows, time.Month(m).String(), topN)
		if byType {
			group.SubGroups = groupByType(monthRows, topN)
		}
		results = append(results, group)
	}
	return results
}
