-- 1. Create Cars table
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    seats INTEGER NOT NULL,
    price_per_km NUMERIC NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pickup TEXT NOT NULL,
    drop_off TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    car_type TEXT NOT NULL,
    trip_category TEXT, -- outstation, local, airport
    sub_type TEXT,      -- one-way, round-trip, to-airport, from-airport
    return_date DATE,   -- for round trips
    local_package TEXT, -- for local rentals (e.g. 8hr/80km)
    stops JSONB DEFAULT '[]', -- JSON array of strings for intermediate stops
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Insert some initial trial data for cars
INSERT INTO cars (name, seats, price_per_km, is_available) VALUES
('Mini', 4, 12, true),
('Prime Sedan', 4, 15, true),
('SUV', 6, 20, true);
