-- ============================================
-- URGENT: Rollback bad policies and apply correct fix
-- ============================================

-- ============================================
-- STEP 1: DISABLE RLS temporarily to diagnose
-- ============================================
-- DO NOT keep this disabled - we'll re-enable it after fixing

-- Check current admin user
SELECT 
  'Current admin check:' as info,
  id,
  email,
  role
FROM public.profiles
WHERE role = 'admin'
LIMIT 5;

-- Check caregivers
SELECT 
  'Caregivers:' as info,
  cg.id as caregiver_id,
  cg.full_name as caregiver_name,
  cg.user_id,
  p.email as user_email,
  p.role as user_role
FROM public.caregivers cg
LEFT JOIN public.profiles p ON cg.user_id = p.id
LIMIT 5;

-- Check bookings data
SELECT 
  'Bookings data:' as info,
  b.id,
  b.service_type,
  b.scheduled_date,
  b.client_id,
  b.caregiver_id,
  b.status
FROM public.bookings b
LIMIT 5;

-- ============================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ============================================

-- Drop bookings policies
DROP POLICY IF EXISTS "bookings_caregiver_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_client_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_client_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
DROP POLICY IF EXISTS "Caregivers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Drop clients policies
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_select_caregiver" ON public.clients;
DROP POLICY IF EXISTS "clients_select_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

-- ============================================
-- STEP 3: CREATE SIMPLE, WORKING POLICIES
-- ============================================

-- BOOKINGS POLICIES

-- 1. Simple admin access (checks role column directly)
CREATE POLICY "bookings_admin_access" ON public.bookings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. Caregivers can view their bookings
CREATE POLICY "bookings_caregivers_view" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM public.caregivers WHERE user_id = auth.uid()
    )
  );

-- 3. Clients can view their bookings
CREATE POLICY "bookings_clients_view" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- 4. Clients can create bookings
CREATE POLICY "bookings_clients_insert" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- 5. Update bookings (clients and caregivers)
CREATE POLICY "bookings_update_access" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    OR
    caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid())
  );

-- CLIENTS POLICIES

-- 1. Simple admin access
CREATE POLICY "clients_admin_access" ON public.clients
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. Users can view their own client record
CREATE POLICY "clients_view_own" ON public.clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Caregivers can view assigned clients
CREATE POLICY "clients_caregivers_view" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT b.client_id
      FROM public.bookings b
      INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE cg.user_id = auth.uid()
    )
  );

-- 4. Users can insert their own client record
CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. Users can update their own client record
CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Verify policies
-- ============================================
SELECT '=== BOOKINGS POLICIES ===' as section;
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

SELECT '=== CLIENTS POLICIES ===' as section;
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- ============================================
-- DONE!
-- ============================================
