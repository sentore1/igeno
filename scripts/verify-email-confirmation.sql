-- Verification script for email confirmation setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- Check if email confirmation is working
-- ============================================

-- 1. Check all users and their email confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not Confirmed'
    ELSE '✅ Confirmed'
  END as status,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- Manually confirm a specific user (if needed)
-- ============================================

-- Option 1: Confirm by email
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'user@example.com'
-- AND email_confirmed_at IS NULL;

-- Option 2: Confirm by ID
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE id = 'user-uuid-here'
-- AND email_confirmed_at IS NULL;

-- ============================================
-- Confirm ALL unconfirmed users (DEVELOPMENT ONLY!)
-- ============================================

-- ⚠️ WARNING: Only use this in development!
-- Never run this in production!

-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- ============================================
-- Check profiles were created for all users
-- ============================================

-- Find users without profiles
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Has Profile'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ============================================
-- Verify the trigger is working
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected output:
-- trigger_name: on_auth_user_created
-- event_manipulation: INSERT
-- event_object_table: users
-- action_statement: EXECUTE FUNCTION public.handle_new_user()
