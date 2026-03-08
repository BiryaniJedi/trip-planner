package models

type MockWebSearcher struct{}

func (m *MockWebSearcher) Search(req TripAIRequest) (WebSearchResult, error) {
	// Return a realistic multi-paragraph research blob.
	// The Sources slice should contain at least 3 https:// URLs.
	// RawText should mention: the destination, visa requirements,
	// at least one hotel, at least one attraction, at least one restaurant,
	// and at least one flight route.
	//
	// Example shape (fill in realistic content):
	return WebSearchResult{
		RawText: `
            ## Trip Research: Mumbai

            ### Flights - from EWR
			

            ### Accommodation
            ...hotel options and estimated prices...

            ### Visa
            ...visa requirements for <destination>...

            ### Top Attractions
            ...bullet list of things to do...

            ### Food & Restaurants
            ...notable restaurants...
        `,
		Sources: []string{
			"https://...",
			"https://...",
			"https://...",
		},
	}, nil
}
