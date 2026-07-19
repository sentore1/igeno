-- Enhanced Course Structure with Resources and Quizzes Support
-- This script adds additional fields and tables for better course management

-- Add new columns to courses table for richer content
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS prerequisites TEXT,
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[];

-- Create course_resources table (separate from lesson resources)
CREATE TABLE IF NOT EXISTS public.course_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'video', 'link', 'document', 'other')),
  resource_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  is_downloadable BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_quizzes table (course-level quizzes, separate from lesson quizzes)
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit_minutes INTEGER, -- NULL means no time limit
  max_attempts INTEGER DEFAULT 3,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table for course quizzes
CREATE TABLE IF NOT EXISTS public.course_quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  time_taken_minutes INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_type ON public.course_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_course_quizzes_course_id ON public.course_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_quiz_attempts_user ON public.course_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_course_quiz_attempts_quiz ON public.course_quiz_attempts(quiz_id);

-- Enable RLS on new tables
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_resources
CREATE POLICY "Anyone can view published course resources" ON public.course_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_resources.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Admins can manage all course resources" ON public.course_resources
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Instructors can manage their course resources" ON public.course_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_resources.course_id 
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_resources.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for course_quizzes
CREATE POLICY "Anyone can view published course quizzes" ON public.course_quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_quizzes.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Admins can manage all course quizzes" ON public.course_quizzes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- RLS Policies for course_quiz_attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.course_quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON public.course_quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON public.course_quiz_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Create storage bucket for course files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course files
CREATE POLICY "Anyone can view course files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-files');

CREATE POLICY "Users can update their uploaded files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their uploaded files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Comment on tables
COMMENT ON TABLE public.course_resources IS 'Resources attached to courses (PDFs, videos, links, etc.)';
COMMENT ON TABLE public.course_quizzes IS 'Quizzes associated with courses for assessment';
COMMENT ON TABLE public.course_quiz_attempts IS 'Student attempts at course quizzes';
