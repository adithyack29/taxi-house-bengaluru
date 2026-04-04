-- Add image_url column
ALTER TABLE cars ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update 21 Seater Bus
UPDATE cars SET image_url = '/images/bus_21.png' WHERE name LIKE '%21 Seater%';

-- Update 40 Seater Bus
UPDATE cars SET image_url = '/images/bus_40.png' WHERE name LIKE '%40 Seater%';

-- Update 50 Seater Bus
UPDATE cars SET image_url = '/images/bus_50.png' WHERE name LIKE '%50 Seater%';
