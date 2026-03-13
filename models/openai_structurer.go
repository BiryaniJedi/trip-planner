package models

import (
	"fmt"
)

type OpenAIStructurer struct{}

func (os *OpenAIStructurer) GenerateTripPlan(result WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error) {
	return AITripPlan{}, fmt.Errorf("ERROR: OPENAI structurer not yet implemented.")
}
