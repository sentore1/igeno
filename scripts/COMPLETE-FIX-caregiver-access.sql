-- ============================================
-- COMPLETE FIX: Caregiver access to bookings AND clients
-- ============================================
-- This fixes the issue where caregivers can't see their bookings or client names

-- ============================================
-- STEP 1: Check current policies
-- ============================================
SELECT 'Current bookings policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'bookings';

SELECT 'Current clients policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'clients';

-- ============================================
-- STEP 2: Fix BOOKINGS table policiesaaaa
-- ============================================

-- Drop existing booking policies that might be blocking access
DROP POLICY IF EXISTS "Caregivers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Create comprehensive booking policies

-- 1. Allow caregivers to view their assigned bookings
CREATE POLICY "bookings_caregiver_select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregivers cg
      WHERE cg.id = bookings.caregiver_id
        AND cg.user_id = auth.uid()
    )
  );

-- 2. Allow clients to view their own bookings
CREATE POLICY "bookings_client_select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = bookings.client_id
        AND c.user_id = auth.uid()
    )
  );

-- 3. Allow admins to view all bookings
CREATE POLICY "bookings_admin_all" ON public.bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- 4. Allow clients to create bookings
CREATE POLICY "bookings_client_insert" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = bookings.client_id
        AND c.user_id = auth.uid()
    )
  );

-- 5. Allow clients and caregivers to update their bookings
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = bookings.client_id
        AND c.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.caregivers cg
      WHERE cg.id = bookings.caregiver_id
        AND cg.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Fix CLIENTS table policies
-- ============================================

-- Drop existing client policies
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view own client" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own client record" ON public.clients;
DROP POLICY IF EXISTS "Users can update own client record" ON public.clients;
DROP POLICY IF EXISTS "Admins full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
DROP POLICY IF EXISTS "clients_caregiver_assigned" ON public.clients;

-- Create comprehensive client policies

-- 1. Users can insert their own client record
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Users can view their own client record
CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Caregivers can view their assigned clients
CREATE POLICY "clients_select_caregiver" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.bookings b
      INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
        AND cg.user_id = auth.uid()
    )
  );

-- 4. Admins can view all clients
CREATE POLICY "clients_select_admin" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- 5. Users can update their own client record
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Admins can do everything with clients
CREATE POLICY "clients_admin_all" ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Verify the fix
-- ============================================

SELECT '=== BOOKINGS POLICIES ===' as info;
SELECT 
  policyname,
  cmd as type
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

SELECT '=== CLIENTS POLICIES ===' as info;
SELECT 
  policyname,
  cmd as type
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- ============================================
-- STEP 6: Test query - what should "intore" see?
-- ============================================
SELECT '=== TEST: Data for caregiver intore ===' as info;
SELECT 
  b.service_type,
  b.scheduled_date,
  b.scheduled_time,
  b.status,
  c.full_name as client_name,
  c.email as client_email
FROM public.bookings b
INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
LEFT JOIN public.clients c ON b.client_id = c.id
WHERE cg.full_name = 'intore'
ORDER BY b.scheduled_date;

-- ============================================
-- DONE! Test by logging in as caregiver "intore"
-- ============================================
