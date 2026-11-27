/**
 * Build step: writes a static HTML file for every SEO page (areas index + one per service area),
 * with that page's own <title>, meta description, canonical and Open Graph tags, plus a sitemap.
 * Run after `vite build` and the SSR build (see package.json "build").
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');
const SITE = 'https://www.taxihousebengaluru.com';

const { render, pages } = await import(pathToFileURL(ssrEntry).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setHead(html, { title, description, path: p }) {
  const url = `${SITE}${p}`;
  const swaps = [
    [/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`],
    [/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`],
    [/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`],
    [/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`],
    [/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`],
    [/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${url}$2`],
    [/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`],
    [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`],
  ];
  for (const [re, rep] of swaps) {
    if (!re.test(html)) throw new Error(`prerender: index.html is missing ${re}`);
    html = html.replace(re, rep);
  }
  return html;
}

const list = pages();
let count = 0;
for (const page of list) {
  const body = await render(page.path);
  const html = setHead(template, page).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  // /taxi-service-in-x is served from taxi-service-in-x.html (vercel.json cleanUrls; vite preview does the same).
  const file = path.join(dist, `${page.path.replace(/^\//, '')}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  count += 1;
}

// Sitemap: public pages + every prerendered page.
const STATIC = ['/', '/airport', '/tariff', '/contact', '/explore', '/services', '/about', '/terms-and-conditions', '/refund-policy'];
const today = new Date().toISOString().slice(0, 10);
const urls = [...new Set([...STATIC, ...list.map((p) => p.path)])]
  .map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

console.log(`prerender: wrote ${count} pages + sitemap (${new Set([...STATIC, ...list.map((p) => p.path)]).size} URLs)`);
