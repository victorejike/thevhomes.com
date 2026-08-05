package ai

import (
	"context"
	"regexp"
	"strings"

	"github.com/thevhomes/backend/internal/models"
)

// Moderation statuses stored on Property.ModerationStatus.
const (
	ModerationClear         = "clear"
	ModerationPendingReview = "pending_review"
	ModerationDismissed     = "dismissed"
)

// ModerationReviewThreshold is the score at or above which a listing is routed
// into the admin moderation queue.
//
// Set so that any single confirmed policy breach (contact details in the copy,
// off-platform contact, irregular payment, discriminatory terms) clears it on
// its own, while soft stylistic signals only clear it when several stack.
const ModerationReviewThreshold = 40

// RuleBasedModerationScorer implements the Community Moderation AI.
//
// Per the Phase 4 spec it never deletes or hides content on its own: it assigns
// a score, and a high-confidence score moves the listing to "pending_review"
// so a human moderator decides. False positives therefore cost a moderator one
// click, not an agent their listing.
//
// Signals are deliberately transparent and auditable — every point added is
// traceable to a named rule, which matters because these decisions are
// contestable by agents.
type RuleBasedModerationScorer struct{}

// ModerationSignal is one triggered rule, surfaced to moderators so they can
// see why a listing was flagged rather than being handed a bare number.
type ModerationSignal struct {
	Rule   string `json:"rule"`
	Weight int    `json:"weight"`
	Detail string `json:"detail"`
}

var (
	// Contact details in listing copy: TheVHomes routes enquiries through the
	// platform, both so bookings are tracked and so users aren't pushed into
	// unprotected off-platform deals. This is the most common policy breach.
	phoneRe = regexp.MustCompile(`(?:\+?234|0)\s*[789]\d(?:[\s-]?\d){8}`)
	emailRe = regexp.MustCompile(`[\w.+-]+@[\w-]+\.[\w.]{2,}`)
	urlRe   = regexp.MustCompile(`(?i)\b(?:https?://|www\.)[^\s]+`)

	// Messaging handles used to move conversations off-platform.
	offPlatformRe = regexp.MustCompile(`(?i)\b(whatsapp|telegram|wechat|dm me|direct message|call me on)\b`)

	// Payment patterns associated with advance-fee fraud. On their own these
	// are suspicious rather than conclusive, which is why they score below the
	// review threshold unless they stack.
	upfrontPaymentRe = regexp.MustCompile(`(?i)\b(western union|moneygram|bitcoin|btc|usdt|crypto|gift card|wire transfer)\b`)
	urgencyRe        = regexp.MustCompile(`(?i)\b(act now|urgent(?:ly)?|today only|first come first serve|limited slot|hurry)\b`)
	guaranteeRe      = regexp.MustCompile(`(?i)\b(100% guaranteed|no inspection needed|no agent fee|too good to be true)\b`)

	// Discriminatory tenancy criteria — unlawful and against community
	// guidelines.
	discriminationRe = regexp.MustCompile(`(?i)\b(no (?:igbo|yoruba|hausa|muslims?|christians?|children|kids|single mothers?)|(?:tribe|religion|ethnicity) (?:only|preferred)|whites? only)\b`)

	// Profanity/abusive language, kept narrow to avoid flagging ordinary copy.
	profanityRe = regexp.MustCompile(`(?i)\b(fuck|shit|bastard|idiot|stupid fool)\b`)
)

// Score evaluates a listing's text content and returns a 0–100 confidence that
// it violates community guidelines, plus the resulting status.
func (m *RuleBasedModerationScorer) Score(ctx context.Context, p *models.Property) (int, string) {
	score, _ := m.Evaluate(ctx, p)
	status := ModerationClear
	if score >= ModerationReviewThreshold {
		status = ModerationPendingReview
	}
	return score, status
}

// Evaluate returns the score together with the signals that produced it.
func (m *RuleBasedModerationScorer) Evaluate(_ context.Context, p *models.Property) (int, []ModerationSignal) {
	// Amenities are included because free-text amenity entries are a common
	// place to hide a phone number.
	text := strings.Join(append([]string{p.Title, p.Description}, p.Amenities...), "\n")

	var signals []ModerationSignal
	add := func(rule string, weight int, detail string) {
		signals = append(signals, ModerationSignal{Rule: rule, Weight: weight, Detail: detail})
	}

	if match := phoneRe.FindString(text); match != "" {
		add("contact_phone", 45, "Phone number in listing text: "+redact(match))
	}
	if match := emailRe.FindString(text); match != "" {
		add("contact_email", 40, "Email address in listing text: "+redact(match))
	}
	if match := urlRe.FindString(text); match != "" {
		add("external_link", 40, "External link in listing text: "+truncateDetail(match))
	}
	if match := offPlatformRe.FindString(text); match != "" {
		add("off_platform_contact", 45, "Attempt to move contact off-platform: "+match)
	}
	if match := upfrontPaymentRe.FindString(text); match != "" {
		add("irregular_payment", 45, "Irregular payment method mentioned: "+match)
	}
	if match := discriminationRe.FindString(text); match != "" {
		add("discriminatory_terms", 75, "Possible discriminatory tenancy criteria: "+match)
	}
	if match := profanityRe.FindString(text); match != "" {
		add("profanity", 30, "Inappropriate language: "+match)
	}
	if match := urgencyRe.FindString(text); match != "" {
		add("pressure_tactics", 15, "High-pressure sales language: "+match)
	}
	if match := guaranteeRe.FindString(text); match != "" {
		add("unrealistic_claims", 20, "Unrealistic guarantee: "+match)
	}
	if isShouting(p.Title) {
		add("all_caps_title", 10, "Title is written entirely in capitals")
	}

	// Sum with saturation rather than taking the max, so several weak signals
	// (urgency + guarantees + shouting) can together warrant a look, while any
	// single strong signal already clears the threshold on its own.
	total := 0
	for _, s := range signals {
		total += s.Weight
	}
	if total > 100 {
		total = 100
	}

	return total, signals
}

// isShouting reports whether a title is all-caps, which listing policy treats
// as spammy formatting. Short titles are exempt to avoid flagging acronyms.
func isShouting(title string) bool {
	letters, upper := 0, 0
	for _, r := range title {
		switch {
		case r >= 'a' && r <= 'z':
			letters++
		case r >= 'A' && r <= 'Z':
			letters++
			upper++
		}
	}
	return letters >= 12 && upper == letters
}

// redact masks the middle of a matched contact detail. Moderators need to see
// that a phone number is present and roughly what it looks like, but the
// moderation record itself should not become a store of personal data.
func redact(s string) string {
	if len(s) <= 6 {
		return strings.Repeat("•", len(s))
	}
	return s[:3] + strings.Repeat("•", len(s)-6) + s[len(s)-3:]
}

func truncateDetail(s string) string {
	const max = 60
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "…"
}
