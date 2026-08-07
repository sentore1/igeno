-- Add Course Payment, Quiz Attempts Limit, Certificates, and Featured Images
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD FEATURED IMAGE TO COURSES
-- ============================================

-- Add featured_image_url column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

COMMENT ON COLUMN public.courses.featured_image_url IS 'Featured image URL for the course display';

-- ============================================
-- 2. ADD COURSE PRICE AND PAYMENT REQUIREMENT
-- ============================================

-- Add payment-related columns to courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.courses.price IS 'Course price (0 if free)';
COMMENT ON COLUMN public.courses.is_free IS 'Whether the course is free';
COMMENT ON COLUMN public.courses.requires_payment IS 'Whether payment is required before access';

-- ============================================
-- 3. CREATE COURSE_PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.course_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('momo', 'bank', 'card')),
  payment_proof_url TEXT,
  phone_number TEXT,
  transaction_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_payments_user ON public.course_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_course ON public.course_payments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_status ON public.course_payments(status);

COMMENT ON TABLE public.course_payments IS 'Payment records for course enrollments';

-- ============================================
-- 4. UPDATE ENROLLMENTS TABLE
-- ============================================

-- Add payment status to enrollments
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_required' 
  CHECK (payment_status IN ('not_required', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.course_payments(id),
ADD COLUMN IF NOT EXISTS can_access BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.enrollments.payment_status IS 'Payment approval status for paid courses';
COMMENT ON COLUMN public.enrollments.can_access IS 'Whether user can access course content';

-- ============================================
-- 5. ADD MAX ATTEMPTS TO QUIZZES
-- ============================================

-- Add max_attempts column to quizzes (lesson-based quizzes)
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 2;

COMMENT ON COLUMN public.quizzes.max_attempts IS 'Maximum number of attempts allowed (default 2)';

-- Add max_attempts column to course_quizzes (course-level quizzes)
ALTER TABLE public.course_quizzes 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 2;

COMMENT ON COLUMN public.course_quizzes.max_attempts IS 'Maximum number of attempts allowed (default 2)';

-- Add answers column to quiz_attempts if not exists
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS answers JSONB;

-- Add answers column to course_quiz_attempts if not exists
ALTER TABLE public.course_quiz_attempts 
ADD COLUMN IF NOT EXISTS answers JSONB;

-- ============================================
-- 6. ENHANCE CERTIFICATES TABLE
-- ============================================

-- Add more details to certificates
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS course_title TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS final_score NUMERIC(5,2);

COMMENT ON COLUMN public.certificates.student_name IS 'Full name of the student on certificate';
COMMENT ON COLUMN public.certificates.course_title IS 'Title of the completed course';
COMMENT ON COLUMN public.certificates.completion_date IS 'Date when course was completed';
COMMENT ON COLUMN public.certificates.certificate_number IS 'Unique certificate identifier';
COMMENT ON COLUMN public.certificates.final_score IS 'Final average score in the course';

-- Create function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_code TEXT;
  random_code TEXT;
BEGIN
  year_code := TO_CHAR(NOW(), 'YY');
  random_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN 'CERT-' || year_code || '-' || random_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RLS POLICIES FOR COURSE_PAYMENTS
-- ============================================

ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment records
CREATE POLICY "Users can view own course payments" ON public.course_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own payment records
CREATE POLICY "Users can create course payments" ON public.course_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending payments (to add proof)
CREATE POLICY "Users can update own pending payments" ON public.course_payments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all course payments" ON public.course_payments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can approve/reject payments
CREATE POLICY "Admins can update course payments" ON public.course_payments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- 8. FUNCTION TO CHECK QUIZ ATTEMPTS
-- ============================================

-- Function to check if user can attempt a quiz
CREATE OR REPLACE FUNCTION can_attempt_quiz(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_attempts INTEGER;
  v_current_attempts INTEGER;
BEGIN
  -- Get max attempts allowed
  SELECT COALESCE(max_attempts, 2) INTO v_max_attempts
  FROM public.quizzes
  WHERE id = p_quiz_id;
  
  -- Count current attempts
  SELECT COUNT(*) INTO v_current_attempts
  FROM public.quiz_attempts
  WHERE quiz_id = p_quiz_id AND user_id = p_user_id;
  
  -- Return true if attempts are less than max
  RETURN v_current_attempts < v_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can attempt a course quiz
CREATE OR REPLACE FUNCTION can_attempt_course_quiz(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_attempts INTEGER;
  v_current_attempts INTEGER;
BEGIN
  -- Get max attempts allowed
  SELECT COALESCE(max_attempts, 2) INTO v_max_attempts
  FROM public.course_quizzes
  WHERE id = p_quiz_id;
  
  -- Count current attempts
  SELECT COUNT(*) INTO v_current_attempts
  FROM public.course_quiz_attempts
  WHERE quiz_id = p_quiz_id AND user_id = p_user_id;
  
  -- Return true if attempts are less than max
  RETURN v_current_attempts < v_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNCTION TO GENERATE CERTIFICATE
-- ============================================

CREATE OR REPLACE FUNCTION generate_course_certificate(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_certificate_id UUID;
  v_student_name TEXT;
  v_course_title TEXT;
  v_completion_date DATE;
  v_avg_score NUMERIC(5,2);
BEGIN
  -- Get student name
  SELECT full_name INTO v_student_name
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Get course title
  SELECT title INTO v_course_title
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Get completion date from enrollment
  SELECT completed_at::DATE INTO v_completion_date
  FROM public.enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id AND completed = true;
  
  -- Calculate average quiz score
  SELECT COALESCE(AVG(qa.score), 0) INTO v_avg_score
  FROM public.quiz_attempts qa
  JOIN public.quizzes q ON qa.quiz_id = q.id
  JOIN public.lessons l ON q.lesson_id = l.id
  WHERE l.course_id = p_course_id AND qa.user_id = p_user_id;
  
  -- Check if certificate already exists
  SELECT id INTO v_certificate_id
  FROM public.certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF v_certificate_id IS NULL THEN
    -- Create new certificate
    INSERT INTO public.certificates (
      user_id,
      course_id,
      student_name,
      course_title,
      completion_date,
      certificate_number,
      final_score,
      issued_at
    ) VALUES (
      p_user_id,
      p_course_id,
      v_student_name,
      v_course_title,
      v_completion_date,
      generate_certificate_number(),
      v_avg_score,
      NOW()
    ) RETURNING id INTO v_certificate_id;
  END IF;
  
  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. TRIGGER TO AUTO-GENERATE CERTIFICATE
-- ============================================

CREATE OR REPLACE FUNCTION auto_generate_certificate()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate certificate when enrollment is marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM generate_course_certificate(NEW.user_id, NEW.course_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_certificate ON public.enrollments;

CREATE TRIGGER trigger_auto_certificate
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_certificate();

-- ============================================
-- 11. UPDATE ENROLLMENT ACCESS ON PAYMENT APPROVAL
-- ============================================

CREATE OR REPLACE FUNCTION update_enrollment_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment is approved, update enrollment access
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.enrollments
    SET 
      payment_status = 'approved',
      can_access = true,
      payment_id = NEW.id
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;
  
  -- When payment is rejected, update enrollment
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE public.enrollments
    SET 
      payment_status = 'rejected',
      can_access = false,
      payment_id = NEW.id
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_enrollment_payment ON public.course_payments;

CREATE TRIGGER trigger_update_enrollment_payment
  AFTER UPDATE ON public.course_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_on_payment();

-- ============================================
-- 12. SAMPLE DATA UPDATES
-- ============================================

-- Update existing courses with featured images (using placeholder gradients)
UPDATE public.courses
SET featured_image_url = 'https://via.placeholder.com/800x400/9333ea/ffffff?text=' || REPLACE(title, ' ', '+')
WHERE featured_image_url IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check courses structure
SELECT 
  id, 
  title, 
  price, 
  is_free, 
  requires_payment,
  featured_image_url IS NOT NULL as has_image
FROM public.courses
LIMIT 5;

-- Check quizzes have max_attempts
SELECT id, title, max_attempts, passing_score
FROM public.quizzes
LIMIT 5;

-- Check if functions are created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'can_attempt_quiz', 
    'can_attempt_course_quiz',
    'generate_course_certificate',
    'generate_certificate_number'
  );

SELECT '✅ Course payment system, quiz attempts limit, certificates, and featured images setup complete!' AS status;
