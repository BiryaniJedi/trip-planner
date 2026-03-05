package models

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

type TripType string

const (
	TripTypeTravel   TripType = "travel"
	TripTypeFestival TripType = "festival"
	TripTypeRoadtrip TripType = "roadtrip"
	TripTypeOther    TripType = "other"
)

type Trip struct {
	ID          int64
	Name        string
	Destination string
	StartDate   string // store as "YYYY-MM-DD" string, simpler than time.Time with SQLite
	EndDate     string
	TripType    TripType
}

type TripInput struct {
	Name        string
	Destination string
	StartDate   string // store as "YYYY-MM-DD" string, simpler than time.Time with SQLite
	EndDate     string
	TripType    TripType
}

type TripsService struct {
	db *sql.DB
}

func NewTripsService(database *sql.DB) *TripsService {
	return &TripsService{database}
}

// GetAllTrips returns all trips ordered by start_date descending
func (s *TripsService) GetAllTrips() ([]Trip, error) {
	rows, err := s.db.Query(`SELECT * FROM trips`)
	if err != nil {
		return nil, fmt.Errorf("Error querying for trips: %w", err)
	}
	defer rows.Close()

	var trips []Trip
	var tempTrip Trip
	for rows.Next() {
		err := rows.Scan(
			&tempTrip.ID,
			&tempTrip.Name,
			&tempTrip.Destination,
			&tempTrip.StartDate,
			&tempTrip.EndDate,
			&tempTrip.TripType,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		trips = append(trips, tempTrip)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for trips list: %w", err)
	}

	return trips, nil
}

// GetTripByID returns a single trip or an error if not found
func (s *TripsService) GetTripByID(id int64) (Trip, error) {
	query := `
		SELECT
			t.id,
			t.name,
			t.destination,
			t.start_date,
			t.end_date,
			t.trip_type
		FROM trips t 
		WHERE t.id = ?
	`

	var trip Trip
	err := s.db.QueryRow(query, id).Scan(
		&trip.ID,
		&trip.Name,
		&trip.Destination,
		&trip.StartDate,
		&trip.EndDate,
		&trip.TripType,
	)
	if err != nil {
		return Trip{}, fmt.Errorf("Error scanning row; %w", err)
	}
	return trip, nil
}

// CreateTrip inserts a new trip and returns the created trip's ID
func (s *TripsService) CreateTrip(t TripInput) (int64, error) {
	query := `
	INSERT INTO trips (
		name,
		destination,
		start_date,
		end_date,
		trip_type
	)
	VALUES (?, ?, ?, ?, ?)
	RETURNING id
	`

	var resId int64
	err := s.db.QueryRow(query,
		t.Name,
		t.Destination,
		t.StartDate,
		t.EndDate,
		t.TripType,
	).Scan(
		&resId,
	)
	if err != nil {
		return 0, fmt.Errorf("Create trip query error: %w", err)
	}

	return resId, nil
}

// UpdateTrip updates name, destination, dates, notes, type
func (s *TripsService) UpdateTrip(t Trip) error { return nil }

// DeleteTrip deletes a trip and all its expenses (CASCADE handles expenses)
func (s *TripsService) DeleteTrip(id int64) error { return nil }
