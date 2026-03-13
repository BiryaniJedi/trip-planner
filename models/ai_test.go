package models

import (
	"strings"
	"testing"
)

var _ WebSearcher = (*MockWebSearcher)(nil)
var _ Structurer = (*MockStructurer)(nil)

func TestMockWebSearcherReturnsNonEmptyText(t *testing.T) {
	s := &MockWebSearcher{}
	webSearch, err := s.Search(TripAIRequest{}, false, "")
	if err != nil {
		t.Fatalf("Error calling mock web searcher Search: %v", err)
	}
	if strings.TrimSpace(webSearch.RawText) == "" {
		t.Error("RawText must not be empty")
	}
	if len(webSearch.Sources) == 0 {
		t.Error("Sources must not be empty")
	}
}

func TestMockStructurerRejectsEmptyResearch(t *testing.T) {
	s := &MockStructurer{}
	_, err := s.GenerateTripPlan(WebSearchResult{RawText: ""}, false, "")
	if err == nil {
		t.Error("expected error when RawText is empty, got nil")
	}
}

func TestMockStructurerLinksIncludeSearchSources(t *testing.T) {
	// This test verifies the pipeline threads data between stages.
	searcher := &MockWebSearcher{}
	structurer := &MockStructurer{}

	research, _ := searcher.Search(TripAIRequest{}, false, "")
	plan, _ := structurer.GenerateTripPlan(research, false, "")

	// At least one link URL should come from research.Sources
	sourceSet := make(map[string]bool)
	for _, src := range research.Sources {
		sourceSet[src] = true
	}
	found := false
	for _, link := range plan.Links {
		if sourceSet[link.Url] {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected at least one plan Link to come from research.Sources")
	}
}
