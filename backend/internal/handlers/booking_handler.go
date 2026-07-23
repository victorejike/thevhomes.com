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

type BookingHandler struct {
	DB *gorm.DB
}

func NewBookingHandler(db *gorm.DB) *BookingHandler {
	return &BookingHandler{DB: db}
}

type createBookingRequest struct {
	PropertyID    string `json:"property_id" binding:"required"`
	ScheduledDate string `json:"scheduled_date" binding:"required"` // RFC3339
	Notes         string `json:"notes"`
}

// Create handles POST /api/v1/bookings — a customer scheduling a viewing.
// TODO: wire up email/SMS notifications to customer, agent, and admin, plus
// Google Calendar event creation once SMTP/OAuth credentials are available.
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

	customerID := c.MustGet("user_id").(uuid.UUID)

	booking := models.Booking{
		PropertyID:    property.ID,
		CustomerID:    customerID,
		AgentID:       property.AgentID,
		ScheduledDate: scheduled,
		Status:        models.BookingPending,
		Notes:         req.Notes,
	}

	if err := h.DB.Create(&booking).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to create booking")
		return
	}

	utils.Success(c, http.StatusCreated, "viewing requested successfully", booking)
}

// ListMine handles GET /api/v1/bookings/me — bookings for the current user,
// whether they booked as a customer or own them as an agent.
func (h *BookingHandler) ListMine(c *gin.Context) {
	userID := c.MustGet("user_id")

	var bookings []models.Booking
	query := h.DB.Preload("Property").Preload("Customer").Preload("Agent").Preload("Agent.User")

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

	utils.Success(c, http.StatusOK, "booking status updated", booking)
}
