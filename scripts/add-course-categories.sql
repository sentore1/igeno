-- Migration: Add course_categories table for dynamic category management
-- Run this in your Supabase SQL editor

-- 1. Create the course_categories table
CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#7C3AED',  -- default purple
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- 3. Everyone (including anonymous) can read active categories
CREATE POLICY "Anyone can view active categories" ON public.course_categories
  FOR SELECT
  USING (is_active = TRUE);

-- 4. Only admins can insert/update/delete categories
CREATE POLICY "Admins can manage categories" ON public.course_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Seed the 6 existing hardcoded categories (preserving exact names so existing courses match)
INSERT INTO public.course_categories (name, description, order_index) VALUES
  ('Caregiver Training',   'Foundational training for professional caregivers',            1),
  ('Nursing Skills',       'Clinical nursing techniques and best practices',               2),
  ('Health & Safety',      'Workplace safety, infection control, and emergency response',  3),
  ('Communication',        'Effective communication with patients, families, and teams',   4),
  ('Career Development',   'Professional growth, certifications, and career planning',     5),
  ('Specialized Care',     'Advanced care for specific conditions and patient groups',     6)
ON CONFLICT (name) DO NOTHING;

-- 6. Add an updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_course_categories_updated_at ON public.course_categories;
CREATE TRIGGER set_course_categories_updated_at
  BEFORE UPDATE ON public.course_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
