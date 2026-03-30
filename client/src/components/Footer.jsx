import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Taxi<span className="text-primary">House</span>
            </h3>
            <p className="text-sm">
              Your trusted partner for safe, reliable, and comfortable rides in Bengaluru. Available 24/7 for local and outstation travel.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover-desktop-only:text-primary transition">Home</Link></li>
              <li><Link to="/services" className="hover-desktop-only:text-primary transition">Services</Link></li>
              <li><Link to="/fleet" className="hover-desktop-only:text-primary transition">Our Fleet</Link></li>
              <li><Link to="/contact" className="hover-desktop-only:text-primary transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2">
              <li className="text-sm">Local City Rides</li>
              <li className="text-sm">Airport Transfers</li>
              <li className="text-sm">Outstation Trips</li>
              <li className="text-sm">Corporate Travels</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="text-primary mr-3 flex-shrink-0" size={20} />
                <span className="text-sm">123, MG Road, Shivaji Nagar, Bengaluru, Karnataka 560001</span>
              </li>
              <li className="flex items-center">
                <Phone className="text-primary mr-3 flex-shrink-0" size={20} />
                <a href="tel:+919876543210" className="text-sm hover-desktop-only:text-primary transition">+91 98765 43210</a>
              </li>
              <li className="flex items-center">
                <Mail className="text-primary mr-3 flex-shrink-0" size={20} />
                <a href="mailto:info@taxihousebengaluru.in" className="text-sm hover-desktop-only:text-primary transition">info@taxihousebengaluru.in</a>
              </li>
              <li className="flex items-center">
                <Clock className="text-primary mr-3 flex-shrink-0" size={20} />
                <span className="text-sm">24/7 Support</span>
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
