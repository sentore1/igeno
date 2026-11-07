-- Certificate Codes Table
-- Run this in your Supabase SQL editor.
-- Stores manually-issued certificate verification codes (e.g. "agc-001").

CREATE TABLE IF NOT EXISTS public.certificate_codes (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT        NOT NULL UNIQUE,        -- e.g. "agc-001"
  holder_name   TEXT        NOT NULL,               -- certificate recipient name
  course_title  TEXT        NOT NULL,               -- course / certification name
  issued_date   DATE        NOT NULL,
  notes         TEXT,                               -- optional admin notes
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,  -- set false to revoke
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificate_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything (read, insert, update, delete)
CREATE POLICY "Admins full access on certificate_codes"
  ON public.certificate_codes
  FOR ALL
  TO authenticated
  USING   (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anyone (including unauthenticated visitors) can read active codes for public verification
CREATE POLICY "Public read active certificate_codes"
  ON public.certificate_codes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);
