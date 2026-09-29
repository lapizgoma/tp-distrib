package main

import (
	"log"
	"net/http"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

func main() {
	initDB()
	rootQuery := graphql.NewObject(graphql.ObjectConfig{
		Name: "RootQuery",
		Fields: graphql.Fields{
			"works":  worksField,
			"report": reportField,
		},
	})

	// 2. Creamos el esquema asignando el rootQuery
	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query: rootQuery,
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
