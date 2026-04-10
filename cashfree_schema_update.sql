-- Add Cashfree payment columns to bookings table
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_payment_status TEXT;

-- We keep the old razorpay columns for history, but we could eventually deprecate them.
