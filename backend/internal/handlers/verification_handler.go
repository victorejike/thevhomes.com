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

// VerificationHandler implements VerifyMe-backed NIN identity verification,
// required of every user (customer or agent) for full platform access.
type VerificationHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	VerifyMe *services.VerifyMeClient
	Notifier *services.Notifier
}

func NewVerificationHandler(db *gorm.DB, cfg *config.Config) *VerificationHandler {
	return &VerificationHandler{DB: db, Cfg: cfg, VerifyMe: services.NewVerifyMeClient(cfg), Notifier: services.NewNotifier(db, cfg)}
}

type submitVerificationRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	NIN         string `json:"nin" binding:"required,len=11"`
	DateOfBirth string `json:"date_of_birth" binding:"required"` // YYYY-MM-DD
	PhoneNumber string `json:"phone_number" binding:"required"`
	SelfieURL   string `json:"selfie_url"` // required for agents; selfie-match if VerifyMe plan supports it
}

// Submit handles POST /api/v1/verification/identity — a customer or agent
// submits their NIN + biodata for VerifyMe verification. The full NIN is
// encrypted at rest and never echoed back to any client.
func (h *VerificationHandler) Submit(c *gin.Context) {
	var req submitVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "date_of_birth must be in YYYY-MM-DD format")
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	first, last := splitName(req.FullName)
	result, err := h.VerifyMe.VerifyNIN(c.Request.Context(), services.NINLookupRequest{
		NIN:         req.NIN,
		FirstName:   first,
		LastName:    last,
		DateOfBirth: req.DateOfBirth,
		PhoneNumber: req.PhoneNumber,
	})
	if err != nil {
		utils.Error(c, http.StatusBadGateway, "could not reach VerifyMe: "+err.Error())
		return
	}

	status := models.IdentityStatusFailed
	failureReason := result.Error
	var verifiedAt *time.Time
	if result.Verified {
		status = models.IdentityStatusVerified
		failureReason = ""
		now := time.Now()
		verifiedAt = &now
	}

	ninEncrypted := ""
	if h.Cfg.EncryptionKey != "" {
		if enc, err := utils.Encrypt(req.NIN, h.Cfg.EncryptionKey); err == nil {
			ninEncrypted = enc
		}
	}

	var verification models.IdentityVerification
	isNew := h.DB.Where("user_id = ?", userID).First(&verification).Error != nil

	verification.UserID = userID
	verification.FullName = req.FullName
	verification.NINEncrypted = ninEncrypted
	verification.NINLast4 = utils.Last4(req.NIN)
	verification.DateOfBirth = dob
	verification.PhoneNumber = req.PhoneNumber
	verification.SelfieURL = req.SelfieURL
	verification.Status = status
	verification.Provider = "verifyme"
	verification.ProviderReference = result.ProviderRef
	verification.FailureReason = failureReason
	verification.VerifiedAt = verifiedAt

	if isNew {
		h.DB.Create(&verification)
	} else {
		h.DB.Save(&verification)
	}

	h.DB.Create(&models.VerifyMeResponse{
		IdentityVerificationID: verification.ID,
		Endpoint:               "/verifications/identities/nin/{nin}",
		HTTPStatus:             result.HTTPStatus,
		ResponseBody:           string(result.RawResponse),
		Success:                result.Verified,
	})

	if result.Verified {
		now := time.Now()
		h.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"nin_verified":         true,
			"identity_verified_at": now,
		})

		// If this user is an agent, mark their personal identity as verified
		// (a prerequisite for the separate business approval workflow, but
		// not sufficient on its own to publish listings).
		h.DB.Model(&models.Agent{}).Where("user_id = ?", userID).Update("identity_verified", true)

		h.Notifier.Send(userID, "verification_approved", "Identity Verified ✅", "Your identity has been successfully verified via VerifyMe. You now have full access to TheVHomes platform.")

		utils.Success(c, http.StatusOK, "identity verified", gin.H{
			"status":  status,
			"badge":   "✅ Identity Verified",
			"user_id": userID,
		})
		return
	}

	h.Notifier.Send(userID, "verification_rejected", "Identity Verification Failed", "We could not verify your identity: "+failureReason+". Your account remains restricted until verification succeeds — please double-check your NIN and try again.")

	utils.Error(c, http.StatusUnprocessableEntity, "identity verification failed: "+failureReason)
}

// Status handles GET /api/v1/verification/identity/me
func (h *VerificationHandler) Status(c *gin.Context) {
	userID := c.MustGet("user_id")

	var verification models.IdentityVerification
	if err := h.DB.Where("user_id = ?", userID).First(&verification).Error; err != nil {
		utils.Success(c, http.StatusOK, "no verification submitted yet", gin.H{"status": "not_submitted"})
		return
	}
	utils.Success(c, http.StatusOK, "verification status", verification)
}

// AdminList handles GET /api/v1/admin/verifications?status=pending|verified|failed|rejected
func (h *VerificationHandler) AdminList(c *gin.Context) {
	status := c.Query("status")

	query := h.DB.Model(&models.IdentityVerification{}).Order("created_at DESC")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var verifications []models.IdentityVerification
	if err := query.Find(&verifications).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch verifications")
		return
	}
	utils.Success(c, http.StatusOK, "verifications fetched", verifications)
}

// AdminReview handles PATCH /api/v1/admin/verifications/:id — a manual
// override (approve/reject) by an admin, e.g. after reviewing edge cases
// VerifyMe couldn't automatically resolve.
func (h *VerificationHandler) AdminReview(c *gin.Context) {
	id := c.Param("id")
	adminID := c.MustGet("user_id").(uuid.UUID)

	var req struct {
		Status string `json:"status" binding:"required,oneof=verified rejected"`
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var verification models.IdentityVerification
	if err := h.DB.First(&verification, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "verification not found")
		return
	}

	verification.Status = models.IdentityVerificationStatus(req.Status)
	verification.ReviewedBy = &adminID
	if req.Status == "verified" {
		now := time.Now()
		verification.VerifiedAt = &now
		h.DB.Model(&models.User{}).Where("id = ?", verification.UserID).Updates(map[string]interface{}{"nin_verified": true, "identity_verified_at": now})
		h.DB.Model(&models.Agent{}).Where("user_id = ?", verification.UserID).Update("identity_verified", true)
		h.Notifier.Send(verification.UserID, "verification_approved", "Identity Verified ✅", "An admin has manually approved your identity verification.")
	} else {
		verification.FailureReason = req.Notes
		h.Notifier.Send(verification.UserID, "verification_rejected", "Identity Verification Rejected", "An admin reviewed your identity verification and could not approve it: "+req.Notes)
	}
	h.DB.Save(&verification)

	writeAuditLog(h.DB, &adminID, "verification.review", "identity_verification", id, req.Notes, c.ClientIP())

	utils.Success(c, http.StatusOK, "verification updated", verification)
}

func splitName(full string) (first, last string) {
	name := trimSpaces(full)
	for i := len(name) - 1; i >= 0; i-- {
		if name[i] == ' ' {
			return name[:i], name[i+1:]
		}
	}
	return name, ""
}

func trimSpaces(s string) string {
	start, end := 0, len(s)
	for start < end && s[start] == ' ' {
		start++
	}
	for end > start && s[end-1] == ' ' {
		end--
	}
	return s[start:end]
}
