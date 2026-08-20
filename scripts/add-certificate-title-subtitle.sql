-- Add certificate title and subtitle fields to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS certificate_title TEXT,
  ADD COLUMN IF NOT EXISTS certificate_subtitle TEXT;
