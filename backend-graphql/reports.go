package main

import "github.com/graphql-go/graphql"

/*
 * ENUMS
 */
var statusEnum = graphql.NewEnum(graphql.EnumConfig{
	Name: "EventStatus",
	Values: graphql.EnumValueConfigMap{
		"ENDED":    {Value: "finished"},
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
 * QUERIES
 */
var rootQuery = graphql.NewObject(graphql.ObjectConfig{
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
				return fetchReportData(p.Args)
			},
		},
	},
})

func fetchReportData(args map[string]interface{}) ([]GroupResult, error) {
	return mockFetchReportData(), nil
}

func mockFetchReportData() []GroupResult {
	return []GroupResult{
		{
			GroupName:         "enero",
			EventCount:        150,
			TotalRegistrants:  12000,
			AverageAttendance: 80.5,
			TopEvents: []Event{
				{ID: "1", Name: "Mockevento 1", Registrants: 500},
				{ID: "2", Name: "Mockevento 2", Registrants: 200},
			},
			SubGroups: []*GroupResult{
				{
					GroupName:         "TIPO 1",
					EventCount:        80,
					TotalRegistrants:  6000,
					AverageAttendance: 75.2,
					TopEvents: []Event{
						{ID: "1", Name: "Mockevento 1", Registrants: 1000},
					},
				},
				{
					GroupName:         "TIPO 2",
					EventCount:        70,
					TotalRegistrants:  6000,
					AverageAttendance: 85.8,
					TopEvents: []Event{
						{ID: "2", Name: "Mockevento 2", Registrants: 1000},
					},
				},
			},
		},
	}
}
