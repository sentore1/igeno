-- Create Payment System with Mobile Money (MoMo) Support
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PAYMENT SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method VARCHAR(50) NOT NULL, -- 'momo', 'card', 'bank', etc.
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Store method-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default MoMo settings
INSERT INTO payment_settings (payment_method, is_active, settings) VALUES
  ('momo', true, jsonb_build_object(
    'provider', 'MTN Mobile Money',
    'qr_code_url', '',
    'phone_number', '',
    'account_name', '',
    'instructions', 'Scan QR code or send payment to the number above'
  ))
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. UPDATE BOOKINGS TABLE FOR PAYMENTS
-- ============================================

-- Add payment columns to bookings table
DO $$ 
BEGIN
    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50);
    END IF;

    -- Add payment_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_amount'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10, 2);
    END IF;

    -- Add payment_proof_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_proof_url'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_proof_url TEXT;
    END IF;

    -- Add payment_verified_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_verified_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add payment_verified_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_verified_by'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_verified_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- ============================================
-- 3. CREATE STORAGE BUCKET FOR PAYMENT PROOFS
-- ============================================

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. RLS POLICIES FOR PAYMENT SETTINGS
-- ============================================

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage payment settings"
  ON payment_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can view active payment methods
CREATE POLICY "Anyone can view active payment settings"
  ON payment_settings
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- 5. STORAGE POLICIES FOR PAYMENT PROOFS
-- ============================================

-- Users can upload their own payment proofs
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own payment proofs
CREATE POLICY "Users can view own payment proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Admins can view all payment proofs
CREATE POLICY "Admins can view all payment proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_settings_active ON payment_settings(is_active);

-- ============================================
-- 7. UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. SUCCESS MESSAGE
-- ============================================

SELECT 'Payment system created successfully!' AS status;
SELECT 
  'Payment columns: ' || COUNT(*) AS booking_columns
FROM information_schema.columns
WHERE table_name = 'bookings' 
AND column_name IN ('payment_status', 'payment_method', 'payment_amount', 'payment_proof_url');
