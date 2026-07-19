# ⚡ Quick Fix: Phone Column Error

## Error Message
```
Could not find the 'phone' column of 'profiles' in the schema cache
```

## 🔧 Quick Fix (2 Steps)

### Step 1: Run SQL Script
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy this SQL:

```sql
-- Add phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
```

3. Click **Run** ✅

### Step 2: Restart Dev Server
```bash
# Press Ctrl+C to stop server
# Then restart:
npm run dev
```

## ✅ Done!
Now you can add users with phone numbers.

---

## 📝 What This Does
- Adds optional `phone` column to `profiles` table
- Allows storing phone numbers (up to 20 characters)
- Makes it work with the Add User form

## 🧪 Test It
1. Go to **Admin Panel** → **User Management**
2. Click **+ Add User**
3. Fill form with phone number
4. Click **Create User**
5. Should work! ✅

---

## Alternative: Full Script
For more detailed setup, use: `scripts/add-phone-column-to-profiles.sql`

## Need More Help?
See: `FIX_ADD_USER_PHONE_ERROR.md` for detailed troubleshooting
