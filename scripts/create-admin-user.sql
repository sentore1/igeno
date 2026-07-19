-- Script to create admin user for abodusentore
-- Run this in your Supabase SQL Editor AFTER the user has signed up

-- First, find the user ID for abodusentore
-- You need to get this from auth.users table or Supabase dashboard

-- Method 1: Update existing user metadata to make them admin
-- Replace 'USER_EMAIL_HERE' with the actual email
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'abodusentore@example.com'; -- Replace with actual email

-- Method 2: If the profile exists but has wrong role, update it
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'abodusentore@example.com'; -- Replace with actual email

-- Method 3: Create profile manually if it doesn't exist
-- Get the user_id first by running: SELECT id, email FROM auth.users WHERE email = 'abodusentore@example.com';
-- Then run this with the actual user_id:
/*
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES (
  'USER_ID_FROM_AUTH_USERS', -- Replace with actual UUID
  'abodusentore@example.com', -- Replace with actual email
  'Admin User',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- Verify the admin user
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  p.role as profile_role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'abodusentore@example.com'; -- Replace with actual email
