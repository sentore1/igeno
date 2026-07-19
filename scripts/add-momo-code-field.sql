-- Add MoMo Code field to payment_settings
-- This allows admins to configure either phone number or MoMo code
-- Run this in Supabase SQL Editor

-- ============================================
-- Update payment_settings to support momo_code
-- ============================================

-- The settings JSONB column can now include:
-- {
--   "provider": "MTN Mobile Money",
--   "phone_number": "+250788123456",  -- Optional
--   "momo_code": "12345",              -- Optional (new)
--   "account_name": "Business Name",
--   "instructions": "Payment instructions"
-- }

-- Note: Admin should configure either phone_number OR momo_code (or both)

-- ============================================
-- Example: Update existing MoMo settings to add momo_code
-- ============================================

-- Uncomment and modify this if you want to add a MoMo code to existing settings:
-- UPDATE payment_settings
-- SET settings = jsonb_set(
--     settings,
--     '{momo_code}',
--     '"YOUR_MOMO_CODE_HERE"'
-- )
-- WHERE payment_method = 'momo';

-- ============================================
-- Verify payment settings
-- ============================================

SELECT 
    payment_method,
    is_active,
    settings,
    created_at
FROM payment_settings
WHERE payment_method = 'momo';

SELECT '✅ MoMo code field support added to payment settings!' AS status;
SELECT 'ℹ️  You can now configure both phone_number and momo_code in admin settings' AS info;
