import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { submitBooking } from '../api/bookingApi';
import { Calendar, Clock, MapPin, Navigation, Car, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import LocationInput from './LocationInput';
import { cars } from '../data/cars';
import { Calculator, ChevronRight } from 'lucide-react';
import CarSelectionModal from './CarSelectionModal';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    date: '',
    time: '',
    carType: 'Sedan (Prime)',
    tripType: 'one-way'
  });
  const [status, setStatus] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const isHoverable = useHoverQuery();
  const [searchParams] = useSearchParams();

  // Listen for car selection from URL or event
  useEffect(() => {
    const carParam = searchParams.get('car');
    if (carParam) {
      const decodedCar = decodeURIComponent(carParam);
      // Check if it's a valid car name
      if (cars.some(c => c.name === decodedCar)) {
        setFormData(prev => ({ ...prev, carType: decodedCar }));
      }
    }

    // Listen for same-page event
    const handleSelectCar = (e) => {
      if (e.detail && cars.some(c => c.name === e.detail)) {
        setFormData(prev => ({ ...prev, carType: e.detail }));
      }
    };
    window.addEventListener('selectCar', handleSelectCar);
    return () => window.removeEventListener('selectCar', handleSelectCar);
  }, [searchParams]);

  const selectedCar = cars.find(c => c.name === formData.carType) || cars[1];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calculateFare = async () => {
    if (!formData.pickup || !formData.drop) {
      setStatus({ type: 'error', msg: 'Please enter both pickup and drop locations first.' });
      return;
    }

    setCalculating(true);
    setFareEstimate(null);
    try {
      // 1. Geocode Pickup
      const pickupRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickup)}&countrycodes=in&limit=1`);
      const pickupData = await pickupRes.json();
      
      // 2. Geocode Drop
      const dropRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.drop)}&countrycodes=in&limit=1`);
      const dropData = await dropRes.json();

      if (pickupData.length === 0 || dropData.length === 0) {
        throw new Error('Could not find one or both locations. Please be more specific.');
      }

      const pLat = pickupData[0].lat;
      const pLon = pickupData[0].lon;
      const dLat = dropData[0].lat;
      const dLon = dropData[0].lon;

      // 3. Get Distance from OSRM
      const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=false`);
      const osrmData = await osrmRes.json();

      if (!osrmData.routes || osrmData.routes.length === 0) {
        throw new Error('Could not calculate driving distance between these points.');
      }

      const distanceKm = osrmData.routes[0].distance / 1000;
      
      // 4. Calculate based on car type
      const selectedCar = cars.find(c => c.name === formData.carType);
      const pricePerKm = selectedCar ? selectedCar.pricePerKm : 14;
      
      let total = distanceKm * pricePerKm;
      if (formData.tripType === 'two-way') {
        total = total * 2;
      }

      setFareEstimate({
        distance: distanceKm.toFixed(1),
        total: Math.ceil(total)
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message || 'Error calculating fare.' });
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pickup.trim() && formData.pickup.trim().toLowerCase() === formData.drop.trim().toLowerCase()) {
      setStatus({ type: 'error', msg: 'Pickup and Drop locations cannot be the same.' });
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    setStatus({ type: 'loading', msg: 'Booking...' });
    try {
      await submitBooking(formData);
      setStatus({ type: 'success', msg: 'Booking successful! We will contact you shortly.' });
      setFormData({ name: '', phone: '', pickup: '', drop: '', date: '', carType: 'Sedan (Prime)' });
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Failed to book. Try again later.' });
    }
  };

  return (
    <div id="booking-section" className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl w-full max-w-lg mx-auto relative overflow-hidden border border-gray-100">
      {/* Decorative top strip */}
      <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
      
      <h2 className="text-2xl font-extrabold text-secondary mb-4 text-center">
        Book Your <span className="text-primary">Ride</span>
      </h2>

      {status && (
        <div className={`mb-4 p-3 rounded-lg text-sm text-center font-medium ${
          status.type === 'success' ? 'bg-green-100 text-green-700' : 
          status.type === 'error' ? 'bg-red-100 text-red-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              name="tripType" 
              value="one-way" 
              checked={formData.tripType === 'one-way'} 
              onChange={handleChange}
              className="w-5 h-5 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all"
            />
            <span className={`text-sm font-bold ${formData.tripType === 'one-way' ? 'text-secondary' : 'text-gray-400'} group-hover:text-secondary transition-colors`}>One Way</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              name="tripType" 
              value="two-way" 
              checked={formData.tripType === 'two-way'} 
              onChange={handleChange}
              className="w-5 h-5 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all"
            />
            <span className={`text-sm font-bold ${formData.tripType === 'two-way' ? 'text-secondary' : 'text-gray-400'} group-hover:text-secondary transition-colors`}>Round Trip (Two Way)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input 
              type="text" name="name" placeholder="Full Name" required 
              value={formData.name} onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input 
              type="tel" name="phone" placeholder="Phone No." required 
              value={formData.phone} onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm"
            />
          </div>
        </div>

        <LocationInput
          name="pickup"
          icon={MapPin}
          iconColorClass="text-primary"
          placeholder="Pickup Location (e.g. Indiranagar)"
          value={formData.pickup}
          onChange={handleChange}
        />

        <LocationInput
          name="drop"
          icon={Navigation}
          iconColorClass="text-secondary"
          placeholder="Drop Location (e.g. KIAL Airport)"
          value={formData.drop}
          onChange={handleChange}
          showCurrentLocation={false}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type={formData.date ? "date" : "text"}
              name="date" 
              placeholder="Date"
              required 
              value={formData.date} 
              onChange={handleChange}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm"
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type={formData.time ? "time" : "text"}
              name="time" 
              placeholder="Time"
              required 
              value={formData.time} 
              onChange={handleChange}
              onFocus={(e) => (e.target.type = "time")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm"
            />
          </div>
          <div className="relative col-span-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1 tracking-wider">Vehicle Type</label>
            <motion.button
              type="button"
              onClick={() => setIsCarModalOpen(true)}
              whileHover={isHoverable ? { backgroundColor: '#f9fafb', borderColor: '#ffc107' } : {}}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl transition-all"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl overflow-hidden mr-3 border border-gray-200 bg-white">
                  <img src={selectedCar.image} alt={selectedCar.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-secondary font-bold text-sm leading-none mb-1">{selectedCar.name}</p>
                  <p className="text-gray-400 text-xs">₹{selectedCar.pricePerKm}/km • {selectedCar.seats} Seats</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </motion.button>
          </div>
        </div>

        <CarSelectionModal 
          isOpen={isCarModalOpen} 
          onClose={() => setIsCarModalOpen(false)} 
          selectedCarName={formData.carType}
          onSelect={(car) => {
            setFormData({ ...formData, carType: car.name });
            setFareEstimate(null); // Reset fare when car changes
          }}
        />

        <div className="pt-2">
          {fareEstimate && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Estimated Fare ({fareEstimate.distance} km)</p>
                  <p className="text-2xl font-black text-secondary">₹{fareEstimate.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 italic">*Excl. Tolls & Parking</p>
                  <p className="text-xs font-bold text-primary">{formData.tripType === 'one-way' ? 'One Way' : 'Round Trip'}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button 
            type="button"
            onClick={calculateFare}
            disabled={calculating}
            whileHover={isHoverable ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-secondary font-bold py-3 rounded-xl border border-gray-200 transition-colors hover:bg-gray-200 mb-3"
          >
            {calculating ? (
              <span className="flex items-center animate-pulse">
                <Calculator className="animate-spin mr-2" size={18} />
                Estimating...
              </span>
            ) : (
              <>
                <Calculator size={18} />
                <span>Calculate Fare</span>
              </>
            )}
          </motion.button>

          <motion.button 
            whileHover={isHoverable && status?.type !== 'loading' ? { scale: 1.05 } : {}}
            whileTap={status?.type !== 'loading' ? { scale: 0.95 } : {}}
            type="submit" 
            disabled={status?.type === 'loading'}
            className="w-full bg-secondary text-primary font-bold py-4 rounded-xl shadow-md transition-shadow hover-desktop-only:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status?.type === 'loading' ? 'Processing...' : 'Book Now'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
