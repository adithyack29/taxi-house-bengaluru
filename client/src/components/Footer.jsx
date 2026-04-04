import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-4 px-4 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand - Left Aligned on Desktop */}
        <div className="flex flex-col items-center sm:items-start mb-3 sm:mb-8">
          <a href="/" className="inline-block p-1 bg-white rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="Taxi House Bengaluru" className="h-7 sm:h-12 w-auto object-contain" />
          </a>
          <p className="text-[9px] sm:text-sm font-medium text-white/50 mt-1 sm:mt-2 tracking-wide">Reliable 24/7 Bengaluru Cab Service</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-12">
          
          {/* Quick Links */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white/40 mb-1.5 sm:mb-6 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-4 text-[11px] sm:text-lg font-medium">
              <li><Link to="/" className="text-white/80 hover:text-primary transition-all duration-300">Home</Link></li>
              <li><Link to="/about" className="text-white/80 hover:text-primary transition-all duration-300">About Us</Link></li>
              <li><Link to="/services" className="text-white/80 hover:text-primary transition-all duration-300">Our Services</Link></li>
              <li><Link to="/contact" className="text-white/80 hover:text-primary transition-all duration-300">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white/40 mb-1.5 sm:mb-6 uppercase tracking-wider">Services</h4>
            <ul className="space-y-1 sm:space-y-4 text-[11px] sm:text-lg font-medium text-white/80">
              <li><Link to="/services" className="hover:text-primary transition-colors">Outstation Cabs</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Airport Transfers</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Local Packages</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">One Way Drops</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Corporate Rentals</Link></li>
            </ul>
          </div>

          {/* Contact Details - Vertical Stack */}
          <div className="col-span-2 md:col-span-2 mt-2 sm:mt-0 border-t border-gray-800 pt-6 sm:pt-0 sm:border-0">
            <h4 className="text-[10px] sm:text-sm font-bold text-white/40 mb-3 text-center sm:text-left">Get in Touch</h4>
            <div className="flex flex-col space-y-4 items-center sm:items-start justify-center sm:justify-start">
              <div className="flex items-center space-x-3 sm:space-x-4 group">
                <Phone className="text-primary group-hover:scale-110 transition-transform" size={16} />
                <div className="flex flex-col">
                  <a href="tel:+917795965640" className="text-sm sm:text-lg font-bold text-white/90 hover:text-primary transition-all duration-300 tracking-tight">+91 77959 65640</a>
                  <a href="tel:+918660484650" className="text-sm sm:text-lg font-bold text-white/90 hover:text-primary transition-all duration-300 tracking-tight">+91 86604 84650</a>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 group">
                <Mail className="text-primary group-hover:scale-110 transition-transform" size={16} />
                <a href="mailto:taxihousebengaluru@gmail.com" className="text-[10px] sm:text-base font-medium text-white/80 hover:text-primary transition-all duration-300">taxihousebengaluru@gmail.com</a>
              </div>
              <div className="flex items-start space-x-4 group">
                <MapPin className="text-primary group-hover:scale-110 transition-transform mt-1" size={16} />
                <span className="text-[10px] sm:text-sm font-medium text-white/80 text-center sm:text-left leading-tight">
                  Shop No. 1, 2nd Floor, Survey No. 2,<br />
                  Near VNR Fuelling Station (Indian Oil Dealers),<br />
                  Krishnanagar, Yadavanahalli,<br />
                  Attibele Hobli, Anekal Taluk,<br />
                  Bengaluru - 562107
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 text-center text-[9px] sm:text-xs">
          <p>© {new Date().getFullYear()} Taxi House Bengaluru. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
