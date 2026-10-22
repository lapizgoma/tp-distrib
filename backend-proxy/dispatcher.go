package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	// definición de endpoints (configurables por variables de entorno)
	restTarget, _ := url.Parse(getenv("REST_TARGET", "http://localhost:8081"))
	gqlTarget, _ := url.Parse(getenv("GQL_TARGET", "http://localhost:8082"))
	gatewayTarget, _ := url.Parse(getenv("GATEWAY_TARGET", "http://localhost:8090"))

	port := getenv("PORT", "8080")

	// proxies para cada endpoint:
	// 		se encarga de manejar los encabezados HTTP que son "sensibles" a quién los manda.
	restProxy := httputil.NewSingleHostReverseProxy(restTarget)
	gqlProxy := httputil.NewSingleHostReverseProxy(gqlTarget)
	gatewayProxy := httputil.NewSingleHostReverseProxy(gatewayTarget)

	// dispatcher
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/graphql") {
			log.Println("INFO: Routing to GraphQL server")
			gqlProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(r.URL.Path, "/api/rest") {
			log.Println("INFO: Routing to REST service")
			restProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(r.URL.Path, "/api/grpc") {
			log.Println("INFO: Routing to API Gateway ")
			gatewayProxy.ServeHTTP(w, r)
		} else {
			http.Error(w, "Not Found", http.StatusNotFound)
		}
	})

	log.Printf("INFO: Proxy server starting on :%s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
