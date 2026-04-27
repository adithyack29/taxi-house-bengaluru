import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import { motion } from 'framer-motion';

const Home = () => {
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
      <Hero />
      
      {/* Featured Posters Section */}
      <section className="py-12 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Luxury Rides */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src="/luxury-rides.jpg" 
                alt="Luxury Rides - Taxi House Bengaluru" 
                className="relative w-full h-auto rounded-[2rem] shadow-xl border border-gray-100 transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </motion.div>

            {/* Travel Guidelines */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src="/travel-guidelines.jpg" 
                alt="Travel Guidelines - Taxi House Bengaluru" 
                className="relative w-full h-auto rounded-[2rem] shadow-xl border border-gray-100 transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <Testimonials />
      <CTASection />
    </motion.div>
  );
};

export default Home;
