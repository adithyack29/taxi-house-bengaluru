import { useEffect } from 'react';
import { BUSINESS } from '../../data/business';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

/**
 * Per-page title / description / canonical / Open Graph. index.html carries the static defaults
 * and the site-wide TaxiService JSON-LD, so crawlers without JS still get real NAP data.
 */
export default function Seo({ title, description, path = '/', noindex = false }) {
  useEffect(() => {
    const url = `${BUSINESS.url}${path}`;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    let canon = document.head.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
    canon.href = url;
  }, [title, description, path, noindex]);
  return null;
}
