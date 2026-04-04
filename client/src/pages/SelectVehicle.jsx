import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, MapPin, Calendar, Clock, User, Phone, CheckCircle, ChevronLeft, ArrowRight, Loader2, Info, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';
import { formatDate, formatTime } from '../utils/formatters';

const SelectVehicle = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // Trip details from URL
  const tripDetails = {
    pickup: searchParams.get('pickup') || 'Not specified',
    drop: searchParams.get('drop') || 'Local Trip',
    date: searchParams.get('date'),
    time: searchParams.get('time'),
    type: searchParams.get('type') || 'outstation',
    trip: searchParams.get('trip'),
    package: searchParams.get('package'),
    airport: searchParams.get('airport')
  };

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_available', true);
        
        if (error) throw error;
        setCars(data || []);
      } catch (err) {
        console.error('Error fetching cars:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
    window.scrollTo(0, 0);
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingStatus({ type: 'loading', msg: 'Preparing payment...' });

    const stops = JSON.parse(searchParams.get('stops') || '[]');
    const tripCategory = searchParams.get('type');
    const subType = searchParams.get('type') === 'airport' ? searchParams.get('airport') : searchParams.get('trip');
    const returnDate = searchParams.get('returnDate');
    const localPackage = searchParams.get('package');
    
    // Test Amount: ₹1 (100 paise)
    const testAmount = 1;

    try {
      // 1. Load Razorpay Script
      const res = await loadRazorpay();
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 2. Create Order on our backend
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: testAmount,
          currency: 'INR',
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to initialize payment order.');
      }

      const orderData = await orderResponse.json();

      // 3. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TaxiHouse Bengaluru',
        description: `Booking for ${selectedCar.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          setBookingStatus({ type: 'loading', msg: 'Verifying payment...' });

          // 4. Verify Payment on our backend
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.status === 'success') {
            // 5. Create Booking in Supabase on successful payment
            const { error: supabaseError } = await supabase
              .from('bookings')
              .insert([{
                user_name: formData.name,
                phone: formData.phone,
                pickup: tripDetails.pickup,
                drop_off: tripDetails.drop,
                booking_date: tripDetails.date,
                booking_time: tripDetails.time,
                car_type: selectedCar.name,
                trip_category: tripCategory,
                sub_type: subType,
                return_date: returnDate || null,
                local_package: localPackage || null,
                stops: stops,
                status: 'confirmed', // Mark as confirmed since paid
                amount: testAmount,
                payment_status: 'paid',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }]);

            if (supabaseError) throw supabaseError;

            setBookingStatus({ type: 'success', msg: 'Payment Successful! Booking Confirmed.' });
            setTimeout(() => navigate('/'), 5000);
          } else {
            setBookingStatus({ type: 'error', msg: 'Payment verification failed. Please contact support.' });
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone,
        },
        theme: {
          color: '#F97316', // Primary orange color
        },
        modal: {
          ondismiss: function() {
            setBookingStatus(null);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error('Booking/Payment Error:', err);
      setBookingStatus({ type: 'error', msg: err.message || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-6 sm:pt-12">
      <main className="flex-grow container mx-auto px-4 py-4 max-w-7xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-secondary mb-6 transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} />
          <span>Modify Search</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-sm font-black text-secondary uppercase tracking-tight mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                <Info size={16} className="text-primary" />
                Trip Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Trip Information</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/10">
                      {tripDetails.type}
                    </span>
                    <span className="px-3 py-1 bg-secondary/5 text-secondary text-[10px] font-black uppercase rounded-lg border border-secondary/10">
                      {tripDetails.type === 'local' ? tripDetails.package : tripDetails.trip || tripDetails.airport}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative pl-6 border-l-2 border-dashed border-gray-100">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-50" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Location</p>
                    <p className="text-sm font-bold text-secondary">{tripDetails.pickup}</p>
                  </div>

                  {tripDetails.stops && JSON.parse(tripDetails.stops || '[]').length > 0 && (
                    <div className="space-y-4">
                      {JSON.parse(tripDetails.stops).map((stop, idx) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-dashed border-gray-100">
                          <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-50" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Stop {idx + 1}</p>
                          <p className="text-sm font-bold text-secondary">{stop}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative pl-6 border-l-2 border-dashed border-gray-100">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Destination</p>
                    <p className="text-sm font-bold text-secondary">{tripDetails.drop}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Date</p>
                    <p className="text-sm font-black text-secondary uppercase tracking-tighter">
                      {formatDate(tripDetails.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Time</p>
                    <p className="text-sm font-black text-secondary uppercase tracking-tighter">{formatTime(tripDetails.time)}</p>
                  </div>
                </div>

                {tripDetails.returnDate && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-orange-500 uppercase">Return Date</p>
                    <p className="text-sm font-black text-orange-600 uppercase tracking-tighter">
                      {formatDate(tripDetails.returnDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-secondary flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Available <span className="text-primary italic">Vehicles</span>
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Searching our fleet...</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                <Car className="mx-auto text-gray-200 mb-4" size={60} />
                <p className="text-secondary font-black text-lg mb-2">No cars available right now</p>
                <p className="text-gray-500 text-sm">Please try a different date or call us directly for assistance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cars.map((car) => (
                  <motion.div
                    key={car.id}
                    layoutId={car.id}
                    className={`bg-white rounded-3xl border-2 transition-all p-5 cursor-pointer flex flex-col sm:flex-row items-center gap-6 ${
                      selectedCar?.id === car.id 
                        ? 'border-primary shadow-lg shadow-orange-500/10 ring-4 ring-primary/5' 
                        : 'border-gray-100 hover:border-gray-200 shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedCar(car);
                      setBookingStatus(null);
                    }}
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-primary/40 shrink-0">
                      <Car size={40} />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h4 className="text-xl font-black text-secondary">{car.name}</h4>
                      <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                          <User size={14} className="text-primary" /> {car.seats} Seats
                        </span>
                        <span className="text-xs font-bold text-primary">
                          ₹{car.price_per_km}/km
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-4 sm:pt-0">
                      {selectedCar?.id === car.id ? (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                          <CheckCircle size={24} />
                        </div>
                      ) : (
                        <div className="text-xs font-black text-primary uppercase flex items-center gap-2 group">
                          Select <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Confirm Details Modal/Form */}
            <AnimatePresence>
              {selectedCar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-primary/20 ring-4 ring-primary/5 space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-secondary">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-secondary">Confirm Contact Details</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Final step to book your {selectedCar.name}</p>
                    </div>
                  </div>

                  {bookingStatus?.type === 'success' ? (
                    <div className="bg-green-50 p-6 rounded-2xl text-center space-y-3">
                      <CheckCircle className="mx-auto text-green-500" size={48} />
                      <h4 className="text-lg font-black text-green-800">Booking Confirmed!</h4>
                      <p className="text-sm text-green-700">Redirecting you back to home page...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBooking} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <input
                              type="text"
                              required
                              placeholder="Enter your name"
                              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <input
                              type="tel"
                              required
                              placeholder="Enter mobile number"
                              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {bookingStatus?.type === 'error' && (
                        <p className="text-xs text-red-500 font-bold text-center">{bookingStatus.msg}</p>
                      )}

                      <button
                        type="submit"
                        disabled={bookingStatus?.type === 'loading'}
                        className="w-full bg-secondary text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all text-base uppercase flex items-center justify-center gap-3"
                      >
                        {bookingStatus?.type === 'loading' ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={20} />
                            <span>{bookingStatus.msg || 'Processing...'}</span>
                          </div>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            Pay ₹1 & Confirm Booking
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectVehicle;
