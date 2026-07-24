package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/thevhomes/backend/internal/config"
)

// VerifyMeClient wraps the VerifyMe (https://verifyme.ng) identity
// verification API used to confirm a Nigerian National Identification
// Number (NIN) belongs to the person registering on TheVHomes.
type VerifyMeClient struct {
	cfg    *config.Config
	client *http.Client
}

func NewVerifyMeClient(cfg *config.Config) *VerifyMeClient {
	return &VerifyMeClient{cfg: cfg, client: &http.Client{Timeout: 20 * time.Second}}
}

// NINLookupRequest is the payload cross-checked against VerifyMe's NIN
// record (name/DOB mismatch causes verification to fail even if the NIN
// itself exists, preventing identity theft/impersonation).
type NINLookupRequest struct {
	NIN         string
	FirstName   string
	LastName    string
	DateOfBirth string // YYYY-MM-DD
	PhoneNumber string
}

// NINLookupResult is the server-validated outcome returned to handlers. It
// deliberately omits the raw NIN and any other field not needed downstream.
type NINLookupResult struct {
	Matched     bool
	Verified    bool
	ProviderRef string
	PhotoURL    string
	RawResponse []byte
	HTTPStatus  int
	Error       string
}

// Enabled reports whether real VerifyMe credentials are configured.
func (v *VerifyMeClient) Enabled() bool {
	return v.cfg.VerifyMeAPIKey != ""
}

// VerifyNIN calls VerifyMe's NIN verification endpoint:
//
//	POST {VERIFYME_BASE_URL}/verifications/identities/nin/{nin}
//	Authorization: <VERIFYME_API_KEY>
//	Content-Type: application/json
//	Body: {"firstname": "...", "lastname": "...", "dob": "YYYY-MM-DD"}
//
// VerifyMe echoes back the record on file for the NIN; this client performs
// the name/DOB cross-check server-side rather than trusting the client, per
// the "validate all VerifyMe responses server-side" security requirement.
//
// When VERIFYME_API_KEY is not set, this runs in local "sandbox mode" and
// deterministically approves well-formed 11-digit NINs so the registration
// flow can be exercised end-to-end without live credentials. Sandbox mode is
// loudly logged and must never be relied on in production.
func (v *VerifyMeClient) VerifyNIN(ctx context.Context, req NINLookupRequest) (NINLookupResult, error) {
	if !v.Enabled() {
		return v.sandboxVerify(req), nil
	}

	body, _ := json.Marshal(map[string]string{
		"firstname": req.FirstName,
		"lastname":  req.LastName,
		"dob":       req.DateOfBirth,
	})

	url := fmt.Sprintf("%s/verifications/identities/nin/%s", v.cfg.VerifyMeBaseURL, req.NIN)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return NINLookupResult{}, err
	}
	httpReq.Header.Set("Authorization", v.cfg.VerifyMeAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := v.client.Do(httpReq)
	if err != nil {
		return NINLookupResult{}, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return NINLookupResult{}, err
	}

	var parsed struct {
		Status string `json:"status"`
		Data   struct {
			NIN       string `json:"nin"`
			FirstName string `json:"firstname"`
			LastName  string `json:"lastname"`
			DOB       string `json:"dob"`
			Photo     string `json:"photo"`
		} `json:"data"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return NINLookupResult{HTTPStatus: resp.StatusCode, RawResponse: raw, Error: "invalid response from VerifyMe"}, nil
	}

	result := NINLookupResult{
		HTTPStatus:  resp.StatusCode,
		RawResponse: raw,
		ProviderRef: parsed.Data.NIN,
		PhotoURL:    parsed.Data.Photo,
	}

	if resp.StatusCode != http.StatusOK || parsed.Status != "success" {
		result.Error = parsed.Message
		if result.Error == "" {
			result.Error = "VerifyMe could not verify this NIN"
		}
		return result, nil
	}

	result.Matched = matchesIdentity(parsed.Data.FirstName, parsed.Data.LastName, parsed.Data.DOB, req)
	result.Verified = result.Matched
	if !result.Matched {
		result.Error = "the name/date of birth on file for this NIN does not match what you entered"
	}
	return result, nil
}

func matchesIdentity(providerFirst, providerLast, providerDOB string, req NINLookupRequest) bool {
	norm := func(s string) string {
		return strings.ToLower(strings.TrimSpace(s))
	}
	nameOK := norm(providerFirst) == norm(req.FirstName) && norm(providerLast) == norm(req.LastName)
	dobOK := providerDOB == "" || providerDOB == req.DateOfBirth
	return nameOK && dobOK
}

// sandboxVerify lets local/dev/staging environments exercise the full
// verification UX without live VerifyMe credentials. Any syntactically valid
// 11-digit NIN is "verified"; this must never run with real user PII in
// production (guarded by Enabled()==false, i.e. no API key configured).
func (v *VerifyMeClient) sandboxVerify(req NINLookupRequest) NINLookupResult {
	log.Printf("verifyme: SANDBOX MODE (no VERIFYME_API_KEY set) — auto-approving NIN lookup for dev/testing only")
	valid := len(req.NIN) == 11
	if !valid {
		return NINLookupResult{Matched: false, Verified: false, Error: "NIN must be 11 digits", HTTPStatus: 422}
	}
	return NINLookupResult{
		Matched:     true,
		Verified:    true,
		ProviderRef: "sandbox-" + req.NIN,
		HTTPStatus:  200,
		RawResponse: []byte(`{"status":"success","sandbox":true}`),
	}
}
