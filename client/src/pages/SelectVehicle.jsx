import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ChevronLeft, ArrowRight, Loader2, Info, Users, Zap, ShieldCheck, AlertCircle, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../utils/formatters';
import { LOCAL_VEHICLES } from '../constants/localVehicles';

const SelectVehicle = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trip details from URL
  const tripDetails = {
    pickup: searchParams.get('pickup') || 'Not specified',
    drop: searchParams.get('drop') || 'Local Trip',
    date: searchParams.get('date'),
    time: searchParams.get('time'),
    type: searchParams.get('type') || 'outstation',
    trip: searchParams.get('trip'),
    package: searchParams.get('package'),
    airport: searchParams.get('airport'),
    stops: searchParams.get('stops'),
    stopCoords: searchParams.get('stopCoords'),
    stopDurations: searchParams.get('stopDurations'),
    returnDate: searchParams.get('returnDate')
  };

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_available', true);

        if (error) throw error;

        // Filter cars based on category and trip constraint
        const filteredCars = data.filter(car => {
          const isCorrectCategory = car.available_categories?.includes(tripDetails.type);
          const isRoundTripCorrect = !car.is_round_trip_only || tripDetails.trip === 'two-way';
          return isCorrectCategory && isRoundTripCorrect;
        });

        // Sort by price (Lowest to Highest)
        const sortedCars = filteredCars.sort((a, b) => {
          if (tripDetails.type === 'local') {
            return (a.base_fare || 0) - (b.base_fare || 0);
          }
          return (a.price_per_km || 0) - (b.price_per_km || 0);
        });

        setCars(sortedCars);
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-6 sm:pt-12">
      <main className="flex-grow container mx-auto px-4 py-4 max-w-7xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-secondary mb-6 transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} />
          <span>Modify Search</span>
        </button>

        <div className="flex flex-col gap-8">
          {/* Trip Summary Card - Full Width Header */}
          <div className="w-full">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-grow">
                  <h3 className="text-sm font-black text-secondary   mb-4 flex items-center gap-2">
                    <Info size={16} className="text-primary" />
                    Trip Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                    {/* Column 1: Trip Category Badges */}
                    <div className="md:col-span-1">
                      <p className="text-[10px] font-black text-gray-400  tracking-[0.2em] mb-3">Category</p>
                      <div className="flex flex-col gap-2">
                        <span className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black  rounded-xl border border-primary/10 text-center">
                          {tripDetails.type === 'outstation' ? 'Outstation' : tripDetails.type === 'local' ? 'Local' : 'Airport'}
                        </span>
                        <span className="px-3 py-1.5 bg-secondary/5 text-secondary text-[10px] font-black  rounded-xl border border-secondary/10 text-center">
                          {tripDetails.type === 'local' ? 'City' : 
                           (tripDetails.trip === 'two-way' ? 'Round Trip' : 
                            tripDetails.trip === 'one-way' ? 'One Way' : 
                            'Transfer')}
                        </span>
                      </div>
                    </div>

                    {/* Column 2-3: Pickup & Destination - Vertically Stacked */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="relative pl-6 border-l-2 border-dashed border-gray-100">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-50" />
                        <p className="text-[10px] font-black text-gray-400   mb-1.5">Pickup Location</p>
                        <p className="text-sm font-bold text-secondary leading-relaxed">{tripDetails.pickup}</p>
                      </div>

                      {tripDetails.stops && JSON.parse(tripDetails.stops || '[]').length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 pl-6">
                          {JSON.parse(tripDetails.stops).map((stop, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-slate-100 min-w-[100px]">
                              <div className="absolute -left-1 w-2 h-2 rounded-full bg-blue-400" />
                              <p className="text-[8px] font-bold text-gray-400 ">Stop {idx + 1}</p>
                              <p className="text-[10px] font-bold text-secondary truncate">{stop}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative pl-6 border-l-2 border-dashed border-gray-100">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                        <p className="text-[10px] font-black text-gray-400   mb-1.5">Final Destination</p>
                        <p className="text-sm font-bold text-secondary leading-relaxed">{tripDetails.drop}</p>
                      </div>
                    </div>

                    {/* Column 4-5: Date, Time & Return/Package */}
                    <div className="md:col-span-2 grid grid-cols-3 gap-6 pt-6 md:pt-0 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400   mb-1.5">Pickup Date</p>
                        <p className="text-sm font-black text-secondary">{formatDate(tripDetails.date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400   mb-1.5">Pickup Time</p>
                        <p className="text-sm font-black text-primary">{formatTime(tripDetails.time)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400   mb-1.5">
                          {tripDetails.type === 'local' ? 'Package' : 'Return Date'}
                        </p>
                        <p className="text-sm font-black text-secondary">
                          {tripDetails.type === 'local' ? (tripDetails.package || 'Selected') : 
                           (tripDetails.returnDate ? formatDate(tripDetails.returnDate) : 'N/A')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle List Section */}
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-secondary flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Available <span className="text-primary italic">Vehicles</span>
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-gray-400 font-bold  text-[10px] ">Searching our fleet...</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                <Car className="mx-auto text-gray-200 mb-4" size={60} />
                <p className="text-secondary font-black text-lg mb-2">No cars available right now</p>
                <p className="text-gray-500 text-sm">Please try a different date or call us directly assistance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {cars.map((car) => (
                  <motion.div
                    key={car.id}
                    layoutId={car.id}
                    className="bg-white rounded-[2rem] border-2 border-gray-100 hover:border-primary transition-all overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-orange-500/10 group cursor-pointer"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('carId', car.id);
                      navigate(`/confirm-booking?${params.toString()}`);
                    }}
                  >
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                      {/* Vehicle Image Area */}
                      <div className="w-full sm:w-48 h-32 bg-white rounded-2xl flex items-center justify-center p-1 relative overflow-hidden group/img shrink-0 border border-slate-100/50">
                        {car.image_url ? (
                          <img 
                            src={car.image_url} 
                            alt={car.name}
                            className={`w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700 ${
                              car.name?.toLowerCase().includes('swift') || car.name?.toLowerCase().includes('etios') 
                                ? 'scale-[1.5]' 
                                : 'scale-100'
                            }`} 
                          />
                        ) : (
                          <Car size={48} className="text-slate-200 group-hover/img:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm ${car.is_ac ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}`}>
                            {car.is_ac ? 'AC' : 'Non-AC'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Vehicle Details & Pricing */}
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div>
                            <h4 className="text-xl sm:text-2xl font-black text-secondary leading-none">{car.name}</h4>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5 opacity-60">
                              {tripDetails.type === 'outstation' ? 'Outstation Fleet' : tripDetails.type === 'airport' ? 'Airport Elite' : 'City Package'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Users size={12} className="text-slate-300" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">
                                {car.seats} Seats {car.seating_style ? `(${car.seating_style} Layout)` : ''}
                              </span>
                            </div>
                            {tripDetails.type === 'local' && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] font-black text-primary uppercase">{car.local_package || '8h / 80km'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 sm:gap-10">
                          <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                              {tripDetails.type === 'local' ? 'Package Price' : (tripDetails.trip === 'one-way' ? 'One Way Rate' : 'Round Trip Rate')}
                            </span>
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-sm font-black text-secondary">₹</span>
                              <span className="text-3xl sm:text-4xl font-black text-secondary tracking-tighter">
                                {tripDetails.type === 'local' ? (car.base_fare || 0).toLocaleString() : (tripDetails.trip === 'one-way' ? (car.price_per_km_one_way || 0) : (car.price_per_km || 0))}
                              </span>
                              {tripDetails.type !== 'local' && (
                                <span className="text-xs font-black text-slate-400 tracking-tight">/km</span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-secondary transition-all shadow-xl shadow-secondary/10 group-hover:shadow-primary/30">
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* High-Transparency Footer Row (The "Mandatory" Info) */}
                    {(tripDetails.type === 'outstation') && (
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-8">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200">
                            <Zap size={12} className="text-primary fill-primary/20" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Driver Bata</p>
                            <p className="text-xs font-black text-secondary leading-none">₹{car.driver_bata}/day</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200">
                            <Calculator size={12} className="text-secondary opacity-60" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Billing Threshold</p>
                            <p className="text-xs font-black text-secondary leading-none">Min {car.min_km}KM/Day</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 ml-auto">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Available Now</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectVehicle;
