package models

import (
	"time"

	"github.com/google/uuid"
)

// ViewingType describes how a customer wants to inspect a property.
type ViewingType string

const (
	ViewingPhysical ViewingType = "physical" // in-person visit
	ViewingVirtual  ViewingType = "virtual"  // live WebRTC video walkthrough with the agent
	ViewingVideo    ViewingType = "video"    // pre-recorded video inspection delivered to the customer
)

// TicketStatus tracks a viewing ticket's lifecycle.
type TicketStatus string

const (
	TicketIssued    TicketStatus = "issued"
	TicketCheckedIn TicketStatus = "checked_in"
	TicketCompleted TicketStatus = "completed"
	TicketCancelled TicketStatus = "cancelled"
)

// ViewingTicket is generated once a booking's viewing fee (if any) is paid.
// TicketCode is human-readable; QRCodeURL renders a scannable check-in code
// for the agent to validate on arrival.
type ViewingTicket struct {
	BaseModel
	BookingID   uuid.UUID    `gorm:"type:uuid;uniqueIndex;not null" json:"booking_id"`
	TicketCode  string       `gorm:"uniqueIndex;not null" json:"ticket_code"`
	QRCodeURL   string       `json:"qr_code_url"`
	ViewingType ViewingType  `gorm:"type:varchar(20);default:'physical'" json:"viewing_type"`
	Status      TicketStatus `gorm:"type:varchar(20);default:'issued'" json:"status"`
	IssuedAt    time.Time    `json:"issued_at"`
	CheckedInAt *time.Time   `json:"checked_in_at,omitempty"`
}

// LiveSessionStatus tracks a live video tour's lifecycle.
type LiveSessionStatus string

const (
	LiveSessionScheduled LiveSessionStatus = "scheduled"
	LiveSessionLive      LiveSessionStatus = "live"
	LiveSessionEnded     LiveSessionStatus = "ended"
)

// LiveViewingSession backs a WebRTC live video property tour: the
// session/room token two peers (customer + agent) use to negotiate a
// peer-to-peer connection through the existing WebSocket hub as the
// signaling channel (see handlers/live_viewing_handler.go).
type LiveViewingSession struct {
	BaseModel
	BookingID    uuid.UUID         `gorm:"type:uuid;uniqueIndex;not null" json:"booking_id"`
	SessionToken string            `gorm:"uniqueIndex;not null" json:"session_token"`
	Status       LiveSessionStatus `gorm:"type:varchar(20);default:'scheduled'" json:"status"`
	StartedAt    *time.Time        `json:"started_at,omitempty"`
	EndedAt      *time.Time        `json:"ended_at,omitempty"`
	RecordingURL string            `json:"recording_url,omitempty"`
}
