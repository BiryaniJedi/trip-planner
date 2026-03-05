package main

import (
	"context"
	"database/sql"

	"github.com/BiryaniJedi/trip-planner/models"
)

type App struct {
	ctx          context.Context
	tripsService *models.TripsService
}

func NewApp(db *sql.DB) *App {
	return &App{
		tripsService: models.NewTripsService(db),
	}
}

func (this *App) startup(ctx context.Context) {
	this.ctx = ctx
}

// Ping proves the Go↔React bridge is working.
func (a *App) Ping() string {
	return "pong"
}

func (a *App) GetAllTrips() ([]models.Trip, error) {
	return a.tripsService.GetAllTrips()
}

func (a *App) GetTripByID(id int64) (models.Trip, error) {
	return a.tripsService.GetTripByID(id)
}

func (a *App) CreateTrip(input models.TripInput) (int64, error) {
	return a.tripsService.CreateTrip(input)
}

func (a *App) UpdateTripById(id int64, tripInput models.TripInput) (int64, error) {
	return a.tripsService.UpdateTripById(id, tripInput)
}

func (a *App) DeleteTripById(id int64) error {
	return a.tripsService.DeleteTripById(id)
}
