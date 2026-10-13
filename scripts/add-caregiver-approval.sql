-- ============================================================
-- Add Caregiver Approval System
-- Caregivers must be approved by admin before they can enroll in courses
-- ============================================================

-- Add approval fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Auto-approve all non-caregiver roles
UPDATE public.profiles
SET is_approved = true
WHERE role != 'caregiver' AND (is_approved IS NULL OR is_approved = false);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.is_approved IS 'Whether the user (especially caregivers) is approved by admin';
COMMENT ON COLUMN public.profiles.approved_by IS 'Admin who approved/rejected this profile';
COMMENT ON COLUMN public.profiles.approved_at IS 'When the approval/rejection happened';
COMMENT ON COLUMN public.profiles.rejection_reason IS 'Reason for rejection (if applicable)';

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_approved = true OR role != 'caregiver')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-approve non-caregivers on profile creation
CREATE OR REPLACE FUNCTION public.auto_approve_non_caregivers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != 'caregiver' THEN
    NEW.is_approved := true;
  ELSE
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_approve_non_caregivers ON public.profiles;
CREATE TRIGGER trigger_auto_approve_non_caregivers
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_non_caregivers();

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('is_approved', 'approved_by', 'approved_at', 'rejection_reason')
ORDER BY ordinal_position;

SELECT '✅ Caregiver approval system added successfully' AS status;
