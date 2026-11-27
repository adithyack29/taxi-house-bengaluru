import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import ActionBar from '../components/site/ActionBar';
import Seo from '../components/site/Seo';
import Picture from '../components/site/Picture';
import { CLASS_PHOTO } from '../components/site/photos';
import BookingCard from '../components/BookingCard';
import { useCars } from '../hooks/useCars';
import FARES from '../data/fares.json';
import { BUSINESS, TEL_URL, waUrl } from '../data/business';
import { POPULAR_AREAS } from '../data/popular-areas';
import {
  POLICIES, formatINR, fmtDuration, groupByClass, indicativeOneWay, airportFare, minOf, vehicleClass,
} from '../lib/fares';

const routeHref = (r) => `/?type=outstation&trip=one-way&drop=${encodeURIComponent(r.drop)}&dropCoord=${r.coord}#book`;

const FAQ = [
  {
    q: 'What’s included in the fare?',
    a: `Distance at the car’s per-km rate plus the driver allowance (bata). Tolls, parking and interstate permits are paid at actuals. Travelling with a pet adds ${formatINR(POLICIES.petFee)}.`,
  },
  {
    q: 'Do I pay in advance?',
    a: `Outstation round trips are confirmed with a ${POLICIES.advancePercentRoundTrip}% advance paid online. One-way, airport and local bookings need no online payment — we confirm them with you on WhatsApp.`,
  },
  {
    q: 'Can I add stops on the way?',
    a: 'Yes. On outstation trips add as many stops as you need and choose how long to halt at each — the fare follows the total road distance.',
  },
  {
    q: 'How do night charges work?',
    a: `Chauffeur duty hours are ${POLICIES.dutyHours.start}:00 AM – ${POLICIES.dutyHours.end - 12}:00 PM. A pickup or drop outside those hours adds one extra day of driver allowance each. On long trips you can also choose a faster day-and-night plan, which includes night allowance.`,
  },
  {
    q: 'What if I need to cancel?',
    a: `Cancel at least ${POLICIES.freeCancellationHours} hours before pickup for a 100% refund of your advance. Cancellations within ${POLICIES.freeCancellationHours} hours are non-refundable.`,
  },
  {
    q: 'How far ahead do I need to book?',
    a: `Online bookings open ${POLICIES.advanceBookingHours} hours ahead. Leaving sooner? Call or WhatsApp us on ${BUSINESS.phoneDisplay}.`,
  },
];

export default function Home() {
  const location = useLocation();
  const { cars: outstation } = useCars('outstation');
  const { cars: local } = useCars('local');
  const { cars: airport } = useCars('airport');

  // Scroll to the booking card for /#book links (nav, footer, action bar).
  useEffect(() => {
    if (location.hash === '#book') {
      const el = document.getElementById('book');
      if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    }
  }, [location.key, location.hash]);

  const classes = useMemo(() => groupByClass(outstation).filter((g) => ['sedan', 'suv', 'crysta', 'tempo'].includes(g.key)), [outstation]);
  const sedanForBoard = useMemo(() => {
    const sedans = outstation.filter((c) => vehicleClass(c.name) === 'sedan' && c.price_per_km_one_way > 0);
    return sedans.sort((a, b) => a.price_per_km_one_way - b.price_per_km_one_way)[0] || null;
  }, [outstation]);

  const fromOutstation = minOf(outstation, (c) => c.price_per_km_one_way);
  const fromAirport = minOf(airport, airportFare);
  const fromLocal = minOf(local, (c) => c.base_fare);

  return (
    <>
      <Seo
        title="Taxi House Bengaluru | Outstation Cabs, Airport Transfers & Local Hourly Taxi"
        description="Chauffeur-driven cabs from Bengaluru: one-way and round-trip outstation, Kempegowda airport transfers and 8-hour local packages. All-in fares shown before you book."
        path="/"
      />
      <SiteHeader tone="white" />
      <main id="main">
        {/* Hero */}
        <section className="hero hero--light" aria-labelledby="hero-title">
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <p className="eyebrow eyebrow--dot accent-text">
                <span className="hero__eyebrow-long">24×7 dispatch · Outstation · Airport · Local</span>
                <span className="hero__eyebrow-short">24×7 dispatch</span>
              </p>
              <h1 id="hero-title" className="h-hero hero__title">
                Bengaluru to anywhere. <span className="accent-text">On the dot.</span>
              </h1>
              <p className="lede muted hero__lede">
                Chauffeur-driven cabs with all-in fares — quoted before you book, not after you arrive.
              </p>
              <ul className="ticks hero__ticks">
                <li>No hidden charges</li>
                <li>Background-verified chauffeurs</li>
                <li>Full refund up to {POLICIES.freeCancellationHours}h before</li>
              </ul>
            </div>
            <div className="hero__card" id="book">
              <BookingCard key={location.search} />
            </div>
          </div>
          <div className="checker" aria-hidden="true" />
        </section>

        {/* Departures board */}
        <section className="section" aria-labelledby="routes-title">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="eyebrow muted">Departures board</p>
                <h2 id="routes-title" className="h2">Popular from Bengaluru</h2>
              </div>
              <Link className="link-arrow" to="/explore">All outstation routes →</Link>
            </div>

            <div className="board board--table">
              <table className="tbl">
                <caption className="sr-only">Popular one-way routes from Bengaluru with distance, drive time and sedan fare</caption>
                <thead>
                  <tr>
                    <th scope="col">Destination</th>
                    <th scope="col">Distance</th>
                    <th scope="col">Drive</th>
                    <th scope="col">Sedan, one way</th>
                    <th scope="col"><span className="sr-only">Book</span></th>
                  </tr>
                </thead>
                <tbody>
                  {FARES.routes.map((r) => (
                    <tr key={r.slug}>
                      <th scope="row" className="board__dest">
                        <span className="board__name">{r.name}</span>{r.note && <span className="board__note"> {r.note}</span>}
                      </th>
                      <td className="mono">{r.km} km</td>
                      <td className="mono">~{fmtDuration(r.minutes)}</td>
                      <td className="num board__fare">{sedanForBoard ? formatINR(indicativeOneWay(sedanForBoard, r.km)) : '—'}</td>
                      <td className="board__cta"><Link className="btn btn--outline btn--pill btn--sm" to={routeHref(r)} aria-label={`Book Bengaluru to ${r.name}`}>Book</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="board board--list">
              {FARES.routes.slice(0, 5).map((r) => (
                <li key={r.slug}>
                  <Link to={routeHref(r)} className="board__row">
                    <span>
                      <span className="board__name">{r.name}</span>
                      <span className="board__meta mono">{r.km} km · ~{fmtDuration(r.minutes)}</span>
                    </span>
                    <span className="board__from">
                      <span className="eyebrow muted">From</span>
                      <span className="num">{sedanForBoard ? formatINR(indicativeOneWay(sedanForBoard, r.km)) : '—'}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li className="board__all"><Link className="link-arrow" to="/explore">All routes →</Link></li>
            </ul>
            <p className="fine board__fine">
              Indicative one-way sedan fares from central Bengaluru, including driver allowance. Your exact fare is calculated from your pickup point. Tolls, parking and permits at actuals.
            </p>

            {/* Services */}
            <div className="services">
              <article className="svc on-ink">
                <div className="svc__media"><Picture name="fleet-lineup" alt="Chauffeurs standing beside a line of cars at a hotel forecourt" width={720} height={439} /></div>
                <div className="svc__body">
                  <p className="mono svc__num accent-text">01</p>
                  <h3 className="h3">Outstation</h3>
                  <p className="svc__desc muted">One-way drops and round trips across Karnataka, Tamil Nadu, Kerala and Andhra Pradesh. Pay one-way rates when you only go one way.</p>
                  <p className="mono svc__price">{fromOutstation ? <>from {formatINR(fromOutstation)}/km</> : ' '}</p>
                  <Link className="svc__link" to="/?trip=one-way#book"><span className="sr-only">Book an outstation cab</span></Link>
                </div>
              </article>
              <article className="svc on-accent">
                {/* TODO: real photo needed — airport pickup / KIA terminal. No airport photo exists in the codebase. */}
                <div className="svc__media svc__media--type" aria-hidden="true">
                  <span className="svc__bigcode">BLR</span>
                  <span className="mono">Kempegowda International</span>
                </div>
                <div className="svc__body">
                  <p className="mono svc__num">02</p>
                  <h3 className="h3">Airport transfers</h3>
                  <p className="svc__desc">To and from Kempegowda International, any hour. One flat fare for the run — see it before you book.</p>
                  <p className="mono svc__price">{fromAirport ? <>from {formatINR(fromAirport)}</> : ' '}</p>
                  <Link className="svc__link" to="/airport"><span className="sr-only">See airport transfer fares</span></Link>
                </div>
              </article>
              <article className="svc svc--white">
                <div className="svc__media"><Picture name="city-vidhana-soudha" alt="City taxi and chauffeur in front of Vidhana Soudha, Bengaluru" width={720} height={439} /></div>
                <div className="svc__body">
                  <p className="mono svc__num muted">03</p>
                  <h3 className="h3">Local hourly</h3>
                  <p className="svc__desc muted">A car and chauffeur on standby for meetings, shopping or a wedding day — {POLICIES.localPackage.toLowerCase()} package.</p>
                  <p className="mono svc__price">{fromLocal ? <>from {formatINR(fromLocal)} / 8h</> : ' '}</p>
                  <Link className="svc__link" to="/?type=local#book"><span className="sr-only">Book a local hourly cab</span></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Fleet */}
        <section className="section bg-paper-2" aria-labelledby="fleet-title">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="fleet-title" className="h2">Pick the right car</h2>
              <p className="muted sec-head__note">From 4-seat sedans to 12-seat Tempo Travellers, AC and non-AC. Rates are one-way per km — round trips cost less per km.</p>
            </div>
            <ul className="fleet" aria-label="Fleet">
              {classes.map((g) => {
                const ow = minOf(g.cars, (c) => c.price_per_km_one_way);
                const rt = minOf(g.cars, (c) => c.price_per_km);
                const photo = CLASS_PHOTO[g.key];
                // Fallback: a photo set on any car of this class in /admin (cars.image_url).
                const dbPhoto = g.cars.find((c) => c.image_url)?.image_url;
                return (
                  <li key={g.key} className="fleet__card">
                    <div className="fleet__media">
                      {photo
                        ? <Picture name={photo.name} alt={photo.alt} width={560} height={455} />
                        : dbPhoto
                          ? <img className="photo" src={dbPhoto} alt={`${g.label} — ${g.models.join(', ')}`} width={560} height={455} loading="lazy" decoding="async" style={{ aspectRatio: '560 / 455' }} />
                          : <div className="photo-missing" aria-hidden="true">{/* TODO: real fleet photo for this class */}{g.label}</div>}
                    </div>
                    <div className="fleet__body">
                      <h3 className="fleet__name">{g.label}</h3>
                      <p className="fleet__models muted">{g.models.join(' · ')}</p>
                      <div className="fleet__meta">
                        <span className="mono">{g.seats} seats</span>
                        <span className="num">{ow ? `${formatINR(ow)}/km` : rt ? <>{formatINR(rt)}/km <span className="fleet__rt">round trip</span></> : '—'}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="fleet__more"><Link className="link-arrow" to="/tariff">Every rate on one page →</Link></p>
          </div>
        </section>

        {/* How it works + FAQ */}
        {/* Areas */}
        <section className="section" aria-labelledby="areas-title">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="eyebrow muted">Pickup anywhere in the city</p>
                <h2 id="areas-title" className="h2">Taxi service near you</h2>
              </div>
              <Link className="link-arrow" to="/areas">All areas we serve →</Link>
            </div>
            <ul className="areas-list">
              {POPULAR_AREAS.map((a) => <li key={a.slug}><Link to={a.path}>Taxi in {a.name}</Link></li>)}
            </ul>
          </div>
        </section>

        <section className="section" aria-label="How booking works and frequently asked questions">
          <div className="wrap howfaq">
            <div>
              <h2 className="h2 howfaq__title">Booked in under a minute</h2>
              <ol className="steps-list">
                <li><span className="mono">01</span><div><h3>Tell us where</h3><p className="muted">Pickup, drop, date. That’s it.</p></div></li>
                <li><span className="mono">02</span><div><h3>Compare all-in fares</h3><p className="muted">Every car, every rupee, before you commit.</p></div></li>
                <li><span className="mono">03</span><div><h3>Meet your chauffeur</h3><p className="muted">Driver name, number and car plate on WhatsApp {POLICIES.driverDetailsLeadHours} hours before pickup.</p></div></li>
              </ol>
            </div>
            <div>
              <h2 className="h2 howfaq__title">Straight answers</h2>
              <div className="faq">
                {FAQ.map((f, i) => (
                  <details key={f.q} open={i === 0}>
                    <summary>{f.q}</summary>
                    <p className="muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className="wrap">
            <div className="ctaband on-accent">
              <div>
                <h2 className="h2">Leaving in the next hour?</h2>
                <p className="ctaband__sub">Online booking needs {POLICIES.advanceBookingHours} hours’ notice. For anything sooner, call or WhatsApp the desk.</p>
              </div>
              <div className="ctaband__actions">
                <a className="btn btn--ink btn--pill mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
                <a className="btn btn--outline btn--pill" href={waUrl('Hi Taxi House, I need a cab.')} target="_blank" rel="noopener noreferrer">WhatsApp</a>
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
