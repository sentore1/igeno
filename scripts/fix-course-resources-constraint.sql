-- Fix course_resources resource_type constraint to include 'image'
-- and ensure course-files storage bucket exists

-- Step 1: Drop the old constraint
ALTER TABLE public.course_resources
  DROP CONSTRAINT IF EXISTS course_resources_resource_type_check;

-- Step 2: Add updated constraint that includes 'image'
ALTER TABLE public.course_resources
  ADD CONSTRAINT course_resources_resource_type_check
  CHECK (resource_type IN ('pdf', 'video', 'link', 'document', 'image', 'other'));

-- Step 3: Ensure the course-files storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 4: Storage policies (skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view course files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view course files"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'course-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload course files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload course files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'course-files');
  END IF;
END $$;
