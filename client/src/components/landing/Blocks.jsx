import { Link } from 'react-router-dom';
import { BUSINESS, TEL_URL, waUrl } from '../../data/business';
import { POLICIES } from '../../lib/fares';

/** Structured data rendered inline (prerendered into the HTML). */
export function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** White hero with breadcrumb, eyebrow, H1, lede; children = facts / actions. */
export function PageHero({ crumbs, eyebrow, title, lede, children, id = 'page-title' }) {
  return (
    <>
      <section className="hero hero--light area-hero" aria-labelledby={id}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map(([label, to], i) => (
                <li key={label} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                  {i === crumbs.length - 1 ? label : <Link to={to}>{label}</Link>}
                </li>
              ))}
            </ol>
          </nav>
          {eyebrow && <p className="eyebrow eyebrow--dot accent-text">{eyebrow}</p>}
          <h1 id={id} className="h1 area-hero__title">{title}</h1>
          {lede && <p className="lede muted area-hero__lede">{lede}</p>}
          {children}
        </div>
      </section>
      <div className="checker" aria-hidden="true" />
    </>
  );
}

export function Facts({ items }) {
  return (
    <dl className="area-facts">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label}><dt className="eyebrow muted">{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}

export function HeroActions({ primary, secondary, waText }) {
  return (
    <div className="area-hero__actions">
      {primary && <Link className="btn btn--primary btn--pill" to={primary.to}>{primary.label}</Link>}
      {secondary && <Link className="btn btn--outline btn--pill" to={secondary.to}>{secondary.label}</Link>}
      <a className="btn btn--outline btn--pill mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
      <a className="btn btn--outline btn--pill" href={waUrl(waText)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>
  );
}

export function FaqSection({ title, faq, id = 'faq-title' }) {
  return (
    <div className="wrap area-faq">
      <h2 id={id} className="h2">{title}</h2>
      <div className="faq">
        {faq.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p className="muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function CtaBand({ title, waText }) {
  return (
    <div className="wrap">
      <div className="ctaband on-accent">
        <div>
          <h2 className="h2">{title}</h2>
          <p className="ctaband__sub">Online booking needs {POLICIES.advanceBookingHours} hours’ notice. For anything sooner, call or WhatsApp the desk.</p>
        </div>
        <div className="ctaband__actions">
          <a className="btn btn--ink btn--pill mono" href={TEL_URL}>Call {BUSINESS.phoneDisplay}</a>
          <a className="btn btn--outline btn--pill" href={waUrl(waText)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

/** Simple responsive table: real <table> from 768px, stacked cards below. */
export function DataTable({ caption, columns, rows, rowHeader = 0 }) {
  return (
    <div className="dtable">
      <table className="tbl">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {r.cells.map((cell, i) => (i === rowHeader
                ? <th key={i} scope="row" data-label={columns[i]}>{cell}</th>
                : <td key={i} data-label={columns[i]} className={r.numeric?.includes(i) ? 'num' : undefined}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
