package models

import (
	"encoding/json"
	"fmt"
	"github.com/invopop/jsonschema"
)

func generateSchema[T any]() map[string]any {
	reflector := jsonschema.Reflector{
		AllowAdditionalProperties: false, // CRITICAL — must be false for Structured Outputs
		DoNotReference:            true,  // CRITICAL — inlines all $defs, required by OpenAI
	}
	var v T
	schema := reflector.Reflect(v)
	b, _ := json.Marshal(schema)
	var m map[string]any
	json.Unmarshal(b, &m)
	return m
}

func PrintAITripPlanSchema() {
	pretty, err := json.MarshalIndent(AITripPlanSchema, "", "  ")
	if err != nil {
		fmt.Printf("error: %v\n", err)
		return
	}
	fmt.Println(string(pretty))
}

func (TripType) JSONSchema() *jsonschema.Schema {
	return &jsonschema.Schema{
		Type: "string",
		Enum: []any{
			TripTypeTravel,
			TripTypeFestival,
			TripTypeRoadtrip,
			TripTypeOther,
		},
	}
}

func (ExpenseCat) JSONSchema() *jsonschema.Schema {
	return &jsonschema.Schema{
		Type: "string",
		Enum: []any{
			ExpenseCatFlight,
			ExpenseCatHotel,
			ExpenseCatCar,
			ExpenseCatFestival,
			ExpenseCatFood,
			ExpenseCatActivity,
			ExpenseCatOther,
		},
	}
}

func (Currency) JSONSchema() *jsonschema.Schema {
	return &jsonschema.Schema{
		Type: "string",
		Enum: []any{
			CurrencyUSD,
			CurrencyEUR,
			CurrencyGBP,
		},
	}
}

var AITripPlanSchema = generateSchema[AITripPlan]()
