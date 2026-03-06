package models

import (
	"encoding/json"
	"regexp"
	"strings"
	"testing"
)

// ── Helpers ───────────────────────────────────────────────────────────────────

// sampleAIRequest returns a fully-populated TripAIRequest for reuse across tests.
func sampleAIRequest() TripAIRequest {
	return TripAIRequest{
		TripName:        "Paris Adventure",
		Destination:     "Paris, France",
		StartingAirport: "LAX",
		StartDate:       "2025-07-14",
		EndDate:         "2025-07-21",
		TripType:        TripTypeTravel,
		StayType:        "hotel",
		RentalCar:       true,
		NumPeople:       2,
	}
}

// sampleValidResponseJSON is a well-formed AI response covering all 6 fields.
// ParseAIResponse must be able to unmarshal this without error.
const sampleValidResponseJSON = `{
  "trip_name": "Paris Summer Adventure",
  "need_visa": false,
  "expenses": [
    {"name": "Round Trip Flight LAX to Paris", "category": "flight", "amount": 75000, "currency": "USD", "note": "Economy class"},
    {"name": "Hotel 7 nights", "category": "hotel", "amount": 84000, "currency": "USD", "note": "Central Paris"}
  ],
  "links": [
    {"name": "Google Flights", "url": "https://flights.google.com"},
    {"name": "Booking.com", "url": "https://www.booking.com"}
  ],
  "notes": [
    {"title": "Visa Requirements", "content": "No visa needed for stays under 90 days."}
  ],
  "itinerary": [
    {"date": "2025-07-14", "time": "09:00", "title": "Arrive at CDG", "description": "Take RER B to city centre."},
    {"date": "2025-07-14", "time": "14:00", "title": "Eiffel Tower visit", "description": "Book tickets in advance."},
    {"date": "2025-07-15", "time": "09:00", "title": "Louvre Museum", "description": ""},
    {"date": "2025-07-15", "time": "19:30", "title": "Dinner at Le Marais", "description": "Reservation recommended."}
  ]
}`

var (
	dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	timeRe = regexp.MustCompile(`^\d{2}:\d{2}$`)
)

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — Data Structures
// These tests verify that TripAIRequest, AITripPlan, and TripPlannerAI are
// defined with the correct fields and JSON tags.
// ═══════════════════════════════════════════════════════════════════════════════

// TestAIRequestJSONTags verifies that every required JSON key is present when
// TripAIRequest is marshaled. This catches missing or misspelled json tags.
func TestAIRequestJSONTags(t *testing.T) {
	req := sampleAIRequest()

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("json.Marshal(TripAIRequest): %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}

	required := []string{
		"trip_name",
		"destination",
		"starting_airport",
		"start_date",
		"end_date",
		"trip_type",
		"stay_type",
		"rental_car",
		"num_people",
	}
	for _, key := range required {
		if _, ok := m[key]; !ok {
			t.Errorf("TripAIRequest JSON is missing field %q — add json:\"%s\" tag to the field", key, key)
		}
	}
}

// TestAIRequestNoDurationDays ensures the old DurationDays field is not present.
// The AI needs real dates so it can assign them to itinerary events.
func TestAIRequestNoDurationDays(t *testing.T) {
	req := sampleAIRequest()

	data, _ := json.Marshal(req)
	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, prohibited := range []string{"duration_days", "DurationDays"} {
		if _, ok := m[prohibited]; ok {
			t.Errorf("TripAIRequest must not have field %q — use start_date + end_date instead", prohibited)
		}
	}
}

// TestAIRequestTripTypeField verifies that TripType uses the TripType type
// (not a plain string) by confirming a valid TripType value survives a round-trip.
func TestAIRequestTripTypeField(t *testing.T) {
	req := sampleAIRequest()
	req.TripType = TripTypeFestival

	data, _ := json.Marshal(req)
	var back TripAIRequest
	if err := json.Unmarshal(data, &back); err != nil {
		t.Fatalf("round-trip unmarshal: %v", err)
	}
	if back.TripType != TripTypeFestival {
		t.Errorf("TripType: got %q, want %q", back.TripType, TripTypeFestival)
	}
}

// TestAITripPlanJSONTags verifies that all six fields of AITripPlan have
// the correct JSON tags.
func TestAITripPlanJSONTags(t *testing.T) {
	plan := AITripPlan{
		TripName: "Test Trip",
		NeedVisa: true,
		Expenses: []ExpenseInput{
			{Name: "Flight", Category: ExpenseCatFlight, Amount: 50000, Currency: CurrencyUSD, Note: ""},
		},
		Links: []LinkInput{
			{Name: "Flights", Url: "https://flights.google.com"},
		},
		Notes: []NoteInput{
			{Title: "Tip", Content: "Pack light."},
		},
		Itinerary: []ItineraryInput{
			{Date: "2025-07-14", Time: "09:00", Title: "Arrive", Description: ""},
		},
	}

	data, err := json.Marshal(plan)
	if err != nil {
		t.Fatalf("json.Marshal(AITripPlan): %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}

	required := []string{"trip_name", "need_visa", "expenses", "links", "notes", "itinerary"}
	for _, key := range required {
		if _, ok := m[key]; !ok {
			t.Errorf("AITripPlan JSON is missing field %q — add json:\"%s\" tag", key, key)
		}
	}
}

// TestAITripPlanItineraryUsesItineraryInput confirms that AITripPlan.Itinerary
// is typed as []ItineraryInput (not a new anonymous or separate type) by
// assigning one from the existing service and checking it compiles + round-trips.
func TestAITripPlanItineraryUsesItineraryInput(t *testing.T) {
	event := ItineraryInput{
		Date:        "2025-07-14",
		Time:        "09:00",
		Title:       "Coffee",
		Description: "Try the almond croissant",
	}
	plan := AITripPlan{
		Itinerary: []ItineraryInput{event},
	}

	data, _ := json.Marshal(plan)
	var back AITripPlan
	if err := json.Unmarshal(data, &back); err != nil {
		t.Fatalf("round-trip unmarshal: %v", err)
	}
	if len(back.Itinerary) != 1 {
		t.Fatalf("expected 1 itinerary event, got %d", len(back.Itinerary))
	}
	if back.Itinerary[0].Title != event.Title {
		t.Errorf("Title: got %q, want %q", back.Itinerary[0].Title, event.Title)
	}
}

// TestPlannerInterfaceExists is a compile-time assertion.
// If TripPlannerAI is not defined in this package, this file will not compile.
func TestPlannerInterfaceExists(t *testing.T) {
	var _ TripPlannerAI // if this line won't compile, define the interface
	t.Log("TripPlannerAI interface is defined")
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — Mock AI Planner
// These tests verify that MockTripPlanner satisfies TripPlannerAI and returns
// valid, realistic hardcoded data including an itinerary.
// ═══════════════════════════════════════════════════════════════════════════════

// Compile-time interface satisfaction check.
// If *MockTripPlanner does not implement TripPlannerAI, this won't compile.
var _ TripPlannerAI = (*MockTripPlanner)(nil)

func TestMockPlannerReturnsTripName(t *testing.T) {
	m := &MockTripPlanner{}
	plan, err := m.GenerateTripPlan(sampleAIRequest())
	if err != nil {
		t.Fatalf("GenerateTripPlan: %v", err)
	}
	if strings.TrimSpace(plan.TripName) == "" {
		t.Errorf("expected non-empty TripName got %s", plan.TripName)
	}
}

func TestMockPlannerReturnsExpenses(t *testing.T) {
	m := &MockTripPlanner{}
	plan, err := m.GenerateTripPlan(sampleAIRequest())
	if err != nil {
		t.Fatalf("GenerateTripPlan: %v", err)
	}
	if len(plan.Expenses) < 3 {
		t.Errorf("expected at least 3 expenses, got %d", len(plan.Expenses))
	}
}

func TestMockPlannerExpensesHaveValidCategories(t *testing.T) {
	valid := map[ExpenseCat]bool{
		ExpenseCatFlight:   true,
		ExpenseCatHotel:    true,
		ExpenseCatCar:      true,
		ExpenseCatFestival: true,
		ExpenseCatFood:     true,
		ExpenseCatActivity: true,
		ExpenseCatOther:    true,
	}
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Expenses {
		if !valid[e.Category] {
			t.Errorf("expense[%d]: invalid category %q — must be one of the ExpenseCat constants", i, e.Category)
		}
	}
}

func TestMockPlannerExpensesHaveValidCurrencies(t *testing.T) {
	valid := map[Currency]bool{
		CurrencyUSD: true,
		CurrencyEUR: true,
		CurrencyGBP: true,
	}
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Expenses {
		if !valid[e.Currency] {
			t.Errorf("expense[%d]: invalid currency %q — must be one of the Currency constants", i, e.Currency)
		}
	}
}

func TestMockPlannerExpensesHavePositiveAmounts(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Expenses {
		if e.Amount <= 0 {
			t.Errorf("expense[%d] %q: amount must be > 0 (in cents), got %d", i, e.Name, e.Amount)
		}
	}
}

func TestMockPlannerReturnsLinks(t *testing.T) {
	m := &MockTripPlanner{}
	plan, err := m.GenerateTripPlan(sampleAIRequest())
	if err != nil {
		t.Fatalf("GenerateTripPlan: %v", err)
	}
	if len(plan.Links) < 2 {
		t.Errorf("expected at least 2 links, got %d", len(plan.Links))
	}
}

func TestMockPlannerLinksHaveHTTPS(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, l := range plan.Links {
		if !strings.HasPrefix(l.Url, "https://") {
			t.Errorf("link[%d] %q: URL must start with https://, got %q", i, l.Name, l.Url)
		}
	}
}

func TestMockPlannerLinksHaveNames(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, l := range plan.Links {
		if strings.TrimSpace(l.Name) == "" {
			t.Errorf("link[%d]: Name must not be empty", i)
		}
	}
}

func TestMockPlannerReturnsNotes(t *testing.T) {
	m := &MockTripPlanner{}
	plan, err := m.GenerateTripPlan(sampleAIRequest())
	if err != nil {
		t.Fatalf("GenerateTripPlan: %v", err)
	}
	if len(plan.Notes) < 1 {
		t.Errorf("expected at least 1 note, got %d", len(plan.Notes))
	}
}

func TestMockPlannerNotesHaveTitles(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, n := range plan.Notes {
		if strings.TrimSpace(n.Title) == "" {
			t.Errorf("note[%d]: Title must not be empty", i)
		}
	}
}

func TestMockPlannerReturnsItinerary(t *testing.T) {
	m := &MockTripPlanner{}
	plan, err := m.GenerateTripPlan(sampleAIRequest())
	if err != nil {
		t.Fatalf("GenerateTripPlan: %v", err)
	}
	if len(plan.Itinerary) < 4 {
		t.Errorf("expected at least 4 itinerary events, got %d", len(plan.Itinerary))
	}
}

func TestMockPlannerItinerarySpansMultipleDays(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	dates := make(map[string]bool)
	for _, e := range plan.Itinerary {
		dates[e.Date] = true
	}
	if len(dates) < 2 {
		t.Errorf("expected itinerary events across at least 2 distinct dates, got %d: %v", len(dates), dates)
	}
}

func TestMockPlannerItineraryDatesAreYYYYMMDD(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Itinerary {
		if !dateRe.MatchString(e.Date) {
			t.Errorf("itinerary[%d]: Date %q is not YYYY-MM-DD format", i, e.Date)
		}
	}
}

func TestMockPlannerItineraryTimesAreHHMM(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Itinerary {
		if !timeRe.MatchString(e.Time) {
			t.Errorf("itinerary[%d]: Time %q is not HH:MM format", i, e.Time)
		}
	}
}

func TestMockPlannerItineraryTitlesNonEmpty(t *testing.T) {
	m := &MockTripPlanner{}
	plan, _ := m.GenerateTripPlan(sampleAIRequest())

	for i, e := range plan.Itinerary {
		if strings.TrimSpace(e.Title) == "" {
			t.Errorf("itinerary[%d]: Title must not be empty", i)
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — BuildPrompt and ParseAIResponse
// These test the two exported helpers in openai_planner.go without making any
// real API calls.
// ═══════════════════════════════════════════════════════════════════════════════

// ── BuildPrompt tests ─────────────────────────────────────────────────────────

func TestBuildPromptContainsDestination(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, req.Destination) {
		t.Errorf("prompt does not contain destination %q", req.Destination)
	}
}

func TestBuildPromptContainsAirportCode(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, req.StartingAirport) {
		t.Errorf("prompt does not contain starting airport %q", req.StartingAirport)
	}
}

func TestBuildPromptContainsStartDate(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, req.StartDate) {
		t.Errorf("prompt does not contain start_date %q", req.StartDate)
	}
}

func TestBuildPromptContainsEndDate(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, req.EndDate) {
		t.Errorf("prompt does not contain end_date %q", req.EndDate)
	}
}

func TestBuildPromptContainsTripType(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, string(req.TripType)) {
		t.Errorf("prompt does not contain trip_type %q", req.TripType)
	}
}

func TestBuildPromptContainsStayType(t *testing.T) {
	req := sampleAIRequest()
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, req.StayType) {
		t.Errorf("prompt does not contain stay_type %q", req.StayType)
	}
}

func TestBuildPromptContainsNumPeople(t *testing.T) {
	req := sampleAIRequest()
	req.NumPeople = 4
	prompt := BuildPrompt(req)
	if !strings.Contains(prompt, "4") {
		t.Errorf("prompt does not contain num_people value 4")
	}
}

func TestBuildPromptMentionsCents(t *testing.T) {
	prompt := BuildPrompt(sampleAIRequest())
	if !strings.Contains(strings.ToLower(prompt), "cents") {
		t.Error("prompt must mention 'cents' so the AI knows amounts are integers not decimals")
	}
}

func TestBuildPromptMentionsItinerary(t *testing.T) {
	prompt := BuildPrompt(sampleAIRequest())
	if !strings.Contains(strings.ToLower(prompt), "itinerary") {
		t.Error("prompt must mention 'itinerary' to instruct the AI to generate day-by-day events")
	}
}

func TestBuildPromptMentionsRentalCar(t *testing.T) {
	req := sampleAIRequest()
	req.RentalCar = true
	prompt := BuildPrompt(req)
	lower := strings.ToLower(prompt)
	if !strings.Contains(lower, "rental") && !strings.Contains(lower, "car") {
		t.Error("prompt does not mention rental car status — include it so the AI adds a car expense when needed")
	}
}

func TestBuildPromptIsNonEmpty(t *testing.T) {
	prompt := BuildPrompt(sampleAIRequest())
	if strings.TrimSpace(prompt) == "" {
		t.Error("BuildPrompt returned an empty string")
	}
}

// ── ParseAIResponse tests ─────────────────────────────────────────────────────

func TestParseAIResponseValidPlan(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse returned unexpected error: %v", err)
	}
	if plan.TripName == "" {
		t.Error("TripName should not be empty")
	}
}

func TestParseAIResponseExpenses(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	if len(plan.Expenses) == 0 {
		t.Error("expected at least one expense in parsed plan")
	}
	if plan.Expenses[0].Name == "" {
		t.Error("first expense Name should not be empty")
	}
	if plan.Expenses[0].Amount <= 0 {
		t.Error("first expense Amount should be > 0")
	}
}

func TestParseAIResponseLinks(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	if len(plan.Links) == 0 {
		t.Error("expected at least one link in parsed plan")
	}
}

func TestParseAIResponseNotes(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	if len(plan.Notes) == 0 {
		t.Error("expected at least one note in parsed plan")
	}
}

func TestParseAIResponseItinerary(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	if len(plan.Itinerary) == 0 {
		t.Error("expected itinerary events in parsed plan")
	}
}

func TestParseAIResponseItineraryFields(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	if len(plan.Itinerary) == 0 {
		t.Fatal("no itinerary events to check")
	}
	first := plan.Itinerary[0]
	if first.Date == "" {
		t.Error("itinerary event Date is empty")
	}
	if first.Time == "" {
		t.Error("itinerary event Time is empty")
	}
	if first.Title == "" {
		t.Error("itinerary event Title is empty")
	}
}

func TestParseAIResponseNeedVisa(t *testing.T) {
	plan, err := ParseAIResponse(sampleValidResponseJSON)
	if err != nil {
		t.Fatalf("ParseAIResponse: %v", err)
	}
	// sampleValidResponseJSON has need_visa: false — verify it parsed
	if plan.NeedVisa != false {
		t.Errorf("NeedVisa: got %v, want false", plan.NeedVisa)
	}
}

func TestParseAIResponseMalformedJSON(t *testing.T) {
	_, err := ParseAIResponse(`{this is not valid json`)
	if err == nil {
		t.Error("expected an error for malformed JSON, got nil")
	}
}

func TestParseAIResponseEmptyJSON(t *testing.T) {
	_, err := ParseAIResponse(``)
	if err == nil {
		t.Error("expected an error for empty input, got nil")
	}
}

func TestParseAIResponseEmptyArrays(t *testing.T) {
	raw := `{"trip_name":"Empty Trip","need_visa":false,"expenses":[],"links":[],"notes":[],"itinerary":[]}`
	plan, err := ParseAIResponse(raw)
	if err != nil {
		t.Fatalf("ParseAIResponse with empty arrays: %v", err)
	}
	if plan.TripName != "Empty Trip" {
		t.Errorf("TripName: got %q, want %q", plan.TripName, "Empty Trip")
	}
}

func TestParseAIResponseStripsLeadingWhitespace(t *testing.T) {
	padded := "\n\n  " + sampleValidResponseJSON + "  \n"
	_, err := ParseAIResponse(padded)
	if err != nil {
		t.Errorf("ParseAIResponse should handle leading/trailing whitespace: %v", err)
	}
}

func TestParseAIResponseErrorIsDescriptive(t *testing.T) {
	_, err := ParseAIResponse(`not json at all`)
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
	msg := err.Error()
	// The error should mention something about parsing or JSON — not be a raw Go internal error
	lower := strings.ToLower(msg)
	if !strings.Contains(lower, "json") && !strings.Contains(lower, "parse") && !strings.Contains(lower, "unmarshal") {
		t.Errorf("error message %q is not descriptive enough — wrap it with context like 'failed to parse AI response as JSON: ...'", msg)
	}
}
