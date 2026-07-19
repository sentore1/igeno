-- Update Payment System for Dynamic QR Code Generation
-- Run this in Supabase SQL Editor

-- ============================================
-- Remove qr_code_url from payment_settings
-- (QR codes are now generated dynamically)
-- ============================================

DO $$ 
BEGIN
    -- Update existing momo settings to remove qr_code_url
    UPDATE payment_settings
    SET settings = settings - 'qr_code_url'
    WHERE payment_method = 'momo';
    
    RAISE NOTICE 'Payment settings updated for dynamic QR generation';
END $$;

-- ============================================
-- Verify payment settings structure
-- ============================================

SELECT 
    payment_method,
    is_active,
    settings,
    created_at
FROM payment_settings
WHERE payment_method = 'momo';

-- Expected settings structure (without qr_code_url):
-- {
--   "provider": "MTN Mobile Money",
--   "phone_number": "+250 XXX XXX XXX",
--   "account_name": "Your Business Name",
--   "instructions": "Payment instructions text"
-- }

SELECT '✅ Payment system updated for dynamic QR code generation!' AS status;
