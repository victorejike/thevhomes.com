// Command server boots the TheVHomes REST + WebSocket API.
package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/cache"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/database"
	"github.com/thevhomes/backend/internal/middleware"
	"github.com/thevhomes/backend/internal/routes"
	"github.com/thevhomes/backend/internal/websocket"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()
	router.Use(middleware.CORS(cfg.FrontendURL))

	hub := websocket.NewHub()
	c := cache.New(cfg.RedisURL)
	routes.Setup(router, db, cfg, hub, c)

	log.Printf("thevhomes-api listening on :%s (%s)", cfg.Port, cfg.Env)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
