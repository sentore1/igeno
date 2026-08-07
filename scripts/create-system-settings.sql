-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read all settings
CREATE POLICY "Admin can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert settings
CREATE POLICY "Admin can insert system settings"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update settings
CREATE POLICY "Admin can update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can read specific public settings
CREATE POLICY "Users can read public system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (setting_key IN ('booking_duration_mode', 'platform_name', 'default_currency'));

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('platform_name', '"IgenoGate Care Platform"', 'Name of the platform'),
  ('support_email', '"support@igenogate.com"', 'Support email address'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('allow_new_registrations', 'true', 'Allow new user registrations'),
  ('require_email_verification', 'true', 'Require email verification for new users'),
  ('max_bookings_per_user', '10', 'Maximum number of active bookings per user'),
  ('booking_advance_notice_days', '2', 'Minimum days in advance required for bookings'),
  ('default_currency', '"RWF"', 'Default currency for the platform'),
  ('booking_duration_mode', '"daily"', 'Booking duration mode: "hourly", "daily", or "both"')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'JSONB value of the setting';
