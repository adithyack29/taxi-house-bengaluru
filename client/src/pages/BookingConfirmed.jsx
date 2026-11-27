import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FlowHeader from '../components/site/FlowHeader';
import Seo from '../components/site/Seo';
import { supabase } from '../lib/supabase';
import { formatINR, POLICIES } from '../lib/fares';
import { formatTime, prettyDate } from '../utils/formatters';
import { BUSINESS, waUrl } from '../data/business';

const short = (s = '') => s.split(',')[0].trim();
const read = () => { try { return JSON.parse(sessionStorage.getItem('th:booking') || 'null'); } catch { return null; } };

// Pickup is entered in Bengaluru local time (IST).
const pickupDate = (date, time) => new Date(`${date}T${time}:00+05:30`);
const fmtIST = (d) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' });

function downloadIcs(b) {
  const start = pickupDate(b.date, b.time);
  const end = new Date(start.getTime() + 3600e3);
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s = '') => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taxi House Bengaluru//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.ref}@taxihousebengaluru.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Taxi House pickup · ${short(b.pickup)} → ${short(b.drop)}`)}`,
    `LOCATION:${esc(b.pickup)}`,
    `DESCRIPTION:${esc(`Booking ${b.ref}\nCar: ${b.car}\nFare: ${formatINR(b.total)}\nDispatch: ${BUSINESS.phoneDisplay}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Taxi House pickup in 2 hours', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `taxi-house-${b.ref}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BookingConfirmed() {
  const [sp] = useSearchParams();
  const orderId = sp.get('order_id');
  const ref = sp.get('ref');
  const [state, setState] = useState(() => (orderId ? { status: 'verifying' } : { status: 'ready', booking: read() }));

  // Cashfree return — verification logic unchanged from the old /payment-success page.
  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await fetch('/api/cashfree-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId }) });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(typeof (e.details || e.error) === 'string' ? (e.details || e.error) : 'Server error during verification');
        }
        const v = await res.json();
        if (v.status === 'PENDING') { if (alive) setState({ status: 'pending' }); return; }
        if (v.status !== 'SUCCESS') throw new Error(v.message || `Payment status: ${v.status}`);
        const { data, error } = await supabase.from('bookings').select('*').eq('cashfree_order_id', orderId);
        if (error) throw error;
        if (!data?.length) throw new Error(`No booking found for order ${orderId}`);
        const row = data[0];
        const local = read();
        if (!alive) return;
        setState({
          status: 'ready',
          booking: {
            mode: 'cashfree',
            ref: row.audit_data?.booking_ref || orderId,
            name: row.user_name, pickup: row.pickup, drop: row.drop_off,
            date: row.booking_date, time: String(row.booking_time).slice(0, 5), car: row.car_type,
            token: row.amount, total: row.audit_data?.totalFare ?? local?.total ?? null,
          },
        });
      } catch (err) {
        if (alive) setState({ status: 'error', msg: err.message || 'We couldn’t verify the payment.' });
      }
    })();
    return () => { alive = false; };
  }, [orderId]);

  // WhatsApp bookings: hand the pre-filled message to WhatsApp once, like the old flow did.
  const b = state.booking;
  useEffect(() => {
    if (b?.mode !== 'whatsapp' || b.opened) return undefined;
    sessionStorage.setItem('th:booking', JSON.stringify({ ...b, opened: true }));
    const t = setTimeout(() => { window.location.href = waUrl(b.waText); }, 1600);
    return () => clearTimeout(t);
  }, [b]);

  const seo = <Seo title="Booking confirmed | Taxi House Bengaluru" description="Your Taxi House Bengaluru booking summary." path="/booking-confirmed" noindex />;

  if (state.status !== 'ready' || !b) {
    const msg = state.status === 'verifying' ? ['Verifying your payment…', 'This takes a few seconds. Please don’t close this page.']
      : state.status === 'pending' ? ['Payment is processing', 'Your bank hasn’t confirmed yet. Refresh in a minute, or WhatsApp us with your order ID.']
        : state.status === 'error' ? ['We couldn’t confirm this booking', state.msg]
          : ['No booking to show', ref ? `Reference ${ref}. If you didn’t finish on WhatsApp, message us and we’ll pick it up.` : 'Start a new booking from the home page.'];
    return (
      <>
        {seo}
        <FlowHeader step={3} showSteps={false} />
        <main id="main" className="done wrap" aria-busy={state.status === 'verifying'}>
          <div aria-live="polite">
            {state.status === 'verifying' && <div className="spinner" aria-hidden="true" />}
            <h1 className="h1 done__title" style={{ fontSize: 'clamp(32px, 24px + 2vw, 52px)' }}>{msg[0]}</h1>
            <p className="lede muted done__lede">{msg[1]}{orderId && state.status !== 'verifying' ? <> Order: <span className="mono">{orderId}</span></> : null}</p>
          </div>
          {state.status !== 'verifying' && (
            <div className="done__actions">
              {(state.status === 'error' || state.status === 'pending') && <button type="button" className="btn btn--ink btn--pill" onClick={() => window.location.reload()}>Try again</button>}
              <a className="btn btn--outline btn--pill" href={waUrl(`Hi, about my booking ${orderId || ref || ''}`)} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              <Link className="btn btn--outline btn--pill" to="/">Home</Link>
            </div>
          )}
        </main>
      </>
    );
  }

  const first = (b.name || '').trim().split(/\s+/)[0] || 'there';
  const paid = b.mode === 'cashfree';
  const start = b.date && b.time ? pickupDate(b.date, b.time) : null;
  const eta = start ? fmtIST(new Date(start.getTime() - POLICIES.driverDetailsLeadHours * 3600e3)) : null;
  const manage = waUrl(`Hi Taxi House, about my booking ${b.ref} (${short(b.pickup)} → ${short(b.drop)}, ${b.date} ${b.time}).`);

  return (
    <>
      {seo}
      <FlowHeader step={4} showSteps={false} />
      <main id="main" className="done">
        <div className="wrap done__grid">
          <div>
            <div className="check-circle" aria-hidden="true">✓</div>
            <h1 className="h1 done__title">{paid ? <>You’re booked, {first}.</> : <>Request sent, {first}.</>}</h1>
            {paid ? (
              <p className="lede muted done__lede">
                Your chauffeur’s name, number and plate arrive on WhatsApp{eta && <> by <strong style={{ color: 'var(--ink)' }}>{eta}</strong></>} — {POLICIES.driverDetailsLeadHours} hours before pickup.
              </p>
            ) : (
              <p className="lede muted done__lede" aria-live="polite">
                We’re opening WhatsApp with your booking details — just tap send and we’ll confirm. Chauffeur details follow{eta && <> by <strong style={{ color: 'var(--ink)' }}>{eta}</strong></>}.
              </p>
            )}
            <div className="done__actions">
              {!paid && <a className="btn btn--primary btn--pill" href={waUrl(b.waText)}>Send on WhatsApp</a>}
              {b.date && b.time && <button type="button" className="btn btn--ink btn--pill" onClick={() => downloadIcs(b)}>Add to calendar</button>}
              <a className="btn btn--outline btn--pill" href={manage} target="_blank" rel="noopener noreferrer">
                <span className="m-only">Chat on WhatsApp</span><span className="d-only">Manage booking</span>
              </a>
            </div>
          </div>

          <section className="ticket" aria-label="Booking summary">
            <div className="ticket__head on-ink">
              <span className="eyebrow accent-text">Booking ID</span>
              <span className="ticket__id">{b.ref}</span>
            </div>
            <div className="checker checker--sm" aria-hidden="true" />
            <dl>
              <div><dt>Route</dt><dd>{short(b.pickup)} → {short(b.drop)}</dd></div>
              <div><dt>Pickup</dt><dd className="mono">{prettyDate(b.date)} · {b.time ? formatTime(b.time) : ''}</dd></div>
              <div><dt>Car</dt><dd>{b.car}</dd></div>
              {paid && b.token ? <div><dt>Advance paid</dt><dd className="mono">{formatINR(b.token)}</dd></div> : null}
              {b.total != null && (
                <div className="ticket__total">
                  <dt>{paid && b.token ? 'Balance due' : 'Total'}</dt>
                  <dd>{formatINR(paid && b.token ? b.total - b.token : b.total)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </main>
    </>
  );
}
