-- Sample Data Seeder for Care & Igeno Platform
-- Run this in Supabase SQL Editor AFTER running supabase-schema.sql
-- This adds sample courses for testing

-- Note: You need to create users through the signup form first
-- Then you can manually update the instructor_id values below

-- Sample Courses for Academy
INSERT INTO public.courses (title, description, category, duration_hours, is_published) VALUES
  (
    'Introduction to Caregiving',
    'Learn the fundamentals of providing quality care to clients. This comprehensive course covers basic caregiving principles, communication skills, and safety procedures.',
    'Caregiver Training',
    8,
    true
  ),
  (
    'Advanced Nursing Skills',
    'Master advanced nursing techniques including wound care, medication administration, and patient monitoring. Ideal for nurses looking to expand their skill set.',
    'Nursing Skills',
    12,
    true
  ),
  (
    'Health and Safety Essentials',
    'Critical health and safety training covering infection control, emergency response, and workplace safety. Required for all healthcare workers.',
    'Health & Safety',
    6,
    true
  ),
  (
    'Effective Communication in Healthcare',
    'Develop strong communication skills for interacting with patients, families, and healthcare teams. Learn active listening and conflict resolution.',
    'Communication',
    4,
    true
  ),
  (
    'Dementia Care Specialist',
    'Specialized training in caring for patients with dementia and Alzheimer''s disease. Covers behavioral management and person-centered care.',
    'Specialized Care',
    10,
    true
  ),
  (
    'Career Development for Healthcare Professionals',
    'Plan and advance your healthcare career. Topics include resume building, interview skills, and continuing education opportunities.',
    'Career Development',
    5,
    true
  ),
  (
    'Pediatric Care Fundamentals',
    'Learn to provide safe and effective care for children of all ages. Covers developmental stages, common illnesses, and family-centered care.',
    'Specialized Care',
    8,
    true
  ),
  (
    'Medication Management',
    'Comprehensive course on safe medication administration, storage, and documentation. Essential for caregivers and nurses.',
    'Nursing Skills',
    6,
    true
  ),
  (
    'End-of-Life Care',
    'Compassionate care for patients in their final stages. Covers pain management, emotional support, and family counseling.',
    'Specialized Care',
    8,
    true
  ),
  (
    'Physical Therapy Assistance',
    'Learn basic physical therapy techniques to help patients with mobility, strength building, and recovery exercises.',
    'Caregiver Training',
    10,
    true
  );

-- Note: To add lessons, resources, and quizzes to these courses:
-- 1. Get the course_id from the courses table
-- 2. Insert lessons with that course_id
-- 3. Add resources to lessons
-- 4. Create quizzes for lessons

-- Example for adding a lesson (replace {course_id} with actual UUID):
-- INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes) VALUES
-- ('{course_id}', 'Introduction to the Course', 'Welcome to the course! In this lesson...', 1, 15);

-- To add sample data for care services, you would need actual user IDs
-- Create users through the signup form first, then add clients/caregivers manually

COMMENT ON TABLE public.courses IS 'Sample courses have been added. Create users and add lessons manually.';
