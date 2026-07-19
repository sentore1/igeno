-- Fix ALL infinite recursion issues in RLS policies
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROBLEM: Circular dependencies in RLS policies
-- ============================================
-- 1. Clients table queries bookings table
-- 2. Bookings table queries clients table
-- 3. This creates infinite recursion

-- SOLUTION: Use simpler policies without cross-table queries
-- or use helper functions with SECURITY DEFINER

-- ============================================
-- STEP 1: Drop all problematic policies
-- ============================================

-- Clients table
DROP POLICY IF EXISTS "Users can insert own client record" ON public.clients;
DROP POLICY IF EXISTS "Users can view own client record" ON public.clients;
DROP POLICY IF EXISTS "Users can update own client record" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

-- Caregivers table
DROP POLICY IF EXISTS "Users can insert own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Users can view own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Users can update own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Admins can manage all caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Public can view caregiver profiles" ON public.caregivers;

-- Bookings table
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Caregivers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- ============================================
-- STEP 2: Create SIMPLE policies for clients table
-- ============================================

-- Allow authenticated users to insert their own client record
CREATE POLICY "Enable insert for authenticated users" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own client record
CREATE POLICY "Users can view own client" ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Allow users to update their own client record
CREATE POLICY "Users can update own client" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Admins have full access
CREATE POLICY "Admins full access to clients" ON public.clients
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- STEP 3: Create SIMPLE policies for caregivers table
-- ============================================

-- Allow authenticated users to insert their own caregiver record
CREATE POLICY "Enable insert for authenticated users" ON public.caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own caregiver record + admins can view all
CREATE POLICY "Users can view own caregiver" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Allow all authenticated users to view caregiver profiles (for booking)
CREATE POLICY "All can view caregiver profiles" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own caregiver record
CREATE POLICY "Users can update own caregiver" ON public.caregivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Admins have full access
CREATE POLICY "Admins full access to caregivers" ON public.caregivers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- STEP 4: Create SIMPLE policies for bookings table
-- ============================================

-- Allow authenticated users to create bookings for their own client record
CREATE POLICY "Enable insert for client bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Allow users to view bookings related to their client record
CREATE POLICY "Clients view own bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Allow caregivers to view bookings assigned to them
CREATE POLICY "Caregivers view assigned bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregivers
      WHERE id = bookings.caregiver_id
      AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Allow clients to update their own bookings
CREATE POLICY "Clients update own bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Allow caregivers to update bookings assigned to them
CREATE POLICY "Caregivers update assigned bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregivers
      WHERE id = bookings.caregiver_id
      AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Admins have full access
CREATE POLICY "Admins full access to bookings" ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- STEP 5: Verify policies are created
-- ============================================

-- Check all policies on our tables
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename IN ('clients', 'caregivers', 'bookings')
ORDER BY tablename, policyname;

-- ============================================
-- VERIFICATION: Count policies per table
-- ============================================

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('clients', 'caregivers', 'bookings')
GROUP BY tablename;

-- Expected results:
-- clients: ~4 policies
-- caregivers: ~5 policies  
-- bookings: ~6 policies
