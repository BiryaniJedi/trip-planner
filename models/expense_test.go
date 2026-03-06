package models

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/BiryaniJedi/trip-planner/db"
)

// expenseSetup holds both services and a pre-created trip ID.
type expenseSetup struct {
	trips    *TripsService
	expenses *ExpensesService
	tripID   int64
}

// newExpenseSetup opens a fresh in-memory DB, migrates it, and pre-creates one trip.
func newExpenseSetup(t *testing.T) expenseSetup {
	t.Helper()
	database, err := db.NewTestDB()
	if err != nil {
		t.Fatalf("NewTestDB: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	trips := NewTripsService(database)
	expenses := NewExpensesService(database)

	tripID, err := trips.CreateTrip(TripInput{
		Name:        "Test Trip",
		Destination: "Anywhere",
		TripType:    TripTypeTravel,
	})
	if err != nil {
		t.Fatalf("setup CreateTrip: %v", err)
	}

	return expenseSetup{trips: trips, expenses: expenses, tripID: tripID}
}

// sampleExpense returns a fully-populated ExpenseInput for reuse.
func sampleExpense() ExpenseInput {
	return ExpenseInput{
		Name:     "Flight to LA",
		Category: ExpenseCatFlight,
		Amount:   35000,
		Currency: CurrencyUSD,
		Note:     "Round trip",
	}
}

// --- CreateExpenseByTripId ---

func TestCreateExpense_returnsID(t *testing.T) {
	s := newExpenseSetup(t)

	id, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}
	if id <= 0 {
		t.Errorf("expected id > 0, got %d", id)
	}
}

func TestCreateExpense_fieldsRoundTrip(t *testing.T) {
	s := newExpenseSetup(t)
	in := sampleExpense()

	id, err := s.expenses.CreateExpenseByTripId(s.tripID, in)
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}

	got, err := s.expenses.GetExpenseById(id)
	if err != nil {
		t.Fatalf("GetExpenseById: %v", err)
	}

	if got.TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got.TripID, s.tripID)
	}
	if got.Name != in.Name {
		t.Errorf("Name: got %q, want %q", got.Name, in.Name)
	}
	if got.Category != in.Category {
		t.Errorf("Category: got %q, want %q", got.Category, in.Category)
	}
	if got.Amount != in.Amount {
		t.Errorf("Amount: got %d, want %d", got.Amount, in.Amount)
	}
	if got.Currency != in.Currency {
		t.Errorf("Currency: got %q, want %q", got.Currency, in.Currency)
	}
	if got.Note != in.Note {
		t.Errorf("Note: got %q, want %q", got.Note, in.Note)
	}
}

func TestCreateExpense_idsAreUnique(t *testing.T) {
	s := newExpenseSetup(t)

	id1, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("first CreateExpenseByTripId: %v", err)
	}
	id2, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("second CreateExpenseByTripId: %v", err)
	}
	if id1 == id2 {
		t.Errorf("expected unique IDs, both got %d", id1)
	}
}

// --- GetExpensesByTripId ---

func TestGetExpensesByTripId_empty(t *testing.T) {
	s := newExpenseSetup(t)

	expenses, err := s.expenses.GetExpensesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetExpensesByTripId: %v", err)
	}
	if len(expenses) != 0 {
		t.Errorf("expected 0 expenses, got %d", len(expenses))
	}
}

func TestGetExpensesByTripId_returnsAll(t *testing.T) {
	s := newExpenseSetup(t)

	inputs := []ExpenseInput{
		{Name: "Flight", Category: ExpenseCatFlight, Amount: 50000, Currency: CurrencyUSD},
		{Name: "Hotel", Category: ExpenseCatHotel, Amount: 20000, Currency: CurrencyUSD},
		{Name: "Food", Category: ExpenseCatFood, Amount: 5000, Currency: CurrencyEUR},
	}
	for _, in := range inputs {
		if _, err := s.expenses.CreateExpenseByTripId(s.tripID, in); err != nil {
			t.Fatalf("CreateExpenseByTripId %q: %v", in.Name, err)
		}
	}

	got, err := s.expenses.GetExpensesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetExpensesByTripId: %v", err)
	}
	if len(got) != len(inputs) {
		t.Errorf("expected %d expenses, got %d", len(inputs), len(got))
	}
}

func TestGetExpensesByTripId_isolatedByTrip(t *testing.T) {
	s := newExpenseSetup(t)

	// Create a second trip and add expenses to both.
	otherTripID, err := s.trips.CreateTrip(TripInput{Name: "Other Trip", Destination: "Elsewhere", TripType: TripTypeOther})
	if err != nil {
		t.Fatalf("CreateTrip (other): %v", err)
	}

	if _, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense()); err != nil {
		t.Fatalf("CreateExpenseByTripId (tripID): %v", err)
	}
	if _, err := s.expenses.CreateExpenseByTripId(otherTripID, sampleExpense()); err != nil {
		t.Fatalf("CreateExpenseByTripId (otherTripID): %v", err)
	}

	got, err := s.expenses.GetExpensesByTripId(s.tripID)
	if err != nil {
		t.Fatalf("GetExpensesByTripId: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected 1 expense for tripID, got %d", len(got))
	}
	if got[0].TripID != s.tripID {
		t.Errorf("TripID: got %d, want %d", got[0].TripID, s.tripID)
	}
}

// --- GetExpenseById ---

func TestGetExpenseById(t *testing.T) {
	s := newExpenseSetup(t)

	id, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}

	got, err := s.expenses.GetExpenseById(id)
	if err != nil {
		t.Fatalf("GetExpenseById: %v", err)
	}
	if got.ID != id {
		t.Errorf("ID: got %d, want %d", got.ID, id)
	}
}

func TestGetExpenseById_notFound(t *testing.T) {
	s := newExpenseSetup(t)

	_, err := s.expenses.GetExpenseById(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- UpdateExpenseById ---

func TestUpdateExpenseById(t *testing.T) {
	s := newExpenseSetup(t)

	id, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}

	updated := ExpenseInput{
		Name:     "Hotel Upgrade",
		Category: ExpenseCatHotel,
		Amount:   80000,
		Currency: CurrencyGBP,
		Note:     "Switched to suite",
	}

	if err := s.expenses.UpdateExpenseById(id, updated); err != nil {
		t.Fatalf("UpdateExpenseById: %v", err)
	}

	got, err := s.expenses.GetExpenseById(id)
	if err != nil {
		t.Fatalf("GetExpenseById after update: %v", err)
	}
	if got.Name != updated.Name {
		t.Errorf("Name: got %q, want %q", got.Name, updated.Name)
	}
	if got.Category != updated.Category {
		t.Errorf("Category: got %q, want %q", got.Category, updated.Category)
	}
	if got.Amount != updated.Amount {
		t.Errorf("Amount: got %d, want %d", got.Amount, updated.Amount)
	}
	if got.Currency != updated.Currency {
		t.Errorf("Currency: got %q, want %q", got.Currency, updated.Currency)
	}
	if got.Note != updated.Note {
		t.Errorf("Note: got %q, want %q", got.Note, updated.Note)
	}
}

func TestUpdateExpenseById_nonExistentIsNoOp(t *testing.T) {
	s := newExpenseSetup(t)

	err := s.expenses.UpdateExpenseById(999, sampleExpense())
	if err != nil {
		t.Errorf("expected no error updating non-existent expense, got %v", err)
	}
}

// --- DeleteExpenseById ---

func TestDeleteExpenseById(t *testing.T) {
	s := newExpenseSetup(t)

	id, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}

	if err := s.expenses.DeleteExpenseById(id); err != nil {
		t.Fatalf("DeleteExpenseById: %v", err)
	}

	_, err = s.expenses.GetExpenseById(id)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows after delete, got %v", err)
	}
}

func TestDeleteExpenseById_isIdempotent(t *testing.T) {
	s := newExpenseSetup(t)

	if err := s.expenses.DeleteExpenseById(999); err != nil {
		t.Errorf("expected no error deleting non-existent expense, got %v", err)
	}
}

func TestDeleteExpenseById_doesNotDeleteOtherExpenses(t *testing.T) {
	s := newExpenseSetup(t)

	id1, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId (1): %v", err)
	}
	id2, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId (2): %v", err)
	}

	if err := s.expenses.DeleteExpenseById(id1); err != nil {
		t.Fatalf("DeleteExpenseById: %v", err)
	}

	if _, err := s.expenses.GetExpenseById(id2); err != nil {
		t.Errorf("sibling expense should still exist after deleting id1: %v", err)
	}
}

// --- CASCADE delete ---

func TestDeleteTrip_cascadesExpenses(t *testing.T) {
	s := newExpenseSetup(t)

	expID, err := s.expenses.CreateExpenseByTripId(s.tripID, sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpenseByTripId: %v", err)
	}

	if err := s.trips.DeleteTripById(s.tripID); err != nil {
		t.Fatalf("DeleteTripById: %v", err)
	}

	_, err = s.expenses.GetExpenseById(expID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected expense to be cascade-deleted with trip, got %v", err)
	}
}
