package models

import (
	"encoding/json"
	"fmt"
	"github.com/invopop/jsonschema"
)

func generateSchema[T any]() interface{} {
	reflector := jsonschema.Reflector{
		AllowAdditionalProperties: false, // CRITICAL — must be false for Structured Outputs
		DoNotReference:            true,  // CRITICAL — inlines all $defs, required by OpenAI
	}
	var v T
	return reflector.Reflect(v)
}
func PrintAITripPlanSchema() {
	pretty, err := json.MarshalIndent(AITripPlanSchema, "", "  ")
	if err != nil {
		fmt.Printf("error: %v\n", err)
		return
	}
	fmt.Println(string(pretty))
}

var AITripPlanSchema = generateSchema[AITripPlan]()
