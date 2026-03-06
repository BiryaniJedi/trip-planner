package models

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

type noteSetup struct {
	trips  *TripsService
	notes  *NotesService
	tripID int64
}

// newNoteSetup opens a fresh in-memory DB and pre-creates one trip.
func newNoteSetup(t *testing.T) noteSetup {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	trips := NewTripsService(database)
	notes := NewNotesService(database)

	tripID, err := trips.CreateTrip(TripInput{
		Name:        "Test Trip",
		Destination: "Anywhere",
		TripType:    TripTypeTravel,
	})
	if err != nil {
		t.Fatalf("setup CreateTrip: %v", err)
	}

	return noteSetup{trips: trips, notes: notes, tripID: tripID}
}

// sampleNote returns a fully-populated NoteInput for reuse.
func sampleNote() NoteInput {
	return NoteInput{
		Title:   "Packing List",
		Content: "Sunscreen, passport, adapter",
	}
}

// --- CreateNoteByTripId ---

func TestCreateNote_returnsID(t *testing.T) {
	s := newNoteSetup(t)

	id, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestCreateNote_fieldsRoundTrip(t *testing.T) {
	s := newNoteSetup(t)
	in := sampleNote()

	id, err := s.notes.CreateNoteByTripId(s.tripID, in)
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}

	got, err := s.notes.GetNoteById(id)
	if err != nil {
		t.Fatalf("GetNoteById: %v", err)
	}

	if got.TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got.TripID, s.tripID)
	}
	if got.Title != in.Title {
		t.Errorf("Title: got %q, want %q", got.Title, in.Title)
	}
	if got.Content != in.Content {
		t.Errorf("Content: got %q, want %q", got.Content, in.Content)
	}
}

func TestCreateNote_idsAreUnique(t *testing.T) {
	s := newNoteSetup(t)

	id1, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("first CreateNoteByTripId: %v", err)
	}
	id2, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("second CreateNoteByTripId: %v", err)
	}
	if id1 == id2 {
		t.Errorf("expected unique IDs, both got %d", id1)
	}
}

// --- GetNotesByTripId ---

func TestGetNotesByTripId_empty(t *testing.T) {
	s := newNoteSetup(t)

	notes, err := s.notes.GetNotesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetNotesByTripId: %v", err)
	}
	if len(notes) != 0 {
		t.Errorf("expected 0 notes, got %d", len(notes))
	}
}

func TestGetNotesByTripId_returnsAll(t *testing.T) {
	s := newNoteSetup(t)

	inputs := []NoteInput{
		{Title: "Day 1", Content: "Arrive at airport"},
		{Title: "Day 2", Content: "Hotel check-in"},
		{Title: "Day 3", Content: "Festival opens"},
	}
	for _, in := range inputs {
		if _, err := s.notes.CreateNoteByTripId(s.tripID, in); err != nil {
			t.Fatalf("CreateNoteByTripId %q: %v", in.Title, err)
		}
	}

	got, err := s.notes.GetNotesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetNotesByTripId: %v", err)
	}
	if len(got) != len(inputs) {
		t.Errorf("expected %d notes, got %d", len(inputs), len(got))
	}
}

func TestGetNotesByTripId_isolatedByTrip(t *testing.T) {
	s := newNoteSetup(t)

	otherTripID, err := s.trips.CreateTrip(TripInput{
		Name:        "Other Trip",
		Destination: "Elsewhere",
		TripType:    TripTypeOther,
	})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	if _, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote()); err != nil {
		t.Fatalf("CreateNoteByTripId (tripID): %v", err)
	}
	if _, err := s.notes.CreateNoteByTripId(otherTripID, sampleNote()); err != nil {
		t.Fatalf("CreateNoteByTripId (otherTripID): %v", err)
	}

	got, err := s.notes.GetNotesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetNotesByTripId: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 note for tripID, got %d", len(got))
	}
	if got[0].TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got[0].TripID, s.tripID)
	}
}

// --- GetNoteById ---

func TestGetNoteById(t *testing.T) {
	s := newNoteSetup(t)

	id, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}

	got, err := s.notes.GetNoteById(id)
	if err != nil {
		t.Fatalf("GetNoteById: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetNoteById_notFound(t *testing.T) {
	s := newNoteSetup(t)

	_, err := s.notes.GetNoteById(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateNoteById ---

func TestUpdateNoteById(t *testing.T) {
	s := newNoteSetup(t)

	id, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}

	updated := NoteInput{
		Title:   "Updated Title",
		Content: "Updated content with more detail",
	}

	if err := s.notes.UpdateNoteById(id, updated); err != nil {
		t.Fatalf("UpdateNoteById: %v", err)
	}

	got, err := s.notes.GetNoteById(id)
	if err != nil {
		t.Fatalf("GetNoteById after update: %v", err)
	}
	if got.Title != updated.Title {
		t.Errorf("Title: got %q, want %q", got.Title, updated.Title)
	}
	if got.Content != updated.Content {
		t.Errorf("Content: got %q, want %q", got.Content, updated.Content)
	}
}

func TestUpdateNoteById_nonExistentIsNoOp(t *testing.T) {
	s := newNoteSetup(t)

	err := s.notes.UpdateNoteById(999, sampleNote())
	if err != nil {
		t.Errorf("expected no error updating non-existent note, got %v", err)
	}
}

// --- DeleteNoteById ---

func TestDeleteNoteById(t *testing.T) {
	s := newNoteSetup(t)

	id, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}

	if err := s.notes.DeleteNoteById(id); err != nil {
		t.Fatalf("DeleteNoteById: %v", err)
	}

	_, err = s.notes.GetNoteById(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeleteNoteById_isIdempotent(t *testing.T) {
	s := newNoteSetup(t)

	if err := s.notes.DeleteNoteById(999); err != nil {
		t.Errorf("expected no error deleting non-existent note, got %v", err)
	}
}

func TestDeleteNoteById_doesNotDeleteOtherNotes(t *testing.T) {
	s := newNoteSetup(t)

	id1, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId (1): %v", err)
	}
	id2, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId (2): %v", err)
	}

	if err := s.notes.DeleteNoteById(id1); err != nil {
		t.Fatalf("DeleteNoteById: %v", err)
	}

	if _, err := s.notes.GetNoteById(id2); err != nil {
		t.Errorf("sibling note should still exist after deleting id1: %v", err)
	}
}

// --- CASCADE delete ---

func TestDeleteTrip_cascadesNotes(t *testing.T) {
	s := newNoteSetup(t)

	noteID, err := s.notes.CreateNoteByTripId(s.tripID, sampleNote())
	if err != nil {
		t.Fatalf("CreateNoteByTripId: %v", err)
	}

	if err := s.trips.DeleteTripById(s.tripID); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.notes.GetNoteById(noteID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected note to be cascade-deleted with trip, got %v", err)
	}
}
