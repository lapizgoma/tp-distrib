package main

import (
	"log"
	"net/http"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

func main() {
	initDB()
	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query: reportQuery,
	})

	if err != nil {
		log.Fatalf("Error al crear esquema: %v", err)
	}

	reportHandler := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	http.Handle("/graphql/report", reportHandler)

	log.Println("INFO: Servidor GraphQL corriendo en http://localhost:8082/graphql")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
