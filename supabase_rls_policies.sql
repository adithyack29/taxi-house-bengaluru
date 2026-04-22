-- 1. Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for 'cars'
-- Allow public to select (view cars)
CREATE POLICY "Allow public select on cars" ON cars
    FOR SELECT TO public USING (true);

-- Allow authenticated users (Admin) to insert, update, delete
CREATE POLICY "Allow authenticated insert on cars" ON cars
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on cars" ON cars
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on cars" ON cars
    FOR DELETE TO authenticated USING (true);

-- 3. Create policies for 'bookings'
-- Allow public to insert (make bookings)
CREATE POLICY "Allow public insert on bookings" ON bookings
    FOR INSERT TO public WITH CHECK (true);

-- Allow authenticated users (Admin) to select, update, delete
CREATE POLICY "Allow authenticated select on bookings" ON bookings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on bookings" ON bookings
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on bookings" ON bookings
    FOR DELETE TO authenticated USING (true);

-- 4. Create policies for 'messages'
-- Allow public to insert (send messages)
CREATE POLICY "Allow public insert on messages" ON messages
    FOR INSERT TO public WITH CHECK (true);

-- Allow authenticated users (Admin) to select, update, delete
CREATE POLICY "Allow authenticated select on messages" ON messages
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on messages" ON messages
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on messages" ON messages
    FOR DELETE TO authenticated USING (true);
