// Package utils: crypto.go implements AES-256-GCM encryption for sensitive
// PII (primarily NIN numbers) so it is never stored in plaintext, satisfying
// the "encrypt sensitive identity information at rest" security requirement.
package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
)

// deriveKey turns an arbitrary-length configured secret into a valid 32-byte
// AES-256 key, so operators can set ENCRYPTION_KEY to any sufficiently
// random string/passphrase without worrying about exact byte length.
func deriveKey(secret string) []byte {
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}

// Encrypt returns a base64-encoded "nonce||ciphertext" blob. Safe to store
// directly in a text column.
func Encrypt(plaintext, secret string) (string, error) {
	if secret == "" {
		return "", errors.New("encryption key is not configured (set ENCRYPTION_KEY)")
	}

	block, err := aes.NewCipher(deriveKey(secret))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(sealed), nil
}

// Decrypt reverses Encrypt. Only ever call this server-side for verification
// workflows — decrypted NIN values must never be returned in API responses.
func Decrypt(encoded, secret string) (string, error) {
	if secret == "" {
		return "", errors.New("encryption key is not configured (set ENCRYPTION_KEY)")
	}

	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(deriveKey(secret))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(raw) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := raw[:nonceSize], raw[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// Last4 returns the last n characters of s (used to display "•••• 1234"
// style masked identifiers without ever exposing the full value).
func Last4(s string) string {
	if len(s) <= 4 {
		return s
	}
	return s[len(s)-4:]
}
