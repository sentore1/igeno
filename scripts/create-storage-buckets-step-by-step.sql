-- Create Storage Buckets for Course Images and Payment Proofs
-- Run each section separately to avoid deadlocks
-- Copy and paste one section at a time into Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE BUCKETS (Run this first)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']::text[];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-payments',
  'course-payments',
  true,
  10485760,
  ARRAY[
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
    'application/pdf'
  ]::text[];

-- Verify buckets created
SELECT id, name, public FROM storage.buckets WHERE id IN ('course-images', 'course-payments');

-- ============================================
-- STEP 2: DROP OLD POLICIES (Run this second)
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own payment proofs" ON storage.objects;

-- ============================================
-- STEP 3: CREATE COURSE-IMAGES POLICIES (Run this third)
-- ============================================

CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-images');

CREATE POLICY "Users can update course images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images');

CREATE POLICY "Users can delete course images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images');

-- ============================================
-- STEP 4: CREATE PAYMENT POLICIES (Run this fourth)
-- ============================================

CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-payments');

CREATE POLICY "Users can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-payments');

CREATE POLICY "Users can update own payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-payments');

CREATE POLICY "Users can delete own payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-payments');

-- ============================================
-- STEP 5: VERIFY SETUP (Run this last)
-- ============================================

-- Check buckets
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets
WHERE id IN ('course-images', 'course-payments');

-- Check policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname LIKE '%course%' OR policyname LIKE '%payment%')
ORDER BY policyname;

SELECT '✅ Storage setup complete!' as status;
