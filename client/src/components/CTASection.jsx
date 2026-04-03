import React from 'react';
import { PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import WhatsAppIcon from './WhatsAppIcon';

const CTASection = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="bg-primary text-secondary py-4 sm:py-8 lg:py-12 relative overflow-hidden">
      
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
        <h2 className="text-lg sm:text-3xl font-extrabold mb-1 sm:mb-4 leading-tight">
          Ready to book your next ride?
        </h2>
        <p className="text-[10px] sm:text-lg mb-3 sm:mb-8 font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
          Get transparent pricing, professional drivers, and 24/7 support throughout Bengaluru.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-6">
          <motion.a 
            href="tel:+917795965640" 
            whileHover={isHoverable ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center space-x-3 w-full sm:w-auto bg-secondary text-white px-6 py-2.5 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all shadow-lg"
          >
            <PhoneCall size={16} className="text-primary" />
            <span>Call Now: +91 77959 65640</span>
          </motion.a>

          <motion.a 
            href="https://wa.me/917795965640"
            target="_blank"
            rel="noopener noreferrer" 
            whileHover={isHoverable ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center space-x-3 w-full sm:w-auto bg-[#25D366] text-white px-6 py-2.5 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all shadow-lg"
          >
            <WhatsAppIcon size={18} />
            <span>Book via WhatsApp</span>
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
