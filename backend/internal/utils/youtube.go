package utils

import (
	"errors"
	"net/url"
	"regexp"
	"strings"
)

// ErrInvalidYouTubeURL is returned when a submitted property video link is not
// a recognisable YouTube URL.
var ErrInvalidYouTubeURL = errors.New("invalid YouTube URL")

// youTubeIDRe matches the canonical 11-character YouTube video ID.
var youTubeIDRe = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)

// ExtractYouTubeID pulls the 11-character video ID out of any of the URL
// shapes agents realistically paste in:
//
//	https://www.youtube.com/watch?v=ID
//	https://youtu.be/ID
//	https://www.youtube.com/embed/ID
//	https://www.youtube.com/shorts/ID
//	https://www.youtube.com/live/ID
//	ID  (already-bare id, so re-submitting a saved listing is idempotent)
//
// Only the ID is persisted (Property.YoutubeVideoID) so the property page can
// embed via youtube-nocookie.com rather than redirecting users to YouTube.
func ExtractYouTubeID(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", ErrInvalidYouTubeURL
	}

	// Already a bare ID.
	if youTubeIDRe.MatchString(raw) {
		return raw, nil
	}

	// url.Parse accepts scheme-less input, but then puts everything in Path,
	// so normalise first.
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}

	u, err := url.Parse(raw)
	if err != nil {
		return "", ErrInvalidYouTubeURL
	}

	host := strings.ToLower(strings.TrimPrefix(u.Hostname(), "www."))
	switch host {
	case "youtube.com", "m.youtube.com", "youtube-nocookie.com", "music.youtube.com":
		if v := u.Query().Get("v"); v != "" {
			return validateID(v)
		}
		// /embed/ID, /shorts/ID, /live/ID, /v/ID
		parts := strings.Split(strings.Trim(u.Path, "/"), "/")
		if len(parts) == 2 {
			switch parts[0] {
			case "embed", "shorts", "live", "v":
				return validateID(parts[1])
			}
		}
		return "", ErrInvalidYouTubeURL
	case "youtu.be":
		return validateID(strings.Trim(u.Path, "/"))
	default:
		return "", ErrInvalidYouTubeURL
	}
}

func validateID(id string) (string, error) {
	if !youTubeIDRe.MatchString(id) {
		return "", ErrInvalidYouTubeURL
	}
	return id, nil
}
