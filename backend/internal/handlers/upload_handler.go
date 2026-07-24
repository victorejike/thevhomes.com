package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

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
// This generates a Cloudflare R2-compatible S3 presigned PUT URL directly
// using AWS Signature V4 signing logic, so it does not require the AWS SDK.
func (h *UploadHandler) PresignRequest(c *gin.Context) {
	var req struct {
		Filename    string `json:"filename" binding:"required"`
		ContentType string `json:"content_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if h.Cfg.CloudflareR2Bucket == "" || h.Cfg.CloudflareR2Key == "" || h.Cfg.CloudflareR2Secret == "" || h.Cfg.CloudflareR2Endpoint == "" {
		utils.Error(c, http.StatusServiceUnavailable, "media storage is not configured yet; set CLOUDFLARE_R2_* env vars")
		return
	}

	uploadURL, expiresIn, err := h.generatePresignedPutURL(req.Filename)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to generate presigned URL")
		return
	}

	publicURL := fmt.Sprintf(
		"%s/%s/%s",
		strings.TrimRight(h.Cfg.CloudflareR2Endpoint, "/"),
		strings.Trim(h.Cfg.CloudflareR2Bucket, "/"),
		strings.TrimLeft(req.Filename, "/"),
	)

	utils.Success(c, http.StatusOK, "presigned URL generated", gin.H{
		"upload_url": uploadURL,
		"public_url": publicURL,
		"expires_in": expiresIn,
	})
}

func (h *UploadHandler) generatePresignedPutURL(key string) (string, int, error) {
	endpoint := strings.TrimRight(h.Cfg.CloudflareR2Endpoint, "/")
	bucket := strings.Trim(h.Cfg.CloudflareR2Bucket, "/")
	objectKey := strings.TrimLeft(key, "/")

	u, err := url.Parse(endpoint)
	if err != nil {
		return "", 0, err
	}

	host := u.Host
	canonicalURI := fmt.Sprintf("/%s/%s", bucket, objectKey)

	t := time.Now().UTC()
	amzDate := t.Format("20060102T150405Z")
	dateStamp := t.Format("20060102")
	region := "auto"
	service := "s3"
	expires := 900

	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)

	query := url.Values{}
	query.Set("X-Amz-Algorithm", "AWS4-HMAC-SHA256")
	query.Set("X-Amz-Credential", fmt.Sprintf("%s/%s", h.Cfg.CloudflareR2Key, credentialScope))
	query.Set("X-Amz-Date", amzDate)
	query.Set("X-Amz-Expires", fmt.Sprintf("%d", expires))
	query.Set("X-Amz-SignedHeaders", "host")

	canonicalRequest := strings.Join([]string{
		"PUT",
		canonicalURI,
		canonicalQueryString(query),
		fmt.Sprintf("host:%s\n", host),
		"host",
		"UNSIGNED-PAYLOAD",
	}, "\n")

	hashedCanonical := sha256Hex([]byte(canonicalRequest))
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		hashedCanonical,
	}, "\n")

	signingKey := getSignatureKey(h.Cfg.CloudflareR2Secret, dateStamp, region, service)
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))
	query.Set("X-Amz-Signature", signature)

	u.RawQuery = query.Encode()
	u.Path = fmt.Sprintf("/%s/%s", bucket, objectKey)

	return u.String(), expires, nil
}

func canonicalQueryString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for k := range values {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		for _, v := range values[k] {
			parts = append(parts, fmt.Sprintf("%s=%s", url.QueryEscape(k), url.QueryEscape(v)))
		}
	}

	return strings.Join(parts, "&")
}

func sha256Hex(payload []byte) string {
	h := sha256.New()
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func getSignatureKey(secret, date, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), []byte(date))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	return hmacSHA256(kService, []byte("aws4_request"))
}
