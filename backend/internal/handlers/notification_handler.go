package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// NotificationHandler exposes the in-app notification inbox (bell icon)
// backing every dispatched event: verification approved/rejected, agent
// approved, booking confirmed, payment successful, viewing reminder, listing
// approved/rejected, etc.
type NotificationHandler struct {
	DB *gorm.DB
}

func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
	return &NotificationHandler{DB: db}
}

// ListMine handles GET /api/v1/notifications/me
func (h *NotificationHandler) ListMine(c *gin.Context) {
	userID := c.MustGet("user_id")

	var notifications []models.Notification
	if err := h.DB.Where("user_id = ? AND channel = ?", userID, models.ChannelInApp).
		Order("created_at DESC").Limit(100).Find(&notifications).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}

	var unreadCount int64
	h.DB.Model(&models.Notification{}).Where("user_id = ? AND channel = ? AND read_at IS NULL", userID, models.ChannelInApp).Count(&unreadCount)

	utils.Success(c, http.StatusOK, "notifications fetched", gin.H{
		"items":        notifications,
		"unread_count": unreadCount,
	})
}

// MarkRead handles PATCH /api/v1/notifications/:id/read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id := c.Param("id")
	userID := c.MustGet("user_id")

	now := time.Now()
	if err := h.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", now).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to update notification")
		return
	}
	utils.Success(c, http.StatusOK, "notification marked read", nil)
}

// MarkAllRead handles PATCH /api/v1/notifications/read-all
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.MustGet("user_id")
	h.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", time.Now())
	utils.Success(c, http.StatusOK, "all notifications marked read", nil)
}
