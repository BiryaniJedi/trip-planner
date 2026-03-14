package models

import (
	"context"
	"fmt"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"strings"
)

type OpenAIWebSearcher struct{}

func (ow *OpenAIWebSearcher) Search(ctx context.Context, req TripAIRequest, useRealAI bool, apiKey string) (WebSearchResult, error) {

	client := openai.NewClient(option.WithAPIKey(apiKey))
	const model_4_1_mini = openai.ChatModelGPT4_1Mini

	var webSearchResult = WebSearchResult{}
	var resp *responses.Response
	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Model: model_4_1_mini,
		// Tools: []responses.ToolUnionParam{
		// 	{
		// 		OfWebSearch: &responses.WebSearchToolParam{
		// 			Type: responses.WebSearchToolTypeWebSearch,
		// 		},
		// 	},
		// },
		MaxToolCalls:    openai.Int(1),
		MaxOutputTokens: openai.Int(4000),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(ow.buildPrompt(req)),
		},
		// ToolChoice: responses.ResponseNewParamsToolChoiceUnion{
		// 	OfHostedTool: &responses.ToolChoiceTypesParam{
		// 		Type: responses.ToolChoiceTypesTypeWebSearchPreview,
		// 	},
		// },
	})
	if err != nil {
		return WebSearchResult{}, fmt.Errorf("Error calling openai web search: %v\n", err)
	}

	webSearchResult.RawText = resp.OutputText()

	fmt.Println(webSearchResult.RawText)
	fmt.Printf("Total token usage: %d\n", resp.Usage.TotalTokens)

	return webSearchResult, nil
}

//	type TripAIRequest struct {
//		TripName        string
//		Destination     string
//		StartingAirport string
//		DurationDays    int
//		Month           string
//		Year            int
//		TravelerCount   int
//		TravelerType    string
//		Budget          string
//		Interests       []string
//		DietaryNeeds    string
//		Mobility        string
//		PassportCountry string
//	}
func (ow *OpenAIWebSearcher) buildPrompt(req TripAIRequest) string {
	var sb strings.Builder

	// Role + task
	fmt.Fprintf(&sb, "You are a detailed travel agent. Create a comprehensive trip plan titled '%s'.\n\n", req.TripName)

	// Trip basics
	fmt.Fprintf(&sb, "Trip details:\n")
	fmt.Fprintf(&sb, "- Destination: %s\n", req.Destination)
	fmt.Fprintf(&sb, "- Departing from: %s\n", req.StartingAirport)
	fmt.Fprintf(&sb, "- Duration: around %d days around %s %d\n", req.DurationDays, req.Month, req.Year)
	fmt.Fprintf(&sb, "- Travelers: %d, %s\n", req.TravelerCount, req.TravelerType)
	fmt.Fprintf(&sb, "- Budget: %s\n", req.Budget)
	fmt.Fprintf(&sb, "- Passport: %s\n\n", req.PassportCountry)

	// Optional fields
	if len(req.Interests) > 0 {
		fmt.Fprintf(&sb, "- Interests: %s\n", strings.Join(req.Interests, ", "))
	}
	if req.DietaryNeeds != "" {
		fmt.Fprintf(&sb, "- Dietary needs: %s\n", req.DietaryNeeds)
	}
	if req.Mobility != "" {
		fmt.Fprintf(&sb, "- Mobility considerations: %s\n", req.Mobility)
	}

	// What to include
	sb.WriteString("\nPlease include:\n")
	sb.WriteString("- Flight options with approximate prices and best booking times\n")
	sb.WriteString("- Accommodation options (hotels and Airbnbs) with price ranges\n")
	sb.WriteString("- A day-by-day itinerary with times and activities\n")
	sb.WriteString("- Restaurant recommendations with a short description of each\n")
	sb.WriteString("- Estimated expenses broken down by category (flights, hotels, food, activities)\n")
	sb.WriteString("- Visa requirements for the given passport\n")
	sb.WriteString("- Useful links for booking and research, and any and all links you searched through, including a specific google flights search if applicable.\n")
	sb.WriteString("- Any important travel tips or warnings\n")
	sb.WriteString("- Reasonably structured output in markdown format, with sections for Notes, Expenses, Links, and the Itinerary")

	return sb.String()
}
