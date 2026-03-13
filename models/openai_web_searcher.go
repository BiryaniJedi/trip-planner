package models

import (
	"fmt"
)

type OpenAIWebSearcher struct{}

func (ow *OpenAIWebSearcher) Search(req TripAIRequest, useRealAI bool, apiKey string) (WebSearchResult, error) {
	return WebSearchResult{}, fmt.Errorf("ERROR: OPENAI search not yet implemented.")
}
