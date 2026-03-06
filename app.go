package main

import (
	"context"
	"database/sql"

	"github.com/BiryaniJedi/trip-planner/models"
)

type App struct {
	ctx             context.Context
	tripsService    *models.TripsService
	expensesService *models.ExpensesService
	notesService    *models.NotesService
	linksService    *models.LinksService
	photosService   *models.PhotosService
}

func NewApp(db *sql.DB, photoDir string) *App {
	return &App{
		tripsService:    models.NewTripsService(db),
		expensesService: models.NewExpensesService(db),
		notesService:    models.NewNotesService(db),
		linksService:    models.NewLinksService(db),
		photosService:   models.NewPhotosService(db, photoDir),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Ping() string {
	return "pong"
}

// ── Trips ──────────────────────────────────────────────────────────────────

func (a *App) GetAllTrips() ([]models.Trip, error) {
	return a.tripsService.GetAllTrips()
}

func (a *App) GetTripByID(id int64) (models.Trip, error) {
	return a.tripsService.GetTripByID(id)
}

func (a *App) CreateTrip(input models.TripInput) (int64, error) {
	return a.tripsService.CreateTrip(input)
}

func (a *App) UpdateTripById(id int64, input models.TripInput) error {
	return a.tripsService.UpdateTripById(id, input)
}

// DeleteTripById cleans up photo files from disk before deleting the trip.
// The DB rows for photos, expenses, notes, and links are removed by CASCADE.
func (a *App) DeleteTripById(id int64) error {
	if err := a.photosService.DeleteAllPhotosByTripId(id); err != nil {
		return err
	}
	return a.tripsService.DeleteTripById(id)
}

// ── Expenses ───────────────────────────────────────────────────────────────

func (a *App) GetExpensesByTripId(tripId int64) ([]models.Expense, error) {
	return a.expensesService.GetExpensesByTripId(tripId)
}

func (a *App) GetExpenseById(expenseId int64) (models.Expense, error) {
	return a.expensesService.GetExpenseById(expenseId)
}

func (a *App) CreateExpenseByTripId(tripId int64, input models.ExpenseInput) (int64, error) {
	return a.expensesService.CreateExpenseByTripId(tripId, input)
}

func (a *App) UpdateExpenseById(expenseId int64, input models.ExpenseInput) error {
	return a.expensesService.UpdateExpenseById(expenseId, input)
}

func (a *App) DeleteExpenseById(expenseId int64) error {
	return a.expensesService.DeleteExpenseById(expenseId)
}

// ── Notes ──────────────────────────────────────────────────────────────────

func (a *App) GetNotesByTripId(tripId int64) ([]models.Note, error) {
	return a.notesService.GetNotesByTripId(tripId)
}

func (a *App) GetNoteById(noteId int64) (models.Note, error) {
	return a.notesService.GetNoteById(noteId)
}

func (a *App) CreateNoteByTripId(tripId int64, input models.NoteInput) (int64, error) {
	return a.notesService.CreateNoteByTripId(tripId, input)
}

func (a *App) UpdateNoteById(noteId int64, input models.NoteInput) error {
	return a.notesService.UpdateNoteById(noteId, input)
}

func (a *App) DeleteNoteById(noteId int64) error {
	return a.notesService.DeleteNoteById(noteId)
}

// ── Links ──────────────────────────────────────────────────────────────────

func (a *App) GetLinksByTripId(tripId int64) ([]models.Link, error) {
	return a.linksService.GetLinksByTripId(tripId)
}

func (a *App) GetLinkById(linkId int64) (models.Link, error) {
	return a.linksService.GetLinkById(linkId)
}

func (a *App) CreateLinkByTripId(tripId int64, input models.LinkInput) (int64, error) {
	return a.linksService.CreateLinkByTripId(tripId, input)
}

func (a *App) UpdateLinkById(linkId int64, input models.LinkInput) error {
	return a.linksService.UpdateLinkById(linkId, input)
}

func (a *App) DeleteLinkById(linkId int64) error {
	return a.linksService.DeleteLinkById(linkId)
}

// ── Photos ─────────────────────────────────────────────────────────────────

func (a *App) GetPhotosByTripId(tripId int64) ([]models.Photo, error) {
	return a.photosService.GetPhotosByTripId(tripId)
}

func (a *App) GetPhotoById(photoId int64) (models.Photo, error) {
	return a.photosService.GetPhotoById(photoId)
}

func (a *App) AddPhoto(tripId int64, sourcePath, caption string) (int64, error) {
	return a.photosService.AddPhoto(tripId, sourcePath, caption)
}

func (a *App) UpdateCaptionByPhotoId(photoId int64, caption string) error {
	return a.photosService.UpdateCaptionByPhotoId(photoId, caption)
}

func (a *App) DeletePhotoById(photoId int64) error {
	return a.photosService.DeletePhotoById(photoId)
}

func (a *App) DeleteAllPhotosByTripId(tripId int64) error {
	return a.photosService.DeleteAllPhotosByTripId(tripId)
}
