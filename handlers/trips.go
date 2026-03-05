package handlers

import (
	"github.com/BiryaniJedi/trip-planner/db"
	"github.com/BiryaniJedi/trip-planner/templates"
	"net/http"
)

func Health(w http.ResponseWriter, r *http.Request) {
	if _, err := db.Init(); err != nil {
		w.WriteHeader(500)
		return
	}
	w.WriteHeader(200)
}

func Index(w http.ResponseWriter, r *http.Request) {
	templates.Index().Render(r.Context(), w)
}
