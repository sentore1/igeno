-- ============================================
-- TEST RLS: Simulate what users actually see
-- ============================================

-- First, find the user IDs we need to test
SELECT '=== USER IDS ===' as section;
SELECT 
  'Admin:' as type,
  id as user_id,
  email
FROM public.profiles
WHERE email LIKE '%abdousentore%'
UNION ALL
SELECT 
  'Caregiver:' as type,
  p.id as user_id,
  p.email
FROM public.profiles p
INNER JOIN public.caregivers cg ON cg.user_id = p.id
WHERE cg.full_name = 'intore';

-- ============================================
-- TEST 1: What does admin see? (Run manually with admin's UUID)
-- ============================================
-- Replace 'ADMIN_USER_ID_HERE' with the actual UUID from above
-- 
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub TO 'ADMIN_USER_ID_HERE';
-- 
-- SELECT * FROM public.bookings;

-- ============================================
-- TEST 2: Check if policies are using correct syntax
-- ============================================
SELECT '=== BOOKINGS POLICIES DETAILS ===' as section;
SELECT 
  policyname,
  cmd,
  qual::text as using_clause_full,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- ============================================
-- TEST 3: Check if the subqueries work
-- ============================================

-- Get intore's user_id and caregiver_id
SELECT '=== INTORE IDS ===' as section;
SELECT 
  p.id as user_id,
  cg.id as caregiver_id,
  cg.full_name,
  p.email
FROM public.caregivers cg
INNER JOIN public.profiles p ON cg.user_id = p.id
WHERE cg.full_name = 'intore';

-- Test: What bookings have intore's caregiver_id?
SELECT '=== BOOKINGS WITH INTORE CAREGIVER_ID ===' as section;
SELECT 
  b.id,
  b.service_type,
  b.scheduled_date,
  b.caregiver_id,
  b.client_id
FROM public.bookings b
WHERE b.caregiver_id IN (
  SELECT id FROM public.caregivers WHERE full_name = 'intore'
);

-- ============================================
-- TEST 4: Browser cache issue check
-- ============================================
SELECT '=== CHECK IF DATA EXISTS ===' as section;
SELECT 
  'Total bookings:' as info,
  COUNT(*) as count
FROM public.bookings
UNION ALL
SELECT 
  'Bookings for intore:' as info,
  COUNT(*) as count
FROM public.bookings b
INNER JOIN public.caregivers cg ON b.caregiver_id = cg.id
WHERE cg.full_name = 'intore';

-- ============================================
-- INSTRUCTIONS TO FIX BROWSER CACHE
-- ============================================
/*
If policies look correct but frontend shows no data:

1. Clear browser cache completely (Ctrl+Shift+Delete)
2. Or use incognito/private browsing mode
3. Or hard refresh the page (Ctrl+F5)
4. Make sure you're logged out completely and log back in
5. Check browser console for errors (F12 → Console tab)

*/
