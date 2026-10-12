package main

import (
	"log"
	"net/http"
	"os"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/joho/godotenv"
)

const graphqlPath = "/api/graphql"

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("INFO: no se encontró .env, se usan las variables del sistema")
	}
	initDB()

	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET debe tener al menos 32 caracteres y ser igual al de Spring")
	}
	issuer := os.Getenv("JWT_ISSUER")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

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

	graphqlHandler := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: false,
	})

	http.Handle(graphqlPath, AuthMiddleware([]byte(secret), issuer, graphqlHandler))

	log.Printf("INFO: Servidor GraphQL corriendo en http://localhost:%s%s", port, graphqlPath)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
