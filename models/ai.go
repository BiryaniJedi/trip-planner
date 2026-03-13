package models

import (
	"context"
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

// go test ./ ... -run "TestAIRequest\|TestAITripPlan\|TestPlannerInterface" -v -cover
// TripAIRequest holds all user-supplied parameters that are sent to the AI web searcher
type TripAIRequest struct {
	TripName        string
	Destination     string
	StartingAirport string
	DurationDays    int
	Month           string
	Year            int
	TravelerCount   int
	TravelerType    string
	Budget          string
	Interests       []string
	DietaryNeeds    string
	Mobility        string
	PassportCountry string
}

// WebSearchResult holds the raw output from Pass 1.
// RawText is the full prose the LLM wrote after browsing.
// Sources is a slice of URLs it cited inline (extracted from annotations).
type WebSearchResult struct {
	RawText string   // prose, markdown, etc. — NOT JSON
	Sources []string // "https://..." URLs collected from the response
}

// WebSearcher is implemented by anything that can run Pass 1.
// Concrete type: OpenAIWebSearcher. Mock type: MockWebSearcher.
type WebSearcher interface {
	Search(ctx context.Context, request TripAIRequest, useRealAI bool, apiKey string) (WebSearchResult, error)
}

// Structurer is implemented by anything that can run Pass 2.
// Concrete type: OpenAIStructurer. Mock type: MockStructurer.
type Structurer interface {
	GenerateTripPlan(ctx context.Context, research WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error)
}

// ── Request types ──────────────────────────────────────────────

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model          string          `json:"model"`
	Messages       []Message       `json:"messages"`
	MaxTokens      int             `json:"max_tokens"`
	Temperature    float64         `json:"temperature"`
	ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
}

type Error struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Param   string `json:"param"`
	Code    string `json:"code"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type ResponseFormat struct {
	Type string `json:"type"`
}

// ── Response types ─────────────────────────────────────────────

type Choice struct {
	Message      Message `json:"message"`
	FinishReason string  `json:"finish_reason"`
}

type ChatResponse struct {
	Choices []Choice `json:"choices" jsonschema:"required"`
	Usage   Usage    `json:"usage" jsonschema:"required"`
	Error   *Error   `json:"error,omitempty"`
}

// Generate schema from this
type AITripPlan struct {
	Trip      TripInput        `json:"trip" jsonschema:"required"`      // the core trip
	Expenses  []ExpenseInput   `json:"expenses" jsonschema:"required"`  // suggested budget breakdown
	Notes     []NoteInput      `json:"notes" jsonschema:"required"`     // suggested notes (visa info, tips, etc.)
	Links     []LinkInput      `json:"links" jsonschema:"required"`     // useful URLs from the research
	Itinerary []ItineraryInput `json:"itinerary" jsonschema:"required"` // day-by-day plan
}

type AIService struct {
	db *sql.DB
}

func NewAIServiceService(database *sql.DB) *AIService {
	// PrintAITripPlanSchema()
	return &AIService{database}
}

func (as *AIService) SearchWeb(ctx context.Context, searcher WebSearcher, tripAIInput TripAIRequest, useRealAI bool, apiKey string) (WebSearchResult, error) {
	if !useRealAI {
		mockSearcher, ok := searcher.(*MockWebSearcher)
		if !ok {
			return WebSearchResult{}, fmt.Errorf("searcher is not a MockWebSearcher, got=%T\n", searcher)
		}
		res, err := mockSearcher.Search(ctx, tripAIInput, useRealAI, apiKey)
		if err != nil {
			return WebSearchResult{}, err
		}
		return res, nil
	}

	// TODO real AI search here
	openAISearcher, ok := searcher.(*OpenAIWebSearcher)
	if !ok {
		return WebSearchResult{}, fmt.Errorf("searcher is not an OpenAIWebSearcher, got=%t\n", searcher)
	}
	res, err := openAISearcher.Search(ctx, tripAIInput, useRealAI, apiKey)
	if err != nil {
		return WebSearchResult{}, err
	}
	return res, nil
}

func (as *AIService) StructureWebResult(ctx context.Context, structurer Structurer, result WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error) {
	if !useRealAI {
		mockStructurer, ok := structurer.(*MockStructurer)
		if !ok {
			return AITripPlan{}, fmt.Errorf("structurer is not a MockStructurer, got=%T\n", structurer)
		}
		structured, err := mockStructurer.GenerateTripPlan(ctx, result, useRealAI, apiKey)
		if err != nil {
			return AITripPlan{}, fmt.Errorf("Error structuring web search result: %v", err)
		}
		return structured, nil
	}

	// TODO real structurer here
	openAIStructurer, ok := structurer.(*OpenAIStructurer)
	if !ok {
		return AITripPlan{}, fmt.Errorf("structurer is not an OpenAIStructurer, got=%t\n", structurer)
	}
	res, err := openAIStructurer.GenerateTripPlan(ctx, result, useRealAI, apiKey)
	if err != nil {
		return AITripPlan{}, err
	}
	return res, nil
}
