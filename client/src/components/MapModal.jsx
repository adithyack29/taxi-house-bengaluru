import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X, Check } from 'lucide-react';
import L from 'leaflet';

// Fix for leaflet marker icon in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// India center defaults
const BENGALURU_CENTER = [12.9716, 77.5946];

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng());
        },
      }}
    />
  );
};

const MapModal = ({ isOpen, onClose, onConfirm, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition || BENGALURU_CENTER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  // Reverse geocode when they confirm
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { lat, lng } = position;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      
      onConfirm({
        lat,
        lng,
        address: data.display_name || 'Selected Location on Map'
      });
      onClose();
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Still confirm with coordinates if fetching address fails
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
          <div className="flex-1 relative bg-gray-100">
            <MapContainer 
              center={position} 
              zoom={13} 
              minZoom={6}
              maxBounds={[[8.0, 72.0], [22.5, 85.5]]}
              style={{ height: '100%', width: '100%', zIndex: 10 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
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
              disabled={loading}
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
