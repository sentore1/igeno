-- Diagnostic script to check lesson quiz access
-- Run this as the logged-in user to see what's happening

-- 1. Check if quizzes exist in the database
SELECT 
  q.id,
  q.title,
  q.lesson_id,
  l.title as lesson_title,
  l.course_id,
  c.title as course_title
FROM public.quizzes q
JOIN public.lessons l ON q.lesson_id = l.id
JOIN public.courses c ON l.course_id = c.id
WHERE c.id = '6311d115-93b4-432d-96b2-027b780e9eb2'
ORDER BY l.order_index, q.order_index;

-- 2. Check RLS policies on quizzes table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'quizzes';

-- 3. Check if current user is enrolled in the course
SELECT 
  e.id,
  e.user_id,
  e.course_id,
  e.enrolled_at,
  c.title as course_title,
  c.is_published
FROM public.enrollments e
JOIN public.courses c ON e.course_id = c.id
WHERE e.user_id = auth.uid()
AND e.course_id = '6311d115-93b4-432d-96b2-027b780e9eb2';

-- 4. Test the RLS condition manually
SELECT 
  q.id,
  q.title,
  q.lesson_id,
  -- Check each condition in the RLS policy
  (c.is_published = true) as "course_is_published",
  (c.instructor_id = auth.uid()) as "user_is_instructor",
  (e.user_id = auth.uid()) as "user_is_enrolled",
  public.is_admin() as "user_is_admin",
  -- Overall result
  (
    c.is_published = true
    OR c.instructor_id = auth.uid()
    OR e.user_id = auth.uid()
    OR public.is_admin()
  ) as "should_have_access"
FROM public.quizzes q
JOIN public.lessons l ON q.lesson_id = l.id
JOIN public.courses c ON l.course_id = c.id
LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
WHERE c.id = '6311d115-93b4-432d-96b2-027b780e9eb2';

-- 5. Check what the browser query would return (simulate the frontend query)
SELECT * FROM public.quizzes 
WHERE lesson_id IN (
  SELECT id FROM public.lessons 
  WHERE course_id = '6311d115-93b4-432d-96b2-027b780e9eb2'
)
ORDER BY order_index;
