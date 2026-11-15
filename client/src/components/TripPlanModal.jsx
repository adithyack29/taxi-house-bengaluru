import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Moon, Sun, ArrowRight, ShieldAlert, FileText, ShieldCheck } from 'lucide-react';
import { generateTripSchedule } from '../utils/tripSchedule';

const TripPlanModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  strategy, 
  schedule: manualSchedule,
  tripType: manualTripType,
  estimatedDistance: manualDistance
}) => {
  if (!isOpen) return null;

  const displayTripType = manualTripType || formData?.tripType;
  const displayDistance = manualDistance || formData?.estimatedDistance || 0;
  const realDistance = displayTripType === 'two-way' ? displayDistance * 2 : displayDistance;

  const schedule = manualSchedule || (() => {
    if (!formData || !formData.estimatedDistance || !formData.routeLegs) return [];
    return generateTripSchedule(
      formData.date, 
      formData.time, 
      formData.returnDate, 
      formData.returnTime, 
      formData.routeLegs, 
      strategy, 
      formData.tripType
    );
  })();



  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-xl font-black text-secondary">Trip Plan Timeline</h3>
              <p className="text-xs font-bold text-gray-500 mt-1">
                {strategy === 'day-only' ? 'Standard (Day Only) Driving' : 'Expedited (Night Driving)'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 pb-4">
              {schedule.map((event, idx) => {
                let Icon = MapPin;
                let bgColor = 'bg-primary';
                if (event.type === 'halt') { Icon = Moon; bgColor = 'bg-blue-500'; }
                if (event.type === 'resume' || event.type === 'progress') { Icon = Sun; bgColor = 'bg-orange-400'; }
                if (event.type === 'leg_end') { Icon = ArrowRight; bgColor = 'bg-green-500'; }

                return (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full ${bgColor} ring-4 ring-white flex items-center justify-center text-white`}>
                      <Icon size={10} strokeWidth={3} />
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/50">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h4 className="text-sm font-black text-secondary leading-snug">{event.title}</h4>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-primary whitespace-nowrap">{formatTime(event.time)}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap mt-0.5">{formatDate(event.time)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{event.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 border-t border-slate-200 bg-slate-50">
            <h4 className="text-xs font-black text-secondary tracking-wider uppercase mb-3 flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              Fare Rules & Allowances
            </h4>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <Sun size={14} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-secondary">Driver Duty Hours Window (6:00 AM – 10:00 PM)</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Standard duty hours are 6:00 AM to 10:00 PM. If pickup is scheduled before 6:00 AM or after 10:00 PM, or if drop occurs after 10:00 PM or before 6:00 AM, +1 extra day Driver Bata is added per occurrence.</p>
                </div>
              </div>

              {strategy === 'expedited' ? (
                <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 shadow-sm">
                  <Moon size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-blue-900">Night Allowance Details</p>
                    <p className="text-[9px] sm:text-[10px] text-blue-700 font-medium">As you've selected an expedited journey, appropriate driver Night Allowances will be added to the final quote.</p>
                  </div>
                </div>
              ) : schedule.some(s => s.type === 'halt' && s.desc.includes('10:00 PM')) ? (
                <div className="flex items-start gap-2 bg-green-50/80 p-3 rounded-lg border border-green-100 shadow-sm">
                  <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-green-900">Night Allowance Exempt</p>
                    <p className="text-[9px] sm:text-[10px] text-green-700 font-medium">You selected Day-Only standards. You will NOT be charged any specific night fees for overnight halts!</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <Clock size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-secondary">Night Driving Charge</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Driving pushes after 10:00 PM to finish a trip incur a ₹150/hour driver night charge.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <ShieldAlert size={14} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-secondary">Exclusions</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">State Taxes, Toll Plazas, and Parking are handled out-of-pocket as per actuals.</p>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center font-bold">
              Total Route: {displayTripType === 'two-way' ? 'ROUND TRIP' : 'ONE WAY'} | ~{realDistance.toFixed(0)} KM
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TripPlanModal;
