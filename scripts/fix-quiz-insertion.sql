-- ============================================
-- FIX QUIZ INSERTION ISSUES
-- ============================================
-- This script fixes issues with adding quizzes to lessons and courses

-- ============================================
-- STEP 1: Check current user role and admin status
-- ============================================

-- Check who you are
SELECT 
  auth.uid() as your_user_id,
  p.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' THEN 'You are an admin'
    WHEN p.role = 'trainer' THEN 'You are a trainer'
    ELSE 'You are a regular user'
  END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- ============================================
-- STEP 2: Check if is_admin() function works
-- ============================================

-- Test the is_admin function
SELECT 
  public.is_admin() as am_i_admin,
  CASE 
    WHEN public.is_admin() THEN 'Admin function works ✓'
    ELSE 'Admin function returns FALSE - you may have permission issues'
  END as result;

-- ============================================
-- STEP 3: Check course instructor assignment
-- ============================================

-- Check if courses have instructor_id set
SELECT 
  id,
  title,
  instructor_id,
  CASE 
    WHEN instructor_id IS NULL THEN '❌ NO INSTRUCTOR SET'
    WHEN instructor_id = auth.uid() THEN '✓ You are the instructor'
    ELSE 'Different instructor'
  END as instructor_status
FROM public.courses
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 4: Set yourself as instructor for all courses (if admin)
-- ============================================

-- Uncomment and run this if you're an admin and want to be the instructor of all courses
-- UPDATE public.courses 
-- SET instructor_id = auth.uid()
-- WHERE instructor_id IS NULL;

-- ============================================
-- STEP 5: Drop and recreate RLS policies for quizzes table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Instructors can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can manage all quizzes" ON public.quizzes;

-- Create new policies with proper admin support

-- SELECT policy - Anyone can view quizzes from published courses
CREATE POLICY "Enrolled users can view quizzes" ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all
    public.is_admin()
    OR
    -- Trainers can see all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    -- Course participants can see quizzes from their courses
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = quizzes.lesson_id
      AND (
        e.user_id = auth.uid()
        OR c.instructor_id = auth.uid()
        OR c.is_published = true
      )
    )
  );

-- INSERT policy - Admins and instructors can add quizzes
CREATE POLICY "Instructors can insert quizzes" ON public.quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admins can insert anywhere
    public.is_admin()
    OR
    -- Trainers can insert anywhere
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    -- Course instructors can insert into their lessons
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Instructors can update quizzes" ON public.quizzes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "Instructors can delete quizzes" ON public.quizzes
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = quizzes.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

-- ============================================
-- STEP 6: Update course_quizzes policies (already exist but let's ensure)
-- ============================================

-- Drop existing
DROP POLICY IF EXISTS "Anyone can view published course quizzes" ON public.course_quizzes;
DROP POLICY IF EXISTS "Admins can manage all course quizzes" ON public.course_quizzes;
DROP POLICY IF EXISTS "Instructors can manage their course quizzes" ON public.course_quizzes;

-- Recreate with trainer support
CREATE POLICY "Anyone can view published course quizzes" ON public.course_quizzes
  FOR SELECT
  USING (
    -- Admins and trainers can see all
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
    OR
    -- Anyone can see published course quizzes
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_quizzes.course_id 
      AND courses.is_published = true
    )
    OR
    -- Enrolled students can see
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE enrollments.course_id = course_quizzes.course_id 
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all course quizzes" ON public.course_quizzes
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
  )
  WITH CHECK (
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
  );

CREATE POLICY "Instructors can manage their course quizzes" ON public.course_quizzes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_quizzes.course_id 
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_quizzes.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- ============================================
-- STEP 7: Verify policies are in place
-- ============================================

SELECT 
  'quizzes' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'quizzes'
ORDER BY policyname;

SELECT 
  'course_quizzes' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'course_quizzes'
ORDER BY policyname;

-- ============================================
-- STEP 8: Test quiz insertion manually
-- ============================================

-- Test inserting a quiz to a lesson (replace the UUIDs)
-- Uncomment and update the IDs below:

/*
INSERT INTO public.quizzes (
  lesson_id,
  title,
  questions,
  passing_score
) VALUES (
  'YOUR_LESSON_ID_HERE', -- Replace with actual lesson ID
  'Test Quiz',
  '[{"question": "Test question?", "options": ["A", "B", "C"], "correct_answer": "A"}]'::jsonb,
  70
);
*/

-- ============================================
-- TROUBLESHOOTING SUMMARY
-- ============================================

-- If quizzes still don't insert:
-- 1. Check Step 1 output - verify your role is 'admin' or 'trainer'
-- 2. Check Step 2 output - verify is_admin() returns TRUE
-- 3. Check Step 3 output - verify courses have instructor_id set
-- 4. If not, run the UPDATE in Step 4 to set yourself as instructor
-- 5. Check browser console for detailed error messages
-- 6. Verify the lesson_id exists before inserting

SELECT 'Script completed! Check the outputs above for any issues.' as status;
