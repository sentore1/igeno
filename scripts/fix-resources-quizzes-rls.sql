-- ============================================
-- FIX RLS POLICIES FOR RESOURCES AND QUIZZES
-- ============================================
-- This script fixes the Row-Level Security policies for resources and quizzes tables
-- to allow admins and course instructors to add resources and quizzes to lessons

-- ============================================
-- STEP 1: Drop all existing policies for resources and quizzes
-- ============================================

-- Resources table
DROP POLICY IF EXISTS "Enrolled users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can update resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can delete resources" ON public.resources;

-- Quizzes table
DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can manage all quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can delete quizzes" ON public.quizzes;

-- ============================================
-- STEP 2: Create NEW policies for RESOURCES table
-- ============================================

-- Allow enrolled users to view resources (for learning)
CREATE POLICY "Enrolled users can view resources" ON public.resources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = resources.lesson_id
      AND (
        -- Enrolled students
        e.user_id = auth.uid() 
        -- Course instructor
        OR c.instructor_id = auth.uid() 
        -- Published courses (anyone can preview)
        OR c.is_published = true
        -- Admins
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to INSERT resources to their lessons
CREATE POLICY "Instructors can insert resources" ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to UPDATE their lesson resources
CREATE POLICY "Instructors can update resources" ON public.resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to DELETE their lesson resources
CREATE POLICY "Instructors can delete resources" ON public.resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- ============================================
-- STEP 3: Create NEW policies for QUIZZES table
-- ============================================

-- Allow enrolled users to view quizzes
CREATE POLICY "Enrolled users can view quizzes" ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = quizzes.lesson_id
      AND (
        -- Enrolled students
        e.user_id = auth.uid()
        -- Course instructor
        OR c.instructor_id = auth.uid()
        -- Published courses
        OR c.is_published = true
        -- Admins
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to INSERT quizzes to their lessons
CREATE POLICY "Instructors can insert quizzes" ON public.quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to UPDATE their lesson quizzes
CREATE POLICY "Instructors can update quizzes" ON public.quizzes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Allow course instructors to DELETE their lesson quizzes
CREATE POLICY "Instructors can delete quizzes" ON public.quizzes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (
        c.instructor_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- ============================================
-- STEP 4: Verify policies are created
-- ============================================

-- Check resources policies
SELECT 
  'resources' as table_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- Check quizzes policies
SELECT 
  'quizzes' as table_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'quizzes'
ORDER BY policyname;

-- ============================================
-- VERIFICATION: Count policies per table
-- ============================================

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('resources', 'quizzes')
GROUP BY tablename;

-- Expected results:
-- resources: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- quizzes: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- ============================================
-- TROUBLESHOOTING TIPS
-- ============================================

-- If you still get errors after running this script:
-- 1. Make sure you're logged in as an admin or the course instructor
-- 2. Check that the course has an instructor_id set:
--    SELECT id, title, instructor_id FROM courses WHERE id = 'YOUR_COURSE_ID';
-- 3. Verify the is_admin() function exists and works:
--    SELECT public.is_admin();
-- 4. Check that RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('resources', 'quizzes');
