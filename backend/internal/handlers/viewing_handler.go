package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/services"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// ViewingHandler implements the "Professional Property Viewing" service:
// once a booking's viewing fee (if any) is paid, a ticket with a QR check-in
// code is generated for the customer and shared with the agent.
type ViewingHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Notifier *services.Notifier
}

func NewViewingHandler(db *gorm.DB, cfg *config.Config) *ViewingHandler {
	return &ViewingHandler{DB: db, Cfg: cfg, Notifier: services.NewNotifier(db, cfg)}
}

// IssueTicketForBooking creates (or returns the existing) ViewingTicket for a
// booking. Called automatically once a paid viewing's payment is confirmed,
// or immediately for free viewings.
func IssueTicketForBooking(db *gorm.DB, cfg *config.Config, booking models.Booking) (models.ViewingTicket, error) {
	var existing models.ViewingTicket
	if err := db.Where("booking_id = ?", booking.ID).First(&existing).Error; err == nil {
		return existing, nil
	}

	code := utils.GenerateTicketCode()
	ticket := models.ViewingTicket{
		BookingID:   booking.ID,
		TicketCode:  code,
		QRCodeURL:   utils.BuildQRCodeURL(cfg.QRCodeServiceBaseURL, code),
		ViewingType: booking.ViewingType,
		Status:      models.TicketIssued,
		IssuedAt:    time.Now(),
	}
	if err := db.Create(&ticket).Error; err != nil {
		return models.ViewingTicket{}, err
	}
	return ticket, nil
}

// GetTicket handles GET /api/v1/bookings/:id/ticket
func (h *ViewingHandler) GetTicket(c *gin.Context) {
	bookingID := c.Param("id")

	if !h.canAccessBooking(c, bookingID) {
		return
	}

	var ticket models.ViewingTicket
	if err := h.DB.Where("booking_id = ?", bookingID).First(&ticket).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "no ticket has been issued for this booking yet (payment may still be pending)")
		return
	}
	utils.Success(c, http.StatusOK, "ticket fetched", ticket)
}

// CheckIn handles PATCH /api/v1/bookings/:id/ticket/check-in — the agent (or
// admin) scans/enters the QR/ticket code on arrival for a physical viewing.
func (h *ViewingHandler) CheckIn(c *gin.Context) {
	bookingID := c.Param("id")

	var booking models.Booking
	if err := h.DB.First(&booking, "id = ?", bookingID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "booking not found")
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	var agent models.Agent
	isOwningAgent := h.DB.Where("user_id = ?", userID).First(&agent).Error == nil && agent.ID == booking.AgentID
	if c.GetString("role") != string(models.RoleAdmin) && !isOwningAgent {
		utils.Error(c, http.StatusForbidden, "only the assigned agent or an admin can check in a viewing ticket")
		return
	}

	var ticket models.ViewingTicket
	if err := h.DB.Where("booking_id = ?", bookingID).First(&ticket).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "ticket not found")
		return
	}

	now := time.Now()
	ticket.Status = models.TicketCheckedIn
	ticket.CheckedInAt = &now
	h.DB.Save(&ticket)

	utils.Success(c, http.StatusOK, "viewing checked in", ticket)
}

func (h *ViewingHandler) canAccessBooking(c *gin.Context, bookingID string) bool {
	userID := c.MustGet("user_id").(uuid.UUID)
	if c.GetString("role") == string(models.RoleAdmin) {
		return true
	}

	var booking models.Booking
	if err := h.DB.First(&booking, "id = ?", bookingID).Error; err != nil {
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

	utils.Error(c, http.StatusForbidden, "you do not have access to this booking")
	return false
}
