package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents the access level of a platform user.
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleAgent    Role = "agent"
	RoleCustomer Role = "customer"
	RoleSupport  Role = "support"
)

// PropertyType enumerates the kinds of property listed on the platform.
type PropertyType string

const (
	PropertyApartment PropertyType = "apartment"
	PropertyVilla     PropertyType = "villa"
	PropertyDuplex    PropertyType = "duplex"
	PropertyLand      PropertyType = "land"
	PropertyOffice    PropertyType = "office"
	PropertyHotel     PropertyType = "hotel"
	PropertyShortlet  PropertyType = "shortlet"
)

// Purpose describes why a property is listed.
type Purpose string

const (
	PurposeBuy      Purpose = "buy"
	PurposeRent     Purpose = "rent"
	PurposeInvest   Purpose = "invest"
	PurposeShortlet Purpose = "shortlet"
)

// VerificationStatus tracks the trust level of a listing.
type VerificationStatus string

const (
	VerificationPending         VerificationStatus = "pending"
	VerificationVerified        VerificationStatus = "verified"
	VerificationPremiumVerified VerificationStatus = "premium_verified"
)

// BaseModel gives every table a UUID primary key plus timestamps.
type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate ensures a UUID is always assigned.
func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// User is any registered account: customer, agent, admin, or support staff.
type User struct {
	BaseModel
	Name          string  `json:"name"`
	Email         string  `gorm:"uniqueIndex;not null" json:"email"`
	Phone         string  `json:"phone"`
	PasswordHash  string  `json:"-"`
	Role          Role    `gorm:"type:varchar(20);default:'customer'" json:"role"`
	AvatarURL     string  `json:"avatar_url"`
	GoogleID      *string `gorm:"uniqueIndex" json:"-"`
	EmailVerified bool    `gorm:"default:false" json:"email_verified"`

	Agent *Agent `json:"agent,omitempty"`
}

// Agent extends a User with real-estate agent profile data.
type Agent struct {
	BaseModel
	UserID            uuid.UUID          `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User              User               `json:"user"`
	Bio               string             `json:"bio"`
	ExperienceYears   int                `json:"experience_years"`
	AgencyName        string             `json:"agency_name"`
	Verified          bool               `gorm:"default:false" json:"verified"`
	VerificationLevel VerificationStatus `gorm:"type:varchar(20);default:'pending'" json:"verification_level"`
	Rating            float64            `gorm:"default:0" json:"rating"`
	ReviewsCount      int                `gorm:"default:0" json:"reviews_count"`

	Properties []Property `json:"properties,omitempty"`
}

// Property is a single real-estate listing.
type Property struct {
	BaseModel
	Title              string             `json:"title"`
	Slug               string             `gorm:"uniqueIndex" json:"slug"`
	Description        string             `json:"description"`
	Price              float64            `json:"price"`
	Currency           string             `gorm:"default:'NGN'" json:"currency"`
	Address            string             `json:"address"`
	City               string             `json:"city"`
	Country            string             `gorm:"default:'Nigeria'" json:"country"`
	Latitude           float64            `json:"latitude"`
	Longitude          float64            `json:"longitude"`
	PropertyType       PropertyType       `gorm:"type:varchar(20)" json:"property_type"`
	Purpose            Purpose            `gorm:"type:varchar(20)" json:"purpose"`
	Bedrooms           int                `json:"bedrooms"`
	Bathrooms          int                `json:"bathrooms"`
	SquareMeters       float64            `json:"square_meters"`
	Furnished          bool               `json:"furnished"`
	Parking            bool               `json:"parking"`
	Security           bool               `json:"security"`
	SwimmingPool       bool               `json:"swimming_pool"`
	Amenities          StringArray        `gorm:"type:text[]" json:"amenities"`
	VideoURLs          StringArray        `gorm:"type:text[]" json:"video_urls"`
	VirtualTourURL     string             `json:"virtual_tour_url"`
	VerificationStatus VerificationStatus `gorm:"type:varchar(20);default:'pending'" json:"verification_status"`
	Available          bool               `gorm:"default:true" json:"available"`

	AgentID uuid.UUID `gorm:"type:uuid" json:"agent_id"`
	Agent   Agent     `json:"agent,omitempty"`

	Images  []PropertyImage `json:"images,omitempty"`
	Reviews []Review        `json:"reviews,omitempty"`
}

// PropertyImage stores gallery images for a property (typically Cloudflare R2 URLs).
type PropertyImage struct {
	BaseModel
	PropertyID uuid.UUID `gorm:"type:uuid;index" json:"property_id"`
	URL        string    `json:"url"`
	IsPrimary  bool      `gorm:"default:false" json:"is_primary"`
}

// BookingStatus tracks the lifecycle of a viewing request.
type BookingStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingConfirmed BookingStatus = "confirmed"
	BookingCompleted BookingStatus = "completed"
	BookingCancelled BookingStatus = "cancelled"
)

// Booking represents a scheduled property viewing.
type Booking struct {
	BaseModel
	PropertyID    uuid.UUID     `gorm:"type:uuid;index" json:"property_id"`
	Property      Property      `json:"property,omitempty"`
	CustomerID    uuid.UUID     `gorm:"type:uuid;index" json:"customer_id"`
	Customer      User          `json:"customer,omitempty"`
	AgentID       uuid.UUID     `gorm:"type:uuid;index" json:"agent_id"`
	Agent         Agent         `json:"agent,omitempty"`
	ScheduledDate time.Time     `json:"scheduled_date"`
	Status        BookingStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Notes         string        `json:"notes"`
}

// Conversation groups messages between two participants.
type Conversation struct {
	BaseModel
	ParticipantOneID uuid.UUID  `gorm:"type:uuid;index" json:"participant_one_id"`
	ParticipantTwoID uuid.UUID  `gorm:"type:uuid;index" json:"participant_two_id"`
	PropertyID       *uuid.UUID `gorm:"type:uuid" json:"property_id,omitempty"`

	Messages []Message `json:"messages,omitempty"`
}

// Message is a single chat message within a conversation.
type Message struct {
	BaseModel
	ConversationID uuid.UUID  `gorm:"type:uuid;index" json:"conversation_id"`
	SenderID       uuid.UUID  `gorm:"type:uuid;index" json:"sender_id"`
	Content        string     `json:"content"`
	AttachmentURL  string     `json:"attachment_url,omitempty"`
	ReadAt         *time.Time `json:"read_at,omitempty"`
}

// Review is left by a user for a property or an agent.
type Review struct {
	BaseModel
	UserID     uuid.UUID  `gorm:"type:uuid;index" json:"user_id"`
	User       User       `json:"user,omitempty"`
	PropertyID *uuid.UUID `gorm:"type:uuid;index" json:"property_id,omitempty"`
	AgentID    *uuid.UUID `gorm:"type:uuid;index" json:"agent_id,omitempty"`
	Rating     int        `json:"rating"`
	Comment    string     `json:"comment"`
}

// PaymentStatus tracks a transaction's lifecycle.
type PaymentStatus string

const (
	PaymentPending PaymentStatus = "pending"
	PaymentSuccess PaymentStatus = "success"
	PaymentFailed  PaymentStatus = "failed"
)

// Payment records a Paystack/Flutterwave transaction.
type Payment struct {
	BaseModel
	UserID     uuid.UUID     `gorm:"type:uuid;index" json:"user_id"`
	PropertyID *uuid.UUID    `gorm:"type:uuid" json:"property_id,omitempty"`
	Amount     float64       `json:"amount"`
	Currency   string        `gorm:"default:'NGN'" json:"currency"`
	Purpose    string        `json:"purpose"`  // booking_fee | reservation | consultation | shortlet_booking
	Provider   string        `json:"provider"` // paystack | flutterwave
	Reference  string        `gorm:"uniqueIndex" json:"reference"`
	Status     PaymentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
}

// Investment is a real-estate development opportunity offered to customers.
type Investment struct {
	BaseModel
	Title          string  `json:"title"`
	Description    string  `json:"description"`
	ImageURL       string  `json:"image_url"`
	ROIEstimate    float64 `json:"roi_estimate_percent"`
	MinInvestment  float64 `json:"min_investment"`
	TimelineMonths int     `json:"timeline_months"`
	ExpectedReturn float64 `json:"expected_return"`
	Status         string  `gorm:"default:'open'" json:"status"` // open | funded | closed
}
