-- Add Bank Transfer payment method to payment_settings
-- Run this in Supabase SQL Editor

INSERT INTO payment_settings (payment_method, is_active, settings)
VALUES (
  'bank',
  false,
  jsonb_build_object(
    'bank_name', '',
    'bank_account_name', '',
    'bank_account_number', ''
  )
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT payment_method, is_active, settings FROM payment_settings WHERE payment_method = 'bank';
