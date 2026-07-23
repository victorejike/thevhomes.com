package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/utils"
)

type UploadHandler struct {
	Cfg *config.Config
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{Cfg: cfg}
}

// PresignRequest handles POST /api/v1/uploads/presign.
//
// TODO(production): implement real Cloudflare R2 (S3-compatible) presigned
// PUT URL generation using aws-sdk-go-v2 once CLOUDFLARE_R2_* credentials are
// provisioned. The frontend already expects this exact response shape:
//
//	{ "upload_url": "...", "public_url": "...", "expires_in": 900 }
//
// so swapping the stub for a real implementation requires no frontend changes.
func (h *UploadHandler) PresignRequest(c *gin.Context) {
	var req struct {
		Filename    string `json:"filename" binding:"required"`
		ContentType string `json:"content_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if h.Cfg.CloudflareR2Bucket == "" {
		utils.Error(c, http.StatusServiceUnavailable, "media storage is not configured yet; set CLOUDFLARE_R2_* env vars")
		return
	}

	// Placeholder response until credentials + SDK wiring are added.
	utils.Success(c, http.StatusOK, "presigned URL generated", gin.H{
		"upload_url": h.Cfg.CloudflareR2Endpoint + "/" + h.Cfg.CloudflareR2Bucket + "/" + req.Filename,
		"public_url": "https://media.thevhomes.com/" + req.Filename,
		"expires_in": 900,
	})
}
