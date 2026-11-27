import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import DestinationPage from './DestinationPage';
import ServicePage from './ServicePage';
import { destFromPath, getGuide, getService } from '../lib/landing';

// Guides pull in the full area list, so they load separately.
const GuidePage = lazy(() => import('./GuidePage'));
const GuidesIndex = lazy(() => import('./GuidePage').then((m) => ({ default: m.GuidesIndex })));

export default function LandingRoute() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '');
  const dest = destFromPath(path);
  if (dest) return <DestinationPage key={dest.slug} dest={dest} />;
  if (path === '/guides') return <GuidesIndex />;
  const guide = path.startsWith('/guides/') ? getGuide(path.slice(8)) : null;
  if (guide) return <GuidePage key={guide.slug} guide={guide} />;
  const service = getService(path.slice(1));
  if (service) return <ServicePage key={service.slug} service={service} />;
  return <Navigate to="/" replace />;
}
