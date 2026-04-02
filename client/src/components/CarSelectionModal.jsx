import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, CheckCircle2, ChevronRight, Info, Award } from 'lucide-react';
import { cars } from '../data/cars';

const CarSelectionModal = ({ isOpen, onClose, selectedCarName, onSelect }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validCars = cars.filter(car => car.name && car.image);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-secondary/80 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center space-x-2 text-primary font-bold tracking-tight text-xs mb-1">
                <Award size={14} />
                <span>Premium Fleet Selection</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-secondary tracking-tight">
                Select Your <span className="text-primary italic">Vehicle</span>
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-2xl transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validCars.map((car) => {
                const isSelected = car.name === selectedCarName;
                return (
                  <motion.div
                    key={car.id}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      onSelect(car);
                      onClose();
                    }}
                    className={`relative group cursor-pointer rounded-2xl border-2 transition-all p-3 flex gap-4 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                        : 'border-gray-100 bg-white hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    {/* Vehicle Image */}
                    <div className="w-24 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-100 relative">
                      <img 
                        src={car.image} 
                        alt={car.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                        <div className="bg-white/90 backdrop-blur-sm text-[8px] font-bold px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">Verified</div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-secondary text-sm sm:text-base leading-tight truncate mr-2">
                            {car.name}
                          </h4>
                          {isSelected && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded tracking-tighter">
                            <Users size={10} className="mr-1" />
                            {car.seats} Pax
                          </div>
                          <div className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 shadow-sm text-center">
                            Ac
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 leading-none mb-1 opacity-70">Fare Starts At</p>
                          <p className="text-xl font-black text-secondary leading-none tracking-tighter">
                            ₹{car.pricePerKm}<span className="text-[10px] font-bold text-gray-400">/KM</span>
                          </p>
                        </div>
                        <div className={`p-1.5 rounded-lg transition-all ${
                          isSelected 
                            ? 'bg-primary text-secondary shadow-sm ring-1 ring-primary/20' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-primary/20 group-hover:text-secondary group-hover:scale-110'
                        }`}>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Quick Info Indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Info size={12} className="text-gray-300" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-gray-50/80 border-t border-gray-100 text-center">
            <p className="text-[9px] font-bold text-gray-400 italic">
              *All vehicle types are subject to city-level availability and distance constraints
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CarSelectionModal;

