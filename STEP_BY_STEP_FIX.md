#  Step-by-Step Fix Guide

## Your Error
```
❌ Failed to add resource: new row violates row-level security policy for table "resources"
❌ Failed to add quiz: new row violates row-level security policy for table "quizzes"
```

## The Fix (5 Minutes)

### Step 1️⃣: Make Yourself an Admin

1. Open **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy this file content: `scripts/make-me-admin.sql`
6. Paste and click **Run**
7. ✅ You should see: "You are now an admin!"

### Step 2️⃣: Fix All RLS Policies

1. Still in **SQL Editor**, click **New Query** again
2. Copy this file content: `scripts/fix-all-course-rls.sql`
3. Paste and click **Run**
4. ✅ Wait for "Success. No rows returned"
5. ✅ Scroll down to see policy counts

Expected output:
```
tablename     | policy_count
--------------+-------------
courses       | 4
enrollments   | 3
lessons       | 4
quiz_attempts | 2
quizzes       | 4
resources     | 4
```

### Step 3️⃣: Test It Works

1. Go to your app: **Dashboard → Admin → Courses**
2. Click **Edit** on any course
3. Click **Lessons** tab
4. Click **Add Lesson** button
5. Fill in the form and save
6. Click **Add Resource** on the lesson
7. Fill in the form and click **Add Resource**
8. ✅ Should save without errors!
9. Click **Add Quiz** on the lesson
10. Fill in the form and click **Add Quiz**
11. ✅ Should save without errors!

## 🎉 Success!

You should now be able to:
- ✅ Add resources to lessons
- ✅ Add quizzes to lessons
- ✅ Edit courses
- ✅ Manage all content

## 🆘 Still Not Working?

### Problem: "is_admin() function does not exist"

**Solution:**
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

### Problem: "Course has no instructor_id"

**Solution:**
```sql
-- Find courses without instructor
SELECT id, title FROM courses WHERE instructor_id IS NULL;

-- Assign yourself as instructor (replace COURSE_ID)
UPDATE courses SET instructor_id = auth.uid() WHERE id = 'COURSE_ID';

-- Or assign yourself to ALL courses
UPDATE courses SET instructor_id = auth.uid() WHERE instructor_id IS NULL;
```

### Problem: "Still getting RLS error"

**Solution: Temporarily disable RLS (NOT RECOMMENDED FOR PRODUCTION)**
```sql
-- ONLY FOR TESTING - DO NOT USE IN PRODUCTION
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;

-- Test your app now - it should work

-- RE-ENABLE after testing:
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Then run fix-all-course-rls.sql again
```

## 📊 Verify Everything

Run this to check your setup:

```sql
-- 1. Check your role
SELECT email, role FROM profiles WHERE id = auth.uid();
-- Expected: role = 'admin'

-- 2. Check policies exist
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE tablename IN ('resources', 'quizzes', 'courses', 'lessons')
GROUP BY tablename;
-- Expected: resources=4, quizzes=4, courses=4, lessons=4

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('resources', 'quizzes', 'courses', 'lessons')
AND schemaname = 'public';
-- Expected: rowsecurity = true for all

-- 4. Test is_admin() function
SELECT public.is_admin() as am_i_admin;
-- Expected: true
```

## 🎯 What Each Script Does

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `make-me-admin.sql` | Makes you an admin | First time setup |
| `fix-all-course-rls.sql` | Fixes ALL course policies | **USE THIS** |
| `fix-resources-quizzes-rls.sql` | Fixes only resources & quizzes | If you only have this issue |

## 📚 More Help

- Read: `QUICK_FIX_SUMMARY.md` for overview
- Read: `FIX_RESOURCES_QUIZZES_ERROR.md` for detailed troubleshooting
- Check: Supabase logs for specific errors

---

**Need more help?** Check the Supabase logs or create a support ticket with:
1. Your role (from Step 1)
2. Policy count (from Step 2)
3. Exact error message from browser console
