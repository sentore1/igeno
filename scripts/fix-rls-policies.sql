-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

-- Create a function to check if user is admin using auth.jwt()
-- This avoids the circular reference by checking auth.users metadata instead of profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin',
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies with proper structure to avoid recursion

-- Allow users to insert their own profile during signup
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles (using function to avoid circular reference)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Service role has full access (used by server-side operations)
CREATE POLICY "Service role has full access" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- IMPORTANT: Set up admin users after running this script
-- ============================================
-- To make a user an admin, run one of these queries:

-- Option 1: Update user metadata (recommended)
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'your-admin-email@example.com';

-- Option 2: Update profile directly
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- Verify admin access with:
-- SELECT u.id, u.email, u.raw_user_meta_data->>'role' as metadata_role, p.role as profile_role
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE u.email = 'your-admin-email@example.com';
