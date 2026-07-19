# Fix: Caregiver Cannot See Client Names

## Problem
When a caregiver views their dashboard, assigned bookings show "Unknown Client" instead of the actual patient/client name (e.g., "Patricia Garcia").

## Root Cause
The caregiver dashboard fetches bookings with client information:
```typescript
.select(`
  *,
  clients (
    full_name,
    email,
    phone,
    address
  )
`)
```

However, there's **no RLS (Row Level Security) policy** on the `clients` table that allows caregivers to read client information for their assigned bookings.

## Solution

### Step 1: Apply the SQL Fix
Run the fix script in your Supabase SQL Editor:

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Open and run: scripts/fix-caregiver-client-access.sql
```

Or copy this SQL directly:

```sql
DROP POLICY IF EXISTS "Caregivers can view their assigned clients" ON public.clients;

CREATE POLICY "Caregivers can view their assigned clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    public.is_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.caregivers cg ON b.caregiver_id = cg.id
      WHERE b.client_id = clients.id
      AND cg.user_id = auth.uid()
    )
  );
```

### Step 2: Verify the Fix
1. Log in as the admin (abdousentore)
2. Go to Admin Panel → Bookings
3. Ensure Patricia Garcia is assigned to the caregiver "intore"
4. Log out and log in as the caregiver (intore)
5. Check the Caregiver Dashboard
6. The client name "Patricia Garcia" should now display instead of "Unknown Client"

## How It Works

The RLS policy uses an EXISTS clause to check if:
1. A booking exists (`public.bookings`)
2. That links the caregiver to the client (`b.caregiver_id = cg.id` and `b.client_id = clients.id`)
3. And the caregiver belongs to the current user (`cg.user_id = auth.uid()`)

If all conditions are true, the caregiver can view that client's information.

## Expected Result

### Before
- Caregiver Dashboard shows: "Unknown Client"

### After
- Caregiver Dashboard shows: "Patricia Garcia" (or actual client name)
- Client email, phone, and address are also accessible

## Notes
- This policy is **read-only** (SELECT only) - caregivers cannot modify client information
- Caregivers can only see clients they're assigned to through active bookings
- Admins and the client owners always have full access
