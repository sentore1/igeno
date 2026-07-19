# Fix: Profile Error - "Profile error details: {}"

## Problem

After signing in, the dashboard shows an error: "Profile error details: {}" and the page doesn't load properly.

## Root Cause

This happens when:
1. A user exists in `auth.users` but has no corresponding record in `public.profiles`
2. The automatic profile creation trigger wasn't installed or isn't working
3. Users were created before the trigger was set up

## Quick Fix (3 Options)

### Option 1: Run the Fix Script (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `scripts/fix-missing-profiles.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. This will:
   - Show which users are missing profiles
   - Create profiles for all users who need them
   - Set up the trigger to prevent future issues

### Option 2: Automatic Client-Side Fix (Already Implemented)

The dashboard now automatically tries to create missing profiles:
1. Try signing in again
2. The dashboard will detect the missing profile
3. It will attempt to create one automatically
4. If successful, the page will load normally

### Option 3: Manual Profile Creation

If you need to create a profile for a specific user:

```sql
-- Replace with actual user details
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'user-uuid-here',  -- Get from auth.users
  'user@example.com',
  'User Name',
  'client'  -- or 'admin', 'caregiver', 'student', etc.
);
```

## Complete Solution

### Step 1: Check Which Users Need Profiles

Run this in **Supabase SQL Editor**:

```sql
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Has Profile'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Step 2: Create Missing Profiles

```sql
-- Creates profiles for all users who don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'client')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Set Up Automatic Profile Creation

```sql
-- Create or update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 4: Verify Everything Works

```sql
-- This should show 0 users without profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
```

## Testing

### Test Existing Users
1. Sign out
2. Sign in with an existing account
3. Dashboard should load successfully ✅

### Test New Users
1. Create a new account
2. Confirm email (if required)
3. Sign in
4. Dashboard should load with profile automatically created ✅

## What Changed

### Before (Broken)
- Users created in `auth.users`
- No profile created in `public.profiles`
- Dashboard fails to load with empty error

### After (Fixed)
- Users created in `auth.users`
- Trigger automatically creates profile in `public.profiles`
- Dashboard loads successfully
- If profile missing, dashboard attempts to create it

## Dashboard Improvements

The dashboard now:
1. ✅ Detects missing profiles
2. ✅ Attempts to create them automatically
3. ✅ Shows helpful error messages
4. ✅ Provides instructions if automatic creation fails

## Common Issues & Solutions

### Issue: "PGRST116" error or status 406
**Meaning**: Profile not found for this user

**Solution**: 
- Run `scripts/fix-missing-profiles.sql`
- Or sign in again (dashboard will try to create profile)

### Issue: Trigger not working
**Check**:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Fix**: Re-run Step 3 above to recreate the trigger

### Issue: RLS policy blocking profile creation
**Check**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Fix**: Make sure INSERT policy allows authenticated users:
```sql
CREATE POLICY "Enable insert during signup" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id 
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );
```

### Issue: All profiles have role 'client' but should be different
**Fix**: Update roles manually:
```sql
UPDATE public.profiles
SET role = 'admin'  -- or 'caregiver', 'trainer', etc.
WHERE email = 'user@example.com';

-- Also update metadata for consistency
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'user@example.com';
```

## Prevention

To prevent this issue in the future:

1. ✅ Keep the trigger installed (already done)
2. ✅ Use the fixed signup flow (already done)
3. ✅ Dashboard auto-creates missing profiles (already done)
4. Regular monitoring:
   ```sql
   -- Run weekly to check for issues
   SELECT COUNT(*) as users_without_profiles
   FROM auth.users u
   LEFT JOIN public.profiles p ON u.id = p.id
   WHERE p.id IS NULL;
   ```

## Files Changed

1. ✅ `scripts/fix-missing-profiles.sql` - New fix script
2. ✅ `app/dashboard/page.tsx` - Added automatic profile creation
3. ✅ `FIX_MISSING_PROFILE_ERROR.md` - This documentation

## Related Documentation

- `FIX_SIGNUP_RLS_ERROR.md` - Fix for signup RLS errors
- `FIX_EMAIL_CONFIRMATION.md` - Fix for email confirmation issues
- `scripts/verify-email-confirmation.sql` - Verify user status
- `scripts/fix-signup-rls.sql` - Setup automatic profile creation

## Complete Verification Script

Run this to check everything:

```sql
-- Comprehensive system check
SELECT 
  'Total Users' as check_item,
  COUNT(*)::text as result
FROM auth.users

UNION ALL

SELECT 
  'Users with Profiles',
  COUNT(p.id)::text
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id

UNION ALL

SELECT 
  'Users WITHOUT Profiles',
  (COUNT(*) - COUNT(p.id))::text
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id

UNION ALL

SELECT 
  'Trigger Exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ Yes' ELSE '❌ No' END

UNION ALL

SELECT 
  'RLS Enabled on Profiles',
  CASE WHEN relrowsecurity THEN '✅ Yes' ELSE '❌ No' END
FROM pg_class
WHERE relname = 'profiles';
```

Expected output:
```
Total Users: 5
Users with Profiles: 5
Users WITHOUT Profiles: 0
Trigger Exists: ✅ Yes
RLS Enabled on Profiles: ✅ Yes
```

## Summary

✅ Run `scripts/fix-missing-profiles.sql` in Supabase  
✅ Sign in to test  
✅ Dashboard should now load properly  
✅ Future users will have profiles created automatically  

If you still have issues, check the browser console for detailed error messages and verify the trigger exists in Supabase.
