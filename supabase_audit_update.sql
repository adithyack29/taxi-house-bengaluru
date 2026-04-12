-- Add Audit and Logistics columns to bookings table
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS return_time TIME,
ADD COLUMN IF NOT EXISTS audit_data JSONB;
