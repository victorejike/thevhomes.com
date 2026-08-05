package ai

import (
	"context"
	"strings"
	"testing"

	"github.com/thevhomes/backend/internal/models"
)

func completeResidential() *models.Property {
	return &models.Property{
		Title:       "4 Bedroom Terraced Duplex with BQ in Guzape District",
		Description: strings.Repeat("Beautifully finished duplex in a serviced estate. ", 10),
		Price:       250_000_000,
		Country:     "Nigeria",
		State:       "FCT",
		City:        "Abuja",
		Area:        "Guzape",
		Address:     "12 Ahmadu Bello Way",
		Latitude:    9.0348,
		Longitude:   7.4951,

		PropertyType:  models.PropertyDuplex,
		Purpose:       models.PurposeBuy,
		Bedrooms:      4,
		Bathrooms:     4,
		Toilets:       5,
		ParkingSpaces: 3,
		BuildingSize:  420,
		LandSize:      600,
		YearBuilt:     2022,

		Amenities:      models.StringArray{"24/7 Electricity", "Security", "CCTV", "Gym", "Borehole", "Fitted Kitchen"},
		CoverImageURL:  "https://cdn.thevhomes.com/a.jpg",
		YoutubeVideoID: "dQw4w9WgXcQ",
		Images: []models.PropertyImage{
			{URL: "1"}, {URL: "2"}, {URL: "3"}, {URL: "4"},
			{URL: "5"}, {URL: "6"}, {URL: "7"}, {URL: "8"},
		},
	}
}

func TestCompletenessFullListingScoresHigh(t *testing.T) {
	s := &RuleBasedCompletenessScorer{}
	got := s.Score(context.Background(), completeResidential())
	if got < 95 {
		t.Errorf("fully-populated listing scored %d, want >= 95", got)
	}
	if got > 100 {
		t.Errorf("score %d exceeds 100", got)
	}
}

func TestCompletenessEmptyListingScoresLow(t *testing.T) {
	s := &RuleBasedCompletenessScorer{}
	got := s.Score(context.Background(), &models.Property{PropertyType: models.PropertyDuplex})
	if got > 10 {
		t.Errorf("empty listing scored %d, want <= 10", got)
	}
}

func TestCompletenessIsMonotonic(t *testing.T) {
	s := &RuleBasedCompletenessScorer{}
	ctx := context.Background()

	base := completeResidential()
	full := s.Score(ctx, base)

	// Removing the video must lower the score, never raise it.
	noVideo := completeResidential()
	noVideo.YoutubeVideoID = ""
	if got := s.Score(ctx, noVideo); got >= full {
		t.Errorf("removing video gave %d, want < %d", got, full)
	}

	noImages := completeResidential()
	noImages.Images = nil
	noImages.CoverImageURL = ""
	if got := s.Score(ctx, noImages); got >= full {
		t.Errorf("removing images gave %d, want < %d", got, full)
	}
}

// Land must not be penalised for the bedroom/bathroom fields that don't apply
// to it — this is the core of the per-type scoring requirement.
func TestCompletenessLandNotPenalisedForResidentialFields(t *testing.T) {
	s := &RuleBasedCompletenessScorer{}
	land := completeResidential()
	land.PropertyType = models.PropertyLand
	land.Bedrooms, land.Bathrooms, land.Toilets, land.ParkingSpaces = 0, 0, 0, 0
	land.BuildingSize, land.YearBuilt = 0, 0

	got := s.Score(context.Background(), land)
	if got < 95 {
		t.Errorf("complete land listing scored %d, want >= 95", got)
	}
}

func TestCompletenessBreakdownGivesActionableHints(t *testing.T) {
	s := &RuleBasedCompletenessScorer{}
	p := completeResidential()
	p.YoutubeVideoID = ""
	p.Latitude, p.Longitude = 0, 0

	var fieldsWithHints []string
	for _, item := range s.Breakdown(context.Background(), p) {
		if item.Earned < item.Max && item.Hint == "" {
			t.Errorf("field %q is incomplete but has no hint", item.Field)
		}
		if item.Earned == item.Max && item.Hint != "" {
			t.Errorf("field %q is complete but still has hint %q", item.Field, item.Hint)
		}
		if item.Hint != "" {
			fieldsWithHints = append(fieldsWithHints, item.Field)
		}
	}

	for _, want := range []string{"video", "coordinates"} {
		found := false
		for _, f := range fieldsWithHints {
			if f == want {
				found = true
			}
		}
		if !found {
			t.Errorf("expected a hint for %q, got hints for %v", want, fieldsWithHints)
		}
	}
}

func TestModerationCleanListingIsClear(t *testing.T) {
	m := &RuleBasedModerationScorer{}
	score, status := m.Score(context.Background(), completeResidential())
	if status != ModerationClear {
		t.Errorf("clean listing status = %q (score %d), want %q", status, score, ModerationClear)
	}
}

func TestModerationFlagsPolicyViolations(t *testing.T) {
	cases := []struct {
		name string
		text string
		rule string
	}{
		{"phone", "Serious buyers call 08031234567 to inspect.", "contact_phone"},
		{"email", "Reach me at agent@example.com for details.", "contact_email"},
		{"link", "See more at www.someotherlisting.com", "external_link"},
		{"whatsapp", "Message me on WhatsApp for the real price.", "off_platform_contact"},
		{"crypto", "Payment accepted in USDT only.", "irregular_payment"},
		{"discrimination", "Clean apartment, no Igbo tenants please.", "discriminatory_terms"},
	}

	m := &RuleBasedModerationScorer{}
	for _, c := range cases {
		p := completeResidential()
		p.Description = c.text

		score, signals := m.Evaluate(context.Background(), p)
		if score < ModerationReviewThreshold {
			t.Errorf("%s: score %d, want >= %d", c.name, score, ModerationReviewThreshold)
		}

		found := false
		for _, s := range signals {
			if s.Rule == c.rule {
				found = true
			}
		}
		if !found {
			t.Errorf("%s: rule %q did not fire (signals: %+v)", c.name, c.rule, signals)
		}

		_, status := m.Score(context.Background(), p)
		if status != ModerationPendingReview {
			t.Errorf("%s: status = %q, want %q", c.name, status, ModerationPendingReview)
		}
	}
}

// Weak signals alone should not flag a listing; stacked, they should.
func TestModerationWeakSignalsStack(t *testing.T) {
	m := &RuleBasedModerationScorer{}

	only := completeResidential()
	only.Description = "Act now, this one will go fast."
	if score, status := m.Score(context.Background(), only); status != ModerationClear {
		t.Errorf("single weak signal flagged (score %d)", score)
	}

	stacked := completeResidential()
	stacked.Title = "LUXURY DUPLEX AVAILABLE NOW"
	stacked.Description = "Act now! 100% guaranteed, no inspection needed. Hurry, today only."
	if score, status := m.Score(context.Background(), stacked); status != ModerationPendingReview {
		t.Errorf("stacked weak signals not flagged: score %d, status %q", score, status)
	}
}

// The spec requires that moderation never removes content by itself.
func TestModerationNeverDeletesOrHides(t *testing.T) {
	m := &RuleBasedModerationScorer{}
	p := completeResidential()
	p.Description = "Call 08031234567, pay in bitcoin, no Igbo tenants."

	before := p.ListingStatus
	beforeAvailable := p.Available
	m.Score(context.Background(), p)

	if p.ListingStatus != before || p.Available != beforeAvailable {
		t.Error("moderation scoring mutated listing visibility; it must only assign a score")
	}
}

func TestModerationRedactsContactDetails(t *testing.T) {
	m := &RuleBasedModerationScorer{}
	p := completeResidential()
	p.Description = "Call 08031234567 now."

	_, signals := m.Evaluate(context.Background(), p)
	for _, s := range signals {
		if strings.Contains(s.Detail, "08031234567") {
			t.Errorf("signal detail leaked the full phone number: %q", s.Detail)
		}
	}
}

func TestEngineEvaluateListingPopulatesScores(t *testing.T) {
	engine := NewEngine()
	p := completeResidential()

	if err := engine.EvaluateListing(context.Background(), p); err != nil {
		t.Fatalf("EvaluateListing: %v", err)
	}
	if p.CompletenessScore < 95 {
		t.Errorf("CompletenessScore = %d, want >= 95", p.CompletenessScore)
	}
	if p.ModerationStatus != ModerationClear {
		t.Errorf("ModerationStatus = %q, want %q", p.ModerationStatus, ModerationClear)
	}
}
