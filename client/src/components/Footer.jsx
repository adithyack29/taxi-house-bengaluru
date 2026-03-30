import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-16 px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8">
          
          {/* Brand */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-2xl font-black text-white tracking-tight">
              Taxi<span className="text-primary">House</span>
            </h3>
            <p className="text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Your trusted partner for safe, reliable, and comfortable rides in Bengaluru. Available 24/7 for local and outstation travel.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="hover-desktop-only:text-primary transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover-desktop-only:text-primary transition-colors">Services</Link></li>
              <li><Link to="/fleet" className="hover-desktop-only:text-primary transition-colors">Our Fleet</Link></li>
              <li><Link to="/contact" className="hover-desktop-only:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="text-center sm:text-left">
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-xs">Services</h4>
            <ul className="space-y-3">
              <li className="text-sm">Local City Rides</li>
              <li className="text-sm">Airport Transfers</li>
              <li className="text-sm">Outstation Trips</li>
              <li className="text-sm">Corporate Travels</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center sm:text-left">
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-xs">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <MapPin className="text-primary mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" size={20} />
                <span className="text-sm leading-relaxed">123, MG Road, Shivaji Nagar, Bengaluru, Karnataka 560001</span>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <Phone className="text-primary mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" size={20} />
                <a href="tel:+919876543210" className="text-sm hover-desktop-only:text-primary transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <Mail className="text-primary mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" size={20} />
                <a href="mailto:info@taxihousebengaluru.in" className="text-sm hover-desktop-only:text-primary transition-colors">info@taxihousebengaluru.in</a>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start group">
                <Clock className="text-primary mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" size={20} />
                <span className="text-sm">24/7 Support Available</span>
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
