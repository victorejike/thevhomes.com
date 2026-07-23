package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/config"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type AIHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewAIHandler(db *gorm.DB, cfg *config.Config) *AIHandler {
	return &AIHandler{DB: db, Cfg: cfg}
}

var (
	bedroomRe = regexp.MustCompile(`(\d+)\s*(?:bed|bedroom|bedrooms|br)\b`)
	millionRe = regexp.MustCompile(`(?:under|below|less than|max)\s*(?:₦|ngn|n)?\s*(\d+(?:\.\d+)?)\s*(million|m|billion|b)?`)
	cities    = []string{"abuja", "lagos", "dubai", "port harcourt", "kano", "ibadan"}
	typeWords = map[string]models.PropertyType{
		"apartment": models.PropertyApartment, "flat": models.PropertyApartment,
		"villa": models.PropertyVilla, "duplex": models.PropertyDuplex,
		"land": models.PropertyLand, "office": models.PropertyOffice,
		"hotel": models.PropertyHotel, "shortlet": models.PropertyShortlet,
		"house": models.PropertyDuplex,
	}
	purposeWords = map[string]models.Purpose{
		"buy": models.PurposeBuy, "purchase": models.PurposeBuy,
		"rent": models.PurposeRent, "renting": models.PurposeRent,
		"invest": models.PurposeInvest, "investment": models.PurposeInvest,
		"shortlet": models.PurposeShortlet, "airbnb": models.PurposeShortlet,
	}
)

type assistantRequest struct {
	Message string `json:"message" binding:"required"`
}

// Ask handles POST /api/v1/ai/ask.
//
// This ships as a deterministic rule-based parser so property search "just
// works" with zero external dependencies (e.g. "Find me a 4 bedroom house in
// Abuja under 100 million"). When Cfg.OpenAIAPIKey is set, swap parseIntent
// for a real LLM call (function-calling against the same Property filters)
// to handle open-ended conversation, follow-up questions, and viewing
// scheduling through chat.
func (h *AIHandler) Ask(c *gin.Context) {
	var req assistantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	filters := parseIntent(req.Message)

	query := h.DB.Model(&models.Property{}).Preload("Images").Preload("Agent").Preload("Agent.User").Where("available = true")
	if filters.city != "" {
		query = query.Where("LOWER(city) = ?", filters.city)
	}
	if filters.propertyType != "" {
		query = query.Where("property_type = ?", filters.propertyType)
	}
	if filters.purpose != "" {
		query = query.Where("purpose = ?", filters.purpose)
	}
	if filters.minBedrooms > 0 {
		query = query.Where("bedrooms >= ?", filters.minBedrooms)
	}
	if filters.maxPrice > 0 {
		query = query.Where("price <= ?", filters.maxPrice)
	}

	var properties []models.Property
	query.Order("created_at DESC").Limit(10).Find(&properties)

	utils.Success(c, http.StatusOK, "assistant results", gin.H{
		"reply":          buildReply(filters, len(properties)),
		"parsed_filters": filters,
		"matches":        properties,
		"llm_enabled":    h.Cfg.OpenAIAPIKey != "",
	})
}

type parsedFilters struct {
	city         string
	propertyType models.PropertyType
	purpose      models.Purpose
	minBedrooms  int
	maxPrice     float64
}

func parseIntent(message string) parsedFilters {
	lower := strings.ToLower(message)
	var f parsedFilters

	for _, city := range cities {
		if strings.Contains(lower, city) {
			f.city = city
			break
		}
	}

	for word, pType := range typeWords {
		if strings.Contains(lower, word) {
			f.propertyType = pType
			break
		}
	}

	for word, purpose := range purposeWords {
		if strings.Contains(lower, word) {
			f.purpose = purpose
			break
		}
	}

	if m := bedroomRe.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			f.minBedrooms = n
		}
	}

	if m := millionRe.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.ParseFloat(m[1], 64); err == nil {
			multiplier := 1_000_000.0
			if strings.HasPrefix(m[2], "b") {
				multiplier = 1_000_000_000.0
			}
			f.maxPrice = n * multiplier
		}
	}

	return f
}

func buildReply(f parsedFilters, count int) string {
	var b strings.Builder
	b.WriteString("Here's what I found")
	if f.city != "" {
		b.WriteString(" in " + strings.Title(f.city))
	}
	if f.minBedrooms > 0 {
		b.WriteString(", " + strconv.Itoa(f.minBedrooms) + "+ bedrooms")
	}
	if f.maxPrice > 0 {
		b.WriteString(", under ₦" + strconv.FormatFloat(f.maxPrice, 'f', 0, 64))
	}
	b.WriteString(": ")
	b.WriteString(strconv.Itoa(count))
	b.WriteString(" matching properties.")
	return b.String()
}
