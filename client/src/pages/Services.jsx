import React, { useEffect } from 'react';
import { services } from '../data/services';
import ServiceCard from '../components/ServiceCard';
import CTASection from '../components/CTASection';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const Services = () => {
  const isHoverable = useHoverQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Hero Banner for Services */}
      <div className="bg-secondary text-white py-10 sm:py-24 relative overflow-hidden text-center px-4">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=2070&auto=format&fit=crop" 
            alt="City view" 
            className="w-full h-full object-cover"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        >
          <h1 className="text-lg sm:text-4xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 tracking-tight">Our Premium Services</h1>
          <p className="text-[10px] sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From quick local airport drops to luxurious outstation road trips, Taxi House Bengaluru is your ultimate travel partner in Karnataka.
          </p>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-24 flex-grow">
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10"
        >
          {services.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}


        </motion.div>
      </div>

      <CTASection />
    </motion.div>
  );
};

export default Services;
