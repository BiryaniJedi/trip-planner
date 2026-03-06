package models

// go test ./ ... -run "TestAIRequest\|TestAITripPlan\|TestPlannerInterface" -v -cover
// TripAIRequest holds all user-supplied parameters that are sent to the AI.
// It is serialized to JSON to build the prompt context.
type TripAIRequest struct {
	TripName        string   `json:"trip_name"`
	Destination     string   `json:"destination"`
	StartingAirport string   `json:"starting_airport"`
	StartDate       string   `json:"start_date"`
	EndDate         string   `json:"end_date"`
	TripType        TripType `json:"trip_type"`
	StayType        string   `json:"stay_type"`
	RentalCar       bool     `json:"rental_car"`
	NumPeople       int      `json:"num_people"`
}

// AITripPlan is the structured response from the AI, parsed from JSON.
// It contains everything needed to create a full trip in one atomic operation.
type AITripPlan struct {
	TripName  string           `json:"trip_name"`
	NeedVisa  bool             `json:"need_visa"`
	Expenses  []ExpenseInput   `json:"expenses"`
	Links     []LinkInput      `json:"links"`
	Notes     []NoteInput      `json:"notes"`
	Itinerary []ItineraryInput `json:"itinerary"`
}

// TripPlannerAI is the interface every LLM provider must implement.
// The app only depends on this interface — never on a concrete type.
type TripPlannerAI interface {
	GenerateTripPlan(req TripAIRequest) (AITripPlan, error)
}
