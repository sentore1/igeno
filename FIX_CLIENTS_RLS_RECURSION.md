# Fix: Infinite Recursion in Clients Table RLS

## Problem

When trying to book a service, you get this error:
```
Failed to create client profile: infinite recursion detected in policy for relation "clients"
```

## Root Cause

The RLS policies on `clients`, `caregivers`, and `bookings` tables have **circular dependencies**:

1. `clients` table policy checks `bookings` table
2. `bookings` table policy checks `clients` table
3. This creates an infinite loop 🔄

**Example of problematic policy:**
```sql
-- This policy queries bookings table...
CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings  -- ❌ Circular reference!
      WHERE client_id = clients.id
    )
  );

-- ...while bookings table queries clients table
CREATE POLICY "Clients can view own bookings" ON public.bookings
  USING (
    EXISTS (
      SELECT 1 FROM public.clients  -- ❌ Circular reference!
      WHERE id = bookings.client_id
    )
  );
```

## Quick Fix

### Step 1: Run the Fix Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `scripts/fix-all-rls-recursion.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run** or press `Ctrl+Enter`

### Step 2: Test the Fix

1. Go to: `http://localhost:3000/care/booking`
2. Fill out the booking form
3. Click "Book Service"
4. ✅ Should work without recursion error

## What Changed

### Before (Broken)

**Complex policies with cross-table queries:**
```sql
-- Queries bookings table from clients policy
CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
      AND cg.user_id = auth.uid()
    )
  );
```

### After (Fixed)

**Simple policies without circular references:**
```sql
-- Direct user_id check - no cross-table queries
CREATE POLICY "Users can view own client" ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
```

## Key Principles

The fix follows these principles to avoid recursion:

1. **Direct checks**: Use `auth.uid() = user_id` instead of joining other tables
2. **One-way dependencies**: Bookings can check clients, but clients shouldn't check bookings
3. **Admin bypass**: Use `public.is_admin()` function which checks `auth.users` metadata
4. **Simplicity**: Fewer joins = less chance of circular dependencies

## Complete Policy Overview

### Clients Table
- ✅ Insert: Users can create their own client record
- ✅ Select: Users can view their own client record + admins
- ✅ Update: Users can update their own client record + admins
- ✅ Admin: Full access to all client records

### Caregivers Table
- ✅ Insert: Users can create their own caregiver record
- ✅ Select: All authenticated users can view (for booking) + admins
- ✅ Update: Users can update their own record + admins
- ✅ Admin: Full access to all caregiver records

### Bookings Table
- ✅ Insert: Users can create bookings for their client records
- ✅ Select: Clients see their bookings, caregivers see assigned bookings
- ✅ Update: Both clients and caregivers can update relevant bookings
- ✅ Admin: Full access to all bookings

## Verification

After running the fix, verify in **Supabase SQL Editor**:

```sql
-- Check policies exist
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('clients', 'caregivers', 'bookings')
ORDER BY tablename, policyname;
```

Expected output: Multiple policies for each table with no circular references

## Testing Scenarios

### Test 1: Create Client Profile and Book Service
1. Sign in as a client
2. Go to `/care/booking`
3. Fill booking form
4. Submit
5. ✅ Should succeed

### Test 2: Caregiver Views Available Bookings
1. Sign in as a caregiver
2. Go to caregiver dashboard
3. View bookings
4. ✅ Should see assigned bookings only

### Test 3: Admin Views All Data
1. Sign in as admin
2. Go to `/dashboard/admin/bookings`
3. ✅ Should see all bookings
4. Go to `/dashboard/admin/caregivers`
5. ✅ Should see all caregivers

## Troubleshooting

### Issue: Still getting recursion error after running script

**Solution**:
1. Check if policies were actually dropped and recreated:
   ```sql
   SELECT tablename, COUNT(*) as policy_count
   FROM pg_policies
   WHERE tablename = 'clients'
   GROUP BY tablename;
   ```
2. If old policies still exist, manually drop them:
   ```sql
   DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;
   ```
3. Re-run the fix script

### Issue: "permission denied" when booking

**Solution**:
1. Check if you have a client record:
   ```sql
   SELECT * FROM public.clients WHERE user_id = 'your-user-id';
   ```
2. If not, the booking page should create one automatically
3. If it fails, check RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'clients';
   ```

### Issue: Caregivers can't see any bookings

**Solution**:
1. Make sure caregiver has a caregiver record:
   ```sql
   SELECT * FROM public.caregivers WHERE user_id = 'caregiver-user-id';
   ```
2. Make sure bookings have `caregiver_id` assigned
3. Check caregiver dashboard is querying correctly

## Related Tables

These tables also have RLS policies but don't have recursion issues:

- ✅ `profiles` - Uses `auth.users` metadata (no recursion)
- ✅ `courses` - Simple instructor check
- ✅ `enrollments` - Simple user check
- ✅ `notifications` - Simple user check

## Prevention

To avoid recursion in future policies:

1. **Think one-way**: If A references B, B shouldn't reference A
2. **Use metadata**: Check `auth.users.raw_user_meta_data` instead of `profiles`
3. **Direct checks**: Prefer `user_id = auth.uid()` over complex EXISTS
4. **Test incrementally**: Add one policy at a time and test

## Alternative Approach (If Needed)

If you need complex cross-table checks, use **helper functions with SECURITY DEFINER**:

```sql
-- Example: Check if user is caregiver for client
CREATE OR REPLACE FUNCTION public.is_caregiver_for_client(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.caregivers cg ON b.caregiver_id = cg.id
    WHERE b.client_id = p_client_id
    AND cg.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use in policy
CREATE POLICY "Caregivers can view their clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (public.is_caregiver_for_client(id));
```

⚠️ Use `SECURITY DEFINER` carefully - it bypasses RLS!

## Files Changed

1. ✅ `scripts/fix-all-rls-recursion.sql` - New comprehensive fix
2. ✅ `FIX_CLIENTS_RLS_RECURSION.md` - This documentation

## Related Documentation

- `FIX_RLS_ERROR.md` - Fix for profiles table infinite recursion
- `FIX_SIGNUP_RLS_ERROR.md` - Fix for signup RLS errors
- `scripts/add-missing-rls-policies.sql` - Original (broken) policies

## Summary

✅ Run `scripts/fix-all-rls-recursion.sql`  
✅ Test booking functionality  
✅ Verify no more recursion errors  
✅ All user roles can access appropriate data  

The fix simplifies all RLS policies to avoid circular dependencies while maintaining proper security boundaries.
