package models

import (
	"errors"
	"database/sql"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

// itinerarySetup holds both services and a pre-created trip ID.
type itinerarySetup struct {
	trips       *TripsService
	itineraries *ItinerariesService
	tripID      int64
}

// newItinerarySetup opens a fresh in-memory DB, migrates it, and pre-creates one trip.
func newItinerarySetup(t *testing.T) itinerarySetup {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	trips := NewTripsService(database)
	itineraries := NewItinerariesService(database)

	tripID, err := trips.CreateTrip(TripInput{
		Name:        "Test Trip",
		Destination: "Anywhere",
		TripType:    TripTypeTravel,
	})
	if err != nil {
		t.Fatalf("setup CreateTrip: %v", err)
	}

	return itinerarySetup{trips: trips, itineraries: itineraries, tripID: tripID}
}

// sampleItinerary returns a fully-populated ItineraryInput for reuse.
func sampleItinerary() ItineraryInput {
	return ItineraryInput{
		Date:        "2025-07-14",
		Time:        "10:00",
		Title:       "Coffee at local café",
		Description: "Try the almond croissant",
	}
}

// --- CreateItineraryByTripId ---

func TestCreateItinerary_returnsID(t *testing.T) {
	s := newItinerarySetup(t)

	id, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestCreateItinerary_fieldsRoundTrip(t *testing.T) {
	s := newItinerarySetup(t)
	in := sampleItinerary()

	id, err := s.itineraries.CreateItineraryByTripId(s.tripID, in)
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}

	got, err := s.itineraries.GetItineraryById(id)
	if err != nil {
		t.Fatalf("GetItineraryById: %v", err)
	}

	if got.TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got.TripID, s.tripID)
	}
	if got.Date != in.Date {
		t.Errorf("Date: got %q, want %q", got.Date, in.Date)
	}
	if got.Time != in.Time {
		t.Errorf("Time: got %q, want %q", got.Time, in.Time)
	}
	if got.Title != in.Title {
		t.Errorf("Title: got %q, want %q", got.Title, in.Title)
	}
	if got.Description != in.Description {
		t.Errorf("Description: got %q, want %q", got.Description, in.Description)
	}
}

func TestCreateItinerary_idsAreUnique(t *testing.T) {
	s := newItinerarySetup(t)

	id1, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("first CreateItineraryByTripId: %v", err)
	}
	id2, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("second CreateItineraryByTripId: %v", err)
	}
	if id1 == id2 {
		t.Errorf("expected unique IDs, both got %d", id1)
	}
}

// --- GetItinerariesByTripId ---

func TestGetItinerariesByTripId_empty(t *testing.T) {
	s := newItinerarySetup(t)

	events, err := s.itineraries.GetItinerariesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetItinerariesByTripId: %v", err)
	}
	if len(events) != 0 {
		t.Errorf("expected 0 events, got %d", len(events))
	}
}

func TestGetItinerariesByTripId_returnsAll(t *testing.T) {
	s := newItinerarySetup(t)

	inputs := []ItineraryInput{
		{Date: "2025-07-14", Time: "09:00", Title: "Breakfast"},
		{Date: "2025-07-14", Time: "14:00", Title: "Museum"},
		{Date: "2025-07-15", Time: "08:00", Title: "Departure"},
	}
	for _, in := range inputs {
		if _, err := s.itineraries.CreateItineraryByTripId(s.tripID, in); err != nil {
			t.Fatalf("CreateItineraryByTripId %q: %v", in.Title, err)
		}
	}

	got, err := s.itineraries.GetItinerariesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetItinerariesByTripId: %v", err)
	}
	if len(got) != len(inputs) {
		t.Errorf("expected %d events, got %d", len(inputs), len(got))
	}
}

func TestGetItinerariesByTripId_isolatedByTrip(t *testing.T) {
	s := newItinerarySetup(t)

	otherTripID, err := s.trips.CreateTrip(TripInput{
		Name:        "Other Trip",
		Destination: "Elsewhere",
		TripType:    TripTypeOther,
	})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	if _, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary()); err != nil {
		t.Fatalf("create for tripID: %v", err)
	}
	if _, err := s.itineraries.CreateItineraryByTripId(otherTripID, sampleItinerary()); err != nil {
		t.Fatalf("create for otherTripID: %v", err)
	}

	got, err := s.itineraries.GetItinerariesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetItinerariesByTripId: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 event for tripID, got %d", len(got))
	}
	if got[0].TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got[0].TripID, s.tripID)
	}
}

// TestGetItinerariesByTripId_orderedByDateThenTime verifies results come back
// sorted by date ascending, then time ascending within each date.
// This test will FAIL until you add ORDER BY i.date, i.time to the query.
func TestGetItinerariesByTripId_orderedByDateThenTime(t *testing.T) {
	s := newItinerarySetup(t)

	// Insert deliberately out of order.
	outOfOrder := []ItineraryInput{
		{Date: "2025-07-15", Time: "08:00", Title: "Day 2 Morning"},
		{Date: "2025-07-14", Time: "19:00", Title: "Day 1 Evening"},
		{Date: "2025-07-14", Time: "09:00", Title: "Day 1 Morning"},
	}
	for _, in := range outOfOrder {
		if _, err := s.itineraries.CreateItineraryByTripId(s.tripID, in); err != nil {
			t.Fatalf("CreateItineraryByTripId: %v", err)
		}
	}

	got, err := s.itineraries.GetItinerariesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetItinerariesByTripId: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("expected 3 events, got %d", len(got))
	}

	wantTitles := []string{"Day 1 Morning", "Day 1 Evening", "Day 2 Morning"}
	for i, want := range wantTitles {
		if got[i].Title != want {
			t.Errorf("position %d: got %q, want %q", i, got[i].Title, want)
		}
	}
}

// --- GetItineraryById ---

func TestGetItineraryById(t *testing.T) {
	s := newItinerarySetup(t)

	id, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}

	got, err := s.itineraries.GetItineraryById(id)
	if err != nil {
		t.Fatalf("GetItineraryById: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetItineraryById_notFound(t *testing.T) {
	s := newItinerarySetup(t)

	_, err := s.itineraries.GetItineraryById(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateItineraryById ---

func TestUpdateItineraryById(t *testing.T) {
	s := newItinerarySetup(t)

	id, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}

	updated := ItineraryInput{
		Date:        "2025-07-15",
		Time:        "14:30",
		Title:       "Beach afternoon",
		Description: "Bring sunscreen",
	}

	if err := s.itineraries.UpdateItineraryById(id, updated); err != nil {
		t.Fatalf("UpdateItineraryById: %v", err)
	}

	got, err := s.itineraries.GetItineraryById(id)
	if err != nil {
		t.Fatalf("GetItineraryById after update: %v", err)
	}
	if got.Date != updated.Date {
		t.Errorf("Date: got %q, want %q", got.Date, updated.Date)
	}
	if got.Time != updated.Time {
		t.Errorf("Time: got %q, want %q", got.Time, updated.Time)
	}
	if got.Title != updated.Title {
		t.Errorf("Title: got %q, want %q", got.Title, updated.Title)
	}
	if got.Description != updated.Description {
		t.Errorf("Description: got %q, want %q", got.Description, updated.Description)
	}
}

func TestUpdateItineraryById_nonExistentIsNoOp(t *testing.T) {
	s := newItinerarySetup(t)

	err := s.itineraries.UpdateItineraryById(999, sampleItinerary())
	if err != nil {
		t.Errorf("expected no error updating non-existent event, got %v", err)
	}
}

// --- DeleteItineraryById ---

func TestDeleteItineraryById(t *testing.T) {
	s := newItinerarySetup(t)

	id, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}

	if err := s.itineraries.DeleteItineraryById(id); err != nil {
		t.Fatalf("DeleteItineraryById: %v", err)
	}

	_, err = s.itineraries.GetItineraryById(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeleteItineraryById_isIdempotent(t *testing.T) {
	s := newItinerarySetup(t)

	if err := s.itineraries.DeleteItineraryById(999); err != nil {
		t.Errorf("expected no error deleting non-existent event, got %v", err)
	}
}

func TestDeleteItineraryById_doesNotDeleteOthers(t *testing.T) {
	s := newItinerarySetup(t)

	id1, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("create 1: %v", err)
	}
	id2, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("create 2: %v", err)
	}

	if err := s.itineraries.DeleteItineraryById(id1); err != nil {
		t.Fatalf("DeleteItineraryById: %v", err)
	}

	if _, err := s.itineraries.GetItineraryById(id2); err != nil {
		t.Errorf("sibling event should still exist after deleting id1: %v", err)
	}
}

// --- CASCADE delete ---

func TestDeleteTrip_cascadesItineraries(t *testing.T) {
	s := newItinerarySetup(t)

	eventID, err := s.itineraries.CreateItineraryByTripId(s.tripID, sampleItinerary())
	if err != nil {
		t.Fatalf("CreateItineraryByTripId: %v", err)
	}

	if err := s.trips.DeleteTripById(s.tripID); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.itineraries.GetItineraryById(eventID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected event to be cascade-deleted with trip, got %v", err)
	}
}
