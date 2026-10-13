package main

import (
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/gqlerrors"
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
		FormatErrorFn: func(err error) gqlerrors.FormattedError {
			formatted := gqlerrors.FormatError(err)
			code := "INTERNAL_ERROR"
			switch {
			case errors.Is(err, ErrUnauthenticated):
				code = "UNAUTHENTICATED"
			case errors.Is(err, ErrForbidden):
				code = "FORBIDDEN"
			}
			formatted.Extensions = map[string]interface{}{"code": code}
			return formatted
		},
	})

	http.Handle(graphqlPath, AuthMiddleware([]byte(secret), issuer, graphqlHandler))

	log.Printf("INFO: Servidor GraphQL corriendo en http://localhost:%s%s", port, graphqlPath)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
