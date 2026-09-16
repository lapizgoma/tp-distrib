package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
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
		switch r.URL.Path {
		case "/graphql":
			log.Println("INFO: Routing to GraphQL server")
			gqlProxy.ServeHTTP(w, r)
		case "/rest":
			log.Println("INFO: Routing to REST service")
			restProxy.ServeHTTP(w, r)
		default:
			http.Error(w, "Not Found", http.StatusNotFound)
		}
	})


	log.Println("INFO: Proxy server starting on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
