-- Fix Enrollments Table - Add Missing Timestamp Columns
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD TIMESTAMP COLUMNS TO ENROLLMENTS
-- ============================================

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added created_at column to enrollments table';
  ELSE
    RAISE NOTICE 'created_at column already exists in enrollments table';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added updated_at column to enrollments table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in enrollments table';
  END IF;
END $$;

-- ============================================
-- 2. CREATE TRIGGER TO AUTO-UPDATE updated_at
-- ============================================

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;

-- Create trigger
CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. BACKFILL EXISTING RECORDS (if any)
-- ============================================

-- Set created_at for existing records that have NULL
UPDATE public.enrollments 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Set updated_at for existing records that have NULL
UPDATE public.enrollments 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- ============================================
-- 4. VERIFY STRUCTURE
-- ============================================

-- Show enrollments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Enrollments table timestamp columns added successfully!';
  RAISE NOTICE '✓ Auto-update trigger created for updated_at column';
  RAISE NOTICE '✓ Existing records backfilled with timestamps';
END $$;
