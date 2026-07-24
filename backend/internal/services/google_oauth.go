package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/thevhomes/backend/internal/config"
)

// GoogleOAuthClient implements the Google OAuth 2.0 Authorization Code flow
// using only net/http (no golang.org/x/oauth2 dependency required), so
// "Continue with Google" / "Sign in with Google" / "Sign up with Google"
// all share one code exchange + identity verification path.
type GoogleOAuthClient struct {
	cfg    *config.Config
	client *http.Client
}

func NewGoogleOAuthClient(cfg *config.Config) *GoogleOAuthClient {
	return &GoogleOAuthClient{cfg: cfg, client: &http.Client{Timeout: 15 * time.Second}}
}

func (g *GoogleOAuthClient) Enabled() bool {
	return g.cfg.GoogleOAuthClientID != "" && g.cfg.GoogleOAuthClientSecret != ""
}

// AuthURL builds the URL the frontend redirects the browser to in order to
// start the consent flow. state should be a signed/opaque anti-CSRF value
// generated per request (see handlers/oauth_handler.go).
func (g *GoogleOAuthClient) AuthURL(state string) string {
	params := url.Values{}
	params.Set("client_id", g.cfg.GoogleOAuthClientID)
	params.Set("redirect_uri", g.cfg.GoogleOAuthRedirectURL)
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("access_type", "offline")
	params.Set("prompt", "consent")
	params.Set("state", state)
	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}

// GoogleProfile is the verified identity Google returns for the logged-in
// user, used to create/link the local account.
type GoogleProfile struct {
	GoogleID      string
	Email         string
	EmailVerified bool
	Name          string
	AvatarURL     string
	AccessToken   string
	RefreshToken  string
}

type googleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	IDToken      string `json:"id_token"`
	ExpiresIn    int    `json:"expires_in"`
	Error        string `json:"error"`
	ErrorDesc    string `json:"error_description"`
}

type googleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
	Error         string `json:"error"`
	ErrorDesc     string `json:"error_description"`
}

// ExchangeCode swaps an authorization code (from the OAuth redirect) for
// tokens, then validates the returned ID token against Google's tokeninfo
// endpoint (https://oauth2.googleapis.com/tokeninfo) — this confirms the
// token's signature/audience/expiry server-side without needing a local JWKS
// verification library, satisfying "validate ... responses server-side".
func (g *GoogleOAuthClient) ExchangeCode(ctx context.Context, code string) (GoogleProfile, error) {
	if !g.Enabled() {
		return GoogleProfile{}, errors.New("Google OAuth is not configured; set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REDIRECT_URL")
	}

	form := url.Values{}
	form.Set("client_id", g.cfg.GoogleOAuthClientID)
	form.Set("client_secret", g.cfg.GoogleOAuthClientSecret)
	form.Set("code", code)
	form.Set("grant_type", "authorization_code")
	form.Set("redirect_uri", g.cfg.GoogleOAuthRedirectURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	if err != nil {
		return GoogleProfile{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := g.client.Do(req)
	if err != nil {
		return GoogleProfile{}, err
	}
	defer resp.Body.Close()

	var tokenResp googleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return GoogleProfile{}, err
	}
	if tokenResp.Error != "" {
		return GoogleProfile{}, fmt.Errorf("google token exchange failed: %s (%s)", tokenResp.Error, tokenResp.ErrorDesc)
	}
	if tokenResp.IDToken == "" {
		return GoogleProfile{}, errors.New("google did not return an id_token")
	}

	info, err := g.verifyIDToken(ctx, tokenResp.IDToken)
	if err != nil {
		return GoogleProfile{}, err
	}
	if info.Aud != g.cfg.GoogleOAuthClientID {
		return GoogleProfile{}, errors.New("id_token audience mismatch")
	}

	return GoogleProfile{
		GoogleID:      info.Sub,
		Email:         info.Email,
		EmailVerified: info.EmailVerified == "true",
		Name:          info.Name,
		AvatarURL:     info.Picture,
		AccessToken:   tokenResp.AccessToken,
		RefreshToken:  tokenResp.RefreshToken,
	}, nil
}

func (g *GoogleOAuthClient) verifyIDToken(ctx context.Context, idToken string) (googleTokenInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://oauth2.googleapis.com/tokeninfo?id_token="+url.QueryEscape(idToken), nil)
	if err != nil {
		return googleTokenInfo{}, err
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return googleTokenInfo{}, err
	}
	defer resp.Body.Close()

	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return googleTokenInfo{}, err
	}
	if resp.StatusCode != http.StatusOK || info.Error != "" {
		return googleTokenInfo{}, fmt.Errorf("google id_token verification failed: %s", info.ErrorDesc)
	}
	return info, nil
}
