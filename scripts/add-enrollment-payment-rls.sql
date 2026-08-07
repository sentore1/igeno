-- Add RLS Policies for Course Enrollments and Payments Admin Access
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ENABLE RLS ON TABLES (if not already enabled)
-- ============================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Admin full access to enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;

DROP POLICY IF EXISTS "Admin full access to course_payments" ON public.course_payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.course_payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.course_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.course_payments;

-- ============================================
-- 3. ENROLLMENTS TABLE POLICIES
-- ============================================

-- Admin can do everything with enrollments
CREATE POLICY "Admin full access to enrollments"
ON public.enrollments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own enrollments
CREATE POLICY "Users can create their own enrollments"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollments (for progress tracking)
CREATE POLICY "Users can update their own enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 4. COURSE_PAYMENTS TABLE POLICIES
-- ============================================

-- Admin can do everything with course payments
CREATE POLICY "Admin full access to course_payments"
ON public.course_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.course_payments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own payments
CREATE POLICY "Users can create their own payments"
ON public.course_payments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own payments (in case they need to resubmit)
CREATE POLICY "Users can update their own payments"
ON public.course_payments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. VERIFY POLICIES
-- ============================================

-- Check enrollments policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'enrollments'
ORDER BY policyname;

-- Check course_payments policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'course_payments'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Enrollment and payment RLS policies created successfully!';
  RAISE NOTICE 'Admins can now view and manage all enrollments and payments.';
  RAISE NOTICE 'Users can view and manage their own enrollments and payments.';
END $$;
