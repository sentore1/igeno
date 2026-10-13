-- ============================================================
-- Add completed boolean column to enrollments table
-- This ensures the Submit Course functionality works properly
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add completed column if it doesn't exist
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Backfill: Mark enrollments with completed_at as completed
UPDATE public.enrollments
SET completed = true
WHERE completed_at IS NOT NULL AND (completed IS NULL OR completed = false);

-- Update existing completed enrollments to have status = 'completed'
UPDATE public.enrollments
SET status = 'completed'
WHERE completed_at IS NOT NULL AND status != 'completed';

-- Add comment for documentation
COMMENT ON COLUMN public.enrollments.completed IS 'Boolean flag indicating if the student has completed and submitted the course';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enrollments' AND column_name = 'completed';

SELECT '✅ Completed column added successfully to enrollments table' AS status;
