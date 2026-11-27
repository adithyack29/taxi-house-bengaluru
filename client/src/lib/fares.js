// The ONE place fares are calculated. Every page (home board, /book, /airport, /tariff,
// booking confirmation) goes through these functions so prices never disagree.
// The maths is a faithful port of the pre-redesign ConfirmBooking.jsx logic
// (duty-hours driver allowance, day-only / expedited scenarios, round-trip min km,
// pet fee, 15% round-trip advance). No GST is added — the business charges none today.
import FARES from '../data/fares.json';
import { generateTripSchedule } from '../utils/tripSchedule';

export const POLICIES = FARES.policies;

export const formatINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** Per-km rate the old checkout used: one-way rate only for one-way trips, otherwise the round-trip rate. */
export const ratePerKm = (car, tripType) =>
  (tripType === 'one-way' ? car?.price_per_km_one_way : car?.price_per_km) || 0;

/** Display class used to group the fleet on Home / Tariff. */
export const vehicleClass = (name = '') => {
  const n = name.toLowerCase();
  if (/bus/.test(n)) return 'bus';
  if (/tempo|traveller|\btt\b/.test(n)) return 'tempo';
  if (/crysta/.test(n)) return 'crysta';
  if (/ertiga|carens|innova|suv|muv/.test(n)) return 'suv';
  if (/dzire|etios|amaze|aura|sedan|swift/.test(n)) return 'sedan';
  return 'other';
};

export const CLASS_META = {
  sedan: { label: 'Sedan', order: 1 },
  suv: { label: 'SUV', order: 2 },
  crysta: { label: 'Innova Crysta', order: 3 },
  tempo: { label: 'Tempo Traveller', order: 4 },
  bus: { label: 'Bus', order: 5 },
  other: { label: 'Other', order: 6 },
};

const pad = (n) => String(n).padStart(2, '0');

/** Driver duty hours (6:00–22:00) → extra day allowance. Port of ConfirmBooking `dutyInfo`. */
function dutyInfoFor({ car, trip, roadDistance, routeLegs, strategy }) {
  const driverBata = car?.driver_bata || 300;
  const minKm = car?.min_km || POLICIES.minKmPerDayRoundTrip;
  let extraBataDays = 0;
  const reasons = [];

  if (trip.time) {
    const [pH, pM] = trip.time.split(':').map(Number);
    if (pH < 6) { extraBataDays += 1; reasons.push('Early pickup before 6:00 AM'); }
    else if (pH > 22 || (pH === 22 && pM > 0)) { extraBataDays += 1; reasons.push('Late pickup after 10:00 PM'); }
  }

  let dropDate = null;
  if (routeLegs && routeLegs.length > 0) {
    const sched = generateTripSchedule(trip.date, trip.time, trip.returnDate, trip.time || '10:00', routeLegs, strategy || 'day-only', trip.trip);
    if (sched.length > 0) dropDate = new Date(sched[sched.length - 1].time);
  } else if (trip.date && trip.time) {
    const pDate = new Date(`${trip.date}T${trip.time}:00`);
    if (trip.type === 'local') dropDate = new Date(pDate.getTime() + 8 * 3600e3);
    else if (trip.type === 'airport') dropDate = new Date(pDate.getTime() + 2 * 3600e3);
    else dropDate = new Date(pDate.getTime() + Math.ceil((roadDistance || minKm) / 45) * 3600e3);
  }

  if (dropDate && !isNaN(dropDate.getTime())) {
    const dH = dropDate.getHours();
    const dM = dropDate.getMinutes();
    if (dH < 6) { extraBataDays += 1; reasons.push('Early drop before 6:00 AM'); }
    else if (dH > 22 || (dH === 22 && dM > 0)) { extraBataDays += 1; reasons.push('Late drop after 10:00 PM'); }
  }

  return { extraBataDays, extraBataAmount: extraBataDays * driverBata, reasons, dropDate };
}

/** Day-only / expedited outstation scenarios. Port of ConfirmBooking `scenarios`. */
function outstationScenarios({ car, trip, roadDistance, routeLegs, duty }) {
  const minKm = car?.min_km || POLICIES.minKmPerDayRoundTrip;
  const pricePerKm = ratePerKm(car, trip.trip);
  const driverBata = car?.driver_bata || 300;
  const nightBata = car?.night_bata || driverBata;
  const perDay = POLICIES.minKmPerDayRoundTrip;

  const pickupD = new Date(`${trip.date}T${trip.time}:00`);
  const returnD = trip.returnDate ? new Date(`${trip.returnDate}T${trip.time || '10:00'}:00`) : pickupD;
  const userHours = (returnD - pickupD) / 3600e3;
  const userDays = Math.max(1, Math.ceil((userHours - 2) / 24));
  const distanceVal = roadDistance || minKm;

  const chrono = (strategy) => {
    if (!routeLegs || routeLegs.length === 0) return null;
    const sched = generateTripSchedule(trip.date, trip.time, trip.returnDate, trip.time || '10:00', routeLegs, strategy, trip.trip);
    if (sched.length < 2) return { days: 1, nights: 0, schedHours: 0 };
    const start = new Date(sched[0].time);
    const end = new Date(sched[sched.length - 1].time);
    const nightHalts = sched.filter((i) => i.title && (i.title === 'Night Halt' || i.title?.includes('Overnight'))).length;
    const windows = new Set();
    const p = new Date(start);
    while (p < end) {
      const h = p.getHours();
      if (h >= 22 || h < 6) { const id = new Date(p); if (h < 6) id.setDate(id.getDate() - 1); windows.add(id.toDateString()); }
      p.setHours(p.getHours() + 1);
    }
    const eh = end.getHours();
    if (eh >= 22 || eh < 6) { const id = new Date(end); if (eh < 6) id.setDate(id.getDate() - 1); windows.add(id.toDateString()); }
    return { days: 1 + nightHalts, nights: windows.size, schedHours: (end - start) / 3600e3 };
  };

  const isSameDay = trip.date === trip.returnDate;

  const build = (strategy) => {
    const s = chrono(strategy);
    let days = Math.max(userDays, s?.days || 1);
    if (isSameDay) days = 1;
    let bataDays = days;
    let bataNights = s?.nights || 0;
    if (s && Math.max(userHours, s.schedHours) <= 12) { bataDays = 1; bataNights = 0; }
    bataDays += duty.extraBataDays;
    const minKmValue = trip.trip === 'one-way' ? 0 : perDay * days;
    const billingKm = Math.max(distanceVal, minKmValue);
    const baseFare = Math.round(billingKm * pricePerKm);
    const dayBata = bataDays * driverBata;
    // Standard (day-only) never pays night allowance; expedited does.
    const nightBataValue = strategy === 'expedited' ? bataNights * nightBata : 0;
    return {
      days: bataDays,
      nights: strategy === 'expedited' ? bataNights : 0,
      billingKm, baseFare, dayBata, nightBataValue,
      total: baseFare + dayBata + nightBataValue,
    };
  };

  return {
    'day-only': { ...build('day-only'), label: 'Standard (day only)', desc: 'Relaxed pace, daytime driving only. Safer for long routes.' },
    expedited: { ...build('expedited'), label: 'Expedited (day & night)', desc: 'Faster arrival with night driving shifts.' },
  };
}

/**
 * The shared fare function.
 * @param car   a row from the Supabase `cars` table
 * @param trip  { type: 'outstation'|'local'|'airport', trip: 'one-way'|'two-way', date: 'YYYY-MM-DD', time: 'HH:mm', returnDate }
 * @returns breakdown with `total` (all-in fare) and `token` (15% advance for round trips)
 */
export function computeFare({ car, trip, roadDistance = null, routeLegs = [], strategy = 'day-only', hasPet = false }) {
  const minKm = car?.min_km || POLICIES.minKmPerDayRoundTrip;
  const pricePerKm = ratePerKm(car, trip.trip);
  const driverBata = car?.driver_bata || 300;
  const nightBata = car?.night_bata || driverBata;
  const duty = dutyInfoFor({ car, trip, roadDistance, routeLegs, strategy });

  let effectiveKm = minKm;
  let baseFare = 0;
  let total = 0;
  let dayBata = 0;
  let nightBataValue = 0;
  let bataDays = 0;
  let nights = 0;
  let scenarios = null;

  if (trip.type === 'local') {
    baseFare = car?.base_fare || 2100;
    dayBata = duty.extraBataAmount;
    bataDays = duty.extraBataDays;
    total = baseFare + dayBata;
  } else if (trip.type === 'airport') {
    effectiveKm = POLICIES.airportBillableKm;
    baseFare = Math.round(effectiveKm * pricePerKm);
    dayBata = duty.extraBataAmount;
    bataDays = duty.extraBataDays;
    total = baseFare + dayBata;
  } else {
    scenarios = outstationScenarios({ car, trip, roadDistance, routeLegs, duty });
    const cur = scenarios[strategy] || scenarios['day-only'];
    effectiveKm = cur.billingKm;
    baseFare = cur.baseFare;
    dayBata = cur.dayBata;
    nightBataValue = cur.nightBataValue;
    bataDays = cur.days;
    nights = cur.nights;
    total = cur.total;
  }

  const petFee = hasPet ? POLICIES.petFee : 0;
  total += petFee;

  const pct = POLICIES.advancePercentRoundTrip / 100;
  const rounded = Math.floor((total * pct) / 100) * 100;
  const token = rounded > 0 ? rounded : Math.max(1, Math.round(total * pct));

  return {
    effectiveKm, pricePerKm, minKm, driverBata, nightBata,
    baseFare, dayBata, nightBataValue, bataDays, nights, petFee, total, token,
    extraBataDays: duty.extraBataDays, extraBataAmount: duty.extraBataAmount, extraBataReasons: duty.reasons,
    scenarios,
  };
}

/** Bookings that the old flow sent to WhatsApp (everything except outstation round trips). */
export const isWhatsAppTrip = (trip) =>
  trip.type === 'local' || trip.type === 'airport' || (trip.type === 'outstation' && trip.trip === 'one-way');

/** Indicative one-way fare from Bengaluru centre (departures board). Day-time pickup so no duty extras. */
export const indicativeOneWay = (car, km) =>
  computeFare({ car, trip: { type: 'outstation', trip: 'one-way', date: '2030-01-07', time: '09:00' }, roadDistance: km }).total;

/** Airport fixed fare = 40 billable km × the car's rate (same as checkout), excluding duty-hour extras. */
export const airportFare = (car) => Math.round(POLICIES.airportBillableKm * ratePerKm(car, undefined));

export const fmtDuration = (minutes) => {
  const m = Math.round(minutes || 0);
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};

/** Group rows from `cars` into display classes with min rates. */
export function groupByClass(cars) {
  const map = new Map();
  for (const c of cars) {
    const key = vehicleClass(c.name);
    if (!map.has(key)) map.set(key, { key, label: CLASS_META[key].label, models: new Set(), cars: [], seats: 0 });
    const g = map.get(key);
    g.models.add(c.name.replace(/\s+(AC|Non AC)$/i, ''));
    g.cars.push(c);
    g.seats = Math.max(g.seats, c.seats || 0);
  }
  return [...map.values()]
    .map((g) => ({ ...g, models: [...g.models] }))
    .sort((a, b) => CLASS_META[a.key].order - CLASS_META[b.key].order);
}

export const minOf = (arr, fn) => {
  const vals = arr.map(fn).filter((v) => Number(v) > 0);
  return vals.length ? Math.min(...vals) : null;
};
