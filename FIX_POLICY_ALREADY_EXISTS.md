# Fix: Policy Already Exists Error

## Error Message
```
ERROR: 42710: policy "Anyone can view active service types" for table "service_types" already exists
```

## What This Means
You've already run the `create-service-types-table.sql` script once. The policies exist, so trying to create them again causes an error.

---

## ✅ Solution 1: Use Updated Script (Recommended)

The script has been updated to drop existing policies before recreating them.

**Just run it again:**
1. Open Supabase → SQL Editor
2. Copy content from `scripts/create-service-types-table.sql` (updated version)
3. Paste and run
4. ✅ Should work without errors

The updated script now includes:
```sql
DROP POLICY IF EXISTS "Anyone can view active service types" ON service_types;
-- ... then recreates it
```

---

## ✅ Solution 2: Update Icon Names Only

If you just want to update emoji icons to SVG icon names:

**Run this script:**
`scripts/update-icons-to-svg-names.sql`

**What it does:**
- Changes 🏥 → 'medical'
- Changes 🧼 → 'sparkles'
- Changes 💬 → 'chat'
- Changes 🏡 → 'home'
- Changes 🧹 → 'sun'
- Changes 🚗 → 'truck'
- etc.

---

## ✅ Solution 3: Skip Policy Creation

If you just want to add default services:

**Run only this part:**
```sql
-- Insert default service types
INSERT INTO service_types (name, description, icon, price_per_hour, display_order) VALUES
  ('Personal Care', 'Assistance with daily activities', 'sparkles', 35.00, 1),
  ('Medical Care', 'Professional medical assistance', 'medical', 55.00, 2),
  ('Companion Care', 'Social interaction and support', 'chat', 25.00, 3),
  ('Respite Care', 'Temporary relief for caregivers', 'home', 40.00, 4),
  ('Housekeeping', 'Light housekeeping and meals', 'sun', 30.00, 5),
  ('Transportation', 'Transport to appointments', 'truck', 28.00, 6)
ON CONFLICT (name) DO NOTHING;
```

---

## ✅ Solution 4: Drop and Recreate (Clean Slate)

If you want to start fresh:

**Step 1: Drop everything**
```sql
-- Drop policies
DROP POLICY IF EXISTS "Anyone can view active service types" ON service_types;
DROP POLICY IF EXISTS "Admins can view all service types" ON service_types;
DROP POLICY IF EXISTS "Admins can insert service types" ON service_types;
DROP POLICY IF EXISTS "Admins can update service types" ON service_types;
DROP POLICY IF EXISTS "Admins can delete service types" ON service_types;

-- Drop table (⚠️ WARNING: Deletes all service data!)
DROP TABLE IF EXISTS service_types CASCADE;
```

**Step 2: Run full script**
- Run `scripts/create-service-types-table.sql`

⚠️ **Warning:** This deletes all your existing services!

---

## Quick Fix Commands

### Just Update Icons
```sql
-- Run this in Supabase SQL Editor
UPDATE service_types SET icon = 'medical' WHERE icon = '⚕️';
UPDATE service_types SET icon = 'sparkles' WHERE icon = '🧼';
UPDATE service_types SET icon = 'chat' WHERE icon = '💬';
UPDATE service_types SET icon = 'home' WHERE icon = '🏡';
UPDATE service_types SET icon = 'sun' WHERE icon = '🧹';
UPDATE service_types SET icon = 'truck' WHERE icon = '🚗';
```

### Check Current Icons
```sql
SELECT id, name, icon FROM service_types ORDER BY display_order;
```

### Verify Policies Exist
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename = 'service_types';
```

---

## What To Do Next

### If You Have Existing Services
1. Run `scripts/update-icons-to-svg-names.sql`
2. Check admin panel → Service Types
3. Icons should show as SVG now

### If You're Starting Fresh
1. Run updated `scripts/create-service-types-table.sql`
2. Default services created with SVG icons
3. Check admin panel → Service Types

### If Icons Still Show as Emojis
1. Clear browser cache (Ctrl+Shift+Del)
2. Refresh page (Ctrl+F5)
3. Check database icons are updated:
   ```sql
   SELECT name, icon FROM service_types;
   ```

---

## Troubleshooting

### Problem: Icons show as '?' or blank
**Solution:** Icons are stored as names, but UI might be caching. Clear browser cache.

### Problem: Can't create services
**Solution:** Check RLS policies are applied:
```sql
SELECT * FROM pg_policies WHERE tablename = 'service_types';
```

### Problem: Table doesn't exist
**Solution:** Run full `create-service-types-table.sql` script

---

## Prevention

To avoid this error in the future:

Always use `DROP POLICY IF EXISTS` before `CREATE POLICY`:

```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...;
```

---

**Status:** ✅ Fixed in Updated Script
**Last Updated:** July 19, 2026
