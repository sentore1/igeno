# Quick User Role Change Guide

## The Simple Way to Change User Roles

### Step 1: Find Your User Email
Know the email address of the user whose role you want to change.

Example: `abodusentore@example.com`

### Step 2: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 3: Copy and Run This SQL

Replace `USER@EMAIL.COM` with the actual email and `DESIRED_ROLE` with one of the valid roles.

```sql
BEGIN;

-- Update profiles table
UPDATE public.profiles
SET role = 'admin'  -- Change to: admin, trainer, student, caregiver, nurse, consultant, or client
WHERE email = 'abodusentore@example.com';  -- Change this email

-- Update auth metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'  -- Must match role above (keep the quotes)
)
WHERE email = 'abodusentore@example.com';  -- Change this email

COMMIT;
```

### Step 4: Verify the Change

Run this to confirm:

```sql
SELECT 
  p.email,
  p.full_name,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'abodusentore@example.com';  -- Change this email
```

You should see both `profile_role` and `metadata_role` show the same role (e.g., "admin").

### Step 5: Have User Log Out and Back In

The user needs to:
1. Sign out of the application
2. Sign back in
3. The new role will now be active

---

## Valid Role Values

Use **exactly** these values (lowercase):

- `admin` - Full system access, can manage all users and settings
- `trainer` - Can create and manage courses
- `student` - Can enroll in and take courses
- `caregiver` - Provides care services
- `nurse` - Medical care provider
- `consultant` - Professional consultant
- `client` - Receives care services

---

## Common Use Cases

### Make Someone an Admin

```sql
BEGIN;
UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"') WHERE email = 'user@example.com';
COMMIT;
```

### Change Admin Back to Client

```sql
BEGIN;
UPDATE public.profiles SET role = 'client' WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"client"') WHERE email = 'user@example.com';
COMMIT;
```

### Change Multiple Users at Once

```sql
BEGIN;
UPDATE public.profiles SET role = 'admin' 
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');

UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"') 
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');
COMMIT;
```

---

## Troubleshooting

### Error: "column updated_at does not exist"
✅ **Fixed!** The scripts no longer reference `updated_at` column.

### User still sees old role after change
- User must **sign out and sign back in** for role change to take effect
- Clear browser cookies if still not working

### Profile not found error
The user needs to sign up first. You can't change a role for a user that doesn't exist in the profiles table.

### Roles don't match (profile_role ≠ metadata_role)
Both must match. Always update BOTH tables:
1. `public.profiles` table → `role` column
2. `auth.users` table → `raw_user_meta_data->>'role'` field

---

## Quick Reference: One-Line Commands

View all users and roles:
```sql
SELECT email, full_name, role FROM public.profiles ORDER BY created_at DESC;
```

Find specific user:
```sql
SELECT * FROM public.profiles WHERE email = 'user@example.com';
```

Check if someone is admin:
```sql
SELECT email, role FROM public.profiles WHERE role = 'admin';
```
