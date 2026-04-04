import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header as Navbar } from './components/ui/navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import SelectVehicle from './pages/SelectVehicle';
import AdminDashboard from './pages/AdminDashboard';
import ConfirmBooking from './pages/ConfirmBooking';
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();
  const isMinimalPage = ['/select-vehicle', '/confirm-booking', '/admin'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!isMinimalPage && <Navbar />}
      <main className={`flex-grow ${!isMinimalPage ? 'pt-16 lg:pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/select-vehicle" element={<SelectVehicle />} />
          <Route path="/confirm-booking" element={<ConfirmBooking />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isMinimalPage && <Footer />}
      {!isMinimalPage && <WhatsAppButton />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
