# Fix Resources & Quizzes RLS Error

## Problem
When trying to add resources or quizzes to lessons, you're getting this error:
```
Failed to add resource: new row violates row-level security policy for table "resources"
Failed to add quiz: new row violates row-level security policy for table "quizzes"
```

This happens because the Row-Level Security (RLS) policies on the `resources` and `quizzes` tables don't allow INSERT operations for your user role.

## Quick Fix (Recommended)

### Step 1: Run the Comprehensive Fix Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `scripts/fix-all-course-rls.sql`
4. Copy **ALL** the content and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This comprehensive script will fix ALL course-related RLS policies in one go!

### Alternative: Run Just Resources & Quizzes Fix

If you prefer to fix only resources and quizzes:

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `scripts/fix-resources-quizzes-rls.sql`
4. Copy all the content and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This will:
- Drop old conflicting policies
- Create new policies that allow:
  - **Admins** to manage all resources and quizzes
  - **Course instructors** to manage resources and quizzes in their own courses
  - **Enrolled students** to view resources and quizzes

### Step 2: Verify Your User Role

Make sure your user has the correct role:

```sql
-- Check your current user's role
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

Your role should be either:
- `admin` - Full access to all courses
- `trainer` - Access to manage your own courses

### Step 3: Verify Course Instructor

Make sure the course has an `instructor_id` set:

```sql
-- Check course instructor (replace YOUR_COURSE_ID with actual ID)
SELECT id, title, instructor_id, is_published 
FROM courses 
WHERE id = 'YOUR_COURSE_ID';
```

The `instructor_id` should match your user ID if you're a trainer, or it doesn't matter if you're an admin.

### Step 4: Test Adding Resources and Quizzes

After running the fix script:

1. Go to **Dashboard → Admin → Courses**
2. Edit a course
3. Go to the **Lessons** tab
4. Try adding a resource or quiz to a lesson

It should work now! 🎉

## What the Fix Does

### For Resources Table
- ✅ Allows course instructors to INSERT, UPDATE, DELETE resources
- ✅ Allows admins full access
- ✅ Allows enrolled students to VIEW resources

### For Quizzes Table
- ✅ Allows course instructors to INSERT, UPDATE, DELETE quizzes
- ✅ Allows admins full access
- ✅ Allows enrolled students to VIEW quizzes

## Common Issues and Solutions

### Issue 1: Still getting RLS error
**Cause**: You're not an admin or course instructor

**Solution**: 
```sql
-- Make yourself an admin
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

### Issue 2: Course has no instructor
**Cause**: The course's `instructor_id` is NULL

**Solution**:
```sql
-- Set yourself as the instructor (replace COURSE_ID)
UPDATE courses 
SET instructor_id = auth.uid() 
WHERE id = 'COURSE_ID';
```

### Issue 3: `is_admin()` function not found
**Cause**: The helper function doesn't exist

**Solution**: Run this to create it:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verification

After applying the fix, verify the policies exist:

```sql
-- Check resources policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'resources';

-- Check quizzes policies  
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'quizzes';
```

You should see 4 policies for each table:
- 1 SELECT policy (view)
- 1 INSERT policy (create)
- 1 UPDATE policy (edit)
- 1 DELETE policy (remove)

## Related Files
- `scripts/fix-resources-quizzes-rls.sql` - The main fix script
- `scripts/add-missing-rls-policies.sql` - Complete RLS policies for all tables
- `app/dashboard/admin/courses/[id]/page.tsx` - The course editor page

## Need More Help?

If you're still having issues:
1. Check the Supabase logs for more detailed errors
2. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('resources', 'quizzes');`
3. Test with a simpler policy: temporarily allow all authenticated users to insert
