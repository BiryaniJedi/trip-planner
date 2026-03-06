package models

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

type Note struct {
	ID      int64  `json:"id"`
	TripID  int64  `json:"trip_id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type NoteInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type NotesService struct {
	db *sql.DB
}

func NewNotesService(database *sql.DB) *NotesService {
	return &NotesService{database}
}

func (s *NotesService) GetNotesByTripId(tripId int64) ([]Note, error) {
	query := `
		SELECT
			n.id,
			n.trip_id,
			n.title,
			n.content
		FROM notes n
		WHERE n.trip_id = ?
	`

	rows, err := s.db.Query(query, tripId)
	if err != nil {
		return nil, fmt.Errorf("Error querying all notes for trip: %w", err)
	}
	defer rows.Close()

	var notes []Note
	var tempNote Note
	for rows.Next() {
		err := rows.Scan(
			&tempNote.ID,
			&tempNote.TripID,
			&tempNote.Title,
			&tempNote.Content,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		notes = append(notes, tempNote)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for notes list: %w", err)
	}

	return notes, nil
}

func (s *NotesService) GetNoteById(noteId int64) (Note, error) {
	query := `
		SELECT 
			n.id,
			n.trip_id,
			n.title,
			n.content
		FROM notes n
		WHERE n.id = ?
	`

	var note Note
	err := s.db.QueryRow(query, noteId).Scan(
		&note.ID,
		&note.TripID,
		&note.Title,
		&note.Content,
	)
	if err != nil {
		return Note{}, fmt.Errorf("Error scanning row: %w", err)
	}

	return note, nil
}

func (s *NotesService) CreateNoteByTripId(tripId int64, noteInput NoteInput) (int64, error) {
	query := `
		INSERT INTO notes (
			trip_id,
			title,
			content
		)
		VALUES (?, ?, ?)
		RETURNING id
	`

	var resId int64
	err := s.db.QueryRow(query,
		tripId,
		noteInput.Title,
		noteInput.Content,
	).Scan(
		&resId,
	)
	if err != nil {
		return 0, fmt.Errorf("Create note query error: %w", err)
	}

	return resId, nil
}

func (s *NotesService) UpdateNoteById(noteId int64, noteInput NoteInput) error {
	query := `
		UPDATE notes
		SET title = ?,
			content = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		noteInput.Title,
		noteInput.Content,
		noteId,
	)
	if err != nil {
		return fmt.Errorf("Update note query error: %w", err)
	}

	return nil
}

func (s *NotesService) DeleteNoteById(noteId int64) error {
	_, err := s.db.Exec(`DELETE FROM notes WHERE id = ?`, noteId)
	if err != nil {
		return fmt.Errorf("Delete note query error: %w", err)
	}
	return nil
}
