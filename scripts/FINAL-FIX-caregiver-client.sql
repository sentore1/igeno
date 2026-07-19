-- ============================================
-- FINAL FIX: Allow caregivers to see assigned client names
-- ============================================
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

-- Step 2: Create the correct policy
-- This allows caregivers to SELECT (read) client records for clients they're assigned to
CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    -- Check if there's a booking that links this client to the current user's caregiver profile
    EXISTS (
      SELECT 1 
      FROM public.bookings b
      INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
        AND cg.user_id = auth.uid()
    )
  );

-- Step 3: Verify the policy was created
SELECT 
  'Policy created successfully!' as message,
  policyname,
  cmd as policy_type
FROM pg_policies
WHERE tablename = 'clients'
  AND policyname = 'Caregivers can view their assigned clients';

-- Step 4: Test the fix by checking what the caregiver "intore" should see
-- (This query runs as admin, so you'll see the expected result)
SELECT 
  'Expected data for caregiver intore:' as test_info,
  c.full_name as client_name,
  c.email as client_email,
  b.service_type,
  b.scheduled_date
FROM public.clients c
INNER JOIN public.bookings b ON b.client_id = c.id
INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
WHERE cg.full_name = 'intore'
ORDER BY b.scheduled_date;

-- ============================================
-- DONE! Now test by:
-- 1. Log out from admin
-- 2. Log in as caregiver (intore)
-- 3. Go to Caregiver Dashboard
-- 4. You should see "Patricia Garcia" instead of "Unknown Client"
-- ============================================
