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
	Description: "Estado temporal de un evento respecto al momento actual, usado para " +
		"filtrar el informe de asistencia.",
	Values: graphql.EnumValueConfigMap{
		"ENDED": {
			Value:       "ended",
			Description: "Eventos cuyo 'datetime + duration' ya pasó respecto al momento actual.",
		},
		"UPCOMING": {
			Value:       "upcoming",
			Description: "Eventos cuyo 'datetime' todavía no llegó.",
		},
		"ALL": {
			Value:       "all",
			Description: "No filtra por estado: incluye tanto eventos finalizados como próximos. Valor por defecto.",
		},
	},
})

var groupByEnum = graphql.NewEnum(graphql.EnumConfig{
	Name: "GroupBy",
	Description: "Dimensión por la que se puede agrupar el informe de asistencia. Se puede " +
		"combinar más de un valor en una misma consulta.",
	Values: graphql.EnumValueConfigMap{
		"MONTH": {
			Value: "month",
			Description: "Agrupa por mes calendario (1 a 12), sin distinguir el año; eventos " +
				"de distintos años en el mismo mes caen en el mismo grupo.",
		},
		"TYPE": {
			Value:       "type",
			Description: "Agrupa por 'event_type'.",
		},
	},
})

/*
 * GRAPHQL TYPES
 */
var eventType = graphql.NewObject(graphql.ObjectConfig{
	Name:        "Event",
	Description: "Un evento individual dentro de un grupo del informe",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type:        graphql.String,
			Description: "Identificador único del evento.",
		},
		"name": &graphql.Field{
			Type:        graphql.String,
			Description: "Título del evento.",
		},
		"registrants": &graphql.Field{
			Type:        graphql.Int,
			Description: "Cantidad de inscriptos al evento.",
		},
	},
})

type Event struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Registrants int    `json:"registrants"`
}

var groupResultType = graphql.NewObject(graphql.ObjectConfig{
	Name:        "GroupResult",
	Description: "Un grupo del informe de asistencia.",
	Fields: graphql.Fields{
		"groupName": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.String),
			Description: "Etiqueta del grupo: nombre del mes (ej. \"March\") si se agrupó por MONTH.",
		},
		"eventCount": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Int),
			Description: "Cantidad de eventos que caen en este grupo, luego de aplicar los filtros de fecha, tipo y estado.",
		},
		"totalRegistrants": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Int),
			Description: "Suma de inscriptos acumulados de todos los eventos del grupo.",
		},
		"averageAttendance": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Float),
			Description: "Promedio de inscriptos por evento dentro del grupo (total de inscriptos / cantidad de eventos).",
		},
		"topEvents": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(eventType))),
			Description: "Los eventos más populares del grupo según cantidad de inscriptos, en orden descendente.",
		},
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
		Type:        graphql.NewList(groupResultType),
		Description: "Segunda agrupación. 'null' si no hay segunda agrupación.",
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
			Description: "Informe de eventos del museo en base a la popularidad por participación de los mismos." +
				"Restringido a los roles CURADOR y ADMINISTRADOR.",
			Args: graphql.FieldConfigArgument{
				"startDate": &graphql.ArgumentConfig{
					Type: graphql.String,
					Description: "Fecha de inicio del rango a consultar, en formato YYYY-MM-DD " +
						"(ej. \"2026-01-31\"). Es inclusiva: se incluyen los eventos con " +
						"'datetime' igual o posterior a esta fecha. Si se omite, no hay límite inferior.",
				},
				"endDate": &graphql.ArgumentConfig{
					Type: graphql.String,
					Description: "Fecha de fin del rango a consultar, en formato YYYY-MM-DD " +
						"(ej. \"2026-02-28\"). Es exclusiva: se incluyen los eventos con " +
						"'datetime' estrictamente anterior a esta fecha. Si se omite, no hay límite superior.",
				},
				"type": &graphql.ArgumentConfig{
					Type: graphql.String,
					Description: "Filtra por un tipo de evento específico (ej. \"Visita Guiada\", " +
						"\"Taller\"). Si se omite, se incluyen todos los tipos. No tiene efecto sobre el criterio de agrupación.",
				},
				"status": &graphql.ArgumentConfig{
					Type: statusEnum,
					Description: "Filtra los eventos según si ya ocurrieron (ENDED), están por " +
						"ocurrir (UPCOMING), o no se filtra por estado (ALL, valor por defecto). " +
						"Un evento se considera pasado cuando 'datetime + duration' es anterior " +
						"al momento actual.",
					DefaultValue: "all",
				},
				"groupBy": &graphql.ArgumentConfig{
					Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(groupByEnum))),
					Description: "Dimensión o dimensiones por las que agrupar el informe: MONTH " +
						"(mes calendario, del 1 al 12, sin distinguir año), TYPE (tipo de evento), " +
						"o ambos. Si se especifican ambos, el resultado se agrupa primero por mes " +
						"y cada grupo mensual contiene, en 'subGroups', el desglose por tipo dentro de ese mes.",
				},
				"topN": &graphql.ArgumentConfig{
					Type: graphql.Int,
					Description: "Cantidad máxima de eventos a incluir en 'topEvents' dentro de " +
						"cada grupo, ordenados por cantidad de inscriptos en forma descendente. " +
						"Valor por defecto: 3.",
					DefaultValue: 3,
				},
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
