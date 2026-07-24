package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/thevhomes/backend/internal/config"
)

// PaymentInitResult is the normalized result of starting a checkout with
// either provider, ready to hand back to the frontend as a redirect target.
type PaymentInitResult struct {
	CheckoutURL       string
	ProviderReference string
}

// PaymentVerifyResult is the normalized result of confirming a transaction.
type PaymentVerifyResult struct {
	Success           bool
	AmountKobo        int64
	Currency          string
	ProviderReference string
	RawResponse       []byte
}

// PaystackClient talks to https://api.paystack.co.
type PaystackClient struct {
	cfg    *config.Config
	client *http.Client
}

func NewPaystackClient(cfg *config.Config) *PaystackClient {
	return &PaystackClient{cfg: cfg, client: &http.Client{Timeout: 20 * time.Second}}
}

func (p *PaystackClient) Enabled() bool { return p.cfg.PaystackSecretKey != "" }

// Initialize calls POST /transaction/initialize. amountNaira is converted to
// kobo (Paystack's smallest unit) automatically.
func (p *PaystackClient) Initialize(ctx context.Context, email string, amountNaira float64, reference, callbackURL string, metadata map[string]any) (PaymentInitResult, error) {
	if !p.Enabled() {
		return PaymentInitResult{}, errors.New("Paystack is not configured; set PAYSTACK_SECRET_KEY")
	}

	payload := map[string]any{
		"email":        email,
		"amount":       int64(amountNaira * 100),
		"reference":    reference,
		"callback_url": callbackURL,
		"metadata":     metadata,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.paystack.co/transaction/initialize", bytes.NewReader(body))
	if err != nil {
		return PaymentInitResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+p.cfg.PaystackSecretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return PaymentInitResult{}, err
	}
	defer resp.Body.Close()

	var parsed struct {
		Status  bool   `json:"status"`
		Message string `json:"message"`
		Data    struct {
			AuthorizationURL string `json:"authorization_url"`
			Reference        string `json:"reference"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return PaymentInitResult{}, err
	}
	if !parsed.Status {
		return PaymentInitResult{}, fmt.Errorf("paystack initialize failed: %s", parsed.Message)
	}

	return PaymentInitResult{CheckoutURL: parsed.Data.AuthorizationURL, ProviderReference: parsed.Data.Reference}, nil
}

// Verify calls GET /transaction/verify/:reference.
func (p *PaystackClient) Verify(ctx context.Context, reference string) (PaymentVerifyResult, error) {
	if !p.Enabled() {
		return PaymentVerifyResult{}, errors.New("Paystack is not configured; set PAYSTACK_SECRET_KEY")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.paystack.co/transaction/verify/"+reference, nil)
	if err != nil {
		return PaymentVerifyResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+p.cfg.PaystackSecretKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return PaymentVerifyResult{}, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var parsed struct {
		Status bool `json:"status"`
		Data   struct {
			Status    string `json:"status"`
			Reference string `json:"reference"`
			Amount    int64  `json:"amount"`
			Currency  string `json:"currency"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return PaymentVerifyResult{}, err
	}

	return PaymentVerifyResult{
		Success:           parsed.Status && parsed.Data.Status == "success",
		AmountKobo:        parsed.Data.Amount,
		Currency:          parsed.Data.Currency,
		ProviderReference: parsed.Data.Reference,
		RawResponse:       raw,
	}, nil
}

// FlutterwaveClient talks to https://api.flutterwave.com/v3.
type FlutterwaveClient struct {
	cfg    *config.Config
	client *http.Client
}

func NewFlutterwaveClient(cfg *config.Config) *FlutterwaveClient {
	return &FlutterwaveClient{cfg: cfg, client: &http.Client{Timeout: 20 * time.Second}}
}

func (f *FlutterwaveClient) Enabled() bool { return f.cfg.FlutterwaveSecretKey != "" }

// Initialize calls POST /v3/payments.
func (f *FlutterwaveClient) Initialize(ctx context.Context, email, name string, amountNaira float64, reference, redirectURL string, metadata map[string]any) (PaymentInitResult, error) {
	if !f.Enabled() {
		return PaymentInitResult{}, errors.New("Flutterwave is not configured; set FLUTTERWAVE_SECRET_KEY")
	}

	payload := map[string]any{
		"tx_ref":       reference,
		"amount":       amountNaira,
		"currency":     "NGN",
		"redirect_url": redirectURL,
		"customer": map[string]string{
			"email": email,
			"name":  name,
		},
		"meta": metadata,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.flutterwave.com/v3/payments", bytes.NewReader(body))
	if err != nil {
		return PaymentInitResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+f.cfg.FlutterwaveSecretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := f.client.Do(req)
	if err != nil {
		return PaymentInitResult{}, err
	}
	defer resp.Body.Close()

	var parsed struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Data    struct {
			Link string `json:"link"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return PaymentInitResult{}, err
	}
	if parsed.Status != "success" {
		return PaymentInitResult{}, fmt.Errorf("flutterwave initialize failed: %s", parsed.Message)
	}

	return PaymentInitResult{CheckoutURL: parsed.Data.Link, ProviderReference: reference}, nil
}

// Verify calls GET /v3/transactions/verify_by_reference?tx_ref=...
func (f *FlutterwaveClient) Verify(ctx context.Context, reference string) (PaymentVerifyResult, error) {
	if !f.Enabled() {
		return PaymentVerifyResult{}, errors.New("Flutterwave is not configured; set FLUTTERWAVE_SECRET_KEY")
	}

	url := "https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=" + reference
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return PaymentVerifyResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+f.cfg.FlutterwaveSecretKey)

	resp, err := f.client.Do(req)
	if err != nil {
		return PaymentVerifyResult{}, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var parsed struct {
		Status string `json:"status"`
		Data   struct {
			Status   string  `json:"status"`
			TxRef    string  `json:"tx_ref"`
			Amount   float64 `json:"amount"`
			Currency string  `json:"currency"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return PaymentVerifyResult{}, err
	}

	return PaymentVerifyResult{
		Success:           parsed.Status == "success" && parsed.Data.Status == "successful",
		AmountKobo:        int64(parsed.Data.Amount * 100),
		Currency:          parsed.Data.Currency,
		ProviderReference: parsed.Data.TxRef,
		RawResponse:       raw,
	}, nil
}
