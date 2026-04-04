import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Calendar, Clock, User, Phone, CheckCircle, 
  ChevronLeft, ArrowRight, Loader2, Info, CreditCard, 
  ShieldCheck, AlertCircle, IndianRupee, Users, Wind, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';
import { formatDate, formatTime } from '../utils/formatters';

const ConfirmBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [roadDistance, setRoadDistance] = useState(null);

  // Safe JSON parsing helper
  const safeParseArr = (val) => {
    try {
      return JSON.parse(val || '[]');
    } catch {
      return [];
    }
  };

  // Trip details from URL
  const tripDetails = {
    carId: searchParams.get('carId'),
    pickup: searchParams.get('pickup') || 'Not specified',
    pickupCoords: searchParams.get('pickupCoord'),
    drop: searchParams.get('drop') || (searchParams.get('type') === 'local' ? 'Local Trip' : 'Not specified'),
    dropCoords: searchParams.get('dropCoord'),
    date: searchParams.get('date'),
    time: searchParams.get('time'),
    type: searchParams.get('type') || 'outstation',
    trip: searchParams.get('trip'),
    package: searchParams.get('package'),
    airport: searchParams.get('airport'),
    returnDate: searchParams.get('returnDate'),
    stops: safeParseArr(searchParams.get('stops')),
    stopCoords: safeParseArr(searchParams.get('stopCoords'))
  };

  useEffect(() => {
    const initPage = async () => {
      if (!tripDetails.carId) {
        navigate('/select-vehicle');
        return;
      }

      setLoading(true);
      try {
        // Fetch Car Details
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', tripDetails.carId)
          .single();
        
        if (error) throw error;
        setCar(data);

        // Fetch Road Distance if coords are available
        if (tripDetails.pickupCoords && tripDetails.dropCoords) {
          const coords = [
            tripDetails.pickupCoords,
            ...tripDetails.stopCoords.filter(c => c),
            tripDetails.dropCoords
          ].filter(Boolean);

          // OSRM expects lng,lat
          const osrmCoords = coords.map(c => {
            const [lat, lng] = c.split(',');
            return `${lng},${lat}`;
          }).join(';');

          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=false`);
          const routeData = await res.json();
          
          if (routeData.code === 'Ok' && routeData.routes && routeData.routes[0]) {
            const distanceInKm = routeData.routes[0].distance / 1000;
            // For round trips, we double the distance
            const totalDistance = tripDetails.trip === 'two-way' ? distanceInKm * 2 : distanceInKm;
            setRoadDistance(totalDistance);
          }
        }
      } catch (err) {
        console.error('Error initializing confirmation page:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
    window.scrollTo(0, 0);
  }, [tripDetails.carId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingStatus({ type: 'loading', msg: 'Preparing payment...' });

    const tripCategory = tripDetails.type;
    const subType = tripDetails.type === 'airport' ? tripDetails.airport : tripDetails.trip;
    
    // Test Amount: ₹1 (100 paise)
    const testAmount = 1;

    try {
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load.');

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: testAmount, currency: 'INR' }),
      });

      if (!orderResponse.ok) throw new Error('Failed to initialize payment.');
      const orderData = await orderResponse.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TaxiHouse Bengaluru',
        description: `Booking for ${car.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          setBookingStatus({ type: 'loading', msg: 'Verifying payment...' });

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
            const { error: supabaseError } = await supabase
              .from('bookings')
              .insert([{
                user_name: formData.name,
                phone: formData.phone,
                pickup: tripDetails.pickup,
                drop_off: tripDetails.drop,
                booking_date: tripDetails.date,
                booking_time: tripDetails.time,
                car_type: car.name,
                trip_category: tripCategory,
                sub_type: subType,
                return_date: tripDetails.returnDate || null,
                local_package: tripDetails.package || null,
                stops: tripDetails.stops,
                status: 'confirmed',
                amount: testAmount,
                payment_status: 'paid',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }]);

            if (supabaseError) throw supabaseError;
            setBookingStatus({ type: 'success', msg: 'Booking Confirmed!' });
            setTimeout(() => navigate('/'), 3000);
          } else {
            setBookingStatus({ type: 'error', msg: 'Payment verification failed.' });
          }
        },
        prefill: { name: formData.name, contact: formData.phone },
        theme: { color: '#F97316' },
        modal: { ondismiss: () => setBookingStatus(null) }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      setBookingStatus({ type: 'error', msg: err.message || 'Payment failed.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Initialising Secure Checkout...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle size={60} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-secondary mb-2">Vehicle Not Found</h2>
        <p className="text-gray-500 mb-6 max-w-xs">We couldn't retrieve the vehicle details. It might have been updated or removed.</p>
        <button 
          onClick={() => navigate('/select-vehicle')}
          className="bg-primary text-secondary px-8 py-3 rounded-2xl font-black uppercase text-sm shadow-lg shadow-primary/20"
        >
          Back to Vehicles
        </button>
      </div>
    );
  }

  // Robust Fare Calculation
  const minKm = car.min_km || 250;
  const pricePerKm = car.price_per_km || 0;
  const driverBata = car.driver_bata || 0;
  const nightBata = car.night_bata || 0;

  let effectiveKm = minKm;
  let baseFare = 0;
  let totalEstimated = 0;

  if (tripDetails.type === 'local') {
    // Local Package Pricing: Extract KM from string (e.g., "8 Hours / 80 KM" -> 80)
    const pkgKmMatch = tripDetails.package?.match(/(\d+)\s*KM/i);
    const pkgKm = pkgKmMatch ? parseInt(pkgKmMatch[1], 10) : 80;
    effectiveKm = pkgKm;
    baseFare = Math.round(pkgKm * pricePerKm);
    totalEstimated = baseFare; // No bata for local by default
  } else if (tripDetails.type === 'airport') {
    // Airport Flat Estimation
    effectiveKm = 40;
    baseFare = Math.round(40 * pricePerKm);
    totalEstimated = baseFare;
  } else {
    // Outstation Distance Calculation
    effectiveKm = roadDistance ? Math.max(minKm, roadDistance) : minKm;
    baseFare = Math.round(effectiveKm * pricePerKm);
    totalEstimated = baseFare + driverBata + nightBata;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-secondary mb-8 transition-all hover:-translate-x-1 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
        >
          <ChevronLeft size={18} />
          <span>Back to Vehicles</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Row 1 / Col 1: Trip Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 h-full"
          >
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-secondary/40">
              <div className="w-4 h-0.5 bg-primary rounded-full" />
              Trip Summary
              <div className="w-4 h-0.5 bg-primary rounded-full" />
            </h3>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                  <p className="text-lg font-black text-secondary tracking-tight">{formatDate(tripDetails.date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                  <p className="text-lg font-black text-secondary tracking-tight">{formatTime(tripDetails.time)}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center mb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trip Type</p>
                  <p className="text-sm font-black text-secondary uppercase tracking-tight">
                    {tripDetails.type === 'outstation' ? 'Outstation' : 
                     tripDetails.type === 'local' ? 'Local Trip' : 
                     tripDetails.type === 'airport' ? 'Airport Transfer' : tripDetails.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Details</p>
                  <p className="text-sm font-black text-primary uppercase tracking-tight">
                    {tripDetails.type === 'local' ? tripDetails.package : 
                     (tripDetails.trip === 'two-way' ? 'Round Trip' : 
                      tripDetails.trip === 'one-way' ? 'One Way' : 
                      tripDetails.airport === 'to-airport' ? 'To Airport' :
                      tripDetails.airport === 'from-airport' ? 'From Airport' : 
                      (tripDetails.trip || tripDetails.airport || 'N/A'))}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-primary/30">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                  <p className="text-sm font-bold text-secondary line-clamp-2 leading-relaxed">{tripDetails.pickup}</p>
                </div>

                {tripDetails.stops && tripDetails.stops.length > 0 && (
                  <div className="space-y-6">
                    {tripDetails.stops.map((stop, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-gray-100">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] border-2 border-white" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stop {idx + 1}</p>
                        <p className="text-sm font-bold text-secondary line-clamp-2 leading-relaxed">{stop}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative pl-6 border-l-2 border-gray-100">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-gray-200 border-2 border-white" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-secondary line-clamp-2 leading-relaxed">{tripDetails.drop}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.name} className="w-full h-full object-contain" />
                    ) : (
                      <Car size={24} className="text-primary/30" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Vehicle</p>
                    <p className="text-sm font-black text-secondary leading-tight">{car.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Seats</p>
                  <p className="text-sm font-black text-secondary leading-tight">{car.seats} pax</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 1 / Col 2: Fare Estimation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative h-full"
          >
            <div className="absolute top-0 right-0 p-4">
              <IndianRupee className="text-primary/5" size={120} />
            </div>
            <h3 className="text-base font-black text-secondary uppercase tracking-[0.1em] mb-8 border-b border-gray-50 pb-4">
              <span className="text-yellow-500">Estimated</span> Fare
            </h3>
            <div className="space-y-6 relative z-10">
              {roadDistance && (
                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Distance</p>
                    <p className="text-sm font-black text-secondary">{roadDistance.toFixed(1)} KM Total</p>
                  </div>
                  {roadDistance < car.min_km && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-lg border border-primary/20">
                      {car.min_km}KM Min Applied
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-500">Base Fare <span className="text-[10px] text-gray-400 font-medium">({effectiveKm % 1 === 0 ? effectiveKm : effectiveKm.toFixed(1)} KM used)</span></p>
                  <p className="text-[10px] text-gray-400 font-black uppercase">₹{pricePerKm}/km</p>
                </div>
                <p className="text-sm font-black text-secondary">₹{(baseFare || 0).toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-500">Driver Bata <span className="text-[10px] text-gray-400 font-medium">(Night Stay)</span></p>
                <p className="text-sm font-black text-secondary">₹{(driverBata || 0).toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-500">Night Bata <span className="text-[10px] text-gray-400 font-medium">(Night Allowance)</span></p>
                <p className="text-sm font-black text-secondary">₹{(nightBata || 0).toLocaleString()}</p>
              </div>
              <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Estimated Total</p>
                  <p className="text-[10px] text-gray-400 font-bold max-w-[150px] leading-tight">Excluding State Permit & Tolls</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-secondary tracking-tight">₹{(totalEstimated || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
                <ShieldCheck className="text-green-500" size={20} />
                <div>
                  <p className="text-[11px] font-black text-secondary uppercase">Secure Pricing</p>
                  <p className="text-[10px] text-gray-500 font-medium">Transparent billing with no hidden fees</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 2 / Col 1: Inclusions / Exclusions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-gray-200/30 border border-gray-100 h-full"
          >
            <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-8 flex items-center gap-2 border-b border-gray-50 pb-4">
              <ShieldCheck size={16} className="text-primary" />
              Inclusions & Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-500 mt-0.5">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary uppercase tracking-tight">Driver & Fuel</p>
                    <p className="text-[11px] text-gray-400 font-medium">Included in base fare and bata</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mt-0.5">
                    <Info size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary uppercase tracking-tight">State Permit</p>
                    <p className="text-[11px] text-gray-400 font-medium">Approx ₹{car.permit_charge || 0} (Paid at border)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mt-0.5">
                    <AlertCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary uppercase tracking-tight">Toll & Parking</p>
                    <p className="text-[11px] text-gray-400 font-medium">Payable as per actual usage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mt-0.5">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary uppercase tracking-tight">Night Allowance</p>
                    <p className="text-[11px] text-gray-400 font-medium">Applicable 10 PM - 6 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 2 / Col 2: Confirm Details (Contact Form) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 h-full flex flex-col"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-secondary tracking-tight">Confirm Details</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ready to book your ride?</p>
              </div>
            </div>

            {bookingStatus?.type === 'success' ? (
              <div className="bg-green-50 p-10 rounded-[2rem] text-center space-y-4 border border-green-100 my-auto">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-green-200">
                  <CheckCircle size={40} />
                </div>
                <h4 className="text-2xl font-black text-green-800">Booking Confirmed!</h4>
                <p className="text-sm text-green-700 font-medium">Redirecting you to the home page...</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-6 flex-grow">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold text-secondary"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="tel"
                        required
                        placeholder="Contact Number"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold text-secondary"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  {bookingStatus?.type === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 p-4 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold border border-red-100 mb-4"
                    >
                      <AlertCircle size={16} />
                      {bookingStatus.msg}
                    </motion.div>
                  )}

                  <div className="flex justify-center mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Pay small token amount to confirm ride
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingStatus?.type === 'loading'}
                    className="w-full bg-black text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-black/20 hover:bg-black/90 hover:-translate-y-1 active:translate-y-0 transition-all text-base uppercase flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {bookingStatus?.type === 'loading' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Pay Token & Confirm Ride
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;
