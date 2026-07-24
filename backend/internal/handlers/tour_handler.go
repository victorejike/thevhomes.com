package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// TourHandler manages the interactive 3D property tour pipeline: agents
// capture room-by-room scenes on-device (phone camera — photo 360 sweep,
// short video sweep, or a raw frame sequence intended for Gaussian-splat/
// NeRF reconstruction), upload each as a PropertyTourScene, then mark the
// tour "ready" once processing completes. The viewer that renders the
// finished tour in-browser (no app install) lives in the frontend
// (components/tour-viewer.tsx) and reads AssetURL + ViewerType.
type TourHandler struct {
	DB *gorm.DB
}

func NewTourHandler(db *gorm.DB) *TourHandler {
	return &TourHandler{DB: db}
}

// Get handles GET /api/v1/properties/:id/tour
func (h *TourHandler) Get(c *gin.Context) {
	propertyID := c.Param("id")

	var tour models.PropertyTour
	if err := h.DB.Preload("Scenes").Where("property_id = ?", propertyID).First(&tour).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "no 3D tour started for this property yet")
		return
	}
	utils.Success(c, http.StatusOK, "tour fetched", tour)
}

type startTourRequest struct {
	CaptureMethod string `json:"capture_method" binding:"required,oneof=gaussian_splatting nerf webxr matterport photo_360"`
}

// Start handles POST /api/v1/properties/:id/tour/start — the agent chooses a
// capture technology before scanning rooms. Idempotent: re-starting just
// updates the chosen capture method while status is still not_started.
func (h *TourHandler) Start(c *gin.Context) {
	propertyID := c.Param("id")
	if !h.ownsProperty(c, propertyID) {
		return
	}

	var req startTourRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var tour models.PropertyTour
	if err := h.DB.Where("property_id = ?", propertyID).First(&tour).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "tour record not found; create the property first")
		return
	}

	tour.CaptureMethod = models.CaptureMethod(req.CaptureMethod)
	tour.Status = models.TourCapturing
	switch tour.CaptureMethod {
	case models.CaptureMatterport:
		tour.ViewerType = "matterport_embed"
	case models.CaptureGaussianSplatting, models.CaptureNeRF:
		tour.ViewerType = "splat_viewer"
	default:
		tour.ViewerType = "panorama_viewer"
	}
	h.DB.Save(&tour)

	utils.Success(c, http.StatusOK, "tour capture started — scan each room with your phone camera", tour)
}

type addSceneRequest struct {
	RoomName  string `json:"room_name" binding:"required"`
	MediaURL  string `json:"media_url" binding:"required"`
	SceneType string `json:"scene_type" binding:"required,oneof=photo_360 video_sweep frame_sequence"`
}

// AddScene handles POST /api/v1/properties/:id/tour/scenes — called once per
// room after the browser/device camera capture flow uploads the resulting
// media (a 360 panorama, a short video walk around the room, or a frame
// sequence destined for splat/NeRF reconstruction).
func (h *TourHandler) AddScene(c *gin.Context) {
	propertyID := c.Param("id")
	if !h.ownsProperty(c, propertyID) {
		return
	}

	var req addSceneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var tour models.PropertyTour
	if err := h.DB.Where("property_id = ?", propertyID).First(&tour).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "start the tour before adding room scenes")
		return
	}

	var count int64
	h.DB.Model(&models.PropertyTourScene{}).Where("tour_id = ?", tour.ID).Count(&count)

	scene := models.PropertyTourScene{
		TourID: tour.ID, RoomName: req.RoomName, MediaURL: req.MediaURL,
		SceneType: req.SceneType, SortOrder: int(count),
	}
	if err := h.DB.Create(&scene).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to save room scene")
		return
	}

	h.DB.Model(&tour).Update("room_count", count+1)

	utils.Success(c, http.StatusCreated, "room scene captured", scene)
}

type completeTourRequest struct {
	AssetURL           string `json:"asset_url"`
	ThumbnailURL       string `json:"thumbnail_url"`
	ProcessingProvider string `json:"processing_provider"` // matterport | kiri_engine | luma_ai | polycam | self_hosted
	ProcessingJobID    string `json:"processing_job_id"`
}

// Complete handles POST /api/v1/properties/:id/tour/complete — called once
// every room has been captured. If a 3D-reconstruction provider (Matterport,
// KIRI Engine, Luma AI, Polycam, or a self-hosted Gaussian-splat/NeRF
// pipeline) is configured, hand the captured scenes off for processing and
// record the job reference; otherwise (e.g. a simple photo-360 walkthrough)
// the tour is immediately ready.
func (h *TourHandler) Complete(c *gin.Context) {
	propertyID := c.Param("id")
	if !h.ownsProperty(c, propertyID) {
		return
	}

	var req completeTourRequest
	_ = c.ShouldBindJSON(&req)

	var tour models.PropertyTour
	if err := h.DB.Preload("Scenes").Where("property_id = ?", propertyID).First(&tour).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "tour not found")
		return
	}
	if len(tour.Scenes) == 0 {
		utils.Error(c, http.StatusUnprocessableEntity, "capture at least one room before completing the tour")
		return
	}

	tour.ProcessingProvider = req.ProcessingProvider
	tour.ProcessingJobID = req.ProcessingJobID
	tour.ThumbnailURL = req.ThumbnailURL
	if req.AssetURL != "" {
		tour.AssetURL = req.AssetURL
	} else if tour.ViewerType == "panorama_viewer" {
		// No external reconstruction needed — stitch client-side viewer just
		// walks the raw scene list directly.
		tour.AssetURL = tour.Scenes[0].MediaURL
	}

	if req.ProcessingProvider != "" && req.ProcessingJobID != "" {
		tour.Status = models.TourProcessing
	} else {
		tour.Status = models.TourReady
	}
	h.DB.Save(&tour)

	utils.Success(c, http.StatusOK, "tour capture complete", tour)
}

// WebhookProcessed handles POST /api/v1/tours/:id/webhook — the callback a
// 3D-reconstruction provider (Matterport/KIRI/Luma/Polycam) hits once an
// async splat/NeRF/mesh job finishes, flipping the tour to ready/failed.
func (h *TourHandler) WebhookProcessed(c *gin.Context) {
	tourID := c.Param("id")

	var req struct {
		Success       bool   `json:"success"`
		AssetURL      string `json:"asset_url"`
		ThumbnailURL  string `json:"thumbnail_url"`
		FailureReason string `json:"failure_reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var tour models.PropertyTour
	if err := h.DB.First(&tour, "id = ?", tourID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "tour not found")
		return
	}

	if req.Success {
		tour.Status = models.TourReady
		if req.AssetURL != "" {
			tour.AssetURL = req.AssetURL
		}
		if req.ThumbnailURL != "" {
			tour.ThumbnailURL = req.ThumbnailURL
		}
	} else {
		tour.Status = models.TourFailed
		tour.FailureReason = req.FailureReason
	}
	h.DB.Save(&tour)

	utils.Success(c, http.StatusOK, "tour status updated", tour)
}

func (h *TourHandler) ownsProperty(c *gin.Context, propertyID string) bool {
	userID := c.MustGet("user_id").(uuid.UUID)

	if c.GetString("role") == string(models.RoleAdmin) {
		return true
	}

	var property models.Property
	if err := h.DB.First(&property, "id = ?", propertyID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return false
	}

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil || agent.ID != property.AgentID {
		utils.Error(c, http.StatusForbidden, "you do not own this listing")
		return false
	}
	return true
}
