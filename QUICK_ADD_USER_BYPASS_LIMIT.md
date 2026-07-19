# ⚡ Quick: Add Users Without Rate Limits

## 🔴 Problem
"Email rate limit exceeded" when adding users

## ✅ Quick Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)

### Step 2: Paste and Modify This
```sql
-- CHANGE THESE VALUES:
DO $$
DECLARE
  new_user_email VARCHAR := 'newuser@example.com';  -- ← Change email
  new_user_name VARCHAR := 'New User';              -- ← Change name
  new_user_role VARCHAR := 'student';               -- ← Change role
  new_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, 
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    new_user_email, crypt('TempPass123!', gen_salt('bf')),
    NOW(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', new_user_name),
    NOW(), NOW()
  ) RETURNING id INTO new_user_id;
  
  INSERT INTO profiles (id, full_name, email, role, created_at)
  VALUES (new_user_id, new_user_name, new_user_email, new_user_role, NOW());
  
  RAISE NOTICE 'User created! Email: %, Password: TempPass123!', new_user_email;
END $$;
```

### Step 3: Click Run
✅ User created instantly!

---

## 🔧 Roles Available
Change `new_user_role` to one of:
- `student`
- `caregiver`
- `nurse`
- `trainer`
- `consultant`
- `client`
- `admin`

---

## 🔑 Credentials
- **Email**: What you set above
- **Password**: `TempPass123!`
- Ask user to change on first login

---

## 📚 More Options

### Create Multiple Users
Use: `scripts/create-multiple-users.sql`

### Detailed Guide
See: `FIX_EMAIL_RATE_LIMIT_ERROR.md`

---

## 🎯 Example

Create a caregiver named Jane:
```sql
new_user_email VARCHAR := 'jane.doe@example.com';
new_user_name VARCHAR := 'Jane Doe';
new_user_role VARCHAR := 'caregiver';
```

Then click **Run** ✅

---

**This bypasses email limits completely!**
