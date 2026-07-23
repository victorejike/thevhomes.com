export type PropertyType =
  | "apartment"
  | "villa"
  | "duplex"
  | "land"
  | "office"
  | "hotel"
  | "shortlet";

export type Purpose = "buy" | "rent" | "invest" | "shortlet";

export type VerificationStatus = "pending" | "verified" | "premium_verified";

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
  virtual_tour_url?: string;
  verification_status: VerificationStatus;
  available: boolean;
  agent_id: string;
  agent?: Agent;
  images?: PropertyImage[];
  created_at: string;
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
  scheduled_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "agent" | "customer" | "support";
  avatar_url?: string;
  agent?: Agent;
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
