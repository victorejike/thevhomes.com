package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
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
	if h.Cfg.OpenAIAPIKey != "" {
		if parsed, err := h.parseIntentWithLLM(c.Request.Context(), req.Message); err == nil {
			filters = parsed
		}
	}

	query := h.DB.Model(&models.Property{}).Preload("Images").Preload("Agent").Preload("Agent.User").Where("available = true")
	if filters.City != "" {
		query = query.Where("LOWER(city) = ?", filters.City)
	}
	if filters.PropertyType != "" {
		query = query.Where("property_type = ?", filters.PropertyType)
	}
	if filters.Purpose != "" {
		query = query.Where("purpose = ?", filters.Purpose)
	}
	if filters.MinBedrooms > 0 {
		query = query.Where("bedrooms >= ?", filters.MinBedrooms)
	}
	if filters.MaxPrice > 0 {
		query = query.Where("price <= ?", filters.MaxPrice)
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

func (h *AIHandler) parseIntentWithLLM(ctx context.Context, message string) (parsedFilters, error) {
	client := openai.NewClient(h.Cfg.OpenAIAPIKey)
	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: "gpt-4.1-mini",
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "You are a property search assistant. Parse the user's request into explicit property search filters and return the result using the provided function."},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		Functions: []openai.FunctionDefinition{
			{
				Name:        "parse_property_search",
				Description: "Extract search filters for property listings.",
				Parameters: openai.FunctionParameter{
					Type: "object",
					Properties: map[string]openai.FunctionProperty{
						"city": {
							Type:        "string",
							Description: "The city or location to search in.",
						},
						"property_type": {
							Type:        "string",
							Description: "The property type, such as apartment, villa, or shortlet.",
							Enum: []any{"apartment", "villa", "duplex", "land", "office", "hotel", "shortlet"},
						},
						"purpose": {
							Type:        "string",
							Description: "The search purpose, such as buy, rent, invest, or shortlet.",
							Enum: []any{"buy", "rent", "invest", "shortlet"},
						},
						"min_bedrooms": {
							Type:        "integer",
							Description: "The minimum number of bedrooms.",
						},
						"max_price": {
							Type:        "number",
							Description: "The maximum price in Nigerian Naira.",
						},
					},
				},
			},
		},
		FunctionCall: openai.FunctionCall{Type: "auto"},
		Temperature:  0,
	})
	if err != nil {
		return parsedFilters{}, err
	}

	if len(resp.Choices) == 0 {
		return parsedFilters{}, errors.New("no OpenAI choices returned")
	}

	choice := resp.Choices[0]
	if choice.Message.FunctionCall == nil || choice.Message.FunctionCall.Arguments == "" {
		return parsedFilters{}, errors.New("no function call returned")
	}

	var parsed parsedFilters
	if err := json.Unmarshal([]byte(choice.Message.FunctionCall.Arguments), &parsed); err != nil {
		return parsedFilters{}, err
	}

	return parsed, nil
}

type parsedFilters struct {
	City         string              `json:"city"`
	PropertyType models.PropertyType `json:"property_type"`
	Purpose      models.Purpose      `json:"purpose"`
	MinBedrooms  int                 `json:"min_bedrooms"`
	MaxPrice     float64             `json:"max_price"`
}

func parseIntent(message string) parsedFilters {
	lower := strings.ToLower(message)
	var f parsedFilters

	for _, city := range cities {
		if strings.Contains(lower, city) {
			f.City = city
			break
		}
	}

	for word, pType := range typeWords {
		if strings.Contains(lower, word) {
			f.PropertyType = pType
			break
		}
	}

	for word, purpose := range purposeWords {
		if strings.Contains(lower, word) {
			f.Purpose = purpose
			break
		}
	}

	if m := bedroomRe.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			f.MinBedrooms = n
		}
	}

	if m := millionRe.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.ParseFloat(m[1], 64); err == nil {
			multiplier := 1_000_000.0
			if strings.HasPrefix(m[2], "b") {
				multiplier = 1_000_000_000.0
			}
			f.MaxPrice = n * multiplier
		}
	}

	return f
}

func buildReply(f parsedFilters, count int) string {
	var b strings.Builder
	b.WriteString("Here's what I found")
	if f.City != "" {
		b.WriteString(" in " + strings.Title(f.City))
	}
	if f.MinBedrooms > 0 {
		b.WriteString(", " + strconv.Itoa(f.MinBedrooms) + "+ bedrooms")
	}
	if f.MaxPrice > 0 {
		b.WriteString(", under ₦" + strconv.FormatFloat(f.MaxPrice, 'f', 0, 64))
	}
	b.WriteString(": ")
	b.WriteString(strconv.Itoa(count))
	b.WriteString(" matching properties.")
	return b.String()
}
