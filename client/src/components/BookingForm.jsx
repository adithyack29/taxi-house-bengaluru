import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Navigation, Car, User, Phone, Plane, Building2, Map as MapIcon, Calculator, ChevronRight, RefreshCw, ArrowRight, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import LocationInput from './LocationInput';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';
import TripPlanModal from './TripPlanModal';
import { generateTripSchedule } from '../utils/tripSchedule';

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
    stopDurations: [], // Durations for multi-stop in hours (0 = drive through, -1 = overnight)
    localPackage: '8 Hours / 80 KM',
    airportType: 'to-airport',
    estimatedDistance: null,
    daysRequired: 1
  });
  
  const [status, setStatus] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  
  // New states for Strategy Selection
  const [activeStrategy, setActiveStrategy] = useState('day-only');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [needsStrategySelection, setNeedsStrategySelection] = useState(false);
  const [isSearchDelayed, setIsSearchDelayed] = useState(false);

  const isHoverable = useHoverQuery();
  const [searchParams] = useSearchParams();
  const hasInitializedFromUrl = useRef(false);

  const getMinAllowedDateTime = () => new Date(Date.now() + 48 * 60 * 60 * 1000);
  const getMinDateStr = () => {
    const d = getMinAllowedDateTime();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [minDateStr, setMinDateStr] = useState(getMinDateStr());

  // Update min date indicator every minute
  useEffect(() => {
    const timer = setInterval(() => setMinDateStr(getMinDateStr()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper to add days to a date string (timezone safe)
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  };

  const isLongDistanceRoundTrip = activeTab === 'outstation' && 
    formData.tripType === 'two-way' && 
    ((formData.estimatedDistance && formData.estimatedDistance > 150) || (formData.daysRequired && formData.daysRequired > 1));

  const minReturnDate = formData.date 
    ? (isLongDistanceRoundTrip ? addDays(formData.date, 1) : formData.date) 
    : '';

  const maxReturnDate = formData.date ? addDays(formData.date, 7) : '';

  // Helper to get next available valid time slot with day rollover support
  const getNextAvailableTime = (baseDate = getMinAllowedDateTime()) => {
    const checkTime = new Date(baseDate);
    const originalDate = checkTime.getDate();
    
    // We strictly use the 48h buffer, no extra minutes needed here.
    
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
    if (hasInitializedFromUrl.current) return;

    // 1. Initial Defaults
    const { time: defaultTime, rolledOver } = getNextAvailableTime();
    const defaultDate = rolledOver ? addDays(minDateStr, 1) : minDateStr;

    // 2. Parse URL Params
    const parseCoord = (str) => {
      if (!str) return null;
      const [lat, lng] = str.split(',').map(Number);
      return (lat && lng) ? { lat, lng } : null;
    };

    const type = searchParams.get('type');
    if (type) setActiveTab(type);

    const stopsParam = searchParams.get('stops');
    const stopCoordsParam = searchParams.get('stopCoords');
    const stopDurationsParam = searchParams.get('stopDurations');

    setFormData(prev => ({
      ...prev,
      pickup: searchParams.get('pickup') || prev.pickup,
      pickupCoords: parseCoord(searchParams.get('pickupCoord')) || prev.pickupCoords,
      drop: searchParams.get('drop') || prev.drop,
      dropCoords: parseCoord(searchParams.get('dropCoord')) || prev.dropCoords,
      date: searchParams.get('date') || defaultDate,
      time: searchParams.get('time') || defaultTime,
      tripType: searchParams.get('trip') || prev.tripType,
      localPackage: searchParams.get('package') || prev.localPackage,
      airportType: searchParams.get('airport') || prev.airportType,
      returnDate: searchParams.get('returnDate') || prev.returnDate,
      stops: stopsParam ? JSON.parse(stopsParam) : prev.stops,
      stopCoords: stopCoordsParam ? JSON.parse(stopCoordsParam).map(parseCoord) : prev.stopCoords,
      stopDurations: stopDurationsParam ? JSON.parse(stopDurationsParam) : prev.stopDurations
    }));

    if (searchParams.get('strategy')) {
      setActiveStrategy(searchParams.get('strategy'));
    }

    const carParam = searchParams.get('car');
    if (carParam) {
      const decodedCar = decodeURIComponent(carParam);
      if (VEHICLE_OPTIONS.some(c => c.name === decodedCar)) {
        setFormData(prev => ({ ...prev, carType: decodedCar }));
      }
    }

    hasInitializedFromUrl.current = true;
  }, [searchParams, minDateStr]);

  const AIRPORT_NAME = "Kempegowda International Airport";

  const prevContextRef = useRef({ tab: 'outstation', trip: 'one-way', airport: 'to-airport' });

  // Reset/Sync fields when trip context changes (e.g. one-way to two-way, or switching tabs)
  useEffect(() => {
    if (!hasInitializedFromUrl.current) return;

    const isTabChanged = prevContextRef.current.tab !== activeTab;
    const isTripChanged = prevContextRef.current.trip !== formData.tripType;
    const isAirportTypeChanged = prevContextRef.current.airport !== formData.airportType;

    if (isTabChanged || isTripChanged || isAirportTypeChanged) {
      // Create the clean slate for the NEW context
      setFormData(prev => {
        const freshData = {
          ...prev,
          pickup: '',
          pickupCoords: null,
          drop: '',
          dropCoords: null,
          stops: [],
          stopCoords: [],
          stopDurations: [],
          estimatedDistance: null,
          routeLegs: null
        };

        // If switching to Airport tab or changing Airport direction, re-inject fixed values
        if (activeTab === 'airport') {
          const airportType = formData.airportType; 
          if (airportType === 'to-airport') {
            freshData.drop = AIRPORT_NAME;
            freshData.dropCoords = { lat: 13.1986, lng: 77.7066 };
          } else {
            freshData.pickup = AIRPORT_NAME;
            freshData.pickupCoords = { lat: 13.1986, lng: 77.7066 };
          }
        }
        
        return freshData;
      });

      setFareEstimate(null); // Clear fare estimates when changing routing scopes
      setNeedsStrategySelection(false); // Clear strategy alerts
      setActiveStrategy('day-only'); // Reset to default strategy
      prevContextRef.current = { tab: activeTab, trip: formData.tripType, airport: formData.airportType };
    }
  }, [activeTab, formData.tripType, formData.airportType]);

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
            // OSRM returns absolute node distance. For two-way without loop coords, distance naturally must be doubled for estimation.
            // Actually, we keep it as one-way distance and let ConfirmBooking handle * 2 for overall billing. 
            // BUT for our days calculation here, we must know total distance.
            const totalDistance = formData.tripType === 'two-way' ? distanceInKm * 2 : distanceInKm;
            const daysNeeded = Math.ceil(totalDistance / 300);
            
            // Map explicit legs for Schedule Generation
            const validStops = formData.stops.filter((_, idx) => formData.stopCoords[idx]);
            const legNames = [
              ...validStops,
              formData.drop || 'Destination'
            ];
            
            const routeLegs = data.routes[0].legs.map((leg, idx) => ({
              name: legNames[idx] || `Stop ${idx + 1}`,
              distance: leg.distance / 1000,
              durationHalt: formData.stopDurations[idx] || 0
            }));
            
            setFormData(prev => ({ 
              ...prev, 
              estimatedDistance: distanceInKm,
              daysRequired: daysNeeded,
              routeLegs: routeLegs
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
  }, [activeTab, formData.pickupCoords, formData.dropCoords, formData.stopCoords, formData.stopDurations, formData.tripType]);

  // Evaluate Travel Strategy Context
  useEffect(() => {
    if (activeTab === 'outstation' && formData.estimatedDistance) {
      const tripDistance = formData.tripType === 'two-way' ? formData.estimatedDistance * 2 : formData.estimatedDistance;
      const startHour = new Date(`${formData.date}T${formData.time}:00`).getHours();
      
      // If pickup is at or after 7 PM, or before 6 AM, default to expedited (Night Travel)
      if (startHour >= 19 || startHour < 6) {
        setNeedsStrategySelection(true);
        setActiveStrategy('expedited');
      } else if (tripDistance > 400) {
        // If distance is large enough that it naturally crosses into night
        setNeedsStrategySelection(true);
      } else {
        setNeedsStrategySelection(false);
        setActiveStrategy('day-only');
      }
    } else {
      // If distance is missing (form reset/refresh), hide the strategy selection
      setNeedsStrategySelection(false);
    }
  }, [formData.estimatedDistance, formData.date, formData.time, formData.tripType, activeTab]);

  // Auto-adjust return date for long-distance round trips
  useEffect(() => {
    if (activeTab === 'outstation' && formData.tripType === 'two-way') {
      const isLongDist = (formData.estimatedDistance && formData.estimatedDistance > 150) || (formData.daysRequired && formData.daysRequired > 1);
      if (isLongDist && formData.date && formData.returnDate && formData.returnDate <= formData.date) {
        setFormData(prev => ({ ...prev, returnDate: addDays(prev.date, 1) }));
      }
    }
  }, [formData.estimatedDistance, formData.daysRequired, formData.date, formData.tripType, activeTab]);

  const selectedCar = VEHICLE_OPTIONS.find(c => c.name === formData.carType) || VEHICLE_OPTIONS[0];

  // Calculate practical days based on strategy and distance
  const practicalDaysInfo = React.useMemo(() => {
    if (activeTab !== 'outstation' || !formData.estimatedDistance || !formData.routeLegs) {
      return { calendarDays: 1, minKm: 300, extraBataDays: 0, totalBataDays: 1, bataReasons: [] };
    }

    // Capture precise start time
    const startTimeFull = new Date(`${formData.date}T${formData.time || '10:00'}${formData.time?.split(':').length === 2 ? ':00' : ''}`);

    // Generate schedule to see when the journey actually encompasses based on distance/strategy
    const schedule = generateTripSchedule(
      formData.date,
      formData.time || '10:00',
      formData.returnDate || formData.date,
      formData.time || '10:00',
      formData.routeLegs,
      activeStrategy,
      formData.tripType
    );

    if (schedule.length === 0) return { calendarDays: 1, minKm: 300, extraBataDays: 0, totalBataDays: 1, bataReasons: [] };

    // Duration based on AI driving schedule (Halt-based)
    // Days = 1 + number of overnight halts
    const nightHalts = schedule.filter(item => item.title && (item.title === 'Night Halt' || item.title?.includes('Overnight'))).length;
    const chronoDays = 1 + nightHalts;

    // Duration based on User selected Return parameters (for two-way)
    let userDays = 1;
    if (formData.tripType === 'two-way' && formData.returnDate) {
      const returnTimeFull = new Date(`${formData.returnDate}T${formData.time || '10:00'}${formData.time?.split(':').length === 2 ? ':00' : ''}`);
      const userDurationHours = (returnTimeFull - startTimeFull) / (1000 * 60 * 60);
      userDays = Math.max(1, Math.ceil((userDurationHours - 2) / 24));
    }

    const isSameDay = formData.tripType === 'two-way' && formData.date && formData.date === formData.returnDate;
    const finalCalendarDays = isSameDay ? 1 : Math.max(chronoDays, userDays);
    const totalDistance = formData.tripType === 'two-way' ? formData.estimatedDistance * 2 : formData.estimatedDistance;
    const minBillableKm = formData.tripType === 'one-way' ? totalDistance : Math.max(totalDistance, finalCalendarDays * 300);

    // Driver duty hours (6:00 AM – 10:00 PM) evaluation
    let extraBataDays = 0;
    const bataReasons = [];
    if (formData.time) {
      const [pH, pM] = formData.time.split(':').map(Number);
      if (pH < 6) {
        extraBataDays += 1;
        bataReasons.push('Early pickup before 6:00 AM');
      } else if (pH > 22 || (pH === 22 && pM > 0)) {
        extraBataDays += 1;
        bataReasons.push('Late pickup after 10:00 PM');
      }
    }

    // Check drop time from schedule
    if (schedule && schedule.length > 0) {
      const lastEvent = schedule[schedule.length - 1];
      if (lastEvent && lastEvent.time) {
        const dropDate = new Date(lastEvent.time);
        const dH = dropDate.getHours();
        const dM = dropDate.getMinutes();
        if (dH < 6) {
          extraBataDays += 1;
          bataReasons.push('Early drop before 6:00 AM');
        } else if (dH > 22 || (dH === 22 && dM > 0)) {
          extraBataDays += 1;
          bataReasons.push('Late drop after 10:00 PM');
        }
      }
    }

    const totalBataDays = finalCalendarDays + extraBataDays;

    return {
      calendarDays: finalCalendarDays,
      minKm: Math.round(minBillableKm),
      extraBataDays,
      totalBataDays,
      bataReasons
    };
  }, [activeTab, formData.estimatedDistance, formData.routeLegs, formData.date, formData.time, formData.returnDate, activeStrategy, formData.tripType]);

  const handleChange = (e) => {
    const { name, value, coords } = e.target;
    
    // Trigger 2s delay if destination (drop) is modified
    if (name === 'drop' || name.startsWith('stop-')) {
      setIsSearchDelayed(true);
      const timer = setTimeout(() => setIsSearchDelayed(false), 2000);
      // Cleanup timer would be better but for this simple case a fresh timeout is fine
    }

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
        
        // Auto-set time: if min date, use nearest available; if future, default to 10 AM (standard)
        if (value === minDateStr) {
          const { time, rolledOver } = getNextAvailableTime();
          newData.time = time;
          if (rolledOver) {
            // Force tomorrow if today's booking window is closed
            newData.date = addDays(minDateStr, 1);
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
      stopCoords: [...prev.stopCoords, null],
      stopDurations: [...prev.stopDurations, 0]
    }));
  };

  const handleStopChange = (index, value, coords) => {
    const newStops = [...formData.stops];
    const newCoords = [...formData.stopCoords];
    newStops[index] = value;
    newCoords[index] = coords || null;
    setFormData(prev => ({ ...prev, stops: newStops, stopCoords: newCoords }));
  };
  
  const handleDurationChange = (index, val) => {
    const newDurations = [...formData.stopDurations];
    newDurations[index] = val;
    setFormData(prev => ({ ...prev, stopDurations: newDurations }));
  };

  const handleRemoveStop = (index) => {
    const newStops = formData.stops.filter((_, i) => i !== index);
    const newCoords = formData.stopCoords.filter((_, i) => i !== index);
    const newDurations = formData.stopDurations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stops: newStops, stopCoords: newCoords, stopDurations: newDurations }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 48-Hour Advance Booking Validation
    const pickupDateTime = new Date(`${formData.date}T${formData.time || '00:00'}:00`);
    const minCutoff = new Date(Date.now() + 48 * 60 * 60 * 1000);
    if (isNaN(pickupDateTime.getTime()) || pickupDateTime < minCutoff) {
      setStatus({ type: 'error', msg: 'Bookings must be scheduled at least 48 hours (2 full days) in advance.' });
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    // Validation: Return date is mandatory for Round Trips
    if (activeTab === 'outstation' && formData.tripType === 'two-way') {
      if (!formData.returnDate) {
        setStatus({ type: 'error', msg: 'Please select a Return Date for Round Trip.' });
        setTimeout(() => setStatus(null), 3000);
        return;
      }
      const isLongDistance = (formData.estimatedDistance && formData.estimatedDistance > 150) || (formData.daysRequired && formData.daysRequired > 1);
      if (isLongDistance && formData.returnDate <= formData.date) {
        setStatus({ type: 'error', msg: 'Same-day return is prohibited for long-distance round trips (>300 KM). Please select a later return date.' });
        setTimeout(() => setStatus(null), 4000);
        return;
      }
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
      stopCoords: JSON.stringify(formData.stopCoords.map(c => c ? `${c.lat},${c.lng}` : '')),
      stopDurations: JSON.stringify(formData.stopDurations)
    });

    // Add trip-specific params only if they belong to the active tab
    if (activeTab === 'outstation') {
      params.set('trip', formData.tripType);
      params.set('returnDate', formData.returnDate || '');
      params.set('strategy', activeStrategy);
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
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col flex-1 gap-2 border border-gray-100 rounded-xl bg-gray-50/50 p-2">
                          <LocationInput
                            name={`stop-${idx}`}
                            icon={MapPin}
                            iconColorClass="text-gray-400"
                            placeholder="add stop"
                            value={stop}
                            onChange={(e) => handleStopChange(idx, e.target.value, e.target.coords)}
                            showCurrentLocation={false}
                            className="bg-white"
                          />
                          <div className="flex items-center gap-2 pl-3">
                            <Clock size={12} className="text-gray-400 shrink-0" />
                            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Halt Time:</span>
                            <select 
                              className="text-[10px] sm:text-xs bg-transparent border-none text-secondary focus:outline-none focus:ring-0 cursor-pointer font-bold w-full"
                              value={formData.stopDurations[idx] || 0}
                              onChange={(e) => handleDurationChange(idx, Number(e.target.value))}
                            >
                              <option value={0}>Pass Through (No Wait)</option>
                              <option value={1}>Quick Stop (1 Hour)</option>
                              <option value={2}>Short Break (2 Hours)</option>
                              <option value={4}>Half Day (4 Hours)</option>
                              <option value={8}>Full Day (8 Hours)</option>
                              <option value={-1}>Overnight (Resumes Next 6 AM)</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveStop(idx)}
                          className="p-1 px-1.5 border-2 border-gray-100 rounded-full text-red-300 hover:border-red-400 hover:bg-red-50 transition-colors shrink-0 mt-3"
                        >
                          <span className="text-xl font-medium leading-none">×</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 2: Date & Time (Clean columns, no drop/return time input) */}
              {formData.tripType === 'two-way' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Date</label>
                    <CustomDatePicker 
                      name="date" 
                      required 
                      value={formData.date} 
                      onChange={handleChange} 
                      align="left" 
                      minDate={minDateStr}
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
                      isMinDate={formData.date === minDateStr}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Return Date</label>
                      {isLongDistanceRoundTrip && (
                        <span className="text-[9px] text-orange-600 font-bold">Min +1 day (&gt;300 KM)</span>
                      )}
                    </div>
                    <CustomDatePicker 
                      name="returnDate" 
                      required
                      value={formData.returnDate || ''} 
                      onChange={handleChange} 
                      align="right"
                      minDate={minReturnDate}
                      maxDate={maxReturnDate}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">Pickup Date</label>
                    <CustomDatePicker 
                      name="date" 
                      required 
                      value={formData.date} 
                      onChange={handleChange} 
                      align="left" 
                      minDate={minDateStr}
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
                      isMinDate={formData.date === minDateStr}
                    />
                  </div>
                </div>
              )}

              {formData.estimatedDistance && (
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 mt-6 mb-2 animate-in fade-in duration-300 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200/60 pb-3">
                    <h3 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                      <Calculator size={14} className="text-primary" />
                      Trip Quota Estimate
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowPlanModal(true)} 
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-[10px] sm:text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      View Trip Timeline
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 divide-x divide-slate-200/60 mt-2 text-center">
                    <div className="flex flex-col items-center justify-center p-2">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mb-1">Est. Distance</p>
                      <p className="text-xs sm:text-sm font-black text-secondary">{formData.tripType === 'two-way' ? (formData.estimatedDistance * 2).toFixed(0) : formData.estimatedDistance.toFixed(0)} KM</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mb-1">Driver Bata</p>
                      <p className="text-xs sm:text-sm font-black text-secondary">
                        {practicalDaysInfo.totalBataDays || practicalDaysInfo.calendarDays} Days
                      </p>
                      {practicalDaysInfo.extraBataDays > 0 ? (
                        <p className="text-[8px] text-orange-600 font-bold mt-0.5 leading-tight">
                          ({practicalDaysInfo.calendarDays} base + {practicalDaysInfo.extraBataDays} duty extra)
                        </p>
                      ) : (
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5 leading-tight">
                          (Standard 6 AM - 10 PM)
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center p-2">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mb-1">Billing Min.</p>
                      <p className="text-xs sm:text-sm font-black text-primary">
                        {practicalDaysInfo.minKm} KM
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold mt-0.5 leading-tight tracking-tight">
                        {formData.tripType === 'one-way' ? '(Actual Distance)' : '(300km/day standard)'}
                      </p>
                    </div>
                  </div>

                  {practicalDaysInfo.extraBataDays > 0 && (
                    <div className="mt-3 p-2.5 bg-amber-50 rounded-xl text-[9px] sm:text-[10px] font-bold text-amber-800 flex items-start gap-2 border border-amber-200">
                      <Clock size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <p>
                        <strong>Duty Window Notice:</strong> Includes +{practicalDaysInfo.extraBataDays} extra day Driver Bata for travel outside 6:00 AM – 10:00 PM standard operating hours ({practicalDaysInfo.bataReasons.join(', ')}).
                      </p>
                    </div>
                  )}

                  {/* Phase 3 UX: Warn the user if they stretched calendar arbitrarily beyond distance limits */}
                  {(formData.tripType === 'two-way' && formData.returnDate) && (
                     Math.max(1, Math.ceil((new Date(formData.returnDate) - new Date(formData.date)) / (1000 * 60 * 60 * 24)) + 1) > (Math.ceil((formData.estimatedDistance * 2) / 300) || 1)
                  ) && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-[9px] sm:text-[10px] font-bold text-yellow-700 flex items-start gap-1.5 border border-yellow-100">
                      <span className="shrink-0 pt-0.5">⚠️</span>
                      <p>Your return date holds the driver longer than the estimated driving distance requires. You will be billed for the extra idle Calendar Days.</p>
                    </div>
                  )}
                </div>
              )}

              {needsStrategySelection && (
                <div className="bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-100 mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-secondary flex items-center gap-2">
                      <Clock size={16} className="text-orange-500" />
                      Travel Strategy Details
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">This journey spans into night hours. Please select how the driver should proceed.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setActiveStrategy('day-only')}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${activeStrategy === 'day-only' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sun size={16} className={activeStrategy === 'day-only' ? 'text-primary' : 'text-gray-400'} />
                        <p className={`text-xs font-black ${activeStrategy === 'day-only' ? 'text-primary' : 'text-gray-500'}`}>Standard (Day Only)</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Driving pauses at 10 PM. Journey resumes next morning at 6 AM. Relaxed pace.</p>
                    </div>

                    <div 
                      onClick={() => setActiveStrategy('expedited')}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${activeStrategy === 'expedited' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Moon size={16} className={activeStrategy === 'expedited' ? 'text-primary' : 'text-gray-400'} />
                        <p className={`text-xs font-black ${activeStrategy === 'expedited' ? 'text-primary' : 'text-gray-500'}`}>Expedited (Night Drive)</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Driver continues uninterrupted through the night. (Night allowance charges apply).</p>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSearchDelayed}
                className={`w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase ${isSearchDelayed ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSearchDelayed ? 'Verifying...' : 'Search Available Cars'}
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
                                { value: '8 Hours / 80 KM', label: '8 Hours / 80 KM' }
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
                    minDate={minDateStr}
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
                    isMinDate={formData.date === minDateStr}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSearchDelayed}
                className={`w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase ${isSearchDelayed ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSearchDelayed ? 'Verifying...' : 'Search Available Cars'}
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
                      minDate={minDateStr}
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
                      isMinDate={formData.date === minDateStr}
                    />
                  </div>
                </div>
              </div>


              <button 
                type="submit" 
                disabled={isSearchDelayed}
                className={`w-full bg-[#eb5e1c] text-white font-black py-3 sm:py-4 rounded-xl shadow-lg ring-2 ring-orange-500/20 hover:bg-[#d45115] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base tracking-wide mt-2 uppercase ${isSearchDelayed ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSearchDelayed ? 'Verifying...' : 'Search Available Cars'}
              </button>
            </div>
          )}

          {/* Urgent Booking Note */}
          <div className="mt-4 p-3 sm:p-4 bg-orange-50/80 border border-orange-100 rounded-xl flex items-start gap-2.5 sm:gap-3">
            <div className="bg-orange-100 p-1.5 rounded-full text-orange-600 shrink-0 mt-0.5">
              <Phone size={14} className="sm:w-4 sm:h-4" />
            </div>
            <p className="text-[10px] sm:text-xs text-orange-800 font-medium leading-snug pt-0.5">
              <strong className="font-black text-orange-900">Urgent Booking?</strong> For bookings within <span className="font-black underline decoration-orange-300 underline-offset-2">48 hours,</span> please contact our customer support directly.
            </p>
          </div>

        </form>
      </div>

      <TripPlanModal 
        isOpen={showPlanModal} 
        onClose={() => setShowPlanModal(false)}
        formData={formData}
        strategy={activeStrategy}
      />
    </div>
  );
};

export default BookingForm;
