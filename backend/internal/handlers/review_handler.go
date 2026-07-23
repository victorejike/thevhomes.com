package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type ReviewHandler struct {
	DB *gorm.DB
}

func NewReviewHandler(db *gorm.DB) *ReviewHandler {
	return &ReviewHandler{DB: db}
}

type createReviewRequest struct {
	PropertyID *string `json:"property_id"`
	AgentID    *string `json:"agent_id"`
	Rating     int     `json:"rating" binding:"required,min=1,max=5"`
	Comment    string  `json:"comment"`
}

// Create handles POST /api/v1/reviews
func (h *ReviewHandler) Create(c *gin.Context) {
	var req createReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	review := models.Review{UserID: userID, Rating: req.Rating, Comment: req.Comment}

	if req.PropertyID != nil {
		if pid, err := uuid.Parse(*req.PropertyID); err == nil {
			review.PropertyID = &pid
		}
	}
	if req.AgentID != nil {
		if aid, err := uuid.Parse(*req.AgentID); err == nil {
			review.AgentID = &aid
		}
	}

	if err := h.DB.Create(&review).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to submit review")
		return
	}

	if review.AgentID != nil {
		h.recalculateAgentRating(*review.AgentID)
	}

	utils.Success(c, http.StatusCreated, "review submitted", review)
}

func (h *ReviewHandler) recalculateAgentRating(agentID uuid.UUID) {
	var avg float64
	var count int64
	h.DB.Model(&models.Review{}).Where("agent_id = ?", agentID).Count(&count)
	h.DB.Model(&models.Review{}).Where("agent_id = ?", agentID).Select("COALESCE(AVG(rating), 0)").Scan(&avg)
	h.DB.Model(&models.Agent{}).Where("id = ?", agentID).Updates(map[string]interface{}{
		"rating":        avg,
		"reviews_count": count,
	})
}

// ListForProperty handles GET /api/v1/properties/:id/reviews
func (h *ReviewHandler) ListForProperty(c *gin.Context) {
	var reviews []models.Review
	if err := h.DB.Preload("User").Where("property_id = ?", c.Param("id")).Order("created_at DESC").Find(&reviews).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch reviews")
		return
	}
	utils.Success(c, http.StatusOK, "reviews fetched", reviews)
}
