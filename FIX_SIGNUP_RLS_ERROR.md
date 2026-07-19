# Fix: Sign Up RLS Error - "new row violates row-level security policy for table profiles"

## Problem

When users try to sign up, they encounter this error:
```
new row violates row-level security policy for table "profiles"
```

## Root Cause

The issue occurs because:
1. The signup code tries to manually insert a profile record after user creation
2. During the signup process, the authentication context might not be fully established
3. The RLS policy `WITH CHECK (auth.uid() = id)` fails because the auth context is unreliable during registration

## Solution

Use a **database trigger** to automatically create profiles when users sign up, instead of manual insertion in client code.

### Step 1: Run the SQL Fix Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file: `scripts/fix-signup-rls.sql`
4. Copy its entire contents
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Test the Fix

1. Go to your signup page: `http://localhost:3000/auth/signup`
2. Fill in the form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: Client (Care Services)
3. Click "Sign up"
4. ✅ Account should be created without any RLS error

## What Changed

### Before (Broken Approach)

**Client Code** (in `app/auth/signup/page.tsx`):
```typescript
// Manual profile creation after signup (❌ Unreliable)
const { data: authData } = await supabase.auth.signUp({...});

if (authData.user) {
  await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role,
  });
}
```

**Problem**: The auth context might not be fully established, causing RLS to reject the insert.

### After (Fixed Approach)

**Database Trigger** (automatic):
```sql
CREATE FUNCTION public.handle_new_user()
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Client Code** (simplified):
```typescript
// Profile created automatically by database trigger ✅
const { data: authData } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      role,
    },
  }
});
```

## Why This Works

1. **SECURITY DEFINER**: The trigger function runs with elevated privileges, bypassing RLS policies
2. **Server-side**: Executes on the database server, so auth context is always valid
3. **Atomic**: Profile creation happens automatically and immediately after user creation
4. **Reliable**: No timing issues or race conditions
5. **Metadata**: User data is passed via `raw_user_meta_data` and extracted in the trigger

## Verification

After applying the fix, verify the trigger exists:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Expected output:
```
trigger_name          | event_manipulation | event_object_table
----------------------|-------------------|-------------------
on_auth_user_created  | INSERT            | users
```

## Additional Benefits

This approach also:
- Reduces client-side code complexity
- Ensures consistency (every user automatically gets a profile)
- Prevents orphaned auth users without profiles
- Makes the signup process more reliable

## Troubleshooting

### If you still get the error:

1. **Verify the trigger was created**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Check if RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'profiles';
   ```

3. **Verify the function exists**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```

4. **Test the trigger manually**:
   ```sql
   -- This should create a profile automatically
   INSERT INTO auth.users (id, email, raw_user_meta_data) 
   VALUES (
     gen_random_uuid(), 
     'test@example.com',
     '{"full_name": "Test User", "role": "client"}'::jsonb
   );
   ```

### If email confirmation is enabled:

If your Supabase project has email confirmation enabled:
- Users will need to confirm their email before they can sign in
- The profile is still created immediately upon signup
- After email confirmation, users can sign in normally

## Files Changed

1. ✅ `scripts/fix-signup-rls.sql` - New SQL script to fix the issue
2. ✅ `app/auth/signup/page.tsx` - Removed manual profile insertion
3. ✅ `FIX_SIGNUP_RLS_ERROR.md` - This documentation

## Next Steps

After fixing signup:
1. Test with different user roles (client, caregiver, student, etc.)
2. Verify users can sign in after signup
3. Check that profiles are created correctly in Supabase dashboard
4. Consider adding email confirmation if not already enabled

## Related Documentation

- `FIX_RLS_ERROR.md` - Fix for infinite recursion in RLS policies
- `ADMIN_SETUP.md` - How to set up admin users
- `DEVELOPER_GUIDE.md` - General development guide
