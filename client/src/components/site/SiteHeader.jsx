import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { NAV } from './nav';
import { BUSINESS, TEL_URL, waUrl } from '../../data/business';

/**
 * tone: 'white' (home) | 'ink' (contact) | 'accent' (airport) | 'paper' (tariff, legacy pages)
 * mobileTitle: when set, mobile shows ← back + centred title (sub-pages), else logo.
 */
export default function SiteHeader({ tone = 'paper', mobileTitle = null, showPhone = true }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef(null);
  const closeBtn = useRef(null);
  const toneClass = tone === 'ink' ? 'on-ink' : tone === 'accent' ? 'on-accent' : tone === 'white' ? 'on-white' : '';

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const btn = menuBtn.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      btn?.focus();
    };
  }, [open]);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <header className={`site-header ${toneClass}`}>
      <div className="wrap site-header__bar">
        {mobileTitle ? (
          <>
            <button type="button" className="icon-btn site-header__back" onClick={goBack} aria-label="Go back">
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <p className="site-header__title">{mobileTitle}</p>
            <span className="hidden lg:inline-flex"><Logo /></span>
          </>
        ) : (
          <Logo />
        )}

        <nav className="site-header__nav" aria-label="Primary">
          <ul>
            {NAV.map((item) => (
              <li key={item.label}>
                <Link to={item.to} aria-current={item.match && pathname === item.match ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__right">
          {showPhone && tone !== 'accent' && (
            <a className="site-header__phone" href={TEL_URL}>{BUSINESS.phoneDisplay}</a>
          )}
          <Link to="/#book" className={`btn btn--sm btn--pill ${tone === 'accent' ? 'btn--ink' : 'btn--primary'}`}>Book a cab</Link>
        </div>

        <button
          ref={menuBtn}
          type="button"
          className="icon-btn icon-btn--bare site-header__menu"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={24} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="mmenu" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>
          <div className="mmenu__top">
            <Logo />
            <button ref={closeBtn} type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <nav className="mmenu__nav" aria-label="Mobile">
            <ul>
              <li><Link to="/" aria-current={pathname === '/' ? 'page' : undefined}>Home</Link></li>
              {NAV.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} onClick={() => setOpen(false)} aria-current={item.match && pathname === item.match ? 'page' : undefined}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mmenu__foot">
            <a className="btn btn--primary btn--block mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
            <a className="btn btn--outline btn--block" href={waUrl()} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
          </div>
        </div>
      )}
    </header>
  );
}
