import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { submitBooking } from '../api/bookingApi';
import { Calendar, Clock, MapPin, Navigation, Car, User, Phone, Plane, Building2, Map as MapIcon, Calculator, ChevronRight, RefreshCw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import LocationInput from './LocationInput';
import { cars } from '../data/cars';
import CarSelectionModal from './CarSelectionModal';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';

const BookingForm = () => {
  const [activeTab, setActiveTab] = useState('outstation'); // 'outstation', 'local', 'airport'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    carType: 'Sedan (Prime)',
    tripType: 'one-way', // for outstation: one-way/two-way
    stops: [], // New multi-stop support for outstation
    localPackage: '8hr/80km',
    airportType: 'to-airport' // to-airport/from-airport
  });
  
  const [status, setStatus] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  const isHoverable = useHoverQuery();
  const [searchParams] = useSearchParams();

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to add days to a date string
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const maxReturnDate = formData.date ? addDays(formData.date, 7) : '';

  // Helper to get next available valid time slot
  const getNextAvailableTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const minutes = now.getMinutes();
    let roundedMinutes;
    
    if (minutes < 15) roundedMinutes = 15;
    else if (minutes < 30) roundedMinutes = 30;
    else if (minutes < 45) roundedMinutes = 45;
    else {
      roundedMinutes = 0;
      now.setHours(now.getHours() + 1);
    }
    
    const h = now.getHours().toString().padStart(2, '0');
    const m = roundedMinutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  useEffect(() => {
    // Set initial available time
    setFormData(prev => ({ ...prev, time: getNextAvailableTime() }));
    
    const carParam = searchParams.get('car');
    if (carParam) {
      const decodedCar = decodeURIComponent(carParam);
      if (cars.some(c => c.name === decodedCar)) {
        setFormData(prev => ({ ...prev, carType: decodedCar }));
      }
    }

    const handleSelectCar = (e) => {
      if (e.detail && cars.some(c => c.name === e.detail)) {
        setFormData(prev => ({ ...prev, carType: e.detail }));
      }
    };
    window.addEventListener('selectCar', handleSelectCar);
    return () => window.removeEventListener('selectCar', handleSelectCar);
  }, [searchParams]);

  const AIRPORT_NAME = "Kempegowda International Airport";

  // Sync airport name based on type
  useEffect(() => {
    if (activeTab === 'airport') {
      if (formData.airportType === 'to-airport') {
        setFormData(prev => ({ ...prev, drop: AIRPORT_NAME, pickup: '' }));
      } else {
        setFormData(prev => ({ ...prev, pickup: AIRPORT_NAME, drop: '' }));
      }
    }
  }, [activeTab, formData.airportType]);

  const selectedCar = cars.find(c => c.name === formData.carType) || cars[1];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If pickup date changes and return date is now before it or too far after, reset return date
      if (name === 'date') {
        const newMax = addDays(value, 7);
        if (prev.returnDate && (prev.returnDate < value || prev.returnDate > newMax)) {
          newData.returnDate = value;
        }
        
        // Auto-set time: if today, use nearest available; if future, default to 12 AM
        if (value === todayStr) {
          newData.time = getNextAvailableTime();
        } else {
          newData.time = '00:00';
        }
      }
      
      return newData;
    });
  };

  const handleAddStop = () => {
    setFormData(prev => ({ ...prev, stops: [...prev.stops, ''] }));
  };

  const handleStopChange = (index, value) => {
    const newStops = [...formData.stops];
    newStops[index] = value;
    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const handleRemoveStop = (index) => {
    const newStops = formData.stops.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const calculateFare = async () => {
    if (!formData.pickup || (activeTab !== 'local' && !formData.drop)) {
      setStatus({ type: 'error', msg: 'Please enter required locations first.' });
      return;
    }

    setCalculating(true);
    setFareEstimate(null);
    try {
      // Simulate/Calculate logic
      const pickupRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickup)}&countrycodes=in&limit=1`);
      const pickupData = await pickupRes.json();
      
      let distanceKm = 15; // default/fallback
      if (pickupData.length > 0 && formData.drop) {
        const dropRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.drop)}&countrycodes=in&limit=1`);
        const dropData = await dropRes.json();
        
        if (dropData.length > 0) {
          const pLat = pickupData[0].lat;
          const pLon = pickupData[0].lon;
          const dLat = dropData[0].lat;
          const dLon = dropData[0].lon;
          const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=false`);
          const osrmData = await osrmRes.json();
          if (osrmData.routes && osrmData.routes.length > 0) {
            distanceKm = osrmData.routes[0].distance / 1000;
          }
        }
      }

      const pricePerKm = selectedCar ? selectedCar.pricePerKm : 14;
      let total = distanceKm * pricePerKm;
      
      if (activeTab === 'outstation' && formData.tripType === 'two-way') {
        total = total * 2;
      } else if (activeTab === 'local') {
        // Mock local pricing
        total = formData.localPackage.includes('8hr') ? 2500 : 1500;
      } else if (activeTab === 'airport') {
        total = 800; // Flat airport rate mock
      }

      setFareEstimate({
        distance: distanceKm.toFixed(1),
        total: Math.ceil(total)
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error calculating fare.' });
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'Booking...' });
    try {
      await submitBooking({ ...formData, category: activeTab });
      setStatus({ type: 'success', msg: 'Booking successful! We will contact you shortly.' });
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      setStatus({ type: 'error', msg: 'Failed to book. Try again later.' });
    }
  };

  const tabs = [
    { id: 'outstation', label: 'Outstation', icon: MapIcon },
    { id: 'local', label: 'Local', icon: Building2 },
    { id: 'airport', label: 'Airport', icon: Plane },
  ];

  return (
    <div id="booking-section" className="bg-white rounded-3xl shadow-2xl w-full max-w-full mx-auto relative overflow-hidden border border-gray-100">
      {/* Tab Navigation */}
      <div className="flex bg-gray-50/80 border-b border-gray-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFareEstimate(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 text-xs sm:text-sm font-bold transition-all relative ${
                isActive ? 'text-secondary' : 'text-gray-400 hover:text-secondary/70'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-black text-secondary mb-5 flex items-center space-x-3">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <span>Book Your <span className="text-primary italic">Perfect Ride</span></span>
        </h2>

        {status && (
          <div className={`mb-4 p-3 rounded-xl text-xs text-center font-bold ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 
            status.type === 'error' ? 'bg-red-50 text-red-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Specific Selectors based on Tab */}
          {activeTab === 'outstation' && (
            <div className="flex justify-center mb-6">
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                {[
                  { id: 'two-way', label: 'Round Trip', icon: RefreshCw },
                  { id: 'one-way', label: 'One Way', icon: ArrowRight }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.tripType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tripType: type.id })}
                      className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-white text-orange-600 shadow-sm ring-1 ring-gray-100' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={14} className={isSelected ? 'text-orange-500' : 'text-gray-400'} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'outstation' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Row 1: From/To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">From</label>
                  <LocationInput
                    name="pickup"
                    icon={MapPin}
                    iconColorClass="text-gray-400"
                    placeholder="Pickup"
                    value={formData.pickup}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">To</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <LocationInput
                        name="drop"
                        icon={MapPin}
                        iconColorClass="text-gray-400"
                        placeholder="destination"
                        value={formData.drop}
                        onChange={handleChange}
                        showCurrentLocation={false}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddStop}
                      className="p-1 px-1.5 border-2 border-gray-100 rounded-full text-blue-400 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-xl font-medium leading-none">+</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Stops Grid */}
              {formData.stops.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.stops.map((stop, idx) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <LocationInput
                            name={`stop-${idx}`}
                            icon={MapPin}
                            iconColorClass="text-gray-400"
                            placeholder="add stop"
                            value={stop}
                            onChange={(e) => handleStopChange(idx, e.target.value)}
                            showCurrentLocation={false}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveStop(idx)}
                          className="p-1 px-1.5 border-2 border-gray-100 rounded-full text-red-300 hover:border-red-400 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <span className="text-xl font-medium leading-none">×</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 2: Date/Time/Return */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Date</label>
                  <CustomDatePicker 
                    name="date" 
                    required 
                    value={formData.date} 
                    onChange={handleChange} 
                    align="left" 
                    minDate={todayStr}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Time *</label>
                  <CustomTimePicker 
                    name="time" 
                    required 
                    value={formData.time} 
                    onChange={handleChange} 
                    align="center"
                    isToday={formData.date === todayStr}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Return Date</label>
                  <CustomDatePicker 
                    name="returnDate" 
                    required={formData.tripType === 'two-way'}
                    disabled={formData.tripType === 'one-way'}
                    value={formData.returnDate || ''} 
                    onChange={handleChange} 
                    align="right"
                    minDate={formData.date || todayStr}
                    maxDate={maxReturnDate}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#eb5e1c] text-white font-black py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-base tracking-wide mt-4 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          ) : activeTab === 'local' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Row 1: City & Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">City</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input 
                      type="text" 
                      readOnly 
                      value="Bangalore"
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none text-base font-medium text-secondary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Package</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                      className="w-full flex items-center pl-10 pr-10 py-3.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 transition text-base font-medium text-secondary text-left relative"
                    >
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <span>{formData.localPackage || "Select Duration"}</span>
                      <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${isPackageDropdownOpen ? 'rotate-90' : 'rotate-0'}`} size={16} />
                    </button>

                    <AnimatePresence>
                      {isPackageDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[110]" onClick={() => setIsPackageDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[120] overflow-hidden"
                          >
                            <div className="py-1">
                              {[
                                { value: '4hr/40km', label: '4 Hours / 40 KM' },
                                { value: '8hr/80km', label: '8 Hours / 80 KM' },
                                { value: '12hr/120km', label: '12 Hours / 120 KM' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, localPackage: option.value });
                                    setIsPackageDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors ${
                                    formData.localPackage === option.value 
                                      ? 'bg-primary/10 text-primary' 
                                      : 'text-secondary hover:bg-gray-50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Row 2: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Date</label>
                  <CustomDatePicker 
                    name="date" 
                    required 
                    value={formData.date} 
                    onChange={handleChange} 
                    align="left" 
                    minDate={todayStr}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Time *</label>
                  <CustomTimePicker 
                    name="time" 
                    required 
                    value={formData.time} 
                    onChange={handleChange} 
                    align="right" 
                    isToday={formData.date === todayStr}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#eb5e1c] text-white font-black py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-base tracking-wide mt-4 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Airport Tab Content */}
              <div className="flex justify-center mb-4">
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  {[
                    { id: 'to-airport', label: 'To Airport', icon: Plane },
                    { id: 'from-airport', label: 'From Airport', icon: Building2 }
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.airportType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, airportType: type.id })}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                          isSelected ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-100' : 'text-gray-400'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
                      {formData.airportType === 'from-airport' ? 'Airport' : 'Pickup'}
                    </label>
                    <LocationInput
                      name="pickup"
                      icon={MapPin}
                      placeholder={formData.airportType === 'from-airport' ? AIRPORT_NAME : "Pickup Location"}
                      value={formData.pickup}
                      onChange={handleChange}
                      disabled={formData.airportType === 'from-airport'}
                      className={formData.airportType === 'from-airport' ? "bg-gray-50 border-none cursor-not-allowed" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
                      {formData.airportType === 'to-airport' ? 'Airport' : 'Destination'}
                    </label>
                    <LocationInput
                      name="drop"
                      icon={Navigation}
                      placeholder={formData.airportType === 'to-airport' ? AIRPORT_NAME : "Drop Location"}
                      value={formData.drop}
                      onChange={handleChange}
                      showCurrentLocation={false}
                      disabled={formData.airportType === 'to-airport'}
                      className={formData.airportType === 'to-airport' ? "bg-gray-50 border-none cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Date</label>
                    <CustomDatePicker 
                      name="date" 
                      required 
                      value={formData.date} 
                      onChange={handleChange} 
                      align="left" 
                      minDate={todayStr}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Time</label>
                    <CustomTimePicker 
                      name="time" 
                      required 
                      value={formData.time} 
                      onChange={handleChange} 
                      align="right" 
                      isToday={formData.date === todayStr}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#eb5e1c] text-white font-black py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-base tracking-wide mt-4 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          )}

          <CarSelectionModal 
            isOpen={isCarModalOpen} 
            onClose={() => setIsCarModalOpen(false)} 
            selectedCarName={formData.carType}
            onSelect={(car) => {
              setFormData({ ...formData, carType: car.name });
              setFareEstimate(null);
            }}
          />

        </form>
      </div>
    </div>
  );
};

export default BookingForm;
