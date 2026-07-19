-- Diagnostic script to identify why caregivers see "Unknown Client"
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Check if bookings have client_id populated
-- ============================================
SELECT 
  b.id as booking_id,
  b.service_type,
  b.scheduled_date,
  b.client_id,
  b.caregiver_id,
  b.status
FROM public.bookings b
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 2: Check if clients exist and have proper data
-- ============================================
SELECT 
  c.id as client_id,
  c.user_id,
  c.full_name,
  c.email,
  p.email as profile_email
FROM public.clients c
LEFT JOIN public.profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 3: Check bookings with client and caregiver info
-- ============================================
SELECT 
  b.id as booking_id,
  b.service_type,
  b.scheduled_date,
  b.status,
  c.full_name as client_name,
  c.email as client_email,
  cg.full_name as caregiver_name,
  p.email as caregiver_email
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.caregivers cg ON b.caregiver_id = cg.id
LEFT JOIN public.profiles p ON cg.user_id = p.id
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 4: Check RLS policies on clients table
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- ============================================
-- STEP 5: Check if RLS is enabled on clients table
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'clients';
