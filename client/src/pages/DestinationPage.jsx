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
import { POLICIES, formatINR, fmtDuration } from '../lib/fares';
import {
  breadcrumbLd, classLeaders, destBookLinks, destMeta, destPath, faqLd, ldGraph, nearbyDestinations,
  NEXT_DAY_MAX_KM, oneWayFare, outstationCars, roundTripNextDay,
} from '../lib/landing';

function buildFaq(d, { sedanOw, sedanRt, sedanOwRate }) {
  const permit = d.state !== 'Karnataka';
  const faq = [
    {
      q: `How far is ${d.name} from Bangalore by road?`,
      a: `About ${d.km} km from central Bengaluru — roughly ${fmtDuration(d.min).replace(/^0h /, '')} of driving on clear roads. Actual time depends on traffic leaving the city and on breaks.`,
    },
    {
      q: `What is the Bangalore to ${d.name} cab fare?`,
      a: sedanOw
        ? `A one-way sedan drop starts from ${formatINR(sedanOw)}, driver allowance included${sedanRt ? `; a round trip returning the next day starts from ${formatINR(sedanRt)}` : ''}. Tolls, parking${permit ? ' and the interstate permit' : ''} are paid at actuals. You see the exact fare for every car before you book.`
        : `You see the exact fare for every car before you book. Tolls, parking${permit ? ' and the interstate permit' : ''} are paid at actuals.`,
    },
    {
      q: `Do you have one-way drop taxis to ${d.name}?`,
      a: `Yes. A one-way drop is charged one way only${sedanOwRate ? ` — from ₹${sedanOwRate}/km in a sedan` : ''}, so you don’t pay for the car’s empty return.`,
    },
    {
      q: `How is a round trip to ${d.name} charged?`,
      a: `Round trips use lower per-km rates with a minimum of ${POLICIES.minKmPerDayRoundTrip} km per day, plus a driver allowance per day. They are confirmed with a ${POLICIES.advancePercentRoundTrip}% advance, fully refundable if you cancel ${POLICIES.freeCancellationHours} hours before pickup.`,
    },
  ];
  if (permit) {
    faq.push({
      q: `Is there an interstate permit charge for ${d.name}?`,
      a: `${d.name} is in ${d.state}, so the cab needs an interstate permit. It is paid at actuals, along with tolls and parking — nothing is marked up.`,
    });
  }
  faq.push({
    q: 'Where do you pick up from?',
    a: `Anywhere in Bengaluru — home, office, hotel or the airport. Online bookings open ${POLICIES.advanceBookingHours} hours ahead; for sooner pickups call or WhatsApp ${BUSINESS.phoneDisplay}.`,
  });
  return faq;
}

export default function DestinationPage({ dest: d }) {
  const { cars } = useCars('outstation', { fallbackFirst: true });
  const out = outstationCars(cars);
  const meta = destMeta(d);
  const links = destBookLinks(d);
  const nextDay = d.km <= NEXT_DAY_MAX_KM;

  const ow = useMemo(() => classLeaders(out, 'price_per_km_one_way'), [out]);
  const rt = useMemo(() => classLeaders(out, 'price_per_km'), [out]);
  const sedanOwCar = ow.find((c) => c.key === 'sedan')?.car;
  const sedanRtCar = rt.find((c) => c.key === 'sedan')?.car;
  const sedanOw = oneWayFare(sedanOwCar, d.km);
  const sedanRt = nextDay ? roundTripNextDay(sedanRtCar, d.km) : null;
  const faq = buildFaq(d, { sedanOw, sedanRt, sedanOwRate: sedanOwCar?.price_per_km_one_way });

  const rows = rt.map((cls) => {
    const owCar = ow.find((o) => o.key === cls.key)?.car;
    const owFare = oneWayFare(owCar, d.km);
    const rtFare = nextDay ? roundTripNextDay(cls.car, d.km) : null;
    return {
      key: cls.key,
      numeric: [2, 3],
      cells: [
        <span key="n"><strong>{cls.label}</strong><br /><span className="muted t-small">{cls.models.join(' · ')}</span></span>,
        `${cls.seats} seats`,
        owFare ? formatINR(owFare) : 'Round trip only',
        nextDay ? (rtFare ? formatINR(rtFare) : '—') : `₹${cls.car.price_per_km}/km`,
      ],
    };
  });

  const nearby = nearbyDestinations(d);
  const permit = d.state !== 'Karnataka';
  const crumbs = [['Home', '/'], ['Outstation cabs', '/outstation-cabs-bangalore'], [`Bangalore to ${d.name}`, meta.path]];
  const waText = `Hi Taxi House, I need a cab from Bangalore to ${d.name}.`;

  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <JsonLd data={ldGraph(
        breadcrumbLd(crumbs),
        {
          '@type': 'TaxiService',
          name: `Bangalore to ${d.name} cab`,
          url: `${BUSINESS.url}${meta.path}`,
          provider: { '@id': `${BUSINESS.url}/#business` },
          areaServed: [{ '@type': 'City', name: 'Bengaluru' }, { '@type': 'Place', name: `${d.name}, ${d.state}` }],
        },
        faqLd(faq),
      )} />
      <SiteHeader tone="white" />
      <main id="main">
        <PageHero
          crumbs={crumbs}
          eyebrow={`${d.state} · ${d.km} km`}
          title={`Bangalore to ${d.name} cab`}
          lede={<>{d.about} One-way drops and round trips with a chauffeur, all-in fares shown before you book.</>}
        >
          <Facts items={[
            ['Distance', <><span className="num">{d.km} km</span> by road</>],
            ['Drive time, clear roads', <>~<span className="num">{fmtDuration(d.min)}</span></>],
            sedanOw && ['Sedan, one way', <>from <span className="num">{formatINR(sedanOw)}</span></>],
          ]} />
          <HeroActions primary={{ to: links.oneWay, label: 'Book one way' }} secondary={{ to: links.roundTrip, label: 'Book round trip' }} waText={waText} />
        </PageHero>

        <section className="section" aria-labelledby="fares-title">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="eyebrow muted">Fares</p>
                <h2 id="fares-title" className="h2">Bangalore to {d.name} taxi fare</h2>
              </div>
              <p className="muted sec-head__note">
                Driver allowance included. Tolls, parking{permit ? ', interstate permit' : ''} at actuals.
                {nextDay ? ' Round trip = leave 7 AM, return the next day.' : ` For a round trip, the per-km rate applies with ${POLICIES.minKmPerDayRoundTrip} km minimum per day.`}
              </p>
            </div>
            <DataTable
              caption={`Bangalore to ${d.name} cab fares by car type`}
              columns={['Car', 'Seats', 'One way', nextDay ? 'Round trip, back next day' : 'Round trip rate']}
              rows={rows}
            />
            <p className="muted t-small dtable__note">
              Indicative fares from central Bengaluru for a daytime trip; your exact fare for each car is shown before you book.
              Pickups or drops before {POLICIES.dutyHours.start} AM or after {POLICIES.dutyHours.end - 12} PM add one day of driver allowance.
            </p>
          </div>
        </section>

        <section className="section bg-paper-2" aria-labelledby="more-title">
          <div className="wrap area-split">
            <div>
              <p className="eyebrow muted">Also popular</p>
              <h2 id="more-title" className="h2">Trips near {d.name}</h2>
              <ul className="area-nearby area-nearby--wide">
                {nearby.map((n) => (
                  <li key={n.slug}><Link to={destPath(n)}>Bangalore to {n.name} cab</Link> <span className="muted mono t-small">{n.km} km</span></li>
                ))}
              </ul>
              <Link className="link-arrow" to="/outstation-cabs-bangalore">All outstation routes →</Link>
            </div>
            <div>
              <h3 className="h3 area-subhead">Pickup from anywhere in Bengaluru</h3>
              <ul className="area-nearby">
                {POPULAR_AREAS.slice(0, 10).map((a) => <li key={a.slug}><Link to={a.path}>{a.name}</Link></li>)}
              </ul>
              <Link className="link-arrow" to="/areas">All areas we serve →</Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-title">
          <FaqSection title={`Bangalore to ${d.name}: straight answers`} faq={faq} />
          <CtaBand title={`Travelling to ${d.name}?`} waText={waText} />
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}
