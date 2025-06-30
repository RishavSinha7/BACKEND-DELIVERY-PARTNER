-- SQL script to insert user data into the profiles table
-- This creates test user profiles that can be used for booking tests
-- Note: This uses Supabase Auth users and extends them with profiles

-- First, create users in auth.users table and then extend with profiles
-- Since we can't directly insert into auth.users (managed by Supabase Auth),
-- we'll use a simpler approach 

-- Insert a test customer profile (assuming basic structure)
INSERT INTO profiles (
    id,
    full_name,
    phone
) VALUES (
    gen_random_uuid(),  -- This should be a valid auth user ID in production
    'Test Customer',
    '+919876543210'
);

-- Insert another test customer profile  
INSERT INTO profiles (
    id,
    full_name,
    phone
) VALUES (
    gen_random_uuid(),
    'John Doe', 
    '+919123456789'
);

-- Insert a test driver profile
INSERT INTO profiles (
    id,
    full_name,
    phone
) VALUES (
    gen_random_uuid(),
    'Test Driver',
    '+919987654321'
);

-- Query to verify the inserted profiles
SELECT 
    id,
    full_name,
    phone,
    created_at,
    updated_at
FROM profiles 
WHERE phone IN (
    '+919876543210', 
    '+919123456789', 
    '+919987654321'
)
ORDER BY created_at DESC;
