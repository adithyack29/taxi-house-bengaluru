import DESTS from '../data/destinations.json';
import FARES from '../data/fares.json';
import { BUSINESS } from '../data/business';
import { computeFare, indicativeOneWay, vehicleClass, CLASS_META } from './fares';

/**
 * Route, service and guide landing pages. Every number comes from data:
 * destinations.json (OpenStreetMap + OSRM road distance from the city centre, see scripts/build-routes.py)
 * and the live / bundled car rates (fares.json, Supabase `cars`).
 */

// ---------------------------------------------------------------- destinations
export const allDestinations = () => DESTS;
const BY_SLUG = new Map(DESTS.map((d) => [d.slug, d]));
export const getDestination = (slug) => BY_SLUG.get(slug) || null;
export const destPath = (d) => `/bangalore-to-${d.slug}-cab`;
export const destFromPath = (pathname) => {
  const m = /^\/bangalore-to-([a-z0-9-]+)-cab\/?$/.exec(pathname);
  return m ? getDestination(m[1]) : null;
};
export const STATES = ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Puducherry'];
export const KINDS = {
  hills: 'Hill stations', wildlife: 'Wildlife & forests', heritage: 'Heritage', temple: 'Temple towns',
  beach: 'Beaches & coast', nature: 'Waterfalls & backwaters', city: 'Cities',
};
/** Round-trip "back next day" examples are only shown where that is a realistic plan. */
export const NEXT_DAY_MAX_KM = 400;

const q = encodeURIComponent;
export const destBookLinks = (d) => ({
  oneWay: `/?type=outstation&trip=one-way&drop=${q(d.drop)}&dropCoord=${d.lat},${d.lng}#book`,
  roundTrip: `/?type=outstation&trip=two-way&drop=${q(d.drop)}&dropCoord=${d.lat},${d.lng}#book`,
});

export const nearbyDestinations = (d, n = 6) => DESTS
  .filter((x) => x.slug !== d.slug)
  .map((x) => ({ x, score: Math.hypot(x.lat - d.lat, x.lng - d.lng) }))
  .sort((a, b) => a.score - b.score)
  .slice(0, n)
  .map((s) => s.x);

// ---------------------------------------------------------------- fares by car class
export const CLASS_ORDER = ['sedan', 'suv', 'crysta', 'tempo'];

/** Cheapest car per class (for the category given), with display info. */
export function classLeaders(cars, rateKey) {
  return CLASS_ORDER.map((key) => {
    const list = cars.filter((c) => vehicleClass(c.name) === key && (!rateKey || c[rateKey] > 0));
    const best = [...list].sort((a, b) => (a[rateKey] || 0) - (b[rateKey] || 0))[0];
    if (!best) return null;
    const seats = Math.max(...list.map((c) => c.seats || 0)) || best.seats;
    return { key, label: CLASS_META[key]?.label || key, car: best, seats, models: [...new Set(list.map((c) => c.name))] };
  }).filter(Boolean);
}

export const oneWayFare = (car, km) => (car?.price_per_km_one_way > 0 ? indicativeOneWay(car, km) : null);

/** Round trip leaving 7:00 AM and returning the next day, priced by the same engine as checkout. */
export function roundTripNextDay(car, km) {
  if (!(car?.price_per_km > 0)) return null;
  return computeFare({
    car,
    trip: { type: 'outstation', trip: 'two-way', date: '2030-01-07', time: '07:00', returnDate: '2030-01-08' },
    roadDistance: km * 2,
  }).total;
}

export const outstationCars = (cars) => cars.filter((c) => c.available_categories?.includes('outstation'));

// ---------------------------------------------------------------- page registry (meta used by prerender)
const minOneWayRate = () => Math.min(...FARES.fallbackCars
  .filter((c) => c.available_categories?.includes('outstation') && c.price_per_km_one_way > 0)
  .map((c) => c.price_per_km_one_way));

export function destMeta(d) {
  const permit = d.state !== 'Karnataka';
  return {
    path: destPath(d),
    title: `Bangalore to ${d.name} Cab | One Way & Round Trip Taxi – Taxi House`,
    description: `Book a Bangalore to ${d.name} cab: ${d.km} km by road, one-way drop from ₹${minOneWayRate()}/km or round trip. `
      + `Sedan, SUV, Innova Crysta & Tempo Traveller with driver. All-in fares${permit ? ', permit at actuals' : ''}. 24×7.`,
  };
}

export const SERVICES = [
  {
    slug: 'outstation-cabs-bangalore',
    title: 'Outstation Cabs from Bangalore | One Way & Round Trip Taxi – Taxi House',
    description: 'Outstation cabs from Bangalore to 57 destinations in Karnataka, Tamil Nadu, Kerala and Andhra Pradesh. One-way drops and round trips, all-in fares, 24×7.',
  },
  {
    slug: 'one-way-taxi-bangalore',
    title: 'One Way Taxi from Bangalore | Drop Taxi, Pay One Way Only – Taxi House',
    description: `One-way drop taxi from Bangalore from ₹${minOneWayRate()}/km — pay for one way, not the return. Fares to Mysuru, Coorg, Chennai, Tirupati and more, driver allowance included.`,
  },
  {
    slug: 'round-trip-cabs-bangalore',
    title: 'Round Trip Cabs from Bangalore | Outstation Return Taxi – Taxi House',
    description: 'Round-trip outstation cabs from Bangalore at lower per-km rates. Clear billing: 300 km minimum per day, driver allowance per day, 15% advance, full refund 48h before.',
  },
  {
    slug: 'local-taxi-bangalore',
    title: 'Local Taxi in Bangalore | Car Rental with Driver, 8 Hours 80 KM – Taxi House',
    description: 'Hire a car with a driver in Bangalore for 8 hours / 80 km — sedan, SUV, Innova Crysta or Tempo Traveller. Fixed package fares, pickup anywhere in the city.',
  },
  {
    slug: 'tempo-traveller-rental-bangalore',
    title: 'Tempo Traveller Rental in Bangalore | 12 Seater AC & Non-AC – Taxi House',
    description: '12-seater Tempo Traveller on rent in Bangalore with driver — AC and non-AC, outstation round trips and 8-hour local packages. Per-km fares shown upfront.',
  },
  {
    slug: 'innova-crysta-rental-bangalore',
    title: 'Innova Crysta for Rent in Bangalore | With Driver – Taxi House',
    description: 'Toyota Innova Crysta with driver in Bangalore — AC and non-AC, one-way drops, round trips, airport runs and local packages. 7 seats, all-in fares.',
  },
  {
    slug: 'corporate-cab-service-bangalore',
    title: 'Corporate Cab Service in Bangalore | Business Travel Taxi – Taxi House',
    description: 'Corporate cab service in Bangalore: airport transfers, client pickups, team outstation trips and local cars with drivers. Request a corporate account quote.',
  },
  {
    slug: 'wedding-car-rental-bangalore',
    title: 'Wedding Car Rental in Bangalore | Guest Cabs & Fleet – Taxi House',
    description: 'Wedding cars and guest transport in Bangalore — sedans, Innova Crysta and Tempo Travellers with drivers for the wedding day, venue runs and airport pickups.',
  },
].map((s) => ({ ...s, path: `/${s.slug}` }));
export const getService = (slug) => SERVICES.find((s) => s.slug === slug) || null;

export const GUIDES = [
  {
    slug: 'bangalore-airport-taxi-fare',
    title: 'Bangalore Airport Taxi Fare Guide | KIA Cab Distance from Every Area',
    description: 'How much is a taxi to Bangalore airport (KIA)? Road distance from 50+ areas, how fixed airport fares work and tips for catching your flight.',
    h1: 'Bangalore airport taxi: distances and fares',
  },
  {
    slug: 'one-way-vs-round-trip-cab',
    title: 'One Way vs Round Trip Cab from Bangalore: Which Is Cheaper?',
    description: 'One-way drop or round trip? Real fare comparisons for routes from Bangalore and a simple rule for choosing the cheaper option.',
    h1: 'One way or round trip: which is cheaper?',
  },
  {
    slug: 'weekend-getaways-from-bangalore',
    title: 'Weekend Getaways from Bangalore by Cab | Distances & Taxi Fares',
    description: 'Hill stations, wildlife, heritage and temple towns within a day’s drive of Bangalore — road distance, drive time and one-way cab fare for each.',
    h1: 'Weekend getaways from Bangalore by cab',
  },
].map((g) => ({ ...g, path: `/guides/${g.slug}` }));
export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug) || null;

export const GUIDES_INDEX = {
  path: '/guides',
  title: 'Bangalore Cab & Travel Guides – Taxi House Bengaluru',
  description: 'Practical guides for travelling from Bangalore by cab: airport taxi fares, one way vs round trip, and weekend getaways with distances and fares.',
};

// ---------------------------------------------------------------- JSON-LD
export function breadcrumbLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BUSINESS.url}${path}` })),
  };
}
export const faqLd = (faq) => ({
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
export const ldGraph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });
