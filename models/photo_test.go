package models

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

type photoSetup struct {
	trips   *TripsService
	photos  *PhotosService
	tripID  int64
	baseDir string
}

// newPhotoSetup opens a fresh in-memory DB, creates a temp photo directory,
// and pre-creates one trip.
func newPhotoSetup(t *testing.T) photoSetup {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	baseDir := t.TempDir() // cleaned up automatically after the test
	trips := NewTripsService(database)
	photos := NewPhotosService(database, baseDir)

	tripID, err := trips.CreateTrip(TripInput{
		Name:        "Test Trip",
		Destination: "Anywhere",
		TripType:    TripTypeTravel,
	})
	if err != nil {
		t.Fatalf("setup CreateTrip: %v", err)
	}

	return photoSetup{trips: trips, photos: photos, tripID: tripID, baseDir: baseDir}
}

// tempSourceFile writes fake image bytes to a temp file, simulating a photo
// sitting somewhere else on the user's machine.
func tempSourceFile(t *testing.T) string {
	t.Helper()
	f, err := os.CreateTemp(t.TempDir(), "source_photo_*.jpg")
	if err != nil {
		t.Fatalf("create temp source file: %v", err)
	}
	if _, err := f.Write([]byte("fake jpeg data — not a real image")); err != nil {
		t.Fatalf("write temp source file: %v", err)
	}
	f.Close()
	return f.Name()
}

// --- AddPhoto ---

func TestAddPhoto_returnsID(t *testing.T) {
	s := newPhotoSetup(t)

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestAddPhoto_fileIsCopiedToTripDir(t *testing.T) {
	s := newPhotoSetup(t)
	src := tempSourceFile(t)

	id, err := s.photos.AddPhoto(s.tripID, src, "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	photo, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}

	dest := s.photos.PhotoPath(s.tripID, photo.Filename)
	if _, err := os.Stat(dest); os.IsNotExist(err) {
		t.Errorf("expected copied file to exist at %q, but it does not", dest)
	}
}

func TestAddPhoto_copiedFileMatchesSource(t *testing.T) {
	s := newPhotoSetup(t)
	src := tempSourceFile(t)

	id, err := s.photos.AddPhoto(s.tripID, src, "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	photo, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}

	srcBytes, _ := os.ReadFile(src)
	destBytes, _ := os.ReadFile(s.photos.PhotoPath(s.tripID, photo.Filename))
	if string(srcBytes) != string(destBytes) {
		t.Error("copied file content does not match source")
	}
}

func TestAddPhoto_sourceFileUnchanged(t *testing.T) {
	s := newPhotoSetup(t)
	src := tempSourceFile(t)
	originalBytes, _ := os.ReadFile(src)

	if _, err := s.photos.AddPhoto(s.tripID, src, ""); err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	afterBytes, err := os.ReadFile(src)
	if err != nil {
		t.Fatalf("source file missing after AddPhoto: %v", err)
	}
	if string(originalBytes) != string(afterBytes) {
		t.Error("source file was modified or removed — expected it to be unchanged")
	}
}

func TestAddPhoto_fieldsRoundTrip(t *testing.T) {
	s := newPhotoSetup(t)
	caption := "Sunset at the venue"

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), caption)
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	got, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}

	if got.TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got.TripID, s.tripID)
	}
	if got.Caption != caption {
		t.Errorf("Caption: got %q, want %q", got.Caption, caption)
	}
	if got.Filename == "" {
		t.Error("Filename should not be empty")
	}
}

func TestAddPhoto_preservesSourceExtension(t *testing.T) {
	s := newPhotoSetup(t)
	src := tempSourceFile(t) // ends in .jpg

	id, err := s.photos.AddPhoto(s.tripID, src, "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	photo, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}

	if filepath.Ext(photo.Filename) != ".jpg" {
		t.Errorf("expected stored filename to preserve .jpg extension, got %q", photo.Filename)
	}
}

func TestAddPhoto_uniqueFilenamesForMultiplePhotos(t *testing.T) {
	s := newPhotoSetup(t)

	id1, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("first AddPhoto: %v", err)
	}
	id2, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("second AddPhoto: %v", err)
	}

	p1, _ := s.photos.GetPhotoById(id1)
	p2, _ := s.photos.GetPhotoById(id2)

	if p1.Filename == p2.Filename {
		t.Errorf("expected unique filenames, both got %q", p1.Filename)
	}
}

func TestAddPhoto_rejectsNonExistentSource(t *testing.T) {
	s := newPhotoSetup(t)

	_, err := s.photos.AddPhoto(s.tripID, "/does/not/exist/photo.jpg", "")
	if err == nil {
		t.Error("expected error for non-existent source path, got nil")
	}
}

// --- GetPhotosByTripId ---

func TestGetPhotosByTripId_empty(t *testing.T) {
	s := newPhotoSetup(t)

	photos, err := s.photos.GetPhotosByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetPhotosByTripId: %v", err)
	}
	if len(photos) != 0 {
		t.Errorf("expected 0 photos, got %d", len(photos))
	}
}

func TestGetPhotosByTripId_returnsAll(t *testing.T) {
	s := newPhotoSetup(t)

	for range 3 {
		if _, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), ""); err != nil {
			t.Fatalf("AddPhoto: %v", err)
		}
	}

	got, err := s.photos.GetPhotosByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetPhotosByTripId: %v", err)
	}
	if len(got) != 3 {
		t.Errorf("expected 3 photos, got %d", len(got))
	}
}

func TestGetPhotosByTripId_isolatedByTrip(t *testing.T) {
	s := newPhotoSetup(t)

	otherTripID, err := s.trips.CreateTrip(TripInput{
		Name:        "Other Trip",
		Destination: "Elsewhere",
		TripType:    TripTypeOther,
	})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	if _, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), ""); err != nil {
		t.Fatalf("AddPhoto (tripID): %v", err)
	}
	if _, err := s.photos.AddPhoto(otherTripID, tempSourceFile(t), ""); err != nil {
		t.Fatalf("AddPhoto (otherTripID): %v", err)
	}

	got, err := s.photos.GetPhotosByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetPhotosByTripId: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 photo for tripID, got %d", len(got))
	}
}

// --- GetPhotoById ---

func TestGetPhotoById(t *testing.T) {
	s := newPhotoSetup(t)

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	got, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetPhotoById_notFound(t *testing.T) {
	s := newPhotoSetup(t)

	_, err := s.photos.GetPhotoById(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateCaption ---

func TestUpdateCaption(t *testing.T) {
	s := newPhotoSetup(t)

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "original caption")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	if err := s.photos.UpdateCaptionByPhotoId(id, "updated caption"); err != nil {
		t.Fatalf("UpdateCaptionByPhotoId: %v", err)
	}

	got, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}
	if got.Caption != "updated caption" {
		t.Errorf("Caption: got %q, want %q", got.Caption, "updated caption")
	}
}

func TestUpdateCaption_nonExistentIsNoOp(t *testing.T) {
	s := newPhotoSetup(t)

	if err := s.photos.UpdateCaptionByPhotoId(999, "anything"); err != nil {
		t.Errorf("expected no error updating caption on non-existent photo, got %v", err)
	}
}

// --- DeletePhoto ---

func TestDeletePhoto_removesFromDB(t *testing.T) {
	s := newPhotoSetup(t)

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	if err := s.photos.DeletePhotoById(id); err != nil {
		t.Fatalf("DeletePhoto: %v", err)
	}

	_, err = s.photos.GetPhotoById(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeletePhoto_removesFileFromDisk(t *testing.T) {
	s := newPhotoSetup(t)

	id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	photo, err := s.photos.GetPhotoById(id)
	if err != nil {
		t.Fatalf("GetPhotoById: %v", err)
	}
	filePath := s.photos.PhotoPath(s.tripID, photo.Filename)

	if err := s.photos.DeletePhotoById(id); err != nil {
		t.Fatalf("DeletePhoto: %v", err)
	}

	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		t.Errorf("expected file %q to be deleted from disk, but it still exists", filePath)
	}
}

func TestDeletePhoto_isIdempotent(t *testing.T) {
	s := newPhotoSetup(t)

	if err := s.photos.DeletePhotoById(999); err != nil {
		t.Errorf("expected no error deleting non-existent photo, got %v", err)
	}
}

func TestDeletePhoto_doesNotDeleteOtherPhotos(t *testing.T) {
	s := newPhotoSetup(t)

	id1, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto (1): %v", err)
	}
	id2, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto (2): %v", err)
	}

	p2, _ := s.photos.GetPhotoById(id2)
	p2Path := s.photos.PhotoPath(s.tripID, p2.Filename)

	if err := s.photos.DeletePhotoById(id1); err != nil {
		t.Fatalf("DeletePhoto: %v", err)
	}

	if _, err := s.photos.GetPhotoById(id2); err != nil {
		t.Errorf("sibling photo should still be in DB: %v", err)
	}
	if _, err := os.Stat(p2Path); os.IsNotExist(err) {
		t.Errorf("sibling photo file should still exist on disk at %q", p2Path)
	}
}

// --- DeleteAllPhotosByTripId ---

func TestDeleteAllPhotosByTripId_removesAllFiles(t *testing.T) {
	s := newPhotoSetup(t)

	var filePaths []string
	for range 3 {
		id, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
		if err != nil {
			t.Fatalf("AddPhoto: %v", err)
		}
		p, _ := s.photos.GetPhotoById(id)
		filePaths = append(filePaths, s.photos.PhotoPath(s.tripID, p.Filename))
	}

	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Fatalf("DeleteAllPhotosByTripId: %v", err)
	}

	for _, path := range filePaths {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Errorf("expected file %q to be deleted, but it still exists", path)
		}
	}
}

func TestDeleteAllPhotosByTripId_removesDirectory(t *testing.T) {
	s := newPhotoSetup(t)

	if _, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), ""); err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Fatalf("DeleteAllPhotosByTripId: %v", err)
	}

	tripDir := filepath.Join(s.baseDir, fmt.Sprintf("%d", s.tripID))
	if _, err := os.Stat(tripDir); !os.IsNotExist(err) {
		t.Errorf("expected trip photo directory %q to be removed, but it still exists", tripDir)
	}
}

func TestDeleteAllPhotosByTripId_isIdempotent(t *testing.T) {
	s := newPhotoSetup(t)

	// No photos added — directory doesn't exist yet
	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Errorf("expected no error when photo directory does not exist, got %v", err)
	}

	// Call again after a real delete
	if _, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), ""); err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}
	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Fatalf("first DeleteAllPhotosByTripId: %v", err)
	}
	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Errorf("second DeleteAllPhotosByTripId (already deleted): %v", err)
	}
}

func TestDeleteAllPhotosByTripId_doesNotAffectOtherTrips(t *testing.T) {
	s := newPhotoSetup(t)

	otherTripID, err := s.trips.CreateTrip(TripInput{
		Name:        "Other Trip",
		Destination: "Elsewhere",
		TripType:    TripTypeOther,
	})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	otherID, err := s.photos.AddPhoto(otherTripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto (other trip): %v", err)
	}
	otherPhoto, _ := s.photos.GetPhotoById(otherID)
	otherPath := s.photos.PhotoPath(otherTripID, otherPhoto.Filename)

	if _, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), ""); err != nil {
		t.Fatalf("AddPhoto (tripID): %v", err)
	}

	if err := s.photos.DeleteAllPhotosByTripId(s.tripID); err != nil {
		t.Fatalf("DeleteAllPhotosByTripId: %v", err)
	}

	if _, err := os.Stat(otherPath); os.IsNotExist(err) {
		t.Errorf("other trip's photo file should still exist at %q", otherPath)
	}
	if _, err := s.photos.GetPhotoById(otherID); err != nil {
		t.Errorf("other trip's photo DB row should still exist: %v", err)
	}
}

// --- CASCADE behaviour ---

// TestDeleteTrip_cascadesPhotoDB verifies the DB rows are removed by the FK cascade.
// NOTE: Files on disk are NOT cleaned up by the cascade — the app layer must call
// DeletePhoto on each photo before deleting the trip to avoid orphaned files.
func TestDeleteTrip_cascadesPhotoDB(t *testing.T) {
	s := newPhotoSetup(t)

	photoID, err := s.photos.AddPhoto(s.tripID, tempSourceFile(t), "")
	if err != nil {
		t.Fatalf("AddPhoto: %v", err)
	}

	if err := s.trips.DeleteTripById(s.tripID); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.photos.GetPhotoById(photoID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected photo DB row to be cascade-deleted with trip, got %v", err)
	}
}
