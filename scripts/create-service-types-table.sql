-- Create service_types table for dynamic service management
-- Run this in Supabase SQL Editor

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100), -- emoji or icon name
  price_per_hour DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active services
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active, display_order);

-- Add RLS policies
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active service types" ON service_types;
DROP POLICY IF EXISTS "Admins can view all service types" ON service_types;
DROP POLICY IF EXISTS "Admins can insert service types" ON service_types;
DROP POLICY IF EXISTS "Admins can update service types" ON service_types;
DROP POLICY IF EXISTS "Admins can delete service types" ON service_types;

-- Anyone can view active service types (for booking form)
CREATE POLICY "Anyone can view active service types"
  ON service_types
  FOR SELECT
  USING (is_active = true);

-- Admins can view all service types
CREATE POLICY "Admins can view all service types"
  ON service_types
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert service types
CREATE POLICY "Admins can insert service types"
  ON service_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update service types
CREATE POLICY "Admins can update service types"
  ON service_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete service types
CREATE POLICY "Admins can delete service types"
  ON service_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default service types
INSERT INTO service_types (name, description, icon, price_per_hour, display_order) VALUES
  ('Personal Care', 'Assistance with daily activities like bathing, dressing, and grooming', 'sparkles', 35.00, 1),
  ('Medical Care', 'Professional medical assistance and monitoring', 'medical', 55.00, 2),
  ('Companion Care', 'Social interaction, conversation, and emotional support', 'chat', 25.00, 3),
  ('Respite Care', 'Temporary relief for primary caregivers', 'home', 40.00, 4),
  ('Housekeeping', 'Light housekeeping, laundry, and meal preparation', 'sun', 30.00, 5),
  ('Transportation', 'Transportation to appointments and errands', 'truck', 28.00, 6)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_types_updated_at ON service_types;

CREATE TRIGGER update_service_types_updated_at
  BEFORE UPDATE ON service_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Service types table created successfully!' AS status;
SELECT COUNT(*) AS total_services FROM service_types;
