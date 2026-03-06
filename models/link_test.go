package models

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

type linkSetup struct {
	trips  *TripsService
	links  *LinksService
	tripID int64
}

// newLinkSetup opens a fresh in-memory DB and pre-creates one trip.
func newLinkSetup(t *testing.T) linkSetup {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	trips := NewTripsService(database)
	links := NewLinksService(database)

	tripID, err := trips.CreateTrip(TripInput{
		Name:        "Test Trip",
		Destination: "Anywhere",
		TripType:    TripTypeTravel,
	})
	if err != nil {
		t.Fatalf("setup CreateTrip: %v", err)
	}

	return linkSetup{trips: trips, links: links, tripID: tripID}
}

// sampleLink returns a fully-populated LinkInput for reuse.
func sampleLink() LinkInput {
	return LinkInput{
		Name: "Festival Website",
		Url:  "https://www.coachella.com",
	}
}

// --- isValidURL ---

func TestIsValidURL_validHTTPS(t *testing.T) {
	if !isValidURL("https://www.example.com") {
		t.Error("expected https URL to be valid")
	}
}

func TestIsValidURL_validHTTP(t *testing.T) {
	if !isValidURL("http://example.com/path?q=1") {
		t.Error("expected http URL to be valid")
	}
}

func TestIsValidURL_rejectsFTP(t *testing.T) {
	if isValidURL("ftp://files.example.com") {
		t.Error("expected ftp URL to be invalid")
	}
}

func TestIsValidURL_rejectsPlainString(t *testing.T) {
	if isValidURL("not a url") {
		t.Error("expected plain string to be invalid")
	}
}

func TestIsValidURL_rejectsEmpty(t *testing.T) {
	if isValidURL("") {
		t.Error("expected empty string to be invalid")
	}
}

func TestIsValidURL_rejectsMissingScheme(t *testing.T) {
	if isValidURL("www.example.com") {
		t.Error("expected URL without scheme to be invalid")
	}
}

// --- CreateLinkByTripId (URL validation) ---

func TestCreateLink_rejectsInvalidURL(t *testing.T) {
	s := newLinkSetup(t)

	badURLs := []string{
		"not a url",
		"ftp://files.example.com",
		"www.example.com",
		"://missing-scheme.com",
	}
	for _, u := range badURLs {
		_, err := s.links.CreateLinkByTripId(s.tripID, LinkInput{Name: "Test", Url: u})
		if err == nil {
			t.Errorf("expected error for invalid URL %q, got nil", u)
		}
	}
}

func TestCreateLink_acceptsValidURL(t *testing.T) {
	s := newLinkSetup(t)

	validURLs := []string{
		"https://www.example.com",
		"http://example.com/path?q=1#section",
	}
	for _, u := range validURLs {
		_, err := s.links.CreateLinkByTripId(s.tripID, LinkInput{Name: "Test", Url: u})
		if err != nil {
			t.Errorf("expected no error for valid URL %q, got %v", u, err)
		}
	}
}

// --- CreateLinkByTripId ---

func TestCreateLink_returnsID(t *testing.T) {
	s := newLinkSetup(t)

	id, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestCreateLink_fieldsRoundTrip(t *testing.T) {
	s := newLinkSetup(t)
	in := sampleLink()

	id, err := s.links.CreateLinkByTripId(s.tripID, in)
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	got, err := s.links.GetLinkById(id)
	if err != nil {
		t.Fatalf("GetLinkById: %v", err)
	}

	if got.TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got.TripID, s.tripID)
	}
	if got.Name != in.Name {
		t.Errorf("Name: got %q, want %q", got.Name, in.Name)
	}
	if got.Url != in.Url {
		t.Errorf("Url: got %q, want %q", got.Url, in.Url)
	}
}

func TestCreateLink_idsAreUnique(t *testing.T) {
	s := newLinkSetup(t)

	id1, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("first CreateLinkByTripId: %v", err)
	}
	id2, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("second CreateLinkByTripId: %v", err)
	}
	if id1 == id2 {
		t.Errorf("expected unique IDs, both got %d", id1)
	}
}

// --- GetLinksByTripId ---

func TestGetLinksByTripId_empty(t *testing.T) {
	s := newLinkSetup(t)

	links, err := s.links.GetLinksByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetLinksByTripId: %v", err)
	}
	if len(links) != 0 {
		t.Errorf("expected 0 links, got %d", len(links))
	}
}

func TestGetLinksByTripId_returnsAll(t *testing.T) {
	s := newLinkSetup(t)

	inputs := []LinkInput{
		{Name: "Flights", Url: "https://flights.google.com"},
		{Name: "Hotel", Url: "https://www.airbnb.com"},
		{Name: "Festival", Url: "https://www.coachella.com"},
	}
	for _, in := range inputs {
		if _, err := s.links.CreateLinkByTripId(s.tripID, in); err != nil {
			t.Fatalf("CreateLinkByTripId %q: %v", in.Name, err)
		}
	}

	got, err := s.links.GetLinksByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetLinksByTripId: %v", err)
	}
	if len(got) != len(inputs) {
		t.Errorf("expected %d links, got %d", len(inputs), len(got))
	}
}

func TestGetLinksByTripId_isolatedByTrip(t *testing.T) {
	s := newLinkSetup(t)

	otherTripID, err := s.trips.CreateTrip(TripInput{
		Name:        "Other Trip",
		Destination: "Elsewhere",
		TripType:    TripTypeOther,
	})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	if _, err := s.links.CreateLinkByTripId(s.tripID, sampleLink()); err != nil {
		t.Fatalf("CreateLinkByTripId (tripID): %v", err)
	}
	if _, err := s.links.CreateLinkByTripId(otherTripID, sampleLink()); err != nil {
		t.Fatalf("CreateLinkByTripId (otherTripID): %v", err)
	}

	got, err := s.links.GetLinksByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetLinksByTripId: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 link for tripID, got %d", len(got))
	}
	if got[0].TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got[0].TripID, s.tripID)
	}
}

// --- GetLinkById ---

func TestGetLinkById(t *testing.T) {
	s := newLinkSetup(t)

	id, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	got, err := s.links.GetLinkById(id)
	if err != nil {
		t.Fatalf("GetLinkById: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetLinkById_notFound(t *testing.T) {
	s := newLinkSetup(t)

	_, err := s.links.GetLinkById(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateLinkById ---

func TestUpdateLinkById(t *testing.T) {
	s := newLinkSetup(t)

	id, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	updated := LinkInput{
		Name: "Official Map",
		Url:  "https://maps.google.com",
	}

	if err := s.links.UpdateLinkById(id, updated); err != nil {
		t.Fatalf("UpdateLinkById: %v", err)
	}

	got, err := s.links.GetLinkById(id)
	if err != nil {
		t.Fatalf("GetLinkById after update: %v", err)
	}
	if got.Name != updated.Name {
		t.Errorf("Name: got %q, want %q", got.Name, updated.Name)
	}
	if got.Url != updated.Url {
		t.Errorf("Url: got %q, want %q", got.Url, updated.Url)
	}
}

func TestUpdateLink_rejectsInvalidURL(t *testing.T) {
	s := newLinkSetup(t)

	id, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	err = s.links.UpdateLinkById(id, LinkInput{Name: "Test", Url: "not-a-url"})
	if err == nil {
		t.Error("expected error for invalid URL on update, got nil")
	}

	// Original should be unchanged
	got, err := s.links.GetLinkById(id)
	if err != nil {
		t.Fatalf("GetLinkById: %v", err)
	}
	if got.Url != sampleLink().Url {
		t.Errorf("URL should be unchanged after rejected update: got %q, want %q", got.Url, sampleLink().Url)
	}
}

func TestUpdateLinkById_nonExistentIsNoOp(t *testing.T) {
	s := newLinkSetup(t)

	err := s.links.UpdateLinkById(999, sampleLink())
	if err != nil {
		t.Errorf("expected no error updating non-existent link, got %v", err)
	}
}

// --- DeleteLinkById ---

func TestDeleteLinkById(t *testing.T) {
	s := newLinkSetup(t)

	id, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	if err := s.links.DeleteLinkById(id); err != nil {
		t.Fatalf("DeleteLinkById: %v", err)
	}

	_, err = s.links.GetLinkById(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeleteLinkById_isIdempotent(t *testing.T) {
	s := newLinkSetup(t)

	if err := s.links.DeleteLinkById(999); err != nil {
		t.Errorf("expected no error deleting non-existent link, got %v", err)
	}
}

func TestDeleteLinkById_doesNotDeleteOtherLinks(t *testing.T) {
	s := newLinkSetup(t)

	id1, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId (1): %v", err)
	}
	id2, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId (2): %v", err)
	}

	if err := s.links.DeleteLinkById(id1); err != nil {
		t.Fatalf("DeleteLinkById: %v", err)
	}

	if _, err := s.links.GetLinkById(id2); err != nil {
		t.Errorf("sibling link should still exist after deleting id1: %v", err)
	}
}

// --- CASCADE delete ---

func TestDeleteTrip_cascadesLinks(t *testing.T) {
	s := newLinkSetup(t)

	linkID, err := s.links.CreateLinkByTripId(s.tripID, sampleLink())
	if err != nil {
		t.Fatalf("CreateLinkByTripId: %v", err)
	}

	if err := s.trips.DeleteTripById(s.tripID); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.links.GetLinkById(linkID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected link to be cascade-deleted with trip, got %v", err)
	}
}
