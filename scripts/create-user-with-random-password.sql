-- Create User with Random Password Generator
-- This generates a unique secure password for each user
-- Run this in Supabase SQL Editor

-- ============================================
-- RANDOM PASSWORD GENERATOR FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_random_password(length INT DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE USER WITH RANDOM PASSWORD
-- ============================================

CREATE OR REPLACE FUNCTION create_user_with_random_password(
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_role VARCHAR,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  generated_password TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  random_password TEXT;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = p_email) THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      p_email,
      p_full_name,
      p_role,
      ''::TEXT,
      FALSE,
      'User with this email already exists';
    RETURN;
  END IF;

  -- Generate random secure password
  random_password := generate_random_password(12);

  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, 
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(random_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE,
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO profiles (id, full_name, email, role, phone, created_at, updated_at)
  VALUES (
    new_user_id,
    p_full_name,
    p_email,
    p_role,
    p_phone,
    NOW(),
    NOW()
  );

  -- Return success with generated password
  RETURN QUERY SELECT 
    new_user_id,
    p_email,
    p_full_name,
    p_role,
    random_password,
    TRUE,
    'User created successfully with random password';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::UUID,
    p_email,
    p_full_name,
    p_role,
    ''::TEXT,
    FALSE,
    SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Create a student with random password
SELECT * FROM create_user_with_random_password(
  'student@example.com',
  'John Student',
  'student',
  '+1234567890'
);

-- Example 2: Create a caregiver
SELECT * FROM create_user_with_random_password(
  'caregiver@example.com',
  'Jane Caregiver',
  'caregiver',
  '+1987654321'
);

-- Example 3: Create an admin
SELECT * FROM create_user_with_random_password(
  'admin@example.com',
  'Admin User',
  'admin',
  '+1555000000'
);

-- ============================================
-- CREATE MULTIPLE USERS AT ONCE
-- ============================================

-- This will create multiple users and display all their passwords
-- Copy the results and share credentials with each user securely

SELECT 
  email,
  full_name,
  role,
  generated_password as "PASSWORD (Share securely!)",
  message
FROM create_user_with_random_password('user1@example.com', 'User One', 'student', '+1111111111')
UNION ALL
SELECT 
  email,
  full_name,
  role,
  generated_password,
  message
FROM create_user_with_random_password('user2@example.com', 'User Two', 'caregiver', '+2222222222')
UNION ALL
SELECT 
  email,
  full_name,
  role,
  generated_password,
  message
FROM create_user_with_random_password('user3@example.com', 'User Three', 'nurse', '+3333333333');

-- ============================================
-- VERIFY CREATED USERS
-- ============================================

SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.phone,
  p.created_at,
  'Password was displayed above - share securely!' as note
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- BENEFITS OF THIS APPROACH
-- ============================================

/*
✅ Each user gets a unique secure password
✅ No more sharing the same "TempPass123!" password
✅ Passwords are 12 characters with special characters
✅ More secure than fixed passwords
✅ Passwords displayed in results (share via secure channel)
✅ No rate limits (direct database insertion)
✅ Instant user creation

🔐 SECURITY NOTES:
- Copy the passwords from results immediately
- Share via secure channel (encrypted email, password manager, etc.)
- Ask users to change password on first login
- Don't store passwords in plain text anywhere permanent
- Consider using a password manager to share credentials
*/

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To remove functions later (optional):
-- DROP FUNCTION IF EXISTS create_user_with_random_password;
-- DROP FUNCTION IF EXISTS generate_random_password;
