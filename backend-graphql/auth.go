package main

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const userKey ctxKey = "user"

// Errores que los resolvers devuelven para indicar por qué se rechazó la operación.
var (
	ErrUnauthenticated = errors.New("autenticación requerida")
	ErrForbidden       = errors.New("no tenés permisos para esta operación")
)

// Datos del usuario que vienen dentro del token.
type User struct {
	ID       int64
	Username string
	Role     string
}

// AuthMiddleware es el "guardia": valida el token antes de dejar pasar la request.
func AuthMiddleware(secret []byte, issuer string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		// ¿no todos los handler requieren un token de autorización?
		if header == "" {
			next.ServeHTTP(w, r)
			return
		}
		if !strings.HasPrefix(header, "Bearer ") {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		token, err := jwt.Parse(tokenStr,
			func(t *jwt.Token) (interface{}, error) { return secret, nil },
			jwt.WithValidMethods([]string{"HS256", "HS384", "HS512"}),
			jwt.WithIssuer(issuer),
			jwt.WithExpirationRequired(),
		)
		if err != nil || !token.Valid {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeProblem(w, r, http.StatusUnauthorized, "Token inválido o vencido")
			return
		}

		username, _ := claims["sub"].(string)
		role, _ := claims["role"].(string)
		id, _ := claims["userId"].(float64)

		user := User{ID: int64(id), Username: username, Role: role}
		ctx := context.WithValue(r.Context(), userKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Para leer el usuario desde un resolver
func UserFromContext(ctx context.Context) (User, bool) {
	u, ok := ctx.Value(userKey).(User)
	return u, ok
}
