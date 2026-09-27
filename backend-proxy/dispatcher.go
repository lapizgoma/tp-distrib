package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func main() {
	// definición de endpoints
	restTarget, _ := url.Parse("http://localhost:8081")
	gqlTarget, _ := url.Parse("http://localhost:8082")

	// proxies para cada endpoint:
	// 		se encarga de manejar los encabezados HTTP que son "sensibles" a quién los manda.
	restProxy := httputil.NewSingleHostReverseProxy(restTarget)
	gqlProxy := httputil.NewSingleHostReverseProxy(gqlTarget)

	// dispatcher
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/graphql") {
			log.Println("INFO: Routing to GraphQL server")
			gqlProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(r.URL.Path, "/rest") {
			log.Println("INFO: Routing to REST service")
			restProxy.ServeHTTP(w, r)
		} else {
			http.Error(w, "Not Found", http.StatusNotFound)
		}
	})

	log.Println("INFO: Proxy server starting on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
