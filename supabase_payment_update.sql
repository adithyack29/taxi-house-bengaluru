-- Add payment columns to bookings table
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
