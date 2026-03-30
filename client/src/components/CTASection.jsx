import React from 'react';
import { PhoneCall, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const CTASection = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="bg-primary text-secondary py-20 relative overflow-hidden">
      
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
      >
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
          Ready to book your next ride?
        </h2>
        <p className="text-xl sm:text-2xl mb-12 font-medium opacity-90 max-w-2xl mx-auto">
          Get transparent pricing, professional drivers, and 24/7 support throughout Bengaluru.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <motion.a 
            href="tel:+919876543210" 
            whileHover={isHoverable ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center space-x-3 w-full sm:w-auto bg-secondary text-white px-8 py-4 rounded-xl font-bold text-lg transition-shadow duration-300 hover-desktop-only:shadow-2xl shadow-lg ring-2 ring-transparent hover-desktop-only:ring-white/20"
          >
            <PhoneCall size={24} className="text-primary" />
            <span>Call Now: +91 98765 43210</span>
          </motion.a>

          <motion.a 
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer" 
            whileHover={isHoverable ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center space-x-3 w-full sm:w-auto bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-shadow duration-300 hover-desktop-only:shadow-2xl shadow-lg"
          >
            <MessageCircle size={24} />
            <span>Book via WhatsApp</span>
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
