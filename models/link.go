package models

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
	"net/url"
)

type Link struct {
	ID     int64  `json:"id"`
	TripID int64  `json:"trip_id"`
	Name   string `json:"name"`
	Url    string `json:"url"`
}

type LinkInput struct {
	Name string `json:"name"`
	Url  string `json:"url"`
}

type LinksService struct {
	db *sql.DB
}

func NewLinksService(database *sql.DB) *LinksService {
	return &LinksService{database}
}

func isValidURL(s string) bool {
	u, err := url.ParseRequestURI(s)
	if err != nil {
		return false
	}
	return u.Scheme == "http" || u.Scheme == "https"
}

func (s *LinksService) GetLinksByTripId(tripId int64) ([]Link, error) {
	query := `
		SELECT
			l.id,
			l.trip_id,
			l.name,
			l.url
		FROM links l
		WHERE l.trip_id = ?
	`

	rows, err := s.db.Query(query, tripId)
	if err != nil {
		return nil, fmt.Errorf("Error querying all links for trip: %w", err)
	}
	defer rows.Close()

	var links []Link
	var tempLink Link
	for rows.Next() {
		err := rows.Scan(
			&tempLink.ID,
			&tempLink.TripID,
			&tempLink.Name,
			&tempLink.Url,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		links = append(links, tempLink)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for links list: %w", err)
	}

	return links, nil
}

func (s *LinksService) GetLinkById(linkId int64) (Link, error) {
	query := `
		SELECT 
			l.id,
			l.trip_id,
			l.name,
			l.url
		FROM links l
		WHERE l.id = ?
	`

	var link Link
	err := s.db.QueryRow(query, linkId).Scan(
		&link.ID,
		&link.TripID,
		&link.Name,
		&link.Url,
	)
	if err != nil {
		return Link{}, fmt.Errorf("Error scanning row: %w", err)
	}

	return link, nil
}

func (s *LinksService) CreateLinkByTripId(tripId int64, linkInput LinkInput) (int64, error) {
	if !isValidURL(linkInput.Url) {
		return 0, fmt.Errorf("invalid URL")
	}

	query := `
		INSERT INTO links (
			trip_id,
			name,
			url
		)
		VALUES (?, ?, ?)
		RETURNING id
	`

	var resId int64
	err := s.db.QueryRow(query,
		tripId,
		linkInput.Name,
		linkInput.Url,
	).Scan(
		&resId,
	)
	if err != nil {
		return 0, fmt.Errorf("Create link query error: %w", err)
	}

	return resId, nil
}

func (s *LinksService) UpdateLinkById(linkId int64, linkInput LinkInput) error {
	if !isValidURL(linkInput.Url) {
		return fmt.Errorf("invalid URL")
	}
	query := `
		UPDATE links
		SET name = ?,
			url = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		linkInput.Name,
		linkInput.Url,
		linkId,
	)
	if err != nil {
		return fmt.Errorf("Update link query error: %w", err)
	}

	return nil
}

func (s *LinksService) DeleteLinkById(linkId int64) error {
	_, err := s.db.Exec(`DELETE FROM links WHERE id = ?`, linkId)
	if err != nil {
		return fmt.Errorf("Delete link query error: %w", err)
	}
	return nil
}
