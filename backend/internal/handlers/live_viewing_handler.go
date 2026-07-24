package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// LiveViewingHandler manages "Live Video Property Tour" sessions. The actual
// WebRTC peer connection (HD video, optional screen share, live chat) is
// negotiated browser-to-browser; this handler just tracks session lifecycle
// and history, while signaling (SDP offer/answer/ICE candidates) rides the
// existing chat WebSocket hub — see message_handler.go's "webrtc_*" event
// types, keyed by the two participants' user IDs.
type LiveViewingHandler struct {
	DB *gorm.DB
}

func NewLiveViewingHandler(db *gorm.DB) *LiveViewingHandler {
	return &LiveViewingHandler{DB: db}
}

// Get handles GET /api/v1/bookings/:id/live-session
func (h *LiveViewingHandler) Get(c *gin.Context) {
	bookingID := c.Param("id")

	var session models.LiveViewingSession
	if err := h.DB.Where("booking_id = ?", bookingID).First(&session).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "no live session for this booking (viewing_type must be virtual or video)")
		return
	}
	utils.Success(c, http.StatusOK, "live session fetched", session)
}

// Start handles PATCH /api/v1/live-sessions/:token/start — either
// participant marks the session as live once they've joined.
func (h *LiveViewingHandler) Start(c *gin.Context) {
	token := c.Param("token")

	var session models.LiveViewingSession
	if err := h.DB.Where("session_token = ?", token).First(&session).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "live session not found")
		return
	}
	if !h.canAccess(c, session) {
		return
	}

	now := time.Now()
	session.Status = models.LiveSessionLive
	session.StartedAt = &now
	h.DB.Save(&session)

	utils.Success(c, http.StatusOK, "live session started", session)
}

// End handles PATCH /api/v1/live-sessions/:token/end
func (h *LiveViewingHandler) End(c *gin.Context) {
	token := c.Param("token")

	var req struct {
		RecordingURL string `json:"recording_url"`
	}
	_ = c.ShouldBindJSON(&req)

	var session models.LiveViewingSession
	if err := h.DB.Where("session_token = ?", token).First(&session).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "live session not found")
		return
	}
	if !h.canAccess(c, session) {
		return
	}

	now := time.Now()
	session.Status = models.LiveSessionEnded
	session.EndedAt = &now
	if req.RecordingURL != "" {
		session.RecordingURL = req.RecordingURL
	}
	h.DB.Save(&session)

	// Booking marked completed once the live/video viewing wraps up.
	h.DB.Model(&models.Booking{}).Where("id = ?", session.BookingID).Update("status", models.BookingCompleted)

	utils.Success(c, http.StatusOK, "live session ended", session)
}

func (h *LiveViewingHandler) canAccess(c *gin.Context, session models.LiveViewingSession) bool {
	userID := c.MustGet("user_id").(uuid.UUID)
	if c.GetString("role") == string(models.RoleAdmin) {
		return true
	}

	var booking models.Booking
	if err := h.DB.First(&booking, "id = ?", session.BookingID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "booking not found")
		return false
	}
	if booking.CustomerID == userID {
		return true
	}

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err == nil && agent.ID == booking.AgentID {
		return true
	}

	utils.Error(c, http.StatusForbidden, "you are not a participant in this live viewing session")
	return false
}
