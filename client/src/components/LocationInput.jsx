import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Map, Crosshair, Loader2 } from 'lucide-react';
import MapModal from './MapModal';
import { useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries = ['places'];

const LocationInput = ({ icon: Icon, placeholder, value, onChange, name, iconColorClass = "text-gray-400", showCurrentLocation = true, disabled = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue: setInputValue,
    clearSuggestions,
    init
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'in' },
      locationBias: {
        // Bias results strongly to Bengaluru and surrounding areas
        // This significantly improves typo-tolerance (fuzzy matching)
        // because Google can contextualize the spelling mistake locally.
        center: { lat: 12.9716, lng: 77.5946 },
        radius: 100000, // 100km radius
      },
    },
    debounce: 400,
    initOnMount: false, // We initialize it fully when ready becomes true based on API load context
  });

  useEffect(() => {
    if (isLoaded) {
      init();
    }
  }, [isLoaded, init]);

  // Only clear the internal hook state if the parent clears the value completely.
  // We don't sync continuously because it would override and cancel the user's active typing search.
  useEffect(() => {
    if (!value) {
      setInputValue('', false);
      clearSuggestions();
    }
  }, [value, setInputValue, clearSuggestions]);

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

  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleSelect = async (address, preCoords = null) => {
    setInputValue(address, false);
    clearSuggestions();
    setIsOpen(false);

    // If coordinates were passed (e.g. from map or current loc), use them
    if (preCoords) {
      setSelectedLocation({ address, coords: preCoords });
      onChange({ target: { name, value: address, coords: preCoords } });
      return;
    }

    // Geocode via Google Maps natively
    try {
      if (!isLoaded) throw new Error("Google not loaded");
      onChange({ target: { name, value: address, coords: null } }); // immediate UI update

      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      const coords = { lat, lng };
      setSelectedLocation({ address, coords });
      onChange({ target: { name, value: address, coords } });
    } catch (error) {
      console.error("Geocoding Error: ", error);
      onChange({ target: { name, value: address, coords: null } });
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      // Validate empty field
      if (!value) {
        onChange({ target: { name, value: '', coords: null } });
        setSelectedLocation(null);
      }
      setIsOpen(false);
    }, 200);
  };

  const handleCurrentLocation = () => {
    setIsOpen(false);
    onChange({ target: { name, value: 'Locating...', coords: null } });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Use Google Geocoder for reverse look up
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

            const address = response.results && response.results[0] ? response.results[0].formatted_address : `${latitude}, ${longitude}`;
            handleSelect(address, { lat: latitude, lng: longitude });

          } catch (error) {
            console.error("Reverse Geocode Error:", error);
            onChange({ target: { name, value: "Error fetching address.", coords: null } });
          }
        },
        (error) => {
          let msg = "Location unavailable";
          if (error.code === 1) msg = "Permission Denied. Please reset location permissions in your browser.";
          else if (error.code === 2) msg = "Position Unavailable.";
          else if (error.code === 3) msg = "Timeout. Please try again.";

          onChange({ target: { name, value: msg, coords: null } });
          console.error("Geolocation Error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      onChange({ target: { name, value: "Geolocation not supported", coords: null } });
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange({ target: { name, value: val, coords: null } });
    setInputValue(val); // this triggers usePlacesAutocomplete fetching
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
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        autoComplete="off"
        className={`w-full pl-9 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition text-sm sm:text-base ${className}`}
        disabled={disabled || !ready}
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-72 overflow-y-auto">
          <ul className="py-2">

            {/* Action Item: Current Location */}
            {showCurrentLocation && isLoaded && (
              <li
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 text-secondary font-medium border-b border-gray-50 bg-blue-50/50"
                onMouseDown={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              >
                <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
                  <Crosshair size={16} />
                </div>
                <span>Your current location</span>
              </li>
            )}


            {/* Action Item: Choose on Map */}
            {isLoaded && (
              <li
                className="px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-secondary font-medium border-b border-gray-50 cursor-pointer bg-slate-50/50"
                onMouseDown={(e) => { e.preventDefault(); setIsOpen(false); setIsMapOpen(true); }}
              >
                <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                  <Map size={16} />
                </div>
                <span>Choose on Map</span>
              </li>
            )}

            {/* Error States */}
            {loadError && (
              <li className="px-4 py-3 text-sm text-red-500 font-bold border-t border-gray-50 mt-1">
                Google Maps API Error
              </li>
            )}

            {/* Google Places Results */}
            {status === "OK" && data.map((suggestion) => {
              const {
                place_id,
                structured_formatting: { main_text, secondary_text },
              } = suggestion;

              return (
                <li
                  key={place_id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3 border-b border-gray-50 last:border-0"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion.description); }}
                >
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 leading-snug">{main_text}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{secondary_text}</span>
                  </div>
                </li>
              );
            })}

            {!ready && !loadError && (
              <li className="px-4 py-3 flex justify-center text-primary items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-semibold">Initializing Maps API...</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Map Modal */}
      {isMapOpen && (
        <MapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={(loc) => handleSelect(loc.address, { lat: loc.lat, lng: loc.lng })}
        />
      )}
    </div>
  );
};

export default LocationInput;
