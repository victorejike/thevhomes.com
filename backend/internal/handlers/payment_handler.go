package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/services"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB          *gorm.DB
	Cfg         *config.Config
	Paystack    *services.PaystackClient
	Flutterwave *services.FlutterwaveClient
	Notifier    *services.Notifier
}

func NewPaymentHandler(db *gorm.DB, cfg *config.Config) *PaymentHandler {
	return &PaymentHandler{
		DB: db, Cfg: cfg,
		Paystack:    services.NewPaystackClient(cfg),
		Flutterwave: services.NewFlutterwaveClient(cfg),
		Notifier:    services.NewNotifier(db, cfg),
	}
}

type initPaymentRequest struct {
	Amount     float64 `json:"amount" binding:"required"`
	Currency   string  `json:"currency"`
	Purpose    string  `json:"purpose" binding:"required,oneof=booking_fee reservation consultation shortlet_booking viewing_fee"`
	Provider   string  `json:"provider" binding:"required,oneof=paystack flutterwave"`
	PropertyID *string `json:"property_id"`
	BookingID  *string `json:"booking_id"`
}

// Initialize handles POST /api/v1/payments/initialize. When PAYSTACK_SECRET_KEY
// / FLUTTERWAVE_SECRET_KEY are configured, this calls the provider's real
// checkout-initialization API and returns a hosted checkout_url the frontend
// redirects the customer to. Without credentials, it degrades gracefully to
// a locally-tracked pending payment (documented "checkout URL pending
// provider integration"), matching the project's existing convention for
// unconfigured third-party services.
func (h *PaymentHandler) Initialize(c *gin.Context) {
	var req initPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Currency == "" {
		req.Currency = "NGN"
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	reference := utils.GenerateReference("THV")

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
	if req.BookingID != nil {
		if bid, err := uuid.Parse(*req.BookingID); err == nil {
			payment.BookingID = &bid
		}
	}

	if err := h.DB.Create(&payment).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to initialize payment")
		return
	}
	if payment.BookingID != nil {
		h.DB.Model(&models.Booking{}).Where("id = ?", payment.BookingID).Update("payment_id", payment.ID)
	}

	var user models.User
	h.DB.First(&user, "id = ?", userID)
	callbackURL := h.Cfg.FrontendURL + "/dashboard/bookings?payment_reference=" + reference

	switch req.Provider {
	case "paystack":
		if !h.Paystack.Enabled() {
			utils.Success(c, http.StatusCreated, "payment initialized (checkout URL pending provider integration; set PAYSTACK_SECRET_KEY)", payment)
			return
		}
		result, err := h.Paystack.Initialize(c.Request.Context(), user.Email, req.Amount, reference, callbackURL, map[string]any{"purpose": req.Purpose})
		if err != nil {
			utils.Error(c, http.StatusBadGateway, "Paystack initialize failed: "+err.Error())
			return
		}
		utils.Success(c, http.StatusCreated, "payment initialized", gin.H{"payment": payment, "checkout_url": result.CheckoutURL})
	case "flutterwave":
		if !h.Flutterwave.Enabled() {
			utils.Success(c, http.StatusCreated, "payment initialized (checkout URL pending provider integration; set FLUTTERWAVE_SECRET_KEY)", payment)
			return
		}
		result, err := h.Flutterwave.Initialize(c.Request.Context(), user.Email, user.Name, req.Amount, reference, callbackURL, map[string]any{"purpose": req.Purpose})
		if err != nil {
			utils.Error(c, http.StatusBadGateway, "Flutterwave initialize failed: "+err.Error())
			return
		}
		utils.Success(c, http.StatusCreated, "payment initialized", gin.H{"payment": payment, "checkout_url": result.CheckoutURL})
	}
}

// Verify handles GET /api/v1/payments/:reference/verify — called from the
// provider's webhook or the frontend's success redirect. Confirms the
// transaction against the provider's API (never trusts the client), then:
//   - marks the Payment success/failed,
//   - for purpose=viewing_fee, finalizes the linked booking (issues the
//     viewing ticket + notifies customer/agent/admin) exactly once,
//   - generates an invoice/receipt payload for the frontend to render/print.
func (h *PaymentHandler) Verify(c *gin.Context) {
	reference := c.Param("reference")

	var payment models.Payment
	if err := h.DB.Where("reference = ?", reference).First(&payment).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "payment not found")
		return
	}

	if payment.Status != models.PaymentSuccess {
		verified, providerRef, err := h.verifyWithProvider(c, payment)
		if err != nil {
			utils.Error(c, http.StatusBadGateway, "could not verify payment with provider: "+err.Error())
			return
		}
		if verified {
			payment.Status = models.PaymentSuccess
			payment.ProviderReference = providerRef
		} else {
			payment.Status = models.PaymentFailed
		}
		h.DB.Save(&payment)

		if payment.Status == models.PaymentSuccess {
			h.onPaymentSuccess(payment)
		}
	}

	utils.Success(c, http.StatusOK, "payment status", gin.H{
		"payment": payment,
		"receipt": buildReceipt(payment),
	})
}

func (h *PaymentHandler) verifyWithProvider(c *gin.Context, payment models.Payment) (bool, string, error) {
	switch payment.Provider {
	case "paystack":
		if !h.Paystack.Enabled() {
			return false, "", errNotConfigured("Paystack")
		}
		result, err := h.Paystack.Verify(c.Request.Context(), payment.Reference)
		if err != nil {
			return false, "", err
		}
		return result.Success, result.ProviderReference, nil
	case "flutterwave":
		if !h.Flutterwave.Enabled() {
			return false, "", errNotConfigured("Flutterwave")
		}
		result, err := h.Flutterwave.Verify(c.Request.Context(), payment.Reference)
		if err != nil {
			return false, "", err
		}
		return result.Success, result.ProviderReference, nil
	}
	return false, "", errNotConfigured(payment.Provider)
}

// Webhook handles POST /api/v1/payments/webhook/:provider — the
// server-to-server callback Paystack/Flutterwave call on transaction
// completion. The payload's reference is re-verified against the provider's
// own API (never trusting the webhook body directly) before anything is
// marked successful.
func (h *PaymentHandler) Webhook(c *gin.Context) {
	provider := c.Param("provider")

	var body struct {
		Data struct {
			Reference string `json:"reference"`
			TxRef     string `json:"tx_ref"`
		} `json:"data"`
	}
	_ = c.ShouldBindJSON(&body)

	reference := body.Data.Reference
	if reference == "" {
		reference = body.Data.TxRef
	}
	if reference == "" {
		utils.Error(c, http.StatusBadRequest, "missing transaction reference")
		return
	}

	var payment models.Payment
	if err := h.DB.Where("reference = ? AND provider = ?", reference, provider).First(&payment).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "payment not found")
		return
	}

	verified, providerRef, err := h.verifyWithProvider(c, payment)
	if err == nil && verified && payment.Status != models.PaymentSuccess {
		payment.Status = models.PaymentSuccess
		payment.ProviderReference = providerRef
		h.DB.Save(&payment)
		h.onPaymentSuccess(payment)
	}

	c.Status(http.StatusOK)
}

func (h *PaymentHandler) onPaymentSuccess(payment models.Payment) {
	h.Notifier.Send(payment.UserID, "payment_successful", "Payment Successful", "Your payment of NGN "+formatAmount(payment.Amount)+" was successful. Reference: "+payment.Reference)

	if payment.Purpose == "viewing_fee" && payment.BookingID != nil {
		var booking models.Booking
		if err := h.DB.First(&booking, "id = ?", *payment.BookingID).Error; err == nil {
			FinalizeBooking(h.DB, h.Cfg, h.Notifier, booking)
		}
	}
}

func buildReceipt(payment models.Payment) gin.H {
	return gin.H{
		"receipt_number": "RCPT-" + payment.Reference,
		"amount":         payment.Amount,
		"currency":       payment.Currency,
		"purpose":        payment.Purpose,
		"provider":       payment.Provider,
		"status":         payment.Status,
		"issued_at":      payment.CreatedAt,
	}
}

func formatAmount(amount float64) string {
	return strconv.FormatFloat(amount, 'f', 2, 64)
}

// RequestRefund handles POST /api/v1/payments/:reference/refund-request —
// a customer asks for their money back (e.g. a cancelled viewing).
func (h *PaymentHandler) RequestRefund(c *gin.Context) {
	reference := c.Param("reference")
	userID := c.MustGet("user_id").(uuid.UUID)

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	var payment models.Payment
	if err := h.DB.Where("reference = ? AND user_id = ?", reference, userID).First(&payment).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "payment not found")
		return
	}
	if payment.Status != models.PaymentSuccess {
		utils.Error(c, http.StatusConflict, "only successful payments can be refunded")
		return
	}

	payment.RefundStatus = "requested"
	payment.RefundReason = req.Reason
	h.DB.Save(&payment)

	notifyAdmins(h.DB, h.Notifier, "refund_requested", "Refund Requested", "A refund was requested for payment "+payment.Reference+": "+req.Reason)

	utils.Success(c, http.StatusOK, "refund requested", payment)
}

type resolveRefundRequest struct {
	Decision string `json:"decision" binding:"required,oneof=approved rejected refunded"`
	Notes    string `json:"notes"`
}

// AdminResolveRefund handles PATCH /api/v1/admin/payments/:reference/refund
func (h *PaymentHandler) AdminResolveRefund(c *gin.Context) {
	reference := c.Param("reference")
	adminID := c.MustGet("user_id").(uuid.UUID)

	var req resolveRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var payment models.Payment
	if err := h.DB.Where("reference = ?", reference).First(&payment).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "payment not found")
		return
	}

	payment.RefundStatus = req.Decision
	h.DB.Save(&payment)

	writeAuditLog(h.DB, &adminID, "payment.refund."+req.Decision, "payment", reference, req.Notes, c.ClientIP())
	h.Notifier.Send(payment.UserID, "refund_"+req.Decision, "Refund Update", "Your refund request for payment "+payment.Reference+" is now: "+req.Decision)

	utils.Success(c, http.StatusOK, "refund updated", payment)
}

func errNotConfigured(provider string) error {
	return &notConfiguredError{provider}
}

type notConfiguredError struct{ provider string }

func (e *notConfiguredError) Error() string {
	return e.provider + " is not configured"
}
