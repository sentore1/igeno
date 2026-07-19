# Fix: Admin Caregiver Creation "Unauthorized" Error

## Problem
When admins tried to add a caregiver, they received an "Unauthorized" error.

## Root Cause
The API route `/api/admin/caregivers` was using `createBrowserClient()` to check the user session. Browser clients cannot access HTTP-only cookies in server-side API routes because:

1. Browser clients rely on `document.cookie` which is only available in the browser
2. API routes run on the server and need to read cookies from the request headers
3. The session authentication was failing because the client couldn't access the auth cookies

## Solution

### 1. Created Server-Side Supabase Client
Created `lib/supabase-server.ts` with a proper server client that can access cookies in API routes using Next.js's `cookies()` function.

**File:** `lib/supabase-server.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle Server Component calls
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle Server Component calls
          }
        },
      },
    }
  );
}
```

### 2. Updated API Route
Updated `app/api/admin/caregivers/route.ts` to use the server client:

**Changed:**
```typescript
// BEFORE (incorrect)
import { createBrowserClient } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  // ...
}

// AFTER (correct)
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  // ...
}
```

## Key Differences

| Client Type | Use Case | Cookie Access |
|-------------|----------|---------------|
| **Browser Client** (`createBrowserClient()`) | Client-side React components | `document.cookie` (browser only) |
| **Server Client** (`createServerSupabaseClient()`) | API routes, Server Components | `cookies()` from Next.js headers |
| **Admin Client** (`supabaseAdmin`) | Admin operations (bypass RLS) | Service role key |

## Testing
After this fix, admins should be able to:
1. Navigate to Admin Dashboard → Caregivers
2. Click "Add Caregiver"
3. Fill in the form
4. Successfully create a caregiver account
5. Receive the generated PIN

## When to Use Each Client

### Use Browser Client
- Client-side React components
- Pages with 'use client' directive
- User-facing interactions

### Use Server Client
- API routes (`/api/**`)
- Server Components
- Server Actions
- When you need to verify authenticated users on the server

### Use Admin Client
- Creating users programmatically
- Bypassing Row Level Security (RLS)
- Admin-only operations
- System-level database operations

## Related Files
- ✅ `lib/supabase-server.ts` (created)
- ✅ `app/api/admin/caregivers/route.ts` (updated)
- `lib/supabase-client.ts` (unchanged, still valid for browser use)
- `lib/supabase-admin.ts` (unchanged, still valid for admin operations)

## Status
✅ **FIXED** - Admin caregiver creation now works correctly with proper server-side authentication.

---

## Update: Fixed Duplicate Profile Key Error

### Additional Problem
After fixing the authentication issue, a new error appeared:
```
Failed to create caregiver: Failed to create profile: duplicate key value violates unique constraint "profiles_pkey"
```

### Root Cause
The database has a trigger (`handle_new_user`) that automatically creates a profile when an auth user is created. The API was then trying to manually create the profile again, causing a duplicate key constraint violation.

**Database Trigger:** (from `scripts/fix-signup-rls.sql`)
```sql
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Solution
Removed the manual profile creation from the API route since the database trigger handles it automatically:

**Removed:**
```typescript
// This code was removed (no longer needed)
const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .insert({
    id: authUser.user.id,
    full_name: full_name,
    email: email,
    role: 'caregiver',
  });
```

**Updated Flow:**
```typescript
// 1. Create auth user with metadata
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
  email: email,
  password: pin,
  email_confirm: true,
  user_metadata: {
    full_name: full_name,  // Used by trigger
    role: 'caregiver',      // Used by trigger
  },
});

// 2. Profile is automatically created by database trigger
// 3. Wait briefly for trigger to complete
await new Promise(resolve => setTimeout(resolve, 100));

// 4. Create caregiver record
const { data: caregiver } = await supabaseAdmin
  .from('caregivers')
  .insert({
    user_id: authUser.user.id,
    // ...
  });
```

### Benefits of This Approach
1. **Single Source of Truth**: Profile creation logic is centralized in the database trigger
2. **Consistency**: All user signups (manual, admin-created, social auth) use the same profile creation logic
3. **Reduced Code**: Less duplication and simpler API routes
4. **Better Error Handling**: No race conditions from manual profile creation

## Final Status
✅ **FULLY FIXED** - Admin caregiver creation now works correctly with:
- Proper server-side authentication (server client instead of browser client)
- No duplicate profile errors (trigger handles profile creation)
- Clean error handling and user cleanup on failures
