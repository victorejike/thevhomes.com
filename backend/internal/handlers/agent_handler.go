package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type AgentHandler struct {
	DB *gorm.DB
}

func NewAgentHandler(db *gorm.DB) *AgentHandler {
	return &AgentHandler{DB: db}
}

// List handles GET /api/v1/agents — powers the public agent marketplace.
func (h *AgentHandler) List(c *gin.Context) {
	var agents []models.Agent
	if err := h.DB.Preload("User").Find(&agents).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch agents")
		return
	}
	utils.Success(c, http.StatusOK, "agents fetched", agents)
}

// Get handles GET /api/v1/agents/:id — an agent's public profile with listings.
func (h *AgentHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var agent models.Agent
	if err := h.DB.Preload("User").Preload("Properties").Preload("Properties.Images").First(&agent, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "agent not found")
		return
	}
	utils.Success(c, http.StatusOK, "agent fetched", agent)
}

type updateAgentProfileRequest struct {
	Bio             string `json:"bio"`
	ExperienceYears int    `json:"experience_years"`
	AgencyName      string `json:"agency_name"`
}

// UpdateProfile handles PUT /api/v1/agents/me — the logged-in agent edits their profile.
func (h *AgentHandler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("user_id")

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "agent profile not found")
		return
	}

	var req updateAgentProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	h.DB.Model(&agent).Updates(models.Agent{
		Bio:             req.Bio,
		ExperienceYears: req.ExperienceYears,
		AgencyName:      req.AgencyName,
	})

	utils.Success(c, http.StatusOK, "agent profile updated", agent)
}

// Verify handles PATCH /api/v1/agents/:id/verify — admin-only verification.
func (h *AgentHandler) Verify(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Level string `json:"level" binding:"required,oneof=pending verified premium_verified"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var agent models.Agent
	if err := h.DB.First(&agent, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "agent not found")
		return
	}

	agent.VerificationLevel = models.VerificationStatus(req.Level)
	agent.Verified = req.Level != string(models.VerificationPending)
	h.DB.Save(&agent)

	utils.Success(c, http.StatusOK, "agent verification updated", agent)
}
