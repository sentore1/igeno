# Lesson Quiz Troubleshooting Guide

## Problem
Lesson quizzes are not displaying on the learning page, even though they exist in the database and show in the admin panel.

## Debugging Steps

### 1. Check Browser Console
1. Open http://localhost:3000/academy/courses/6311d115-93b4-432d-96b2-027b780e9eb2/learn
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for these logs:
   - "Lesson Resources: [...]"
   - "Lesson Quizzes: [...]"
   - "Lesson Quizzes Error: [...]"

### 2. Check Debug Display
The page now shows a yellow debug box that displays:
- The count of lesson quizzes
- The raw quiz data (or empty array)

### 3. Run Database Diagnostic
Run the diagnostic SQL script in Supabase SQL Editor:
```bash
# File: scripts/diagnose-lesson-quiz-access.sql
```

This will check:
- If quizzes exist in the database
- Current RLS policies
- If the user is enrolled
- If the RLS conditions are met

### 4. Restart Development Server
Sometimes Next.js doesn't pick up code changes immediately:
```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Clear Browser Cache
Hard refresh the page:
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

## Expected Debug Output

### If Working Correctly:
```
Console:
Lesson Resources: []
Lesson Quizzes: [{id: "...", title: "gerg", lesson_id: "...", ...}]
Lesson Quizzes Error: null

Page Debug Box:
DEBUG - lessonQuizzes count: 1
[
  {
    "id": "...",
    "title": "gerg",
    "lesson_id": "...",
    "questions": [...],
    ...
  }
]
```

### If RLS is Blocking:
```
Console:
Lesson Quizzes: null
Lesson Quizzes Error: {message: "...", details: "...", hint: "...", code: "42501"}

Page Debug Box:
DEBUG - lessonQuizzes count: 0
[]
```

### If No Quizzes in Database:
```
Console:
Lesson Quizzes: []
Lesson Quizzes Error: null

Page Debug Box:
DEBUG - lessonQuizzes count: 0
[]
```

## Possible Causes and Solutions

### Cause 1: RLS Policy Blocking Access
**Symptoms:** Error in console, empty array in debug box

**Solution:** The user needs to be enrolled in the course. Check enrollments table:
```sql
SELECT * FROM enrollments 
WHERE user_id = auth.uid() 
AND course_id = '6311d115-93b4-432d-96b2-027b780e9eb2';
```

If no enrollment exists, enroll the user:
```sql
INSERT INTO enrollments (user_id, course_id, enrolled_at)
VALUES (auth.uid(), '6311d115-93b4-432d-96b2-027b780e9eb2', NOW());
```

### Cause 2: Code Not Reloaded
**Symptoms:** No debug box visible, no console logs

**Solution:** Restart the dev server and hard refresh the browser

### Cause 3: Wrong lesson_id in Database
**Symptoms:** Empty array with no error

**Solution:** Check if the quiz's lesson_id matches the actual lesson:
```sql
SELECT 
  q.id as quiz_id,
  q.title as quiz_title,
  q.lesson_id as quiz_lesson_id,
  l.id as lesson_id,
  l.title as lesson_title
FROM quizzes q
FULL OUTER JOIN lessons l ON q.lesson_id = l.id
WHERE l.course_id = '6311d115-93b4-432d-96b2-027b780e9eb2'
OR q.id IN (SELECT id FROM quizzes WHERE lesson_id IN (
  SELECT id FROM lessons WHERE course_id = '6311d115-93b4-432d-96b2-027b780e9eb2'
));
```

### Cause 4: Supabase Client Issue
**Symptoms:** Resources load but quizzes don't

**Solution:** Check if there's a difference in how the tables are accessed. Try querying directly from Supabase dashboard.

## Next Steps

After checking the debug output and console logs, report back with:
1. What appears in the browser console
2. What appears in the debug box
3. Results from the diagnostic SQL script

This will help identify the exact cause of the issue.

## Cleanup

Once the issue is resolved, remove the debug code:
1. Remove the console.log statements from the useEffect
2. Remove the yellow debug box from the UI
