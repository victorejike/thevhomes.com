package ai

import (
	"context"
	"strings"

	"github.com/thevhomes/backend/internal/models"
)

// RuleBasedCompletenessScorer implements the Property Completeness AI as a
// deterministic weighted rubric.
//
// Deliberately rule-based rather than model-backed: the score is shown to
// agents as "Listing Quality: 92%" alongside the specific items still missing,
// so it has to be explainable and reproducible. An agent who adds a floor plan
// must see the number move by a predictable amount — a black-box score they
// can't act on would be worse than no score.
type RuleBasedCompletenessScorer struct{}

// weights sum to 100. Media and description carry the most weight because they
// are what actually converts a search impression into an enquiry.
const (
	weightTitle       = 6
	weightDescription = 16
	weightPrice       = 6
	weightLocation    = 14
	weightCoordinates = 6
	weightDetails     = 16
	weightAmenities   = 10
	weightImages      = 18
	weightVideo       = 8
)

// Score returns 0–100 for how complete a listing is.
func (s *RuleBasedCompletenessScorer) Score(ctx context.Context, p *models.Property) int {
	total := 0
	for _, item := range s.Breakdown(ctx, p) {
		total += item.Earned
	}
	if total > 100 {
		total = 100
	}
	return total
}

// CompletenessItem is one line of the explainable breakdown surfaced to agents.
type CompletenessItem struct {
	Field  string `json:"field"`
	Earned int    `json:"earned"`
	Max    int    `json:"max"`
	// Hint is empty when the item is fully earned; otherwise it tells the agent
	// exactly what to do to earn the rest.
	Hint string `json:"hint,omitempty"`
}

// Breakdown returns the per-field scoring detail behind Score. The AI handler
// exposes this so the agent dashboard can render "what's missing" rather than
// just a bare percentage.
func (s *RuleBasedCompletenessScorer) Breakdown(_ context.Context, p *models.Property) []CompletenessItem {
	items := make([]CompletenessItem, 0, 9)

	// Title — a descriptive title is the single biggest driver of click-through.
	title := strings.TrimSpace(p.Title)
	items = append(items, scaled("title", weightTitle, len(title), 30,
		"Use a fuller title, e.g. \"4 Bedroom Terraced Duplex with BQ, Guzape\"."))

	// Description.
	desc := strings.TrimSpace(p.Description)
	items = append(items, scaled("description", weightDescription, len(desc), 400,
		"Describe the finishing, the estate, and the neighbourhood — aim for 400+ characters."))

	// Price.
	items = append(items, binary("price", weightPrice, p.Price > 0,
		"Set an asking price."))

	// Location: country/state/city/area/address each carry equal share.
	locParts := []string{p.Country, p.State, p.City, p.Area, p.Address}
	filled := 0
	for _, part := range locParts {
		if strings.TrimSpace(part) != "" {
			filled++
		}
	}
	items = append(items, CompletenessItem{
		Field:  "location",
		Earned: weightLocation * filled / len(locParts),
		Max:    weightLocation,
		Hint:   hintIf(filled < len(locParts), "Fill in country, state, city, area, and street address."),
	})

	// Map coordinates.
	items = append(items, binary("coordinates", weightCoordinates, p.Latitude != 0 && p.Longitude != 0,
		"Add latitude and longitude so the property appears on the map."))

	// Type-appropriate detail fields.
	items = append(items, s.detailItem(p))

	// Amenities — diminishing returns past six.
	items = append(items, scaled("amenities", weightAmenities, len(p.Amenities), 6,
		"Select at least six amenities."))

	// Images.
	items = append(items, s.imageItem(p))

	// Video tour.
	items = append(items, binary("video", weightVideo, p.YoutubeVideoID != "",
		"Upload a video tour to YouTube and paste the link — listings with video get materially more enquiries."))

	return items
}

// detailItem scores only the fields that apply to this property type, so a
// plot of land is never penalised for having no bedrooms.
func (s *RuleBasedCompletenessScorer) detailItem(p *models.Property) CompletenessItem {
	type check struct {
		name string
		ok   bool
	}

	var checks []check
	switch p.PropertyType {
	case models.PropertyLand:
		checks = []check{{"land size", p.LandSize > 0}}
	case models.PropertyWarehouse:
		checks = []check{
			{"building size", p.BuildingSize > 0},
			{"land size", p.LandSize > 0},
			{"year built", p.YearBuilt > 0},
		}
	case models.PropertyOffice, models.PropertyCommercial, models.PropertyEventCenter:
		checks = []check{
			{"building size", p.BuildingSize > 0},
			{"toilets", p.Toilets > 0},
			{"parking spaces", p.ParkingSpaces > 0},
			{"year built", p.YearBuilt > 0},
		}
	case models.PropertyHotel:
		checks = []check{
			{"rooms", p.Bedrooms > 0},
			{"bathrooms", p.Bathrooms > 0},
			{"building size", p.BuildingSize > 0},
		}
	default: // apartment, villa, duplex, shortlet — residential
		checks = []check{
			{"bedrooms", p.Bedrooms > 0},
			{"bathrooms", p.Bathrooms > 0},
			{"toilets", p.Toilets > 0},
			{"parking spaces", p.ParkingSpaces > 0},
			{"building size", p.BuildingSize > 0},
			{"year built", p.YearBuilt > 0},
		}
	}

	met := 0
	missing := make([]string, 0, len(checks))
	for _, c := range checks {
		if c.ok {
			met++
		} else {
			missing = append(missing, c.name)
		}
	}

	return CompletenessItem{
		Field:  "details",
		Earned: weightDetails * met / len(checks),
		Max:    weightDetails,
		Hint:   hintIf(len(missing) > 0, "Add "+strings.Join(missing, ", ")+"."),
	}
}

// imageItem rewards photo count up to eight and requires a cover photo.
func (s *RuleBasedCompletenessScorer) imageItem(p *models.Property) CompletenessItem {
	const idealImages = 8
	const coverShare = 4 // of weightImages, reserved for having a cover set

	count := len(p.Images)
	countMax := weightImages - coverShare
	earned := countMax * count / idealImages
	if earned > countMax {
		earned = countMax
	}

	hasCover := strings.TrimSpace(p.CoverImageURL) != ""
	if hasCover {
		earned += coverShare
	}

	var hint string
	switch {
	case count < idealImages && !hasCover:
		hint = "Add more photos (aim for 8) and choose a cover photo."
	case count < idealImages:
		hint = "Add more photos — listings with 8+ photos perform best."
	case !hasCover:
		hint = "Choose a cover photo."
	}

	return CompletenessItem{Field: "images", Earned: earned, Max: weightImages, Hint: hint}
}

// scaled awards weight proportionally to how close have is to ideal.
func scaled(field string, weight, have, ideal int, hint string) CompletenessItem {
	earned := weight * have / ideal
	if earned > weight {
		earned = weight
	}
	return CompletenessItem{
		Field:  field,
		Earned: earned,
		Max:    weight,
		Hint:   hintIf(earned < weight, hint),
	}
}

// binary awards all or nothing.
func binary(field string, weight int, ok bool, hint string) CompletenessItem {
	if ok {
		return CompletenessItem{Field: field, Earned: weight, Max: weight}
	}
	return CompletenessItem{Field: field, Earned: 0, Max: weight, Hint: hint}
}

func hintIf(cond bool, hint string) string {
	if cond {
		return hint
	}
	return ""
}
