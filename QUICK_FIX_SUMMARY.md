# 🚀 Quick Fix Summary - RLS Errors

## 🔴 The Problem
You're getting these errors when managing courses:
- ❌ "Failed to add resource: new row violates row-level security policy"
- ❌ "Failed to add quiz: new row violates row-level security policy"

## ✅ The Solution

### Option 1: Comprehensive Fix (RECOMMENDED) ⭐

**Run this ONE script to fix everything:**

```
📁 scripts/fix-all-course-rls.sql
```

**What it fixes:**
- ✅ Courses table - Create, edit, delete courses
- ✅ Lessons table - Add, edit, delete lessons
- ✅ Resources table - Add, edit, delete resources
- ✅ Quizzes table - Add, edit, delete quizzes
- ✅ Quiz attempts - Students can take quizzes
- ✅ Enrollments - Students can enroll in courses

### Option 2: Quick Fix (Resources & Quizzes Only)

**If you only want to fix resources and quizzes:**

```
📁 scripts/fix-resources-quizzes-rls.sql
```

## 📋 How to Run the Script

1. Open **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content from the script file
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message

## 🎯 What Happens After Running the Script

### Admins Can:
- ✅ Create, edit, delete ANY course
- ✅ Add lessons to ANY course
- ✅ Add resources and quizzes to ANY lesson
- ✅ View all enrollments and quiz attempts

### Instructors (Trainers) Can:
- ✅ Create new courses
- ✅ Edit their OWN courses
- ✅ Add lessons to their courses
- ✅ Add resources and quizzes to their lessons
- ✅ View enrollments in their courses

### Students Can:
- ✅ View published courses
- ✅ Enroll in courses
- ✅ View lessons, resources, and quizzes
- ✅ Take quizzes
- ✅ View their own enrollment progress

## 🔍 Verify It's Working

After running the script, test these actions:

1. **Go to**: Dashboard → Admin → Courses
2. **Edit a course** → Go to Lessons tab
3. **Try adding**:
   - ✅ A new lesson
   - ✅ A resource to a lesson
   - ✅ A quiz to a lesson

All should work without errors! 🎉

## 🆘 Still Having Issues?

### Check 1: Verify Your Role

```sql
-- Run this in Supabase SQL Editor
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

Your role should be `admin` or `trainer`.

**If not, make yourself admin:**
```sql
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

### Check 2: Verify Course Has Instructor

```sql
-- Check the course (replace COURSE_ID)
SELECT id, title, instructor_id FROM courses WHERE id = 'COURSE_ID';
```

**If instructor_id is NULL, set it:**
```sql
-- Make yourself the instructor
UPDATE courses SET instructor_id = auth.uid() WHERE id = 'COURSE_ID';
```

### Check 3: Verify Policies Exist

```sql
-- Count policies
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE tablename IN ('resources', 'quizzes')
GROUP BY tablename;
```

You should see:
- `resources`: 4 policies
- `quizzes`: 4 policies

## 📚 Related Documentation

- 📄 `FIX_RESOURCES_QUIZZES_ERROR.md` - Detailed troubleshooting guide
- 📄 `scripts/fix-all-course-rls.sql` - Comprehensive fix (recommended)
- 📄 `scripts/fix-resources-quizzes-rls.sql` - Resources & quizzes only
- 📄 `ADMIN_FEATURES_SUMMARY.md` - Overview of admin features

## 🤝 Need Help?

If the error persists:
1. Check Supabase logs for detailed error messages
2. Verify you're logged in with the correct user
3. Try running the comprehensive fix script instead of the quick fix
4. Contact support with the exact error message

---

**Last Updated**: Now
**Status**: Ready to use ✅
