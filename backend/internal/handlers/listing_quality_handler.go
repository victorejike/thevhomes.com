package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/ai"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// ListingQualityHandler exposes TheVHomes AI Engine's listing analysis to
// agents and admins.
type ListingQualityHandler struct {
	DB *gorm.DB
	AI *ai.Engine
}

func NewListingQualityHandler(db *gorm.DB) *ListingQualityHandler {
	return &ListingQualityHandler{DB: db, AI: ai.NewEngine()}
}

// Quality handles GET /api/v1/properties/:id/quality (owning agent or admin).
//
// Returns the completeness score together with the per-field breakdown, so the
// agent dashboard can render "Listing Quality: 92%" alongside the specific
// items still worth fixing. A bare percentage with no explanation would give
// agents nothing to act on.
func (h *ListingQualityHandler) Quality(c *gin.Context) {
	var property models.Property
	if err := h.DB.Preload("Images").First(&property, "id = ?", c.Param("id")).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	if !h.canView(c, property) {
		utils.Error(c, http.StatusForbidden, "you do not have permission to view this listing's quality report")
		return
	}

	scorer, ok := h.AI.Completeness.(*ai.RuleBasedCompletenessScorer)
	if !ok {
		utils.Error(c, http.StatusInternalServerError, "completeness scorer unavailable")
		return
	}

	ctx := c.Request.Context()
	breakdown := scorer.Breakdown(ctx, &property)
	score := scorer.Score(ctx, &property)

	// Only the outstanding items are worth showing the agent as actions.
	suggestions := make([]string, 0, len(breakdown))
	for _, item := range breakdown {
		if item.Hint != "" {
			suggestions = append(suggestions, item.Hint)
		}
	}

	utils.Success(c, http.StatusOK, "listing quality report", gin.H{
		"completeness_score": score,
		"breakdown":          breakdown,
		"suggestions":        suggestions,
		"moderation_status":  property.ModerationStatus,
	})
}

// Rescore handles POST /api/v1/properties/:id/rescore (owning agent or admin).
//
// Recomputes and persists both scores after the agent has edited a listing, so
// the quality figure shown in the dashboard reflects the current content
// rather than what was submitted at creation time.
func (h *ListingQualityHandler) Rescore(c *gin.Context) {
	var property models.Property
	if err := h.DB.Preload("Images").First(&property, "id = ?", c.Param("id")).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	if !h.canView(c, property) {
		utils.Error(c, http.StatusForbidden, "you do not have permission to modify this listing")
		return
	}

	if err := h.AI.EvaluateListing(c.Request.Context(), &property); err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to evaluate listing")
		return
	}

	// A listing an admin has already cleared stays cleared: re-scoring must not
	// silently drag a dismissed flag back into the moderation queue.
	updates := map[string]interface{}{
		"completeness_score": property.CompletenessScore,
	}
	if property.ModerationStatus != ai.ModerationDismissed {
		updates["moderation_score"] = property.ModerationScore
		updates["moderation_status"] = property.ModerationStatus
	}
	h.DB.Model(&property).Updates(updates)

	utils.Success(c, http.StatusOK, "listing re-scored", gin.H{
		"completeness_score": property.CompletenessScore,
		"moderation_status":  property.ModerationStatus,
	})
}

// ModerationQueue handles GET /api/v1/admin/moderation-queue (admin only).
//
// Lists everything the moderation AI flagged. Nothing here has been deleted or
// hidden — per the Phase 4 spec the AI only assigns a score, and a human
// decides what happens next.
func (h *ListingQualityHandler) ModerationQueue(c *gin.Context) {
	var properties []models.Property
	if err := h.DB.
		Preload("Agent").Preload("Agent.User").Preload("Images").
		Where("moderation_status = ?", ai.ModerationPendingReview).
		Order("moderation_score DESC, created_at DESC").
		Find(&properties).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to load moderation queue")
		return
	}

	scorer, _ := h.AI.Moderation.(*ai.RuleBasedModerationScorer)
	ctx := c.Request.Context()

	items := make([]gin.H, 0, len(properties))
	for i := range properties {
		entry := gin.H{
			"property":         properties[i],
			"moderation_score": properties[i].ModerationScore,
		}
		// Moderators need to see which rules fired, not just a number, so the
		// decision is reviewable and an agent's appeal can be answered.
		if scorer != nil {
			_, signals := scorer.Evaluate(ctx, &properties[i])
			entry["signals"] = signals
		}
		items = append(items, entry)
	}

	utils.Success(c, http.StatusOK, "moderation queue", gin.H{
		"items": items,
		"total": len(items),
	})
}

// ResolveModeration handles PATCH /api/v1/admin/moderation-queue/:id (admin).
//
// The moderator's decision is final and is never overwritten by later
// automatic re-scoring.
func (h *ListingQualityHandler) ResolveModeration(c *gin.Context) {
	var req struct {
		// Action is "dismiss" (content is fine) or "uphold" (leave flagged for
		// follow-up through the normal listing review workflow).
		Action string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var property models.Property
	if err := h.DB.First(&property, "id = ?", c.Param("id")).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	switch req.Action {
	case "dismiss":
		h.DB.Model(&property).Update("moderation_status", ai.ModerationDismissed)
		utils.Success(c, http.StatusOK, "flag dismissed — listing cleared", nil)
	case "uphold":
		h.DB.Model(&property).Update("listing_status", models.ListingChangesRequested)
		utils.Success(c, http.StatusOK, "listing returned to the agent for changes", nil)
	default:
		utils.Error(c, http.StatusBadRequest, "action must be \"dismiss\" or \"uphold\"")
	}
}

// canView allows the owning agent or any admin.
func (h *ListingQualityHandler) canView(c *gin.Context, property models.Property) bool {
	if c.GetString("role") == string(models.RoleAdmin) {
		return true
	}

	userIDVal, ok := c.Get("user_id")
	if !ok {
		return false
	}
	uid, ok := userIDVal.(uuid.UUID)
	if !ok {
		return false
	}

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", uid).First(&agent).Error; err != nil {
		return false
	}
	return agent.ID == property.AgentID
}
