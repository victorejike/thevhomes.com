package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// AdminHandler powers the enterprise admin dashboard modules: identity
// verification, agent approval, property review, viewing management, and
// payments/revenue reporting.
type AdminHandler struct {
	DB *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

// Stats handles GET /api/v1/admin/stats — the dashboard overview cards.
func (h *AdminHandler) Stats(c *gin.Context) {
	var (
		totalUsers            int64
		totalAgents           int64
		approvedAgents        int64
		pendingVerifications  int64
		pendingAgentApps      int64
		pendingPropertyReview int64
		verifiedProperties    int64
		upcomingBookings      int64
		totalRevenue          float64
		revenueByPurpose      []revenueRow
	)

	h.DB.Model(&models.User{}).Count(&totalUsers)
	h.DB.Model(&models.Agent{}).Count(&totalAgents)
	h.DB.Model(&models.Agent{}).Where("approval_status = ?", models.AgentApprovalApproved).Count(&approvedAgents)
	h.DB.Model(&models.IdentityVerification{}).Where("status = ?", models.IdentityStatusPending).Count(&pendingVerifications)
	h.DB.Model(&models.AgentApplication{}).Where("status = ?", models.AgentApprovalPending).Count(&pendingAgentApps)
	h.DB.Model(&models.Property{}).Where("listing_status = ?", models.ListingPendingReview).Count(&pendingPropertyReview)
	h.DB.Model(&models.Property{}).Where("listing_status = ?", models.ListingVerified).Count(&verifiedProperties)
	h.DB.Model(&models.Booking{}).Where("scheduled_date > ? AND status IN ?", time.Now(), []string{"pending", "confirmed"}).Count(&upcomingBookings)
	h.DB.Model(&models.Payment{}).Where("status = ?", models.PaymentSuccess).Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)
	h.DB.Model(&models.Payment{}).Where("status = ?", models.PaymentSuccess).
		Select("purpose, COALESCE(SUM(amount), 0) as total, COUNT(*) as count").
		Group("purpose").Scan(&revenueByPurpose)

	utils.Success(c, http.StatusOK, "admin stats fetched", gin.H{
		"total_users":             totalUsers,
		"total_agents":            totalAgents,
		"approved_agents":         approvedAgents,
		"pending_verifications":   pendingVerifications,
		"pending_agent_apps":      pendingAgentApps,
		"pending_property_review": pendingPropertyReview,
		"verified_properties":     verifiedProperties,
		"upcoming_bookings":       upcomingBookings,
		"total_revenue":           totalRevenue,
		"revenue_by_purpose":      revenueByPurpose,
	})
}

type revenueRow struct {
	Purpose string  `json:"purpose"`
	Total   float64 `json:"total"`
	Count   int64   `json:"count"`
}

// Bookings handles GET /api/v1/admin/bookings — viewing management: upcoming
// appointments, paid bookings, attendance (ticket check-in) tracking.
func (h *AdminHandler) Bookings(c *gin.Context) {
	query := h.DB.Preload("Property").Preload("Customer").Preload("Agent").Preload("Agent.User").Preload("Ticket").Preload("Payment")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if paidOnly := c.Query("paid_only"); paidOnly == "true" {
		query = query.Where("payment_required = true")
	}
	if upcoming := c.Query("upcoming"); upcoming == "true" {
		query = query.Where("scheduled_date > ?", time.Now())
	}

	var bookings []models.Booking
	if err := query.Order("scheduled_date ASC").Find(&bookings).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch bookings")
		return
	}
	utils.Success(c, http.StatusOK, "bookings fetched", bookings)
}

// Payments handles GET /api/v1/admin/payments — booking payments, viewing
// service payments, transaction history.
func (h *AdminHandler) Payments(c *gin.Context) {
	query := h.DB.Preload("Property").Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if purpose := c.Query("purpose"); purpose != "" {
		query = query.Where("purpose = ?", purpose)
	}
	if refund := c.Query("refund_status"); refund != "" {
		query = query.Where("refund_status = ?", refund)
	}

	var payments []models.Payment
	if err := query.Find(&payments).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch payments")
		return
	}
	utils.Success(c, http.StatusOK, "payments fetched", payments)
}

// AuditLogs handles GET /api/v1/admin/audit-logs
func (h *AdminHandler) AuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	query := h.DB.Order("created_at DESC").Limit(500)
	if entityType := c.Query("entity_type"); entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if err := query.Find(&logs).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch audit logs")
		return
	}
	utils.Success(c, http.StatusOK, "audit logs fetched", logs)
}
