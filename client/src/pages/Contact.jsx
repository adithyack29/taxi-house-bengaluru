import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import { motion } from 'framer-motion';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col min-h-screen bg-background pb-20"
    >
      
      {/* Hero Banner for Contact */}
      <div className="bg-secondary text-white py-16 sm:py-24 relative overflow-hidden text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black mb-6"
        >
          Contact Us
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
        >
          Need help with your booking? Have special requirements? Get in touch with our support team available 24/7.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 w-full relative z-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          
          {/* Contact Info Sheet */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <h2 className="text-3xl font-extrabold text-secondary mb-8">Get In Touch</h2>
              
              <ul className="space-y-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/20 p-3 sm:p-4 rounded-xl text-primary inline-flex">
                    <MapPin size={24} />
                  </div>
                  <div className="ml-4 sm:ml-6">
                    <h4 className="text-xl font-bold text-secondary mb-1">Our Office</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Shop No. 1, 2nd Floor, Survey No. 2,<br />
                      Near VNR Fuelling Station (Indian Oil Dealers),<br />
                      Krishnanagar, Yadavanahalli,<br />
                      Attibele Hobli, Anekal Taluk,<br />
                      Bengaluru - 562107
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-green-500/20 p-3 sm:p-4 rounded-xl text-green-600 inline-flex">
                    <Phone size={24} />
                  </div>
                  <div className="ml-4 sm:ml-6">
                    <h4 className="text-xl font-bold text-secondary mb-1">Call Us</h4>
                    <div className="flex flex-col space-y-1">
                      <a href="tel:+917795965640" className="text-gray-600 text-lg hover-desktop-only:text-primary transition">
                        +91 77959 65640
                      </a>
                      <a href="tel:+918660484650" className="text-gray-600 text-lg hover-desktop-only:text-primary transition">
                        +91 86604 84650
                      </a>
                    </div>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-500/20 p-3 sm:p-4 rounded-xl text-blue-600 inline-flex">
                    <Mail size={24} />
                  </div>
                  <div className="ml-4 sm:ml-6">
                    <h4 className="text-xl font-bold text-secondary mb-1">Email Support</h4>
                    <a href="mailto:taxihousebengaluru@gmail.com" className="text-gray-600 text-lg hover-desktop-only:text-primary transition">
                      taxihousebengaluru@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-yellow-500/20 p-3 sm:p-4 rounded-xl text-yellow-600 inline-flex">
                    <Clock size={24} />
                  </div>
                  <div className="ml-4 sm:ml-6">
                    <h4 className="text-xl font-bold text-secondary mb-1">Working Hours</h4>
                    <p className="text-gray-600 text-lg">24 Hours, 7 Days a Week</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Quick Booking Form placed as side by side */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:mt-0 mt-8"
          >
            <BookingForm />
          </motion.div>

        </div>
      </div>
      
    </motion.div>
  );
};

export default Contact;
