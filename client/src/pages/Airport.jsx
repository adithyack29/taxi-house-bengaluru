import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import Seo from '../components/site/Seo';
import { useCars } from '../hooks/useCars';
import { airportFare, formatINR, POLICIES, vehicleClass, CLASS_META } from '../lib/fares';
import { BUSINESS, TEL_URL } from '../data/business';

// TODO: zone-based airport fares (North / Central / East / South / West) are shown in the redesign
// mockup but do not exist in the business data. The real pricing today is a flat
// `airportBillableKm` (40 km) × the car's rate from the Supabase `cars` table (category "airport").
// TODO: "flight tracked", "45 min free waiting" and "name-board meet" from the mockup are not
// documented policies — confirm with operations before adding them back.
export default function Airport() {
  const [dir, setDir] = useState('to-airport');
  const { cars, loading } = useCars('airport');
  const rows = useMemo(
    () => [...cars].sort((a, b) => airportFare(a) - airportFare(b)),
    [cars],
  );
  const bookHref = `/?type=airport&airport=${dir}#book`;
  const lateStart = `${POLICIES.dutyHours.end - 12} PM`;
  const earlyEnd = `${POLICIES.dutyHours.start} AM`;

  return (
    <>
      <Seo
        title="Bengaluru Airport Taxi (KIA) — Fixed Fares | Taxi House Bengaluru"
        description="Cabs to and from Kempegowda International Airport, Bengaluru. One fixed fare per car, shown before you book. Sedan, SUV, Innova Crysta and Tempo Traveller."
        path="/airport"
      />
      <SiteHeader tone="accent" mobileTitle="TAXI HOUSE" showPhone={false} />
      <main id="main">
        <section className="ahero on-accent" aria-labelledby="air-title">
          <div className="wrap ahero__grid">
            <div>
              <p className="eyebrow">Kempegowda International · BLR</p>
              <h1 id="air-title" className="h1">Airport runs, fixed to the rupee.</h1>
            </div>
            <ul className="ticks ticks--col">
              <li>To or from KIA, any hour of the day</li>
              <li>One fixed fare per car — no meter, no surprises</li>
              <li>Background-verified chauffeurs</li>
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="fares-title" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
          <div className="wrap">
            <div className="sec-head" style={{ alignItems: 'center' }}>
              <h2 id="fares-title" className="h2" style={{ fontSize: 'clamp(28px, 20px + 1.6vw, 40px)' }}>Airport fares</h2>
              <div className="seg" role="group" aria-label="Direction">
                {[['to-airport', 'To airport'], ['from-airport', 'From airport']].map(([v, l]) => (
                  <button key={v} type="button" className="seg__btn" aria-pressed={dir === v} onClick={() => setDir(v)}>{l}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="muted" aria-live="polite">Loading fares…</p>
            ) : rows.length === 0 ? (
              <div className="card" style={{ padding: 24 }}>
                <p style={{ marginTop: 0, fontWeight: 700 }}>Airport fares are being updated.</p>
                <p className="muted">Call <a className="mono" href={TEL_URL}>{BUSINESS.phoneDisplay}</a> for a fixed quote.</p>
              </div>
            ) : (
              <>
                <div className="card-tbl zone-tbl">
                  <table className="tbl">
                    <caption className="sr-only">Fixed airport fares {dir === 'to-airport' ? 'from your pickup to Kempegowda International Airport' : 'from Kempegowda International Airport to your drop'}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Car · {dir === 'to-airport' ? 'Pickup → KIA' : 'KIA → Drop'}</th>
                        <th scope="col">Fixed fare</th>
                        <th scope="col">Night add-on</th>
                        <th scope="col"><span className="sr-only">Book</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c.id}>
                          <th scope="row">
                            <span className="t-name">{c.name}</span>
                            <span className="t-sub">{CLASS_META[vehicleClass(c.name)].label} · {c.seats} seats · {c.is_ac === false ? 'Non-AC' : 'AC'}</span>
                          </th>
                          <td className="num">{formatINR(airportFare(c))}</td>
                          <td className="mono">+{formatINR(c.driver_bata || 300)}</td>
                          <td style={{ textAlign: 'right' }}><Link className="btn btn--outline btn--pill btn--sm" to={bookHref} aria-label={`Book ${c.name} ${dir === 'to-airport' ? 'to' : 'from'} the airport`}>Book</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="zone-cards">
                  {rows.map((c) => (
                    <li key={c.id} className="zone-card">
                      <h3>{c.name}</h3>
                      <p>{c.seats} seats · {c.is_ac === false ? 'Non-AC' : 'AC'}</p>
                      <div className="zone-card__price">
                        <span className="eyebrow">Fixed fare</span>
                        <span className="num">{formatINR(airportFare(c))}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="fine page-foot">
              Same fixed fare in both directions, covering up to {POLICIES.airportBillableKm} km. Pickups or drops between {lateStart} and {earlyEnd} add one day of driver allowance (the night add-on). Airport parking and tolls at actuals.
            </p>
            <p style={{ marginTop: 28 }}>
              <Link className="btn btn--primary" to={bookHref}>Book airport cab</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
