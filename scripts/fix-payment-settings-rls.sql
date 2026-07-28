-- Fix: Admins can read ALL payment settings regardless of is_active
-- The existing "Anyone can view active payment settings" policy blocks reading
-- inactive rows, causing bank settings to disappear after save when is_active=false

-- Drop the restrictive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active payment settings" ON payment_settings;

-- Re-create it so it only applies to non-admins (public/clients)
CREATE POLICY "Public can view active payment settings"
  ON payment_settings
  FOR SELECT
  USING (
    is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins already have full access via "Admins can manage payment settings" policy
-- Verify
SELECT payment_method, is_active, settings FROM payment_settings WHERE payment_method = 'bank';
