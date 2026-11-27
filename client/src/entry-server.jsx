/**
 * Server entry used only at build time (scripts/prerender.mjs) to write real HTML for SEO pages.
 * The browser app hydrates that HTML (see main.jsx).
 */
import { StaticRouter } from 'react-router-dom';
import { prerenderToNodeStream } from 'react-dom/static';
import { AppRoutes } from './App';
import { allAreas, areaMeta, AREAS_META } from './lib/areas';
import { allDestinations, destMeta, GUIDES, GUIDES_INDEX, SERVICES } from './lib/landing';
import { STATIC_META } from './lib/static-meta';

export async function render(url) {
  const { prelude } = await prerenderToNodeStream(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  );
  let html = '';
  for await (const chunk of prelude) html += chunk;
  return html;
}

/** Pages to prerender, each with its own title / description / canonical path. */
export function pages() {
  return [
    ...STATIC_META, ...SERVICES, ...allDestinations().map(destMeta), GUIDES_INDEX, ...GUIDES,
    AREAS_META, ...allAreas().map(areaMeta),
  ];
}
