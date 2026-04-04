-- 1. Add new columns to the cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS min_km INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_bata INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS night_bata INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS seating_style TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS permit_charge INTEGER; -- State Permit Inclusion
ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_ac BOOLEAN DEFAULT false;

-- 2. Clear existing sample trial data
DELETE FROM cars;

-- 3. Insert new bus fleet from image
INSERT INTO cars (name, seats, is_ac, price_per_km, driver_bata, night_bata, min_km, seating_style, permit_charge, is_available) VALUES
('21 Seater Non AC Bus', 21, false, 29, 700, 700, 300, 'N/A', 10820, true),
('21 Seater AC Bus', 21, true, 34, 800, 800, 300, 'N/A', 10820, true),
('40 Seater Non AC Bus', 40, false, 58, 1000, 1000, 350, '2+2', 18000, true),
('40 Seater AC Bus', 40, true, 64, 1000, 1000, 350, '2+2', 18000, true),
('50 Seater Non AC Bus', 50, false, 50, 1000, 1000, 300, '3+2', 20000, true),
('50 Seater AC Bus', 50, true, 58, 1000, 1000, 300, '3+2', 20000, true);
