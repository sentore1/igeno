-- Add RLS policies for caregivers table if not already present

-- Caregivers RLS Policies
-- Allow admins to do everything
CREATE POLICY "Admins can manage caregivers" ON public.caregivers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow caregivers to view their own profile
CREATE POLICY "Caregivers can view own profile" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Allow caregivers to update their own profile
CREATE POLICY "Caregivers can update own profile" ON public.caregivers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow all authenticated users to view caregiver listings
CREATE POLICY "Anyone can view caregivers" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to caregivers" ON public.caregivers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
