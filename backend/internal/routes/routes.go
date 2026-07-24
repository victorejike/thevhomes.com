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
	oauthHandler := handlers.NewOAuthHandler(db, cfg)
	verificationHandler := handlers.NewVerificationHandler(db, cfg)
	agentApplicationHandler := handlers.NewAgentApplicationHandler(db, cfg)
	propertyHandler := handlers.NewPropertyHandler(db, propertyCache)
	propertyReviewHandler := handlers.NewPropertyReviewHandler(db, cfg)
	tourHandler := handlers.NewTourHandler(db)
	bookingHandler := handlers.NewBookingHandler(db, cfg)
	viewingHandler := handlers.NewViewingHandler(db, cfg)
	liveViewingHandler := handlers.NewLiveViewingHandler(db)
	agentHandler := handlers.NewAgentHandler(db)
	messageHandler := handlers.NewMessageHandler(db, hub)
	uploadHandler := handlers.NewUploadHandler(cfg)
	investmentHandler := handlers.NewInvestmentHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db, cfg)
	reviewHandler := handlers.NewReviewHandler(db)
	aiHandler := handlers.NewAIHandler(db, cfg)
	notificationHandler := handlers.NewNotificationHandler(db)
	adminHandler := handlers.NewAdminHandler(db)

	auth := middleware.AuthRequired(cfg.JWTAccessSecret)
	optionalAuth := middleware.OptionalAuth(cfg.JWTAccessSecret)
	agentOrAdmin := middleware.RequireRole(string(models.RoleAgent), string(models.RoleAdmin))
	adminOnly := middleware.RequireRole(string(models.RoleAdmin))

	v1 := router.Group("/api/v1")
	{
		// Auth (email/password)
		authGroup := v1.Group("/auth")
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.Refresh)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.GET("/me", auth, authHandler.Me)

		// Auth (Google OAuth 2.0) — "Continue/Sign in/Sign up with Google"
		// are all this same redirect + callback pair.
		authGroup.GET("/google", oauthHandler.GoogleAuthURL)
		authGroup.GET("/google/callback", oauthHandler.GoogleCallback)
		authGroup.POST("/google/exchange", oauthHandler.Exchange)

		// Identity verification (VerifyMe NIN check) — required of every
		// user for full platform access.
		verification := v1.Group("/verification")
		verification.Use(auth)
		verification.POST("/identity", verificationHandler.Submit)
		verification.GET("/identity/me", verificationHandler.Status)

		// Properties (public reads, protected writes). OptionalAuth lets an
		// authenticated agent/admin see their own non-verified listings.
		properties := v1.Group("/properties")
		properties.GET("", optionalAuth, propertyHandler.List)
		properties.GET("/:id", optionalAuth, propertyHandler.Get)
		properties.GET("/:id/reviews", reviewHandler.ListForProperty)
		properties.GET("/:id/tour", tourHandler.Get)
		properties.POST("", auth, agentOrAdmin, propertyHandler.Create)
		properties.PUT("/:id", auth, agentOrAdmin, propertyHandler.Update)
		properties.DELETE("/:id", auth, agentOrAdmin, propertyHandler.Delete)
		properties.POST("/:id/submit-for-review", auth, agentOrAdmin, propertyReviewHandler.SubmitForReview)
		properties.POST("/:id/tour/start", auth, agentOrAdmin, tourHandler.Start)
		properties.POST("/:id/tour/scenes", auth, agentOrAdmin, tourHandler.AddScene)
		properties.POST("/:id/tour/complete", auth, agentOrAdmin, tourHandler.Complete)

		// 3D-reconstruction provider async callback (Matterport/KIRI/Luma/
		// Polycam). In production, verify a shared-secret signature header
		// here before trusting the payload.
		v1.POST("/tours/:id/webhook", tourHandler.WebhookProcessed)

		// Agents (public directory + self-service profile)
		agents := v1.Group("/agents")
		agents.GET("", agentHandler.List)
		agents.GET("/:id", agentHandler.Get)
		agents.PUT("/me", auth, agentOrAdmin, agentHandler.UpdateProfile)
		agents.PATCH("/:id/verify", auth, adminOnly, agentHandler.Verify)

		// Agent onboarding / business approval workflow (separate from
		// personal identity verification above).
		agents.POST("/applications", auth, agentOrAdmin, agentApplicationHandler.Submit)
		agents.GET("/applications/me", auth, agentOrAdmin, agentApplicationHandler.MyApplications)

		// Bookings (Professional Property Viewing scheduler: physical,
		// live-virtual, or pre-recorded video inspection)
		bookings := v1.Group("/bookings")
		bookings.Use(auth)
		bookings.POST("", bookingHandler.Create)
		bookings.GET("/me", bookingHandler.ListMine)
		bookings.GET("/:id", bookingHandler.Get)
		bookings.PATCH("/:id/status", agentOrAdmin, bookingHandler.UpdateStatus)
		bookings.GET("/:id/ticket", viewingHandler.GetTicket)
		bookings.PATCH("/:id/ticket/check-in", agentOrAdmin, viewingHandler.CheckIn)
		bookings.GET("/:id/live-session", liveViewingHandler.Get)

		// Live video tour session lifecycle (WebRTC signaling itself rides
		// the /ws/chat socket — see message_handler.go).
		liveSessions := v1.Group("/live-sessions")
		liveSessions.Use(auth)
		liveSessions.PATCH("/:token/start", liveViewingHandler.Start)
		liveSessions.PATCH("/:token/end", liveViewingHandler.End)

		// Reviews
		v1.POST("/reviews", auth, reviewHandler.Create)

		// Conversations + chat history (REST) — live messages ride the WebSocket.
		conversations := v1.Group("/conversations")
		conversations.Use(auth)
		conversations.POST("", messageHandler.StartConversation)
		conversations.GET("", messageHandler.ListMine)
		conversations.GET("/:id/messages", messageHandler.History)

		// WebSocket chat + WebRTC signaling stream (token passed as query
		// param; see handler).
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

		// Payments (Paystack / Flutterwave) — booking fees + paid viewings
		payments := v1.Group("/payments")
		payments.Use(auth)
		payments.POST("/initialize", paymentHandler.Initialize)
		payments.GET("/:reference/verify", paymentHandler.Verify)
		payments.POST("/:reference/refund-request", paymentHandler.RequestRefund)
		v1.POST("/payments/webhook/:provider", paymentHandler.Webhook)

		// In-app notifications
		notifications := v1.Group("/notifications")
		notifications.Use(auth)
		notifications.GET("/me", notificationHandler.ListMine)
		notifications.PATCH("/:id/read", notificationHandler.MarkRead)
		notifications.PATCH("/read-all", notificationHandler.MarkAllRead)

		// AI real estate assistant
		v1.POST("/ai/ask", aiHandler.Ask)

		// Enterprise admin dashboard
		admin := v1.Group("/admin")
		admin.Use(auth, adminOnly)
		admin.GET("/stats", adminHandler.Stats)
		admin.GET("/bookings", adminHandler.Bookings)
		admin.GET("/payments", adminHandler.Payments)
		admin.PATCH("/payments/:reference/refund", paymentHandler.AdminResolveRefund)
		admin.GET("/audit-logs", adminHandler.AuditLogs)
		admin.GET("/verifications", verificationHandler.AdminList)
		admin.PATCH("/verifications/:id", verificationHandler.AdminReview)
		admin.GET("/agent-applications", agentApplicationHandler.AdminList)
		admin.PATCH("/agent-applications/:id", agentApplicationHandler.AdminReview)
		admin.GET("/properties/review-queue", propertyReviewHandler.AdminQueue)
		admin.PATCH("/properties/:id/review", propertyReviewHandler.AdminReview)
	}
}
