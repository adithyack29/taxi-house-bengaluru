import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 py-6 px-4 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand - Left Aligned on Desktop */}
        <div className="flex flex-col items-center sm:items-start mb-4 sm:mb-8">
          <a href="/" className="inline-block p-1 bg-white rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="Taxi House Bengaluru" className="h-8 sm:h-12 w-auto object-contain" />
          </a>
          <p className="text-[10px] sm:text-sm font-medium text-white/50 mt-1 sm:mt-2 tracking-wide">Reliable 24/7 Bengaluru Cab Service</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-12">
          
          {/* Quick Links */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white/40 mb-1.5 sm:mb-6 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-4 text-xs sm:text-lg font-medium">
              <li><Link to="/" className="text-white/80 hover:text-primary transition-all duration-300">Home</Link></li>
              <li><Link to="/services" className="text-white/80 hover:text-primary transition-all duration-300">Services</Link></li>
              <li><Link to="/fleet" className="text-white/80 hover:text-primary transition-all duration-300">Fleet</Link></li>
              <li><Link to="/contact" className="text-white/80 hover:text-primary transition-all duration-300">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1 text-center sm:text-left">
            <h4 className="text-[10px] font-bold text-white/40 mb-1.5 sm:mb-6 uppercase tracking-wider">Services</h4>
            <ul className="space-y-1 sm:space-y-4 text-xs sm:text-lg font-medium text-white/80">
              <li className="hover:text-primary transition-colors cursor-default">Local</li>
              <li className="hover:text-primary transition-colors cursor-default">Airport</li>
              <li className="hover:text-primary transition-colors cursor-default">Outstation</li>
              <li className="hover:text-primary transition-colors cursor-default">Corporate</li>
            </ul>
          </div>

          {/* Contact Details - Vertical Stack */}
          <div className="col-span-2 md:col-span-2 mt-2 sm:mt-0 border-t border-gray-800 pt-6 sm:pt-0 sm:border-0">
            <h4 className="text-[10px] sm:text-sm font-bold text-white/40 mb-3 text-center sm:text-left">Get in Touch</h4>
            <div className="flex flex-col space-y-4 items-center sm:items-start justify-center sm:justify-start">
              <div className="flex items-center space-x-3 sm:space-x-4 group">
                <Phone className="text-primary group-hover:scale-110 transition-transform" size={16} sm:size={20} />
                <div className="flex flex-col">
                  <a href="tel:+917795965640" className="text-base sm:text-xl font-bold text-white/90 hover:text-primary transition-all duration-300">+91 77959 65640</a>
                  <a href="tel:+918660484650" className="text-base sm:text-xl font-bold text-white/90 hover:text-primary transition-all duration-300">+91 86604 84650</a>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 group">
                <Mail className="text-primary group-hover:scale-110 transition-transform" size={16} sm:size={20} />
                <a href="mailto:taxihousebengaluru@gmail.com" className="text-xs sm:text-xl font-medium text-white/80 hover:text-primary transition-all duration-300">taxihousebengaluru@gmail.com</a>
              </div>
              <div className="flex items-start space-x-4 group">
                <MapPin className="text-primary group-hover:scale-110 transition-transform mt-1" size={20} />
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
