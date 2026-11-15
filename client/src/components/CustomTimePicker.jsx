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
  isMinDate = false
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
  const parseValue = (timeStr = value) => {
    if (!timeStr) return { hour: '10', minute: '00', ampm: 'AM' };
    const [h, m] = timeStr.split(':');
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
    if (!isMinDate) return false;

    // Use exact 48 hours from current time as limit
    const limitDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const limitHour24 = limitDate.getHours();
    const limitMinute = limitDate.getMinutes();
    
    const limitTotalMinutes = (limitHour24 * 60) + limitMinute;

    // The limitTotalMinutes will be between 0 and 1439 for that specific limit date.
    // We only disable times on the minDate if they fall before this limit limitTotalMinutes.

    let { hour, minute, ampm } = parseValue();
    if (type === 'hour') hour = val;
    if (type === 'minute') minute = val;
    if (type === 'ampm') ampm = val;

    let h = parseInt(hour);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const selectionTotalMinutes = (h * 60) + parseInt(minute);

    if (type === 'hour') {
      // An hour is disabled if even its latest slot (45 mins) is in the past + buffer
      return (h * 60) + 45 < limitTotalMinutes;
    }

    if (type === 'ampm') {
      // AM is disabled if it's currently 11:30 AM (12 PM) or later
      if (val === 'AM') {
        return limitTotalMinutes >= 720; // 12:00 PM is 720 mins
      }
      return false; 
    }

    // For minute selection, we check the specific time
    return selectionTotalMinutes < limitTotalMinutes;
  };

  const handleSelect = (type, val) => {
    if (isTimeDisabled(type, val)) return;

    let { hour, minute, ampm } = parseValue();
    if (type === 'hour') hour = val;
    if (type === 'minute') minute = val;
    if (type === 'ampm') ampm = val;

    // Convert to 24h format for validation
    const get24h = (h, m, p) => {
      let hh = parseInt(h);
      if (p === 'PM' && hh < 12) hh += 12;
      if (p === 'AM' && hh === 12) hh = 0;
      return (hh * 60) + parseInt(m);
    };

    // If the resulting selection is disabled (e.g. switching to an hour where 'minute' is in the past)
    // we snap the minute to the first available one in that hour.
    const limitDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const limitTotalMinutes = (limitDate.getHours() * 60) + limitDate.getMinutes();

    if (isMinDate && get24h(hour, minute, ampm) < limitTotalMinutes) {
      // Find first valid minute
      const validMinute = minutes.find(m => get24h(hour, m, ampm) >= limitTotalMinutes);
      if (validMinute) {
        minute = validMinute;
      }
    }

    // Convert back to 24h for final value
    let hFinal = parseInt(hour);
    if (ampm === 'PM' && hFinal < 12) hFinal += 12;
    if (ampm === 'AM' && hFinal === 12) hFinal = 0;
    
    const formattedValue = `${hFinal.toString().padStart(2, '0')}:${minute}`;
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
        className={`w-full flex items-center space-x-3 pl-9 pr-4 py-3 sm:py-4 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 transition text-sm sm:text-base font-medium text-left ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-primary/30'
        }`}
      >
        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
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
              className={`fixed z-[200] top-1/2 -translate-y-1/2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-50 w-[340px] ${
                align === 'left' ? 'left-[10%] sm:left-[20%]' : 
                align === 'right' ? 'right-[10%] sm:right-[20%]' : 
                'left-1/2 -translate-x-1/2'
              }`}
            >
              <div className="flex gap-4 divide-x divide-gray-50">
                {/* Hours Column */}
                <div className="flex-[3] pr-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-3 ml-1 tracking-wider">Hour</p>
                  <div className="grid grid-cols-4 gap-2">
                    {hours.map(h => {
                      const disabledH = isTimeDisabled('hour', h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={disabledH}
                          onClick={() => handleSelect('hour', h)}
                          className={`h-9 w-full flex items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                            selectedHour === h 
                              ? 'bg-primary text-secondary' 
                              : disabledH
                                ? 'text-gray-200 cursor-not-allowed opacity-90 shadow-none'
                                : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1 pl-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-3 ml-1 tracking-wider">Min</p>
                  <div className="flex flex-col gap-2">
                    {minutes.map(m => {
                      const disabledM = isTimeDisabled('minute', m);
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={disabledM}
                          onClick={() => handleSelect('minute', m)}
                          className={`h-9 w-full flex items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                            selectedMinute === m 
                              ? 'bg-primary text-secondary' 
                              : disabledM
                                ? 'text-gray-200 cursor-not-allowed opacity-90'
                                : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AM/PM Column */}
                <div className="flex-none pl-4 flex flex-col justify-center">
                  <div className="flex flex-col gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {['AM', 'PM'].map(p => {
                      const disabledP = isTimeDisabled('ampm', p);
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={disabledP}
                          onClick={() => handleSelect('ampm', p)}
                          className={`h-10 w-12 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                            selectedAMPM === p 
                              ? 'bg-primary text-secondary shadow-lg shadow-primary/20' 
                              : disabledP
                                ? 'text-gray-400/90 cursor-not-allowed opacity-90'
                                : 'text-gray-400 hover:text-secondary'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Indicator */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isMinDate ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
                  <p className="text-[10px] font-bold text-gray-400">
                    {isMinDate ? 'Booking with 48h advance notice' : 'Advance booking active'}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition-all"
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
