import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { X, Check, Loader2 } from 'lucide-react';

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const LIBRARIES = ['places'];

const MapModal = ({ isOpen, onClose, onConfirm, initialPosition }) => {
  // Ensure we consistently use objects { lat, lng } vs arrays
  const [position, setPosition] = useState(
    initialPosition && initialPosition.lat && initialPosition.lng
      ? initialPosition
      : (Array.isArray(initialPosition) && initialPosition.length === 2 
          ? { lat: initialPosition[0], lng: initialPosition[1] } 
          : BENGALURU_CENTER)
  );
  
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (initialPosition) {
      let newPos = initialPosition;
      if (Array.isArray(initialPosition)) {
        newPos = { lat: initialPosition[0], lng: initialPosition[1] };
      }
      setPosition(newPos);
      if (map && newPos.lat) {
        map.panTo(newPos);
      }
    }
  }, [initialPosition, map]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback((map) => {
    setMap(null);
  }, []);

  const handleMapClick = (e) => {
    if (e.latLng) {
      setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const handleMarkerDragEnd = (e) => {
    if (e.latLng) {
      setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  // Reverse geocode when they confirm
  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!window.google) throw new Error("Google API not loaded");
      
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: position });
      
      if (response.results && response.results[0]) {
        onConfirm({
          lat: position.lat,
          lng: position.lng,
          address: response.results[0].formatted_address
        });
      } else {
        throw new Error("No results found");
      }
      onClose();
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback
      onConfirm({ lat: position.lat, lng: position.lng, address: `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h3 className="text-xl font-bold text-secondary">Select on Map</h3>
              <p className="text-sm text-gray-500">Drag the pin or click on the map</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
            {loadError && <div className="text-red-500 font-bold flex flex-col items-center"><X size={48} /><span>Error loading Maps. Check API Key.</span></div>}
            {!isLoaded && !loadError && <Loader2 className="animate-spin text-primary" size={32} />}
            {isLoaded && !loadError && (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={position}
                zoom={13}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                onClick={handleMapClick}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  restriction: {
                    latLngBounds: {
                      north: 22.5,
                      south: 8.0,
                      east: 85.5,
                      west: 72.0
                    },
                    strictBounds: false,
                  }
                }}
              >
                <Marker 
                  position={position}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                />
              </GoogleMap>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-gray-100 flex justify-end space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={loading || (!isLoaded && !loadError)}
              className="flex items-center space-x-2 bg-primary text-secondary px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loading ? (
                <span>Confirming...</span>
              ) : (
                <>
                  <Check size={20} />
                  <span>Confirm Location</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapModal;
