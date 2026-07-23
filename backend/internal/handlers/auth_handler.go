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

// Register creates a new customer or agent account.
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
		agent := models.Agent{UserID: user.ID}
		h.DB.Create(&agent)
	}

	h.issueTokens(c, http.StatusCreated, "account created successfully", user)
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

	h.issueTokens(c, http.StatusOK, "login successful", user)
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh exchanges a valid refresh token for a new access/refresh pair.
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

	var user models.User
	if err := h.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "user no longer exists")
		return
	}

	h.issueTokens(c, http.StatusOK, "token refreshed", user)
}

// Me returns the authenticated user's profile.
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.MustGet("user_id")

	var user models.User
	if err := h.DB.Preload("Agent").First(&user, "id = ?", userID).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "user not found")
		return
	}

	utils.Success(c, http.StatusOK, "profile fetched", user)
}

func (h *AuthHandler) issueTokens(c *gin.Context, status int, message string, user models.User) {
	accessToken, err := utils.GenerateToken(user.ID, string(user.Role), h.Cfg.JWTAccessSecret, time.Duration(h.Cfg.AccessTokenTTLMin)*time.Minute)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to issue access token")
		return
	}

	refreshToken, err := utils.GenerateToken(user.ID, string(user.Role), h.Cfg.JWTRefreshSecret, time.Duration(h.Cfg.RefreshTokenTTLDay)*24*time.Hour)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to issue refresh token")
		return
	}

	utils.Success(c, status, message, gin.H{
		"user":          user,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}
