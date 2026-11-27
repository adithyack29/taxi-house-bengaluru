import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SiteHeader from './components/site/SiteHeader';
import SiteFooter from './components/site/SiteFooter';

const Book = lazy(() => import('./pages/Book'));
const BookingConfirmed = lazy(() => import('./pages/BookingConfirmed'));
const Airport = lazy(() => import('./pages/Airport'));
const Tariff = lazy(() => import('./pages/Tariff'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Explore = lazy(() => import('./pages/Explore'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Areas = lazy(() => import('./pages/Areas'));
const AreaRoute = lazy(() => import('./pages/AreaRoute'));

/** Pre-redesign pages keep their content, framed by the new header/footer. */
function Legacy({ children }) {
  return (
    <>
      <SiteHeader tone="paper" />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

/** Old booking URLs → new ones, query string preserved (Cashfree order_id, carId, trip params). */
function Redirect({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

/** Routes without a router, shared by the browser app and the prerender (StaticRouter). */
export function AppRoutes() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollToTop />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/booking-confirmed" element={<BookingConfirmed />} />
          <Route path="/airport" element={<Airport />} />
          <Route path="/tariff" element={<Tariff />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<Legacy><About /></Legacy>} />
          <Route path="/services" element={<Legacy><Services /></Legacy>} />
          <Route path="/explore" element={<Legacy><Explore /></Legacy>} />
          <Route path="/terms-and-conditions" element={<Legacy><TermsAndConditions /></Legacy>} />
          <Route path="/refund-policy" element={<Legacy><RefundPolicy /></Legacy>} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/select-vehicle" element={<Redirect to="/book" />} />
          <Route path="/confirm-booking" element={<Redirect to="/book" />} />
          <Route path="/payment-success" element={<Redirect to="/booking-confirmed" />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="*" element={<AreaRoute />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
