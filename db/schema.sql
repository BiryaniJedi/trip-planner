CREATE TABLE IF NOT EXISTS trips (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date  TEXT,
    end_date    TEXT,
    trip_type   TEXT NOT NULL DEFAULT 'travel' CHECK(trip_type IN ('travel', 'festival', 'roadtrip', 'other')),
    need_visa   BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount      REAL NOT NULL DEFAULT 0,
    currency    TEXT NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD', 'EUR', 'GBP')),
    url         TEXT,
    notes       TEXT
);

CREATE TABLE IF NOT EXISTS photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    caption     TEXT
);

CREATE TABLE IF NOT EXISTS notes (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);
