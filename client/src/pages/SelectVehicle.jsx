import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ChevronLeft, ArrowRight, Loader2, Info, Users, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../utils/formatters';

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
    returnDate: searchParams.get('returnDate')
  };

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_available', true)
          .contains('available_categories', [tripDetails.type]);
        
        if (error) throw error;
        // Sort by seats (min to max)
        setCars((data || []).sort((a, b) => a.seats - b.seats));
      } catch (err) {
        console.error('Error fetching cars:', err);
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
                  <h3 className="text-sm font-black text-secondary uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Info size={16} className="text-primary" />
                    Trip Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                    {/* Column 1: Trip Category Badges */}
                    <div className="md:col-span-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Category</p>
                      <div className="flex flex-col gap-2">
                        <span className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-xl border border-primary/10 text-center">
                          {tripDetails.type === 'outstation' ? 'Outstation' : tripDetails.type === 'local' ? 'Local' : 'Airport'}
                        </span>
                        <span className="px-3 py-1.5 bg-secondary/5 text-secondary text-[10px] font-black uppercase rounded-xl border border-secondary/10 text-center">
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
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pickup Location</p>
                        <p className="text-sm font-bold text-secondary leading-relaxed">{tripDetails.pickup}</p>
                      </div>

                      {tripDetails.stops && JSON.parse(tripDetails.stops || '[]').length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 pl-6">
                          {JSON.parse(tripDetails.stops).map((stop, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-slate-100 min-w-[100px]">
                              <div className="absolute -left-1 w-2 h-2 rounded-full bg-blue-400" />
                              <p className="text-[8px] font-bold text-gray-400 uppercase">Stop {idx + 1}</p>
                              <p className="text-[10px] font-bold text-secondary truncate">{stop}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative pl-6 border-l-2 border-dashed border-gray-100">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Final Destination</p>
                        <p className="text-sm font-bold text-secondary leading-relaxed">{tripDetails.drop}</p>
                      </div>
                    </div>

                    {/* Column 4-5: Date, Time & Return/Package */}
                    <div className="md:col-span-2 grid grid-cols-3 gap-6 pt-6 md:pt-0 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pickup Date</p>
                        <p className="text-sm font-black text-secondary">{formatDate(tripDetails.date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pickup Time</p>
                        <p className="text-sm font-black text-primary">{formatTime(tripDetails.time)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
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
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Searching our fleet...</p>
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
                    <div className="p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      {/* Vehicle Image Area */}
                      <div className="w-full sm:w-56 h-36 sm:h-36 bg-gradient-to-br from-gray-50 to-white rounded-3xl flex items-center justify-center p-4 shadow-inner border border-gray-100/50 relative overflow-hidden group">
                        {car.image_url ? (
                          <img 
                            src={car.image_url} 
                            alt={car.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <Car size={64} className="text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm ${car.is_ac ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {car.is_ac ? 'AC' : 'Non AC'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-2xl font-black text-secondary tracking-tight">{car.name}</h4>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Fare</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-secondary">₹{car.price_per_km}</span>
                              <span className="text-xs font-bold text-gray-400">/km</span>
                            </div>
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <Users size={14} className="text-primary" />
                            <span className="text-[11px] font-black text-secondary">{car.seats} Seats</span>
                          </div>
                          {tripDetails.type === 'outstation' && (
                            <>
                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Zap size={14} className="text-primary" />
                                <span className="text-[11px] font-black text-secondary">{car.seating_style === 'N/A' ? 'Standard' : car.seating_style} Style</span>
                              </div>
                              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                <Info size={14} className="text-primary" />
                                <span className="text-[11px] font-black text-primary">Min {car.min_km} KM</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Detailed Pricing Breakdown - Only for Outstation */}
                        {tripDetails.type === 'outstation' && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Driver Bata</p>
                              <p className="text-sm font-black text-secondary flex items-center gap-1">
                                ₹{car.driver_bata} <span className="text-[10px] text-gray-400">/day</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Night Bata</p>
                              <p className="text-sm font-black text-secondary flex items-center gap-1">
                                ₹{car.night_bata} <span className="text-[10px] text-gray-400">/night</span>
                              </p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">State Permit</p>
                              <p className="text-sm font-black text-orange-600 flex items-center gap-1">
                                ₹{car.permit_charge} <span className="text-[10px] text-gray-400">approx</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="w-full sm:w-12 h-12 flex items-center justify-center rounded-2xl transition-all bg-secondary text-white group-hover:bg-primary group-hover:shadow-lg">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>

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
