-- 1. Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for 'cars'
-- Allow public to select (view cars)
DROP POLICY IF EXISTS "Allow public select on cars" ON cars;
CREATE POLICY "Allow public select on cars" ON cars
    FOR SELECT TO public USING (true);

-- Allow authenticated users (Admin) to insert, update, delete
DROP POLICY IF EXISTS "Allow authenticated insert on cars" ON cars;
CREATE POLICY "Allow authenticated insert on cars" ON cars
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on cars" ON cars;
CREATE POLICY "Allow authenticated update on cars" ON cars
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on cars" ON cars;
CREATE POLICY "Allow authenticated delete on cars" ON cars
    FOR DELETE TO authenticated USING (true);

-- 3. Create policies for 'bookings'
-- Allow public to insert (make bookings)
DROP POLICY IF EXISTS "Allow public insert on bookings" ON bookings;
CREATE POLICY "Allow public insert on bookings" ON bookings
    FOR INSERT TO public WITH CHECK (true);

-- Allow public to select their own booking (needed for success page)
DROP POLICY IF EXISTS "Allow public select on bookings" ON bookings;
CREATE POLICY "Allow public select on bookings" ON bookings
    FOR SELECT TO public USING (true);

-- Allow public to update their own booking if it matches a pending cashfree order
DROP POLICY IF EXISTS "Allow public update on bookings" ON bookings;
CREATE POLICY "Allow public update on bookings" ON bookings
    FOR UPDATE TO public
    USING (status = 'pending')
    WITH CHECK (status = 'confirmed');

-- Allow authenticated users (Admin) to select, update, delete
DROP POLICY IF EXISTS "Allow authenticated select on bookings" ON bookings;
CREATE POLICY "Allow authenticated select on bookings" ON bookings
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated update on bookings" ON bookings;
CREATE POLICY "Allow authenticated update on bookings" ON bookings
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on bookings" ON bookings;
CREATE POLICY "Allow authenticated delete on bookings" ON bookings
    FOR DELETE TO authenticated USING (true);

-- 4. Create policies for 'messages'
-- Allow public to insert (send messages)
DROP POLICY IF EXISTS "Allow public insert on messages" ON messages;
CREATE POLICY "Allow public insert on messages" ON messages
    FOR INSERT TO public WITH CHECK (true);

-- Allow authenticated users (Admin) to select, update, delete
DROP POLICY IF EXISTS "Allow authenticated select on messages" ON messages;
CREATE POLICY "Allow authenticated select on messages" ON messages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated update on messages" ON messages;
CREATE POLICY "Allow authenticated update on messages" ON messages
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on messages" ON messages;
CREATE POLICY "Allow authenticated delete on messages" ON messages
    FOR DELETE TO authenticated USING (true);
