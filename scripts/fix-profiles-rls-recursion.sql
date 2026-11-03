-- ============================================================
-- Fix: "Profile error details: {}" on dashboard load
--
-- Root cause: is_admin() queries the profiles table; the profiles
-- SELECT policy calls is_admin() → infinite recursion → Supabase
-- returns a 500 whose error object has no enumerable properties,
-- so console.error logs it as {}.
--
-- Fix:
--   1. Rewrite is_admin() to read auth.users metadata (no profiles query)
--   2. Keep profiles SELECT policy simple: auth.uid() = id only.
--      Admins read other rows via the service-role or a separate policy
--      that uses the safe is_admin().
--
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Safe is_admin() — reads auth.users, never profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT raw_user_meta_data->>'role' = 'admin'
      FROM auth.users
      WHERE id = auth.uid()
    ),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. Wipe every policy on profiles and recreate cleanly
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can insert their own profile row (e.g. during signup)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can read their own profile — no is_admin() call here!
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admins can read any profile (is_admin() is now safe — no recursion)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- Service role bypasses RLS (used by server-side API routes)
CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 3. Verify
-- ============================================================
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

SELECT '✅ profiles RLS recursion fix applied' AS status;
