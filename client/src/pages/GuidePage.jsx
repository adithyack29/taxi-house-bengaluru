import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import ActionBar from '../components/site/ActionBar';
import Seo from '../components/site/Seo';
import { CtaBand, DataTable, JsonLd, PageHero } from '../components/landing/Blocks';
import { useCars } from '../hooks/useCars';
import { BUSINESS } from '../data/business';
import { POLICIES, airportFare, formatINR, fmtDuration } from '../lib/fares';
import { allAreas, areaPath, ZONES } from '../lib/areas';
import {
  allDestinations, breadcrumbLd, classLeaders, destPath, GUIDES, GUIDES_INDEX, KINDS, ldGraph,
  NEXT_DAY_MAX_KM, oneWayFare, outstationCars, roundTripNextDay,
} from '../lib/landing';

const P = POLICIES;

function Prose({ children }) {
  return <div className="prose">{children}</div>;
}

function AirportGuide() {
  const { cars } = useCars('airport', { fallbackFirst: true });
  const leaders = useMemo(() => classLeaders(cars, 'price_per_km'), [cars]);
  const areas = allAreas();
  return (
    <>
      <section className="section">
        <div className="wrap">
          <Prose>
            <h2 className="h2">How airport taxi fares work</h2>
            <p>
              Kempegowda International Airport (KIA) is in Devanahalli, north of the city, so the road distance depends a lot on
              where you start: about 20 km from Yelahanka, around 40 km from Whitefield or HSR Layout and over 50 km from
              Electronic City. App cabs price by distance and time and can surge at peak hours or in the rain.
            </p>
            <p>
              A pre-booked airport taxi is a fixed fare for the car you choose — you see it before you book, and it does not
              change with traffic. Tolls and parking are paid at actuals. Pickups or drops before {P.dutyHours.start} AM or
              after {P.dutyHours.end - 12} PM add one day of driver allowance.
            </p>
            {leaders.length > 0 && (
              <ul className="ticks ticks--col">
                {leaders.map((l) => <li key={l.key}>{l.label} ({l.seats} seats): from {formatINR(airportFare(l.car))}</li>)}
              </ul>
            )}
            <p><Link className="link-arrow" to="/airport">See airport fares for every car →</Link></p>
            <h2 className="h2">Tips for catching your flight</h2>
            <ul className="ticks ticks--col">
              <li>Drive time to KIA varies widely with traffic — leave early at morning and evening peaks.</li>
              <li>Book the night before for early-morning flights so the car and chauffeur are confirmed.</li>
              <li>Landing late? Book the return trip in advance so a car is waiting.</li>
            </ul>
          </Prose>
        </div>
      </section>
      <section className="section bg-paper-2" aria-labelledby="dist-title">
        <div className="wrap">
          <h2 id="dist-title" className="h2">Distance to Bangalore airport from every area</h2>
          <p className="muted area-copy">Road distance to Kempegowda International Airport. Tap an area for its airport taxi page.</p>
          {ZONES.map((z) => {
            const list = areas.filter((a) => a.zone === z.key).sort((a, b) => a.airport.km - b.airport.km);
            return (
              <details key={z.key} className="guide-zone" open={z.key === 'east'}>
                <summary><span className="h3">{z.label}</span> <span className="mono muted">{list.length} areas</span></summary>
                <ul className="areas-list areas-list--km">
                  {list.map((a) => (
                    <li key={a.slug}><Link to={areaPath(a)}><span>{a.name}</span><span className="mono muted">{a.airport.km} km</span></Link></li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>
    </>
  );
}

function OneWayVsRoundGuide() {
  const { cars } = useCars('outstation', { fallbackFirst: true });
  const out = outstationCars(cars);
  const sedanOw = classLeaders(out, 'price_per_km_one_way').find((c) => c.key === 'sedan')?.car;
  const sedanRt = classLeaders(out, 'price_per_km').find((c) => c.key === 'sedan')?.car;
  const dests = allDestinations().filter((d) => d.km <= NEXT_DAY_MAX_KM).slice(0, 18);
  const rows = dests.map((d) => {
    const ow = oneWayFare(sedanOw, d.km);
    const rt = roundTripNextDay(sedanRt, d.km);
    const twoOw = ow ? ow * 2 : null;
    const best = rt && twoOw ? (rt <= twoOw ? 'Round trip' : 'Two one-ways') : '—';
    return { key: d.slug, numeric: [2, 3, 4], cells: [<Link key="l" to={destPath(d)}>{d.name}</Link>, `${d.km} km`, ow ? formatINR(ow) : '—', twoOw ? formatINR(twoOw) : '—', rt ? formatINR(rt) : '—', best] };
  });
  return (
    <>
      <section className="section">
        <div className="wrap">
          <Prose>
            <h2 className="h2">The short answer</h2>
            <p>
              <strong>Going and staying?</strong> Book one way — you pay {sedanOw ? `₹${sedanOw.price_per_km_one_way}/km` : 'the one-way rate'} for the
              distance and nothing for the car’s return.
            </p>
            <p>
              <strong>Coming back within a day or two?</strong> A round trip is usually cheaper than two one-way drops: the per-km rate is lower
              ({sedanRt ? `₹${sedanRt.price_per_km}/km` : 'round-trip rate'} for a sedan) and the car and chauffeur stay with you, but each day
              bills at least {P.minKmPerDayRoundTrip} km plus a driver allowance. The longer you stay without driving, the more those daily
              minimums add up.
            </p>
          </Prose>
        </div>
      </section>
      <section className="section bg-paper-2" aria-labelledby="cmp-title">
        <div className="wrap">
          <h2 id="cmp-title" className="h2">Real fares compared (sedan)</h2>
          <p className="muted area-copy">Round trip = leave 7 AM, return the next day. Driver allowance included; tolls and permits extra.</p>
          <DataTable caption="One way vs round trip sedan fares from Bangalore" columns={['Bangalore to', 'Distance', 'One way', 'Two one-ways', 'Round trip', 'Cheaper']} rows={rows} />
        </div>
      </section>
    </>
  );
}

function WeekendGuide() {
  const { cars } = useCars('outstation', { fallbackFirst: true });
  const sedanOw = classLeaders(outstationCars(cars), 'price_per_km_one_way').find((c) => c.key === 'sedan')?.car;
  const dests = allDestinations().filter((d) => d.km <= 350 && d.kind !== 'city');
  return (
    <section className="section">
      <div className="wrap">
        <p className="muted area-copy">Everything here is within about 350 km of the city — a comfortable drive for a two- or three-day break.</p>
        {Object.entries(KINDS).filter(([k]) => k !== 'city').map(([kind, label]) => {
          const list = dests.filter((d) => d.kind === kind);
          if (!list.length) return null;
          return (
            <div key={kind} className="guide-group">
              <h2 className="h2">{label}</h2>
              <ul className="guide-cards">
                {list.map((d) => (
                  <li key={d.slug} className="card guide-card">
                    <h3 className="h3"><Link to={destPath(d)}>{d.name}</Link></h3>
                    <p className="mono muted t-small">{d.km} km · ~{fmtDuration(d.min)}{sedanOw ? ` · sedan one way from ${formatINR(oneWayFare(sedanOw, d.km))}` : ''}</p>
                    <p className="muted">{d.about}</p>
                    <Link className="link-arrow" to={destPath(d)}>Bangalore to {d.name} cab →</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const BODIES = {
  'bangalore-airport-taxi-fare': AirportGuide,
  'one-way-vs-round-trip-cab': OneWayVsRoundGuide,
  'weekend-getaways-from-bangalore': WeekendGuide,
};

export function GuidesIndex() {
  const crumbs = [['Home', '/'], ['Guides', GUIDES_INDEX.path]];
  return (
    <>
      <Seo {...GUIDES_INDEX} />
      <JsonLd data={ldGraph(breadcrumbLd(crumbs))} />
      <SiteHeader tone="white" />
      <main id="main">
        <PageHero crumbs={crumbs} eyebrow="Travel smarter" title="Bangalore cab & travel guides" lede="Real distances and fares to help you plan airport runs and trips out of the city." />
        <section className="section">
          <div className="wrap">
            <ul className="guide-cards">
              {GUIDES.map((g) => (
                <li key={g.slug} className="card guide-card">
                  <h2 className="h3"><Link to={g.path}>{g.h1}</Link></h2>
                  <p className="muted">{g.description}</p>
                  <Link className="link-arrow" to={g.path}>Read the guide →</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}

export default function GuidePage({ guide: g }) {
  const Body = BODIES[g.slug];
  const crumbs = [['Home', '/'], ['Guides', GUIDES_INDEX.path], [g.h1, g.path]];
  return (
    <>
      <Seo title={g.title} description={g.description} path={g.path} />
      <JsonLd data={ldGraph(
        breadcrumbLd(crumbs),
        { '@type': 'Article', headline: g.h1, description: g.description, url: `${BUSINESS.url}${g.path}`, publisher: { '@id': `${BUSINESS.url}/#business` } },
      )} />
      <SiteHeader tone="white" />
      <main id="main">
        <PageHero crumbs={crumbs} eyebrow="Guide" title={g.h1} lede={g.description} />
        <Body />
        <section className="section">
          <CtaBand title="Ready to book?" waText="Hi Taxi House, I’d like to book a cab." />
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}
