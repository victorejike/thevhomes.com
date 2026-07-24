package models

import (
	"time"

	"github.com/google/uuid"
)

// GoogleAccount links a User to their Google identity for OAuth login. Kept
// as its own table (rather than only the User.GoogleID column) so we retain
// the full profile snapshot Google returned and can securely store the
// encrypted OAuth refresh token for offline access / token revocation.
type GoogleAccount struct {
	BaseModel
	UserID          uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	GoogleID        string    `gorm:"uniqueIndex;not null" json:"-"`
	Email           string    `json:"email"`
	Name            string    `json:"name"`
	AvatarURL       string    `json:"avatar_url"`
	EmailVerified   bool      `json:"email_verified"`
	AccessTokenEnc  string    `json:"-"` // encrypted at rest, short-lived
	RefreshTokenEnc string    `json:"-"` // encrypted at rest
	LinkedAt        time.Time `json:"linked_at"`
}

// RefreshTokenRecord tracks issued JWT refresh tokens server-side so they can
// be revoked (logout, password change, suspicious activity) instead of
// remaining valid until natural expiry — satisfies "store refresh tokens
// securely" from the Google OAuth + security requirements.
type RefreshTokenRecord struct {
	BaseModel
	UserID    uuid.UUID  `gorm:"type:uuid;index;not null" json:"user_id"`
	TokenHash string     `gorm:"uniqueIndex;not null" json:"-"`
	UserAgent string     `json:"user_agent"`
	IPAddress string     `json:"ip_address"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
}

// IdentityVerificationStatus tracks a NIN/VerifyMe check's lifecycle.
type IdentityVerificationStatus string

const (
	IdentityStatusPending  IdentityVerificationStatus = "pending"
	IdentityStatusVerified IdentityVerificationStatus = "verified"
	IdentityStatusFailed   IdentityVerificationStatus = "failed"
	IdentityStatusRejected IdentityVerificationStatus = "rejected" // manual admin override
)

// IdentityVerification stores a user's KYC/NIN verification attempt. The raw
// NIN is encrypted at rest (see internal/utils.Encrypt) and only the last 4
// digits are ever exposed via NINLast4 — the full number is never returned
// to clients, satisfying "never expose NIN values to other users".
type IdentityVerification struct {
	BaseModel
	UserID            uuid.UUID                  `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	FullName          string                     `json:"full_name"`
	NINEncrypted      string                     `json:"-"`
	NINLast4          string                     `json:"nin_last4"`
	DateOfBirth       time.Time                  `json:"date_of_birth"`
	PhoneNumber       string                     `json:"phone_number"`
	SelfieURL         string                     `json:"selfie_url,omitempty"`
	Status            IdentityVerificationStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Provider          string                     `gorm:"default:'verifyme'" json:"provider"`
	ProviderReference string                     `json:"provider_reference,omitempty"`
	FailureReason     string                     `json:"failure_reason,omitempty"`
	VerifiedAt        *time.Time                 `json:"verified_at,omitempty"`
	ReviewedBy        *uuid.UUID                 `gorm:"type:uuid" json:"reviewed_by,omitempty"`
}

// VerifyMeResponse is a tamper-evident audit log of every VerifyMe API call
// made for a given identity verification, per the requirement to validate
// all VerifyMe responses server-side and retain an audit trail.
type VerifyMeResponse struct {
	BaseModel
	IdentityVerificationID uuid.UUID `gorm:"type:uuid;index;not null" json:"identity_verification_id"`
	Endpoint               string    `json:"endpoint"`
	RequestID              string    `json:"request_id"`
	HTTPStatus             int       `json:"http_status"`
	ResponseBody           string    `json:"-"` // raw JSON, never exposed to clients (may contain PII)
	Success                bool      `json:"success"`
}

// AuditLog records every sensitive administrative action (approvals,
// rejections, verification decisions, payouts) for compliance/traceability.
type AuditLog struct {
	BaseModel
	ActorID    *uuid.UUID `gorm:"type:uuid;index" json:"actor_id,omitempty"`
	Action     string     `gorm:"index" json:"action"`
	EntityType string     `gorm:"index" json:"entity_type"`
	EntityID   string     `gorm:"index" json:"entity_id"`
	Metadata   string     `json:"metadata,omitempty"` // JSON-encoded context
	IPAddress  string     `json:"ip_address,omitempty"`
}
