package main

import (
	"embed"
	"github.com/joho/godotenv"
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

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("no .env found")
	}

	database, err := db.Init()
	if err != nil {
		log.Fatalf("failed to init database: %v", err)
	}

	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("could not determine home directory: %v", err)
	}
	photoDir := filepath.Join(home, ".trip-planner", "photos")

	app := NewApp(database, photoDir)

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
