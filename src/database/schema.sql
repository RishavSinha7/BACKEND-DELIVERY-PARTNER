-- Delivery Partner Database Schema for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_driver BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    address JSONB,
    device_tokens JSONB DEFAULT '[]'::jsonb,
    reset_password_token VARCHAR(255),
    reset_password_expiry TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table (additional driver information)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    license_image_url TEXT,
    license_verified BOOLEAN DEFAULT FALSE,
    aadhar_number VARCHAR(20) UNIQUE NOT NULL,
    aadhar_image_url TEXT,
    aadhar_verified BOOLEAN DEFAULT FALSE,
    pan_number VARCHAR(20),
    pan_image_url TEXT,
    pan_verified BOOLEAN DEFAULT FALSE,
    bank_details JSONB,
    current_location POINT,
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT FALSE,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    earnings JSONB DEFAULT '{"today": 0, "thisWeek": 0, "thisMonth": 0, "total": 0}'::jsonb,
    stats JSONB DEFAULT '{"totalTrips": 0, "completedTrips": 0, "cancelledTrips": 0}'::jsonb,
    emergency_contact JSONB,
    onboarding_status VARCHAR(50) DEFAULT 'pending',
    approval_date TIMESTAMP,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_brand VARCHAR(100) NOT NULL,
    year_of_manufacture INTEGER NOT NULL,
    color VARCHAR(50),
    fuel_type VARCHAR(20) DEFAULT 'petrol',
    capacity JSONB,
    documents JSONB,
    images JSONB,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verification_notes TEXT,
    current_trip_id UUID,
    maintenance_schedule JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    pickup_location JSONB NOT NULL,
    drop_location JSONB NOT NULL,
    items JSONB NOT NULL,
    pricing JSONB NOT NULL,
    distance DECIMAL(10,2) NOT NULL,
    estimated_time JSONB,
    scheduled_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    rating JSONB,
    tracking_updates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    transactions JSONB DEFAULT '[]'::jsonb,
    payment_methods JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_driver ON users(is_driver);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available, is_online);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_active ON vehicles(vehicle_type, is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - customize as needed)
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Drivers can view their own data" ON drivers
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can view their bookings" ON bookings
    FOR ALL USING (
        customer_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text) OR
        driver_id IN (SELECT d.id FROM drivers d JOIN users u ON d.user_id = u.id WHERE auth.uid()::text = u.id::text)
    );

CREATE POLICY "Users can view their wallets" ON wallets
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text));
