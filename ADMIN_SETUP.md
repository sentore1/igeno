# Admin User Setup Guide

## Overview
This guide helps you set up admin users for the Care-iGeno Platform.

## Current Issues & Solutions

### Issue 1: Dashboard Navigation Missing
**Problem:** Navigation bar was hidden on dashboard pages, making it impossible to navigate.

**Solution:** ✅ Fixed in `components/Navigation.tsx`
- Navigation now shows on dashboard pages
- Dashboard pages show "My Dashboard" and "Admin Panel" links
- Regular pages show "Care Services" and "Academy" links

### Issue 2: User Profile Not Found (PGRST116 Error)
**Problem:** User logged in but has no profile in the `profiles` table.

**Cause:** Profile creation during signup may have failed, or user was created manually in Supabase auth without a corresponding profile.

**Solution:** Run the SQL scripts below in your Supabase SQL Editor.

## Step-by-Step Admin Setup

### Step 1: Ensure User is Signed Up
1. Go to your application and sign up with the admin email (e.g., `abodusentore@example.com`)
2. Verify the email if email verification is enabled
3. If signup fails, check the browser console for errors

### Step 2: Check if User Exists in Supabase
1. Open Supabase Dashboard
2. Go to Authentication → Users
3. Find the user by email
4. Copy their User ID (UUID)

### Step 3: Run SQL to Create/Update Admin User

Open Supabase SQL Editor and run the following queries:

#### A. First, check the current state:
```sql
-- Check if user exists in auth.users
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'abodusentore@example.com'; -- Replace with actual email

-- Check if profile exists
SELECT id, email, full_name, role
FROM public.profiles
WHERE email = 'abodusentore@example.com'; -- Replace with actual email
```

#### B. Update user metadata to make them admin:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'abodusentore@example.com'; -- Replace with actual email
```

#### C. Create or update the profile:
```sql
-- If profile exists, update it:
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'abodusentore@example.com'; -- Replace with actual email

-- If profile doesn't exist, create it (replace USER_ID with actual UUID from step A):
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'PASTE-USER-ID-HERE', -- Replace with actual UUID from auth.users
  'abodusentore@example.com', -- Replace with actual email
  'Admin User', -- Replace with actual name
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', updated_at = NOW();
```

#### D. Verify the setup:
```sql
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  p.role as profile_role,
  p.full_name,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'abodusentore@example.com'; -- Replace with actual email
```

You should see:
- `metadata_role`: admin
- `profile_role`: admin
- Both should say "admin"

### Step 4: Test Admin Access
1. Sign out from the application
2. Sign back in with the admin email
3. You should be redirected to `/dashboard`
4. You should see:
   - Navigation bar at the top
   - "My Dashboard" link
   - "Admin Panel" link
   - "Admin Quick Access" section at the bottom

## Quick Reference: Admin vs Regular User

### Admin User Gets:
- ✅ Access to `/dashboard/admin` pages
- ✅ User management capabilities
- ✅ Booking management
- ✅ Course management
- ✅ System statistics
- ✅ "Admin Panel" link in navigation

### Regular Users Get:
- ✅ Access to `/dashboard` (own dashboard)
- ✅ Personal bookings (if client/caregiver)
- ✅ Enrolled courses (if student/trainer)
- ❌ Cannot access admin pages

## Troubleshooting

### Error: "Profile not found"
**Cause:** No profile record exists for the authenticated user.

**Fix:** Run Step 3C above to create the profile manually.

### Error: "Cannot coerce the result to a single JSON object"
**Cause:** Same as above - profile doesn't exist.

**Fix:** Run Step 3C above.

### Error: "Access denied" on admin pages
**Cause:** User's role is not set to 'admin' in both `auth.users.raw_user_meta_data` AND `profiles.role`.

**Fix:** Run Step 3B and 3C above.

### Navigation bar missing on dashboard
**Cause:** Old bug (now fixed).

**Fix:** The latest code already includes the fix. Refresh your browser or restart the dev server.

### Admin panel link not showing
**Cause:** Either:
1. User role is not 'admin'
2. Profile hasn't been loaded yet

**Fix:**
1. Verify admin role using Step 3D
2. Clear browser cache and cookies
3. Sign out and sign back in

## Database Schema Reference

### profiles table must have:
```sql
- id (uuid, primary key, references auth.users.id)
- email (text)
- full_name (text)
- role (text) -- Must be 'admin' for admin users
- created_at (timestamp)
- updated_at (timestamp)
```

### auth.users.raw_user_meta_data must have:
```json
{
  "role": "admin"
}
```

## Security Notes

1. The `is_admin()` function checks `auth.users.raw_user_meta_data` to avoid circular RLS policy references
2. Both metadata and profile role should match for consistency
3. Admin access is enforced at the page level (React) and database level (RLS)
4. Service role bypasses all RLS policies

## Related Files
- `/scripts/fix-rls-policies.sql` - RLS policy definitions
- `/scripts/create-admin-user.sql` - Admin user creation script
- `/components/Navigation.tsx` - Navigation bar with admin links
- `/app/dashboard/admin/page.tsx` - Admin dashboard
