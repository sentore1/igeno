-- Fix missing profiles for existing users
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Check for users without profiles
-- ============================================

SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as metadata_name,
  u.raw_user_meta_data->>'role' as metadata_role,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Has Profile'
  END as profile_status,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ============================================
-- STEP 2: Create missing profiles for existing users
-- ============================================

-- This will create profiles for all users who don't have one yet
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'client')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Verify the trigger exists
-- ============================================

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- If the trigger doesn't exist, create it:

-- Create the function
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
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: Verify all users now have profiles
-- ============================================

SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Should show: users_without_profiles = 0

-- ============================================
-- STEP 5: Check RLS policies on profiles table
-- ============================================

-- View all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Make sure SELECT policy exists for authenticated users
-- If not, create it:

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to confirm everything is working:
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Users with Profiles' as metric,
  COUNT(p.id)::text as value
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
UNION ALL
SELECT 
  'Trigger Exists' as metric,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ Yes' ELSE '❌ No' END as value
UNION ALL
SELECT 
  'RLS Enabled' as metric,
  CASE WHEN relrowsecurity THEN '✅ Yes' ELSE '❌ No' END as value
FROM pg_class
WHERE relname = 'profiles';
