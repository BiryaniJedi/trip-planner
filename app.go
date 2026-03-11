package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	// "encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/BiryaniJedi/trip-planner/models"
)

type App struct {
	ctx                context.Context
	tripsService       *models.TripsService
	expensesService    *models.ExpensesService
	notesService       *models.NotesService
	linksService       *models.LinksService
	photosService      *models.PhotosService
	itinerariesService *models.ItinerariesService
	aiService          *models.AIService
	mockWebSearcher    *models.MockWebSearcher
}

func NewApp(db *sql.DB, photoDir string) *App {
	return &App{
		tripsService:       models.NewTripsService(db),
		expensesService:    models.NewExpensesService(db),
		notesService:       models.NewNotesService(db),
		linksService:       models.NewLinksService(db),
		photosService:      models.NewPhotosService(db, photoDir),
		itinerariesService: models.NewItinerariesService(db),
		aiService:          models.NewAIServiceService(db),
		mockWebSearcher:    &models.MockWebSearcher{},
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// b, _ := json.MarshalIndent(models.AITripPlanSchema, "", "  ")
	// fmt.Println("AITripPlanSchema:")
	// fmt.Println(string(b))
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

// PickPhotoFile opens a native file picker and returns the selected path.
// Returns an empty string if the user cancels.
func (a *App) PickPhotoFile() (string, error) {
	path, err := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select Photo",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Images (*.jpg, *.jpeg, *.png, *.gif, *.webp, *.heic)", Pattern: "*.jpg;*.jpeg;*.png;*.gif;*.webp;*.heic"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// GetPhotoBase64 reads a stored photo from disk and returns it as a base64 data URL
// suitable for use directly in an <img src="..."> element.
func (a *App) GetPhotoBase64(photoId int64) (string, error) {
	photo, err := a.photosService.GetPhotoById(photoId)
	if err != nil {
		return "", err
	}
	diskPath := a.photosService.PhotoPath(photo.TripID, photo.Filename)
	data, err := os.ReadFile(diskPath)
	if err != nil {
		return "", fmt.Errorf("reading photo file: %w", err)
	}
	ext := strings.ToLower(filepath.Ext(diskPath))
	mime := "image/jpeg"
	switch ext {
	case ".png":
		mime = "image/png"
	case ".gif":
		mime = "image/gif"
	case ".webp":
		mime = "image/webp"
	case ".heic":
		mime = "image/heic"
	}
	return "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(data), nil
}

// ── Itineraries ────────────────────────────────────────────────────────────

func (a *App) GetItinerariesByTripId(tripId int64) ([]models.Itinerary, error) {
	return a.itinerariesService.GetItinerariesByTripId(tripId)
}

func (a *App) GetItineraryById(itineraryId int64) (models.Itinerary, error) {
	return a.itinerariesService.GetItineraryById(itineraryId)
}

func (a *App) CreateItineraryByTripId(tripId int64, input models.ItineraryInput) (int64, error) {
	return a.itinerariesService.CreateItineraryByTripId(tripId, input)
}

func (a *App) UpdateItineraryById(itineraryId int64, input models.ItineraryInput) error {
	return a.itinerariesService.UpdateItineraryById(itineraryId, input)
}

func (a *App) DeleteItineraryById(itineraryId int64) error {
	return a.itinerariesService.DeleteItineraryById(itineraryId)
}

// AI

func (a *App) GetWebSearchTrip() (models.WebSearchResult, error) {
	data, err := a.aiService.SearchWeb(a.mockWebSearcher)
	if err != nil {
		return models.WebSearchResult{}, err
	}
	return data, nil
}
