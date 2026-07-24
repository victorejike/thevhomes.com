package services

import (
	"log"

	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"gorm.io/gorm"
)

// Notifier centralizes every user-facing notification TheVHomes sends:
// verification approved/rejected, agent approved, booking confirmed, payment
// successful, viewing reminder, listing approved/rejected, etc.
//
// Every call persists an in-app Notification row (so the dashboard bell/inbox
// always has a record even if email/SMS delivery fails or isn't configured),
// then best-effort dispatches to the requested external channels.
type Notifier struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewNotifier(db *gorm.DB, cfg *config.Config) *Notifier {
	return &Notifier{DB: db, Cfg: cfg}
}

// Send stores an in-app notification and, when the user has an email on
// file, best-effort delivers the same content by email. SMS/WhatsApp are
// wired the same way once TWILIO_*/WHATSAPP_* credentials are added — the
// call sites below never need to change.
func (n *Notifier) Send(userID uuid.UUID, notifType, title, body string) {
	notification := models.Notification{
		UserID:  userID,
		Type:    notifType,
		Title:   title,
		Body:    body,
		Channel: models.ChannelInApp,
		Status:  models.NotificationSent,
	}
	if err := n.DB.Create(&notification).Error; err != nil {
		log.Printf("notify: failed to persist in-app notification: %v", err)
	}

	var user models.User
	if err := n.DB.Select("email", "name").First(&user, "id = ?", userID).Error; err != nil {
		return
	}
	if user.Email == "" {
		return
	}

	emailNotification := models.Notification{
		UserID:  userID,
		Type:    notifType,
		Title:   title,
		Body:    body,
		Channel: models.ChannelEmail,
		Status:  models.NotificationPending,
	}
	n.DB.Create(&emailNotification)

	html := "<p>Hi " + user.Name + ",</p><p>" + body + "</p><p>— TheVHomes</p>"
	if err := SendEmail(n.Cfg, user.Email, title, html); err != nil {
		log.Printf("notify: email dispatch failed for %s: %v", user.Email, err)
		n.DB.Model(&emailNotification).Update("status", models.NotificationFailed)
		return
	}
	n.DB.Model(&emailNotification).Update("status", models.NotificationSent)
}
