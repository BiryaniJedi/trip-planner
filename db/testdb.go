package db

import (
	"database/sql"
	"fmt"
)

// NewTestDB opens an in-memory SQLite database and runs the schema.
// Use this in tests to get an isolated, fully-migrated DB.
func NewTestDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("open in-memory db: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err = migrate(db); err != nil {
		return nil, fmt.Errorf("migrate test db: %w", err)
	}

	return db, nil
}
