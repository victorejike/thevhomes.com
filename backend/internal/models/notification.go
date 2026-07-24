package models

import (
	"time"

	"github.com/google/uuid"
)

// NotificationChannel is the delivery channel for a Notification.
type NotificationChannel string

const (
	ChannelEmail    NotificationChannel = "email"
	ChannelSMS      NotificationChannel = "sms"
	ChannelInApp    NotificationChannel = "in_app"
	ChannelWhatsApp NotificationChannel = "whatsapp" // future-ready; dispatch is a documented TODO
)

// NotificationStatus tracks delivery outcome.
type NotificationStatus string

const (
	NotificationPending NotificationStatus = "pending"
	NotificationSent    NotificationStatus = "sent"
	NotificationFailed  NotificationStatus = "failed"
)

// Notification is a single event delivered to a user across one or more
// channels (email/SMS/in-app/WhatsApp-ready).
type Notification struct {
	BaseModel
	UserID   uuid.UUID           `gorm:"type:uuid;index;not null" json:"user_id"`
	Type     string              `gorm:"index" json:"type"` // e.g. verification_approved, booking_confirmed
	Title    string              `json:"title"`
	Body     string              `json:"body"`
	Channel  NotificationChannel `gorm:"type:varchar(20);default:'in_app'" json:"channel"`
	Status   NotificationStatus  `gorm:"type:varchar(20);default:'pending'" json:"status"`
	ReadAt   *time.Time          `json:"read_at,omitempty"`
	Metadata string              `json:"metadata,omitempty"`
}
