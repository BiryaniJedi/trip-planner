package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/BiryaniJedi/trip-planner/db"
)

//go:embed all:frontend/dist
var assets embed.FS

// Injected at build time via -ldflags.
// Falls back to the env var so `wails dev` still works with .env.
var openAIKey string

func resolvedAPIKey() string {
	if openAIKey != "" {
		return openAIKey
	}
	return os.Getenv("OPENAI_API_KEY")
}

func main() {
	database, err := db.Init()
	if err != nil {
		log.Fatalf("failed to init database: %v", err)
	}

	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("could not determine home directory: %v", err)
	}
	photoDir := filepath.Join(home, ".trip-planner", "photos")

	app := NewApp(database, photoDir, resolvedAPIKey())

	err = wails.Run(&options.App{
		Title:  "Trip Planner",
		Width:  1200,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
