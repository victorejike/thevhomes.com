// Package services implements outbound integrations that talk to third-party
// providers on TheVHomes' behalf: email/SMS notification delivery, VerifyMe
// identity checks, Google OAuth token exchange, and Paystack/Flutterwave
// payments. Handlers stay thin and call into this package.
package services

import (
	"fmt"
	"net/smtp"
	"strings"

	"github.com/thevhomes/backend/internal/config"
)

// SendEmail dispatches a plain/HTML email via SMTP. When SMTP is not
// configured it's a documented no-op (returns nil) so the calling flow
// (registration, booking confirmation, etc.) never fails just because email
// credentials haven't been provisioned yet.
func SendEmail(cfg *config.Config, to, subject, htmlBody string) error {
	if cfg.SMTPHost == "" || cfg.SMTPUser == "" || cfg.SMTPPassword == "" {
		return nil
	}

	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPHost)

	headers := map[string]string{
		"From":         cfg.SMTPFrom,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=\"UTF-8\"",
	}

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	return smtp.SendMail(addr, auth, cfg.SMTPUser, []string{to}, []byte(msg.String()))
}
