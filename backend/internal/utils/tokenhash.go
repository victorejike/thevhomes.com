package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashToken returns a deterministic SHA-256 hex digest of a token string, so
// refresh tokens can be looked up/revoked server-side without ever storing
// the raw token value in the database.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
