package models

import (
	"context"
	"fmt"
	"strings"
)

// MockTripPlanner is a deterministic, no-network implementation of TripPlannerAI.
// It is used during development and in tests so you can build the full UI flow
// without spending API credits or needing an internet connection.
//
// The compile-time guard in ai_test.go ensures this always satisfies the interface:
var _ *MockStructurer = (*MockStructurer)(nil)

type MockStructurer struct{}

// GenerateTripPlan returns a realistic hardcoded AITripPlan.
//
// TODO (Module 2): Return a fully-populated AITripPlan that satisfies ALL of
// the following test requirements:
//
//   - TripName        non-empty string
//   - Expenses        at least 3 items; valid categories + currencies; amounts > 0 (in cents)
//   - Links           at least 2 items; all URLs start with "https://"; all Names non-empty
//   - Notes           at least 1 item; all Titles non-empty
//   - Itinerary       at least 4 events; spans ≥ 2 distinct dates; dates in YYYY-MM-DD format;
//     times in HH:MM format; all Titles non-empty
//
// Use the ExpenseCat*, Currency*, and ItineraryInput constants/types from their
// respective model files. Amounts are in cents (e.g. $750.00 → 75000).
//
//	type AITripPlan struct {
//		TripName  string           `json:"trip_name"`
//		NeedVisa  bool             `json:"need_visa"`
//		Expenses  []ExpenseInput   `json:"expenses"`
//		Links     []LinkInput      `json:"links"`
//		Notes     []NoteInput      `json:"notes"`
//		Itinerary []ItineraryInput `json:"itinerary"`
//	}
func (m *MockStructurer) GenerateTripPlan(ctx context.Context, result WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error) {
	if strings.TrimSpace(result.RawText) == "" {
		return AITripPlan{}, fmt.Errorf("result.RawText cannot be empty")
	}
	plans := []AITripPlan{
		{
			Trip: TripInput{
				Name:        "Mumbai 2026",
				Destination: "Mumbai, India",
				StartDate:   "2026-06-01",
				EndDate:     "2026-06-15",
				NeedVisa:    true,
				TripType:    TripTypeTravel,
			},
			Expenses: []ExpenseInput{
				{
					Name:     "Flight",
					Category: ExpenseCatFlight,
					Amount:   100000,
					Currency: CurrencyUSD,
					Note:     "",
				},
				{
					Name:     "Food (estimate)",
					Category: ExpenseCatFood,
					Amount:   50000,
					Currency: CurrencyUSD,
					Note:     "estimate",
				},
				{
					Name:     "Taj Mahal Tour",
					Category: ExpenseCatActivity,
					Amount:   10000,
					Currency: CurrencyUSD,
					Note:     "",
				},
			},
			Links: []LinkInput{
				{
					Name: "Flights to Mumbai",
					Url:  "https://www.google.com/travel/flights/search?tfs=CBwQAhojEgoyMDI2LTA1LTA0agwIAhIIL20vMGhwdG1yBwgBEgNCT00aIxIKMjAyNi0wNS0xNGoHCAESA0JPTXIMCAISCC9tLzBocHRtQAFIAXABggELCP___________wGYAQE&hl=en-US&gl=US",
				},
				{
					Name: "Surprise",
					Url:  result.Sources[0],
				},
			},
			Notes: []NoteInput{
				{
					Title:   "Restaurants",
					Content: "The Dhaba, Satkar, Rajmata vada pav",
				},
			},
			Itinerary: []ItineraryInput{
				{
					Date:        "2026-05-04",
					Time:        "06:30",
					Title:       "Flight",
					Description: "Leaves at 6:30, boarding at 5:45",
				},
				{
					Date:        "2026-05-04",
					Time:        "09:00",
					Title:       "Land",
					Description: "Time difference 10.5 hours",
				},
				{
					Date:        "2026-05-04",
					Time:        "11:00",
					Title:       "Reach home",
					Description: "Staying with family",
				},
				{
					Date:        "2026-05-05",
					Time:        "09:30",
					Title:       "Breakfast @ SomeCafe",
					Description: "Popular cafe in mumbai",
				},
			},
		},
	}
	return plans[0], nil
}
