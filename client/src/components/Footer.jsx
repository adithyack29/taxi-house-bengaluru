import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-6 px-4 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand - Always centered on mobile, left on desktop */}
        <div className="text-center sm:text-left mb-8 sm:mb-12">
          <Link to="/" className="inline-block p-1 bg-white rounded-full">
            <img src="/logo.png" alt="Taxi House Bengaluru" className="h-12 w-auto object-contain" />
          </Link>
          <p className="text-[10px] sm:text-sm opacity-60 mt-1">Reliable 24/7 Bengaluru Cab Service</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 sm:gap-12">
          
          {/* Quick Links - Side by Side on Mobile */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-40">Quick Links</h4>
            <ul className="space-y-2 text-[11px] sm:text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/fleet" className="hover:text-primary transition-colors">Fleet</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services - Side by Side on Mobile */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-40">Services</h4>
            <ul className="space-y-2 text-[11px] sm:text-sm">
              <li>Local</li>
              <li>Airport</li>
              <li>Outstation</li>
              <li>Corporate</li>
            </ul>
          </div>

          {/* Contact Details - Refined and Compact */}
          <div className="col-span-2 md:col-span-2 mt-2 sm:mt-0 border-t border-gray-800 pt-8 sm:pt-0 sm:border-0">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-40 text-center sm:text-left">Get in Touch</h4>
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 items-center sm:items-start justify-center sm:justify-start">
              <div className="flex items-center space-x-2">
                <Phone className="text-primary" size={14} />
                <a href="tel:+919876543210" className="text-[11px] font-bold">+91 98765 43210</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="text-primary" size={14} />
                <a href="mailto:info@taxihouse.in" className="text-[11px]">info@taxihouse.in</a>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="text-primary" size={14} />
                <span className="text-[11px]">MG Road, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© {new Date().getFullYear()} Taxi House Bengaluru. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
