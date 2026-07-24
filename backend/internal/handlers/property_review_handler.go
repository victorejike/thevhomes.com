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

// PropertyReviewHandler implements the admin property-verification workflow:
// Draft -> Pending Review -> Under Inspection -> Verified / Rejected.
type PropertyReviewHandler struct {
	DB       *gorm.DB
	Notifier *services.Notifier
}

func NewPropertyReviewHandler(db *gorm.DB, cfg *config.Config) *PropertyReviewHandler {
	return &PropertyReviewHandler{DB: db, Notifier: services.NewNotifier(db, cfg)}
}

// SubmitForReview handles POST /api/v1/properties/:id/submit-for-review.
// This is the enforcement point for "the listing cannot be published until a
// 3D property tour has been uploaded" plus the other listing-quality gates.
func (h *PropertyReviewHandler) SubmitForReview(c *gin.Context) {
	id := c.Param("id")
	userID := c.MustGet("user_id").(uuid.UUID)

	var property models.Property
	if err := h.DB.Preload("Images").Preload("Tour").First(&property, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil || agent.ID != property.AgentID {
		if c.GetString("role") != string(models.RoleAdmin) {
			utils.Error(c, http.StatusForbidden, "you do not own this listing")
			return
		}
	}

	if property.ListingStatus == models.ListingVerified {
		utils.Error(c, http.StatusConflict, "this listing is already verified")
		return
	}

	var problems []string
	if property.Title == "" || property.Description == "" || property.Price <= 0 {
		problems = append(problems, "title, description, and price are required")
	}
	if property.Address == "" || (property.Latitude == 0 && property.Longitude == 0) {
		problems = append(problems, "address and map coordinates are required")
	}
	if len(property.Amenities) == 0 {
		problems = append(problems, "at least one amenity is required")
	}
	if len(property.Images) == 0 {
		problems = append(problems, "at least one gallery photo is required")
	}
	if property.CoverImageURL == "" {
		problems = append(problems, "a cover photo is required")
	}
	if property.Tour == nil || property.Tour.Status != models.TourReady {
		problems = append(problems, "an interactive 3D property tour must be uploaded and finished processing before this listing can be published")
	}

	if len(problems) > 0 {
		utils.Error(c, http.StatusUnprocessableEntity, "listing is not ready for review: "+joinProblems(problems))
		return
	}

	from := string(property.ListingStatus)
	h.DB.Model(&property).Update("listing_status", models.ListingPendingReview)
	h.DB.Create(&models.PropertyVerificationLog{
		PropertyID: property.ID, ActorID: &userID, Action: "submit_for_review",
		FromStatus: from, ToStatus: string(models.ListingPendingReview),
	})
	h.DB.Create(&models.PropertyReview{PropertyID: property.ID, Status: models.ListingPendingReview})

	utils.Success(c, http.StatusOK, "listing submitted for admin review", gin.H{"listing_status": models.ListingPendingReview})
}

// AdminQueue handles GET /api/v1/admin/properties/review-queue?status=pending_review
func (h *PropertyReviewHandler) AdminQueue(c *gin.Context) {
	status := c.DefaultQuery("status", string(models.ListingPendingReview))

	var properties []models.Property
	query := h.DB.Preload("Images").Preload("Agent").Preload("Agent.User").Preload("Tour")
	if status != "all" {
		query = query.Where("listing_status = ?", status)
	}
	if err := query.Order("created_at ASC").Find(&properties).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch review queue")
		return
	}
	utils.Success(c, http.StatusOK, "review queue fetched", properties)
}

type reviewPropertyRequest struct {
	Status              string `json:"status" binding:"required,oneof=under_inspection verified rejected"`
	ImagesChecked       bool   `json:"images_checked"`
	OwnershipDocChecked bool   `json:"ownership_doc_checked"`
	LocationChecked     bool   `json:"location_checked"`
	DetailsChecked      bool   `json:"details_checked"`
	TourChecked         bool   `json:"tour_checked"`
	Notes               string `json:"notes"`
	PremiumListing      bool   `json:"premium_listing"`
}

// AdminReview handles PATCH /api/v1/admin/properties/:id/review
func (h *PropertyReviewHandler) AdminReview(c *gin.Context) {
	id := c.Param("id")
	adminID := c.MustGet("user_id").(uuid.UUID)

	var req reviewPropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var property models.Property
	if err := h.DB.Preload("Agent").First(&property, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	from := string(property.ListingStatus)
	newStatus := models.ListingStatus(req.Status)

	updates := map[string]interface{}{"listing_status": newStatus}
	if newStatus == models.ListingVerified {
		verificationLevel := models.VerificationVerified
		if req.PremiumListing {
			verificationLevel = models.VerificationPremiumVerified
		}
		updates["verification_status"] = verificationLevel
	}
	h.DB.Model(&property).Updates(updates)

	now := time.Now()
	h.DB.Create(&models.PropertyReview{
		PropertyID: property.ID, ReviewerID: &adminID, Status: newStatus,
		ImagesChecked: req.ImagesChecked, OwnershipDocChecked: req.OwnershipDocChecked,
		LocationChecked: req.LocationChecked, DetailsChecked: req.DetailsChecked,
		TourChecked: req.TourChecked, Notes: req.Notes, ReviewedAt: &now,
	})
	h.DB.Create(&models.PropertyVerificationLog{
		PropertyID: property.ID, ActorID: &adminID, Action: "admin_review",
		FromStatus: from, ToStatus: string(newStatus), Notes: req.Notes,
	})

	writeAuditLog(h.DB, &adminID, "property.review."+req.Status, "property", id, req.Notes, c.ClientIP())

	if newStatus == models.ListingVerified {
		h.Notifier.Send(property.Agent.UserID, "listing_approved", "Listing Verified ✅", "Your listing \""+property.Title+"\" has passed review and is now live on TheVHomes.")
	} else if newStatus == models.ListingRejected {
		h.Notifier.Send(property.Agent.UserID, "listing_rejected", "Listing Rejected", "Your listing \""+property.Title+"\" was rejected: "+req.Notes)
	}

	utils.Success(c, http.StatusOK, "property review updated", property)
}

func joinProblems(problems []string) string {
	out := ""
	for i, p := range problems {
		if i > 0 {
			out += "; "
		}
		out += p
	}
	return out
}
