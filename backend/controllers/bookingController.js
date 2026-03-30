let bookings = [];
let idCounter = 1;

export const createBooking = (req, res) => {
  const { name, phone, pickup, drop, date, carType } = req.body;
  
  if (!name || !phone || !pickup || !drop || !date || !carType) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const newBooking = {
    id: idCounter++,
    name,
    phone,
    pickup,
    drop,
    date,
    carType,
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  
  return res.status(201).json({
    message: 'Booking created successfully',
    booking: newBooking
  });
};

export const getBookings = (req, res) => {
  return res.status(200).json(bookings);
};
