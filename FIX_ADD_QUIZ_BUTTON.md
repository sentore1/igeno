# Fix "Add Quiz" Button Not Working

## Problem
The "Add Quiz" button next to lessons (green button) opens the quiz builder but doesn't actually save the quiz to the database.

## What Was Fixed

### 1. **Code Changes**
Updated `/app/dashboard/admin/courses/[id]/page.tsx`:

**Before:**
```typescript
const addQuiz = async (questions: any[], title: string, passingScore: number) => {
  const { error } = await supabase.from('quizzes').insert({
    lesson_id: selectedLesson,
    title: title,
    questions: questions,  // ❌ Wrong format
    passing_score: passingScore,
  });
  // ❌ No reload
}
```

**After:**
```typescript
const addQuiz = async (questions: any[], title: string, passingScore: number) => {
  // ✅ Transform questions to match database format
  const formattedQuestions = questions.map(q => ({
    question: q.question,
    options: q.options,
    correct_answer: q.options[q.correct] // Store actual answer text
  }));

  const { error } = await supabase.from('quizzes').insert({
    lesson_id: selectedLesson,
    title: title,
    questions: formattedQuestions,  // ✅ Correct format
    passing_score: passingScore,
  });

  if (error) {
    alert(`Failed to add quiz: ${error.message}`);
    console.error('Quiz error:', error);  // ✅ Better debugging
  } else {
    alert('Quiz added successfully!');
    setShowAddQuiz(false);
    loadCourse(); // ✅ Reload to show updated data
  }
}
```

### 2. **Database RLS Policies**
Created `fix-quiz-insertion.sql` script to ensure proper Row Level Security policies.

## How to Fix

### Step 1: Run the SQL Script
Open your Supabase SQL Editor and run:
```bash
scripts/fix-quiz-insertion.sql
```

This will:
- Check your admin status
- Verify is_admin() function works
- Fix RLS policies for `quizzes` table
- Fix RLS policies for `course_quizzes` table
- Add support for 'trainer' role

### Step 2: Check the Script Output
The script will show you:
1. **Your user role** - Should be 'admin' or 'trainer'
2. **Admin function status** - Should return TRUE
3. **Course instructor** - Check if courses have instructor_id set

### Step 3: Set Instructor ID (if needed)
If Step 2 shows courses with "NO INSTRUCTOR SET", run this in SQL Editor:

```sql
UPDATE public.courses 
SET instructor_id = auth.uid()
WHERE instructor_id IS NULL;
```

This sets YOU as the instructor for all courses without one.

### Step 4: Test the Fix
1. Go to: `/dashboard/admin/courses/[course-id]`
2. Click **Lessons** tab
3. Click green **"Add Quiz"** button next to a lesson
4. Fill in quiz details and questions
5. Click **"Create Quiz"**
6. Check browser console (F12) for any errors
7. Quiz should save successfully

## Common Issues & Solutions

### Issue 1: "Permission denied for table quizzes"
**Cause:** RLS policies not properly set or you're not an admin
**Solution:** 
1. Run `fix-quiz-insertion.sql` script
2. Verify your role: `SELECT role FROM profiles WHERE id = auth.uid();`
3. Should be 'admin' or 'trainer'

### Issue 2: "Failed to add quiz: instructor_id is null"
**Cause:** Course doesn't have an instructor assigned
**Solution:** Run the UPDATE query in Step 3 above

### Issue 3: Quiz builder opens but nothing happens when clicking "Create Quiz"
**Cause:** JavaScript error or network issue
**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Check Network tab for failed requests
4. Share the error message for further help

### Issue 4: "is_admin() function does not exist"
**Cause:** is_admin() helper function not created
**Solution:** Run this in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Checklist

- [ ] Run fix-quiz-insertion.sql script
- [ ] Verify you're an admin (role = 'admin')
- [ ] Verify is_admin() returns TRUE
- [ ] Set instructor_id for courses (if needed)
- [ ] Click "Add Quiz" button next to a lesson
- [ ] Quiz builder opens
- [ ] Fill in quiz details
- [ ] Click "Create Quiz"
- [ ] Success message appears
- [ ] Quiz appears in lessons tab
- [ ] No errors in browser console

## Expected Behavior After Fix

### Lessons Tab - "Add Quiz" Button:
1. ✅ Click green "Add Quiz" button
2. ✅ Quiz builder modal opens
3. ✅ Fill in title, passing score, and questions
4. ✅ Click "Create Quiz"
5. ✅ "Quiz added successfully!" alert appears
6. ✅ Modal closes
7. ✅ Page reloads showing updated lesson data
8. ✅ Quiz is saved to `quizzes` table (lesson-specific)

### Quizzes Tab - "Add Quiz" Button:
1. ✅ Click green "Add Quiz" button
2. ✅ Quiz builder modal opens
3. ✅ Fill in details
4. ✅ Click "Create Quiz"
5. ✅ Success message appears
6. ✅ Quiz appears in Quizzes (1) tab
7. ✅ Quiz is saved to `course_quizzes` table (course-wide)

## Debugging Tips

### Check if quiz was saved:
```sql
-- Check lesson quizzes
SELECT id, title, lesson_id, created_at 
FROM public.quizzes 
ORDER BY created_at DESC 
LIMIT 5;

-- Check course quizzes
SELECT id, title, course_id, created_at 
FROM public.course_quizzes 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check RLS policies:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('quizzes', 'course_quizzes');
```

## Summary

The issue was:
1. ❌ Quiz questions weren't being transformed to the correct format
2. ❌ Page wasn't reloading after quiz creation
3. ❌ RLS policies might not allow admin insertion
4. ❌ Courses might not have instructor_id set

All fixed! ✅
