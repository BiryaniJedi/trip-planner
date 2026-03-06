package models

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

// newService spins up a fresh in-memory DB for each test.
func newService(t *testing.T) *TripsService {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return NewTripsService(database)
}

// sampleInput returns a fully-populated TripInput for reuse across tests.
func sampleInput() TripInput {
	return TripInput{
		Name:        "Coachella 2026",
		Destination: "Indio, CA",
		StartDate:   "2026-04-10",
		EndDate:     "2026-04-20",
		TripType:    TripTypeFestival,
		NeedVisa:    false,
	}
}

// --- CreateTrip ---

func TestCreateTrip_returnsID(t *testing.T) {
	s := newService(t)

	id, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestCreateTrip_fieldsRoundTrip(t *testing.T) {
	s := newService(t)
	in := sampleInput()

	id, err := s.CreateTrip(in)
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	got, err := s.GetTripByID(id)
	if err != nil {
		t.Fatalf("GetTripByID: %v", err)
	}

	if got.Name != in.Name {
		t.Errorf("Name: got %q, want %q", got.Name, in.Name)
	}
	if got.Destination != in.Destination {
		t.Errorf("Destination: got %q, want %q", got.Destination, in.Destination)
	}
	if got.StartDate != in.StartDate {
		t.Errorf("StartDate: got %q, want %q", got.StartDate, in.StartDate)
	}
	if got.EndDate != in.EndDate {
		t.Errorf("EndDate: got %q, want %q", got.EndDate, in.EndDate)
	}
	if got.TripType != in.TripType {
		t.Errorf("TripType: got %q, want %q", got.TripType, in.TripType)
	}
	if got.NeedVisa != in.NeedVisa {
		t.Errorf("NeedVisa: got %v, want %v", got.NeedVisa, in.NeedVisa)
	}
}

func TestCreateTrip_needVisaTrue(t *testing.T) {
	s := newService(t)
	in := sampleInput()
	in.NeedVisa = true

	id, err := s.CreateTrip(in)
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	got, err := s.GetTripByID(id)
	if err != nil {
		t.Fatalf("GetTripByID: %v", err)
	}
	if !got.NeedVisa {
		t.Error("NeedVisa: got false, want true")
	}
}

func TestCreateTrip_idsAreUnique(t *testing.T) {
	s := newService(t)

	id1, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("first CreateTrip: %v", err)
	}
	id2, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("second CreateTrip: %v", err)
	}
	if id1 == id2 {
		t.Errorf("expected unique IDs, both got %d", id1)
	}
}

// --- GetAllTrips ---

func TestGetAllTrips_empty(t *testing.T) {
	s := newService(t)

	trips, err := s.GetAllTrips()
	if err != nil {
		t.Fatalf("GetAllTrips: %v", err)
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
			t.Fatalf("CreateTrip %q: %v", name, err)
		}
	}

	trips, err := s.GetAllTrips()
	if err != nil {
		t.Fatalf("GetAllTrips: %v", err)
	}
	if len(trips) != len(names) {
		t.Errorf("expected %d trips, got %d", len(names), len(trips))
	}
}

// --- GetTripByID ---

func TestGetTripByID(t *testing.T) {
	s := newService(t)

	id, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	got, err := s.GetTripByID(id)
	if err != nil {
		t.Fatalf("GetTripByID: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetTripByID_notFound(t *testing.T) {
	s := newService(t)

	_, err := s.GetTripByID(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateTripById ---

func TestUpdateTripById(t *testing.T) {
	s := newService(t)

	id, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	updated := TripInput{
		Name:        "Updated Name",
		Destination: "New Place",
		StartDate:   "2026-05-01",
		EndDate:     "2026-05-10",
		TripType:    TripTypeRoadtrip,
		NeedVisa:    true,
	}

	if err := s.UpdateTripById(id, updated); err != nil {
		t.Fatalf("UpdateTripById: %v", err)
	}

	got, err := s.GetTripByID(id)
	if err != nil {
		t.Fatalf("GetTripByID after update: %v", err)
	}
	if got.Name != updated.Name {
		t.Errorf("Name: got %q, want %q", got.Name, updated.Name)
	}
	if got.Destination != updated.Destination {
		t.Errorf("Destination: got %q, want %q", got.Destination, updated.Destination)
	}
	if got.TripType != updated.TripType {
		t.Errorf("TripType: got %q, want %q", got.TripType, updated.TripType)
	}
	if got.NeedVisa != updated.NeedVisa {
		t.Errorf("NeedVisa: got %v, want %v", got.NeedVisa, updated.NeedVisa)
	}
}

func TestUpdateTripById_nonExistentIsNoOp(t *testing.T) {
	s := newService(t)

	err := s.UpdateTripById(999, sampleInput())
	if err != nil {
		t.Errorf("expected no error updating non-existent trip, got %v", err)
	}
}

// --- DeleteTripById ---

func TestDeleteTripById(t *testing.T) {
	s := newService(t)

	id, err := s.CreateTrip(sampleInput())
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}

	if err := s.DeleteTripById(id); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.GetTripByID(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeleteTripById_isIdempotent(t *testing.T) {
	s := newService(t)

	if err := s.DeleteTripById(999); err != nil {
		t.Errorf("expected no error deleting non-existent trip, got %v", err)
	}
}
