-- Create course_announcements table
CREATE TABLE IF NOT EXISTS course_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;

-- Admins and trainers can manage announcements
CREATE POLICY "Admins and trainers manage announcements" ON course_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

-- Enrolled students can read announcements
CREATE POLICY "Enrolled students read announcements" ON course_announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = course_announcements.course_id
      AND enrollments.user_id = auth.uid()
    )
  );
