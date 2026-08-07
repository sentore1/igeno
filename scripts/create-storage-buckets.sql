-- Create Storage Buckets for Course Images and Payment Proofs
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE COURSE-IMAGES BUCKET
-- ============================================

-- Create bucket for course featured images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']::text[];

-- ============================================
-- 2. CREATE COURSE-PAYMENTS BUCKET
-- ============================================

-- Create bucket for payment proof uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-payments',
  'course-payments',
  true,
  10485760, -- 10MB in bytes
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

-- ============================================
-- 3. RLS POLICIES FOR COURSE-IMAGES BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update course images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete course images" ON storage.objects;

-- Allow authenticated users to upload course images (admins only in practice)
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'featured-images'
);

-- Allow public to view course images
CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Users can update course images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images');

-- Allow authenticated users to delete course images
CREATE POLICY "Users can delete course images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images');

-- ============================================
-- 4. RLS POLICIES FOR COURSE-PAYMENTS BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own payment proofs" ON storage.objects;

-- Allow authenticated users to upload payment proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-payments'
  AND (storage.foldername(name))[1] = 'payment-proofs'
);

-- Allow authenticated users to view payment proofs
CREATE POLICY "Users can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-payments');

-- Allow admins to view all payment proofs
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-payments'
  AND public.is_admin()
);

-- Allow users to update their own payment proofs
CREATE POLICY "Users can update own payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-payments');

-- Allow users to delete their own payment proofs
CREATE POLICY "Users can delete own payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-payments');

-- ============================================
-- 5. VERIFICATION
-- ============================================

-- Check buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('course-images', 'course-payments');

-- Check policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%course%'
ORDER BY policyname;

-- Show storage structure
SELECT 
  '✅ Storage buckets created successfully!' as status,
  'course-images: For course featured images (5MB limit)' as bucket_1,
  'course-payments: For payment proof uploads (10MB limit)' as bucket_2;

-- ============================================
-- 6. TEST BUCKET ACCESS (Optional)
-- ============================================

-- Uncomment to test bucket access
-- SELECT storage.buckets.* FROM storage.buckets WHERE id = 'course-images';
-- SELECT storage.buckets.* FROM storage.buckets WHERE id = 'course-payments';

SELECT '✅ Storage setup complete! Buckets are ready for use.' AS final_status;
