-- Fix courses table RLS to allow anonymous users to view published courses
-- Run ONLY this script in your Supabase SQL Editor

-- Step 1: Drop and recreate the main viewing policy
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;

CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT
  TO public  -- This allows both authenticated and anonymous users
  USING (is_published = true);

-- Step 2: Drop and recreate the instructor view policy
DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;

CREATE POLICY "Instructors can view own courses" ON public.courses
  FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid() OR public.is_admin());

-- Step 3: Drop and recreate instructor management policies
DROP POLICY IF EXISTS "Instructors can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.courses;

CREATE POLICY "Instructors can insert own courses" ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update own courses" ON public.courses
  FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own courses" ON public.courses
  FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Step 4: Drop and recreate admin policy
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Verify the policies
SELECT 
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY policyname;
