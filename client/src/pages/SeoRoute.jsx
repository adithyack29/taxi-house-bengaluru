import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Each page family loads its own code + data only when visited.
const AreaRoute = lazy(() => import('./AreaRoute'));
const LandingRoute = lazy(() => import('./LandingRoute'));

/** Catch-all for SEO landing pages; unknown paths go home. */
export default function SeoRoute() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/taxi-service-in-')) return <AreaRoute />;
  if (/^\/(bangalore-to-[a-z0-9-]+-cab|guides(\/[a-z0-9-]+)?|[a-z0-9-]+-bangalore)\/?$/.test(pathname)) return <LandingRoute />;
  return <Navigate to="/" replace />;
}
