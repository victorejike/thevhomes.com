package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/cache"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/handlers"
	"github.com/thevhomes/backend/internal/middleware"
	"github.com/thevhomes/backend/internal/models"
	ws "github.com/thevhomes/backend/internal/websocket"
	"gorm.io/gorm"
)

// Setup wires every HTTP + WebSocket route for the API.
func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config, hub *ws.Hub, propertyCache *cache.Cache) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "thevhomes-api"})
	})

	authHandler := handlers.NewAuthHandler(db, cfg)
	propertyHandler := handlers.NewPropertyHandler(db, propertyCache)
	bookingHandler := handlers.NewBookingHandler(db)
	agentHandler := handlers.NewAgentHandler(db)
	messageHandler := handlers.NewMessageHandler(db, hub)
	uploadHandler := handlers.NewUploadHandler(cfg)
	investmentHandler := handlers.NewInvestmentHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db, cfg)
	reviewHandler := handlers.NewReviewHandler(db)
	aiHandler := handlers.NewAIHandler(db, cfg)

	auth := middleware.AuthRequired(cfg.JWTAccessSecret)
	agentOrAdmin := middleware.RequireRole(string(models.RoleAgent), string(models.RoleAdmin))
	adminOnly := middleware.RequireRole(string(models.RoleAdmin))

	v1 := router.Group("/api/v1")
	{
		// Auth
		authGroup := v1.Group("/auth")
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.Refresh)
		authGroup.GET("/me", auth, authHandler.Me)

		// Properties (public reads, protected writes)
		properties := v1.Group("/properties")
		properties.GET("", propertyHandler.List)
		properties.GET("/:id", propertyHandler.Get)
		properties.GET("/:id/reviews", reviewHandler.ListForProperty)
		properties.POST("", auth, agentOrAdmin, propertyHandler.Create)
		properties.PUT("/:id", auth, agentOrAdmin, propertyHandler.Update)
		properties.DELETE("/:id", auth, agentOrAdmin, propertyHandler.Delete)

		// Agents
		agents := v1.Group("/agents")
		agents.GET("", agentHandler.List)
		agents.GET("/:id", agentHandler.Get)
		agents.PUT("/me", auth, agentOrAdmin, agentHandler.UpdateProfile)
		agents.PATCH("/:id/verify", auth, adminOnly, agentHandler.Verify)

		// Bookings (viewing scheduler)
		bookings := v1.Group("/bookings")
		bookings.Use(auth)
		bookings.POST("", bookingHandler.Create)
		bookings.GET("/me", bookingHandler.ListMine)
		bookings.PATCH("/:id/status", agentOrAdmin, bookingHandler.UpdateStatus)

		// Reviews
		v1.POST("/reviews", auth, reviewHandler.Create)

		// Conversations + chat history (REST) — live messages ride the WebSocket.
		conversations := v1.Group("/conversations")
		conversations.Use(auth)
		conversations.POST("", messageHandler.StartConversation)
		conversations.GET("", messageHandler.ListMine)
		conversations.GET("/:id/messages", messageHandler.History)

		// WebSocket chat stream (token passed as query param; see handler).
		v1.GET("/ws/chat", func(c *gin.Context) {
			messageHandler.HandleWebSocket(c, cfg.JWTAccessSecret)
		})

		// Media uploads (Cloudflare R2 presigned URLs)
		v1.POST("/uploads/presign", auth, uploadHandler.PresignRequest)

		// Investment platform
		investments := v1.Group("/investments")
		investments.GET("", investmentHandler.List)
		investments.GET("/:id", investmentHandler.Get)
		investments.POST("", auth, adminOnly, investmentHandler.Create)

		// Payments (Paystack / Flutterwave)
		payments := v1.Group("/payments")
		payments.Use(auth)
		payments.POST("/initialize", paymentHandler.Initialize)
		payments.GET("/:reference/verify", paymentHandler.Verify)

		// AI real estate assistant
		v1.POST("/ai/ask", aiHandler.Ask)
	}
}
