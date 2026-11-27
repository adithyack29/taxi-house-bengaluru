import { Link } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import ActionBar from '../components/site/ActionBar';
import Seo from '../components/site/Seo';
import { allAreas, areaPath, AREAS_META, ZONES } from '../lib/areas';


export default function Areas() {
  const areas = allAreas();
  return (
    <>
      <Seo {...AREAS_META} />
      <SiteHeader tone="white" />
      <main id="main">
        <section className="hero hero--light area-hero" aria-labelledby="areas-title">
          <div className="wrap">
            <p className="eyebrow eyebrow--dot accent-text">{areas.length} areas · 24×7</p>
            <h1 id="areas-title" className="h1 area-hero__title">Taxi service across Bengaluru</h1>
            <p className="lede muted area-hero__lede">
              We pick up from every corner of the city and the towns around it. Find your area for airport distance,
              outstation fares and local cab options from your doorstep.
            </p>
            <nav aria-label="Jump to zone">
              <ul className="chips">
                {ZONES.map((z) => <li key={z.key}><a className="chip" href={`#${z.key}`}>{z.label}</a></li>)}
              </ul>
            </nav>
          </div>
        </section>
        <div className="checker" aria-hidden="true" />
        <section className="section">
          <div className="wrap">
            {ZONES.map((z) => {
              const list = areas.filter((a) => a.zone === z.key).sort((x, y) => x.name.localeCompare(y.name));
              if (!list.length) return null;
              return (
                <section key={z.key} id={z.key} className="areas-zone" aria-labelledby={`zone-${z.key}`}>
                  <h2 id={`zone-${z.key}`} className="h2 areas-zone__title">{z.label} <span className="mono muted areas-zone__count">{list.length}</span></h2>
                  <ul className="areas-list">
                    {list.map((a) => (
                      <li key={a.slug}><Link to={areaPath(a)}>{a.name}</Link></li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
      <ActionBar />
    </>
  );
}
