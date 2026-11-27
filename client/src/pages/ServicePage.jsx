import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import ActionBar from '../components/site/ActionBar';
import Seo from '../components/site/Seo';
import {
  CtaBand, DataTable, Facts, FaqSection, HeroActions, JsonLd, PageHero,
} from '../components/landing/Blocks';
import { useCars } from '../hooks/useCars';
import { POPULAR_AREAS } from '../data/popular-areas';
import { BUSINESS } from '../data/business';
import { POLICIES, formatINR, fmtDuration, vehicleClass } from '../lib/fares';
import {
  allDestinations, breadcrumbLd, classLeaders, destPath, faqLd, ldGraph,
  NEXT_DAY_MAX_KM, oneWayFare, outstationCars, roundTripNextDay, STATES,
} from '../lib/landing';

const P = POLICIES;
const carLabel = (c) => `${c.name}${c.is_ac === false ? ' (non-AC)' : c.is_ac ? ' (AC)' : ''}`;
const rateCell = (v, suffix = '/km') => (v > 0 ? `₹${v}${suffix}` : '—');

const COMMON_FAQ = {
  included: {
    q: 'What is included in the fare?',
    a: `Distance at the car’s per-km rate plus the driver allowance (bata). Tolls, parking and interstate permits are paid at actuals. Travelling with a pet adds ${formatINR(P.petFee)}.`,
  },
  night: {
    q: 'Are there night charges?',
    a: `Chauffeur duty hours are ${P.dutyHours.start} AM – ${P.dutyHours.end - 12} PM. A pickup or drop outside those hours adds one extra day of driver allowance.`,
  },
  cancel: {
    q: 'What if I need to cancel?',
    a: `Round trips are confirmed with a ${P.advancePercentRoundTrip}% advance, fully refunded if you cancel at least ${P.freeCancellationHours} hours before pickup. One-way, airport and local bookings need no online payment.`,
  },
  notice: {
    q: 'How early do I need to book?',
    a: `Online bookings open ${P.advanceBookingHours} hours ahead. Need a cab sooner? Call or WhatsApp ${BUSINESS.phoneDisplay} — the desk is open 24×7.`,
  },
};

/* ---------------------------------------------------------------- shared sections */
function RatesTable({ cars, caption, cols }) {
  return (
    <DataTable
      caption={caption}
      columns={['Car', 'Seats', ...cols.map((c) => c[0])]}
      rows={cars.map((c) => ({
        key: c.id || `${c.name}-${c.is_ac}`,
        numeric: cols.map((_, i) => i + 2),
        cells: [<strong key="n">{carLabel(c)}</strong>, c.seats, ...cols.map((col) => col[1](c))],
      }))}
    />
  );
}

function RouteFareList({ dests, fareFor, heading, note }) {
  return (
    <>
      <DataTable
        caption={heading}
        columns={['Bangalore to', 'Distance', 'Drive (clear roads)', note]}
        rows={dests.map((d) => ({
          key: d.slug,
          numeric: [3],
          cells: [<Link key="l" to={destPath(d)}>{d.name}</Link>, `${d.km} km`, `~${fmtDuration(d.min)}`, fareFor(d) ? formatINR(fareFor(d)) : '—'],
        }))}
      />
    </>
  );
}

function Section({ id, eyebrow, title, note, alt, children }) {
  return (
    <section className={`section${alt ? ' bg-paper-2' : ''}`} aria-labelledby={id}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            {eyebrow && <p className="eyebrow muted">{eyebrow}</p>}
            <h2 id={id} className="h2">{title}</h2>
          </div>
          {note && <p className="muted sec-head__note">{note}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }) {
  return <ul className="ticks ticks--col svc-points">{items.map((t) => <li key={t}>{t}</li>)}</ul>;
}

function AreaLinks() {
  return (
    <ul className="areas-list">
      {POPULAR_AREAS.map((a) => <li key={a.slug}><Link to={a.path}>Taxi in {a.name}</Link></li>)}
    </ul>
  );
}

/* ---------------------------------------------------------------- per-service content */
function useFleet() {
  const { cars: all } = useCars(undefined, { fallbackFirst: true });
  return useMemo(() => {
    const out = outstationCars(all).sort((a, b) => (a.price_per_km || 0) - (b.price_per_km || 0));
    const local = all.filter((c) => c.available_categories?.includes('local')).sort((a, b) => (a.base_fare || 0) - (b.base_fare || 0));
    return { out, local, ow: classLeaders(out, 'price_per_km_one_way'), rt: classLeaders(out, 'price_per_km') };
  }, [all]);
}

function content(slug, f) {
  const dests = allDestinations();
  const sedanOw = f.ow.find((c) => c.key === 'sedan')?.car;
  const suvOw = f.ow.find((c) => c.key === 'suv')?.car;
  const sedanRt = f.rt.find((c) => c.key === 'sedan')?.car;
  const nearDests = dests.filter((d) => d.km <= NEXT_DAY_MAX_KM);
  const minOw = Math.min(...f.out.filter((c) => c.price_per_km_one_way > 0).map((c) => c.price_per_km_one_way));
  const minRt = Math.min(...f.out.filter((c) => c.price_per_km > 0).map((c) => c.price_per_km));
  const minLocal = Math.min(...f.local.map((c) => c.base_fare || Infinity));
  const tempos = f.out.filter((c) => vehicleClass(c.name) === 'tempo');
  const tempoLocal = f.local.filter((c) => vehicleClass(c.name) === 'tempo');
  const crystas = f.out.filter((c) => vehicleClass(c.name) === 'crysta');
  const crystaLocal = f.local.filter((c) => vehicleClass(c.name) === 'crysta');

  const outstationRates = (
    <RatesTable
      cars={f.out}
      caption="Outstation per-km rates by car"
      cols={[
        ['One way', (c) => rateCell(c.price_per_km_one_way)],
        ['Round trip', (c) => rateCell(c.price_per_km)],
        ['Driver / day', (c) => formatINR(c.driver_bata || 300)],
      ]}
    />
  );
  const localRates = (cars) => (
    <RatesTable cars={cars} caption={`${P.localPackage} local package fares`} cols={[[P.localPackage, (c) => formatINR(c.base_fare)]]} />
  );

  switch (slug) {
    case 'outstation-cabs-bangalore':
      return {
        eyebrow: `${dests.length} destinations · 4 states`,
        h1: 'Outstation cabs from Bangalore',
        lede: 'One-way drops and round trips with a chauffeur to hill stations, temple towns, beaches and cities across Karnataka, Tamil Nadu, Kerala and Andhra Pradesh. All-in fares shown before you book.',
        facts: [['One way', `from ₹${minOw}/km`], ['Round trip', `from ₹${minRt}/km`], ['Fleet', 'Sedan to 12-seat Tempo Traveller']],
        primary: { to: '/?type=outstation&trip=one-way#book', label: 'Book an outstation cab' },
        sections: (
          <>
            {STATES.map((st, i) => {
              const list = dests.filter((d) => d.state === st);
              if (!list.length) return null;
              return (
                <Section key={st} id={`st-${i}`} eyebrow={st} title={`Bangalore to ${st === 'Puducherry' ? 'Puducherry' : `${st} destinations`}`} alt={i % 2 === 1}>
                  <RouteFareList dests={list} heading={`Outstation cab fares from Bangalore to ${st}`} note="Sedan, one way" fareFor={(d) => oneWayFare(sedanOw, d.km)} />
                </Section>
              );
            })}
            <Section id="rates" eyebrow="Rates" title="Outstation rates by car" note="Driver allowance per day of travel. Tolls, parking and interstate permits at actuals.">
              {outstationRates}
            </Section>
          </>
        ),
        faq: [
          { q: 'Which is cheaper — one way or round trip?', a: `If you are coming back within a day or two, a round trip is usually cheaper: rates start at ₹${minRt}/km against ₹${minOw}/km one way, with a ${P.minKmPerDayRoundTrip} km daily minimum. If you are staying longer, book two one-way trips.` },
          COMMON_FAQ.included, COMMON_FAQ.night, COMMON_FAQ.cancel, COMMON_FAQ.notice,
        ],
      };

    case 'one-way-taxi-bangalore':
      return {
        eyebrow: 'Drop taxi · pay one way',
        h1: 'One way taxi from Bangalore',
        lede: 'Going one way? Pay for the distance you travel — not for the car’s empty return. Drop taxis to any city in South India, driver allowance included.',
        facts: [['Sedan', `₹${sedanOw?.price_per_km_one_way}/km`], suvOw && ['SUV', `₹${suvOw.price_per_km_one_way}/km`], ['Minimum', 'No daily km minimum']],
        primary: { to: '/?type=outstation&trip=one-way#book', label: 'Book a one-way cab' },
        sections: (
          <>
            <Section id="ow-routes" eyebrow="Popular drops" title="One-way cab fares from Bangalore" note="Sedan and SUV, one way, driver allowance included. Tolls and permits at actuals.">
              <DataTable
                caption="One-way cab fares from Bangalore"
                columns={['Bangalore to', 'Distance', 'Sedan', 'SUV']}
                rows={dests.slice(0, 30).map((d) => ({
                  key: d.slug,
                  numeric: [2, 3],
                  cells: [<Link key="l" to={destPath(d)}>{d.name}</Link>, `${d.km} km`, formatINR(oneWayFare(sedanOw, d.km)), suvOw ? formatINR(oneWayFare(suvOw, d.km)) : '—'],
                }))}
              />
            </Section>
            <Section id="ow-rates" eyebrow="Rates" title="One-way rates by car" alt>
              <RatesTable cars={f.out.filter((c) => c.price_per_km_one_way > 0)} caption="One-way per-km rates" cols={[['One way', (c) => rateCell(c.price_per_km_one_way)], ['Driver allowance', (c) => formatINR(c.driver_bata || 300)]]} />
            </Section>
          </>
        ),
        faq: [
          { q: 'How is a one-way taxi charged?', a: 'Road distance × the car’s one-way per-km rate, plus one day of driver allowance. There is no daily minimum and no return-journey charge.' },
          { q: 'Can I add stops on a one-way trip?', a: 'Yes — add stops when you book and choose how long to halt at each. The fare follows the total road distance.' },
          { q: 'Is a Tempo Traveller available one way?', a: 'Tempo Travellers are available for round trips and local packages only.' },
          COMMON_FAQ.night, COMMON_FAQ.notice,
        ],
      };

    case 'round-trip-cabs-bangalore':
      return {
        eyebrow: 'Return trips · lower per-km',
        h1: 'Round trip cabs from Bangalore',
        lede: 'The car and chauffeur stay with you for the whole trip — sightseeing, stops and the drive home included at a lower per-km rate.',
        facts: [['Sedan', `₹${sedanRt?.price_per_km}/km`], ['Minimum', `${P.minKmPerDayRoundTrip} km per day`], ['Advance', `${P.advancePercentRoundTrip}% to confirm`]],
        primary: { to: '/?type=outstation&trip=two-way#book', label: 'Book a round trip' },
        sections: (
          <>
            <Section id="rt-how" eyebrow="How billing works" title="Clear round-trip billing">
              <Bullets items={[
                `Billed on the greater of the actual road distance or ${P.minKmPerDayRoundTrip} km per day of the trip.`,
                'One driver allowance (bata) for each day; the chauffeur stays with you throughout.',
                `Confirm with a ${P.advancePercentRoundTrip}% advance online; pay the balance during the trip.`,
                `Full refund of the advance if you cancel ${P.freeCancellationHours}+ hours before pickup.`,
                'Tolls, parking and interstate permits at actuals — never marked up.',
              ]} />
            </Section>
            <Section id="rt-routes" eyebrow="Examples" title="Round trip fares: leave in the morning, back next day" note="Sedan, leaving 7 AM and returning the next day." alt>
              <RouteFareList dests={nearDests} heading="Round-trip cab fares from Bangalore" note="Sedan, round trip" fareFor={(d) => roundTripNextDay(sedanRt, d.km)} />
            </Section>
            <Section id="rt-rates" eyebrow="Rates" title="Round-trip rates by car">
              <RatesTable cars={f.out} caption="Round-trip per-km rates" cols={[['Round trip', (c) => rateCell(c.price_per_km)], ['Min km / day', () => `${P.minKmPerDayRoundTrip} km`], ['Driver / day', (c) => formatINR(c.driver_bata || 300)]]} />
            </Section>
          </>
        ),
        faq: [
          { q: 'Why is there a 300 km daily minimum?', a: `A round-trip car is reserved for you all day. On days you drive less than ${P.minKmPerDayRoundTrip} km, the minimum applies; on longer days you pay the actual distance.` },
          COMMON_FAQ.included, COMMON_FAQ.night, COMMON_FAQ.cancel, COMMON_FAQ.notice,
        ],
      };

    case 'local-taxi-bangalore':
      return {
        eyebrow: P.localPackage,
        h1: 'Local taxi in Bangalore with driver',
        lede: `Hire a car and chauffeur by the day — ${P.localPackage.toLowerCase()} for meetings, shopping, hospital visits, family functions or a city tour.`,
        facts: [['Package', P.localPackage], ['From', formatINR(minLocal)], ['Pickup', 'Anywhere in Bengaluru']],
        primary: { to: '/?type=local#book', label: 'Book a local cab' },
        sections: (
          <>
            <Section id="local-rates" eyebrow="Fares" title={`${P.localPackage} package fares`} note="Fixed package price per car.">
              {localRates(f.local)}
            </Section>
            <Section id="local-areas" eyebrow="Pickup anywhere" title="Local cabs across Bengaluru" alt>
              <AreaLinks />
              <p><Link className="link-arrow" to="/areas">All areas we serve →</Link></p>
            </Section>
          </>
        ),
        faq: [
          { q: `What does the ${P.localPackage} package include?`, a: `The car and chauffeur for up to 8 hours and 80 km within Bengaluru, at the fixed package fare for that car.` },
          COMMON_FAQ.night, COMMON_FAQ.notice,
        ],
      };

    case 'tempo-traveller-rental-bangalore':
      return {
        eyebrow: '12 seats · AC & non-AC',
        h1: 'Tempo Traveller rental in Bangalore',
        lede: 'A 12-seater Tempo Traveller with driver for family trips, pilgrimages, team outings and weddings — outstation round trips or a day in the city.',
        facts: [tempos[0] && ['Round trip', `from ₹${Math.min(...tempos.map((c) => c.price_per_km))}/km`], tempoLocal[0] && [P.localPackage, `from ${formatINR(Math.min(...tempoLocal.map((c) => c.base_fare)))}`], ['Seats', '12']],
        primary: { to: '/?type=outstation&trip=two-way#book', label: 'Book a Tempo Traveller' },
        sections: (
          <>
            <Section id="tt-rates" eyebrow="Rates" title="Tempo Traveller fares">
              {tempos.length > 0 && <RatesTable cars={tempos} caption="Tempo Traveller outstation rates" cols={[['Round trip', (c) => rateCell(c.price_per_km)], ['Driver / day', (c) => formatINR(c.driver_bata || 300)]]} />}
              {tempoLocal.length > 0 && <div className="dtable-gap">{localRates(tempoLocal)}</div>}
            </Section>
            {tempos[0] && (
              <Section id="tt-routes" eyebrow="Examples" title="Tempo Traveller trips from Bangalore" note="Round trip, leaving 7 AM and back the next day." alt>
                <RouteFareList dests={nearDests.slice(0, 20)} heading="Tempo Traveller round-trip fares" note="Tempo Traveller, round trip" fareFor={(d) => roundTripNextDay(tempos[0], d.km)} />
              </Section>
            )}
          </>
        ),
        faq: [
          { q: 'Can I book a Tempo Traveller one way?', a: 'Tempo Travellers are available for round trips and local packages.' },
          { q: 'How many people fit in a Tempo Traveller?', a: '12 passengers plus the driver.' },
          COMMON_FAQ.included, COMMON_FAQ.cancel, COMMON_FAQ.notice,
        ],
      };

    case 'innova-crysta-rental-bangalore':
      return {
        eyebrow: '7 seats · AC & non-AC',
        h1: 'Innova Crysta for rent in Bangalore',
        lede: 'Toyota Innova Crysta with an experienced chauffeur — room for seven and their luggage on airport runs, outstation trips and full days in the city.',
        facts: [crystas[0] && ['One way', `from ₹${Math.min(...crystas.map((c) => c.price_per_km_one_way || Infinity))}/km`], crystas[0] && ['Round trip', `from ₹${Math.min(...crystas.map((c) => c.price_per_km))}/km`], crystaLocal[0] && [P.localPackage, `from ${formatINR(Math.min(...crystaLocal.map((c) => c.base_fare)))}`]],
        primary: { to: '/?type=outstation&trip=one-way#book', label: 'Book an Innova Crysta' },
        sections: (
          <>
            <Section id="cr-rates" eyebrow="Rates" title="Innova Crysta fares">
              {crystas.length > 0 && <RatesTable cars={crystas} caption="Innova Crysta outstation rates" cols={[['One way', (c) => rateCell(c.price_per_km_one_way)], ['Round trip', (c) => rateCell(c.price_per_km)], ['Driver / day', (c) => formatINR(c.driver_bata || 300)]]} />}
              {crystaLocal.length > 0 && <div className="dtable-gap">{localRates(crystaLocal)}</div>}
            </Section>
            {crystas[0] && (
              <Section id="cr-routes" eyebrow="Examples" title="Innova Crysta one-way fares from Bangalore" alt>
                <RouteFareList dests={dests.slice(0, 20)} heading="Innova Crysta one-way fares" note="Innova Crysta, one way" fareFor={(d) => oneWayFare([...crystas].sort((a, b) => a.price_per_km_one_way - b.price_per_km_one_way)[0], d.km)} />
              </Section>
            )}
          </>
        ),
        faq: [COMMON_FAQ.included, COMMON_FAQ.night, COMMON_FAQ.cancel, COMMON_FAQ.notice],
      };

    case 'corporate-cab-service-bangalore':
      return {
        eyebrow: 'Business travel',
        h1: 'Corporate cab service in Bangalore',
        lede: 'One desk for your company’s cab needs — airport transfers for visiting clients, team offsites, outstation travel and cars with drivers for the day.',
        facts: [['Desk', '24×7'], ['Fleet', 'Sedan to Tempo Traveller'], ['Pricing', 'Per-km, shown upfront']],
        primary: { to: '/contact?type=corporate', label: 'Request a corporate quote' },
        sections: (
          <>
            <Section id="corp-what" eyebrow="What we cover" title="Cabs for every business trip">
              <Bullets items={[
                'Airport pickups and drops for employees and visiting clients',
                `Local cars with chauffeurs — ${P.localPackage.toLowerCase()}`,
                'Outstation travel for site visits, plants and offsites, one way or round trip',
                'Tempo Travellers for team outings and events',
                'The same all-in per-km rates as our published tariff',
              ]} />
            </Section>
            <Section id="corp-rates" eyebrow="Published rates" title="Outstation rates by car" alt>{outstationRates}</Section>
          </>
        ),
        faq: [
          { q: 'How do I set up a corporate account?', a: 'Send the enquiry form with your company details and typical travel, or call the desk. We come back with a quote.' },
          COMMON_FAQ.included, COMMON_FAQ.notice,
        ],
      };

    case 'wedding-car-rental-bangalore':
      return {
        eyebrow: 'Weddings & functions',
        h1: 'Wedding car rental in Bangalore',
        lede: 'Cars and Tempo Travellers with chauffeurs for the wedding day — guest pickups from the airport and hotels, venue shuttles and family travel.',
        facts: [['Fleet', 'Sedan to 12-seat Tempo'], ['Local package', P.localPackage], ['From', formatINR(minLocal)]],
        primary: { to: '/contact?type=wedding', label: 'Request a wedding fleet quote' },
        sections: (
          <>
            <Section id="wed-rates" eyebrow="Day rates" title={`Wedding-day cars: ${P.localPackage}`} note="Per car. For several cars over several days, request a fleet quote.">
              {localRates(f.local)}
            </Section>
            <Section id="wed-what" eyebrow="How families use us" title="Guest transport, sorted" alt>
              <Bullets items={[
                'Airport pickups for guests flying in to Kempegowda International',
                'Hotel-to-venue shuttles in Tempo Travellers',
                'Cars with chauffeurs for the family on the wedding day',
                'Outstation trips for destination weddings across South India',
              ]} />
            </Section>
          </>
        ),
        faq: [
          { q: 'Can you supply several cars for a wedding?', a: 'Yes — tell us the dates, number of guests and cars needed in the enquiry form and we send a fleet quote.' },
          COMMON_FAQ.night, COMMON_FAQ.notice,
        ],
      };

    default:
      return null;
  }
}

export default function ServicePage({ service: s }) {
  const fleet = useFleet();
  const c = content(s.slug, fleet);
  const crumbs = [['Home', '/'], [c.h1, s.path]];
  const waText = `Hi Taxi House, I’d like to enquire about ${c.h1.toLowerCase()}.`;
  return (
    <>
      <Seo title={s.title} description={s.description} path={s.path} />
      <JsonLd data={ldGraph(
        breadcrumbLd(crumbs),
        { '@type': 'Service', serviceType: c.h1, url: `${BUSINESS.url}${s.path}`, provider: { '@id': `${BUSINESS.url}/#business` }, areaServed: { '@type': 'City', name: 'Bengaluru' } },
        faqLd(c.faq),
      )} />
      <SiteHeader tone="white" />
      <main id="main">
        <PageHero crumbs={crumbs} eyebrow={c.eyebrow} title={c.h1} lede={c.lede}>
          <Facts items={c.facts} />
          <HeroActions primary={c.primary} waText={waText} />
        </PageHero>
        {c.sections}
        <section className="section" aria-labelledby="faq-title">
          <FaqSection title="Straight answers" faq={c.faq} />
          <CtaBand title="Talk to the desk" waText={waText} />
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}

