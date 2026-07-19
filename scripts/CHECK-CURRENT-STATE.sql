-- ============================================
-- DIAGNOSTIC: Check current state before fixing
-- ============================================
-- Run this to see what's wrong - NO CHANGES will be made

-- ============================================
-- 1. Check profiles table structure
-- ============================================
SELECT '=== PROFILES TABLE COLUMNS ===' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- ============================================
-- 2. Check admin users
-- ============================================
SELECT '=== ADMIN USERS ===' as section;
SELECT 
  id,
  email,
  role,
  created_at
FROM public.profiles
WHERE role = 'admin';

-- ============================================
-- 3. Check caregivers and their users
-- ============================================
SELECT '=== CAREGIVERS ===' as section;
SELECT 
  cg.id as caregiver_id,
  cg.full_name as caregiver_name,
  cg.user_id,
  p.email as user_email,
  p.role as user_role
FROM public.caregivers cg
LEFT JOIN public.profiles p ON cg.user_id = p.id
ORDER BY cg.full_name;

-- ============================================
-- 4. Check clients
-- ============================================
SELECT '=== CLIENTS ===' as section;
SELECT 
  c.id as client_id,
  c.full_name as client_name,
  c.user_id,
  p.email as user_email,
  p.role as user_role
FROM public.clients c
LEFT JOIN public.profiles p ON c.user_id = p.id
ORDER BY c.full_name;

-- ============================================
-- 5. Check bookings with full details
-- ============================================
SELECT '=== BOOKINGS ===' as section;
SELECT 
  b.id as booking_id,
  b.service_type,
  b.scheduled_date,
  b.status,
  c.full_name as client_name,
  c.id as client_id,
  cg.full_name as caregiver_name,
  cg.id as caregiver_id
FROM public.bookings b
LEFT JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.caregivers cg ON b.caregiver_id = cg.id
ORDER BY b.scheduled_date DESC;

-- ============================================
-- 6. Check RLS status
-- ============================================
SELECT '=== RLS STATUS ===' as section;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('bookings', 'clients', 'caregivers', 'profiles')
ORDER BY tablename;

-- ============================================
-- 7. Check current BOOKINGS policies
-- ============================================
SELECT '=== BOOKINGS POLICIES ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN LENGTH(qual::text) > 100 THEN LEFT(qual::text, 100) || '...'
    ELSE qual::text
  END as using_clause
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- ============================================
-- 8. Check current CLIENTS policies
-- ============================================
SELECT '=== CLIENTS POLICIES ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN LENGTH(qual::text) > 100 THEN LEFT(qual::text, 100) || '...'
    ELSE qual::text
  END as using_clause
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- ============================================
-- 9. Test what a specific admin should see (abdousentore)
-- ============================================
SELECT '=== TEST: What admin abdousentore should see ===' as section;
SELECT 
  p.email as admin_email,
  p.role,
  COUNT(b.id) as total_bookings
FROM public.profiles p
LEFT JOIN public.bookings b ON true
WHERE p.email LIKE '%abdousentore%'
GROUP BY p.email, p.role;

-- ============================================
-- 10. Test what caregiver "intore" should see
-- ============================================
SELECT '=== TEST: What caregiver intore should see ===' as section;
SELECT 
  cg.full_name as caregiver,
  b.service_type,
  b.scheduled_date,
  b.status,
  c.full_name as client_name
FROM public.caregivers cg
LEFT JOIN public.bookings b ON b.caregiver_id = cg.id
LEFT JOIN public.clients c ON b.client_id = c.id
WHERE cg.full_name = 'intore'
ORDER BY b.scheduled_date;

-- ============================================
-- SUMMARY
-- ============================================
SELECT '=== SUMMARY ===' as section;
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM public.caregivers) as caregiver_count,
  (SELECT COUNT(*) FROM public.clients) as client_count,
  (SELECT COUNT(*) FROM public.bookings) as booking_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'bookings') as bookings_policy_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'clients') as clients_policy_count;
