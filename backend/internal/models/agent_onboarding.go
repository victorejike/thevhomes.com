package models

import (
	"time"

	"github.com/google/uuid"
)

// AgentApprovalStatus tracks an agent's business-onboarding lifecycle. This
// is distinct from IdentityVerificationStatus: an agent must first pass
// personal NIN/selfie identity verification, then separately submit and be
// approved on this business-application workflow before they can publish.
type AgentApprovalStatus string

const (
	AgentApprovalNotApplied  AgentApprovalStatus = "not_applied"
	AgentApprovalPending     AgentApprovalStatus = "pending"
	AgentApprovalUnderReview AgentApprovalStatus = "under_review"
	AgentApprovalApproved    AgentApprovalStatus = "approved"
	AgentApprovalRejected    AgentApprovalStatus = "rejected"
)

// AgentApplication captures the business/onboarding packet an agent submits
// after their personal identity has been verified via VerifyMe, and which an
// admin reviews before a permanent Agent ID is issued.
type AgentApplication struct {
	BaseModel
	AgentID         uuid.UUID           `gorm:"type:uuid;index;not null" json:"agent_id"`
	BusinessName    string              `json:"business_name"`
	OfficeAddress   string              `json:"office_address"`
	CACNumber       string              `json:"cac_number,omitempty"`
	CACDocumentURL  string              `json:"cac_document_url,omitempty"`
	GovernmentIDURL string              `json:"government_id_url"`
	ProfilePhotoURL string              `json:"profile_photo_url"`
	SelfieURL       string              `json:"selfie_url,omitempty"`
	Status          AgentApprovalStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	ReviewedBy      *uuid.UUID          `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewNotes     string              `json:"review_notes,omitempty"`
	SubmittedAt     time.Time           `json:"submitted_at"`
	ReviewedAt      *time.Time          `json:"reviewed_at,omitempty"`
}

// AgentNumberSequence is a single-row counter guarded by a row lock
// (SELECT ... FOR UPDATE, see utils.NextAgentNumber) so permanent, sequential
// agent numbers (TVH-AGT-000001, TVH-AGT-000002, ...) are handed out
// atomically, are never reused, and are immutable once assigned.
type AgentNumberSequence struct {
	BaseModel
	LastNumber int `json:"last_number"`
}
