import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Calendar, Clock, User, Phone, CheckCircle, 
  ChevronLeft, ArrowRight, Loader2, Info, CreditCard, 
  ShieldCheck, AlertCircle, IndianRupee, Users, Wind, Zap, Calculator, RotateCcw,
  Sun, Moon, FastForward, Timer, MessageCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadCashfree } from '../utils/cashfree';
import { formatDate, formatTime } from '../utils/formatters';
import { LOCAL_VEHICLES } from '../constants/localVehicles';
import LocationInput from '../components/LocationInput';
import TripPlanModal from '../components/TripPlanModal';
import FareDetailModal from '../components/FareDetailModal';
import { generateTripSchedule } from '../utils/tripSchedule';

const getVehicleCategory = (name) => {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('sedan') || lowerName.includes('dzire') || lowerName.includes('etios') || lowerName.includes('amaze')) {
    return 'Sedan';
  }
  if (lowerName.includes('suv') || lowerName.includes('muv') || lowerName.includes('innova') || lowerName.includes('crysta') || lowerName.includes('ertiga') || lowerName.includes('carens')) {
    return 'SUV / MUV';
  }
  if (lowerName.includes('hatchback') || lowerName.includes('swift')) {
    return 'Hatchback';
  }
  if (lowerName.includes('tempo') || lowerName.includes('traveller') || lowerName.match(/\btt\b/)) {
    return 'Tempo Traveller';
  }
  if (lowerName.includes('bus')) {
    return 'Bus';
  }
  return null;
};

const ConfirmBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [roadDistance, setRoadDistance] = useState(null);
  const [routeLegs, setRouteLegs] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTripPlanOpen, setIsTripPlanOpen] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(searchParams.get('strategy') || 'day-only');
  const [refinedPickup, setRefinedPickup] = useState('');
  const [refinedPickupCoords, setRefinedPickupCoords] = useState(null);
  const [hasPet, setHasPet] = useState(false);
  const agreementCardRef = React.useRef(null);
  const [agreementError, setAgreementError] = useState(false);

  // Trip details from URL
  const tripDetails = useMemo(() => {
    const safeParseArr = (val) => {
      try { return JSON.parse(val || '[]'); } catch { return []; }
    };
    return {
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
      returnTime: searchParams.get('returnTime') || null,
      stops: safeParseArr(searchParams.get('stops')),
      stopCoords: safeParseArr(searchParams.get('stopCoords')),
      stopDurations: safeParseArr(searchParams.get('stopDurations'))
    };
  }, [searchParams]);

  const isWhatsAppBooking = tripDetails.type === 'local' || 
                            tripDetails.type === 'airport' || 
                            (tripDetails.type === 'outstation' && tripDetails.trip === 'one-way');

  // Pricing Helpers
  const minKm = car?.min_km || 300;
  const pricePerKm = (tripDetails.trip === 'one-way' ? car?.price_per_km_one_way : car?.price_per_km) || 0;
  const driverBata = car?.driver_bata || 300;
  const nightBata = car?.night_bata || driverBata; // Fallback to driver bata if missing

  // Driver Operational Duty Hours (6:00 AM – 10:00 PM) evaluation
  const dutyInfo = useMemo(() => {
    let extraBataDays = 0;
    const reasons = [];

    // Check Pickup Time (< 6 AM or > 10 PM)
    if (tripDetails.time) {
      const [pH, pM] = tripDetails.time.split(':').map(Number);
      if (pH < 6) {
        extraBataDays += 1;
        reasons.push('Early pickup before 6:00 AM');
      } else if (pH > 22 || (pH === 22 && pM > 0)) {
        extraBataDays += 1;
        reasons.push('Late pickup after 10:00 PM');
      }
    }

    // Check Drop Time (> 10 PM or < 6 AM)
    let dropDate = null;
    if (routeLegs && routeLegs.length > 0) {
      const sched = generateTripSchedule(
        tripDetails.date,
        tripDetails.time,
        tripDetails.returnDate,
        tripDetails.time || '10:00',
        routeLegs,
        selectedScenario || 'day-only',
        tripDetails.trip
      );
      if (sched.length > 0) {
        dropDate = new Date(sched[sched.length - 1].time);
      }
    } else if (tripDetails.date && tripDetails.time) {
      const pDate = new Date(`${tripDetails.date}T${tripDetails.time}:00`);
      if (tripDetails.type === 'local') {
        dropDate = new Date(pDate.getTime() + 8 * 60 * 60 * 1000);
      } else if (tripDetails.type === 'airport') {
        dropDate = new Date(pDate.getTime() + 2 * 60 * 60 * 1000);
      } else {
        const estDist = roadDistance || minKm;
        const estHours = Math.ceil(estDist / 45);
        dropDate = new Date(pDate.getTime() + estHours * 60 * 60 * 1000);
      }
    }

    if (dropDate && !isNaN(dropDate.getTime())) {
      const dH = dropDate.getHours();
      const dM = dropDate.getMinutes();
      if (dH < 6) {
        extraBataDays += 1;
        reasons.push('Early drop before 6:00 AM');
      } else if (dH > 22 || (dH === 22 && dM > 0)) {
        extraBataDays += 1;
        reasons.push('Late drop after 10:00 PM');
      }
    }

    const extraBataAmount = extraBataDays * driverBata;

    return {
      extraBataDays,
      extraBataAmount,
      reasons,
      dropDate
    };
  }, [tripDetails.date, tripDetails.time, tripDetails.returnDate, tripDetails.type, tripDetails.trip, routeLegs, selectedScenario, roadDistance, minKm, driverBata]);

  // 1. Scenario Calculation Logic (HOOK - MUST BE AT TOP)
  const scenarios = useMemo(() => {
    if (!car || (tripDetails.type !== 'outstation')) return null;

    const pickupD = new Date(`${tripDetails.date}T${tripDetails.time}:00`);
    const returnD = tripDetails.returnDate 
      ? new Date(`${tripDetails.returnDate}T${tripDetails.time || '10:00'}:00`) 
      : pickupD;
    const userHours = (returnD - pickupD) / (1000 * 60 * 60);
    const userDays = Math.max(1, Math.ceil((userHours - 2) / 24)); 
    // ^ 2h grace period for the return leg.

    const distanceVal = roadDistance || minKm;
    const distanceDays = Math.ceil(distanceVal / 300);
    
    // Helper to get real chronological days and nights from schedule
    const getChronoDays = (strategy) => {
      if (!routeLegs || routeLegs.length === 0) return null;
      const sched = generateTripSchedule(
        tripDetails.date,
        tripDetails.time,
        tripDetails.returnDate,
        tripDetails.time || '10:00',
        routeLegs,
        strategy,
        tripDetails.trip
      );
      if (sched.length < 2) return { days: 1, nights: 0, schedHours: 0 };
      
      const start = new Date(sched[0].time);
      const end = new Date(sched[sched.length - 1].time);
      
      // 1. Halt-based Day Calculation
      // Days = 1 + number of overnight halts
      const nightHalts = sched.filter(item => item.title && (item.title === 'Night Halt' || item.title?.includes('Overnight'))).length;
      const days = 1 + nightHalts;

      // 2. Night Window Detection (10 PM - 6 AM)
      // We check if the trip duration overlaps with any 10 PM - 6 AM window
      let nights = 0;
      let checkPointer = new Date(start);
      // Advance hour by hour to see how many Night Windows are touched
      const nightWindowsTouched = new Set();
      
      while (checkPointer < end) {
        const hour = checkPointer.getHours();
        if (hour >= 22 || hour < 6) {
          // Identify which 'calendar night' this belongs to (noon-to-noon window)
          const nightId = new Date(checkPointer);
          if (hour < 6) nightId.setDate(nightId.getDate() - 1);
          nightWindowsTouched.add(nightId.toDateString());
        }
        checkPointer.setHours(checkPointer.getHours() + 1);
      }
      // Check the final 'end' time too
      const endHour = end.getHours();
      if (endHour >= 22 || endHour < 6) {
        const nightId = new Date(end);
        if (endHour < 6) nightId.setDate(nightId.getDate() - 1);
        nightWindowsTouched.add(nightId.toDateString());
      }
      
      nights = nightWindowsTouched.size;
      const schedHours = (end - start) / (1000 * 60 * 60);

      return { days, nights, schedHours };
    };

    const isSameDay = tripDetails.date === tripDetails.returnDate;
    const dayOnlySched = getChronoDays('day-only');
    let dayOnlyDays = Math.max(userDays, (dayOnlySched?.days) || 1);
    if (isSameDay) dayOnlyDays = 1;
    
    const dayOnlyNights = (dayOnlySched?.nights) || 0;
    
    let dayOnlyBataDays = dayOnlyDays;
    let dayOnlyBataNights = dayOnlyNights;
    if (dayOnlySched && Math.max(userHours, dayOnlySched.schedHours) <= 12) {
      dayOnlyBataDays = 1;
      dayOnlyBataNights = 0;
    }

    // Incorporate Duty Hours extra day Bata
    dayOnlyBataDays += dutyInfo.extraBataDays;
    
    const dayOnlyMinKmValue = tripDetails.trip === 'one-way' ? 0 : 300 * dayOnlyDays;
    const dayOnlyBillingKm = Math.max(distanceVal, dayOnlyMinKmValue);
    const dayOnlyBaseValue = Math.round(dayOnlyBillingKm * pricePerKm);
    const dayOnlyNightBataValue = 0; // Standard mode never pays Night Allowance (handled by Driver Bata)
    const dayOnlyDayBataValue = dayOnlyBataDays * driverBata;

    // Expedited Calculation
    const expeditedSched = getChronoDays('expedited');
    let expeditedDays = Math.max(userDays, (expeditedSched?.days) || 1);
    if (isSameDay) expeditedDays = 1;
    
    const expeditedNights = (expeditedSched?.nights) || 0;

    let expeditedBataDays = expeditedDays;
    let expeditedBataNights = expeditedNights;
    if (expeditedSched && Math.max(userHours, expeditedSched.schedHours) <= 12) {
      expeditedBataDays = 1;
      expeditedBataNights = 0;
    }

    // Incorporate Duty Hours extra day Bata
    expeditedBataDays += dutyInfo.extraBataDays;
    
    const expeditedMinKmValue = tripDetails.trip === 'one-way' ? 0 : 300 * expeditedDays;
    const expeditedBillingKm = Math.max(distanceVal, expeditedMinKmValue);
    const expeditedBaseValue = Math.round(expeditedBillingKm * pricePerKm);
    const expeditedDayBataValue = expeditedBataDays * driverBata;
    const expeditedNightBataValue = expeditedBataNights * nightBata;

    return {
      'day-only': {
        days: dayOnlyBataDays,
        nights: 0, // Standard mode count is 0 for Night Allowance purposes
        billingKm: dayOnlyBillingKm,
        baseFare: dayOnlyBaseValue,
        dayBata: dayOnlyDayBataValue,
        nightBataValue: 0,
        total: dayOnlyBaseValue + dayOnlyDayBataValue,
        label: 'Standard (Day Only)',
        desc: 'Relaxed pace, daytime only. Safer for long routes.',
        icon: Sun
      },
      'expedited': {
        days: expeditedBataDays,
        nights: expeditedBataNights,
        billingKm: expeditedBillingKm,
        baseFare: expeditedBaseValue,
        dayBata: expeditedDayBataValue,
        nightBataValue: expeditedNightBataValue,
        total: expeditedBaseValue + expeditedDayBataValue + expeditedNightBataValue,
        label: 'Expedited (Day & Night)',
        desc: 'Faster arrival with night driving shifts.',
        icon: Moon
      }
    };
  }, [car, roadDistance, tripDetails, pricePerKm, minKm, driverBata, nightBata, routeLegs, dutyInfo.extraBataDays]);

  // Main Fare Setup Logic
  let effectiveKm = minKm;
  let baseFare = 0;
  let totalEstimated = 0;

  if (tripDetails.type === 'local') {
    baseFare = car?.base_fare || 2100;
    totalEstimated = baseFare + dutyInfo.extraBataAmount;
    tripDetails.totalDayBata = dutyInfo.extraBataAmount;
    tripDetails.bataDays = dutyInfo.extraBataDays;
  } else if (tripDetails.type === 'airport') {
    effectiveKm = 40;
    baseFare = Math.round(40 * pricePerKm);
    totalEstimated = baseFare + dutyInfo.extraBataAmount;
    tripDetails.totalDayBata = dutyInfo.extraBataAmount;
    tripDetails.bataDays = dutyInfo.extraBataDays;
  } else if (scenarios) {
    const current = scenarios[selectedScenario] || scenarios['day-only'];
    effectiveKm = current.billingKm;
    baseFare = current.baseFare;
    totalEstimated = current.total;
    
    tripDetails.bataDays = current.days;
    tripDetails.totalNights = current.nights;
    tripDetails.baseFare = current.baseFare;
    tripDetails.totalDayBata = current.dayBata;
    tripDetails.totalNightBata = current.nightBataValue;
    tripDetails.totalFare = current.total;
  }

  tripDetails.extraBataDays = dutyInfo.extraBataDays;
  tripDetails.extraBataAmount = dutyInfo.extraBataAmount;
  tripDetails.extraBataReasons = dutyInfo.reasons;

  const petFee = hasPet ? 750 : 0;
  totalEstimated += petFee;

  const calculatedToken = Math.floor((totalEstimated * 0.15) / 100) * 100;
  const baseTokenAmount = calculatedToken > 0 ? calculatedToken : Math.max(1, Math.round(totalEstimated * 0.15));
  
  const tokenAmount = baseTokenAmount;

  useEffect(() => {
    const initPage = async () => {
      if (!tripDetails.carId) {
        navigate('/select-vehicle');
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', tripDetails.carId)
          .single();
        if (error) throw error;
        setCar(data);

        if (tripDetails.pickupCoords && tripDetails.dropCoords) {
          const coords = [tripDetails.pickupCoords, ...tripDetails.stopCoords.filter(c => c), tripDetails.dropCoords].filter(Boolean);
          const osrmCoords = coords.map(c => {
            if (!c || typeof c !== 'string' || !c.includes(',')) return null;
            const [lat, lng] = c.split(',');
            return `${lng},${lat}`;
          }).filter(Boolean).join(';');
          
          if (!osrmCoords) {
            setLoading(false);
            return;
          }
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=false`);
          const routeData = await res.json();
          if (routeData.code === 'Ok' && routeData.routes && routeData.routes[0]) {
            const distanceInKm = routeData.routes[0].distance / 1000;
            const totalDistance = tripDetails.trip === 'two-way' ? distanceInKm * 2 : distanceInKm;
            setRoadDistance(totalDistance);
            
            // Map OSRM legs to stop names and durations
            const stops = tripDetails.stops || [];
            const durations = tripDetails.stopDurations || [];
            const names = [...stops, tripDetails.drop];
            
            const legs = routeData.routes[0].legs.map((l, i) => ({
              distance: l.distance / 1000,
              name: names[i] || 'Stop',
              durationHalt: durations[i] || 0
            }));
            setRouteLegs(legs);
          }
        }

        // Initialize Refined Location for Local
        if (tripDetails.type === 'local') {
          if (tripDetails.pickup === 'Not specified' || !tripDetails.pickup) {
            setRefinedPickup('Bangalore');
            setRefinedPickupCoords({ lat: 12.9716, lng: 77.5946 }); 
          } else {
            setRefinedPickup(tripDetails.pickup);
            if (tripDetails.pickupCoords && typeof tripDetails.pickupCoords === 'string' && tripDetails.pickupCoords.includes(',')) {
               const [lat, lng] = tripDetails.pickupCoords.split(',').map(Number);
               setRefinedPickupCoords({ lat, lng });
            }
          }
        } else {
          setRefinedPickup(tripDetails.pickup);
          if (tripDetails.pickupCoords && typeof tripDetails.pickupCoords === 'string' && tripDetails.pickupCoords.includes(',')) {
            const [lat, lng] = tripDetails.pickupCoords.split(',').map(Number);
            setRefinedPickupCoords({ lat, lng });
          }
        }
      } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
    };
    initPage();
    window.scrollTo(0, 0);
  }, [tripDetails.carId, tripDetails.stops, tripDetails.stopCoords, navigate]);

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!acceptTerms) {
      setAgreementError(true);
      if (agreementCardRef.current) {
        agreementCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setAgreementError(false);

    const tripCategory = tripDetails.type;
    const subType = tripDetails.type === 'airport' ? tripDetails.airport : tripDetails.trip;
    const amount = tokenAmount;

    const audit_data = {
      roadDistance,
      effectiveKm,
      pricePerKm,
      baseFare,
      totalDayBata: tripDetails.totalDayBata,
      totalNightBata: tripDetails.totalNightBata,
      bataDays: tripDetails.bataDays,
      totalNights: tripDetails.totalNights,
      nightBata,
      minKm,
      routeLegs,
      selectedScenario,
      hasPet,
      petFee,
      extraBataDays: dutyInfo.extraBataDays,
      extraBataAmount: dutyInfo.extraBataAmount,
      extraBataReasons: dutyInfo.reasons,
      dutyWindowPolicy: 'Standard driver duty hours: 6:00 AM – 10:00 PM. +1 extra day Driver Bata applies if pickup or drop exceeds duty hours.'
    };

    // If Local, Airport, or Outstation One-Way: Redirect to WhatsApp checkout
    if (isWhatsAppBooking) {
      setBookingStatus({ type: 'loading', msg: 'Preparing WhatsApp confirmation...' });
      try {
        const { error: supabaseError } = await supabase.from('bookings').insert([{
          user_name: formData.name, 
          phone: formData.phone, 
          pickup: refinedPickup || tripDetails.pickup,
          drop_off: tripDetails.drop, 
          booking_date: tripDetails.date, 
          booking_time: tripDetails.time,
          car_type: car?.name || 'Vehicle', 
          trip_category: tripCategory, 
          sub_type: subType,
          return_date: tripDetails.returnDate || null, 
          return_time: null,
          local_package: tripDetails.package || null,
          stops: tripDetails.stops, 
          status: 'pending', 
          amount: totalEstimated,
          travel_strategy: scenarios ? selectedScenario : null,
          payment_status: 'booked_via_whatsapp', 
          cashfree_order_id: null,
          audit_data
        }]);

        if (supabaseError) throw supabaseError;

        const stopsText = tripDetails.stops && tripDetails.stops.length > 0 ? `\n*Stops:* ${tripDetails.stops.join(' ➔ ')}` : '';
        const dutyNoticeText = dutyInfo.extraBataDays > 0 ? `\n*Driver Duty Notice:* +${dutyInfo.extraBataDays} extra day Driver Bata (₹${dutyInfo.extraBataAmount.toLocaleString()}) included (${dutyInfo.reasons.join(', ')})` : '';

        const waText = 
`*NEW BOOKING ENQUIRY - TAXI HOUSE*
--------------------------------
*Passenger Name:* ${formData.name}
*Phone Number:* ${formData.phone}
*Trip Type:* ${tripCategory === 'outstation' ? 'Outstation One Way' : tripCategory === 'local' ? `Local Rental (${tripDetails.package || '8h/80km'})` : `Airport Transfer (${tripDetails.airport === 'to-airport' ? 'To Airport' : 'From Airport'})`}
*Vehicle:* ${car?.name || 'Vehicle'}
*Pickup Location:* ${refinedPickup || tripDetails.pickup}
*Drop Location:* ${tripDetails.drop}${stopsText}
*Pickup Date & Time:* ${formatDate(tripDetails.date)} at ${formatTime(tripDetails.time)}
*Pet Status:* ${hasPet ? 'Yes (₹750 extra fee included)' : 'No'}
*Estimated Fare:* ₹${totalEstimated.toLocaleString()}${dutyNoticeText}
--------------------------------
Please confirm this booking with me. Thank you!`;

        setBookingStatus({ type: 'success' });
        window.location.href = `https://wa.me/917795965640?text=${encodeURIComponent(waText)}`;
      } catch (err) {
        setBookingStatus({ type: 'error', msg: err.message || 'Failed to submit booking.' });
      }
      return;
    }

    // Outstation Round Trip: Cashfree 15% Token Payment
    setBookingStatus({ type: 'loading', msg: 'Preparing payment...' });

    try {
      const res = await loadCashfree();
      if (!res) throw new Error('Cashfree SDK failed to load.');
      const orderResponse = await fetch('/api/cashfree-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customerName: formData.name, customerPhone: formData.phone }),
      });
      if (!orderResponse.ok) throw new Error('Failed to initialize payment.');
      const orderData = await orderResponse.json();

      setBookingStatus({ type: 'loading', msg: 'Recording booking...' });
      const { error: supabaseError } = await supabase.from('bookings').insert([{
        user_name: formData.name, phone: formData.phone, 
        pickup: refinedPickup || tripDetails.pickup,
        drop_off: tripDetails.drop, 
        booking_date: tripDetails.date, booking_time: tripDetails.time,
        car_type: car?.name || 'Vehicle', trip_category: tripCategory, sub_type: subType,
        return_date: tripDetails.returnDate || null, 
        return_time: null,
        local_package: tripDetails.package || null,
        stops: tripDetails.stops, status: 'pending', amount,
        travel_strategy: scenarios ? selectedScenario : null,
        payment_status: 'awaiting payment', cashfree_order_id: orderData.order_id,
        audit_data
      }]);
      if (supabaseError) throw supabaseError;
      const cashfree = window.Cashfree({ mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox" });
      cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        returnUrl: `${window.location.origin}/payment-success?order_id=${orderData.order_id}`,
      }).then((result) => {
        if (result.error) setBookingStatus({ type: 'error', msg: result.error.message });
      });
    } catch (err) { setBookingStatus({ type: 'error', msg: err.message || 'Payment failed.' }); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-gray-400 font-bold text-[10px]">Initialising Secure Checkout...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle size={60} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-secondary mb-2">Vehicle Not Found</h2>
        <p className="text-gray-500 mb-6 max-w-xs">We couldn't retrieve the vehicle details.</p>
        <button onClick={() => navigate('/select-vehicle')} className="bg-primary text-secondary px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20">Back to Vehicles</button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          {/* Back Button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/?${searchParams.toString()}`)}
              className="flex items-center text-primary hover:text-primary/80 transition-all font-black text-[10px] uppercase tracking-widest bg-white px-6 py-3 rounded-2xl shadow-sm border border-primary/20 flex-shrink-0"
            >
              <RotateCcw size={16} className="mr-1" />
              <span>Modify Search</span>
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-400 hover:text-secondary transition-all hover:-translate-x-1 font-black text-[10px] uppercase tracking-widest bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0"
            >
              <ChevronLeft size={16} className="mr-1" />
              <span>Back to Vehicles</span>
            </button>
          </div>

          {/* Any Queries? Buttons */}
          <div className="flex items-center gap-3">
            <p className="hidden sm:block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mr-2">Any Queries?</p>
            <a 
              href="tel:+917795965640"
              className="flex items-center gap-2 bg-white text-secondary border border-gray-100 px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <Phone size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">+91 77959 65640</span>
            </a>
            <a 
              href="https://wa.me/917795965640"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <MessageCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">WhatsApp Us</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Row 1 / Col 1: Trip Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 h-full"
          >
            <h3 className="text-sm font-black  tracking-[0.2em] mb-8 flex items-center gap-3 text-secondary/40">
              <div className="w-4 h-0.5 bg-primary rounded-full" />
              Trip Summary
              <div className="w-4 h-0.5 bg-primary rounded-full" />
            </h3>

            <div className="space-y-6">
              {/* Header: Date & Time */}
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tripDetails.trip === 'two-way' ? 'Pickup Date' : 'Date'}</p>
                    <p className="text-xl font-black text-secondary leading-none">{formatDate(tripDetails.date)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tripDetails.trip === 'two-way' ? 'Pickup Time' : 'Time'}</p>
                    <p className="text-xl font-black text-secondary leading-none">{formatTime(tripDetails.time)}</p>
                  </div>
                </div>

                {tripDetails.trip === 'two-way' && tripDetails.returnDate && (
                  <div className="flex justify-between items-start pt-6 border-t border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Date</p>
                      <p className="text-xl font-black text-secondary leading-none">{formatDate(tripDetails.returnDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trip Metadata Block */}
              <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trip Type</p>
                  <p className="text-sm font-black text-secondary">{tripDetails.type === 'outstation' ? 'Outstation' : tripDetails.type === 'local' ? 'Local Trip' : 'Airport Transfer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Details</p>
                  <p className="text-xs font-black text-primary uppercase italic tracking-tighter">
                    {tripDetails.type === 'local' ? tripDetails.package : 
                     (tripDetails.trip === 'two-way' ? 'Round Trip' : 'One Way')}
                  </p>
                </div>
              </div>

              {/* Vertical Detailed Timeline */}
              <div className="space-y-6 py-2 relative">
                {/* Vertical Line */}
                <div className="absolute left-[5.5px] top-6 bottom-6 w-0.5 bg-gray-100" />

                {/* Pickup */}
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pickup Information</p>
                  {tripDetails.type === 'local' ? (
                    <div className="mt-3">
                      <LocationInput
                        value={refinedPickup}
                        icon={MapPin}
                        onChange={(e) => {
                          setRefinedPickup(e.target.value);
                          if (e.target.coords) setRefinedPickupCoords(e.target.coords);
                        }}
                        name="localPickup"
                        showCurrentLocation={true}
                        className="!bg-white !border-gray-200 !shadow-sm focus:!ring-primary/10 !py-2.5 !text-sm !rounded-xl"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-secondary leading-relaxed line-clamp-2">{tripDetails.pickup}</p>
                  )}
                </div>

                {/* stops */}
                {tripDetails.stops && tripDetails.stops.length > 0 && tripDetails.stops.map((stop, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-[#60a5fa] shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stop {idx + 1}</p>
                    <p className="text-sm font-bold text-secondary leading-relaxed line-clamp-2">{stop}</p>
                  </div>
                ))}

                {/* Destination */}
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-slate-200" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Destination</p>
                  <p className="text-sm font-bold text-secondary leading-relaxed line-clamp-2">{tripDetails.drop}</p>
                </div>
              </div>


              {/* Vehicle Footer Bar */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shrink-0 shadow-sm p-0.5">
                    {car?.image_url ? (
                      <img 
                        src={car.image_url} 
                        alt={car.name} 
                        className={`w-full h-full object-contain ${
                          car.name?.toLowerCase().includes('swift') || car.name?.toLowerCase().includes('etios') 
                            ? 'scale-[1.5]' 
                            : 'scale-100'
                        }`} 
                      />
                    ) : (
                      <Car size={24} className="text-primary/20" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Vehicle</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-secondary leading-tight">{car?.name}</p>
                      {getVehicleCategory(car?.name) && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest shadow-sm">
                          {getVehicleCategory(car?.name)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                      <Users size={10} /> {car?.seats} pax
                    </p>
                  </div>
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
            
            <h3 className="text-base font-black text-secondary  tracking-[0.1em] mb-6 border-b border-gray-50 pb-4 flex justify-between items-center">
              <span>{tripDetails.type === 'local' ? 'Local Package' : 'Estimation'}</span>
              <span className="text-primary font-black italic text-xs uppercase tracking-tighter shadow-sm px-2 py-1 bg-primary/5 rounded-lg border border-primary/10">Fare Breakdown</span>
            </h3>

            {/* In-Place Strategy Switcher */}
            {tripDetails.type === 'outstation' && scenarios && (
              <div className="bg-gray-50 rounded-[2rem] p-4 border border-gray-100 mb-8 mt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Choose Travel Mode</p>
                  <p className="text-[9px] font-bold text-primary flex items-center gap-1">
                    <Zap size={10} /> Live Fare Update
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scenarios).map(([id, scenario]) => {
                    const Icon = scenario.icon;
                    const isActive = selectedScenario === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedScenario(id)}
                        className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                          isActive 
                            ? 'bg-white border-primary shadow-xl shadow-primary/10 scale-[1.02]' 
                            : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          isActive 
                            ? 'bg-primary text-secondary shadow-lg shadow-primary/20' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-secondary' : 'text-gray-400'}`}>
                            {id === 'day-only' ? 'Standard' : 'Expedited'}
                          </p>
                          <p className={`text-[9px] font-bold mt-0.5 ${isActive ? 'text-primary' : 'text-gray-300'}`}>
                            {id === 'day-only' ? 'Day Only' : 'Inc. Night'}
                          </p>
                        </div>
                        {isActive && (
                          <motion.div 
                            layoutId="activeStrategyGlow"
                            className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-inset pointer-events-none" 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-6 relative z-10">
              {roadDistance && (
                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400  ">Route Distance</p>
                    <p className="text-sm font-black text-secondary">{roadDistance.toFixed(1)} KM Total</p>
                  </div>
                  {roadDistance < (car?.min_km || 300) && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black  rounded-lg border border-primary/20">
                      {car?.min_km || 300}KM Min Applied
                    </span>
                  )}
                </div>
              )}
            {tripDetails.type !== 'local' && (
              <>
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-500">Base Fare <span className="text-[10px] text-gray-400 font-medium">({effectiveKm % 1 === 0 ? effectiveKm : effectiveKm.toFixed(1)} KM used)</span></p>
                    <p className="text-[10px] text-gray-400 font-black ">₹{pricePerKm}/km</p>
                  </div>
                  <p className="text-sm font-black text-secondary">₹{(baseFare || 0).toLocaleString()}</p>
                </div>
                {!!tripDetails.totalDayBata && (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        Driver Bata <span className="text-[10px] text-gray-400 font-medium">({tripDetails.bataDays} Days)</span>
                      </p>
                      {dutyInfo.extraBataDays > 0 && (
                        <p className="text-[9px] text-amber-600 font-bold">
                          Includes +{dutyInfo.extraBataDays} extra day Bata for operating outside 6 AM – 10 PM
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-black text-secondary">₹{tripDetails.totalDayBata.toLocaleString()}</p>
                  </div>
                )}
                {!!tripDetails.totalNightBata && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500">Driver Bata <span className="text-[10px] text-gray-400 font-medium">(night allowance)</span></p>
                    <p className="text-sm font-black text-secondary">₹{tripDetails.totalNightBata.toLocaleString()}</p>
                  </div>
                )}

                {/* Selection Action Buttons */}
                {tripDetails.type === 'outstation' && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button 
                      onClick={() => setIsDetailsOpen(true)}
                      className="py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black text-gray-400 flex items-center justify-center gap-2 transition-all border border-transparent hover:border-gray-200"
                    >
                      <Calculator size={12} />
                      FARE BREAKDOWN
                    </button>
                    <button 
                      onClick={() => setIsTripPlanOpen(true)}
                      className="py-3 bg-primary/10 hover:bg-primary/20 rounded-2xl text-[10px] font-black text-primary flex items-center justify-center gap-2 transition-all border border-primary/20"
                    >
                      <Timer size={12} />
                      VIEW TIMELINE
                    </button>
                  </div>
                )}

                <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary  ">Estimated Total</p>
                    <p className="text-[10px] text-gray-400 font-bold max-w-[150px] leading-tight">Excluding State Permit & Tolls</p>
                  </div>
                   <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">15% OFF</span>
                      <span className="relative text-sm font-black text-slate-400/70">
                        ₹{Math.round(((totalEstimated || 0) * 1.15) / 10) * 10}
                        <span className="absolute inset-x-0 top-1/2 h-[1.5px] bg-red-500 -rotate-[12deg] origin-center sm:h-[2px]"></span>
                      </span>
                    </div>
                    <span className="text-3xl font-black text-secondary ">₹{(totalEstimated || 0).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
              {tripDetails.type === 'local' && (
                <div className="mt-4 p-6 bg-blue-50 rounded-[2.5rem] border-2 border-primary/20 shadow-xl shadow-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="text-primary" size={24} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-black text-secondary tracking-wider">Package Information</h4>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-primary leading-none mb-1">Total Fare</p>
                          <p className="text-2xl font-black text-secondary leading-none">₹{(car?.base_fare || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-[11px] md:text-sm text-blue-800 font-bold leading-relaxed mb-6">
                        This package includes <span className="text-yellow-500 font-black">{car?.local_package || '8 Hours & 80 KM'}</span> usage. Additional usage will incur the following charges:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-blue-50/50 shadow-sm">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-300   mb-2 leading-none">Extra KM</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-secondary">₹</span>
                            <span className="text-2xl font-black text-secondary ">{car?.extra_km_price || 0}</span>
                            <span className="text-[11px] font-bold text-slate-400">/km</span>
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-blue-50/50 shadow-sm">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-300   mb-2 leading-none">Extra HR</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-secondary">₹</span>
                            <span className="text-2xl font-black text-secondary ">{car?.extra_hr_price || 0}</span>
                            <span className="text-[11px] font-bold text-slate-400">/hr</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
                <ShieldCheck className="text-green-500" size={20} />
                <div>
                  <p className="text-[11px] font-black text-secondary ">Secure Pricing</p>
                  <p className="text-[10px] text-gray-500 font-medium">Transparent billing with no hidden fees</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Inclusions & Confirm Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Row 2 / Col 1: Inclusions / Exclusions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-gray-200/30 border border-gray-100 h-full"
          >
            <h4 className="text-sm font-black text-secondary   mb-8 flex items-center gap-2 border-b border-gray-50 pb-4">
              <ShieldCheck size={16} className="text-primary" />
              Inclusions & Exclusions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-500 mt-0.5">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary  ">Fuel Charges</p>
                    <p className="text-[11px] text-gray-400 font-medium">Included in package</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-500 mt-0.5">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary  ">Driver Allowance</p>
                    <p className="text-[11px] text-gray-400 font-medium">Included in package</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 mt-0.5">
                    <AlertCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary  ">Toll Charges</p>
                    <p className="text-[11px] text-gray-400 font-medium">As per actuals (Exclusion)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 mt-0.5">
                    <AlertCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-secondary  ">State Permit / Parking</p>
                    <p className="text-[11px] text-gray-400 font-medium">As per actuals (Exclusion)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a 
                href="/terms-and-conditions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-primary/5 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-secondary uppercase tracking-wider">Terms & Conditions</p>
                    <p className="text-[9px] text-gray-400 font-bold">Standard service agreement</p>
                  </div>
                </div>
              </a>
              <a 
                href="/refund-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-primary/5 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                    <RotateCcw size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-secondary uppercase tracking-wider">Refund Policy</p>
                    <p className="text-[9px] text-gray-400 font-bold">Cancellation & refund terms</p>
                  </div>
                </div>
              </a>
            </div>

            <div className="mt-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
              <div className="mt-0.5 text-blue-500 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-secondary">A quick note on pricing</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  The fare shown above is just an estimate automatically calculated by our computer maps. Your actual final fare may be slightly different depending on the exact road taken by the driver, live traffic diversions, or any extra stops you request.
                </p>
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
                <h3 className="text-2xl font-black text-secondary ">Confirm Details</h3>
                <p className="text-xs text-gray-400 font-bold  ">Ready to book your ride?</p>
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
                    <label className="block text-[10px] font-black text-gray-400  ml-1 ">Full Name</label>
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
                    <label className="block text-[10px] font-black text-gray-400  ml-1 ">Phone Number</label>
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

                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group bg-orange-50 p-4 rounded-2xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={hasPet}
                          onChange={(e) => setHasPet(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 border-2 border-orange-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                          <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-orange-900 leading-tight flex items-center gap-1.5">
                          Accompanied by a Pet?
                          <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm">₹750 EXTRA</span>
                        </span>
                        <span className="text-[9px] font-bold text-orange-700/70 mt-0.5">Pets are welcome! Please note that an additional charge applies for travelling with pets.</span>
                      </div>
                    </label>

                    {/* Mandatory Pre-Payment Terms & Extra Bata Agreement Card */}
                    <div 
                      ref={agreementCardRef}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                        agreementError 
                          ? 'border-red-500 bg-red-50/40 ring-4 ring-red-500/20' 
                          : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={18} className="text-primary shrink-0" />
                        <h4 className="text-xs font-black text-secondary uppercase tracking-wider">
                          Booking Policies & Duty Hours Agreement
                        </h4>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-600 mb-4 pl-1">
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold text-sm leading-none">•</span>
                          <p className="leading-snug">
                            <strong>48-Hour Cancellation Rule:</strong> Cancellations made at least 48 hours before scheduled trip start receive a 100% full refund. Last-minute cancellations (within 48 hours of trip start) are strictly non-refundable. Read full{' '}
                            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary underline font-bold">Terms</a> &amp;{' '}
                            <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline font-bold">Refund Policy</a>.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold text-sm leading-none">•</span>
                          <p className="leading-snug">
                            <strong>Driver Operational Duty Hours:</strong> Driver standard duty hours are between 6:00 AM and 10:00 PM. Departures before 6:00 AM or after 10:00 PM, or arrivals after 10:00 PM or before 6:00 AM, incur +1 extra day Driver Bata (₹{driverBata}/day) per occurrence.
                          </p>
                        </li>
                      </ul>

                      {/* Dynamic Duty Badge */}
                      <div className="mb-4">
                        {dutyInfo.extraBataDays > 0 ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] font-bold leading-snug">
                              <span className="font-black text-amber-950 uppercase tracking-wide block">
                                +{dutyInfo.extraBataDays} Day Extra Driver Bata (₹{dutyInfo.extraBataAmount.toLocaleString()}) Included
                              </span>
                              <span className="text-amber-800">
                                Journey operates outside standard 6:00 AM – 10:00 PM duty hours: {dutyInfo.reasons.join(' & ')}.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2.5 text-green-800">
                            <CheckCircle size={16} className="text-green-600 shrink-0" />
                            <p className="text-[11px] font-bold">
                              <strong className="text-green-950">Standard Duty Hours:</strong> Trip schedule falls cleanly within 6:00 AM – 10:00 PM. No extra driver bata applied.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Error Banner when attempting submit without checking */}
                      {agreementError && (
                        <div className="mb-3 p-2.5 bg-red-100/90 border border-red-300 rounded-xl text-red-700 text-xs font-black flex items-center gap-2 animate-pulse">
                          <AlertCircle size={16} className="shrink-0" />
                          <span>Please check the agreement box below to accept the 48-Hour Cancellation Policy and Driver Duty Hours to proceed.</span>
                        </div>
                      )}

                      {/* Agreement Checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer group pt-1">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={acceptTerms}
                            onChange={(e) => {
                              setAcceptTerms(e.target.checked);
                              if (e.target.checked) setAgreementError(false);
                            }}
                            className="peer sr-only"
                          />
                          <div className={`w-5 h-5 border-2 rounded-md bg-white transition-all flex items-center justify-center ${
                            agreementError ? 'border-red-400' : 'border-slate-300 peer-checked:bg-primary peer-checked:border-primary'
                          }`}>
                            <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-secondary transition-colors leading-tight">
                          I have read, understood, and agree to the <span className="text-primary underline">48-Hour Cancellation Rule</span> and <span className="text-primary underline">Driver Duty Hours (6 AM – 10 PM)</span>.
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                          {isWhatsAppBooking ? 'instant booking • pay driver directly' : 'pay 15% now & rest to driver'}
                        </p>
                      </div>

                      {isWhatsAppBooking ? (
                        <button
                          type="submit"
                          disabled={bookingStatus?.type === 'loading'}
                          className="w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all text-base flex items-center justify-center gap-3 relative overflow-hidden group bg-[#25D366] text-white shadow-[#25D366]/20 hover:bg-[#20ba59] hover:-translate-y-1 active:translate-y-0"
                        >
                          {bookingStatus?.type === 'loading' ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin" size={20} />
                              <span>Connecting to WhatsApp...</span>
                            </div>
                          ) : (
                            <>
                              <MessageCircle size={22} />
                              Book &amp; Confirm on WhatsApp
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={bookingStatus?.type === 'loading'}
                          className="w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all text-base flex items-center justify-center gap-3 relative overflow-hidden group bg-black text-white shadow-black/20 hover:bg-black/90 hover:-translate-y-1 active:translate-y-0"
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
                              Pay ₹{tokenAmount.toLocaleString()} &amp; Confirm
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Fare Detail Modal */}
      <FareDetailModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        car={car}
        data={{
          roadDistance,
          effectiveKm,
          pricePerKm,
          baseFare,
          totalDayBata: tripDetails.totalDayBata,
          totalNightBata: tripDetails.totalNightBata,
          bataDays: tripDetails.bataDays,
          totalNights: tripDetails.totalNights,
          nightBata,
          minKm,
          petFee,
          extraBataDays: dutyInfo.extraBataDays,
          extraBataAmount: dutyInfo.extraBataAmount,
          extraBataReasons: dutyInfo.reasons,
          totalFare: totalEstimated
        }}
      />

      {/* Trip Plan Modal */}
      <TripPlanModal
        isOpen={isTripPlanOpen}
        onClose={() => setIsTripPlanOpen(false)}
        strategy={selectedScenario}
        tripType={tripDetails.trip}
        estimatedDistance={roadDistance / (tripDetails.trip === 'two-way' ? 2 : 1)}
        schedule={generateTripSchedule(
          tripDetails.date,
          tripDetails.time,
          tripDetails.returnDate,
          tripDetails.time || '10:00',
          routeLegs,
          selectedScenario,
          tripDetails.trip
        )}
      />
    </div>
  );
};

export default ConfirmBooking;
