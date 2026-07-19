-- Fix "Unknown Client" issue for caregivers
-- This script adds RLS policy to allow caregivers to view their assigned clients' information

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

-- Create policy that allows caregivers to view clients they're assigned to through bookings
CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is the client owner
    auth.uid() = user_id
    OR
    -- Allow if user is an admin
    public.is_admin()
    OR
    -- Allow if user is a caregiver assigned to this client through any booking
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
      AND cg.user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clients'
AND policyname = 'Caregivers can view their assigned clients';
