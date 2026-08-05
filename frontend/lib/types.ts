export type PropertyType =
  | "apartment"
  | "villa"
  | "duplex"
  | "land"
  | "office"
  | "hotel"
  | "shortlet"
  | "commercial"
  | "warehouse"
  | "event_center";

export type Purpose = "buy" | "rent" | "invest" | "shortlet";

export type VerificationStatus = "pending" | "verified" | "premium_verified";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "under_inspection"
  | "verified"
  | "rejected";

export type AgentApprovalStatus =
  | "not_applied"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type IdentityVerificationStatus = "pending" | "verified" | "failed" | "rejected" | "not_submitted";

export type TourStatus = "not_started" | "capturing" | "processing" | "ready" | "failed";

export type CaptureMethod = "gaussian_splatting" | "nerf" | "webxr" | "matterport" | "photo_360";

export type ViewingType = "physical" | "virtual" | "video";

export type TicketStatus = "issued" | "checked_in" | "completed" | "cancelled";

export interface PropertyImage {
  id: string;
  url: string;
  is_primary: boolean;
}

export interface AgentUser {
  id: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
}

export interface Agent {
  id: string;
  user_id: string;
  user?: AgentUser;
  bio?: string;
  experience_years: number;
  agency_name?: string;
  verified: boolean;
  verification_level: VerificationStatus;
  rating: number;
  reviews_count: number;
  identity_verified?: boolean;
  approval_status?: AgentApprovalStatus;
  agent_number?: string | null;
  agent_number_assigned_at?: string | null;
}

export interface AgentApplication {
  id: string;
  agent_id: string;
  business_name: string;
  office_address: string;
  cac_number?: string;
  cac_document_url?: string;
  government_id_url: string;
  profile_photo_url: string;
  selfie_url?: string;
  status: AgentApprovalStatus;
  review_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  full_name: string;
  nin_last4: string;
  date_of_birth: string;
  phone_number: string;
  selfie_url?: string;
  status: IdentityVerificationStatus;
  provider: string;
  failure_reason?: string;
  verified_at?: string;
}

export interface PropertyTourScene {
  id: string;
  tour_id: string;
  room_name: string;
  media_url: string;
  scene_type: "photo_360" | "video_sweep" | "frame_sequence";
  sort_order: number;
}

export interface PropertyTour {
  id: string;
  property_id: string;
  status: TourStatus;
  capture_method: CaptureMethod;
  viewer_type: string;
  asset_url?: string;
  thumbnail_url?: string;
  room_count: number;
  failure_reason?: string;
  scenes?: PropertyTourScene[];
}

export interface ViewingTicket {
  id: string;
  booking_id: string;
  ticket_code: string;
  qr_code_url: string;
  viewing_type: ViewingType;
  status: TicketStatus;
  issued_at: string;
  checked_in_at?: string;
}

export interface LiveViewingSession {
  id: string;
  booking_id: string;
  session_token: string;
  status: "scheduled" | "live" | "ended";
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  read_at?: string;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  property_type: PropertyType;
  purpose: Purpose;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  furnished: boolean;
  parking: boolean;
  security: boolean;
  swimming_pool: boolean;
  amenities: string[];
  video_urls: string[];
  youtube_video_id?: string;
  virtual_tour_url?: string;
  verification_status: VerificationStatus;
  available: boolean;
  agent_id: string;
  agent?: Agent;
  images?: PropertyImage[];
  created_at: string;
  cover_image_url?: string;
  listing_status?: ListingStatus;
  /** 0–100 "Listing Quality" score from TheVHomes AI Engine. */
  completeness_score?: number;
  /** clear | pending_review | dismissed — see internal/ai/moderation.go. */
  moderation_status?: string;
  is_paid_viewing?: boolean;
  viewing_fee?: number;
  tour?: PropertyTour | null;
}

/**
 * Listing quality report from TheVHomes AI Engine's completeness scorer.
 * The breakdown is per-field so the dashboard can show agents exactly what to
 * fix rather than a bare percentage.
 */
export interface ListingQualityItem {
  field: string;
  earned: number;
  max: number;
  hint?: string;
}

export interface ListingQuality {
  completeness_score: number;
  breakdown: ListingQualityItem[];
  suggestions: string[];
  moderation_status: string;
}

export interface PropertySearchFilters {
  agent_id?: string;
  city?: string;
  property_type?: PropertyType | "";
  purpose?: Purpose | "";
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  security?: boolean;
  swimming_pool?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedProperties {
  items: Property[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Investment {
  id: string;
  title: string;
  description: string;
  image_url: string;
  roi_estimate_percent: number;
  min_investment: number;
  timeline_months: number;
  expected_return: number;
  status: string;
}

export interface Booking {
  id: string;
  property_id: string;
  property?: Property;
  customer_id: string;
  agent_id: string;
  agent?: Agent;
  scheduled_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  viewing_type?: ViewingType;
  payment_required?: boolean;
  viewing_fee?: number;
  payment_id?: string | null;
  ticket?: ViewingTicket | null;
}

export interface Payment {
  id: string;
  user_id: string;
  property_id?: string;
  booking_id?: string;
  amount: number;
  currency: string;
  purpose: string;
  provider: "paystack" | "flutterwave";
  reference: string;
  status: "pending" | "success" | "failed";
  refund_status?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "agent" | "customer" | "support";
  avatar_url?: string;
  agent?: Agent;
  nin_verified?: boolean;
  identity_verified_at?: string | null;
  identity_verification?: IdentityVerification | null;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  property_id?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  read_at?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Admin-editable content for the public About page (Company Overview,
 * Mission, Vision, Core Values, Why Choose Us, Areas We Operate, Services
 * Offered, Testimonials, and the Founder section). Stored server-side as a
 * single JSON document under the "about" key so it can be edited from
 * /admin/content without a schema migration for every copy change.
 */
export interface AboutPageContent {
  overview: string;
  mission: string;
  vision: string;
  core_values: { title: string; description: string }[];
  why_choose_us: string[];
  areas_we_operate: string[];
  services_offered: string[];
  testimonials: { name: string; role: string; quote: string }[];
  founder: {
    name: string;
    title: string;
    bio: string;
    message: string;
    vision: string;
  };
}
