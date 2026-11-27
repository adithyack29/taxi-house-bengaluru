import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import FlowHeader from '../components/site/FlowHeader';
import Seo from '../components/site/Seo';
import { CLASS_PHOTO } from '../components/site/photos';
import RouteMap from '../components/RouteMap';
import { useCars } from '../hooks/useCars';
import { supabase } from '../lib/supabase';
import { loadCashfree } from '../utils/cashfree';
import { formatDate, formatTime, prettyDate } from '../utils/formatters';
import { normalizeIndianMobile, MOBILE_ERROR } from '../utils/validation';
import { computeFare, formatINR, fmtDuration, isWhatsAppTrip, vehicleClass, POLICIES } from '../lib/fares';
import { BUSINESS, waUrl } from '../data/business';

const safeArr = (v) => { try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
const shortPlace = (s = '') => s.split(',')[0].trim();
const makeRef = () => `TH-${Date.now().toString(36).slice(-5).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;

function tagFor(car, isCheapest) {
  if (isCheapest) return { label: 'Best value', accent: false };
  const cls = vehicleClass(car.name);
  if (cls === 'tempo' || cls === 'bus' || (car.seats || 0) >= 10) return { label: 'Groups', accent: false };
  if ((car.seats || 0) >= 6) return { label: 'Family', accent: false };
  return null;
}

export default function Book() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const trip = useMemo(() => ({
    pickup: sp.get('pickup') || '',
    pickupCoords: sp.get('pickupCoord'),
    drop: sp.get('drop') || (sp.get('type') === 'local' ? 'Local trip' : ''),
    dropCoords: sp.get('dropCoord'),
    date: sp.get('date'),
    time: sp.get('time'),
    type: sp.get('type') || 'outstation',
    trip: sp.get('trip'),
    package: sp.get('package'),
    airport: sp.get('airport'),
    returnDate: sp.get('returnDate') || null,
    stops: safeArr(sp.get('stops')).filter(Boolean),
    stopCoords: safeArr(sp.get('stopCoords')),
    stopDurations: safeArr(sp.get('stopDurations')),
  }), [sp]);

  const [strategy, setStrategy] = useState(sp.get('strategy') || 'day-only');
  const [route, setRoute] = useState({ loading: true, km: null, minutes: null, legs: [], geometry: null });
  const [carId, setCarId] = useState(sp.get('carId'));
  const [form, setForm] = useState({ name: '', phone: '' });
  const [hasPet, setHasPet] = useState(false);
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTitle = useRef(null);
  const liveRef = useRef(null);

  // Guard: no trip → back to the booking card.
  useEffect(() => { if (!trip.date || !trip.time) navigate('/#book', { replace: true }); }, [trip.date, trip.time, navigate]);

  // Road route (OSRM) — same service & doubling rule the old checkout used.
  useEffect(() => {
    const coords = [trip.pickupCoords, ...trip.stopCoords.filter(Boolean), trip.dropCoords].filter((c) => typeof c === 'string' && c.includes(','));
    if (trip.type === 'local' || !trip.pickupCoords || !trip.dropCoords || coords.length < 2) {
      setRoute({ loading: false, km: null, minutes: null, legs: [], geometry: null });
      return undefined;
    }
    const ctl = new AbortController();
    const pts = coords.map((c) => { const [lat, lng] = c.split(','); return `${lng},${lat}`; }).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?overview=simplified&geometries=geojson`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.code !== 'Ok' || !d.routes?.[0]) throw new Error('no route');
        const r0 = d.routes[0];
        const oneWay = r0.distance / 1000;
        const names = [...trip.stops, trip.drop];
        setRoute({
          loading: false,
          km: trip.trip === 'two-way' ? oneWay * 2 : oneWay,
          minutes: r0.duration / 60,
          legs: r0.legs.map((l, i) => ({ distance: l.distance / 1000, name: names[i] || 'Stop', durationHalt: trip.stopDurations[i] || 0 })),
          geometry: r0.geometry?.coordinates || null,
        });
      })
      .catch((e) => { if (e.name !== 'AbortError') setRoute({ loading: false, km: null, minutes: null, legs: [], geometry: null }); });
    return () => ctl.abort();
  }, [trip]);

  const { cars: rawCars, loading: carsLoading } = useCars(trip.type);
  const priced = useMemo(() => {
    const list = rawCars
      .filter((c) => !c.is_round_trip_only || trip.trip === 'two-way')
      .map((car) => ({ car, fare: computeFare({ car, trip, roadDistance: route.km, routeLegs: route.legs, strategy, hasPet }) }))
      .sort((a, b) => a.fare.total - b.fare.total);
    return list;
  }, [rawCars, trip, route.km, route.legs, strategy, hasPet]);

  useEffect(() => {
    if (priced.length && !priced.some((p) => String(p.car.id) === String(carId))) setCarId(priced[0].car.id);
  }, [priced, carId]);

  const sel = priced.find((p) => String(p.car.id) === String(carId)) || priced[0];
  const wa = isWhatsAppTrip(trip);
  const isRound = trip.type === 'outstation' && trip.trip === 'two-way';

  useEffect(() => {
    if (!sheetOpen) return undefined;
    sheetTitle.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const tripLabel = trip.type === 'local' ? `Local · ${trip.package || POLICIES.localPackage}`
    : trip.type === 'airport' ? (trip.airport === 'from-airport' ? 'From airport' : 'To airport')
      : trip.trip === 'two-way' ? 'Round trip' : 'One way';
  const from = shortPlace(trip.pickup) || 'Bengaluru';
  const to = trip.type === 'local' ? 'Local' : shortPlace(trip.drop);
  const kmLabel = route.km ? `${Math.round(route.km)} km` : null;
  const mapLabel = trip.type === 'local'
    ? `Within Bengaluru · ${trip.package || POLICIES.localPackage}`
    : route.loading ? 'Plotting route…'
      : route.geometry ? `Route · ${kmLabel}${trip.trip === 'two-way' ? ' return' : ''} by road`
        : 'Route could not be mapped — we’ll confirm the distance on WhatsApp';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!normalizeIndianMobile(form.phone)) e.phone = MOBILE_ERROR;
    if (!accept) e.accept = 'Please accept the cancellation terms to continue.';
    setErrors(e);
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.getElementById(e.name ? 'bk-name' : e.phone ? 'bk-phone' : 'bk-accept')?.focus());
      return;
    }
    if (!sel) return;
    const { car, fare } = sel;
    const phone = normalizeIndianMobile(form.phone);
    const ref = makeRef();
    const subType = trip.type === 'airport' ? trip.airport : trip.trip;
    const audit_data = {
      booking_ref: ref,
      totalFare: fare.total,
      roadDistance: route.km,
      effectiveKm: fare.effectiveKm,
      pricePerKm: fare.pricePerKm,
      baseFare: fare.baseFare,
      totalDayBata: fare.dayBata,
      totalNightBata: fare.nightBataValue,
      bataDays: fare.bataDays,
      totalNights: fare.nights,
      nightBata: fare.nightBata,
      minKm: fare.minKm,
      routeLegs: route.legs,
      selectedScenario: trip.type === 'outstation' ? strategy : null,
      hasPet,
      petFee: fare.petFee,
      extraBataDays: fare.extraBataDays,
      extraBataAmount: fare.extraBataAmount,
      extraBataReasons: fare.extraBataReasons,
      dutyWindowPolicy: 'Standard driver duty hours: 6:00 AM – 10:00 PM. +1 extra day Driver Bata applies if pickup or drop exceeds duty hours.',
    };
    const base = {
      user_name: form.name.trim(), phone, pickup: trip.pickup, drop_off: trip.drop,
      booking_date: trip.date, booking_time: trip.time, car_type: car.name,
      trip_category: trip.type, sub_type: subType, return_date: trip.returnDate || null, return_time: null,
      local_package: trip.package || null, stops: trip.stops, status: 'pending',
      travel_strategy: trip.type === 'outstation' ? strategy : null, audit_data,
    };
    const summary = {
      ref, name: base.user_name, phone, pickup: trip.pickup, drop: trip.drop, from, to,
      date: trip.date, time: trip.time, car: car.name, total: fare.total, token: isRound ? fare.token : 0, tripLabel,
    };

    if (wa) {
      setStatus({ type: 'loading', msg: 'Saving your booking…' });
      try {
        const { error } = await supabase.from('bookings').insert([{ ...base, amount: fare.total, payment_status: 'booked_via_whatsapp', cashfree_order_id: null }]);
        if (error) throw error;
        const stopsText = trip.stops.length ? `\n*Stops:* ${trip.stops.join(' ➔ ')}` : '';
        const duty = fare.extraBataDays > 0 ? `\n*Driver Duty Notice:* +${fare.extraBataDays} extra day Driver Bata (${formatINR(fare.extraBataAmount)}) included (${fare.extraBataReasons.join(', ')})` : '';
        const waText = `*NEW BOOKING ENQUIRY - TAXI HOUSE*
*Ref:* ${ref}
--------------------------------
*Passenger Name:* ${base.user_name}
*Phone Number:* ${phone}
*Trip Type:* ${trip.type === 'outstation' ? 'Outstation One Way' : trip.type === 'local' ? `Local Rental (${trip.package || POLICIES.localPackage})` : `Airport Transfer (${trip.airport === 'to-airport' ? 'To Airport' : 'From Airport'})`}
*Vehicle:* ${car.name}
*Pickup Location:* ${trip.pickup}
*Drop Location:* ${trip.drop}${stopsText}
*Pickup Date & Time:* ${formatDate(trip.date)} at ${formatTime(trip.time)}
*Pet Status:* ${hasPet ? `Yes (${formatINR(POLICIES.petFee)} extra fee included)` : 'No'}
*Estimated Fare:* ${formatINR(fare.total)}${duty}
--------------------------------
Please confirm this booking with me. Thank you!`;
        sessionStorage.setItem('th:booking', JSON.stringify({ ...summary, mode: 'whatsapp', waText, opened: false }));
        navigate(`/booking-confirmed?ref=${ref}`);
      } catch (err) {
        setStatus({ type: 'error', msg: err.message || 'We couldn’t save your booking. Please try again or WhatsApp us.' });
      }
      return;
    }

    // Outstation round trip — Cashfree advance, unchanged flow.
    setStatus({ type: 'loading', msg: 'Preparing secure payment…' });
    try {
      const ok = await loadCashfree();
      if (!ok) throw new Error('Payment gateway failed to load. Please try again.');
      const res = await fetch('/api/cashfree-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: fare.token, customerName: base.user_name, customerPhone: phone }),
      });
      if (!res.ok) throw new Error('Failed to initialise payment.');
      const order = await res.json();
      setStatus({ type: 'loading', msg: 'Recording booking…' });
      const { error } = await supabase.from('bookings').insert([{ ...base, amount: fare.token, payment_status: 'awaiting payment', cashfree_order_id: order.order_id }]);
      if (error) throw error;
      sessionStorage.setItem('th:booking', JSON.stringify({ ...summary, mode: 'cashfree', orderId: order.order_id }));
      const cashfree = window.Cashfree({ mode: import.meta.env.VITE_CASHFREE_MODE || 'sandbox' });
      cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        returnUrl: `${window.location.origin}/booking-confirmed?order_id=${order.order_id}`,
      }).then((r) => { if (r.error) setStatus({ type: 'error', msg: r.error.message }); });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Payment failed.' });
    }
  };

  useEffect(() => { if (status?.type === 'error') liveRef.current?.focus(); }, [status]);

  const editHref = `/?${(() => { const p = new URLSearchParams(sp); p.delete('carId'); return p.toString(); })()}#book`;
  const ctaLabel = !sel ? 'Confirm booking' : isRound ? `Pay ${formatINR(sel.fare.token)} & confirm` : `Confirm booking · ${formatINR(sel.fare.total)}`;

  return (
    <>
      <Seo title="Choose your cab | Taxi House Bengaluru" description="Compare all-in fares for every car on your trip and confirm your Taxi House booking." path="/book" noindex />
      <FlowHeader step={2} mobileTitle="Choose your cab" mobileSub="Step 2 of 3" onBack={() => navigate(editHref)} />
      <main id="main" className="book">
        <div className="wrap book__grid">
          <div>
            <section className="trip-sum on-ink" aria-label="Your trip">
              <div className="trip-sum__head">
                <p className="trip-sum__route">
                  <span>{from}</span><span className="accent-text" aria-label="to">→</span><span>{to}</span>
                </p>
                <ul className="trip-sum__meta">
                  <li>{prettyDate(trip.date)} · {trip.time ? formatTime(trip.time) : ''}</li>
                  <li>{tripLabel}</li>
                  {trip.returnDate && <li>Return {prettyDate(trip.returnDate)}</li>}
                  {kmLabel && <li>{kmLabel}</li>}
                  {route.minutes && trip.type !== 'local' && <li>~{fmtDuration(route.minutes)} drive</li>}
                </ul>
                {trip.stops.length > 0 && <p className="trip-sum__stops">Via {trip.stops.map(shortPlace).join(' → ')}</p>}
                <Link className="trip-sum__edit" to={editHref}>Edit trip</Link>
              </div>
              <RouteMap coords={route.geometry} label={mapLabel} />
            </section>

            <div className="book__listhead">
              <h1>{carsLoading ? 'Finding cars…' : `${priced.length} ${priced.length === 1 ? 'car' : 'cars'} available`}</h1>
              <p className="muted">All-in fares · tolls &amp; permits at actuals</p>
            </div>

            {!carsLoading && priced.length === 0 ? (
              <div className="card book__empty">
                <p style={{ fontWeight: 700, marginTop: 0 }}>No cars are available for this trip online.</p>
                <p className="muted">Call or WhatsApp us and we’ll arrange one.</p>
                <a className="btn btn--primary btn--pill" href={waUrl(`Hi, I need a cab: ${trip.pickup} → ${trip.drop} on ${trip.date} ${trip.time}`)} target="_blank" rel="noopener noreferrer">WhatsApp {BUSINESS.phoneDisplay}</a>
              </div>
            ) : (
              <fieldset className="cars">
                <legend className="sr-only">Choose a car</legend>
                {priced.map(({ car, fare }, i) => {
                  const tag = tagFor(car, i === 0 && priced.length > 1);
                  const photo = car.image_url ? { src: car.image_url, alt: car.name } : CLASS_PHOTO[vehicleClass(car.name)] ? { src: `/img/${CLASS_PHOTO[vehicleClass(car.name)].name}.jpg`, alt: CLASS_PHOTO[vehicleClass(car.name)].alt } : null;
                  const rate = trip.type === 'local' ? null : fare.pricePerKm;
                  return (
                    <label key={car.id} className="car">
                      <input type="radio" name="car" value={car.id} checked={String(sel?.car.id) === String(car.id)} onChange={() => setCarId(car.id)} />
                      <span className="car__media">
                        {photo ? <img src={photo.src} alt="" width="130" height="98" loading="lazy" decoding="async" /> : <span className="photo-missing" aria-hidden="true">{/* TODO: real photo */}Car</span>}
                      </span>
                      <span className="car__info">
                        <span className="car__name">{car.name}{tag && <span className={`tag ${tag.accent ? 'tag--accent' : ''}`}>{tag.label}</span>}</span>
                        <span className="car__specs">
                          {car.seats ? `${car.seats} seats` : ''}{car.is_ac === false ? ' · Non-AC' : ' · AC'}{rate ? ` · ₹${rate}/km` : ''}
                        </span>
                      </span>
                      <span className="car__price">
                        <span>
                          <span className="num car__total">{formatINR(fare.total)}</span>
                          <span className="car__incl">{isRound ? `${formatINR(fare.token)} now` : 'all-in'}</span>
                        </span>
                        <span className="car__radio" aria-hidden="true" />
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
            <p className="fine" style={{ marginTop: 16 }}>Includes driver allowance. Tolls, parking and permits at actuals.</p>
          </div>

          <aside className="book__aside" aria-label="Fare and confirmation">
            <form
              className="fare-panel card"
              data-open={sheetOpen}
              onSubmit={submit}
              noValidate
              role={sheetOpen ? 'dialog' : undefined}
              aria-modal={sheetOpen || undefined}
              aria-labelledby="fare-title"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="eyebrow muted">Fare breakdown</p>
                  <h2 id="fare-title" className="fare-panel__car" ref={sheetTitle} tabIndex={-1}>{sel ? sel.car.name : '—'}</h2>
                </div>
                <button type="button" className="icon-btn fare-panel__close" aria-label="Close" onClick={() => setSheetOpen(false)}><X size={18} aria-hidden="true" /></button>
              </div>

              {sel && (
                <>
                  <dl className="fare-rows">
                    <div>
                      <dt>Base fare<span className="fare-rows__sub">{trip.type === 'local' ? (trip.package || POLICIES.localPackage) : `${Math.round(sel.fare.effectiveKm)} km × ₹${sel.fare.pricePerKm}`}</span></dt>
                      <dd>{formatINR(sel.fare.baseFare)}</dd>
                    </div>
                    {sel.fare.dayBata > 0 && (
                      <div>
                        <dt>Driver allowance<span className="fare-rows__sub">{sel.fare.bataDays} day{sel.fare.bataDays === 1 ? '' : 's'}{sel.fare.extraBataReasons.length ? ` · incl. ${sel.fare.extraBataReasons.join(', ').toLowerCase()}` : ''}</span></dt>
                        <dd>{formatINR(sel.fare.dayBata)}</dd>
                      </div>
                    )}
                    {sel.fare.nightBataValue > 0 && (
                      <div><dt>Night allowance<span className="fare-rows__sub">{sel.fare.nights} night{sel.fare.nights === 1 ? '' : 's'}</span></dt><dd>{formatINR(sel.fare.nightBataValue)}</dd></div>
                    )}
                    {sel.fare.petFee > 0 && <div><dt>Pet fee</dt><dd>{formatINR(sel.fare.petFee)}</dd></div>}
                  </dl>
                  <p className="fare-total"><span>Total</span><span className="num">{formatINR(sel.fare.total)}</span></p>
                  {isRound && (
                    <dl className="fare-rows" style={{ borderTop: 0 }}>
                      <div><dt>Pay now ({POLICIES.advancePercentRoundTrip}% advance)</dt><dd>{formatINR(sel.fare.token)}</dd></div>
                      <div><dt>Balance</dt><dd>{formatINR(sel.fare.total - sel.fare.token)}</dd></div>
                    </dl>
                  )}
                  {trip.type === 'outstation' && !route.km && !route.loading && (
                    <p className="note">We couldn’t map this route, so the fare uses the {sel.fare.minKm} km minimum. We’ll confirm the exact distance with you.</p>
                  )}
                </>
              )}

              {trip.type === 'outstation' && sel?.fare.scenarios && (
                <fieldset className="scenarios">
                  <legend>Travel plan</legend>
                  {Object.entries(sel.fare.scenarios).map(([key, s]) => (
                    <label key={key} className="scen">
                      <input type="radio" name="strategy" value={key} checked={strategy === key} onChange={() => setStrategy(key)} />
                      <span><strong>{s.label}</strong><small>{s.desc}</small></span>
                      <span className="num">{formatINR(s.total + sel.fare.petFee)}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              <p className="note">Not included: tolls, parking, interstate permit — paid at actuals.</p>

              <div>
                <div className="fld" data-invalid={!!errors.name}>
                  <label className="fld__label" htmlFor="bk-name">Your name</label>
                  <input id="bk-name" className="fld__input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'bk-name-err' : undefined} required />
                </div>
                {errors.name && <p id="bk-name-err" className="fld-error">{errors.name}</p>}
              </div>
              <div>
                <div className="fld" data-invalid={!!errors.phone}>
                  <label className="fld__label" htmlFor="bk-phone">Mobile · WhatsApp</label>
                  <input id="bk-phone" className="fld__input mono" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'bk-phone-err' : undefined} required />
                </div>
                {errors.phone && <p id="bk-phone-err" className="fld-error">{errors.phone}</p>}
              </div>

              <label className="check">
                <input type="checkbox" checked={hasPet} onChange={(e) => setHasPet(e.target.checked)} />
                <span>Travelling with a pet (+{formatINR(POLICIES.petFee)})</span>
              </label>
              <div>
                <label className="check">
                  <input id="bk-accept" type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} aria-invalid={!!errors.accept} aria-describedby={errors.accept ? 'bk-accept-err' : undefined} />
                  <span>
                    I accept the <Link to="/terms-and-conditions" target="_blank">terms</Link> and <Link to="/refund-policy" target="_blank">cancellation policy</Link>: full refund if cancelled {POLICIES.freeCancellationHours}h+ before pickup; non-refundable within {POLICIES.freeCancellationHours}h. Pickups or drops outside {POLICIES.dutyHours.start} AM – {POLICIES.dutyHours.end - 12} PM add a day of driver allowance.
                  </span>
                </label>
                {errors.accept && <p id="bk-accept-err" className="fld-error">{errors.accept}</p>}
              </div>

              <div aria-live="polite" ref={liveRef} tabIndex={-1}>
                {status && <p className={`status ${status.type === 'error' ? 'status--error' : ''}`} style={{ margin: 0 }}>{status.msg}</p>}
                {Object.keys(errors).length > 0 && <p className="sr-only">Please fix {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? 's' : ''}.</p>}
              </div>

              <button type="submit" className="btn btn--primary btn--block" disabled={!sel || status?.type === 'loading'}>
                {status?.type === 'loading' ? 'Please wait…' : ctaLabel}
              </button>
              <p className="fine" style={{ textAlign: 'center' }}>
                {isRound
                  ? `Secure payment via Cashfree. Only the ${POLICIES.advancePercentRoundTrip}% advance is charged now.`
                  : 'Pay nothing now. We confirm your booking with you on WhatsApp.'}
              </p>
            </form>
          </aside>
        </div>
      </main>

      {sel && !sheetOpen && (
        <div className="mbar">
          <div>
            <span className="mbar__label">{sel.car.name} · total</span>
            <span className="num">{formatINR(sel.fare.total)}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setSheetOpen(true)}>Continue →</button>
        </div>
      )}
    </>
  );
}
