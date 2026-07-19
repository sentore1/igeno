-- Direct User Creation Script (Bypasses Email Rate Limits)
-- Use this when you hit Supabase email rate limits
-- Run this in Supabase SQL Editor

-- ============================================
-- INSTRUCTIONS: Edit the values below
-- ============================================

-- 1. Replace these values with your new user's information:
DO $$
DECLARE
  new_user_email VARCHAR := 'newuser@example.com';  -- CHANGE THIS
  new_user_name VARCHAR := 'New User Name';          -- CHANGE THIS
  new_user_role VARCHAR := 'student';                -- CHANGE THIS: student, caregiver, nurse, trainer, consultant, client, admin
  new_user_phone VARCHAR := '+1234567890';           -- CHANGE THIS (optional, can be NULL)
  temp_password VARCHAR := 'TempPass123!';           -- Default password
  new_user_id UUID;
BEGIN
  -- Create user in auth.users table (bypasses email confirmation)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    new_user_email,
    crypt(temp_password, gen_salt('bf')),  -- Encrypted password
    NOW(),  -- Email confirmed immediately
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', new_user_name),
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  )
  RETURNING id INTO new_user_id;

  -- Update or insert profile
  INSERT INTO profiles (id, full_name, email, role, phone, created_at, updated_at)
  VALUES (
    new_user_id,
    new_user_name,
    new_user_email,
    new_user_role,
    NULLIF(new_user_phone, ''),  -- Set to NULL if empty
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Output success message
  RAISE NOTICE 'User created successfully!';
  RAISE NOTICE 'Email: %', new_user_email;
  RAISE NOTICE 'Password: %', temp_password;
  RAISE NOTICE 'Role: %', new_user_role;
  RAISE NOTICE 'User ID: %', new_user_id;
END $$;

-- Verify the user was created
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.phone,
  p.created_at,
  'User created - Password: TempPass123!' as note
FROM profiles p
WHERE p.email = 'newuser@example.com'  -- CHANGE THIS to match above
ORDER BY p.created_at DESC
LIMIT 1;
