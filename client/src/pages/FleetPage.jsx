import React, { useEffect } from 'react';
import Fleet from '../components/Fleet';
import CTASection from '../components/CTASection';
import { motion } from 'framer-motion';

const FleetPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col min-h-screen"
    >
      {/* Hero Banner for Fleet */}
      <div className="bg-secondary text-white py-24 relative overflow-hidden">
         <div className="absolute inset-0 z-0 opacity-20 bg-primary mix-blend-multiply"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        >
          <h1 className="text-5xl font-extrabold mb-6">Explore Our Fleet</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A diverse range of well-maintained vehicles for all your travel needs. Budget-friendly hatchbacks, comfortable sedans, and spacious SUVs.
          </p>
        </motion.div>
      </div>

      <div className="flex-grow">
        <Fleet />
      </div>

      <CTASection />
    </motion.div>
  );
};

export default FleetPage;
