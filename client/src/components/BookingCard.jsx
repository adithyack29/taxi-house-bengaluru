import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationInput from './LocationInput';
import { POLICIES } from '../lib/fares';

// Business rules carried over unchanged from the old BookingForm.jsx:
// 48h advance booking, airport auto-fill, multi-stop outstation with halt durations,
// mandatory return date for round trips and no same-day return on long (>150 km one-way) trips.
const AIRPORT = { name: 'Kempegowda International Airport', coords: { lat: 13.1986, lng: 77.7066 } };
const TABS = [
  { id: 'one-way', label: 'One way' },
  { id: 'two-way', label: 'Round trip' },
  { id: 'airport', label: 'Airport' },
  { id: 'local', label: 'Local hourly' },
];
const STOP_DURATIONS = [
  [0, 'Pass through (no wait)'], [1, 'Quick stop (1 hour)'], [2, 'Short break (2 hours)'],
  [4, 'Half day (4 hours)'], [8, 'Full day (8 hours)'], [-1, 'Overnight (resumes 6 AM)'],
];

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s, n) => { if (!s) return ''; const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1, d); t.setDate(t.getDate() + n); return ymd(t); };
const minAllowed = () => new Date(Date.now() + POLICIES.advanceBookingHours * 3600e3);
function nextSlot() {
  const t = minAllowed();
  const day = t.getDate();
  const mins = t.getMinutes();
  let r;
  if (mins < 15) r = 15; else if (mins < 30) r = 30; else if (mins < 45) r = 45; else { r = 0; t.setHours(t.getHours() + 1); }
  return { date: ymd(t), time: `${String(t.getHours()).padStart(2, '0')}:${String(r).padStart(2, '0')}`, rolled: t.getDate() !== day };
}
const parseCoord = (s) => { if (!s) return null; const [lat, lng] = s.split(',').map(Number); return lat && lng ? { lat, lng } : null; };
const safeArr = (s) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

function initialState(sp) {
  const slot = nextSlot();
  const type = sp.get('type') || 'outstation';
  const trip = sp.get('trip') || 'one-way';
  const tab = type === 'airport' ? 'airport' : type === 'local' ? 'local' : trip;
  const airport = sp.get('airport') || 'to-airport';
  const s = {
    tab,
    airport,
    pickup: sp.get('pickup') || '',
    pickupCoords: parseCoord(sp.get('pickupCoord')),
    drop: sp.get('drop') || '',
    dropCoords: parseCoord(sp.get('dropCoord')),
    date: sp.get('date') || slot.date,
    time: sp.get('time') || slot.time,
    returnDate: sp.get('returnDate') || '',
    localPackage: sp.get('package') || POLICIES.localPackage,
    stops: safeArr(sp.get('stops')),
    stopCoords: safeArr(sp.get('stopCoords')).map(parseCoord),
    stopDurations: safeArr(sp.get('stopDurations')),
  };
  if (tab === 'airport') applyAirport(s);
  return s;
}
function applyAirport(s) {
  if (s.airport === 'to-airport') { s.drop = AIRPORT.name; s.dropCoords = AIRPORT.coords; }
  else { s.pickup = AIRPORT.name; s.pickupCoords = AIRPORT.coords; }
  return s;
}

export default function BookingCard() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState(() => initialState(sp));
  const [dist, setDist] = useState({ key: '', km: null });
  const [error, setError] = useState('');
  const errRef = useRef(null);
  const minDate = ymd(minAllowed());

  const isOutstation = f.tab === 'one-way' || f.tab === 'two-way';
  const routeKey = isOutstation && f.pickupCoords && f.dropCoords
    ? JSON.stringify([f.pickupCoords, f.stopCoords, f.dropCoords])
    : '';
  const oneWayKm = routeKey && dist.key === routeKey ? dist.km : null;
  const isLong = f.tab === 'two-way' && oneWayKm != null && (oneWayKm > 150 || Math.ceil((oneWayKm * 2) / POLICIES.minKmPerDayRoundTrip) > 1);

  const setTab = (tab) => {
    if (tab === f.tab) return;
    setError('');
    setF((p) => {
      const n = { ...p, tab, pickup: '', pickupCoords: null, drop: '', dropCoords: null, stops: [], stopCoords: [], stopDurations: [] };
      return tab === 'airport' ? applyAirport(n) : n;
    });
  };
  const setAirport = (airport) => setF((p) => applyAirport({ ...p, airport, pickup: '', pickupCoords: null, drop: '', dropCoords: null }));

  const onLoc = useCallback((e) => {
    const { name, value, coords } = e.target;
    setF((p) => ({ ...p, [name]: value, [`${name}Coords`]: coords || (value === p[name] ? p[`${name}Coords`] : null) }));
  }, []);

  const onDate = (value) => setF((p) => {
    const n = { ...p, date: value };
    if (value === minDate) { const s = nextSlot(); n.time = s.time; if (s.rolled) n.date = addDays(minDate, 1); }
    else n.time = '10:00';
    if (p.returnDate && p.returnDate < value) n.returnDate = value;
    return n;
  });

  // Road distance for outstation (OSRM, as before) — drives the long-trip return-date rule.
  // Stored with the route key it belongs to, so a stale distance never applies to a new route.
  useEffect(() => {
    if (!isOutstation || !f.pickupCoords || !f.dropCoords) return undefined;
    const ctl = new AbortController();
    const key = routeKey;
    const pts = [f.pickupCoords, ...f.stopCoords.filter(Boolean), f.dropCoords].map((c) => `${c.lng},${c.lat}`).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?overview=false`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.code !== 'Ok') return;
        const km = d.routes[0].distance / 1000;
        setDist({ key, km });
        // As before: long round trips can't return the same day — nudge the return date forward.
        if (km > 150 || Math.ceil((km * 2) / POLICIES.minKmPerDayRoundTrip) > 1) {
          setF((p) => (p.tab === 'two-way' && p.returnDate && p.returnDate <= p.date ? { ...p, returnDate: addDays(p.date, 1) } : p));
        }
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [isOutstation, routeKey, f.pickupCoords, f.dropCoords, f.stopCoords]);

  const fail = (msg) => { setError(msg); requestAnimationFrame(() => errRef.current?.focus()); };

  const submit = (e) => {
    e.preventDefault();
    if (!f.pickup.trim() || f.pickup === 'Locating…') return fail('Please enter a pickup location.');
    if (f.tab !== 'local' && !f.drop.trim()) return fail('Please enter where you’re going.');
    const pickupAt = new Date(`${f.date}T${f.time || '00:00'}:00`);
    if (isNaN(pickupAt) || pickupAt < minAllowed()) return fail(`Bookings must be made at least ${POLICIES.advanceBookingHours} hours in advance. For anything sooner, call or WhatsApp us.`);
    if (f.tab === 'two-way') {
      if (!f.returnDate) return fail('Please choose a return date for your round trip.');
      if (isLong && f.returnDate <= f.date) return fail('Same-day return is not available for long-distance round trips. Please choose a later return date.');
    }
    const type = isOutstation ? 'outstation' : f.tab;
    const startHour = pickupAt.getHours();
    const params = new URLSearchParams({
      pickup: f.pickup,
      pickupCoord: f.pickupCoords ? `${f.pickupCoords.lat},${f.pickupCoords.lng}` : '',
      drop: f.drop,
      dropCoord: f.dropCoords ? `${f.dropCoords.lat},${f.dropCoords.lng}` : '',
      date: f.date,
      time: f.time,
      type,
      stops: JSON.stringify(f.stops),
      stopCoords: JSON.stringify(f.stopCoords.map((c) => (c ? `${c.lat},${c.lng}` : ''))),
      stopDurations: JSON.stringify(f.stopDurations),
    });
    if (isOutstation) {
      params.set('trip', f.tab);
      params.set('returnDate', f.tab === 'two-way' ? f.returnDate : '');
      // Same default as before: night starts default to the expedited (day & night) plan.
      params.set('strategy', startHour >= 19 || startHour < 6 ? 'expedited' : 'day-only');
    } else if (f.tab === 'local') params.set('package', f.localPackage);
    else params.set('airport', f.airport);
    navigate(`/book?${params.toString()}`);
    return undefined;
  };

  const dropLabel = f.tab === 'two-way' ? 'Destination' : f.tab === 'airport' && f.airport === 'to-airport' ? 'Drop / Terminal' : 'Drop';
  const pickupLabel = f.tab === 'airport' && f.airport === 'from-airport' ? 'Pickup / Terminal' : 'Pickup';

  return (
    <form className="bcard" onSubmit={submit} noValidate aria-labelledby="bcard-title">
      <div className="bcard__head">
        <h2 id="bcard-title" className="bcard__title">Plan your trip</h2>
        <p className="eyebrow muted bcard__step">Step 1 / 3</p>
      </div>

      <div className="seg" role="group" aria-label="Trip type">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="seg__btn" aria-pressed={f.tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="bcard__fields">
        {f.tab === 'airport' && (
          <div className="seg seg--sm" role="group" aria-label="Airport direction">
            {[['to-airport', 'To airport'], ['from-airport', 'From airport']].map(([v, l]) => (
              <button key={v} type="button" className="seg__btn" aria-pressed={f.airport === v} onClick={() => setAirport(v)}>{l}</button>
            ))}
          </div>
        )}

        <div className="fld">
          <label className="fld__label" htmlFor="bk-pickup">{pickupLabel}</label>
          <LocationInput id="bk-pickup" name="pickup" value={f.pickup} onChange={onLoc} placeholder="Area, landmark or address" autoLocate />
        </div>

        {isOutstation && f.stops.map((stop, i) => (
          <div className="bcard__stop" key={i}>
            <div className="fld">
              <label className="fld__label" htmlFor={`bk-stop-${i}`}>Stop {i + 1}</label>
              <LocationInput
                id={`bk-stop-${i}`}
                name={`stop-${i}`}
                value={stop}
                placeholder="Add a stop"
                onChange={(e) => setF((p) => {
                  const stops = [...p.stops]; const stopCoords = [...p.stopCoords];
                  stops[i] = e.target.value; stopCoords[i] = e.target.coords || null;
                  return { ...p, stops, stopCoords };
                })}
              />
            </div>
            <div className="fld">
              <label className="fld__label" htmlFor={`bk-stopdur-${i}`}>Halt</label>
              <select
                id={`bk-stopdur-${i}`}
                className="fld__input"
                value={f.stopDurations[i] || 0}
                onChange={(e) => setF((p) => { const d = [...p.stopDurations]; d[i] = Number(e.target.value); return { ...p, stopDurations: d }; })}
              >
                {STOP_DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button
              type="button"
              className="bcard__remove"
              aria-label={`Remove stop ${i + 1}`}
              onClick={() => setF((p) => ({ ...p, stops: p.stops.filter((_, j) => j !== i), stopCoords: p.stopCoords.filter((_, j) => j !== i), stopDurations: p.stopDurations.filter((_, j) => j !== i) }))}
            >×</button>
          </div>
        ))}

        {f.tab === 'local' ? (
          <div className="fld">
            <label className="fld__label" htmlFor="bk-package">Package</label>
            <select id="bk-package" className="fld__input" value={f.localPackage} onChange={(e) => setF((p) => ({ ...p, localPackage: e.target.value }))}>
              <option value={POLICIES.localPackage}>{POLICIES.localPackage}</option>
            </select>
          </div>
        ) : (
          <div className="fld">
            <label className="fld__label" htmlFor="bk-drop">{dropLabel}</label>
            <LocationInput id="bk-drop" name="drop" value={f.drop} onChange={onLoc} placeholder={f.tab === 'airport' ? 'Area, landmark or address' : 'City or address'} />
          </div>
        )}

        {isOutstation && f.stops.length < 5 && (
          <button
            type="button"
            className="bcard__addstop"
            onClick={() => setF((p) => ({ ...p, stops: [...p.stops, ''], stopCoords: [...p.stopCoords, null], stopDurations: [...p.stopDurations, 0] }))}
          >+ Add a stop on the way</button>
        )}

        <div className="fld-row">
          <div className="fld">
            <label className="fld__label" htmlFor="bk-date">Date</label>
            <input id="bk-date" className="fld__input" type="date" required min={minDate} value={f.date} onChange={(e) => onDate(e.target.value)} />
          </div>
          <div className="fld">
            <label className="fld__label" htmlFor="bk-time">Time</label>
            <input id="bk-time" className="fld__input" type="time" required step="900" value={f.time} onChange={(e) => setF((p) => ({ ...p, time: e.target.value }))} />
          </div>
        </div>

        {f.tab === 'two-way' && (
          <div className="fld">
            <label className="fld__label" htmlFor="bk-return">Return date</label>
            <input
              id="bk-return"
              className="fld__input"
              type="date"
              required
              min={isLong ? addDays(f.date, 1) : f.date}
              max={addDays(f.date, 7)}
              value={f.returnDate}
              onChange={(e) => setF((p) => ({ ...p, returnDate: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div aria-live="assertive" className="bcard__error">
        {error && <p ref={errRef} tabIndex={-1} className="status status--error" style={{ margin: 0 }}>{error}</p>}
      </div>

      <button type="submit" className="btn btn--primary btn--block bcard__cta">See all-in fares →</button>
      <p className="fine bcard__fine">Fares include driver allowance. Tolls, parking and state permits at actuals.</p>
    </form>
  );
}
