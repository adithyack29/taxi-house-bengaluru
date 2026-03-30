import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import ServiceCard from '../components/ServiceCard';
import Fleet from '../components/Fleet';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import { services } from '../data/services';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
      
      {/* Featured Services Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 flex flex-col items-center"
          >
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2">Our Offerings</span>
            <h2 className="text-4xl font-extrabold text-secondary mb-6">Premium Travel Solutions</h2>
            <p className="max-w-2xl text-lg text-gray-500 mb-8">
              Whether you need a quick run to the nearest metro or a comfortable SUV for a family trip, we’ve got you covered.
            </p>
          </motion.div>
          
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
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {services.slice(0, 3).map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </motion.div>

          <div className="text-center">
            <Link 
              to="/services" 
              className="inline-flex items-center text-secondary font-bold hover-desktop-only:text-primary transition-colors group text-lg"
            >
              View All Services 
              <ArrowRight className="ml-2 group-hover-desktop-only:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Fleet limit={3} />
      <WhyChooseUs />
      <Testimonials />
      <CTASection />
    </motion.div>
  );
};

export default Home;
