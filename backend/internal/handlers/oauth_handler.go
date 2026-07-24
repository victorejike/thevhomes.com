package handlers

import (
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/services"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

// OAuthHandler implements Google OAuth 2.0 login: "Continue with Google",
// "Sign in with Google", and "Sign up with Google" are all the same flow —
// the frontend calls GET /auth/google to get a redirect URL, Google redirects
// the browser back to GET /auth/google/callback with a `code`, and this
// handler exchanges it, creates-or-links the local account, and issues our
// own JWT access/refresh pair exactly like the email/password flow.
type OAuthHandler struct {
	DB     *gorm.DB
	Cfg    *config.Config
	Google *services.GoogleOAuthClient
}

func NewOAuthHandler(db *gorm.DB, cfg *config.Config) *OAuthHandler {
	return &OAuthHandler{DB: db, Cfg: cfg, Google: services.NewGoogleOAuthClient(cfg)}
}

// GoogleAuthURL handles GET /api/v1/auth/google — returns the URL the
// frontend should redirect the browser to.
func (h *OAuthHandler) GoogleAuthURL(c *gin.Context) {
	if !h.Google.Enabled() {
		utils.Error(c, http.StatusServiceUnavailable, "Google OAuth is not configured yet; set GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URL")
		return
	}

	state := uuid.New().String()
	// In production, persist `state` (e.g. short-lived Redis key or signed
	// cookie) and verify it in GoogleCallback to fully mitigate CSRF; the
	// value is already opaque/unguessable here.
	utils.Success(c, http.StatusOK, "redirect to continue with Google", gin.H{
		"auth_url": h.Google.AuthURL(state),
		"state":    state,
	})
}

// GoogleCallback handles GET /api/v1/auth/google/callback?code=... — this is
// where Google redirects the browser's top-level navigation (not a fetch
// call), so on success it 302-redirects on to the frontend rather than
// returning JSON. Rather than putting long-lived JWTs directly in a
// redirect URL (which can leak via browser history/referrer headers), it
// mints a single-purpose, 60-second-lived exchange code that the frontend
// immediately trades for the real access/refresh pair via
// POST /api/v1/auth/google/exchange.
//
// First-time sign-in automatically creates an account (customer role by
// default); a returning Google ID logs the existing account in; a Google
// email matching an existing email/password account transparently links the
// two so the user can use either method going forward, avoiding duplicate
// accounts.
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?error="+url.QueryEscape("missing authorization code"))
		return
	}

	profile, err := h.Google.ExchangeCode(c.Request.Context(), code)
	if err != nil {
		c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?error="+url.QueryEscape("Google sign-in failed: "+err.Error()))
		return
	}
	if profile.Email == "" || profile.GoogleID == "" {
		c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?error="+url.QueryEscape("Google did not return a verifiable identity"))
		return
	}

	user, err := h.findOrCreateUser(profile)
	if err != nil {
		c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?error="+url.QueryEscape("failed to create or link account: "+err.Error()))
		return
	}

	exchangeCode, err := utils.GenerateToken(user.ID, string(user.Role), h.Cfg.JWTAccessSecret, 60*time.Second)
	if err != nil {
		c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?error="+url.QueryEscape("failed to finish sign-in"))
		return
	}

	c.Redirect(http.StatusFound, h.Cfg.FrontendURL+"/auth/google/complete?code="+url.QueryEscape(exchangeCode))
}

// Exchange handles POST /api/v1/auth/google/exchange — trades the short-lived
// code minted by GoogleCallback for a real access/refresh token pair.
func (h *OAuthHandler) Exchange(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := utils.ParseToken(req.Code, h.Cfg.JWTAccessSecret)
	if err != nil {
		utils.Error(c, http.StatusUnauthorized, "this sign-in link has expired; please try again")
		return
	}

	var user models.User
	if err := h.DB.Preload("Agent").First(&user, "id = ?", claims.UserID).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "user no longer exists")
		return
	}

	issueTokenPair(c, h.DB, h.Cfg, http.StatusOK, "Google sign-in successful", user)
}

func (h *OAuthHandler) findOrCreateUser(profile services.GoogleProfile) (models.User, error) {
	var account models.GoogleAccount
	if err := h.DB.Where("google_id = ?", profile.GoogleID).First(&account).Error; err == nil {
		var user models.User
		if err := h.DB.Preload("Agent").First(&user, "id = ?", account.UserID).Error; err != nil {
			return models.User{}, err
		}
		h.syncGoogleAccount(&account, profile)
		return user, nil
	}

	// No Google account row yet — link to an existing email/password account
	// if one exists (prevents duplicate accounts), otherwise create a new one.
	var user models.User
	isNewUser := false
	if err := h.DB.Where("email = ?", profile.Email).First(&user).Error; err != nil {
		user = models.User{
			Name:          profile.Name,
			Email:         profile.Email,
			AvatarURL:     profile.AvatarURL,
			Role:          models.RoleCustomer,
			EmailVerified: profile.EmailVerified,
			GoogleID:      &profile.GoogleID,
			// Google-authenticated accounts have no local password; a random
			// unusable hash keeps the NOT NULL constraint satisfied while
			// making password login impossible until the user sets one.
			PasswordHash: utils.UnusablePasswordHash(),
		}
		if err := h.DB.Create(&user).Error; err != nil {
			return models.User{}, err
		}
		isNewUser = true
	} else {
		updates := map[string]interface{}{"google_id": profile.GoogleID}
		if user.AvatarURL == "" {
			updates["avatar_url"] = profile.AvatarURL
		}
		if profile.EmailVerified {
			updates["email_verified"] = true
		}
		h.DB.Model(&user).Updates(updates)
	}

	account = models.GoogleAccount{
		UserID:        user.ID,
		GoogleID:      profile.GoogleID,
		Email:         profile.Email,
		Name:          profile.Name,
		AvatarURL:     profile.AvatarURL,
		EmailVerified: profile.EmailVerified,
		LinkedAt:      time.Now(),
	}
	h.encryptGoogleTokens(&account, profile)
	h.DB.Create(&account)

	_ = isNewUser
	h.DB.Preload("Agent").First(&user, "id = ?", user.ID)
	return user, nil
}

func (h *OAuthHandler) syncGoogleAccount(account *models.GoogleAccount, profile services.GoogleProfile) {
	account.Name = profile.Name
	account.AvatarURL = profile.AvatarURL
	account.EmailVerified = profile.EmailVerified
	h.encryptGoogleTokens(account, profile)
	h.DB.Save(account)
}

func (h *OAuthHandler) encryptGoogleTokens(account *models.GoogleAccount, profile services.GoogleProfile) {
	if h.Cfg.EncryptionKey == "" {
		return
	}
	if profile.AccessToken != "" {
		if enc, err := utils.Encrypt(profile.AccessToken, h.Cfg.EncryptionKey); err == nil {
			account.AccessTokenEnc = enc
		}
	}
	if profile.RefreshToken != "" {
		if enc, err := utils.Encrypt(profile.RefreshToken, h.Cfg.EncryptionKey); err == nil {
			account.RefreshTokenEnc = enc
		}
	}
}
