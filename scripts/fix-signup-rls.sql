-- Fix signup RLS error: "new row violates row-level security policy for table profiles"
-- This script creates a database trigger to automatically create profiles on user signup
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing INSERT policy and create a more permissive one
-- ============================================

-- Drop the old policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;

-- Create a new policy that allows insert for new users
-- This checks if the user exists in auth.users but not yet in profiles
CREATE POLICY "Enable insert during signup" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id 
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================
-- STEP 2: Create automatic profile creation trigger (RECOMMENDED)
-- ============================================

-- This function will be triggered when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

-- After running this script:
-- 1. Try signing up with a new user
-- 2. The profile should be created automatically
-- 3. No RLS error should occur

-- To verify the trigger is working:
-- SELECT * FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';
