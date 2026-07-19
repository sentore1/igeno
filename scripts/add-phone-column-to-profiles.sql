-- Add phone column to profiles table
-- Run this in Supabase SQL Editor

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN phone VARCHAR(20);
        
        RAISE NOTICE 'Phone column added successfully';
    ELSE
        RAISE NOTICE 'Phone column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'profiles'
    AND column_name = 'phone';

-- Success message
SELECT 'Phone column setup complete!' AS status;
