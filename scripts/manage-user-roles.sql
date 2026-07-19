-- ============================================
-- USER ROLE MANAGEMENT SCRIPT
-- ============================================
-- Use this script to view and update user roles in Supabase
-- Run these queries in your Supabase SQL Editor

-- ============================================
-- STEP 1: VIEW ALL USERS AND THEIR ROLES
-- ============================================
-- This shows all users with their current roles and email addresses
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role,
  p.created_at,
  -- Check if roles match
  CASE 
    WHEN p.role = (u.raw_user_meta_data->>'role') THEN 'Match ✓'
    ELSE 'Mismatch ✗'
  END as role_consistency
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- ============================================
-- STEP 2: FIND A SPECIFIC USER BY EMAIL
-- ============================================
-- Replace 'user@example.com' with the actual email
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'abodusentore@example.com'; -- Change this email

-- ============================================
-- STEP 3: CHANGE USER ROLE
-- ============================================
-- Valid roles: 'admin', 'trainer', 'student', 'caregiver', 'nurse', 'consultant', 'client'

-- Method A: Change by EMAIL (Recommended)
-- Replace the email and role values below:
BEGIN;

-- Update profiles table
UPDATE public.profiles
SET role = 'admin' -- Change to: admin, trainer, student, caregiver, nurse, consultant, or client
WHERE email = 'abodusentore@example.com'; -- Change this email

-- Update auth metadata (for is_admin() function)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"' -- Change to match the role above (with quotes)
)
WHERE email = 'abodusentore@example.com'; -- Change this email

COMMIT;

-- ============================================
-- Method B: Change by USER ID
-- ============================================
-- If you know the user ID (UUID), use this instead:
/*
BEGIN;

-- Update profiles table
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'USER-UUID-HERE'; -- Replace with actual UUID

-- Update auth metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id = 'USER-UUID-HERE'; -- Replace with actual UUID

COMMIT;
*/

-- ============================================
-- STEP 4: VERIFY THE CHANGES
-- ============================================
-- Check that the role was updated correctly
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role,
  CASE 
    WHEN p.role = (u.raw_user_meta_data->>'role') THEN '✓ Roles Match'
    ELSE '✗ Roles Do Not Match'
  END as status
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'abodusentore@example.com'; -- Change this email

-- ============================================
-- STEP 5: BULK ROLE CHANGES (OPTIONAL)
-- ============================================
-- Change multiple users to admin at once
/*
BEGIN;

-- Update profiles for multiple users
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);

-- Update auth metadata for multiple users
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);

COMMIT;
*/

-- ============================================
-- TROUBLESHOOTING: Fix Mismatched Roles
-- ============================================
-- If profile_role and metadata_role don't match, run this:
/*
BEGIN;

-- Sync metadata to match profile role
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(p.role)
)
FROM public.profiles p
WHERE u.id = p.id
AND (u.raw_user_meta_data->>'role' IS NULL OR u.raw_user_meta_data->>'role' != p.role);

COMMIT;
*/

-- ============================================
-- REFERENCE: Valid Role Values
-- ============================================
-- Make sure to use exactly these values:
-- - 'admin'       : Full system access
-- - 'trainer'     : Can create/manage courses
-- - 'student'     : Can enroll in courses
-- - 'caregiver'   : Provides care services
-- - 'nurse'       : Medical care provider
-- - 'consultant'  : Professional consultant
-- - 'client'      : Receives care services

-- ============================================
-- CLEAN UP: Remove Incorrectly Created Client Records
-- ============================================
-- If admin/trainer/student users were wrongly added to clients table:
/*
-- First, check which users are in the clients table
SELECT 
  c.id as client_id,
  c.user_id,
  p.email,
  p.full_name,
  p.role
FROM public.clients c
JOIN public.profiles p ON c.user_id = p.id
WHERE p.role NOT IN ('client', 'caregiver', 'nurse')
ORDER BY p.role;

-- Then delete them if they shouldn't be clients
DELETE FROM public.clients
WHERE user_id IN (
  SELECT p.id
  FROM public.profiles p
  WHERE p.role NOT IN ('client', 'caregiver', 'nurse')
);
*/
