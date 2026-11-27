import { useRef, useState } from 'react';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import Seo from '../components/site/Seo';
import { supabase } from '../lib/supabase';
import { normalizeIndianMobile, MOBILE_ERROR } from '../utils/validation';
import { BUSINESS, ADDRESS_ONE_LINE, MAPS_URL, TEL_URL, waUrl } from '../data/business';

const TYPES = [
  { value: 'Corporate account', short: 'Corporate' },
  { value: 'Wedding fleet', short: 'Wedding' },
  { value: 'Tour / group', short: 'Tour / group' },
];

export default function Contact() {
  const [form, setForm] = useState({ type: TYPES[0].value, name: '', phone: '', details: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const statusRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    const phone = normalizeIndianMobile(form.phone);
    if (!phone) errs.phone = MOBILE_ERROR;
    if (!form.details.trim()) errs.details = 'Tell us the dates, cars needed and pickup city.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(errs.name ? 'q-name' : errs.phone ? 'q-phone' : 'q-details')?.focus();
      return;
    }
    setStatus('loading');
    try {
      // Same handler as before: the Supabase `messages` table, shown in /admin → Messages.
      const { error } = await supabase.from('messages').insert([{
        name: form.name.trim(),
        phone,
        email: null,
        message: `[Group enquiry: ${form.type}] ${form.details.trim()}`,
      }]);
      if (error) throw error;
      setStatus('success');
      setForm({ type: TYPES[0].value, name: '', phone: '', details: '' });
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus('error');
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  const fieldProps = (k) => ({
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `q-${k}-err` : undefined,
  });

  return (
    <div className="on-ink" style={{ minHeight: '100vh' }}>
      <Seo
        title="Contact Taxi House Bengaluru — 24×7 Cab Booking & Group Enquiries"
        description={`Call ${BUSINESS.phoneDisplay} or WhatsApp to book a cab in Bengaluru. Corporate accounts, wedding fleets and tour groups — request a quote.`}
        path="/contact"
      />
      <SiteHeader tone="ink" mobileTitle="TAXI HOUSE" />
      <main id="main" className="contact">
        <div className="wrap contact__grid">
          <div>
            <h1 className="h1">A human picks up. <span className="accent-text">Any hour.</span></h1>
            <div className="contact__quick">
              <a className="btn btn--primary mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
              <a className="btn btn--outline" href={waUrl()} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
            </div>
            <dl className="cdl">
              <div className="cdl__hide-m">
                <dt>Call 24×7</dt>
                <dd>
                  <a className="cdl__phone" href={TEL_URL}>{BUSINESS.phoneDisplay}</a><br />
                  <a className="mono" href={`tel:${BUSINESS.phoneAlt}`} style={{ fontSize: 15, color: 'var(--muted-dark)' }}>{BUSINESS.phoneAltDisplay}</a>
                </dd>
              </div>
              <div className="cdl__hide-m">
                <dt>WhatsApp</dt>
                <dd><a href={waUrl()} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd>
              </div>
              <div>
                <dt>Office</dt>
                <dd><a href={MAPS_URL} target="_blank" rel="noopener noreferrer">{ADDRESS_ONE_LINE}</a></dd>
              </div>
            </dl>
          </div>

          <form className="qform" onSubmit={submit} noValidate aria-labelledby="q-title">
            <h2 id="q-title">Corporate, wedding or group travel?</h2>
            <p className="muted">Tell us the plan and we’ll come back with a fleet quote.</p>

            <fieldset className="chips">
              <legend className="sr-only">Enquiry type</legend>
              {TYPES.map((t) => (
                <label key={t.value} className="chip">
                  <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={set('type')} />
                  <span className="m-only">{t.short}</span><span className="d-only">{t.value}</span>
                </label>
              ))}
            </fieldset>

            <div className="fld-row">
              <div>
                <div className="fld" data-invalid={!!errors.name}>
                  <label className="fld__label" htmlFor="q-name">Name</label>
                  <input id="q-name" className="fld__input" autoComplete="name" placeholder="Full name" value={form.name} onChange={set('name')} required {...fieldProps('name')} />
                </div>
                {errors.name && <p id="q-name-err" className="fld-error">{errors.name}</p>}
              </div>
              <div>
                <div className="fld" data-invalid={!!errors.phone}>
                  <label className="fld__label" htmlFor="q-phone">Mobile</label>
                  <input id="q-phone" className="fld__input mono" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={form.phone} onChange={set('phone')} required {...fieldProps('phone')} />
                </div>
                {errors.phone && <p id="q-phone-err" className="fld-error">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <div className="fld" data-invalid={!!errors.details}>
                <label className="fld__label" htmlFor="q-details">Details</label>
                <textarea id="q-details" className="fld__input" rows={4} placeholder="Dates, cars needed, pickup city…" value={form.details} onChange={set('details')} required {...fieldProps('details')} />
              </div>
              {errors.details && <p id="q-details-err" className="fld-error">{errors.details}</p>}
            </div>

            <div aria-live="polite" ref={statusRef} tabIndex={-1}>
              {status === 'success' && <p className="status" style={{ margin: 0 }}>Thanks — we’ve got your request and will contact you on the number you gave.</p>}
              {status === 'error' && <p className="status status--error" style={{ margin: 0 }}>Something went wrong sending that. Please try again, or WhatsApp us.</p>}
              {Object.keys(errors).length > 0 && <p className="sr-only">Please fix the highlighted fields.</p>}
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Request a quote'}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
