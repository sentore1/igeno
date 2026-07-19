-- ============================================
-- FINAL WORKING FIX: Use bypassing RLS for relationships
-- ============================================
-- The 500 error happens because RLS policies create circular dependencies
-- when querying related tables (bookings -> clients -> bookings)

-- ============================================
-- STEP 1: Drop ALL policies that might cause recursion
-- ============================================

-- Drop all bookings policies
DROP POLICY IF EXISTS "bookings_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_caregiver_view" ON public.bookings;
DROP POLICY IF EXISTS "bookings_client_view" ON public.bookings;
DROP POLICY IF EXISTS "bookings_client_create" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
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

-- Drop all clients policies
DROP POLICY IF EXISTS "clients_admin_access" ON public.clients;
DROP POLICY IF EXISTS "clients_caregivers_view" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_view_own" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
DROP POLICY IF EXISTS "clients_select_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_select_caregiver" ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;

-- ============================================
-- STEP 2: Create helper function to bypass RLS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Check if user is a caregiver
CREATE OR REPLACE FUNCTION public.check_is_caregiver(booking_caregiver_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.caregivers 
    WHERE id = booking_caregiver_id 
    AND user_id = auth.uid()
  );
$$;

-- Check if user is client
CREATE OR REPLACE FUNCTION public.check_is_client(booking_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.clients 
    WHERE id = booking_client_id 
    AND user_id = auth.uid()
  );
$$;

-- Check if caregiver can see client
CREATE OR REPLACE FUNCTION public.caregiver_can_see_client(client_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.bookings b
    INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
    WHERE b.client_id = client_id_param
    AND cg.user_id = auth.uid()
  );
$$;

-- ============================================
-- STEP 3: Create SIMPLE policies using functions
-- ============================================

-- BOOKINGS POLICIES

CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.check_is_admin()
    OR public.check_is_caregiver(caregiver_id)
    OR public.check_is_client(client_id)
  );

CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR public.check_is_client(client_id)
  );

CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.check_is_admin()
    OR public.check_is_caregiver(caregiver_id)
    OR public.check_is_client(client_id)
  );

CREATE POLICY "bookings_delete" ON public.bookings
  FOR DELETE
  TO authenticated
  USING (public.check_is_admin());

-- CLIENTS POLICIES

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    public.check_is_admin()
    OR user_id = auth.uid()
    OR public.caregiver_can_see_client(id)
  );

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    public.check_is_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE
  TO authenticated
  USING (public.check_is_admin());

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Grant execute on functions
-- ============================================
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_caregiver(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caregiver_can_see_client(UUID) TO authenticated;

-- ============================================
-- STEP 6: Verify
-- ============================================
SELECT '=== FUNCTIONS CREATED ===' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'check_%' OR routine_name LIKE '%caregiver%'
AND routine_schema = 'public';

SELECT '=== POLICIES CREATED ===' as info;
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('bookings', 'clients')
GROUP BY tablename;

-- ============================================
-- DONE! The SECURITY DEFINER functions bypass RLS recursion
-- ============================================
