package models

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
)

type OpenAIStructurer struct{}

const INSTRUCTIONS = `Extract structured Trip data from the input research blob.
Date format: YYYY-MM-DD
Time format: HH:MM
Make sure itinerary entries have multiple different entries for different times each day. Prices are stored in cents.`

func (os *OpenAIStructurer) GenerateTripPlan(ctx context.Context, result WebSearchResult, useRealAI bool, apiKey string) (AITripPlan, error) {
	client := openai.NewClient(option.WithAPIKey(apiKey))
	const model_4_1_mini = openai.ChatModelGPT4_1Mini

	var aiTripPlan = AITripPlan{}
	var resp *responses.Response

	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Model:        model_4_1_mini,
		Instructions: openai.String(INSTRUCTIONS),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(result.RawText),
		},
		Text: responses.ResponseTextConfigParam{
			Format: responses.ResponseFormatTextConfigUnionParam{
				OfJSONSchema: &responses.ResponseFormatTextJSONSchemaConfigParam{
					Name:   "ai_trip_plan",
					Schema: AITripPlanSchema,
					Strict: openai.Bool(true),
				},
			},
		},
	})
	if err != nil {
		return AITripPlan{}, fmt.Errorf("Error using openai to structure web search response (second pass): %v", err)
	}

	if err := json.Unmarshal([]byte(resp.OutputText()), &aiTripPlan); err != nil {
		return AITripPlan{}, fmt.Errorf("Error unmarshalling structurer response: %v", err)
	}

	b, err := json.MarshalIndent(aiTripPlan, "", "  ")
	if err != nil {
		return AITripPlan{}, fmt.Errorf("Error marshalling aiTripPlan for printing.")
	}

	fmt.Println("\naiTripPlan:")
	fmt.Println(string(b))
	fmt.Printf("Total token usage: %d\n", resp.Usage.TotalTokens)
	fmt.Println()
	return aiTripPlan, nil
}
