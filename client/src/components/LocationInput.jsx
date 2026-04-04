import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Map, Crosshair } from 'lucide-react';
import MapModal from './MapModal';

const LocationInput = ({ icon: Icon, placeholder, value, onChange, name, iconColorClass = "text-gray-400", showCurrentLocation = true, disabled = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search logic for Nominatim (restricted to India)
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    // Don't search if the menu is explicitly closed
    if (!isOpen) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&countrycodes=in&format=json&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce

  }, [value, isOpen]);

  const handleSelect = (address) => {
    onChange({ target: { name, value: address } });
    setIsOpen(false);
  };


  const handleCurrentLocation = () => {
    setIsOpen(false);
    onChange({ target: { name, value: 'Locating...' } }); 
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await res.json();
            onChange({ target: { name, value: data.display_name || `${latitude}, ${longitude}` } });
          } catch (error) {
            onChange({ target: { name, value: "Error fetching address." } });
          }
        }, 
        (error) => {
          let msg = "Location unavailable";
          if (error.code === 1) msg = "Permission Denied. Please reset location permissions in your browser.";
          else if (error.code === 2) msg = "Position Unavailable.";
          else if (error.code === 3) msg = "Timeout. Please try again.";
          
          onChange({ target: { name, value: msg } });
          console.error("Geolocation Error:", error);
        }
      );
    } else {
      onChange({ target: { name, value: "Geolocation not supported" } });
    }
  };


  return (
    <div className="relative" ref={wrapperRef}>
      <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconColorClass}`} size={18} />
      <input 
        type="text" 
        name={name} 
        placeholder={placeholder} 
        required 
        value={value} 
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        className={`w-full pl-9 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm sm:text-base ${className}`}
        disabled={disabled}
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-72 overflow-y-auto">
          <ul className="py-2">
            
            {/* Action Item: Current Location */}
            {showCurrentLocation && (
              <li 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 text-secondary font-medium border-b border-gray-50"
                onClick={handleCurrentLocation}
              >
                <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
                  <Crosshair size={16} />
                </div>
                <span>Your current location</span>
              </li>
            )}


            {/* Action Item: Choose on Map */}
            <li 
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 text-secondary font-medium border-b border-gray-50"
              onClick={() => { setIsOpen(false); setIsMapOpen(true); }}
            >
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                <Map size={16} />
              </div>
              <span>Choose on Map</span>
            </li>

            {/* Autocomplete Suggestions */}
            {loading && value && value.length >= 3 && (
              <li className="px-4 py-3 text-sm text-gray-500 text-center animate-pulse">
                Searching India...
              </li>
            )}
            
            {!loading && suggestions.map((s, idx) => (
              <li 
                key={idx}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3 border-b border-gray-50 last:border-0"
                onClick={() => handleSelect(s.display_name)}
              >
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 leading-snug">{s.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Map Modal */}
      <MapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)}
        onConfirm={(loc) => handleSelect(loc.address)}
      />
    </div>
  );
};

export default LocationInput;
