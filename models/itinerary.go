package models

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

// CREATE TABLE IF NOT EXISTS itineraries (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   trip_id INTEGER NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
//   date TEXT NOT NULL,
//   time TEXT NOT NULL,
//   title TEXT NOT NULL,
//   description TEXT NOT NULL DEFAULT '',
// )

type Itinerary struct {
	ID     int64 `json:"id"`
	TripID int64 `json:"trip_id"`

	// YYYY-MM-DD
	Date string `json:"date"`

	// HH:MM:SS
	Time        string `json:"time"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type ItineraryInput struct {
	// YYYY-MM-DD
	Date string `json:"date"`

	// HH:MM:SS
	Time        string `json:"time"`
	Title       string `json:"title"`
	Description string `json:"description"`
}
type ItinerariesService struct {
	db *sql.DB
}

func NewItinerariesService(database *sql.DB) *ItinerariesService {
	return &ItinerariesService{database}
}
func (s *ItinerariesService) GetItinerariesByTripId(tripId int64) ([]Itinerary, error) {
	query := `
		SELECT 
			i.id,
			i.trip_id,
			i.date,
			i.time,
			i.title,
			i.description
		FROM itineraries i
		WHERE i.trip_id = ?
		ORDER BY i.date, i.time
	`
	rows, err := s.db.Query(query, tripId)
	if err != nil {
		return nil, fmt.Errorf("Error querying all itineraries for trip: %w", err)
	}
	defer rows.Close()

	var itineraries []Itinerary
	var tempItinerary Itinerary
	for rows.Next() {
		err := rows.Scan(
			&tempItinerary.ID,
			&tempItinerary.TripID,
			&tempItinerary.Date,
			&tempItinerary.Time,
			&tempItinerary.Title,
			&tempItinerary.Description,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		itineraries = append(itineraries, tempItinerary)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for itineraries list: %w", err)
	}

	return itineraries, nil
}

func (s *ItinerariesService) GetItineraryById(itineraryId int64) (Itinerary, error) {
	query := `
		SELECT 
			i.id,
			i.trip_id,
			i.date,
			i.time,
			i.title,
			i.description
		FROM itineraries i
		WHERE i.id = ?
	`

	var itinerary Itinerary
	err := s.db.QueryRow(query, itineraryId).Scan(
		&itinerary.ID,
		&itinerary.TripID,
		&itinerary.Date,
		&itinerary.Time,
		&itinerary.Title,
		&itinerary.Description,
	)
	if err != nil {
		return Itinerary{}, fmt.Errorf("Error scanning row: %w", err)
	}

	return itinerary, nil
}

func (s *ItinerariesService) CreateItineraryByTripId(tripId int64, itineraryInput ItineraryInput) (int64, error) {
	query := `
		INSERT INTO itineraries (
			trip_id,
			date,
			time,
			title,
			description
		)
		VALUES (?, ?, ?, ?, ?)
		RETURNING id
	`

	var resId int64
	err := s.db.QueryRow(query,
		tripId,
		itineraryInput.Date,
		itineraryInput.Time,
		itineraryInput.Title,
		itineraryInput.Description,
	).Scan(
		&resId,
	)
	if err != nil {
		return 0, fmt.Errorf("Create itinerary query error: %w", err)
	}

	return resId, nil
}

func (s *ItinerariesService) UpdateItineraryById(itineraryId int64, itineraryInput ItineraryInput) error {
	query := `
		UPDATE itineraries
		SET date = ?,
			time = ?,
			title = ?,
			description = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		itineraryInput.Date,
		itineraryInput.Time,
		itineraryInput.Title,
		itineraryInput.Description,
		itineraryId,
	)
	if err != nil {
		return fmt.Errorf("Update itinerary query error: %w", err)
	}

	return nil
}

func (s *ItinerariesService) DeleteItineraryById(itineraryId int64) error {
	_, err := s.db.Exec(`DELETE FROM itineraries WHERE id = ?`, itineraryId)
	if err != nil {
		return fmt.Errorf("Delete itinerary query error: %w", err)
	}
	return nil
}
