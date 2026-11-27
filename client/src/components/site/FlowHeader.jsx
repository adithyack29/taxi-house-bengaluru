import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { BUSINESS, TEL_URL } from '../../data/business';

const STEPS = ['Trip', 'Choose cab', 'Confirm'];

/** Minimal header for the booking flow. step: 1-based current step (3 = done → all complete). */
export default function FlowHeader({ step = 2, mobileTitle, mobileSub, onBack, showSteps = true }) {
  const navigate = useNavigate();
  return (
    <header className="flow-header">
      <div className="wrap flow-header__bar">
        {mobileTitle ? (
          <div className="flow-header__m">
            <button type="button" className="icon-btn" aria-label="Back" onClick={onBack || (() => navigate(-1))}>
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <div>
              <p className="flow-header__mt">{mobileTitle}</p>
              {mobileSub && <p className="eyebrow muted flow-header__ms">{mobileSub}</p>}
            </div>
          </div>
        ) : (
          <span style={{ display: 'inline-flex' }}><Logo sub={false} /></span>
        )}
        {mobileTitle && <span className="flow-header__logo"><Logo sub={false} /></span>}

        {showSteps && (
          <ol className="steps" aria-label="Booking progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              return (
                <li key={label} className={done ? 'is-done' : ''} aria-current={n === step ? 'step' : undefined}>
                  <span className="steps__dot" aria-hidden="true">{done ? '✓' : n}</span>
                  {label}{done && <span className="sr-only"> (completed)</span>}
                </li>
              );
            })}
          </ol>
        )}
        <a className="flow-header__phone" href={TEL_URL} style={showSteps ? undefined : { marginLeft: 'auto' }}>{BUSINESS.phoneDisplay}</a>
      </div>
    </header>
  );
}
