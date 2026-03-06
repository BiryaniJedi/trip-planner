package models

// OpenAIPlanner implements TripPlannerAI using the OpenAI API (gpt-4o-mini).
//
// TODO (Module 3): Implement this struct and its GenerateTripPlan method.
// Steps:
//  1. Add an APIKey string field to the struct.
//  2. Add a constructor: func NewOpenAIPlanner(apiKey string) *OpenAIPlanner
//  3. Implement GenerateTripPlan:
//     a. Call BuildPrompt(req) to get the prompt string.
//     b. POST to the OpenAI chat completions endpoint with gpt-4o-mini,
//        JSON mode enabled (response_format: {"type":"json_object"}),
//        MaxTokens: 2048.
//     c. Extract the content string from the response.
//     d. Call ParseAIResponse(content) and return the result.

type OpenAIPlanner struct {
	// TODO: add APIKey string field
}

// BuildPrompt constructs the user message sent to the LLM.
// It is exported so it can be tested independently (Module 3 tests).
//
// TODO (Module 3): Build a detailed prompt string from req that:
//   - Includes: destination, starting_airport, start_date, end_date, trip_type,
//     stay_type, num_people, rental_car status
//   - Instructs the AI to return amounts in CENTS (integer, not decimal)
//   - Instructs the AI to produce a day-by-day itinerary with date (YYYY-MM-DD)
//     and time (HH:MM) for each event
//   - Specifies the exact JSON schema to return (all 6 AITripPlan fields)
func BuildPrompt(req TripAIRequest) string {
	// TODO: build and return the prompt string
	return ""
}

// ParseAIResponse unmarshals a raw JSON string from the LLM into an AITripPlan.
// It is exported so it can be tested independently (Module 3 tests).
//
// TODO (Module 3): Implement this function:
//   - Trim leading/trailing whitespace from raw before parsing.
//   - Return a descriptive error (wrapping the json error) if unmarshaling fails.
//   - Return an error for empty input.
//   - On success, return the populated AITripPlan and nil error.
func ParseAIResponse(raw string) (AITripPlan, error) {
	// TODO: implement
	return AITripPlan{}, nil
}
