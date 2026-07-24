-- TheVHomes reference schema (PostgreSQL)
--
-- This file documents the schema that internal/database.Connect() creates
-- automatically via GORM AutoMigrate (see backend/internal/models). It is
-- provided for reference, manual review, and for teams that prefer explicit
-- SQL migrations (e.g. via golang-migrate/migrate or Atlas) over AutoMigrate
-- in production.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- admin | agent | customer | support
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    nin_verified BOOLEAN NOT NULL DEFAULT false,
    identity_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users (id),
    bio TEXT,
    experience_years INT NOT NULL DEFAULT 0,
    agency_name TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_level VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | verified | premium_verified
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    reviews_count INT NOT NULL DEFAULT 0,
    identity_verified BOOLEAN NOT NULL DEFAULT false,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'not_applied', -- not_applied | pending | under_review | approved | rejected
    agent_number TEXT UNIQUE, -- permanent, sequential, e.g. TVH-AGT-000001; assigned once on approval
    agent_number_assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(16, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    address TEXT,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    property_type VARCHAR(20) NOT NULL, -- apartment | villa | duplex | land | office | hotel | shortlet
    purpose VARCHAR(20) NOT NULL,       -- buy | rent | invest | shortlet
    bedrooms INT NOT NULL DEFAULT 0,
    bathrooms INT NOT NULL DEFAULT 0,
    square_meters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    furnished BOOLEAN NOT NULL DEFAULT false,
    parking BOOLEAN NOT NULL DEFAULT false,
    security BOOLEAN NOT NULL DEFAULT false,
    swimming_pool BOOLEAN NOT NULL DEFAULT false,
    amenities TEXT[] NOT NULL DEFAULT '{}',
    video_urls TEXT[] NOT NULL DEFAULT '{}',
    virtual_tour_url TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    available BOOLEAN NOT NULL DEFAULT true,
    cover_image_url TEXT,
    listing_status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft | pending_review | under_inspection | verified | rejected
    is_paid_viewing BOOLEAN NOT NULL DEFAULT false,
    viewing_fee NUMERIC(16, 2) NOT NULL DEFAULT 0,
    agent_id UUID NOT NULL REFERENCES agents (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_agent_id ON properties (agent_id);
CREATE INDEX idx_properties_deleted_at ON properties (deleted_at);

CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_property_images_property_id ON property_images (property_id);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties (id),
    customer_id UUID NOT NULL REFERENCES users (id),
    agent_id UUID NOT NULL REFERENCES agents (id),
    scheduled_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
    notes TEXT,
    viewing_type VARCHAR(20) NOT NULL DEFAULT 'physical', -- physical | virtual | video
    payment_required BOOLEAN NOT NULL DEFAULT false,
    viewing_fee NUMERIC(16, 2) NOT NULL DEFAULT 0,
    payment_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_bookings_property_id ON bookings (property_id);
CREATE INDEX idx_bookings_customer_id ON bookings (customer_id);
CREATE INDEX idx_bookings_agent_id ON bookings (agent_id);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_one_id UUID NOT NULL REFERENCES users (id),
    participant_two_id UUID NOT NULL REFERENCES users (id),
    property_id UUID REFERENCES properties (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_conversations_p1 ON conversations (participant_one_id);
CREATE INDEX idx_conversations_p2 ON conversations (participant_two_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users (id),
    content TEXT,
    attachment_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id),
    property_id UUID REFERENCES properties (id),
    agent_id UUID REFERENCES agents (id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_reviews_property_id ON reviews (property_id);
CREATE INDEX idx_reviews_agent_id ON reviews (agent_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id),
    property_id UUID REFERENCES properties (id),
    booking_id UUID REFERENCES bookings (id),
    amount NUMERIC(16, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    purpose TEXT NOT NULL,   -- booking_fee | reservation | consultation | shortlet_booking | viewing_fee
    provider TEXT NOT NULL, -- paystack | flutterwave
    reference TEXT UNIQUE NOT NULL,
    provider_reference TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | success | failed
    refund_status VARCHAR(20) NOT NULL DEFAULT 'none', -- none | requested | approved | rejected | refunded
    refund_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    roi_estimate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    min_investment NUMERIC(16, 2) NOT NULL DEFAULT 0,
    timeline_months INT NOT NULL DEFAULT 0,
    expected_return NUMERIC(16, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open', -- open | funded | closed
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Phase 2: Google OAuth, VerifyMe identity verification, agent onboarding,
-- property verification, 3D tours, paid viewing services, notifications.
-- ============================================================================

CREATE TABLE google_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users (id),
    google_id TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    access_token_enc TEXT,  -- AES-256-GCM encrypted
    refresh_token_enc TEXT, -- AES-256-GCM encrypted
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE refresh_token_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id),
    token_hash TEXT UNIQUE NOT NULL, -- SHA-256 of the raw refresh token; raw value never stored
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_token_records (user_id);

CREATE TABLE identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users (id),
    full_name TEXT,
    nin_encrypted TEXT, -- AES-256-GCM encrypted; full NIN never exposed via API
    nin_last4 TEXT,
    date_of_birth TIMESTAMPTZ,
    phone_number TEXT,
    selfie_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | verified | failed | rejected
    provider TEXT NOT NULL DEFAULT 'verifyme',
    provider_reference TEXT,
    failure_reason TEXT,
    verified_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE verify_me_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_verification_id UUID NOT NULL REFERENCES identity_verifications (id),
    endpoint TEXT,
    request_id TEXT,
    http_status INT,
    response_body TEXT, -- raw JSON audit trail; never exposed to clients
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_verifyme_responses_verification_id ON verify_me_responses (identity_verification_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users (id),
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    metadata TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);

CREATE TABLE agent_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents (id),
    business_name TEXT,
    office_address TEXT,
    cac_number TEXT,
    cac_document_url TEXT,
    government_id_url TEXT,
    profile_photo_url TEXT,
    selfie_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | under_review | approved | rejected
    reviewed_by UUID REFERENCES users (id),
    review_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_agent_applications_agent_id ON agent_applications (agent_id);

-- Singleton row, row-locked (SELECT ... FOR UPDATE) on every approval so
-- agent numbers are assigned atomically, sequentially, and are never reused.
CREATE TABLE agent_number_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_number INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE property_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties (id),
    reviewer_id UUID REFERENCES users (id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
    images_checked BOOLEAN NOT NULL DEFAULT false,
    ownership_doc_checked BOOLEAN NOT NULL DEFAULT false,
    location_checked BOOLEAN NOT NULL DEFAULT false,
    details_checked BOOLEAN NOT NULL DEFAULT false,
    tour_checked BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_property_reviews_property_id ON property_reviews (property_id);

CREATE TABLE property_verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties (id),
    actor_id UUID REFERENCES users (id),
    action TEXT,
    from_status TEXT,
    to_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_property_verification_logs_property_id ON property_verification_logs (property_id);

CREATE TABLE property_tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID UNIQUE NOT NULL REFERENCES properties (id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- not_started | capturing | processing | ready | failed
    capture_method VARCHAR(30) NOT NULL DEFAULT 'photo_360', -- gaussian_splatting | nerf | webxr | matterport | photo_360
    viewer_type TEXT, -- matterport_embed | splat_viewer | panorama_viewer
    asset_url TEXT,
    thumbnail_url TEXT,
    processing_provider TEXT, -- matterport | kiri_engine | luma_ai | polycam | self_hosted
    processing_job_id TEXT,
    room_count INT NOT NULL DEFAULT 0,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE property_tour_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES property_tours (id),
    room_name TEXT,
    media_url TEXT,
    scene_type TEXT, -- photo_360 | video_sweep | frame_sequence
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_property_tour_scenes_tour_id ON property_tour_scenes (tour_id);

CREATE TABLE property_nearby_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties (id),
    category TEXT, -- school | hospital | supermarket | airport
    name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_property_nearby_places_property_id ON property_nearby_places (property_id);

CREATE TABLE viewing_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings (id),
    ticket_code TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    viewing_type VARCHAR(20) NOT NULL DEFAULT 'physical',
    status VARCHAR(20) NOT NULL DEFAULT 'issued', -- issued | checked_in | completed | cancelled
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE live_viewing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings (id),
    session_token TEXT UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled | live | ended
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    recording_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id),
    type TEXT,
    title TEXT,
    body TEXT,
    channel VARCHAR(20) NOT NULL DEFAULT 'in_app', -- email | sms | in_app | whatsapp
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | sent | failed
    read_at TIMESTAMPTZ,
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
