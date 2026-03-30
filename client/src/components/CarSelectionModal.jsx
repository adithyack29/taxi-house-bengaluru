import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, CheckCircle, Car } from 'lucide-react';
import { cars } from '../data/cars';

const CarSelectionModal = ({ isOpen, onClose, selectedCarName, onSelect }) => {
  if (!isOpen) return null;

  // Filter out any empty car objects if they exist in the data
  const validCars = cars.filter(car => car.name && car.image);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 lg:p-8">
        {/* Backdrop click to close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-5xl h-fit max-h-[90vh] flex flex-col relative z-10"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center space-x-2 text-primary font-bold tracking-wider uppercase text-xs mb-1">
                <Car size={14} />
                <span>Premium Fleet</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary">Choose Your Vehicle</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-gray-400 hover:text-secondary rounded-2xl hover:bg-gray-100 transition-all"
            >
              <X size={28} />
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-4">
              {validCars.map((car) => {
                const isSelected = car.name === selectedCarName;
                
                return (
                  <motion.div
                    key={car.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelect(car);
                      onClose();
                    }}
                    className={`relative flex flex-col sm:flex-row group cursor-pointer rounded-3xl overflow-hidden border-2 transition-all p-4 sm:p-5 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-40 h-32 sm:h-auto rounded-2xl overflow-hidden mb-4 sm:mb-0 sm:mr-6 shrink-0 relative bg-gray-200">
                      <img 
                        src={car.image} 
                        alt={car.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-secondary/80 backdrop-blur-md text-primary font-bold text-xs px-2 py-1 rounded-lg">
                        ₹{car.pricePerKm}/km
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-secondary">{car.name}</h4>
                        {isSelected && (
                          <div className="bg-primary text-secondary p-1 rounded-full">
                            <CheckCircle size={16} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <Users size={16} className="mr-1.5" />
                        <span className="font-medium">{car.seats} Passenger Seats</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {car.features.map((feature, fIdx) => (
                          <span 
                            key={fIdx} 
                            className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer - info only */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
            <p className="text-xs text-gray-400 font-medium italic text-center">
              All our vehicles are sanitized and serviced regularly for your safety.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CarSelectionModal;
