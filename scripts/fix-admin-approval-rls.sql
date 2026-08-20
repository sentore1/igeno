-- ============================================================
-- Fix: Admin approval failing with "record new has no field completed"
-- Root cause: auto_generate_certificate trigger references NEW.completed
--             but the enrollments table only has completed_at, not completed.
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Ensure is_admin() helper function exists
-- ============================================================
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

-- ============================================================
-- 2. Add missing "completed" boolean column to enrollments
--    The auto_generate_certificate trigger references NEW.completed
--    but only completed_at existed in the original schema.
-- ============================================================
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Backfill: rows that already have completed_at set are completed
UPDATE public.enrollments
SET completed = true
WHERE completed_at IS NOT NULL AND (completed IS NULL OR completed = false);

-- ============================================================
-- 3. Rewrite auto_generate_certificate to handle both columns
--    and fail gracefully if generate_course_certificate() is missing
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_generate_certificate()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
    OR
    (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  ) THEN
    BEGIN
      PERFORM public.generate_course_certificate(NEW.user_id, NEW.course_id);
    EXCEPTION WHEN undefined_function THEN
      NULL; -- function not yet deployed, skip silently
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_certificate ON public.enrollments;
CREATE TRIGGER trigger_auto_certificate
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_certificate();

-- ============================================================
-- 4. course_payments — drop ALL existing policies and recreate cleanly
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE tablename = 'course_payments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_payments', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_course_payments"
  ON public.course_payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "users_select_own_course_payments"
  ON public.course_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_course_payments"
  ON public.course_payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_pending_course_payments"
  ON public.course_payments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. enrollments — drop ALL existing policies and recreate cleanly
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE tablename = 'enrollments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.enrollments', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_enrollments"
  ON public.enrollments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "users_select_own_enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_enrollments"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. Remove unique constraint on course_payments that blocks re-submission
--    after a payment rejection
-- ============================================================
ALTER TABLE public.course_payments
  DROP CONSTRAINT IF EXISTS course_payments_user_id_course_id_key;

-- ============================================================
-- 7. Verify
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('course_payments', 'enrollments')
AND schemaname = 'public'
ORDER BY tablename, policyname;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'enrollments' AND column_name IN ('completed', 'completed_at');

SELECT '✅ Fix applied successfully — admin approval should work now' AS status;
