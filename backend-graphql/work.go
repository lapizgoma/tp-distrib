package main

import (
	"strings"

	"github.com/graphql-go/graphql"
)

// ---------- Go structs (in-memory data) ----------

type Artist struct {
	Name      string `json:"name"`
	Biography string `json:"biography"`
}

type Comment struct {
	User string `json:"user"`
	Text string `json:"text"`
	Date string `json:"date"`
}

type Work struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Artist       Artist    `json:"artist"`
	ImageURL     string    `json:"image_url"`
	CreationYear int       `json:"creation_year"`
	Technique    string    `json:"technique"`
	Dimensions   string    `json:"dimensions"`
	Era          string    `json:"era"`
	Description  string    `json:"description"`
	Location     string    `json:"location"`
	Availability string    `json:"availability"`
	Comments     []Comment `json:"comments"`
}

var availabilityEnum = graphql.NewEnum(graphql.EnumConfig{
	Name: "Availability",
	Values: graphql.EnumValueConfigMap{
		"EN_EXHIBICION": &graphql.EnumValueConfig{Value: "EN_EXHIBICION"},
		"EN_DEPOSITO":   &graphql.EnumValueConfig{Value: "EN_DEPOSITO"},
	},
})

var artistType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Artist",
	Fields: graphql.Fields{
		"name":      &graphql.Field{Type: graphql.String},
		"biography": &graphql.Field{Type: graphql.String},
	},
})

var commentType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Comment",
	Fields: graphql.Fields{
		"user": &graphql.Field{Type: graphql.String},
		"text": &graphql.Field{Type: graphql.String},
		"date": &graphql.Field{Type: graphql.String},
	},
})

var workType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Work",
	Fields: graphql.Fields{
		"id":            &graphql.Field{Type: graphql.ID},
		"title":         &graphql.Field{Type: graphql.String},
		"artist":        &graphql.Field{Type: artistType},
		"image_url":     &graphql.Field{Type: graphql.String},
		"creation_year": &graphql.Field{Type: graphql.Int},
		"technique":     &graphql.Field{Type: graphql.String},
		"dimensions":    &graphql.Field{Type: graphql.String},
		"era":           &graphql.Field{Type: graphql.String},
		"description":   &graphql.Field{Type: graphql.String},
		"location":      &graphql.Field{Type: graphql.String},
		"availability":  &graphql.Field{Type: availabilityEnum},
		"comments":      &graphql.Field{Type: graphql.NewList(commentType)},
	},
})

// ---------- Query: works (with optional filters) ----------

var worksField = &graphql.Field{
	Type: graphql.NewList(workType),
	Args: graphql.FieldConfigArgument{
		"keyword":      &graphql.ArgumentConfig{Type: graphql.String},
		"era":          &graphql.ArgumentConfig{Type: graphql.String},
		"technique":    &graphql.ArgumentConfig{Type: graphql.String},
		"location":     &graphql.ArgumentConfig{Type: graphql.String},
		"availability": &graphql.ArgumentConfig{Type: availabilityEnum},
	},
	Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		return filterWorks(worksSampleData, p.Args), nil
	},
}

func filterWorks(works []Work, args map[string]interface{}) []Work {
	var result []Work

	keyword, hasKeyword := args["keyword"].(string)
	era, hasEra := args["era"].(string)
	technique, hasTechnique := args["technique"].(string)
	location, hasLocation := args["location"].(string)
	availability, hasAvailability := args["availability"].(string)

	for _, w := range works {
		if hasKeyword && !matchesKeyword(w, keyword) {
			continue
		}
		if hasEra && !strings.EqualFold(w.Era, era) {
			continue
		}
		if hasTechnique && !strings.EqualFold(w.Technique, technique) {
			continue
		}
		if hasLocation && !strings.EqualFold(w.Location, location) {
			continue
		}
		if hasAvailability && w.Availability != availability {
			continue
		}
		result = append(result, w)
	}

	return result
}

func matchesKeyword(w Work, keyword string) bool {
	k := strings.ToLower(keyword)
	return strings.Contains(strings.ToLower(w.Title), k) ||
		strings.Contains(strings.ToLower(w.Description), k) ||
		strings.Contains(strings.ToLower(w.Artist.Name), k)
}
