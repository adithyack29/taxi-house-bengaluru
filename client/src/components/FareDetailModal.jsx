import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calculator, AlertCircle, CheckCircle, X, Clock } from 'lucide-react';

const FareDetailModal = ({ 
  isOpen, 
  onClose, 
  data, 
  car 
}) => {
  if (!isOpen || !data) return null;

  const {
    roadDistance,
    effectiveKm,
    pricePerKm,
    baseFare,
    totalDayBata,
    totalNightBata,
    bataDays,
    totalNights,
    nightBata,
    minKm,
    petFee,
    extraBataDays = 0,
    extraBataAmount = 0,
    extraBataReasons = []
  } = data;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-xl font-black text-secondary ">Fare Estimation <span className="text-primary  text-xs italic ml-2">Details</span></h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Pricing Snapshot</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-8 space-y-6 overflow-y-auto">
            {/* Distance Section */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-secondary/40 flex items-center gap-2 uppercase tracking-widest">
                <MapPin size={12} className="text-primary" /> Route & Distance
              </p>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Calculated Road Distance</span>
                  <span className="font-black text-secondary">{Number(roadDistance)?.toFixed(1)} KM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Minimum Kilometers</span>
                  <span className="font-black text-secondary">{minKm || 300} KM</span>
                </div>
                <div className="pt-2 border-t border-gray-50 flex justify-between text-sm">
                  <span className="text-secondary font-black">Effective KM used</span>
                  <span className="text-primary font-black">{effectiveKm % 1 === 0 ? effectiveKm : Number(effectiveKm).toFixed(1)} KM</span>
                </div>
              </div>
            </div>

            {/* Calculations Section */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-secondary/40 flex items-center gap-2 uppercase tracking-widest">
                <Calculator size={12} className="text-primary" /> Fare Mathematics
              </p>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Base Fare</span>
                    <span>₹{baseFare?.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">Logic: {effectiveKm % 1 === 0 ? effectiveKm : Number(effectiveKm).toFixed(1)} KM × ₹{pricePerKm}/KM</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-bold text-secondary">
                    <span>Driver Bata (Day)</span>
                    <span>₹{totalDayBata?.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    Logic: {Math.round(bataDays || 0)} Days × ₹{car?.driver_bata || 300}/Day
                    {extraBataDays > 0 && ` (${Math.round((bataDays || 0) - extraBataDays)} base + ${extraBataDays} extra day Bata)`}
                  </p>
                  {extraBataDays > 0 && (
                    <div className="mt-1.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 font-bold space-y-0.5">
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <Clock size={12} className="shrink-0" />
                        <span>Duty Hours Window (6:00 AM – 10:00 PM) Exceeded:</span>
                      </div>
                      <p className="text-[9px] text-amber-800 font-medium pl-4">
                        +{extraBataDays} Day Driver Bata (₹{(extraBataAmount || extraBataDays * (car?.driver_bata || 300)).toLocaleString()}) added: {extraBataReasons?.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {totalNightBata > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm font-bold text-secondary">
                      <span>Night Allowance</span>
                      <span>₹{totalNightBata?.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic">Logic: {Math.round(totalNights || 0)} Nights × ₹{nightBata}/Night</p>
                  </div>
                )}

                {petFee > 0 && (
                  <div className="space-y-1 pt-2 border-t border-gray-50">
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Pet Accompanied Fee</span>
                      <span>₹{petFee?.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic">Standard pet cleaning & handling fee</p>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
              <AlertCircle size={20} className="text-orange-500 shrink-0" />
              <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                <strong>Standard Rules:</strong> This estimation is based on the booking duration and route data. Tolls and permits are extra as per actuals. Actual fare may vary based on actual distance and nights.
              </p>
            </div>
          </div>
          
          <div className="p-6 bg-slate-900 border-t border-white/5 mt-auto">
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Total Estimated Fare</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded-md border border-primary/20">ALL INCLUSIVE</span>
                  <span className="text-[10px] text-gray-500 font-bold italic">(Excl. Tolls/Entry)</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary text-secondary text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">15% OFF</span>
                  <span className="relative text-xs font-black text-slate-400/70">
                    ₹{Math.round(((data.totalFare || (Number(baseFare||0) + Number(totalDayBata||0) + Number(totalNightBata||0) + Number(petFee||0))) * 1.15) / 10) * 10}
                    <span className="absolute inset-x-0 top-1/2 h-[1px] bg-red-500 -rotate-[12deg] origin-center sm:h-[1.5px]"></span>
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-primary  ">₹{(data.totalFare || (Number(baseFare||0) + Number(totalDayBata||0) + Number(totalNightBata||0) + Number(petFee||0))).toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-full bg-white text-secondary py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} className="text-green-500" />
              <span>Acknowledge Estimation</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FareDetailModal;
