package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// AuthHandler groups all authentication endpoints.
type AuthHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{DB: db, Cfg: cfg}
}

type registerRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role"` // optional: customer (default) | agent
}

// Register creates a new customer or agent account. Full platform access
// (publishing listings, unrestricted browsing of premium features) is
// gated separately behind VerifyMe identity verification — see
// verification_handler.go — so registration itself stays lightweight.
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var existing models.User
	if err := h.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		utils.Error(c, http.StatusConflict, "an account with this email already exists")
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to secure password")
		return
	}

	role := models.RoleCustomer
	if req.Role == string(models.RoleAgent) {
		role = models.RoleAgent
	}

	user := models.User{
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: hash,
		Role:         role,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to create account")
		return
	}

	if role == models.RoleAgent {
		agent := models.Agent{UserID: user.ID, ApprovalStatus: models.AgentApprovalNotApplied}
		h.DB.Create(&agent)
	}

	issueTokenPair(c, h.DB, h.Cfg, http.StatusCreated, "account created successfully", user)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login authenticates a user with email/password.
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		utils.Error(c, http.StatusUnauthorized, "invalid email or password")
		return
	}

	issueTokenPair(c, h.DB, h.Cfg, http.StatusOK, "login successful", user)
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh exchanges a valid, non-revoked refresh token for a new access/
// refresh pair, rotating the refresh token (the old one is revoked) so a
// leaked refresh token has a minimal window of usefulness.
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := utils.ParseToken(req.RefreshToken, h.Cfg.JWTRefreshSecret)
	if err != nil {
		utils.Error(c, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	var record models.RefreshTokenRecord
	tokenHash := utils.HashToken(req.RefreshToken)
	if err := h.DB.Where("token_hash = ?", tokenHash).First(&record).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "refresh token not recognized (already used or revoked)")
		return
	}
	if record.RevokedAt != nil || time.Now().After(record.ExpiresAt) {
		utils.Error(c, http.StatusUnauthorized, "refresh token has been revoked or expired")
		return
	}

	var user models.User
	if err := h.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "user no longer exists")
		return
	}

	now := time.Now()
	h.DB.Model(&record).Update("revoked_at", now)

	issueTokenPair(c, h.DB, h.Cfg, http.StatusOK, "token refreshed", user)
}

// Logout revokes a specific refresh token (single-session logout).
func (h *AuthHandler) Logout(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	tokenHash := utils.HashToken(req.RefreshToken)
	h.DB.Model(&models.RefreshTokenRecord{}).Where("token_hash = ? AND revoked_at IS NULL", tokenHash).Update("revoked_at", time.Now())
	utils.Success(c, http.StatusOK, "logged out", nil)
}

// Me returns the authenticated user's profile.
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.MustGet("user_id")

	var user models.User
	if err := h.DB.Preload("Agent").Preload("IdentityVerification").First(&user, "id = ?", userID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "user not found")
		return
	}

	utils.Success(c, http.StatusOK, "profile fetched", user)
}

// issueTokenPair signs a fresh access/refresh JWT pair for user, persists a
// hashed record of the refresh token (so it can be looked up/revoked later),
// and writes the standard success envelope. Shared by email/password login,
// registration, token refresh, and Google OAuth sign-in so every entry point
// produces sessions with identical security properties.
func issueTokenPair(c *gin.Context, db *gorm.DB, cfg *config.Config, status int, message string, user models.User) {
	accessToken, err := utils.GenerateToken(user.ID, string(user.Role), cfg.JWTAccessSecret, time.Duration(cfg.AccessTokenTTLMin)*time.Minute)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to issue access token")
		return
	}

	refreshTTL := time.Duration(cfg.RefreshTokenTTLDay) * 24 * time.Hour
	refreshToken, err := utils.GenerateToken(user.ID, string(user.Role), cfg.JWTRefreshSecret, refreshTTL)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to issue refresh token")
		return
	}

	record := models.RefreshTokenRecord{
		UserID:    user.ID,
		TokenHash: utils.HashToken(refreshToken),
		UserAgent: c.Request.UserAgent(),
		IPAddress: c.ClientIP(),
		ExpiresAt: time.Now().Add(refreshTTL),
	}
	db.Create(&record)

	utils.Success(c, status, message, gin.H{
		"user":          user,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}
