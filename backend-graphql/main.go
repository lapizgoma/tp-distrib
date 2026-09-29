package main

import (
	"log"
	"net/http"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("INFO: no se encontró .env, se usan las variables del sistema")
	}
	initDB()
	rootQuery := graphql.NewObject(graphql.ObjectConfig{
		Name: "RootQuery",
		Fields: graphql.Fields{
			"works":  worksField,
			"report": reportField,
		},
	})

	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query: rootQuery,
	})

	if err != nil {
		log.Fatalf("Error al crear esquema: %v", err)
	}

	handler := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	http.Handle("/graphql", handler)

	log.Println("INFO: Servidor GraphQL corriendo en http://localhost:8082/graphql")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
