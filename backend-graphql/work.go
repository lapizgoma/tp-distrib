package main

import "github.com/graphql-go/graphql"

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
	Availability bool      `json:"availability"`
	Comments     []Comment `json:"comments"`
}

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
		"availability":  &graphql.Field{Type: graphql.Boolean},
		"comments":      &graphql.Field{Type: graphql.NewList(commentType)},
	},
})
