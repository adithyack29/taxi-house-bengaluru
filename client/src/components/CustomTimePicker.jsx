import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock as ClockIcon } from 'lucide-react';

const CustomTimePicker = ({ 
  value, 
  onChange, 
  label, 
  name, 
  required = false, 
  disabled = false,
  align = "center", // "left", "right", "center"
  isToday = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for accuracy
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse current value (HH:MM in 24h format)
  const parseValue = () => {
    if (!value) return { hour: '10', minute: '00', ampm: 'AM' };
    const [h, m] = value.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return { 
      hour: hour.toString().padStart(2, '0'), 
      minute: m, 
      ampm 
    };
  };

  const { hour: selectedHour, minute: selectedMinute, ampm: selectedAMPM } = parseValue();

  const isTimeDisabled = (type, val) => {
    if (!isToday) return false;

    const now = currentTime;
    const currentHour24 = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Add 30 min buffer for booking
    const bufferMinutes = 30;
    const limitTotalMinutes = (currentHour24 * 60) + currentMinute + bufferMinutes;

    let { hour, minute, ampm } = parseValue();
    if (type === 'hour') hour = val;
    if (type === 'minute') minute = val;
    if (type === 'ampm') ampm = val;

    let h = parseInt(hour);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const selectionTotalMinutes = (h * 60) + parseInt(minute);

    // If we are checking HOURS, we can broadly disable if the entire hour is in the past
    // But it's safer to check the combination
    if (type === 'hour') {
      // An hour is disabled if even its latest minute (45) is in the past + buffer
      if ((h * 60) + 45 < limitTotalMinutes) return true;
      return false;
    }

    if (type === 'ampm') {
      if (val === 'AM' && currentHour24 >= 12) return true;
      return false;
    }

    return selectionTotalMinutes < limitTotalMinutes;
  };

  const handleSelect = (type, val) => {
    if (isTimeDisabled(type, val)) return;

    let { hour, minute, ampm } = parseValue();
    if (type === 'hour') hour = val;
    if (type === 'minute') minute = val;
    if (type === 'ampm') ampm = val;

    // Convert back to 24h format
    let h = parseInt(hour);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    const formattedValue = `${h.toString().padStart(2, '0')}:${minute}`;
    onChange({ target: { name, value: formattedValue } });
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const displayTime = value ? `${selectedHour}:${selectedMinute} ${selectedAMPM}` : 'Select Time';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center space-x-3 pl-10 pr-4 py-4 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 transition text-base font-medium text-left ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-primary/30'
        }`}
      >
        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
        <span className={value ? 'text-secondary font-bold' : 'text-gray-400'}>
          {displayTime}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay for focus */}
            <div 
              className="fixed inset-0 z-[150] bg-black/5" 
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed z-[200] top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-xl shadow-2xl border border-gray-100 w-[320px] ${
                align === 'left' ? 'left-[15%] sm:left-[25%]' : 
                align === 'right' ? 'right-[15%] sm:right-[25%]' : 
                'left-1/2 -translate-x-1/2'
              }`}
            >
              <div className="flex gap-2 divide-x divide-gray-50">
                {/* Hours Column */}
                <div className="flex-[3] pr-1">
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1">Hour</p>
                  <div className="grid grid-cols-6 gap-1">
                    {hours.map(h => {
                      const disabledH = isTimeDisabled('hour', h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={disabledH}
                          onClick={() => handleSelect('hour', h)}
                          className={`h-7 w-full flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                            selectedHour === h 
                              ? 'bg-primary text-secondary' 
                              : disabledH
                                ? 'text-gray-300/50 cursor-not-allowed'
                                : 'hover:bg-gray-100/50 text-gray-600'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1 pl-2">
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1">Min</p>
                  <div className="grid grid-cols-1 gap-1">
                    {minutes.map(m => {
                      const disabledM = isTimeDisabled('minute', m);
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={disabledM}
                          onClick={() => handleSelect('minute', m)}
                          className={`h-6 w-full flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                            selectedMinute === m 
                              ? 'bg-primary text-secondary' 
                              : disabledM
                                ? 'text-gray-300/50 cursor-not-allowed'
                                : 'hover:bg-gray-100/50 text-gray-600'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AM/PM Column */}
                <div className="flex-1 pl-2 flex flex-col justify-end pb-1.5 overflow-hidden">
                  <div className="flex flex-col gap-1 bg-gray-50/50 p-1 rounded-lg">
                    {['AM', 'PM'].map(p => {
                      const disabledP = isTimeDisabled('ampm', p);
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={disabledP}
                          onClick={() => handleSelect('ampm', p)}
                          className={`h-6 w-full flex items-center justify-center rounded-md text-[9px] font-black transition-all ${
                            selectedAMPM === p 
                              ? 'bg-primary text-secondary shadow-sm' 
                              : disabledP
                                ? 'text-gray-300/40 cursor-not-allowed'
                                : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-300 italic">
                  {isToday ? '*30m buffer applied' : '*Select time to continue'}
                </p>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-black uppercase text-secondary hover:text-primary transition-colors flex items-center"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomTimePicker;
