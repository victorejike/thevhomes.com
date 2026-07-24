package utils

import (
	"crypto/rand"
	"encoding/hex"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a plaintext password with bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// UnusablePasswordHash returns a bcrypt hash of a random value that can never
// be produced by a real login attempt. Used for accounts created purely via
// Google OAuth so the NOT NULL password_hash column stays satisfied without
// making the account vulnerable to a guessable/blank password.
func UnusablePasswordHash() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	hash, _ := HashPassword("oauth-only:" + hex.EncodeToString(b))
	return hash
}

// CheckPassword compares a plaintext password against a bcrypt hash.
func CheckPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
