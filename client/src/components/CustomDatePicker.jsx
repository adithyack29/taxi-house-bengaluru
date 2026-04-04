import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const CustomDatePicker = ({ 
  value, 
  onChange, 
  label, 
  name, 
  required = false, 
  disabled = false,
  align = "center", // "left", "right", "center"
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef(null);

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

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (day) => {
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    dateToCheck.setHours(0, 0, 0, 0);

    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (dateToCheck < min) return true;
    }

    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      if (dateToCheck > max) return true;
    }

    return false;
  };

  const handleDateSelect = (day) => {
    if (isDateDisabled(day)) return;
    
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format as YYYY-MM-DD for standard input compatibility
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${d}`;
    
    onChange({ target: { name, value: formattedDate } });
    setIsOpen(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!value) return false;
    const [year, month, d] = value.split('-').map(Number);
    return (
      day === d &&
      currentMonth.getMonth() === (month - 1) &&
      currentMonth.getFullYear() === year
    );
  };

  const renderDays = () => {
    const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const startDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const days = [];

    // Empty cells for alignment
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="h-6 w-6" />);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const active = isSelected(day);
      const today = isToday(day);
      const disabledDay = isDateDisabled(day);
      
      days.push(
        <button
          key={day}
          type="button"
          disabled={disabledDay}
          onClick={() => handleDateSelect(day)}
          className={`h-6 w-6 flex items-center justify-center rounded-md text-[10px] font-bold transition-all relative ${
            active 
              ? 'bg-primary text-secondary' 
              : disabledDay
                ? 'text-gray-300/50 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
          {today && !active && !disabledDay && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
          )}
        </button>
      );
    }

    // Always fill to 42 cells (6 rows) to keep height consistent
    const remainingCells = 42 - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-6 w-6" />);
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const displayValue = value ? formatDate(value) : 'Select Date';

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
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
        <span className={value ? 'text-secondary' : 'text-gray-400'}>{displayValue}</span>
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
              className={`fixed z-[200] top-1/2 -translate-y-1/2 p-3 bg-white rounded-xl shadow-2xl border border-gray-100 w-[280px] ${
                align === 'left' ? 'left-[10%] sm:left-[20%]' : 
                align === 'right' ? 'right-[15%] sm:right-[25%]' : 
                'left-1/2 -translate-x-1/2'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <button onClick={handlePrevMonth} type="button" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft size={12} />
                </button>
                <h3 className="font-black text-secondary text-[10px] uppercase tracking-wider">
                  {monthNames[currentMonth.getMonth()].substring(0, 3)} {currentMonth.getFullYear()}
                </h3>
                <button onClick={handleNextMonth} type="button" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight size={12} />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 mb-0.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="h-5 flex items-center justify-center text-[8px] font-black text-gray-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderDays()}
              </div>

              {/* Footer */}
              <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center text-[9px] font-black uppercase text-gray-400">
                <button 
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    if (!isDateDisabled(today.getDate())) {
                      handleDateSelect(today.getDate());
                      setCurrentMonth(today);
                    }
                  }}
                  className={`transition-colors ${isDateDisabled(new Date().getDate()) ? 'text-gray-300 cursor-not-allowed' : 'hover:text-primary'}`}
                >
                  Today
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="hover:text-secondary transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDatePicker;
