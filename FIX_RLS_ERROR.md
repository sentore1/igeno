# Fix: Infinite Recursion in Profiles RLS Policy

## Problem
You're getting an error: **"infinite recursion detected in policy for relation 'profiles'"**

This happens because the admin RLS policy was trying to check the `profiles` table while creating a policy FOR the `profiles` table, causing a circular reference.

## Solution

### Option 1: Run the Fix Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `scripts/fix-rls-policies.sql`
4. Copy its contents and paste into the SQL Editor
5. Click **Run**

### Option 2: Manual Fix via Dashboard

1. Go to **Authentication** → **Policies** in Supabase Dashboard
2. Find the `profiles` table
3. Delete the policy named "Admins can view all profiles"
4. Run the SQL from `scripts/fix-rls-policies.sql`

## What Changed

**Before (Broken):**
```sql
-- This caused infinite recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**After (Fixed):**
```sql
-- Helper function that checks auth metadata instead of profiles table
CREATE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin',
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy now uses the function (no circular reference)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());
```

## Testing

After applying the fix:

1. Go to your signup page
2. Create a new account
3. The error should be gone ✅

## Why This Works

The fix avoids circular reference by:
- Creating a helper function `is_admin()` that checks `auth.users.raw_user_meta_data` instead of querying `profiles`
- Using this function in the RLS policy instead of querying the same table
- Adding proper INSERT policy for new user registration

## Need Help?

If you still see the error:
1. Make sure all old policies are dropped
2. Verify the function was created successfully
3. Check that RLS is enabled on the profiles table
