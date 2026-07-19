-- ============================================
-- ADD MISSING RLS POLICIES FOR ALL TABLES
-- ============================================
-- Run this in your Supabase SQL Editor to add Row Level Security policies
-- for tables that have RLS enabled but no policies defined

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own client record" ON public.clients;
DROP POLICY IF EXISTS "Users can view own client record" ON public.clients;
DROP POLICY IF EXISTS "Users can update own client record" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

-- Allow users to create their own client record
CREATE POLICY "Users can insert own client record" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own client record
CREATE POLICY "Users can view own client record" ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own client record
CREATE POLICY "Users can update own client record" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all clients
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Caregivers can view clients they're assigned to (through bookings)
CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
      AND cg.user_id = auth.uid()
    )
  );

-- ============================================
-- CAREGIVERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can insert own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Users can view own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Users can update own caregiver record" ON public.caregivers;
DROP POLICY IF EXISTS "Admins can manage all caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Public can view caregiver profiles" ON public.caregivers;

-- Allow users to create their own caregiver record
CREATE POLICY "Users can insert own caregiver record" ON public.caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own caregiver record
CREATE POLICY "Users can view own caregiver record" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own caregiver record
CREATE POLICY "Users can update own caregiver record" ON public.caregivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all caregivers
CREATE POLICY "Admins can manage all caregivers" ON public.caregivers
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Anyone can view caregiver profiles (for booking purposes)
CREATE POLICY "Public can view caregiver profiles" ON public.caregivers
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Caregivers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Allow clients to create bookings
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
  );

-- Clients can view their own bookings
CREATE POLICY "Clients can view own bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
  );

-- Caregivers can view bookings assigned to them
CREATE POLICY "Caregivers can view their bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregivers
      WHERE id = bookings.caregiver_id
      AND user_id = auth.uid()
    )
  );

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = bookings.client_id
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.caregivers
      WHERE id = bookings.caregiver_id
      AND user_id = auth.uid()
    )
  );

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- COURSES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

-- Anyone (including anonymous users) can view published courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT
  TO public  -- Allows both authenticated and anonymous users
  USING (is_published = true);

-- Instructors can view their own unpublished courses
CREATE POLICY "Instructors can view own courses" ON public.courses
  FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid() OR public.is_admin());

-- Instructors can create their own courses
CREATE POLICY "Instructors can insert own courses" ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses" ON public.courses
  FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON public.courses
  FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Admins can manage all courses
CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ENROLLMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can enroll in courses" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;

-- Users can enroll themselves in courses
CREATE POLICY "Users can enroll in courses" ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can update their own enrollment progress
CREATE POLICY "Users can update own enrollments" ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage all enrollments" ON public.enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can create notifications (for system notifications)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- LESSONS, RESOURCES, QUIZZES, QUIZ_ATTEMPTS, CERTIFICATES, PAYMENTS
-- ============================================
-- These tables need policies based on course enrollment and ownership

-- Lessons: View if enrolled or course owner
DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.lessons;
CREATE POLICY "Enrolled users can view lessons" ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE c.id = lessons.course_id
      AND (
        c.instructor_id = auth.uid() 
        OR e.user_id = auth.uid() 
        OR c.is_published = true
        OR public.is_admin()
      )
    )
  );

-- Course instructors can manage lessons
DROP POLICY IF EXISTS "Instructors can manage course lessons" ON public.lessons;
CREATE POLICY "Instructors can manage course lessons" ON public.lessons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND instructor_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id
      AND instructor_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Resources: Similar to lessons
DROP POLICY IF EXISTS "Enrolled users can view resources" ON public.resources;
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
        c.instructor_id = auth.uid() 
        OR e.user_id = auth.uid() 
        OR public.is_admin()
      )
    )
  );

-- Quizzes
DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.quizzes;
CREATE POLICY "Enrolled users can view quizzes" ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE l.id = quizzes.lesson_id
      AND (e.user_id = auth.uid() OR c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

-- Quiz Attempts
DROP POLICY IF EXISTS "Users can create own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Users can create own quiz attempts" ON public.quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to see all tables and their policy counts
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
