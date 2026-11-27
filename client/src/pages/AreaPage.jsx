import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import ActionBar from '../components/site/ActionBar';
import Seo from '../components/site/Seo';
import { useCars } from '../hooks/useCars';
import { BUSINESS, TEL_URL, waUrl } from '../data/business';
import {
  POLICIES, formatINR, indicativeOneWay, airportFare, minOf, vehicleClass,
} from '../lib/fares';
import {
  AIRPORT, areaMeta, areaPath, areaJsonLd, bookLinks, fmtMin, nearbyAreas, routesFor, ZONES,
} from '../lib/areas';

const listJoin = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);

function cheapestSedan(cars) {
  const s = cars.filter((c) => vehicleClass(c.name) === 'sedan' && c.price_per_km_one_way > 0);
  return s.sort((a, b) => a.price_per_km_one_way - b.price_per_km_one_way)[0] || null;
}

function buildFaq(a, { sedan, airportFrom, localFrom }) {
  const air = a.airport;
  const mysuru = routesFor(a).find((r) => r.slug === 'mysuru');
  const faq = [
    {
      q: `How far is Bangalore airport (KIA) from ${a.name}?`,
      a: `${AIRPORT.name} is about ${air.km} km from ${a.name} by road. Drive time depends heavily on Bengaluru traffic — for a flight, leave early, especially at peak hours.`,
    },
    {
      q: `How much is a cab from ${a.name} to Bangalore airport?`,
      a: airportFrom
        ? `Airport transfers are a fixed fare, from ${formatINR(airportFrom)} for a sedan. You see the exact fare for every car before you book. Tolls and parking are paid at actuals.`
        : 'Airport transfers are a fixed fare — enter your pickup and you see the exact fare for every car before you book. Tolls and parking are paid at actuals.',
    },
  ];
  if (mysuru && sedan) {
    faq.push({
      q: `Can I book a one-way outstation cab from ${a.name}?`,
      a: `Yes. One-way drops are charged one way only — from ₹${sedan.price_per_km_one_way}/km in a sedan, driver allowance included. For example, ${a.name} to Mysuru is about ${mysuru.km} km, from ${formatINR(indicativeOneWay(sedan, mysuru.km))}.`,
    });
  }
  if (localFrom) {
    faq.push({
      q: `Do you have local hourly cabs in ${a.name}?`,
      a: `Yes — a car with a chauffeur for ${POLICIES.localPackage.toLowerCase()}, from ${formatINR(localFrom)}. Good for meetings, shopping, hospital visits or a wedding day.`,
    });
  }
  if (a.subs?.length) {
    faq.push({
      q: `Do you pick up from all parts of ${a.name}?`,
      a: `Yes — anywhere in ${a.name}, including ${listJoin(a.subs)}.`,
    });
  }
  faq.push({
    q: 'How early do I need to book?',
    a: `Online bookings open ${POLICIES.advanceBookingHours} hours ahead. Need a cab sooner? Call or WhatsApp ${BUSINESS.phoneDisplay} — the desk is open 24×7.`,
  });
  return faq;
}

export default function AreaPage({ area: a }) {
  // Bundled fares first so the prerendered HTML carries real numbers; live /admin rates replace them.
  const { cars: outstation } = useCars('outstation', { fallbackFirst: true });
  const { cars: local } = useCars('local', { fallbackFirst: true });
  const { cars: airportCars } = useCars('airport', { fallbackFirst: true });

  const meta = areaMeta(a);
  const links = bookLinks(a);
  const routes = routesFor(a);
  const nearby = nearbyAreas(a);
  const zone = ZONES.find((z) => z.key === a.zone);

  const sedan = useMemo(() => cheapestSedan(outstation), [outstation]);
  const airportFrom = useMemo(() => minOf(airportCars.filter((c) => vehicleClass(c.name) === 'sedan'), airportFare)
    || minOf(airportCars, airportFare), [airportCars]);
  const localFrom = minOf(local, (c) => c.base_fare);
  const faq = buildFaq(a, { sedan, airportFrom, localFrom });
  const waText = `Hi Taxi House, I need a cab from ${a.name}.`;

  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(areaJsonLd(a, faq)) }} />
      <SiteHeader tone="white" />
      <main id="main">
        <section className="hero hero--light area-hero" aria-labelledby="area-title">
          <div className="wrap">
            <nav className="crumbs" aria-label="Breadcrumb">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/areas">Areas we serve</Link></li>
                <li aria-current="page">{a.name}</li>
              </ol>
            </nav>
            <p className="eyebrow eyebrow--dot accent-text">{zone?.label || 'Bengaluru'} · 24×7</p>
            <h1 id="area-title" className="h1 area-hero__title">Taxi service in {a.name}</h1>
            <p className="lede muted area-hero__lede">
              Airport transfers, one-way and round-trip outstation cabs, and local hourly cars with a chauffeur — picked up
              anywhere in {a.name}{a.subs?.length ? ` (${listJoin(a.subs.slice(0, 4))}${a.subs.length > 4 ? ' and more' : ''})` : ''}.
              All-in fares shown before you book.
            </p>
            <dl className="area-facts">
              <div><dt className="eyebrow muted">To KIA airport</dt><dd><span className="num">{a.airport.km} km</span> by road</dd></div>
              {a.centre && <div><dt className="eyebrow muted">To city centre</dt><dd><span className="num">{a.centre.km} km</span> by road</dd></div>}
              {sedan && <div><dt className="eyebrow muted">Outstation, one way</dt><dd>from <span className="num">₹{sedan.price_per_km_one_way}/km</span></dd></div>}
            </dl>
            <div className="area-hero__actions">
              <Link className="btn btn--primary btn--pill" to={links.outstation}>Book a cab from {a.name}</Link>
              <a className="btn btn--outline btn--pill mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
              <a className="btn btn--outline btn--pill" href={waUrl(waText)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </section>
        <div className="checker" aria-hidden="true" />

        {/* Airport */}
        <section className="section" aria-labelledby="air-title">
          <div className="wrap area-split">
            <div>
              <p className="eyebrow muted">Airport transfer</p>
              <h2 id="air-title" className="h2">{a.name} to Bangalore Airport taxi</h2>
              <p className="muted area-copy">
                Fixed-fare cabs between {a.name} and {AIRPORT.name}, any hour of the day or night. The trip is about{' '}
                {a.airport.km} km by road; drive time depends on traffic, so leave early for a flight. Landing at KIA? Book
                the reverse trip and your chauffeur picks you up at the airport.
              </p>
            </div>
            <div className="card area-card">
              <dl className="area-dl">
                <div><dt>Distance</dt><dd className="num">{a.airport.km} km</dd></div>
                <div><dt>Fare</dt><dd>{airportFrom ? <>from <span className="num">{formatINR(airportFrom)}</span></> : 'Fixed — shown before you book'}</dd></div>
              </dl>
              <div className="area-card__actions">
                <Link className="btn btn--primary btn--block" to={links.toAirport}>{a.name} → Airport</Link>
                <Link className="btn btn--outline btn--block" to={links.fromAirport}>Airport → {a.name}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Outstation */}
        {routes.length > 0 && (
          <section className="section bg-paper-2" aria-labelledby="out-title">
            <div className="wrap">
              <div className="sec-head">
                <div>
                  <p className="eyebrow muted">Outstation</p>
                  <h2 id="out-title" className="h2">Outstation cabs from {a.name}</h2>
                </div>
                <p className="muted sec-head__note">Distances from {a.name}. One-way drops are charged one way only; driver allowance included, tolls and permits at actuals.</p>
              </div>
              <div className="board board--table">
                <table className="tbl">
                  <caption className="sr-only">One-way cab fares from {a.name} with distance and drive time</caption>
                  <thead>
                    <tr>
                      <th scope="col">From {a.name} to</th>
                      <th scope="col">Distance</th>
                      <th scope="col">Drive</th>
                      <th scope="col">Sedan, one way</th>
                      <th scope="col"><span className="sr-only">Book</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((r) => (
                      <tr key={r.slug}>
                        <th scope="row" className="board__dest"><span className="board__name">{r.name}</span></th>
                        <td className="mono">{r.km} km</td>
                        <td className="mono">~{fmtMin(r.minutes)}</td>
                        <td className="num board__fare">{sedan ? formatINR(indicativeOneWay(sedan, r.km)) : '—'}</td>
                        <td className="board__cta"><Link className="btn btn--outline btn--pill btn--sm" to={links.route(r)} aria-label={`Book ${a.name} to ${r.name}`}>Book</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="board board--list">
                {routes.map((r) => (
                  <li key={r.slug}>
                    <Link to={links.route(r)} className="board__row">
                      <span>
                        <span className="board__name">{r.name}</span>
                        <span className="board__meta mono">{r.km} km · ~{fmtMin(r.minutes)}</span>
                      </span>
                      <span className="board__from">
                        <span className="eyebrow muted">From</span>
                        <span className="num">{sedan ? formatINR(indicativeOneWay(sedan, r.km)) : '—'}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Local + pickup points */}
        <section className="section" aria-labelledby="local-title">
          <div className="wrap area-split">
            <div>
              <p className="eyebrow muted">Local hourly</p>
              <h2 id="local-title" className="h2">Local taxi in {a.name}</h2>
              <p className="muted area-copy">
                A car and chauffeur on standby for {POLICIES.localPackage.toLowerCase()}
                {localFrom ? <>, from <span className="num">{formatINR(localFrom)}</span></> : ''} — for office runs, shopping,
                hospital visits or a wedding day in and around {a.name}.
              </p>
              <Link className="btn btn--ink btn--pill" to={links.local}>Book a local cab</Link>
            </div>
            <div>
              <h3 className="h3 area-subhead">Pickup points in and around {a.name}</h3>
              {a.subs?.length > 0 && (
                <ul className="chips area-chips" aria-label={`Parts of ${a.name} we cover`}>
                  {a.subs.map((s) => <li key={s} className="chip">{s}</li>)}
                </ul>
              )}
              {nearby.length > 0 && (
                <>
                  <p className="eyebrow muted area-nearby-label">Nearby areas</p>
                  <ul className="area-nearby">
                    {nearby.map((n) => <li key={n.slug}><Link to={areaPath(n)}>Taxi in {n.name}</Link></li>)}
                  </ul>
                </>
              )}
              <Link className="link-arrow" to="/areas">All areas we serve →</Link>
            </div>
          </div>
        </section>

        {/* FAQ + CTA */}
        <section className="section" aria-labelledby="faq-title">
          <div className="wrap area-faq">
            <h2 id="faq-title" className="h2">Cabs in {a.name}: straight answers</h2>
            <div className="faq">
              {faq.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p className="muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="wrap">
            <div className="ctaband on-accent">
              <div>
                <h2 className="h2">Need a cab in {a.name} today?</h2>
                <p className="ctaband__sub">Online booking needs {POLICIES.advanceBookingHours} hours’ notice. For anything sooner, call or WhatsApp the desk.</p>
              </div>
              <div className="ctaband__actions">
                <a className="btn btn--ink btn--pill mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
                <a className="btn btn--outline btn--pill" href={waUrl(waText)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}
