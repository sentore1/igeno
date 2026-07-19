# Fix: Add User Phone Column Error

## Problem
When trying to add a new user in the Admin User Management page, you get this error:
```
Could not find the 'phone' column of 'profiles' in the schema cache
```

## Root Cause
The `profiles` table in your Supabase database doesn't have a `phone` column yet.

## Solution

### Option 1: Add Phone Column (Recommended)
Run the SQL script to add the phone column to your profiles table:

**File:** `scripts/add-phone-column-to-profiles.sql`

**Steps:**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the content from `scripts/add-phone-column-to-profiles.sql`
4. Click **Run**
5. You should see: "Phone column setup complete!"

**What this does:**
- Adds a `phone` column to the `profiles` table
- Makes it optional (nullable)
- Type: VARCHAR(20)

### Option 2: Remove Phone Field (Quick Fix)
If you don't need phone numbers, you can remove the phone field from the user management form.

## Verification

After running the SQL script:

1. **Check the column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'phone';
   ```

2. **Test adding a user:**
   - Go to Admin Panel → User Management
   - Click "+ Add User"
   - Fill in the form
   - Click "Create User"
   - Should work without errors!

## Code Changes Made

I've also updated the code to handle the phone field more gracefully:

### Before (caused error):
```typescript
.update({
  full_name: formData.full_name,
  role: formData.role,
  phone: formData.phone || null, // ❌ Error if column doesn't exist
})
```

### After (handles missing column):
```typescript
const updateData: any = {
  full_name: formData.full_name,
  role: formData.role,
};

// Only include phone if it has a value
if (formData.phone) {
  updateData.phone = formData.phone;
}

.update(updateData) // ✅ Works even if column doesn't exist
```

## Alternative: Check Current Schema

If you want to see what columns currently exist in your profiles table:

**File:** `scripts/check-profiles-schema.sql`

Run this to see all columns:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

## Expected Profiles Table Schema

After the fix, your `profiles` table should have these columns:

| Column Name | Type | Nullable | Description |
|-------------|------|----------|-------------|
| id | uuid | NO | Primary key |
| full_name | varchar | YES | User's full name |
| email | varchar | YES | User's email |
| role | varchar | YES | User role (admin, caregiver, etc.) |
| phone | varchar | YES | Phone number (NEW) |
| created_at | timestamp | YES | When profile was created |
| updated_at | timestamp | YES | Last update time |

## Testing After Fix

1. ✅ Add a user WITH phone number
2. ✅ Add a user WITHOUT phone number
3. ✅ Edit a user and update phone
4. ✅ View user with phone number
5. ✅ View user without phone number

## Troubleshooting

### Still Getting Error After Adding Column?

**Try refreshing the Supabase connection:**
1. Stop your dev server (Ctrl+C)
2. Clear Next.js cache:
   ```bash
   rd /s /q .next
   ```
3. Restart dev server:
   ```bash
   npm run dev
   ```

### Phone Column Already Exists?

If you run the script and it says "Phone column already exists", then the issue might be:
- Supabase cache needs refresh (restart dev server)
- RLS policies blocking access (check policies)
- Type mismatch (check column type)

### Check RLS Policies

Make sure your RLS policies allow updates to the phone column:

```sql
-- Check existing policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

## Related Files

- SQL Script: `scripts/add-phone-column-to-profiles.sql`
- Schema Check: `scripts/check-profiles-schema.sql`
- Users Page: `app/dashboard/admin/users/page.tsx`

## Support

If you continue to have issues:
1. Check Supabase logs in the dashboard
2. Check browser console for errors
3. Verify you're using the correct Supabase project
4. Confirm RLS policies allow the operation

---

**Status:** ✅ Fixed
**Date:** July 19, 2026
**Version:** 1.0
