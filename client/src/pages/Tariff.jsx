import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import Seo from '../components/site/Seo';
import { TARIFF_META } from '../lib/static-meta';
import { useCars } from '../hooks/useCars';
import { airportFare, formatINR, groupByClass, minOf, POLICIES, vehicleClass, CLASS_META } from '../lib/fares';

const rate = (v) => (v > 0 ? `₹${Number(v).toLocaleString('en-IN')}` : '—');

export default function Tariff() {
  const { cars: outstation, loading } = useCars('outstation', { fallbackFirst: true });
  const { cars: airport } = useCars('airport');
  const { cars: local } = useCars('local', { fallbackFirst: true });

  const rows = useMemo(() => [...outstation].sort((a, b) =>
    (CLASS_META[vehicleClass(a.name)].order - CLASS_META[vehicleClass(b.name)].order)
    || ((a.price_per_km_one_way || a.price_per_km) - (b.price_per_km_one_way || b.price_per_km))), [outstation]);

  // Airport fare for the same model (name + AC) from the airport category, if offered.
  const airportFor = (car) => {
    const m = airport.find((a) => a.name === car.name && a.is_ac === car.is_ac) || airport.find((a) => a.name === car.name);
    return m ? formatINR(airportFare(m)) : '—';
  };
  const localClasses = useMemo(() => groupByClass(local), [local]);

  return (
    <>
      <Seo {...TARIFF_META} />
      <SiteHeader tone="paper" mobileTitle="Fleet & tariff" />
      <main id="main">
        <div className="wrap">
          <div className="ptitle">
            <h1 className="h1">Every rate, on one page.</h1>
            <p className="muted" style={{ margin: 0 }}>No “call for price”. These are the numbers we bill — tolls, parking and permits at actuals.</p>
          </div>

          <h2 className="eyebrow muted label-eyebrow">Outstation</h2>
          {loading && !outstation.length ? <p className="muted" aria-live="polite">Loading rates…</p> : (
            <>
              <div className="ink-tbl on-ink tbl-scroll">
                <table className="tbl tbl--ink">
                  <caption className="sr-only">Outstation rates per car</caption>
                  <thead>
                    <tr>
                      <th scope="col">Car</th>
                      <th scope="col">One way / km</th>
                      <th scope="col">Round trip / km</th>
                      <th scope="col">Min km / day</th>
                      <th scope="col">Driver / day</th>
                      <th scope="col">Airport from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id}>
                        <th scope="row">
                          <span className="t-name">{c.name}</span>
                          <span className="t-sub">{CLASS_META[vehicleClass(c.name)].label} · {c.seats} seats · {c.is_ac === false ? 'Non-AC' : 'AC'}</span>
                        </th>
                        <td className="num accent-text">{rate(c.price_per_km_one_way)}</td>
                        <td className="num">{rate(c.price_per_km)}</td>
                        <td className="mono">{c.min_km || POLICIES.minKmPerDayRoundTrip} km</td>
                        <td className="mono">{formatINR(c.driver_bata || 300)}</td>
                        <td className="mono">{airportFor(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="ink-cards">
                {rows.map((c) => (
                  <li key={c.id} className="ink-card on-ink">
                    <div className="ink-card__top">
                      <h3 className="ink-card__name">{c.name}</h3>
                      <span className="num accent-text ink-card__rate">
                        {c.price_per_km_one_way > 0 ? rate(c.price_per_km_one_way) : rate(c.price_per_km)}<small>/km{c.price_per_km_one_way > 0 ? '' : ' RT'}</small>
                      </span>
                    </div>
                    <p className="t-sub" style={{ margin: '6px 0 0', fontSize: 13.5 }}>{CLASS_META[vehicleClass(c.name)].label} · {c.seats} seats · {c.is_ac === false ? 'Non-AC' : 'AC'}</p>
                    <dl>
                      <div><dt>Round trip / km</dt><dd>{rate(c.price_per_km)}</dd></div>
                      <div><dt>Driver / day</dt><dd>{formatINR(c.driver_bata || 300)}</dd></div>
                      <div><dt>Min km / day</dt><dd>{c.min_km || POLICIES.minKmPerDayRoundTrip} km</dd></div>
                      <div><dt>Airport from</dt><dd>{airportFor(c)}</dd></div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="tariff-lower">
            <div>
              <h2 className="eyebrow muted label-eyebrow">Local hourly packages</h2>
              <div className="card-tbl tbl-scroll">
                <table className="tbl">
                  <caption className="sr-only">Local hourly package prices by car type</caption>
                  <thead>
                    <tr>
                      <th scope="col">Package</th>
                      {localClasses.map((g) => <th key={g.key} scope="col">{g.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row"><span className="t-name">{POLICIES.localPackage.replace(' / ', ' · ').replace('Hours', 'hrs').replace('KM', 'km')}</span></th>
                      {localClasses.map((g) => <td key={g.key} className="num">{formatINR(minOf(g.cars, (c) => c.base_fare))}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* TODO: 4 h / 40 km and 12 h / 120 km packages appear in the mockup but only the 8 h / 80 km package exists in the booking system. */}
              <p className="fine page-foot">Prices are the lowest in each class; see the exact car on the booking page.</p>
            </div>
            <div>
              <h2 className="eyebrow muted label-eyebrow">The fine print, not so fine</h2>
              <ul className="fineprint">
                <li>Round trips bill a minimum of {POLICIES.minKmPerDayRoundTrip} km per calendar day. One-way trips bill the actual distance.</li>
                <li>Chauffeur duty hours are {POLICIES.dutyHours.start} AM – {POLICIES.dutyHours.end - 12} PM. A pickup or drop outside them adds one day of driver allowance.</li>
                <li>Choose the day-and-night plan on long trips and night allowance applies for each night on the road.</li>
                <li>Travelling with a pet adds {formatINR(POLICIES.petFee)}.</li>
                <li>Round trips are confirmed with a {POLICIES.advancePercentRoundTrip}% advance — fully refunded if you cancel {POLICIES.freeCancellationHours}+ hours before pickup. <Link to="/refund-policy">Refund policy</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ height: 'clamp(56px, 6vw, 96px)' }} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
