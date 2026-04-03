import React from 'react';
import BookingForm from './BookingForm';
import { Star, ShieldCheck, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="relative min-h-[60vh] lg:min-h-[85vh] flex items-center bg-secondary pb-8 sm:pb-20 overflow-hidden">
      {/* Background Pattern - Subtle */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.03]">
        <div className="absolute inset-x-0 top-0 h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full relative z-[10] pt-8 lg:pt-16">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-10">
          
          {/* Text Content */}
          <div className="text-white space-y-4 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] tracking-widest border border-primary/20 backdrop-blur-sm"
            >
              <Award size={12} />
              <span>Most Trusted Taxi Service</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight block px-2"
            >
              Book Your Ride & <br />
              <span className="text-primary">Ride across Karnataka</span>
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-primary text-primary" />)}
                </div>
                <span className="text-[10px] font-bold text-gray-300">4.9/5 Rating</span>
              </div>
              <div className="h-3 w-px bg-gray-700 hidden sm:block" />
              <div className="flex items-center space-x-2">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-gray-300">Verified Drivers</span>
              </div>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed font-medium px-4"
            >
              Experience the gold standard of travel across Karnataka. Safe, comfortable, and punctual—every single time.
            </motion.p>
          </div>

          {/* Form */}
          <div className="w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-6xl mx-auto"
            >
              <BookingForm />
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Bottom Wave decoration */}
      <div className="absolute bottom-0 w-full overflow-hidden leading-[0] z-[5] opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-24 text-white fill-current">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;

