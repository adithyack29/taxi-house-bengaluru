import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

const ImageCard = ({ poster, index, setSelectedImage }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group"
    >
      <div 
        className="relative aspect-[4/5] overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => setSelectedImage(poster)}
      >
        {/* Loading Skeleton */}
        <AnimatePresence>
          {!isLoaded && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-100"
            >
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <img 
          src={poster.src} 
          alt={poster.alt} 
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } group-hover:scale-105`}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
    </motion.div>
  );
};

const Explore = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const tourPosters = [
    { id: 1, src: '/images/tours/ooty.jpg', alt: 'Explore Ooty' },
    { id: 2, src: '/images/tours/coorg.jpg', alt: 'Explore Coorg' },
    { id: 3, src: '/images/tours/chikmagalur.jpg', alt: 'Explore Chikmagalur' },
    { id: 4, src: '/images/tours/udupi-mangalore.jpg', alt: 'Explore Udupi & Mangalore' },
    { id: 5, src: '/images/tours/bengaluru.jpg', alt: 'Explore Bengaluru' },
    { id: 6, src: '/images/tours/varkala.jpg', alt: 'Explore Varkala' },
    { id: 7, src: '/images/tours/wayanad.jpg', alt: 'Explore Wayanad' },
    { id: 8, src: '/images/tours/rameshwaram.jpg', alt: 'Explore Rameshwaram' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-secondary display tracking-tight mb-4"
          >
            Explore <span className="text-primary">Tours</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 font-medium max-w-2xl mx-auto text-lg"
          >
            Discover our curated tour packages and exciting travel destinations.
          </motion.p>
        </div>

        {/* Posters Grid */}
        {tourPosters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tourPosters.map((poster, index) => (
              <ImageCard 
                key={poster.id || index} 
                poster={poster} 
                index={index} 
                setSelectedImage={setSelectedImage} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
            <div className="text-slate-400 mb-2">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <h3 className="text-xl font-bold text-secondary mb-1">Coming Soon</h3>
            <p className="text-slate-500">Tour posters and packages will be added here shortly.</p>
          </div>
        )}

      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 z-[2010] hover:rotate-90"
            >
              <X size={28} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative max-w-6xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;
