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

// AgentApplicationHandler implements the secure agent onboarding workflow:
// after personal NIN identity verification, an agent submits business
// details for admin review; only on approval is a permanent, immutable
// TVH-AGT-###### agent number assigned, which is the sole gate for
// publishing property listings.
type AgentApplicationHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Notifier *services.Notifier
}

func NewAgentApplicationHandler(db *gorm.DB, cfg *config.Config) *AgentApplicationHandler {
	return &AgentApplicationHandler{DB: db, Cfg: cfg, Notifier: services.NewNotifier(db, cfg)}
}

type submitAgentApplicationRequest struct {
	BusinessName    string `json:"business_name" binding:"required"`
	OfficeAddress   string `json:"office_address" binding:"required"`
	CACNumber       string `json:"cac_number"`
	CACDocumentURL  string `json:"cac_document_url"`
	GovernmentIDURL string `json:"government_id_url" binding:"required"`
	ProfilePhotoURL string `json:"profile_photo_url" binding:"required"`
	SelfieURL       string `json:"selfie_url"`
}

// Submit handles POST /api/v1/agents/applications — an agent (whose personal
// identity has already been VerifyMe-verified) submits their business
// onboarding packet for admin review.
func (h *AgentApplicationHandler) Submit(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil {
		utils.Error(c, http.StatusForbidden, "only agent accounts may submit an onboarding application")
		return
	}
	if !agent.IdentityVerified {
		utils.Error(c, http.StatusForbidden, "complete personal identity verification (VerifyMe NIN check) before applying to become an approved agent")
		return
	}
	if agent.ApprovalStatus == models.AgentApprovalApproved {
		utils.Error(c, http.StatusConflict, "this agent is already approved")
		return
	}

	var req submitAgentApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	application := models.AgentApplication{
		AgentID:         agent.ID,
		BusinessName:    req.BusinessName,
		OfficeAddress:   req.OfficeAddress,
		CACNumber:       req.CACNumber,
		CACDocumentURL:  req.CACDocumentURL,
		GovernmentIDURL: req.GovernmentIDURL,
		ProfilePhotoURL: req.ProfilePhotoURL,
		SelfieURL:       req.SelfieURL,
		Status:          models.AgentApprovalPending,
		SubmittedAt:     time.Now(),
	}
	if err := h.DB.Create(&application).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to submit application")
		return
	}

	h.DB.Model(&agent).Update("approval_status", models.AgentApprovalPending)

	utils.Success(c, http.StatusCreated, "application submitted for admin review", application)
}

// MyApplications handles GET /api/v1/agents/applications/me
func (h *AgentApplicationHandler) MyApplications(c *gin.Context) {
	userID := c.MustGet("user_id")

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "agent profile not found")
		return
	}

	var applications []models.AgentApplication
	h.DB.Where("agent_id = ?", agent.ID).Order("created_at DESC").Find(&applications)
	utils.Success(c, http.StatusOK, "applications fetched", gin.H{
		"agent":        agent,
		"applications": applications,
	})
}

// AdminList handles GET /api/v1/admin/agent-applications?status=pending
func (h *AgentApplicationHandler) AdminList(c *gin.Context) {
	status := c.Query("status")

	query := h.DB.Model(&models.AgentApplication{}).Order("submitted_at DESC")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var applications []models.AgentApplication
	if err := query.Find(&applications).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch applications")
		return
	}
	utils.Success(c, http.StatusOK, "applications fetched", applications)
}

type reviewAgentApplicationRequest struct {
	Decision string `json:"decision" binding:"required,oneof=approve reject under_review"`
	Notes    string `json:"notes"`
}

// AdminReview handles PATCH /api/v1/admin/agent-applications/:id — approving
// an application is the ONLY path that assigns a permanent agent number.
func (h *AgentApplicationHandler) AdminReview(c *gin.Context) {
	id := c.Param("id")
	adminID := c.MustGet("user_id").(uuid.UUID)

	var req reviewAgentApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var application models.AgentApplication
	if err := h.DB.First(&application, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "application not found")
		return
	}

	var agent models.Agent
	if err := h.DB.Preload("User").First(&agent, "id = ?", application.AgentID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "agent not found")
		return
	}

	now := time.Now()
	application.ReviewedBy = &adminID
	application.ReviewedAt = &now
	application.ReviewNotes = req.Notes

	switch req.Decision {
	case "approve":
		application.Status = models.AgentApprovalApproved
		h.DB.Save(&application)

		agentNumber := agent.AgentNumber
		if agentNumber == nil {
			// Assign a permanent, sequential, never-reused agent number —
			// only ever done here, exactly once per agent.
			number, err := utils.NextAgentNumber(h.DB, h.Cfg.AgentNumberPrefix)
			if err != nil {
				utils.Error(c, http.StatusInternalServerError, "failed to assign agent number: "+err.Error())
				return
			}
			agentNumber = &number
		}

		h.DB.Model(&agent).Updates(map[string]interface{}{
			"approval_status":          models.AgentApprovalApproved,
			"agent_number":             agentNumber,
			"agent_number_assigned_at": now,
			"agency_name":              application.BusinessName,
			"verified":                 true,
			"verification_level":       models.VerificationVerified,
		})

		h.Notifier.Send(agent.UserID, "agent_approved", "You're an Approved TheVHomes Agent 🏅", "Congratulations! Your agent application has been approved. Your permanent agent ID is "+*agentNumber+". You can now publish property listings.")

	case "reject":
		application.Status = models.AgentApprovalRejected
		h.DB.Save(&application)
		h.DB.Model(&agent).Update("approval_status", models.AgentApprovalRejected)
		h.Notifier.Send(agent.UserID, "agent_rejected", "Agent Application Update", "Your agent application was not approved: "+req.Notes+". You may address the feedback and re-apply.")

	case "under_review":
		application.Status = models.AgentApprovalUnderReview
		h.DB.Save(&application)
		h.DB.Model(&agent).Update("approval_status", models.AgentApprovalUnderReview)
	}

	writeAuditLog(h.DB, &adminID, "agent_application."+req.Decision, "agent_application", id, req.Notes, c.ClientIP())

	utils.Success(c, http.StatusOK, "application reviewed", application)
}
