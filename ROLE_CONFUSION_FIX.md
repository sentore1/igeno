# Role Confusion Fix - Admin Users Treated as Clients

## Problem Description

### Issue
When admin users (or any non-client users) log in and visit the booking page, the system automatically creates a `clients` table record for them, regardless of their actual role.

### Root Cause
The booking page (`/app/care/booking/page.tsx`) had logic that:
1. Checked if a user has a `clients` table entry
2. If not, automatically created one
3. **Did not check the user's role before creating the client record**

### Impact
- Admin users were being treated as clients
- Trainer/student users visiting the booking page would get client records created
- Database inconsistency between `profiles.role` and having a `clients` table entry
- Users with multiple roles in the database

## The Fix

### Before (Problematic Code)
```typescript
const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push('/auth/signin');
    return;
  }

  // Get or create client profile
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!client) {
    // Problem: Creates client record for ANY user!
    const { data: newClient } = await supabase
      .from('clients')
      .insert({
        user_id: session.user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: '',
      })
      .select()
      .single();
  }
};
```

### After (Fixed Code)
```typescript
const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push('/auth/signin');
    return;
  }

  // Get user profile first to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    setError('Profile not found. Please contact support.');
    return;
  }

  // Only create client records for users with client-related roles
  const clientRoles = ['client', 'caregiver', 'nurse'];
  if (!clientRoles.includes(profile.role)) {
    setError(`Booking services are only available for clients, caregivers, and nurses. Your role is: ${profile.role}`);
    return;
  }

  // Now safe to create client record - user has appropriate role
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!client) {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: session.user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: '',
      })
      .select()
      .single();
  }
};
```

### Key Changes
1. ✅ Fetch user profile FIRST to check their role
2. ✅ Check if user's role is in `clientRoles` array before proceeding
3. ✅ Show clear error message if wrong role tries to book
4. ✅ Only create `clients` table entry for appropriate roles
5. ✅ Better error handling throughout

## Role System Design

### Correct Behavior

| User Role | Can Book Services | Should Have `clients` Entry | Should Have `caregivers` Entry |
|-----------|-------------------|----------------------------|-------------------------------|
| admin | ❌ No | ❌ No | ❌ No |
| client | ✅ Yes | ✅ Yes | ❌ No |
| caregiver | ✅ Yes (own services) | ❌ No | ✅ Yes |
| nurse | ✅ Yes (own services) | ❌ No | ✅ Yes (or separate table) |
| student | ❌ No | ❌ No | ❌ No |
| trainer | ❌ No | ❌ No | ❌ No |
| consultant | ⚠️ Maybe | ⚠️ Maybe | ❌ No |

### Table Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (base user info)
    ↓ (conditional based on role)
    ├─→ clients (if role = 'client')
    ├─→ caregivers (if role = 'caregiver' or 'nurse')
    └─→ enrollments (if role = 'student' or 'trainer')
```

### Clean Database State
Each user should have:
1. **Always:** 1 record in `auth.users`
2. **Always:** 1 record in `profiles`
3. **Conditionally:** Records in role-specific tables based on their `profiles.role`

## Cleanup Required

If you've already had admin users visit the booking page, you may have orphaned `clients` records. Here's how to clean them up:

### 1. Find Incorrectly Created Client Records
```sql
-- Find users who have client records but aren't clients
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role as actual_role,
  c.id as client_record_id
FROM profiles p
INNER JOIN clients c ON p.id = c.user_id
WHERE p.role NOT IN ('client', 'caregiver', 'nurse');
```

### 2. Delete Incorrect Client Records
```sql
-- Delete client records for non-client users
-- CAUTION: This will also delete any bookings associated with these client IDs
-- Review the data first!
DELETE FROM clients
WHERE user_id IN (
  SELECT p.id
  FROM profiles p
  WHERE p.role NOT IN ('client', 'caregiver', 'nurse')
);
```

### 3. Verify Cleanup
```sql
-- Should return 0 rows after cleanup
SELECT 
  p.id,
  p.email,
  p.role,
  c.id as client_record_id
FROM profiles p
INNER JOIN clients c ON p.id = c.user_id
WHERE p.role NOT IN ('client', 'caregiver', 'nurse');
```

## Prevention - Similar Issues to Check

Check these other pages for similar role-checking issues:

### ⚠️ Caregiver Creation
Look for automatic caregiver record creation without role checking.

### ⚠️ Enrollment Creation
Look for automatic enrollment creation without checking if user is student/trainer.

### ✅ Best Practice Pattern
```typescript
// Always check role before creating role-specific records
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single();

if (profile.role !== 'expected_role') {
  // Handle error or redirect
  return;
}

// Safe to create role-specific record now
```

## Testing Checklist

After applying this fix, test the following scenarios:

- [ ] **Admin user** tries to access `/care/booking`
  - Expected: Error message shown, no client record created
  
- [ ] **Client user** accesses `/care/booking`
  - Expected: Works normally, client record created if needed
  
- [ ] **Student user** tries to access `/care/booking`
  - Expected: Error message shown, no client record created
  
- [ ] **Trainer user** tries to access `/care/booking`
  - Expected: Error message shown, no client record created

- [ ] **Caregiver user** accesses `/care/booking`
  - Expected: Works (caregivers can book services for themselves)

- [ ] Check database after each test:
  ```sql
  SELECT p.email, p.role, c.id as client_id
  FROM profiles p
  LEFT JOIN clients c ON p.id = c.user_id
  WHERE p.email = 'test-user-email';
  ```

## Related Files Modified
- `app/care/booking/page.tsx` - Added role checking before client record creation

## Related Documentation
- `ADMIN_SETUP.md` - Admin user setup guide
- `DASHBOARD_FIX_SUMMARY.md` - Dashboard navigation fixes
- `supabase-schema.sql` - Database schema showing table relationships
