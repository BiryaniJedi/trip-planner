package models

import (
	// "errors"
	"fmt"
	"github.com/BiryaniJedi/trip-planner/db"
	"testing"
)

// newService is a test helper that spins up a fresh in-memory DB for each test.
func newService(t *testing.T) *TripsService {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return NewTripsService(database)
}

// --- CreateTrip ---

func TestCreateTrip(t *testing.T) {
	s := newService(t)

	input := TripInput{
		Name:        "Coachella 2026",
		Destination: "Indio, CA",
		StartDate:   "2026-04-10",
		EndDate:     "2026-04-12",
		TripType:    TripTypeFestival,
	}

	createdId, err := s.CreateTrip(input)
	if err != nil {
		t.Fatalf("CreateTrip error: %v", err)
	}
	fmt.Printf("%d", createdId)
}

// --- GetAllTrips ---

func TestGetAllTrips_empty(t *testing.T) {
	s := newService(t)

	trips, err := s.GetAllTrips()
	if err != nil {
		t.Fatalf("GetAllTrips error: %v", err)
	}
	if len(trips) != 0 {
		t.Errorf("expected 0 trips, got %d", len(trips))
	}
}

func TestGetAllTrips_returnsAll(t *testing.T) {
	s := newService(t)

	names := []string{"Trip A", "Trip B", "Trip C"}
	for _, name := range names {
		_, err := s.CreateTrip(TripInput{Name: name, Destination: "Somewhere", TripType: TripTypeTravel})
		if err != nil {
			t.Fatalf("CreateTrip: %v", err)
		}
	}

	trips, err := s.GetAllTrips()
	if err != nil {
		t.Fatalf("GetAllTrips error: %v", err)
	}
	if len(trips) != len(names) {
		t.Errorf("expected %d trips, got %d", len(names), len(trips))
	}
}

// --- GetTripByID ---

func TestGetTripByID(t *testing.T) {
	s := newService(t)

	createdId, err := s.CreateTrip(TripInput{
		Name:        "Road trip",
		Destination: "Route 66",
		TripType:    TripTypeRoadtrip,
	})
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	got, err := s.GetTripByID(createdId)
	if err != nil {
		t.Fatalf("GetTripByID error: %v", err)
	}
	if got.ID != createdId {
		t.Errorf("ID: got %d, want %d", got.ID, createdId)
	}
}

// func TestGetTripByID_notFound(t *testing.T) {
// 	s := newService(t)
//
// 	_, err := s.GetTripByID(999)
// 	if !errors.Is(err, ErrNotFound) {
// 		t.Errorf("expected ErrNotFound, got %v", err)
// 	}
// }
//
// // --- UpdateTrip ---
//
// func TestUpdateTrip(t *testing.T) {
// 	s := newService(t)
//
// 	created, err := s.CreateTrip(TripInput{
// 		Name:        "Old name",
// 		Destination: "Old place",
// 		TripType:    TripTypeOther,
// 	})
// 	if err != nil {
// 		t.Fatalf("CreateTrip: %v", err)
// 	}
//
// 	created.Name = "New name"
// 	created.Destination = "New place"
// 	created.TripType = TripTypeTravel
//
// 	if err := s.UpdateTrip(created); err != nil {
// 		t.Fatalf("UpdateTrip error: %v", err)
// 	}
//
// 	got, err := s.GetTripByID(created.ID)
// 	if err != nil {
// 		t.Fatalf("GetTripByID after update: %v", err)
// 	}
// 	if got.Name != "New name" {
// 		t.Errorf("Name: got %q, want %q", got.Name, "New name")
// 	}
// 	if got.Destination != "New place" {
// 		t.Errorf("Destination: got %q, want %q", got.Destination, "New place")
// 	}
// 	if got.TripType != TripTypeTravel {
// 		t.Errorf("TripType: got %q, want %q", got.TripType, TripTypeTravel)
// 	}
// }
//
// func TestUpdateTrip_notFound(t *testing.T) {
// 	s := newService(t)
//
// 	err := s.UpdateTrip(Trip{ID: 999, Name: "Ghost", Destination: "Nowhere", TripType: TripTypeOther})
// 	if !errors.Is(err, ErrNotFound) {
// 		t.Errorf("expected ErrNotFound, got %v", err)
// 	}
// }
//
// // --- DeleteTrip ---
//
// func TestDeleteTrip(t *testing.T) {
// 	s := newService(t)
//
// 	created, err := s.CreateTrip(Trip{Name: "To delete", Destination: "Anywhere", TripType: TripTypeTravel})
// 	if err != nil {
// 		t.Fatalf("CreateTrip: %v", err)
// 	}
//
// 	if err := s.DeleteTrip(created.ID); err != nil {
// 		t.Fatalf("DeleteTrip error: %v", err)
// 	}
//
// 	_, err = s.GetTripByID(created.ID)
// 	if !errors.Is(err, ErrNotFound) {
// 		t.Errorf("expected ErrNotFound after delete, got %v", err)
// 	}
// }
//
// func TestDeleteTrip_notFound(t *testing.T) {
// 	s := newService(t)
//
// 	err := s.DeleteTrip(999)
// 	if !errors.Is(err, ErrNotFound) {
// 		t.Errorf("expected ErrNotFound, got %v", err)
// 	}
// }
