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
    amount NUMERIC(16, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    purpose TEXT NOT NULL,   -- booking_fee | reservation | consultation | shortlet_booking
    provider TEXT NOT NULL, -- paystack | flutterwave
    reference TEXT UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | success | failed
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
