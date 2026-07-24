package utils

import (
	"fmt"
	"net/url"
	"strings"
)

// BuildQRCodeURL returns a URL that renders a scannable QR code image
// encoding data (e.g. a viewing ticket code). It defaults to a public QR
// rendering API (no extra Go dependency required, since this project has no
// vendored QR-encoding library); for production traffic at scale, swap
// baseURL for a self-hosted QR service and this call site needs no changes.
func BuildQRCodeURL(baseURL, data string) string {
	if baseURL == "" {
		baseURL = "https://api.qrserver.com/v1/create-qr-code/"
	}
	return fmt.Sprintf("%s?size=300x300&data=%s", strings.TrimRight(baseURL, "/"), url.QueryEscape(data))
}
