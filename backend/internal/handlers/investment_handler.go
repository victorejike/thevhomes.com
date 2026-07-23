package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	"gorm.io/gorm"
)

type InvestmentHandler struct {
	DB *gorm.DB
}

func NewInvestmentHandler(db *gorm.DB) *InvestmentHandler {
	return &InvestmentHandler{DB: db}
}

// List handles GET /api/v1/investments — public investment opportunities.
func (h *InvestmentHandler) List(c *gin.Context) {
	var investments []models.Investment
	if err := h.DB.Where("status = ?", "open").Order("created_at DESC").Find(&investments).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch investments")
		return
	}
	utils.Success(c, http.StatusOK, "investments fetched", investments)
}

// Get handles GET /api/v1/investments/:id
func (h *InvestmentHandler) Get(c *gin.Context) {
	var investment models.Investment
	if err := h.DB.First(&investment, "id = ?", c.Param("id")).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "investment opportunity not found")
		return
	}
	utils.Success(c, http.StatusOK, "investment fetched", investment)
}

type investmentRequest struct {
	Title          string  `json:"title" binding:"required"`
	Description    string  `json:"description"`
	ImageURL       string  `json:"image_url"`
	ROIEstimate    float64 `json:"roi_estimate_percent"`
	MinInvestment  float64 `json:"min_investment"`
	TimelineMonths int     `json:"timeline_months"`
	ExpectedReturn float64 `json:"expected_return"`
}

// Create handles POST /api/v1/investments (admin only).
func (h *InvestmentHandler) Create(c *gin.Context) {
	var req investmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	investment := models.Investment{
		Title: req.Title, Description: req.Description, ImageURL: req.ImageURL,
		ROIEstimate: req.ROIEstimate, MinInvestment: req.MinInvestment,
		TimelineMonths: req.TimelineMonths, ExpectedReturn: req.ExpectedReturn,
		Status: "open",
	}
	if err := h.DB.Create(&investment).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to create investment opportunity")
		return
	}
	utils.Success(c, http.StatusCreated, "investment opportunity created", investment)
}
