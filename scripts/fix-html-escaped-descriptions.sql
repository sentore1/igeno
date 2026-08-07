-- Fix HTML-escaped course descriptions
-- This happens when HTML is double-encoded in the database

-- Check if there are HTML-escaped descriptions
SELECT 
  id,
  title,
  LEFT(description, 100) as description_preview,
  CASE 
    WHEN description LIKE '%&lt;%' OR description LIKE '%&gt;%' OR description LIKE '%&nbsp;%' 
    THEN 'ESCAPED' 
    ELSE 'OK' 
  END as status
FROM courses
WHERE description IS NOT NULL;

-- If you see ESCAPED status, the descriptions need to be decoded
-- Unfortunately PostgreSQL doesn't have a built-in HTML decode function
-- You'll need to either:
-- 1. Re-save the courses through the admin interface (recommended)
-- 2. Manually fix them in the database
-- 3. Use a custom function

-- Quick test: Update one course to plain HTML to verify rendering works
-- UPDATE courses 
-- SET description = '<p>This is <strong>bold</strong> text and <em>italic</em> text.</p>'
-- WHERE id = 'YOUR-COURSE-ID';

SELECT '⚠️ HTML entities detected in descriptions. Please re-save courses through admin interface.' AS recommendation
WHERE EXISTS (
  SELECT 1 FROM courses 
  WHERE description LIKE '%&lt;%' OR description LIKE '%&gt;%' OR description LIKE '%&nbsp;%'
);
