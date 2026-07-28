-- Step 1: Keep only the latest bank row, delete the rest
DELETE FROM payment_settings
WHERE payment_method = 'bank'
AND id NOT IN (
  SELECT id FROM payment_settings
  WHERE payment_method = 'bank'
  ORDER BY created_at DESC
  LIMIT 1
);

-- Step 2: Add unique constraint so this can never happen again
ALTER TABLE payment_settings
ADD CONSTRAINT payment_settings_method_unique UNIQUE (payment_method);

-- Verify
SELECT payment_method, is_active, settings FROM payment_settings WHERE payment_method = 'bank';
