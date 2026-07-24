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

type BookingHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Notifier *services.Notifier
}

func NewBookingHandler(db *gorm.DB, cfg *config.Config) *BookingHandler {
	return &BookingHandler{DB: db, Cfg: cfg, Notifier: services.NewNotifier(db, cfg)}
}

type createBookingRequest struct {
	PropertyID    string `json:"property_id" binding:"required"`
	ScheduledDate string `json:"scheduled_date" binding:"required"` // RFC3339
	Notes         string `json:"notes"`
	ViewingType   string `json:"viewing_type"` // physical | virtual | video (default physical)
}

// Create handles POST /api/v1/bookings — a customer requesting a "Professional
// Property Viewing" (physical, live virtual video, or a pre-recorded video
// inspection). If the property is marked as a paid viewing, the booking is
// created but stays gated behind payment: no ticket/live-session is issued
// until POST /api/v1/payments/:reference/verify confirms success. Free
// viewings get their ticket immediately and are notified right away.
func (h *BookingHandler) Create(c *gin.Context) {
	var req createBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	scheduled, err := time.Parse(time.RFC3339, req.ScheduledDate)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "scheduled_date must be RFC3339, e.g. 2026-08-01T14:00:00Z")
		return
	}

	var property models.Property
	if err := h.DB.First(&property, "id = ?", req.PropertyID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	viewingType := models.ViewingPhysical
	if req.ViewingType != "" {
		viewingType = models.ViewingType(req.ViewingType)
	}

	customerID := c.MustGet("user_id").(uuid.UUID)

	booking := models.Booking{
		PropertyID:      property.ID,
		CustomerID:      customerID,
		AgentID:         property.AgentID,
		ScheduledDate:   scheduled,
		Status:          models.BookingPending,
		Notes:           req.Notes,
		ViewingType:     viewingType,
		PaymentRequired: property.IsPaidViewing,
		ViewingFee:      property.ViewingFee,
	}

	if err := h.DB.Create(&booking).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to create booking")
		return
	}

	if viewingType != models.ViewingPhysical {
		session := models.LiveViewingSession{
			BookingID:    booking.ID,
			SessionToken: utils.GenerateSessionToken(),
			Status:       models.LiveSessionScheduled,
		}
		h.DB.Create(&session)
	}

	if !booking.PaymentRequired {
		FinalizeBooking(h.DB, h.Cfg, h.Notifier, booking)
	}

	utils.Success(c, http.StatusCreated, "viewing requested successfully", booking)
}

// FinalizeBooking issues the viewing ticket and notifies customer, agent,
// and admins — called immediately for free viewings, or from the payment
// verification handler (payment_handler.go) once a paid viewing fee clears.
func FinalizeBooking(db *gorm.DB, cfg *config.Config, notifier *services.Notifier, booking models.Booking) {
	if _, err := IssueTicketForBooking(db, cfg, booking); err != nil {
		return
	}

	var property models.Property
	db.First(&property, "id = ?", booking.PropertyID)
	var agent models.Agent
	db.First(&agent, "id = ?", booking.AgentID)

	notifier.Send(booking.CustomerID, "booking_confirmed", "Viewing Booked", "Your "+string(booking.ViewingType)+" viewing for \""+property.Title+"\" is booked for "+booking.ScheduledDate.Format("Jan 2, 2006 at 3:04 PM")+". Your ticket is ready in your dashboard.")
	notifier.Send(agent.UserID, "booking_confirmed", "New Viewing Request", "A customer booked a "+string(booking.ViewingType)+" viewing for \""+property.Title+"\" on "+booking.ScheduledDate.Format("Jan 2, 2006 at 3:04 PM")+".")
	notifyAdmins(db, notifier, "booking_confirmed", "New Viewing Booked", "A viewing was booked for \""+property.Title+"\".")
}

// ListMine handles GET /api/v1/bookings/me — bookings for the current user,
// whether they booked as a customer or own them as an agent.
func (h *BookingHandler) ListMine(c *gin.Context) {
	userID := c.MustGet("user_id")

	var bookings []models.Booking
	query := h.DB.Preload("Property").Preload("Customer").Preload("Agent").Preload("Agent.User").Preload("Ticket")

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err == nil {
		query = query.Where("customer_id = ? OR agent_id = ?", userID, agent.ID)
	} else {
		query = query.Where("customer_id = ?", userID)
	}

	if err := query.Order("scheduled_date DESC").Find(&bookings).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch bookings")
		return
	}

	utils.Success(c, http.StatusOK, "bookings fetched", bookings)
}

// Get handles GET /api/v1/bookings/:id — used by the live-viewing page to
// resolve the property, customer, and agent for a single booking.
func (h *BookingHandler) Get(c *gin.Context) {
	id := c.Param("id")
	userID := c.MustGet("user_id").(uuid.UUID)

	var booking models.Booking
	if err := h.DB.Preload("Property").Preload("Customer").Preload("Agent").Preload("Agent.User").Preload("Ticket").
		First(&booking, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "booking not found")
		return
	}

	if c.GetString("role") != string(models.RoleAdmin) && booking.CustomerID != userID && booking.Agent.UserID != userID {
		utils.Error(c, http.StatusForbidden, "you do not have access to this booking")
		return
	}

	utils.Success(c, http.StatusOK, "booking fetched", booking)
}

type updateBookingStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending confirmed completed cancelled"`
}

// UpdateStatus handles PATCH /api/v1/bookings/:id/status — agent/admin confirms,
// completes, or cancels a viewing request.
func (h *BookingHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var booking models.Booking
	if err := h.DB.First(&booking, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "booking not found")
		return
	}

	var req updateBookingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	booking.Status = models.BookingStatus(req.Status)
	h.DB.Save(&booking)

	if req.Status == "confirmed" {
		h.Notifier.Send(booking.CustomerID, "booking_confirmed", "Viewing Confirmed", "Your agent confirmed your upcoming viewing.")
	}

	utils.Success(c, http.StatusOK, "booking status updated", booking)
}

// notifyAdmins fans a notification out to every admin account — used for
// events the whole ops team should be aware of (new paid bookings, refund
// requests, etc.).
func notifyAdmins(db *gorm.DB, notifier *services.Notifier, notifType, title, body string) {
	var admins []models.User
	db.Where("role = ?", models.RoleAdmin).Find(&admins)
	for _, admin := range admins {
		notifier.Send(admin.ID, notifType, title, body)
	}
}
