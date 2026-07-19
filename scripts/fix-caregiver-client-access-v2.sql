-- Fix "Unknown Client" issue for caregivers - Version 2
-- This is a comprehensive fix that handles multiple potential issues

-- ============================================
-- STEP 1: First, check current state
-- ============================================

-- Check if RLS is enabled on clients table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'clients';

-- Check existing policies
SELECT 
  policyname
FROM pg_policies
WHERE tablename = 'clients';

-- ============================================
-- STEP 2: Drop all existing policies on clients table
-- ============================================

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clients;
  DROP POLICY IF EXISTS "Users can view own client" ON public.clients;
  DROP POLICY IF EXISTS "Users can update own client" ON public.clients;
  DROP POLICY IF EXISTS "Admins full access to clients" ON public.clients;
  DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;
  DROP POLICY IF EXISTS "Users can insert own client record" ON public.clients;
  DROP POLICY IF EXISTS "Users can view own client record" ON public.clients;
  DROP POLICY IF EXISTS "Users can update own client record" ON public.clients;
  DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
  DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
END $$;

-- ============================================
-- STEP 3: Create comprehensive policies
-- ============================================

-- Policy 1: Users can insert their own client record
CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own client record
CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 3: Users can update their own client record
CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 4: Admins have full access to all clients
CREATE POLICY "clients_admin_all" ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy 5: Caregivers can view their assigned clients
CREATE POLICY "clients_caregiver_assigned" ON public.clients
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

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Verify the fix
-- ============================================

-- Show all policies on clients table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- Test: Check if bookings have proper client_id references
SELECT 
  b.id,
  b.service_type,
  b.scheduled_date,
  b.client_id,
  c.full_name as client_name,
  b.caregiver_id,
  cg.full_name as caregiver_name
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.caregivers cg ON b.caregiver_id = cg.id
ORDER BY b.created_at DESC
LIMIT 5;

-- ============================================
-- DONE! Now test by logging in as caregiver
-- ============================================
