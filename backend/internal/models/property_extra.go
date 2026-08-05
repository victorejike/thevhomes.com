package models

import (
	"time"

	"github.com/google/uuid"
)

// ListingStatus is the property review/publication workflow state, per the
// "Property Verification" requirements (Draft -> Pending Review -> Under
// Inspection -> Changes Requested -> Verified -> Published, or Rejected at
// any review step). Only "verified"/"published" listings are publicly
// searchable/visible.
type ListingStatus string

const (
	ListingDraft            ListingStatus = "draft"
	ListingPendingReview    ListingStatus = "pending_review"
	ListingUnderInspection  ListingStatus = "under_inspection"
	ListingChangesRequested ListingStatus = "changes_requested"
	ListingVerified         ListingStatus = "verified"
	ListingPublished        ListingStatus = "published"
	ListingRejected         ListingStatus = "rejected"
)

// PubliclyVisibleListingStatuses are the statuses under which a listing is
// searchable/visible to the general public (see PropertyHandler.
// applyVisibility and .Get).
func PubliclyVisibleListingStatuses() []ListingStatus {
	return []ListingStatus{ListingVerified, ListingPublished}
}

// IsPubliclyVisible reports whether s is one of PubliclyVisibleListingStatuses.
func (s ListingStatus) IsPubliclyVisible() bool {
	return s == ListingVerified || s == ListingPublished
}

// PropertyReview is the admin QA checklist completed before a listing can go
// live publicly.
type PropertyReview struct {
	BaseModel
	PropertyID          uuid.UUID     `gorm:"type:uuid;index;not null" json:"property_id"`
	ReviewerID          *uuid.UUID    `gorm:"type:uuid" json:"reviewer_id,omitempty"`
	Status              ListingStatus `gorm:"type:varchar(20);default:'pending_review'" json:"status"`
	ImagesChecked       bool          `json:"images_checked"`
	OwnershipDocChecked bool          `json:"ownership_doc_checked"`
	LocationChecked     bool          `json:"location_checked"`
	DetailsChecked      bool          `json:"details_checked"`
	TourChecked         bool          `json:"tour_checked"`
	Notes               string        `json:"notes,omitempty"`
	ReviewedAt          *time.Time    `json:"reviewed_at,omitempty"`
}

// PropertyVerificationLog is an immutable audit trail of every status
// transition a listing goes through (draft -> pending_review -> ...).
type PropertyVerificationLog struct {
	BaseModel
	PropertyID uuid.UUID  `gorm:"type:uuid;index;not null" json:"property_id"`
	ActorID    *uuid.UUID `gorm:"type:uuid" json:"actor_id,omitempty"`
	Action     string     `json:"action"`
	FromStatus string     `json:"from_status"`
	ToStatus   string     `json:"to_status"`
	Notes      string     `json:"notes,omitempty"`
}

// TourStatus tracks the 3D walkthrough capture/processing pipeline.
type TourStatus string

const (
	TourNotStarted TourStatus = "not_started"
	TourCapturing  TourStatus = "capturing"
	TourProcessing TourStatus = "processing"
	TourReady      TourStatus = "ready"
	TourFailed     TourStatus = "failed"
)

// CaptureMethod enumerates the supported 3D capture technologies.
type CaptureMethod string

const (
	CaptureGaussianSplatting CaptureMethod = "gaussian_splatting"
	CaptureNeRF              CaptureMethod = "nerf"
	CaptureWebXR             CaptureMethod = "webxr"
	CaptureMatterport        CaptureMethod = "matterport"
	CapturePhoto360          CaptureMethod = "photo_360"
)

// PropertyTour is the interactive 3D walkthrough attached to a listing. A
// listing cannot leave "draft" until its tour reaches TourReady — enforced in
// property_handler.go / property_review_handler.go.
type PropertyTour struct {
	BaseModel
	PropertyID         uuid.UUID     `gorm:"type:uuid;uniqueIndex;not null" json:"property_id"`
	Status             TourStatus    `gorm:"type:varchar(20);default:'not_started'" json:"status"`
	CaptureMethod      CaptureMethod `gorm:"type:varchar(30);default:'photo_360'" json:"capture_method"`
	ViewerType         string        `json:"viewer_type"` // matterport_embed | splat_viewer | panorama_viewer
	AssetURL           string        `json:"asset_url,omitempty"`
	ThumbnailURL       string        `json:"thumbnail_url,omitempty"`
	ProcessingProvider string        `json:"processing_provider,omitempty"` // matterport | kiri_engine | luma_ai | polycam | self_hosted
	ProcessingJobID    string        `json:"processing_job_id,omitempty"`
	RoomCount          int           `json:"room_count"`
	FailureReason      string        `json:"failure_reason,omitempty"`

	Scenes []PropertyTourScene `json:"scenes,omitempty"`
}

// PropertyTourScene is one room/scene captured on-device with the phone
// camera (a 360 panorama, short video sweep, or raw frame sequence destined
// for Gaussian-splat/NeRF reconstruction) that composes the full walkthrough.
type PropertyTourScene struct {
	BaseModel
	TourID    uuid.UUID `gorm:"type:uuid;index;not null" json:"tour_id"`
	RoomName  string    `json:"room_name"`
	MediaURL  string    `json:"media_url"`
	SceneType string    `json:"scene_type"` // photo_360 | video_sweep | frame_sequence
	SortOrder int       `json:"sort_order"`
}

// PropertyNearbyPlace caches Google Places "distance to landmark" results
// (schools, hospitals, supermarkets, airports) so the property page can
// render them without an API call on every page view.
type PropertyNearbyPlace struct {
	BaseModel
	PropertyID     uuid.UUID `gorm:"type:uuid;index;not null" json:"property_id"`
	Category       string    `json:"category"` // school | hospital | supermarket | airport
	Name           string    `json:"name"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	DistanceMeters float64   `json:"distance_meters"`
}
