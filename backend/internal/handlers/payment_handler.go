package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewPaymentHandler(db *gorm.DB, cfg *config.Config) *PaymentHandler {
	return &PaymentHandler{DB: db, Cfg: cfg}
}

type initPaymentRequest struct {
	Amount     float64 `json:"amount" binding:"required"`
	Currency   string  `json:"currency"`
	Purpose    string  `json:"purpose" binding:"required,oneof=booking_fee reservation consultation shortlet_booking"`
	Provider   string  `json:"provider" binding:"required,oneof=paystack flutterwave"`
	PropertyID *string `json:"property_id"`
}

// Initialize handles POST /api/v1/payments/initialize.
//
// TODO(production): call the real Paystack ("/transaction/initialize") or
// Flutterwave ("/v3/payments") APIs using Cfg.PaystackSecretKey /
// Cfg.FlutterwaveSecretKey, and return their hosted checkout URL instead of
// the local reference below. Verify webhooks in Verify() before marking a
// Payment as successful.
func (h *PaymentHandler) Initialize(c *gin.Context) {
	var req initPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Provider == "paystack" && h.Cfg.PaystackSecretKey == "" {
		utils.Error(c, http.StatusServiceUnavailable, "Paystack is not configured yet; set PAYSTACK_SECRET_KEY")
		return
	}
	if req.Provider == "flutterwave" && h.Cfg.FlutterwaveSecretKey == "" {
		utils.Error(c, http.StatusServiceUnavailable, "Flutterwave is not configured yet; set FLUTTERWAVE_SECRET_KEY")
		return
	}

	if req.Currency == "" {
		req.Currency = "NGN"
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	reference := "THV-" + uuid.New().String()

	payment := models.Payment{
		UserID: userID, Amount: req.Amount, Currency: req.Currency,
		Purpose: req.Purpose, Provider: req.Provider, Reference: reference,
		Status: models.PaymentPending,
	}
	if req.PropertyID != nil {
		if pid, err := uuid.Parse(*req.PropertyID); err == nil {
			payment.PropertyID = &pid
		}
	}

	if err := h.DB.Create(&payment).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to initialize payment")
		return
	}

	utils.Success(c, http.StatusCreated, "payment initialized (checkout URL pending provider integration)", payment)
}

// Verify handles GET /api/v1/payments/:reference/verify — intended to be
// called from the provider's webhook or the frontend's success redirect.
func (h *PaymentHandler) Verify(c *gin.Context) {
	reference := c.Param("reference")

	var payment models.Payment
	if err := h.DB.Where("reference = ?", reference).First(&payment).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "payment not found")
		return
	}

	// TODO(production): verify against the provider's API before trusting this.
	utils.Success(c, http.StatusOK, "payment status", payment)
}
