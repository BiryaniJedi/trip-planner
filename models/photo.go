package models

import (
	"database/sql"
	"fmt"
	"github.com/google/uuid"
	"io"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
)

type Photo struct {
	ID       int64  `json:"id"`
	TripID   int64  `json:"trip_id"`
	Filename string `json:"filename"`
	Caption  string `json:"caption"`
}

type PhotosService struct {
	db      *sql.DB
	baseDir string // e.g. ~/.trip-planner/photos
}

func NewPhotosService(database *sql.DB, baseDir string) *PhotosService {
	return &PhotosService{db: database, baseDir: baseDir}
}

// tripPhotoDir returns the directory where a trip's photos are stored.
func (s *PhotosService) tripPhotoDir(tripId int64) string {
	return filepath.Join(s.baseDir, fmt.Sprintf("%d", tripId))
}

// PhotoPath returns the full on-disk path for a stored photo.
func (s *PhotosService) PhotoPath(tripId int64, filename string) string {
	return filepath.Join(s.tripPhotoDir(tripId), filename)
}

// AddPhoto copies the file at sourcePath into the trip's photo directory,
// records it in the DB, and returns the new photo ID.
// The source file is not modified or removed.
func (s *PhotosService) AddPhoto(tripId int64, sourcePath, caption string) (int64, error) {
	_, err := os.Stat(sourcePath)
	if err != nil {
		return 0, fmt.Errorf("Error opening file: %w", err)
	}

	err = os.MkdirAll(s.tripPhotoDir(tripId), 0755)
	if err != nil {
		return 0, fmt.Errorf("Error creating trip photo directory: %w", err)
	}

	source, err := os.Open(sourcePath)
	if err != nil {
		return 0, fmt.Errorf("Error opening file: %w", err)
	}
	defer source.Close()

	newFileName := uuid.New().String() + filepath.Ext(sourcePath)
	newFilePath := s.PhotoPath(tripId, newFileName)
	dest, err := os.Create(newFilePath)
	if err != nil {
		return 0, fmt.Errorf("Error creating new file: %w", err)
	}

	_, err = io.Copy(dest, source)

	if err != nil {
		return 0, fmt.Errorf("Error copying source to destination file: %w", err)
	}

	if err = dest.Close(); err != nil {
		return 0, fmt.Errorf("Error flushing photo to disk: %w", err)
	}

	//Sucessfuly copied file, insert into DB
	query := `
		INSERT INTO photos (
			trip_id,
			filename,
			caption
		)
		VALUES (?, ?, ?)
		RETURNING id
	`

	var resId int64
	err = s.db.QueryRow(query,
		tripId,
		newFileName,
		caption,
	).Scan(
		&resId,
	)
	if err != nil {
		os.Remove(newFilePath)
		return 0, fmt.Errorf("Create photo query error: %w", err)
	}

	return resId, nil
}

// GetPhotosByTripId returns all photos for a trip ordered by position ascending.
func (s *PhotosService) GetPhotosByTripId(tripId int64) ([]Photo, error) {
	query := `
		SELECT
			p.id,
			p.trip_id,
			p.filename,
			COALESCE(p.caption, '')
		FROM photos p 
		WHERE p.trip_id = ?
	`

	rows, err := s.db.Query(query, tripId)
	if err != nil {
		return nil, fmt.Errorf("Error querying all photos for trip: %w", err)
	}
	defer rows.Close()

	var photos []Photo
	var tempPhoto Photo
	for rows.Next() {
		err := rows.Scan(
			&tempPhoto.ID,
			&tempPhoto.TripID,
			&tempPhoto.Filename,
			&tempPhoto.Caption,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		photos = append(photos, tempPhoto)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for photos list: %w", err)
	}

	return photos, nil
}

// GetPhotoById returns a single photo by its ID.
func (s *PhotosService) GetPhotoById(photoId int64) (Photo, error) {
	query := `
		SELECT 
			p.id,
			p.trip_id,
			p.filename,
			COALESCE (p.caption, '')
		FROM photos p
		WHERE p.id = ?
	`

	var photo Photo
	err := s.db.QueryRow(query, photoId).Scan(
		&photo.ID,
		&photo.TripID,
		&photo.Filename,
		&photo.Caption,
	)
	if err != nil {
		return Photo{}, fmt.Errorf("Error scanning row: %w", err)
	}

	return photo, nil
}

// UpdateCaption sets a new caption for a photo.
func (s *PhotosService) UpdateCaptionByPhotoId(photoId int64, caption string) error {
	query := `
		UPDATE photos
		SET caption = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		caption,
		photoId,
	)
	if err != nil {
		return fmt.Errorf("Update photo query error: %w", err)
	}

	return nil
}

// DeletePhoto removes the photo record from the DB and deletes its file from disk.
// NOTE: trip CASCADE only removes DB rows — callers must call DeletePhoto per photo
// before deleting the parent trip if disk cleanup is required.
func (s *PhotosService) DeletePhotoById(photoId int64) error {
	photo, err := s.GetPhotoById(photoId)
	if err != nil {
		return nil
	}
	if _, err := s.db.Exec(`DELETE FROM photos WHERE id = ?`, photoId); err != nil {
		return fmt.Errorf("Delete photo query error: %w", err)
	}

	os.Remove(s.PhotoPath(photo.TripID, photo.Filename))
	return nil
}

// DeleteAllPhotosByTripId removes the entire photo directory for a trip from disk.
// Call this before deleting a trip — DB rows are handled by CASCADE,
// but files must be cleaned up explicitly.
func (s *PhotosService) DeleteAllPhotosByTripId(tripId int64) error {
	dir := s.tripPhotoDir(tripId)
	if err := os.RemoveAll(dir); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("removing photo directory for trip %d: %w", tripId, err)
	}
	return nil
}
