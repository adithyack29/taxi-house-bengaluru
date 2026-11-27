import { Link } from 'react-router-dom';
import { BUSINESS, TEL_URL, MAPS_URL } from '../../data/business';
import FARES from '../../data/fares.json';
import { PHOTO_CREDITS } from './photos';

const routeLink = (r) => `/bangalore-to-${r.slug}-cab`;

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <p className="site-footer__wordmark">TAXI HOUSE</p>
            <p className="muted" style={{ margin: 0 }}>Outstation, airport and local chauffeur cabs from Bengaluru.</p>
          </div>
          <div>
            <h2>Services</h2>
            <ul>
              <li><Link to="/outstation-cabs-bangalore">Outstation cabs</Link></li>
              <li><Link to="/one-way-taxi-bangalore">One way taxi</Link></li>
              <li><Link to="/round-trip-cabs-bangalore">Round trips</Link></li>
              <li><Link to="/airport">Airport taxi</Link></li>
              <li><Link to="/local-taxi-bangalore">Local taxi with driver</Link></li>
              <li><Link to="/tempo-traveller-rental-bangalore">Tempo Traveller rental</Link></li>
              <li><Link to="/innova-crysta-rental-bangalore">Innova Crysta rental</Link></li>
              <li><Link to="/corporate-cab-service-bangalore">Corporate cabs</Link></li>
              <li><Link to="/wedding-car-rental-bangalore">Wedding cars</Link></li>
              <li><Link to="/tariff">Fleet &amp; tariff</Link></li>
            </ul>
          </div>
          <div>
            <h2>Routes</h2>
            <ul>
              {FARES.routes.map((r) => (
                <li key={r.slug}><Link to={routeLink(r)}>Bangalore to {r.name} cab</Link></li>
              ))}
              <li><Link to="/outstation-cabs-bangalore">All outstation routes</Link></li>
              <li><Link to="/areas">Areas we serve</Link></li>
              <li><Link to="/guides">Travel guides</Link></li>
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
