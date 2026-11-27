import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TEL_URL, waUrl } from '../../data/business';

/** Mobile-only sticky Call / WhatsApp / Book bar. Adds body padding so it never covers the footer. */
export default function ActionBar() {
  useEffect(() => {
    document.body.classList.add('has-actionbar');
    return () => document.body.classList.remove('has-actionbar');
  }, []);
  return (
    <nav className="actionbar" aria-label="Quick actions">
      <a className="btn btn--outline" href={TEL_URL}>Call</a>
      <a className="btn btn--outline" href={waUrl()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <Link className="btn btn--primary" to="/#book">Book a cab</Link>
    </nav>
  );
}
