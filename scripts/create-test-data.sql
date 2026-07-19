-- Create Test Data for Division A Testing
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE TEST USERS (if they don't exist)
-- ============================================

-- Note: You'll need to create these users through the Supabase Auth interface first
-- Then run this script to create their profiles and related data

-- For this test, we'll create sample data that you can link to your existing users
-- Or you can sign up manually and then run the relevant INSERT statements

-- ============================================
-- 2. CREATE SAMPLE CAREGIVERS
-- ============================================

-- Insert sample caregivers (without user_id for now - admin will create these)
INSERT INTO public.caregivers (full_name, email, phone, specialization, rating, availability)
VALUES 
  ('Jane Smith', 'jane.smith@caregivers.com', '+1 (555) 101-2020', 'Elderly Care', 4.8, '[]'),
  ('Michael Johnson', 'mike.j@caregivers.com', '+1 (555) 102-3030', 'Dementia Care', 4.9, '[]'),
  ('Sarah Williams', 'sarah.w@caregivers.com', '+1 (555) 103-4040', 'Disability Support', 5.0, '[]'),
  ('David Brown', 'david.b@caregivers.com', '+1 (555) 104-5050', 'Post-Surgery Care', 4.7, '[]'),
  ('Emily Davis', 'emily.d@caregivers.com', '+1 (555) 105-6060', 'Palliative Care', 4.9, '[]')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE SAMPLE CLIENTS
-- ============================================

-- Insert sample clients (without user_id for now)
INSERT INTO public.clients (full_name, email, phone, address, emergency_contact)
VALUES 
  ('Robert Miller', 'robert.m@clients.com', '+1 (555) 201-3030', '123 Oak Street, Springfield', 'Mary Miller +1 (555) 201-3031'),
  ('Patricia Garcia', 'patricia.g@clients.com', '+1 (555) 202-4040', '456 Maple Avenue, Riverside', 'John Garcia +1 (555) 202-4041'),
  ('Linda Martinez', 'linda.m@clients.com', '+1 (555) 203-5050', '789 Pine Road, Lakewood', 'Carlos Martinez +1 (555) 203-5051'),
  ('James Rodriguez', 'james.r@clients.com', '+1 (555) 204-6060', '321 Elm Street, Hillside', 'Maria Rodriguez +1 (555) 204-6061')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. CREATE SAMPLE BOOKINGS
-- ============================================

-- Get the first client and caregiver IDs for test bookings
DO $$
DECLARE
  client1_id UUID;
  client2_id UUID;
  client3_id UUID;
  caregiver1_id UUID;
  caregiver2_id UUID;
BEGIN
  -- Get client IDs
  SELECT id INTO client1_id FROM public.clients WHERE email = 'robert.m@clients.com' LIMIT 1;
  SELECT id INTO client2_id FROM public.clients WHERE email = 'patricia.g@clients.com' LIMIT 1;
  SELECT id INTO client3_id FROM public.clients WHERE email = 'linda.m@clients.com' LIMIT 1;
  
  -- Get caregiver IDs
  SELECT id INTO caregiver1_id FROM public.caregivers WHERE email = 'jane.smith@caregivers.com' LIMIT 1;
  SELECT id INTO caregiver2_id FROM public.caregivers WHERE email = 'sarah.w@caregivers.com' LIMIT 1;
  
  -- Insert bookings
  -- 1. Pending booking (no caregiver assigned)
  INSERT INTO public.bookings (client_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client1_id,
    'Personal Care',
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    120,
    'pending',
    'Client needs assistance with mobility. Prefer experienced caregiver.'
  );
  
  -- 2. Another pending booking
  INSERT INTO public.bookings (client_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client2_id,
    'Medical Care',
    CURRENT_DATE + INTERVAL '3 days',
    '10:00:00',
    180,
    'pending',
    'Post-surgery care required. Must be gentle with arm movement.'
  );
  
  -- 3. Confirmed booking (caregiver already assigned)
  INSERT INTO public.bookings (client_id, caregiver_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client3_id,
    caregiver1_id,
    'Companion Care',
    CURRENT_DATE + INTERVAL '1 day',
    '15:00:00',
    60,
    'confirmed',
    'Social visit and light conversation needed.'
  );
  
  -- 4. Today's booking (for caregiver dashboard testing)
  INSERT INTO public.bookings (client_id, caregiver_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client1_id,
    caregiver1_id,
    'Housekeeping',
    CURRENT_DATE,
    '09:00:00',
    120,
    'confirmed',
    'Light housekeeping and meal preparation.'
  );
  
  -- 5. Completed booking (for history)
  INSERT INTO public.bookings (client_id, caregiver_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client2_id,
    caregiver2_id,
    'Personal Care',
    CURRENT_DATE - INTERVAL '2 days',
    '11:00:00',
    90,
    'completed',
    'Daily personal care routine.'
  );
  
  -- 6. In-progress booking
  INSERT INTO public.bookings (client_id, caregiver_id, service_type, scheduled_date, scheduled_time, duration, status, notes)
  VALUES (
    client3_id,
    caregiver2_id,
    'Transportation',
    CURRENT_DATE,
    '13:00:00',
    60,
    'in-progress',
    'Transport to medical appointment.'
  );
  
  RAISE NOTICE 'Test bookings created successfully!';
END $$;

-- ============================================
-- 5. CREATE SAMPLE COURSES
-- ============================================

-- Get admin user ID for instructor_id
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to get an admin user (replace with actual admin email if known)
  SELECT id INTO admin_id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM auth.users LIMIT 1;
  END IF;
  
  -- Insert 8 sample courses
  INSERT INTO public.courses (
    title, 
    description, 
    category, 
    instructor_id, 
    duration_hours, 
    price, 
    level,
    is_published
  )
  VALUES 
    (
      'Basic Elderly Care',
      'Learn fundamental skills for providing compassionate care to elderly patients, including personal hygiene, mobility assistance, and basic health monitoring.',
      'Elderly Care',
      admin_id,
      12,
      299.00,
      'beginner',
      true
    ),
    (
      'Advanced Dementia Care',
      'Specialized training in caring for patients with dementia, Alzheimer''s, and other cognitive impairments. Learn communication techniques and behavioral management.',
      'Dementia Care',
      admin_id,
      20,
      499.00,
      'advanced',
      true
    ),
    (
      'First Aid & Emergency Response',
      'Essential first aid skills for caregivers including CPR, wound care, choking response, and emergency protocols.',
      'Medical Care',
      admin_id,
      8,
      199.00,
      'beginner',
      true
    ),
    (
      'Medication Management',
      'Proper techniques for medication administration, documentation, and monitoring side effects. Includes safety protocols and legal requirements.',
      'Medical Care',
      admin_id,
      15,
      399.00,
      'intermediate',
      true
    ),
    (
      'Disability Support Services',
      'Comprehensive training for supporting individuals with physical and intellectual disabilities. Learn about assistive devices and inclusive care practices.',
      'Disability Support',
      admin_id,
      18,
      449.00,
      'intermediate',
      true
    ),
    (
      'Palliative & End-of-Life Care',
      'Sensitive training in providing comfort care for terminally ill patients. Learn pain management, emotional support, and family communication.',
      'Palliative Care',
      admin_id,
      16,
      429.00,
      'advanced',
      true
    ),
    (
      'Mental Health First Aid',
      'Recognize and respond to mental health crises, anxiety, depression, and emotional distress in care recipients. Build empathetic communication skills.',
      'Mental Health',
      admin_id,
      10,
      249.00,
      'beginner',
      true
    ),
    (
      'Professional Caregiver Certification',
      'Complete certification program covering all aspects of professional caregiving. Includes practical assessments and recognized certification.',
      'Certification',
      admin_id,
      40,
      899.00,
      'intermediate',
      true
    )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Test courses created successfully!';
END $$;

-- ============================================
-- 6. VERIFY DATA CREATION
-- ============================================

-- Check caregivers
SELECT 'Caregivers Created:' as info, COUNT(*) as count FROM public.caregivers;

-- Check clients
SELECT 'Clients Created:' as info, COUNT(*) as count FROM public.clients;

-- Check bookings
SELECT 'Bookings Created:' as info, COUNT(*) as count FROM public.bookings;

-- Check courses
SELECT 'Courses Created:' as info, COUNT(*) as count FROM public.courses WHERE is_published = true;

-- Show sample bookings
SELECT 
  b.id,
  b.service_type,
  b.scheduled_date,
  b.scheduled_time,
  b.status,
  c.full_name as client_name,
  cg.full_name as caregiver_name
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.caregivers cg ON b.caregiver_id = cg.id
ORDER BY b.scheduled_date DESC, b.scheduled_time DESC
LIMIT 10;

-- Show sample courses
SELECT 
  title,
  category,
  duration_hours,
  price,
  level,
  is_published
FROM public.courses
ORDER BY created_at DESC;

-- ============================================
-- DONE!
-- ============================================

-- You can now test:
-- 1. Admin can see all bookings at /dashboard/admin/bookings
-- 2. Admin can assign caregivers to pending bookings
-- 3. Caregivers can see their assigned bookings at /dashboard/caregiver
-- 4. Today's bookings show up in caregiver dashboard
-- 5. Homepage shows 8 published courses to all visitors (even not logged in)
-- 6. Courses are visible in the Academy section
