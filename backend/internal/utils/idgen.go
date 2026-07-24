package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/thevhomes/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// NextAgentNumber atomically hands out the next permanent agent number
// (e.g. "TVH-AGT-000001"). It uses a row lock on the singleton
// AgentNumberSequence row inside a transaction so concurrent admin approvals
// can never hand out the same number twice, and numbers are never reused
// (the counter only ever increases).
func NextAgentNumber(db *gorm.DB, prefix string) (string, error) {
	if prefix == "" {
		prefix = "TVH-AGT"
	}

	var number string
	err := db.Transaction(func(tx *gorm.DB) error {
		var seq models.AgentNumberSequence
		// Ensure exactly one sequence row exists, then lock it for update.
		if err := tx.FirstOrCreate(&seq, models.AgentNumberSequence{}).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&seq, seq.ID).Error; err != nil {
			return err
		}

		seq.LastNumber++
		if err := tx.Save(&seq).Error; err != nil {
			return err
		}

		number = fmt.Sprintf("%s-%06d", prefix, seq.LastNumber)
		return nil
	})
	if err != nil {
		return "", err
	}
	return number, nil
}

// GenerateTicketCode returns a human-readable, hard-to-guess viewing ticket
// code, e.g. "TVH-VT-9F3C21A0".
func GenerateTicketCode() string {
	return "TVH-VT-" + strings.ToUpper(randomHex(4))
}

// GenerateSessionToken returns a random token for live video viewing
// sessions / WebRTC signaling room identifiers.
func GenerateSessionToken() string {
	return randomHex(24)
}

// GenerateReference returns a payment-provider-safe unique reference.
func GenerateReference(prefix string) string {
	return prefix + "-" + strings.ToUpper(randomHex(8))
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
