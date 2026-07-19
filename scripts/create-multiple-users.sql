-- Create Multiple Users at Once (Bypasses Email Rate Limits)
-- Use this to create multiple users quickly
-- Run this in Supabase SQL Editor

-- ============================================
-- BULK USER CREATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_role VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_password VARCHAR DEFAULT 'TempPass123!'
)
RETURNS TABLE (
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = p_email) THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      p_email,
      p_full_name,
      p_role,
      FALSE,
      'User with this email already exists';
    RETURN;
  END IF;

  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_user_id;

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

  -- Return success
  RETURN QUERY SELECT 
    new_user_id,
    p_email,
    p_full_name,
    p_role,
    TRUE,
    'User created successfully';

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::UUID,
    p_email,
    p_full_name,
    p_role,
    FALSE,
    SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE USERS HERE
-- ============================================

-- Example 1: Create a student
SELECT * FROM create_user_with_profile(
  'student1@example.com',
  'John Student',
  'student',
  '+1234567890'
);

-- Example 2: Create a caregiver
SELECT * FROM create_user_with_profile(
  'caregiver1@example.com',
  'Jane Caregiver',
  'caregiver',
  '+1234567891'
);

-- Example 3: Create a nurse
SELECT * FROM create_user_with_profile(
  'nurse1@example.com',
  'Bob Nurse',
  'nurse',
  '+1234567892'
);

-- Example 4: Create an admin
SELECT * FROM create_user_with_profile(
  'admin2@example.com',
  'Alice Admin',
  'admin',
  '+1234567893'
);

-- Example 5: Create without phone
SELECT * FROM create_user_with_profile(
  'trainer1@example.com',
  'Tom Trainer',
  'trainer'
);

-- ============================================
-- BULK INSERT TEMPLATE
-- ============================================

-- Uncomment and modify this section to create multiple users at once:

/*
SELECT * FROM create_user_with_profile('user1@example.com', 'User One', 'student', '+1111111111');
SELECT * FROM create_user_with_profile('user2@example.com', 'User Two', 'student', '+2222222222');
SELECT * FROM create_user_with_profile('user3@example.com', 'User Three', 'caregiver', '+3333333333');
SELECT * FROM create_user_with_profile('user4@example.com', 'User Four', 'nurse', '+4444444444');
SELECT * FROM create_user_with_profile('user5@example.com', 'User Five', 'trainer', '+5555555555');
*/

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
  'Password: TempPass123!' as credentials
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To remove the function later (optional):
-- DROP FUNCTION IF EXISTS create_user_with_profile;
