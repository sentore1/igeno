-- ============================================
-- CLEAN FIX: Remove duplicate policies and create clean ones
-- ============================================
-- This will fix both admin and caregiver access

-- ============================================
-- STEP 1: Drop ALL existing policies on bookings
-- ============================================

DROP POLICY IF EXISTS "Admins full access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Caregivers update assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Caregivers view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable insert for client bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_access" ON public.bookings;
DROP POLICY IF EXISTS "bookings_caregivers_view" ON public.bookings;
DROP POLICY IF EXISTS "bookings_clients_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_clients_view" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_access" ON public.bookings;

-- ============================================
-- STEP 2: Create ONLY the necessary bookings policies
-- ============================================

-- Policy 1: Admin can do everything
CREATE POLICY "bookings_admin" ON public.bookings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 2: Caregivers can view their assigned bookings
CREATE POLICY "bookings_caregiver_view" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM public.caregivers WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Clients can view their bookings
CREATE POLICY "bookings_client_view" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Clients can create bookings
CREATE POLICY "bookings_client_create" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Clients and caregivers can update their bookings
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    OR
    caregiver_id IN (SELECT id FROM public.caregivers WHERE user_id = auth.uid())
  );

-- ============================================
-- STEP 3: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Verify the fix
-- ============================================

SELECT '=== BOOKINGS POLICIES (should be 5) ===' as info;
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

SELECT '=== CLIENTS POLICIES (should be 5) ===' as info;
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- ============================================
-- STEP 5: Summary
-- ============================================
SELECT 
  '✓ Policies cleaned up' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'bookings') as bookings_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'clients') as clients_policies;

-- ============================================
-- DONE! Now test:
-- 1. Login as admin (abdousentore) - should see ALL 7 bookings
-- 2. Login as caregiver (intore) - should see 2 bookings with client names
-- ============================================
