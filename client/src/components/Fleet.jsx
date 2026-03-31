import React from 'react';
import CarCard from './CarCard';
import { cars } from '../data/cars';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const Fleet = ({ limit }) => {
  const displayCars = limit ? cars.slice(0, limit) : cars;

  return (
    <section className="py-10 sm:py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-bold tracking-wider uppercase text-sm">Our Vehicles</span>
          <h2 className="text-4xl font-extrabold text-secondary mt-2 mb-4">Choose Your Ride</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            From compact hatchbacks for quick city runs to luxury sedans for business travel, we have the perfect car for every journey.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`grid grid-cols-1 md:grid-cols-2 ${limit === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 sm:gap-8`}
        >
          {displayCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </motion.div>

        {limit && (
          <div className="text-center mt-12">
            <Link 
              to="/fleet" 
              className="inline-flex items-center text-secondary font-bold hover-desktop-only:text-primary transition-colors group text-lg"
            >
              View All Fleet 
              <ArrowRight className="ml-2 group-hover-desktop-only:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

      </div>
    </section>
  );
};

export default Fleet;
