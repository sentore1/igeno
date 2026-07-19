-- ============================================
-- COMPREHENSIVE FIX FOR ALL COURSE-RELATED RLS POLICIES
-- ============================================
-- This script fixes RLS policies for courses, lessons, resources, and quizzes
-- Run this if you're getting "violates row-level security policy" errors

-- ============================================
-- STEP 1: Ensure is_admin() function exists
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Fix COURSES table policies
-- ============================================

-- Drop ALL existing policies for courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

-- Public can view published courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT
  USING (is_published = true OR instructor_id = auth.uid() OR public.is_admin());

-- Instructors can create courses
CREATE POLICY "Instructors can insert courses" ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = auth.uid() OR public.is_admin());

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses" ON public.courses
  FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid() OR public.is_admin())
  WITH CHECK (instructor_id = auth.uid() OR public.is_admin());

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON public.courses
  FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid() OR public.is_admin());

-- ============================================
-- STEP 3: Fix LESSONS table policies
-- ============================================

-- Drop ALL existing policies for lessons
DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can manage course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can delete lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

-- Anyone can view lessons from published courses or their enrolled courses
CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE c.id = lessons.course_id
      AND (
        c.is_published = true
        OR c.instructor_id = auth.uid()
        OR e.user_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Instructors can create lessons for their courses
CREATE POLICY "Instructors can insert lessons" ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND (instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can update lessons in their courses
CREATE POLICY "Instructors can update lessons" ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND (instructor_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND (instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can delete lessons from their courses
CREATE POLICY "Instructors can delete lessons" ON public.lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND (instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- ============================================
-- STEP 4: Fix RESOURCES table policies
-- ============================================

-- Drop ALL existing policies for resources
DROP POLICY IF EXISTS "Enrolled users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can update resources" ON public.resources;
DROP POLICY IF EXISTS "Instructors can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;

-- Anyone can view resources from accessible lessons
CREATE POLICY "Anyone can view resources" ON public.resources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = resources.lesson_id
      AND (
        c.is_published = true
        OR c.instructor_id = auth.uid()
        OR e.user_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Instructors can add resources to their lesson
CREATE POLICY "Instructors can insert resources" ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can update resources in their lessons
CREATE POLICY "Instructors can update resources" ON public.resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can delete resources from their lessons
CREATE POLICY "Instructors can delete resources" ON public.resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = resources.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- ============================================
-- STEP 5: Fix QUIZZES table policies
-- ============================================

-- Drop ALL existing policies for quizzes
DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Anyone can view quizzes" ON public.quizzes;

-- Anyone can view quizzes from accessible lessons
CREATE POLICY "Anyone can view quizzes" ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = quizzes.lesson_id
      AND (
        c.is_published = true
        OR c.instructor_id = auth.uid()
        OR e.user_id = auth.uid()
        OR public.is_admin()
      )
    )
  );

-- Instructors can add quizzes to their lessons
CREATE POLICY "Instructors can insert quizzes" ON public.quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can update quizzes in their lessons
CREATE POLICY "Instructors can update quizzes" ON public.quizzes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Instructors can delete quizzes from their lessons
CREATE POLICY "Instructors can delete quizzes" ON public.quizzes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND (c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- ============================================
-- STEP 6: Fix QUIZ_ATTEMPTS table policies
-- ============================================

-- Drop ALL existing policies for quiz_attempts
DROP POLICY IF EXISTS "Users can create own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Instructors can view quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can view own attempts" ON public.quiz_attempts;

-- Users can create their own quiz attempts
CREATE POLICY "Users can insert quiz attempts" ON public.quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own quiz attempts
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON q.lesson_id = l.id
      JOIN public.courses c ON l.course_id = c.id
      WHERE q.id = quiz_attempts.quiz_id
      AND c.instructor_id = auth.uid()
    )
  );

-- ============================================
-- STEP 7: Fix ENROLLMENTS table policies
-- ============================================

-- Drop ALL existing policies for enrollments
DROP POLICY IF EXISTS "Users can enroll in courses" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll" ON public.enrollments;
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users update own enrollments" ON public.enrollments;

-- Users can enroll themselves
CREATE POLICY "Users can enroll" ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own enrollments
CREATE POLICY "Users view own enrollments" ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = enrollments.course_id
      AND instructor_id = auth.uid()
    )
  );

-- Users can update their enrollment progress
CREATE POLICY "Users update own enrollments" ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'lessons', 'resources', 'quizzes', 'quiz_attempts', 'enrollments')
GROUP BY tablename
ORDER BY tablename;

-- Expected results:
-- courses: 4 policies
-- lessons: 4 policies  
-- resources: 4 policies
-- quizzes: 4 policies
-- quiz_attempts: 2 policies
-- enrollments: 3 policies

-- Show all course-related policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'lessons', 'resources', 'quizzes', 'quiz_attempts', 'enrollments')
ORDER BY tablename, operation, policyname;
