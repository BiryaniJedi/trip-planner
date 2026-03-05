package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/BiryaniJedi/trip-planner/db"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	database, err := db.Init()
	if err != nil {
		log.Fatalf("failed to init database: %w", err)
	}

	app := NewApp(database)

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
