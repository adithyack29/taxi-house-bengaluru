import { Link } from 'react-router-dom';
import { BUSINESS, TEL_URL, MAPS_URL } from '../../data/business';
import FARES from '../../data/fares.json';
import { PHOTO_CREDITS } from './photos';

const routeLink = (r) => `/?type=outstation&trip=one-way&drop=${encodeURIComponent(r.drop)}&dropCoord=${r.coord}#book`;

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer on-ink">
      <div className="wrap">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <p className="site-footer__wordmark">TAXI HOUSE</p>
            <p className="muted" style={{ margin: 0 }}>Outstation, airport and local chauffeur cabs from Bengaluru.</p>
          </div>
          <div>
            <h2>Services</h2>
            <ul>
              <li><Link to="/?trip=one-way#book">Outstation one way</Link></li>
              <li><Link to="/?trip=two-way#book">Round trips</Link></li>
              <li><Link to="/airport">Airport transfers</Link></li>
              <li><Link to="/?type=local#book">Local hourly</Link></li>
              <li><Link to="/tariff">Fleet &amp; tariff</Link></li>
            </ul>
          </div>
          <div>
            <h2>Routes</h2>
            <ul>
              {FARES.routes.slice(0, 4).map((r) => (
                <li key={r.slug}><Link to={routeLink(r)}>Bengaluru → {r.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Contact</h2>
            <ul>
              <li><a className="mono" href={TEL_URL}>{BUSINESS.phoneDisplay}</a></li>
              <li><a className="mono" href={`tel:${BUSINESS.phoneAlt}`}>{BUSINESS.phoneAltDisplay}</a></li>
              <li><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
              <li><a href={MAPS_URL} target="_blank" rel="noopener noreferrer">{BUSINESS.address.locality}, {BUSINESS.address.city} <span className="mono">&nbsp;{BUSINESS.address.postalCode}</span></a></li>
              <li><a href={BUSINESS.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={BUSINESS.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="site-footer__legal">
          <p style={{ margin: 0 }}>
            © {year} Taxi House Bengaluru
            {PHOTO_CREDITS.map((c) => (
              <span key={c.source} className="site-footer__credit">
                {' · '}{c.label}: <a href={c.source} target="_blank" rel="noopener noreferrer">{c.author}</a>,{' '}
                <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license">{c.license}</a>
              </span>
            ))}
          </p>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/terms-and-conditions">Terms</Link></li>
            <li><Link to="/refund-policy">Cancellation &amp; refund policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
