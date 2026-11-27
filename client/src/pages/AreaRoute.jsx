import { Navigate, useLocation } from 'react-router-dom';
import AreaPage from './AreaPage';
import { areaFromPath } from '../lib/areas';

/** Catch-all: /taxi-service-in-{slug} renders that area's page; anything else goes home. */
export default function AreaRoute() {
  const { pathname } = useLocation();
  const area = areaFromPath(pathname);
  return area ? <AreaPage key={area.slug} area={area} /> : <Navigate to="/" replace />;
}
