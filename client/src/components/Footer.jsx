import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-8 px-4 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 sm:gap-12">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4 text-center sm:text-left">
            <h3 className="text-2xl font-black text-white tracking-tight">
              Taxi<span className="text-primary">House</span>
            </h3>
            <p className="text-[11px] sm:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0 opacity-70">
              Reliable, 24/7 premium ride service in Bengaluru. Safe, professional, and on-time.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-50">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link to="/" className="hover-desktop-only:text-primary transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover-desktop-only:text-primary transition-colors">Services</Link></li>
              <li><Link to="/fleet" className="hover-desktop-only:text-primary transition-colors">Fleet</Link></li>
              <li><Link to="/contact" className="hover-desktop-only:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-50">Services</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>Local City</li>
              <li>Airport Drop</li>
              <li>Outstation</li>
              <li>Corporate</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1 text-center sm:text-left pt-6 sm:pt-0 border-t border-gray-800 sm:border-0 mt-4 sm:mt-0">
            <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest opacity-50">Contact</h4>
            <ul className="space-y-3">
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <MapPin className="text-primary mb-1 sm:mb-0 sm:mr-3 flex-shrink-0" size={16} />
                <span className="text-[11px] leading-snug">MG Road, Bengaluru, KA 560001</span>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <Phone className="text-primary mb-1 sm:mb-0 sm:mr-3 flex-shrink-0" size={16} />
                <a href="tel:+919876543210" className="text-[11px] font-bold">+91 98765 43210</a>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <Mail className="text-primary mb-1 sm:mb-0 sm:mr-3 flex-shrink-0" size={16} />
                <a href="mailto:info@taxihousebengaluru.in" className="text-[11px] truncate max-w-[180px] sm:max-w-none">info@taxihousebengaluru.in</a>
              </li>
            </ul>
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
