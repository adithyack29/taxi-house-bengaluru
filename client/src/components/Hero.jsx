import React from 'react';
import BookingForm from './BookingForm';

const Hero = () => {
  return (
    <div className="relative min-h-[90vh] flex items-center bg-secondary pb-12 overflow-hidden">
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/30 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop" 
          alt="Taxi in Bengaluru" 
          className="w-full h-full object-cover animate-pan"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-white space-y-6 lg:pr-10 text-center lg:text-left">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold text-sm tracking-wide border border-primary/30">
              #1 Taxi Service in Namma Bengaluru
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              Reliable <span className="text-primary italic">Taxi Service</span> 24/7
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 font-light flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-2">
              <span>Local</span> <span className="hidden sm:inline text-primary">•</span> 
              <span>Outstation</span> <span className="hidden sm:inline text-primary">•</span> 
              <span>Airport Transfers</span>
            </p>
            <p className="text-lg text-gray-400 max-w-lg mx-auto lg:mx-0">
              Experience safe, comfortable, and affordable rides across Karnataka with verified, professional drivers.
            </p>
          </div>

          {/* Form */}
          <div className="w-full flex justify-center lg:justify-end">
            <BookingForm />
          </div>

        </div>
      </div>
      
      {/* Bottom Wave/Curve (optional decorative) */}
      <div className="absolute bottom-0 w-full overflow-hidden leading-[0] z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-12 text-white fill-current">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-23.64V120H0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V120H0Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
