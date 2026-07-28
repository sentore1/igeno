-- ============================================
-- CAREGIVER TIMESHEET SYSTEM
-- ============================================
-- This creates a system for caregivers to log their work hours
-- When they arrive at the office and when they leave/complete work

-- ============================================
-- 1. CREATE TIMESHEET TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Check-in information
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_location TEXT,
  check_in_notes TEXT,
  
  -- Check-out information
  check_out_time TIMESTAMPTZ,
  check_out_location TEXT,
  check_out_notes TEXT,
  
  -- Work details
  total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN check_out_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600
      ELSE NULL
    END
  ) STORED,
  
  work_description TEXT,
  tasks_completed TEXT[],
  client_feedback TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'checked-in' CHECK (status IN ('checked-in', 'checked-out', 'submitted', 'approved', 'rejected')),
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_timesheets_caregiver_id ON public.timesheets(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_booking_id ON public.timesheets(booking_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_check_in_time ON public.timesheets(check_in_time);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON public.timesheets(status);

-- ============================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_timesheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timesheets_updated_at ON public.timesheets;
CREATE TRIGGER set_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_timesheets_updated_at();

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Caregivers can insert their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Caregivers can view their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Caregivers can update their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admins can view all timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admins can update all timesheets" ON public.timesheets;

-- Caregivers can insert their own timesheets
CREATE POLICY "Caregivers can insert their own timesheets"
ON public.timesheets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.caregivers cg
    WHERE cg.id = caregiver_id
    AND cg.user_id = auth.uid()
  )
);

-- Caregivers can view their own timesheets
CREATE POLICY "Caregivers can view their own timesheets"
ON public.timesheets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.caregivers cg
    WHERE cg.id = caregiver_id
    AND cg.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Caregivers can update their own timesheets (only if not yet approved)
CREATE POLICY "Caregivers can update their own timesheets"
ON public.timesheets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.caregivers cg
    WHERE cg.id = caregiver_id
    AND cg.user_id = auth.uid()
  )
  AND status IN ('checked-in', 'checked-out', 'submitted')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.caregivers cg
    WHERE cg.id = caregiver_id
    AND cg.user_id = auth.uid()
  )
);

-- Admins can view all timesheets
CREATE POLICY "Admins can view all timesheets"
ON public.timesheets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Admins can update all timesheets (for approval/rejection)
CREATE POLICY "Admins can update all timesheets"
ON public.timesheets
FOR UPDATE
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
-- 5. CREATE SAMPLE DATA (Optional)
-- ============================================

-- Create a sample timesheet for testing
DO $$
DECLARE
  caregiver_id_var UUID;
  booking_id_var UUID;
BEGIN
  -- Get the first caregiver
  SELECT id INTO caregiver_id_var FROM public.caregivers LIMIT 1;
  
  -- Get a completed booking
  SELECT id INTO booking_id_var FROM public.bookings WHERE status = 'completed' LIMIT 1;
  
  IF caregiver_id_var IS NOT NULL THEN
    -- Create a completed timesheet
    INSERT INTO public.timesheets (
      caregiver_id,
      booking_id,
      check_in_time,
      check_in_location,
      check_in_notes,
      check_out_time,
      check_out_location,
      check_out_notes,
      work_description,
      tasks_completed,
      status
    ) VALUES (
      caregiver_id_var,
      booking_id_var,
      NOW() - INTERVAL '8 hours',
      'Client Home - 123 Oak Street',
      'Arrived on time, client was ready',
      NOW() - INTERVAL '4 hours',
      'Client Home - 123 Oak Street',
      'Service completed successfully',
      'Provided personal care and companionship',
      ARRAY['Assisted with bathing', 'Prepared lunch', 'Administered medication', 'Went for a short walk'],
      'submitted'
    );
    
    RAISE NOTICE 'Sample timesheet created successfully!';
  END IF;
END $$;

-- ============================================
-- 6. VERIFY SETUP
-- ============================================

-- Check if table was created
SELECT 
  'Timesheets table created' AS status,
  COUNT(*) AS sample_records
FROM public.timesheets;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'timesheets'
ORDER BY ordinal_position;

-- ============================================
-- DONE!
-- ============================================

COMMENT ON TABLE public.timesheets IS 'Tracks caregiver work hours and job completion';
COMMENT ON COLUMN public.timesheets.check_in_time IS 'When caregiver starts work/arrives at office';
COMMENT ON COLUMN public.timesheets.check_out_time IS 'When caregiver completes work/leaves';
COMMENT ON COLUMN public.timesheets.total_hours IS 'Automatically calculated hours worked';
COMMENT ON COLUMN public.timesheets.status IS 'Workflow: checked-in -> checked-out -> submitted -> approved/rejected';
