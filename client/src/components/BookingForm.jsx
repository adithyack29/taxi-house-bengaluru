import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Navigation, Car, User, Phone, Plane, Building2, Map as MapIcon, Calculator, ChevronRight, RefreshCw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import LocationInput from './LocationInput';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';

const VEHICLE_OPTIONS = [
  { id: '21-seater-ac', name: '21 Seater AC Bus', seats: 21, pricePerKm: 34, icon: Car },
  { id: '40-seater-ac', name: '40 Seater AC Bus', seats: 40, pricePerKm: 64, icon: Car },
  { id: '50-seater-ac', name: '50 Seater AC Bus', seats: 50, pricePerKm: 58, icon: Car },
  { id: 'luxury-bus', name: 'Luxury Bus', seats: 40, pricePerKm: 75, icon: Car },
];

const BookingForm = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('outstation'); // 'outstation', 'local', 'airport'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickup: '',
    pickupCoords: null,
    drop: '',
    dropCoords: null,
    date: new Date().toISOString().split('T')[0],
    time: '',
    carType: 'Sedan (Prime)',
    tripType: 'one-way', // for outstation: one-way/two-way
    stops: [], // New multi-stop support for outstation
    stopCoords: [], // Coordinates for multi-stop
    localPackage: '8hr/80km',
    airportType: 'to-airport',
    returnTime: '12:00', // Default return time
    estimatedDistance: null,
    daysRequired: 1
  });
  
  const [status, setStatus] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  const isHoverable = useHoverQuery();
  const [searchParams] = useSearchParams();

  const getTodayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [todayStr, setTodayStr] = useState(getTodayStr());

  // Update today indicator every minute
  useEffect(() => {
    const timer = setInterval(() => setTodayStr(getTodayStr()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper to add days to a date string
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const maxReturnDate = formData.date ? addDays(formData.date, 7) : '';

  // Helper to get next available valid time slot with day rollover support
  const getNextAvailableTime = (baseDate = new Date()) => {
    const checkTime = new Date(baseDate);
    const originalDate = checkTime.getDate();
    
    // Add 30m buffer
    checkTime.setMinutes(checkTime.getMinutes() + 30);
    
    const minutes = checkTime.getMinutes();
    let roundedMinutes;
    
    if (minutes < 15) roundedMinutes = 15;
    else if (minutes < 30) roundedMinutes = 30;
    else if (minutes < 45) roundedMinutes = 45;
    else {
      roundedMinutes = 0;
      checkTime.setHours(checkTime.getHours() + 1);
    }
    
    const h = checkTime.getHours().toString().padStart(2, '0');
    const m = roundedMinutes.toString().padStart(2, '0');
    
    return {
      time: `${h}:${m}`,
      rolledOver: checkTime.getDate() !== originalDate
    };
  };

  useEffect(() => {
    // Set initial available time and check for mid-night rollover
    const { time, rolledOver } = getNextAvailableTime();
    const initialDate = rolledOver ? addDays(todayStr, 1) : todayStr;

    setFormData(prev => ({ 
      ...prev, 
      time,
      date: initialDate
    }));
    
    const carParam = searchParams.get('car');
    if (carParam) {
      const decodedCar = decodeURIComponent(carParam);
      if (VEHICLE_OPTIONS.some(c => c.name === decodedCar)) {
        setFormData(prev => ({ ...prev, carType: decodedCar }));
      }
    }
  }, [searchParams, todayStr]);

  const AIRPORT_NAME = "Kempegowda International Airport";

  // Sync airport name based on type
  useEffect(() => {
    if (activeTab === 'airport') {
      if (formData.airportType === 'to-airport') {
        setFormData(prev => ({ 
          ...prev, 
          drop: AIRPORT_NAME, 
          dropCoords: { lat: 13.1986, lng: 77.7066 }, // Yelahanka/Airport Coords
          pickup: prev.pickup === AIRPORT_NAME ? '' : prev.pickup,
          pickupCoords: prev.pickup === AIRPORT_NAME ? null : prev.pickupCoords
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          pickup: AIRPORT_NAME, 
          pickupCoords: { lat: 13.1986, lng: 77.7066 },
          drop: prev.drop === AIRPORT_NAME ? '' : prev.drop,
          dropCoords: prev.drop === AIRPORT_NAME ? null : prev.dropCoords
        }));
      }
    } else {
      // Clear airport name when moving away from airport tab
      setFormData(prev => ({
        ...prev,
        pickup: prev.pickup === AIRPORT_NAME ? '' : prev.pickup,
        drop: prev.drop === AIRPORT_NAME ? '' : prev.drop
      }));
    }
  }, [activeTab, formData.airportType]);

  // Fetch Road Distance for Outstation
  useEffect(() => {
    const fetchDistance = async () => {
      if (activeTab === 'outstation' && formData.pickupCoords && formData.dropCoords) {
        setCalculating(true);
        try {
          const coordsArr = [
            `${formData.pickupCoords.lng},${formData.pickupCoords.lat}`,
            ...formData.stopCoords.filter(c => c).map(c => `${c.lng},${c.lat}`),
            `${formData.dropCoords.lng},${formData.dropCoords.lat}`
          ].join(';');

          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsArr}?overview=false`);
          const data = await res.json();

          if (data.code === 'Ok' && data.routes && data.routes[0]) {
            const distanceInKm = data.routes[0].distance / 1000;
            const daysNeeded = Math.ceil(distanceInKm / 300);
            setFormData(prev => ({ 
              ...prev, 
              estimatedDistance: distanceInKm,
              daysRequired: daysNeeded
            }));
          }
        } catch (err) {
          console.error('Error fetching OSRM distance:', err);
        } finally {
          setCalculating(false);
        }
      }
    };

    fetchDistance();
  }, [activeTab, formData.pickupCoords, formData.dropCoords, formData.stopCoords]);

  const selectedCar = VEHICLE_OPTIONS.find(c => c.name === formData.carType) || VEHICLE_OPTIONS[0];

  const handleChange = (e) => {
    const { name, value, coords } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Store coordinates if provided (from LocationInput)
      if (coords) {
        newData[`${name}Coords`] = coords;
      }
      
      // If pickup date changes and return date is now before it or too far after, reset return date
      if (name === 'date') {
        const newMax = addDays(value, 7);
        if (prev.returnDate && (prev.returnDate < addDays(value, prev.daysRequired || 1))) {
          newData.returnDate = addDays(value, prev.daysRequired || 1);
        }
        
        // Auto-set time: if today, use nearest available (considering rollover); if future, default to 10 AM (standard)
        if (value === todayStr) {
          const { time, rolledOver } = getNextAvailableTime();
          newData.time = time;
          if (rolledOver) {
            // Force tomorrow if today's booking window is closed
            newData.date = addDays(todayStr, 1);
          }
        } else {
          newData.time = '10:00';
        }
      }
      
      return newData;
    });
  };

  const handleAddStop = () => {
    setFormData(prev => ({ 
      ...prev, 
      stops: [...prev.stops, ''],
      stopCoords: [...prev.stopCoords, null]
    }));
  };

  const handleStopChange = (index, value, coords) => {
    const newStops = [...formData.stops];
    const newCoords = [...formData.stopCoords];
    newStops[index] = value;
    newCoords[index] = coords || null;
    setFormData(prev => ({ ...prev, stops: newStops, stopCoords: newCoords }));
  };

  const handleRemoveStop = (index) => {
    const newStops = formData.stops.filter((_, i) => i !== index);
    const newCoords = formData.stopCoords.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stops: newStops, stopCoords: newCoords }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: Return date is mandatory for Round Trips
    if (activeTab === 'outstation' && formData.tripType === 'two-way' && !formData.returnDate) {
      setStatus({ type: 'error', msg: 'Please select a Return Date for Round Trip.' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    // Redirect to car selection page with query params
    const params = new URLSearchParams({
      pickup: formData.pickup,
      pickupCoord: formData.pickupCoords ? `${formData.pickupCoords.lat},${formData.pickupCoords.lng}` : '',
      drop: formData.drop,
      dropCoord: formData.dropCoords ? `${formData.dropCoords.lat},${formData.dropCoords.lng}` : '',
      date: formData.date,
      time: formData.time,
      type: activeTab,
      stops: JSON.stringify(formData.stops),
      stopCoords: JSON.stringify(formData.stopCoords.map(c => c ? `${c.lat},${c.lng}` : ''))
    });

    // Add trip-specific params only if they belong to the active tab
    if (activeTab === 'outstation') {
      params.set('trip', formData.tripType);
      params.set('returnDate', formData.returnDate || '');
      params.set('returnTime', formData.returnTime || '');
    } else if (activeTab === 'local') {
      params.set('package', formData.localPackage);
    } else if (activeTab === 'airport') {
      params.set('airport', formData.airportType);
    }
    
    navigate(`/select-vehicle?${params.toString()}`);
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
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 sm:py-4 text-[10px] sm:text-sm font-bold transition-all relative ${
                isActive ? 'text-secondary' : 'text-gray-400 hover:text-secondary/70'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-primary' : 'text-gray-400'} />
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

      <div className="px-3 py-4 sm:p-8">
        <h2 className="text-base sm:text-2xl font-black text-secondary mb-3 flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
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
            <div className="flex justify-center mb-4 sm:mb-6">
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
                      className={`flex items-center space-x-2 px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-white text-orange-600 shadow-sm ring-1 ring-gray-100' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={12} className={isSelected ? 'text-orange-500' : 'text-gray-400'} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'outstation' ? (
            <div className="space-y-3 sm:space-y-8 animate-in fade-in duration-300">
              {/* Row 1: From/To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    minDate={addDays(formData.date, formData.daysRequired || 1)}
                    maxDate={maxReturnDate}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Return Time</label>
                  <CustomTimePicker 
                    name="returnTime" 
                    required={formData.tripType === 'two-way'}
                    disabled={formData.tripType === 'one-way'}
                    value={formData.returnTime || ''} 
                    onChange={handleChange} 
                    align="right"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          ) : activeTab === 'local' ? (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              {/* Row 1: City & Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                className="w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
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
                className="w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase"
              >
                Search Available Cars
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default BookingForm;
