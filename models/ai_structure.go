package models

import (
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

var AITripPlanSchema = generateSchema[AITripPlan]()
