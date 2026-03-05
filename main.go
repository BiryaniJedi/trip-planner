package main

import (
	"github.com/BiryaniJedi/trip-planner/db"
	"github.com/BiryaniJedi/trip-planner/handlers"
	"log"
	"net/http"
)

const PORT = ":8080"

func main() {

	if _, err := db.Init(); err != nil {
		log.Fatalf("failed to init database: %v", err)
	}

	mux := http.NewServeMux()

	// TODO: register routes (you'll fill these in as you build handlers)
	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("GET /", handlers.Index)

	log.Printf("starting server on http://localhost%s", PORT)

	// TODO (Module 6): auto-open browser
	if err := http.ListenAndServe(PORT, mux); err != nil {
		log.Fatal(err)
	}
}
