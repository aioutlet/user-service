-- User Service Schema
-- Handles user profiles, addresses, payment methods, and preferences

CREATE SCHEMA IF NOT EXISTS users;

-- Main users table
CREATE TABLE IF NOT EXISTS users.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    roles TEXT[] DEFAULT ARRAY['customer'],
    tier VARCHAR(50) DEFAULT 'basic', -- basic, premium, gold, platinum
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE IF NOT EXISTS users.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- shipping, billing, work, other
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(5) NOT NULL DEFAULT 'US',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE
);

-- User payment methods
CREATE TABLE IF NOT EXISTS users.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- credit_card, debit_card, digital_wallet, bank_transfer
    provider VARCHAR(50) NOT NULL, -- visa, mastercard, amex, paypal, stripe
    last4 VARCHAR(4) NOT NULL,
    expiry_month INTEGER,
    expiry_year INTEGER,
    cardholder_name VARCHAR(255),
    billing_address_id UUID,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- Store additional provider-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_address_id) REFERENCES users.addresses(id) ON DELETE SET NULL
);

-- User preferences
CREATE TABLE IF NOT EXISTS users.preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    notifications JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
    privacy JSONB DEFAULT '{"profile_visible": true, "show_activity": false}',
    ui JSONB DEFAULT '{"theme": "light", "language": "en", "timezone": "UTC"}',
    marketing JSONB DEFAULT '{"email_offers": true, "sms_offers": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE
);

-- User wishlist
CREATE TABLE IF NOT EXISTS users.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id VARCHAR(255) NOT NULL, -- Reference to product service
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2),
    product_image_url VARCHAR(500),
    notes TEXT,
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

-- Social media connections
CREATE TABLE IF NOT EXISTS users.social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL, -- google, facebook, twitter, linkedin
    platform_user_id VARCHAR(255) NOT NULL,
    platform_username VARCHAR(255),
    profile_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE,
    UNIQUE(user_id, platform)
);

-- User activity log
CREATE TABLE IF NOT EXISTS users.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- profile_update, address_added, payment_added, etc.
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users.profiles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON users.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON users.profiles USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON users.profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON users.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON users.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON users.addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON users.addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON users.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON users.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON users.payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON users.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON users.wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON users.social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON users.social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON users.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON users.activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON users.activity_log(created_at);
