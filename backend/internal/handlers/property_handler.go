package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/cache"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

const propertyCacheKeyPrefix = "properties:list:"

type PropertyHandler struct {
	DB    *gorm.DB
	Cache *cache.Cache
}

func NewPropertyHandler(db *gorm.DB, c *cache.Cache) *PropertyHandler {
	return &PropertyHandler{DB: db, Cache: c}
}

// List handles GET /api/v1/properties with rich filtering, used by both the
// homepage "featured properties" grid and the advanced search page.
//
// Supported query params:
//
//	city, property_type, purpose, min_price, max_price, bedrooms, bathrooms,
//	furnished, parking, security, swimming_pool, q (free text), page, page_size
func (h *PropertyHandler) List(c *gin.Context) {
	_, authenticated := c.Get("user_id")

	cacheKey := propertyCacheKeyPrefix + c.Request.URL.RawQuery
	if !authenticated {
		if cached, ok := h.Cache.Get(c.Request.Context(), cacheKey); ok {
			c.Header("X-Cache", "HIT")
			c.Data(http.StatusOK, "application/json", []byte(cached))
			return
		}
	}

	query := h.DB.Model(&models.Property{}).Preload("Images").Preload("Agent").Preload("Agent.User").Preload("Tour")
	query = h.applyVisibility(c, query)

	if agentID := c.Query("agent_id"); agentID != "" {
		query = query.Where("agent_id = ?", agentID)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("LOWER(city) = LOWER(?)", city)
	}
	if pType := c.Query("property_type"); pType != "" {
		query = query.Where("property_type = ?", pType)
	}
	if purpose := c.Query("purpose"); purpose != "" {
		query = query.Where("purpose = ?", purpose)
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		if v, err := strconv.ParseFloat(minPrice, 64); err == nil {
			query = query.Where("price >= ?", v)
		}
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if v, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			query = query.Where("price <= ?", v)
		}
	}
	if bedrooms := c.Query("bedrooms"); bedrooms != "" {
		if v, err := strconv.Atoi(bedrooms); err == nil {
			query = query.Where("bedrooms >= ?", v)
		}
	}
	if bathrooms := c.Query("bathrooms"); bathrooms != "" {
		if v, err := strconv.Atoi(bathrooms); err == nil {
			query = query.Where("bathrooms >= ?", v)
		}
	}
	if furnished := c.Query("furnished"); furnished == "true" {
		query = query.Where("furnished = true")
	}
	if parking := c.Query("parking"); parking == "true" {
		query = query.Where("parking = true")
	}
	if security := c.Query("security"); security == "true" {
		query = query.Where("security = true")
	}
	if pool := c.Query("swimming_pool"); pool == "true" {
		query = query.Where("swimming_pool = true")
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		like := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(city) LIKE ?", like, like, like)
	}

	page, pageSize := parsePagination(c)

	var total int64
	query.Count(&total)

	var properties []models.Property
	if err := query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&properties).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch properties")
		return
	}

	responseBody := gin.H{
		"success": true,
		"message": "properties fetched",
		"data": gin.H{
			"items":       properties,
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	}

	if !authenticated {
		if encoded, err := json.Marshal(responseBody); err == nil {
			h.Cache.Set(c.Request.Context(), cacheKey, string(encoded), 60*time.Second)
		}
	}

	c.JSON(http.StatusOK, responseBody)
}

// Get handles GET /api/v1/properties/:id
func (h *PropertyHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var property models.Property
	query := h.DB.Preload("Images").Preload("Agent").Preload("Agent.User").Preload("Reviews").Preload("Tour").Preload("Tour.Scenes")

	// Allow lookup by UUID or SEO-friendly slug.
	if _, err := uuid.Parse(id); err == nil {
		query = query.Where("id = ?", id)
	} else {
		query = query.Where("slug = ?", id)
	}

	if err := query.First(&property).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	if property.ListingStatus != models.ListingVerified && !h.canModify(c, property) {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	utils.Success(c, http.StatusOK, "property fetched", property)
}

// applyVisibility restricts the property list to publicly "verified"
// listings, unless the caller is an admin (sees everything) or an
// authenticated agent (who additionally sees their own listings regardless
// of review status, e.g. drafts/pending/rejected in their dashboard).
func (h *PropertyHandler) applyVisibility(c *gin.Context, query *gorm.DB) *gorm.DB {
	if c.GetString("role") == string(models.RoleAdmin) {
		return query
	}

	userIDVal, ok := c.Get("user_id")
	if !ok {
		return query.Where("listing_status = ?", models.ListingVerified)
	}

	uid, ok := userIDVal.(uuid.UUID)
	if !ok {
		return query.Where("listing_status = ?", models.ListingVerified)
	}

	var agent models.Agent
	if err := h.DB.Where("user_id = ?", uid).First(&agent).Error; err == nil {
		return query.Where("listing_status = ? OR agent_id = ?", models.ListingVerified, agent.ID)
	}
	return query.Where("listing_status = ?", models.ListingVerified)
}

type propertyRequest struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description"`
	Price          float64  `json:"price" binding:"required"`
	Currency       string   `json:"currency"`
	Address        string   `json:"address"`
	City           string   `json:"city" binding:"required"`
	Country        string   `json:"country"`
	Latitude       float64  `json:"latitude"`
	Longitude      float64  `json:"longitude"`
	PropertyType   string   `json:"property_type" binding:"required"`
	Purpose        string   `json:"purpose" binding:"required"`
	Bedrooms       int      `json:"bedrooms"`
	Bathrooms      int      `json:"bathrooms"`
	SquareMeters   float64  `json:"square_meters"`
	Furnished      bool     `json:"furnished"`
	Parking        bool     `json:"parking"`
	Security       bool     `json:"security"`
	SwimmingPool   bool     `json:"swimming_pool"`
	Amenities      []string `json:"amenities"`
	VideoURLs      []string `json:"video_urls"`
	VirtualTourURL string   `json:"virtual_tour_url"`
	ImageURLs      []string `json:"image_urls"`
	CoverImageURL  string   `json:"cover_image_url"`
	IsPaidViewing  bool     `json:"is_paid_viewing"`
	ViewingFee     float64  `json:"viewing_fee"`
}

// Create handles POST /api/v1/properties (agent/admin only).
func (h *PropertyHandler) Create(c *gin.Context) {
	var req propertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID := c.MustGet("user_id")
	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil {
		utils.Error(c, http.StatusForbidden, "only agents may create listings; complete your agent profile first")
		return
	}
	if !agent.CanPublishListings() {
		utils.Error(c, http.StatusForbidden, "only agents with an approved TheVHomes agent number may create listings; complete identity verification and agent onboarding first")
		return
	}
	if len(req.Amenities) == 0 || req.Address == "" || (req.Latitude == 0 && req.Longitude == 0) {
		utils.Error(c, http.StatusBadRequest, "address, coordinates (latitude/longitude), and at least one amenity are required")
		return
	}
	if len(req.ImageURLs) == 0 {
		utils.Error(c, http.StatusBadRequest, "at least one property image is required")
		return
	}

	if req.Currency == "" {
		req.Currency = "NGN"
	}
	if req.Country == "" {
		req.Country = "Nigeria"
	}

	coverImage := req.CoverImageURL
	if coverImage == "" && len(req.ImageURLs) > 0 {
		coverImage = req.ImageURLs[0]
	}

	property := models.Property{
		Title:          req.Title,
		Slug:           slugify(req.Title),
		Description:    req.Description,
		Price:          req.Price,
		Currency:       req.Currency,
		Address:        req.Address,
		City:           req.City,
		Country:        req.Country,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		PropertyType:   models.PropertyType(req.PropertyType),
		Purpose:        models.Purpose(req.Purpose),
		Bedrooms:       req.Bedrooms,
		Bathrooms:      req.Bathrooms,
		SquareMeters:   req.SquareMeters,
		Furnished:      req.Furnished,
		Parking:        req.Parking,
		Security:       req.Security,
		SwimmingPool:   req.SwimmingPool,
		Amenities:      models.StringArray(req.Amenities),
		VideoURLs:      models.StringArray(req.VideoURLs),
		VirtualTourURL: req.VirtualTourURL,
		CoverImageURL:  coverImage,
		ListingStatus:  models.ListingDraft,
		IsPaidViewing:  req.IsPaidViewing,
		ViewingFee:     req.ViewingFee,
		AgentID:        agent.ID,
		Available:      true,
	}

	if err := h.DB.Create(&property).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to create property")
		return
	}

	for i, url := range req.ImageURLs {
		img := models.PropertyImage{PropertyID: property.ID, URL: url, IsPrimary: i == 0}
		h.DB.Create(&img)
	}

	// Every listing starts with a not_started 3D tour placeholder; the agent
	// must bring this to TourReady (see tour_handler.go) before the listing
	// can be submitted for admin review (see property_review_handler.go).
	h.DB.Create(&models.PropertyTour{PropertyID: property.ID, Status: models.TourNotStarted})

	h.Cache.InvalidatePrefix(c.Request.Context(), propertyCacheKeyPrefix)
	utils.Success(c, http.StatusCreated, "property created as a draft — add photos and a 3D tour, then submit for review", property)
}

// Update handles PUT /api/v1/properties/:id (owning agent or admin only).
func (h *PropertyHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var property models.Property
	if err := h.DB.First(&property, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	if !h.canModify(c, property) {
		utils.Error(c, http.StatusForbidden, "you do not have permission to edit this property")
		return
	}

	var req propertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{
		"title": req.Title, "description": req.Description, "price": req.Price,
		"address": req.Address, "city": req.City, "bedrooms": req.Bedrooms,
		"bathrooms": req.Bathrooms, "square_meters": req.SquareMeters,
		"furnished": req.Furnished, "parking": req.Parking, "security": req.Security,
		"swimming_pool": req.SwimmingPool,
	}
	if req.PropertyType != "" {
		updates["property_type"] = req.PropertyType
	}
	if req.Purpose != "" {
		updates["purpose"] = req.Purpose
	}

	h.DB.Model(&property).Updates(updates)
	h.Cache.InvalidatePrefix(c.Request.Context(), propertyCacheKeyPrefix)
	utils.Success(c, http.StatusOK, "property updated", property)
}

// Delete handles DELETE /api/v1/properties/:id (owning agent or admin only).
func (h *PropertyHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var property models.Property
	if err := h.DB.First(&property, "id = ?", id).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "property not found")
		return
	}

	if !h.canModify(c, property) {
		utils.Error(c, http.StatusForbidden, "you do not have permission to delete this property")
		return
	}

	h.DB.Delete(&property)
	h.Cache.InvalidatePrefix(c.Request.Context(), propertyCacheKeyPrefix)
	utils.Success(c, http.StatusOK, "property deleted", nil)
}

func (h *PropertyHandler) canModify(c *gin.Context, property models.Property) bool {
	role := c.GetString("role")
	if role == string(models.RoleAdmin) {
		return true
	}

	userID := c.MustGet("user_id")
	var agent models.Agent
	if err := h.DB.Where("user_id = ?", userID).First(&agent).Error; err != nil {
		return false
	}
	return agent.ID == property.AgentID
}

func parsePagination(c *gin.Context) (page, pageSize int) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err = strconv.Atoi(c.DefaultQuery("page_size", "12"))
	if err != nil || pageSize < 1 || pageSize > 50 {
		pageSize = 12
	}
	return
}

func slugify(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	s = strings.ReplaceAll(s, "'", "")
	replacer := strings.NewReplacer(" ", "-", "/", "-", ",", "", ".", "")
	s = replacer.Replace(s)
	return fmt.Sprintf("%s-%d", s, time.Now().Unix())
}
