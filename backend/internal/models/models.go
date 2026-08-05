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
//
// "House for Sale"/"House for Rent" from the Phase 4 spec are not separate
// types here — they're simply PropertyDuplex/PropertyVilla/PropertyApartment
// combined with PurposeBuy/PurposeRent, which this enum + Purpose already
// represent. PropertyCommercial, PropertyWarehouse, and PropertyEventCenter
// were added in Phase 4 to complete the required 10-category list.
type PropertyType string

const (
	PropertyApartment   PropertyType = "apartment"
	PropertyVilla       PropertyType = "villa"
	PropertyDuplex      PropertyType = "duplex"
	PropertyLand        PropertyType = "land"
	PropertyOffice      PropertyType = "office"
	PropertyHotel       PropertyType = "hotel"
	PropertyShortlet    PropertyType = "shortlet"
	PropertyCommercial  PropertyType = "commercial"
	PropertyWarehouse   PropertyType = "warehouse"
	PropertyEventCenter PropertyType = "event_center"
)

// AllPropertyTypes is used by the publishing-form handler to validate
// incoming property_type values and to tell the frontend which fields are
// relevant for a given category (see propertyFieldRequirements in
// property_handler.go).
var AllPropertyTypes = []PropertyType{
	PropertyApartment, PropertyVilla, PropertyDuplex, PropertyLand, PropertyOffice,
	PropertyHotel, PropertyShortlet, PropertyCommercial, PropertyWarehouse, PropertyEventCenter,
}

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

	// NINVerified/IdentityVerifiedAt reflect the outcome of the VerifyMe NIN
	// check every user must complete for full platform access.
	NINVerified        bool       `gorm:"default:false" json:"nin_verified"`
	IdentityVerifiedAt *time.Time `json:"identity_verified_at,omitempty"`

	Agent                *Agent                `json:"agent,omitempty"`
	IdentityVerification *IdentityVerification `json:"identity_verification,omitempty"`
	GoogleAccount        *GoogleAccount        `json:"-"`
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

	// Secure onboarding: an agent must pass personal identity verification
	// AND have their business application approved before AgentNumber is
	// assigned. Only agents with a non-nil AgentNumber may publish listings
	// (enforced in property_handler.go).
	IdentityVerified      bool                `gorm:"default:false" json:"identity_verified"`
	ApprovalStatus        AgentApprovalStatus `gorm:"type:varchar(20);default:'not_applied'" json:"approval_status"`
	AgentNumber           *string             `gorm:"uniqueIndex" json:"agent_number,omitempty"`
	AgentNumberAssignedAt *time.Time          `json:"agent_number_assigned_at,omitempty"`

	Properties []Property `json:"properties,omitempty"`
}

// CanPublishListings reports whether the agent has cleared every gate
// required to publish a property: identity verification, an approved
// business application, and a permanently-assigned agent number.
func (a Agent) CanPublishListings() bool {
	return a.IdentityVerified && a.ApprovalStatus == AgentApprovalApproved && a.AgentNumber != nil
}

// Property is a single real-estate listing.
type Property struct {
	BaseModel
	Title          string       `json:"title"`
	Slug           string       `gorm:"uniqueIndex" json:"slug"`
	Description    string       `json:"description"`
	Price          float64      `json:"price"`
	Currency       string       `gorm:"default:'NGN'" json:"currency"`
	Negotiable     bool         `gorm:"default:false" json:"negotiable"`
	Address        string       `json:"address"`
	City           string       `json:"city"`
	State          string       `json:"state"`
	Area           string       `json:"area"`
	Country        string       `gorm:"default:'Nigeria'" json:"country"`
	Latitude       float64      `json:"latitude"`
	Longitude      float64      `json:"longitude"`
	PropertyType   PropertyType `gorm:"type:varchar(20)" json:"property_type"`
	Purpose        Purpose      `gorm:"type:varchar(20)" json:"purpose"`
	Bedrooms       int          `json:"bedrooms"`
	Bathrooms      int          `json:"bathrooms"`
	Toilets        int          `json:"toilets"`
	ParkingSpaces  int          `json:"parking_spaces"`
	SquareMeters   float64      `json:"square_meters"`
	LandSize       float64      `json:"land_size"`
	BuildingSize   float64      `json:"building_size"`
	YearBuilt      int          `json:"year_built"`
	Furnished      bool         `json:"furnished"`
	Parking        bool         `json:"parking"`
	Security       bool         `json:"security"`
	SwimmingPool   bool         `json:"swimming_pool"`
	Amenities      StringArray  `gorm:"type:text[]" json:"amenities"`
	VideoURLs      StringArray  `gorm:"type:text[]" json:"video_urls"`
	VirtualTourURL string       `json:"virtual_tour_url"`

	// YoutubeVideoID stores only the extracted 11-character YouTube video ID
	// (never the full URL) so the frontend can embed it via the
	// privacy-enhanced youtube-nocookie.com player without redirecting users
	// away from the property page. See utils.ExtractYouTubeID.
	YoutubeVideoID string `json:"youtube_video_id,omitempty"`

	VerificationStatus VerificationStatus `gorm:"type:varchar(20);default:'pending'" json:"verification_status"`
	Available          bool               `gorm:"default:true" json:"available"`

	// CoverImageURL is the single hero/cover photo required by the listing
	// validation rules (kept in sync with the primary PropertyImage).
	CoverImageURL string `json:"cover_image_url"`

	// ListingStatus is the admin review workflow state (draft -> pending_review
	// -> under_inspection -> changes_requested -> verified -> published, or
	// rejected at any review step). Only "verified"/"published" listings are
	// publicly searchable. A listing cannot leave "draft" until it has a
	// PropertyTour in TourReady status.
	ListingStatus ListingStatus `gorm:"type:varchar(20);default:'draft'" json:"listing_status"`

	// CompletenessScore (0-100) and ModerationScore/ModerationStatus are
	// computed by TheVHomes AI Engine (internal/ai) whenever a listing is
	// created or updated — see property_handler.go's calls into
	// ai.Engine.EvaluateListing. They are advisory/quality signals, not gates,
	// except that a high ModerationScore routes the listing into the admin
	// moderation queue instead of blocking it outright (see ai/moderation.go).
	CompletenessScore int    `gorm:"default:0" json:"completeness_score"`
	ModerationScore   int    `gorm:"default:0" json:"moderation_score"`
	ModerationStatus  string `gorm:"type:varchar(20);default:'clear'" json:"moderation_status"` // clear | pending_review | dismissed

	// Paid viewing service.
	IsPaidViewing bool    `gorm:"default:false" json:"is_paid_viewing"`
	ViewingFee    float64 `gorm:"default:0" json:"viewing_fee"`

	AgentID uuid.UUID `gorm:"type:uuid" json:"agent_id"`
	Agent   Agent     `json:"agent,omitempty"`

	Images  []PropertyImage `json:"images,omitempty"`
	Reviews []Review        `json:"reviews,omitempty"`
	Tour    *PropertyTour   `json:"tour,omitempty"`
}

// PropertyImage stores gallery images for a property (typically Cloudflare R2 URLs).
type PropertyImage struct {
	BaseModel
	PropertyID uuid.UUID `gorm:"type:uuid;index" json:"property_id"`
	URL        string    `json:"url"`
	IsPrimary  bool      `gorm:"default:false" json:"is_primary"`

	// PerceptualHash is a 64-bit average-hash (see ai/imagequality.go)
	// computed from the decoded image's pixels, hex-encoded. Two images of
	// the same photo (even re-compressed/resized) hash to the same or
	// near-identical value, which is how the upload flow flags accidental
	// duplicate uploads within one listing before publish.
	PerceptualHash string `gorm:"index" json:"perceptual_hash,omitempty"`
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

	// Professional Property Viewing Service fields.
	ViewingType     ViewingType    `gorm:"type:varchar(20);default:'physical'" json:"viewing_type"`
	PaymentRequired bool           `gorm:"default:false" json:"payment_required"`
	ViewingFee      float64        `gorm:"default:0" json:"viewing_fee"`
	PaymentID       *uuid.UUID     `gorm:"type:uuid" json:"payment_id,omitempty"`
	Payment         *Payment       `json:"payment,omitempty"`
	Ticket          *ViewingTicket `json:"ticket,omitempty"`
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
	UserID            uuid.UUID     `gorm:"type:uuid;index" json:"user_id"`
	PropertyID        *uuid.UUID    `gorm:"type:uuid" json:"property_id,omitempty"`
	BookingID         *uuid.UUID    `gorm:"type:uuid;index" json:"booking_id,omitempty"`
	Amount            float64       `json:"amount"`
	Currency          string        `gorm:"default:'NGN'" json:"currency"`
	Purpose           string        `json:"purpose"`  // booking_fee | reservation | consultation | shortlet_booking | viewing_fee
	Provider          string        `json:"provider"` // paystack | flutterwave
	Reference         string        `gorm:"uniqueIndex" json:"reference"`
	ProviderReference string        `json:"provider_reference,omitempty"`
	Status            PaymentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	RefundStatus      string        `gorm:"type:varchar(20);default:'none'" json:"refund_status"` // none | requested | approved | rejected | refunded
	RefundReason      string        `json:"refund_reason,omitempty"`
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
