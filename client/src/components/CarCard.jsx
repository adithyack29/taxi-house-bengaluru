import React from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const CarCard = ({ car }) => {
  const isHoverable = useHoverQuery();

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={isHoverable ? { scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" } : {}}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col transition-shadow"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={car.image} 
          alt={car.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover-desktop-only:scale-110"
        />
        <div className="absolute top-4 right-4 bg-primary text-secondary font-bold px-3 py-1 rounded-full shadow-md">
          ₹{car.pricePerKm}/km
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-secondary mb-2">{car.name}</h3>
        
        <div className="flex items-center text-gray-500 mb-4">
          <Users size={18} className="mr-2" />
          <span>{car.seats} Seats</span>
        </div>

        <ul className="mb-6 space-y-2 flex-grow">
          {car.features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-gray-600 text-sm">
              <CheckCircle size={16} className="text-primary mr-2" />
              {feature}
            </li>
          ))}
        </ul>

        <motion.button 
          whileHover={isHoverable ? { scale: 1.05 } : {}}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 rounded-xl bg-secondary text-white font-semibold flex justify-center items-center group"
          onClick={() => {
            const el = document.getElementById('booking-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CarCard;
