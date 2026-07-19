-- ============================================
-- MAKE CURRENT USER AN ADMIN
-- ============================================
-- Run this script in Supabase SQL Editor to give yourself admin access
-- This will allow you to manage all courses, resources, and quizzes

-- Check your current role
SELECT 
  id,
  email,
  role,
  full_name,
  CASE 
    WHEN role = 'admin' THEN '✅ You are already an admin!'
    WHEN role = 'trainer' THEN '⚠️ You are a trainer, upgrading to admin...'
    WHEN role = 'caregiver' THEN '⚠️ You are a caregiver, upgrading to admin...'
    WHEN role = 'client' THEN '⚠️ You are a client, upgrading to admin...'
    ELSE '⚠️ No role set, setting to admin...'
  END as status
FROM profiles 
WHERE id = auth.uid();

-- Make yourself an admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Verify the change
SELECT 
  id,
  email,
  role,
  full_name,
  '✅ You are now an admin!' as status
FROM profiles 
WHERE id = auth.uid();

-- ============================================
-- OPTIONAL: Make all courses belong to you
-- ============================================
-- Uncomment the lines below if you want to become the instructor for all courses

-- UPDATE courses 
-- SET instructor_id = auth.uid()
-- WHERE instructor_id IS NULL;

-- SELECT 
--   COUNT(*) as courses_updated,
--   '✅ You are now the instructor for all courses without an instructor!' as status
-- FROM courses
-- WHERE instructor_id = auth.uid();

-- ============================================
-- NEXT STEPS
-- ============================================
-- Now run: scripts/fix-all-course-rls.sql
-- This will set up all the necessary permissions for managing courses
