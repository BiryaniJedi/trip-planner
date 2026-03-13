package models

import (
	"context"
	"fmt"
)

type OpenAIStructurer struct{}

func (os *OpenAIStructurer) GenerateTripPlan(ctx context.Context, result WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error) {
	return AITripPlan{}, fmt.Errorf("ERROR: OPENAI structurer not yet implemented.")
}
