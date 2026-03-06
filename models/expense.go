package models

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

type ExpenseCat string
type Currency string

const (
	ExpenseCatFlight   ExpenseCat = "flight"
	ExpenseCatHotel    ExpenseCat = "hotel"
	ExpenseCatCar      ExpenseCat = "car"
	ExpenseCatFestival ExpenseCat = "festival"
	ExpenseCatFood     ExpenseCat = "food"
	ExpenseCatActivity ExpenseCat = "activity"
	ExpenseCatOther    ExpenseCat = "other"
)

const (
	CurrencyUSD Currency = "USD"
	CurrencyEUR Currency = "EUR"
	CurrencyGBP Currency = "GBP"
)

type Expense struct {
	ID       int64      `json:"id"`
	TripID   int64      `json:"trip_id"`
	Name     string     `json:"name"`
	Category ExpenseCat `json:"category"`
	Amount   int64      `json:"amount"`
	Currency Currency   `json:"currency"`
	Note     string     `json:"note"`
}

type ExpenseInput struct {
	Name     string     `json:"name"`
	Category ExpenseCat `json:"category"`
	Amount   int64      `json:"amount"`
	Currency Currency   `json:"currency"`
	Note     string     `json:"note"`
}

type ExpensesService struct {
	db *sql.DB
}

func NewExpensesService(database *sql.DB) *ExpensesService {
	return &ExpensesService{database}
}

func (s *ExpensesService) GetExpensesByTripId(tripId int64) ([]Expense, error) {
	query := `
		SELECT 
			e.id,
			e.trip_id,
			e.name,
			e.category,
			e.amount,
			e.currency,
			e.note
		FROM expenses e
		WHERE e.trip_id = ?
	`
	rows, err := s.db.Query(query, tripId)
	if err != nil {
		return nil, fmt.Errorf("Error querying all expenses for trip: %w", err)
	}
	defer rows.Close()

	var expenses []Expense
	var tempExpense Expense
	for rows.Next() {
		err := rows.Scan(
			&tempExpense.ID,
			&tempExpense.TripID,
			&tempExpense.Name,
			&tempExpense.Category,
			&tempExpense.Amount,
			&tempExpense.Currency,
			&tempExpense.Note,
		)
		if err != nil {
			return nil, fmt.Errorf("Error scanning rows: %w", err)
		}

		expenses = append(expenses, tempExpense)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after queries for expenses list: %w", err)
	}

	return expenses, nil
}

func (s *ExpensesService) GetExpenseById(expenseId int64) (Expense, error) {
	query := `
		SELECT 
			e.id,
			e.trip_id,
			e.name,
			e.category,
			e.amount,
			e.currency,
			e.note
		FROM expenses e
		WHERE e.id = ?
	`

	var expense Expense
	err := s.db.QueryRow(query, expenseId).Scan(
		&expense.ID,
		&expense.TripID,
		&expense.Name,
		&expense.Category,
		&expense.Amount,
		&expense.Currency,
		&expense.Note,
	)
	if err != nil {
		return Expense{}, fmt.Errorf("Error scanning row: %w", err)
	}

	return expense, nil
}

func (s *ExpensesService) CreateExpenseByTripId(tripId int64, expenseInput ExpenseInput) (int64, error) {
	query := `
		INSERT INTO expenses (
			trip_id,
			name,
			category,
			amount,
			currency,
			note
		)
		VALUES (?, ?, ?, ?, ?, ?)
		RETURNING id
	`

	var resId int64
	err := s.db.QueryRow(query,
		tripId,
		expenseInput.Name,
		expenseInput.Category,
		expenseInput.Amount,
		expenseInput.Currency,
		expenseInput.Note,
	).Scan(
		&resId,
	)
	if err != nil {
		return 0, fmt.Errorf("Create expense query error: %w", err)
	}

	return resId, nil
}

func (s *ExpensesService) UpdateExpenseById(expenseId int64, expenseInput ExpenseInput) error {
	query := `
		UPDATE expenses
		SET name = ?,
			category = ?,
			amount = ?,
			currency = ?,
			note = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		expenseInput.Name,
		expenseInput.Category,
		expenseInput.Amount,
		expenseInput.Currency,
		expenseInput.Note,
		expenseId,
	)
	if err != nil {
		return fmt.Errorf("Update expense query error: %w", err)
	}

	return nil
}

func (s *ExpensesService) DeleteExpenseById(expenseId int64) error {
	_, err := s.db.Exec(`DELETE FROM expenses WHERE id = ?`, expenseId)
	if err != nil {
		return fmt.Errorf("Delete expense query error: %w", err)
	}
	return nil
}
