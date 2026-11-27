import { Link } from 'react-router-dom';

/** Real logo file (public/logo.png → img/logo-*.webp) in the 36px rounded-square slot + wordmark. */
export default function Logo({ sub = true, to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Taxi House Bengaluru — home">
      <picture>
        <source type="image/webp" srcSet="/img/logo-72.webp 1x, /img/logo-144.webp 2x" />
        <img className="logo__mark" src="/img/logo-72.png" width="36" height="36" alt="" />
      </picture>
      <span className="logo__word" aria-hidden="true">
        <span className="logo__name">TAXI HOUSE</span>
        {sub && <span className="logo__sub">BENGALURU</span>}
      </span>
    </Link>
  );
}
