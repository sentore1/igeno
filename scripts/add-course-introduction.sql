-- Add introduction field to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS introduction TEXT;

-- Update existing courses with a default introduction if needed
UPDATE public.courses
SET introduction = 'Welcome to this course!'
WHERE introduction IS NULL;

COMMENT ON COLUMN public.courses.introduction IS 'Brief introduction or overview of the course shown to students before enrollment';
