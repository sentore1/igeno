# Fix Dashboard Blank Screen Issue

## Issues Identified

1. **400 Error** - Authentication token request failure
2. **406 Error** - Profile query rejected (RLS or Accept header issue)

## Step-by-Step Fix

### Step 1: Apply RLS Policy Fix (CRITICAL)

The 406 error is likely caused by RLS (Row Level Security) policy issues.

**Action Required:**
1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ippcprgsdssnbjtpfklt`
3. Go to **SQL Editor** (left sidebar)
4. Copy the contents of `scripts/fix-rls-policies.sql`
5. Paste and click **Run**

This will:
- Remove circular RLS policy references
- Create a proper `is_admin()` function
- Set up correct policies for profile access

### Step 2: Clear Browser Data

After applying the SQL fix:
1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Click "Clear site data" for localhost:3000
4. Or manually clear:
   - Cookies
   - Local Storage
   - Session Storage

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Login

1. Go to http://localhost:3000/auth/signin
2. Sign in with your credentials
3. Check if dashboard loads properly

### Step 5: Verify (If Still Issues)

If dashboard is still blank, check browser console:

```javascript
// Open DevTools Console and run:
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

Check Network tab:
- Look for failed requests to `supabase.co`
- Check request headers (should include `apikey` and `Authorization`)
- Check response status and error messages

## What Was Changed

### File: `lib/supabase-client.ts`
- Added proper cookie handling for `@supabase/ssr`
- Configured browser client with cookie methods
- This fixes the 406 error by ensuring proper headers

### File: `app/dashboard/page.tsx`
- Added error handling and logging
- Added user-friendly error alerts
- Better debugging capability

## Common Issues

### Issue: "Invalid JWT" or "No session"
**Solution:** Clear cookies and re-login

### Issue: "Row Level Security policy violation"
**Solution:** Make sure you ran the SQL script in Step 1

### Issue: "Failed to fetch"
**Solution:** Check `.env.local` has correct Supabase URL and keys

## Need More Help?

Check these logs in browser console:
1. Session errors
2. Profile errors
3. Network request/response details

The error messages will guide you to the specific issue.
