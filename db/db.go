package db

import (
	"database/sql"
	_ "embed"
	"fmt"
	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
	"os"
)

// DB is the global database connection

//go:embed schema.sql
var schema string

// Init opens the SQLite database specified in .env and runs migrations.
// Creates the file if it doesn't exist.
func Init() (*sql.DB, error) {
	godotenv.Load()
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "trips.db"
	}
	db, err := sql.Open("sqlite", dbPath)

	if err != nil {
		return nil, fmt.Errorf("Error opening database connection: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

	//Propogate error up from migrate
	if err = migrate(db); err != nil {
		return nil, err
	}

	return db, nil
}

// migrate creates tables if they don't exist
func migrate(database *sql.DB) error {
	// TODO: execute the schema SQL
	pragmas := `
		PRAGMA journal_mode = WAL;
		PRAGMA foreign_keys = ON;
		PRAGMA busy_timeout = 5000;
	`
	if _, err := database.Exec(pragmas); err != nil {
		return fmt.Errorf("Error executing these pragmas:\n-t%s\nError: %w", pragmas, err)
	}

	if _, err := database.Exec(schema); err != nil {
		return fmt.Errorf("Error executing schema.sql: %w", err)
	}

	return nil
}
