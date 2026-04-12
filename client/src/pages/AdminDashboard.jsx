import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  Power,
  Lock,
  RotateCcw,
  ChevronDown,
  Database,
  Phone,
  Pencil,
  Save,
  MapPin,
  Plane,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Timer,
  Calculator
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WhatsAppIcon } from '../components/WhatsAppButton';
import { formatDate, formatTime } from '../utils/formatters';
import TripPlanModal from '../components/TripPlanModal';
import FareDetailModal from '../components/FareDetailModal';

const formatPhoneForWhatsApp = (phone) => {
  return phone.replace(/\D/g, '');
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('admin_authenticated') === 'true');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ bookings: [], messages: [], cars: [] });
  const [deleteId, setDeleteId] = useState(null);
  const [editingCar, setEditingCar] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const [resetConfirmType, setResetConfirmType] = useState(null); // 'bookings', 'messages', 'cars'
  const [selectedCategory, setSelectedCategory] = useState(null); // 'local', 'outstation', 'airport'
  const [revealedOrderIds, setRevealedOrderIds] = useState(new Set());
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [viewingFare, setViewingFare] = useState(null);
  const [formStep, setFormStep] = useState('category'); // 'category', 'details'

  // Admin password (simple for trial as requested)
  // In a real app, this should be an env variable or Supabase Auth
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const [{ data: bookings }, { data: cars }] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('cars')
            .select('*')
        ]);
        setData(prev => ({ 
          ...prev, 
          bookings: bookings || [],
          cars: cars || prev.cars 
        }));
      } else if (activeTab === 'messages') {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });
        setData(prev => ({ ...prev, messages: messages || [] }));
      } else if (activeTab === 'cars') {
        const { data: cars } = await supabase
          .from('cars')
          .select('*')
          .order('seats', { ascending: true });
        // Sort by price (Lowest to Highest)
        const sortedCars = (cars || []).sort((a, b) => 
          (a.price_per_km || 0) - (b.price_per_km || 0) || 
          (a.base_fare || 0) - (b.base_fare || 0)
        );
        setData(prev => ({ ...prev, cars: sortedCars }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const toggleCarAvailability = async (id, currentStatus) => {
    try {
      await supabase
        .from('cars')
        .update({ is_available: !currentStatus })
        .eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error updating car:', error);
    }
  };

  const deleteCar = async () => {
    if (!deleteId) return;
    try {
      await supabase.from('cars').delete().eq('id', deleteId);
      setDeleteId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };
  const addCar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCar = {
      name: formData.get('name'),
      seats: parseInt(formData.get('seats')) || 4,
      price_per_km: parseFloat(formData.get('price_round_trip')) || 0,
      price_per_km_one_way: parseFloat(formData.get('price_one_way')) || 0,
      min_km: parseInt(formData.get('min_km')) || 0,
      driver_bata: parseInt(formData.get('driver_bata')) || 0,
      night_bata: parseInt(formData.get('night_bata')) || 0,
      permit_charge: parseInt(formData.get('permit_charge')) || 0,
      available_categories: [selectedCategory],
      is_ac: formData.get('is_ac') === 'on',
      image_url: formData.get('image_url'),
      is_available: true,
      // New fields for Local
      base_fare: parseFloat(formData.get('base_fare')) || 0,
      local_package: formData.get('local_package') || '8 Hours / 80 KM',
      extra_km_price: parseFloat(formData.get('extra_km_price')) || 0,
      extra_hr_price: parseFloat(formData.get('extra_hr_price')) || 0,
      seating_style: formData.get('seating_style') || null,
      is_round_trip_only: formData.get('is_round_trip_only') === 'on'
    };

    try {
      const { error } = await supabase.from('cars').insert([newCar]);
      if (error) throw error;
      
      e.target.reset();
      setFormStep('category');
      setSelectedCategory(null);
      fetchData();
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Failed to add car: ' + error.message);
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    if (!editingCar) return;

    const formData = new FormData(e.target);
    const updatedCar = {
      name: formData.get('name'),
      seats: parseInt(formData.get('seats')) || 4,
      price_per_km: parseFloat(formData.get('price_round_trip')) || 0,
      price_per_km_one_way: parseFloat(formData.get('price_one_way')) || 0,
      min_km: parseInt(formData.get('min_km')) || 0,
      driver_bata: parseInt(formData.get('driver_bata')) || 0,
      night_bata: parseInt(formData.get('night_bata')) || 0,
      permit_charge: parseInt(formData.get('permit_charge')) || 0,
      available_categories: formData.getAll('categories'),
      is_ac: formData.get('is_ac') === 'on',
      image_url: formData.get('image_url'),
      // Specialized local fields
      base_fare: parseFloat(formData.get('base_fare')) || 0,
      local_package: formData.get('local_package') || '8 Hours / 80 KM',
      extra_km_price: parseFloat(formData.get('extra_km_price')) || 0,
      extra_hr_price: parseFloat(formData.get('extra_hr_price')) || 0,
      seating_style: formData.get('seating_style') || null,
      is_round_trip_only: formData.get('is_round_trip_only') === 'on'
    };

    try {
      const { error } = await supabase
        .from('cars')
        .update(updatedCar)
        .eq('id', editingCar.id);

      if (error) throw error;
      
      setEditingCar(null);
      fetchData();
    } catch (error) {
      console.error('Error updating car:', error);
      alert('Failed to update car');
    }
  };

  const handleResetData = async () => {
    if (!resetConfirmType) return;
    
    setLoading(true);
    try {
      let table = '';
      if (resetConfirmType === 'bookings') table = 'bookings';
      else if (resetConfirmType === 'messages') table = 'messages';
      else if (resetConfirmType === 'cars') table = 'cars';

      const { error } = await supabase
        .from(table)
        .delete()
        .gt('id', 0); // Delete all with integer IDs

      if (error) throw error;
      
      // Update local state
      if (resetConfirmType === 'bookings') setData(prev => ({ ...prev, bookings: [] }));
      else if (resetConfirmType === 'messages') setData(prev => ({ ...prev, messages: [] }));
      else if (resetConfirmType === 'cars') setData(prev => ({ ...prev, cars: [] }));
      
      setResetConfirmType(null);
      setIsResetMenuOpen(false);
    } catch (error) {
      console.error(`Error resetting ${resetConfirmType}:`, error);
      alert(`Failed to reset ${resetConfirmType}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
            <p className="text-slate-500 text-center mt-2">Enter your password to access the trial dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-secondary font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg"
            >
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 pt-10 md:pt-20 pb-8 flex flex-col font-sans">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="text-primary" size={20} />
              Owner Dashboard
            </h1>
            <p className="text-[10px] md:text-sm text-slate-500 font-semibold   opacity-70">Backend management system</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Reset Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsResetMenuOpen(!isResetMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[10px] hover:bg-slate-50 transition-all shadow-sm"
              >
                <RotateCcw size={12} className="text-orange-500" />
                <span>Reset Data</span>
                <ChevronDown size={10} className={`transition-transform ${isResetMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isResetMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsResetMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] overflow-hidden p-1"
                    >
                      <button 
                        onClick={() => { setResetConfirmType('bookings'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Calendar size={12} />
                        Clear Bookings
                      </button>
                      <button 
                        onClick={() => { setResetConfirmType('messages'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <MessageSquare size={12} />
                        Clear Messages
                      </button>
                      <div className="h-px bg-slate-50 my-1 mx-2" />
                      <button 
                        onClick={() => { setResetConfirmType('cars'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Car size={12} />
                        Reset Fleet (Cars)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-[10px] font-bold"
            >
              <Power size={12} />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-4 md:mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'cars', label: 'Fleet', icon: Car },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 md:px-6 py-2 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary text-secondary shadow-md' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} className="md:size-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="p-3 md:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'bookings' && (
                  <motion.div
                    key="bookings"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-4 font-bold text-slate-400  text-[10px] ">Customer</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px]  text-center">Trip Type</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px] ">Schedule</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px]  px-4">Vehicle</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px]  text-center">Plan & Fare</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px]  text-center">Status</th>
                            <th className="pb-4 font-bold text-slate-400  text-[10px]  text-center">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.bookings.map((booking) => {
                            const vehicleSeats = data.cars.find(c => c.name === booking.car_type)?.seats || 'N/A';
                            return (
                              <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3">
                                  <div className="text-base font-bold text-slate-900">{booking.user_name}</div>
                                  <div className="text-xs font-medium text-slate-400">{booking.phone}</div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-900   mb-0.5">
                                      {(booking.trip_category || 'Trip').replace('-', ' ')}
                                    </span>
                                    <span className="text-[9px] font-black text-primary  bg-primary/5 px-2 py-0.5 rounded-full mb-1">
                                      {booking.trip_category === 'local' 
                                        ? booking.local_package 
                                        : (booking.sub_type || '').replace('-', ' ')}
                                    </span>
                                    <button 
                                      onClick={() => setViewingBooking(booking)}
                                      className="text-[9px] font-black text-slate-400/60  hover:text-primary transition-colors flex items-center gap-1 border-b border-transparent hover:border-primary/30"
                                    >
                                      <span>Route Info</span>
                                      {booking.stops?.length > 0 && <span className="text-primary/70">+{booking.stops.length}</span>}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[11px] font-black flex items-center gap-1.5">
                                      <span className="text-green-600 opacity-60">PD</span>
                                      <span className="text-slate-900">{formatDate(booking.booking_date)}</span>
                                    </div>
                                    <div className="text-[10px] font-bold flex items-center gap-1.5">
                                      <span className="text-green-600 opacity-60">PT</span>
                                      <span className="text-slate-500">{formatTime(booking.booking_time)}</span>
                                    </div>
                                    {(booking.sub_type === 'round-trip' || booking.sub_type === 'two-way') && booking.return_date && (
                                      <>
                                        <div className="text-[10px] font-bold flex items-center gap-1.5">
                                          <span className="text-red-500 opacity-70">RD</span>
                                          <span className="text-slate-500">{formatDate(booking.return_date)}</span>
                                        </div>
                                        <div className="text-[10px] font-bold flex items-center gap-1.5">
                                          <span className="text-red-500 opacity-70">RT</span>
                                          <span className="text-slate-500">{formatTime(booking.return_time)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-black text-slate-900  ">
                                      {booking.car_type}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400   px-1.5 py-0.5 bg-slate-50 rounded w-fit">
                                      {vehicleSeats} Seats
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col items-center gap-1.5">
                                    {booking.audit_data ? (
                                      <>
                                        <button 
                                          onClick={() => setViewingPlan(booking)}
                                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black text-secondary/60 hover:text-primary transition-all border border-slate-100"
                                        >
                                          <Timer size={10} /> TIMELINE
                                        </button>
                                        <button 
                                          onClick={() => setViewingFare(booking)}
                                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black text-secondary/60 hover:text-primary transition-all border border-slate-100"
                                        >
                                          <Calculator size={10} /> FARE MATH
                                        </button>
                                        <div className="w-full mt-1.5 pt-1.5 border-t border-slate-100/60 flex flex-col items-center">
                                           <span className="text-[7px] font-black text-slate-300 uppercase leading-none mb-1">Total Est.</span>
                                           <span className="text-[10px] font-black text-primary leading-none">
                                              ₹{(booking.audit_data.totalFare || 
                                                 booking.audit_data.total || 
                                                 (Number(booking.audit_data.baseFare || 0) + 
                                                  Number(booking.audit_data.totalDayBata || 0) + 
                                                  Number(booking.audit_data.totalNightBata || 0))
                                                ).toLocaleString()}
                                           </span>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-[8px] font-black text-slate-300 uppercase italic leading-none text-center block">Snapshots<br/>Unavailable</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                        booking.status === 'confirmed' ? 'bg-green-500/10 text-green-600' : 
                                        booking.status === 'pending' ? 'bg-orange-500/10 text-orange-600' : 
                                        'bg-slate-100 text-slate-400'
                                      }`}>
                                        {booking.status}
                                      </span>
                                      
                                      {booking.payment_status === 'paid' ? (
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                          {revealedOrderIds.has(booking.id) ? (
                                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg border border-green-100 shadow-sm transition-all animate-in fade-in zoom-in duration-200">
                                              <span className="text-[9px] font-mono text-green-700 font-black whitespace-nowrap">
                                                {booking.cashfree_order_id}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <button 
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(booking.cashfree_order_id);
                                                    setCopiedOrderId(booking.id);
                                                    setTimeout(() => setCopiedOrderId(null), 2000);
                                                  }}
                                                  className="p-1 hover:bg-green-100 rounded transition-colors text-green-600"
                                                  title="Copy ID"
                                                >
                                                  {copiedOrderId === booking.id ? <CheckCircle size={10} /> : <Copy size={10} />}
                                                </button>
                                                <button 
                                                  onClick={() => {
                                                    const next = new Set(revealedOrderIds);
                                                    next.delete(booking.id);
                                                    setRevealedOrderIds(next);
                                                  }}
                                                  className="p-1 hover:bg-green-100 rounded transition-colors text-green-400"
                                                  title="Hide ID"
                                                >
                                                  <EyeOff size={10} />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button 
                                              onClick={() => {
                                                const next = new Set(revealedOrderIds);
                                                next.add(booking.id);
                                                setRevealedOrderIds(next);
                                              }}
                                              className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-tighter bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg border border-green-100 transition-all"
                                            >
                                              <Eye size={10} />
                                              PAID / VIEW ID
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                          {booking.payment_status}
                                        </span>
                                      )}
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <a 
                                      href={`https://wa.me/${formatPhoneForWhatsApp(booking.phone)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-[#25D366]/10 rounded-lg transition-all"
                                    >
                                      <WhatsAppIcon size={16} className="text-[#25D366]" />
                                    </a>
                                    <a 
                                      href={`tel:${booking.phone}`}
                                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-all"
                                    >
                                      <Phone size={16} className="text-blue-500" />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {data.bookings.map((booking) => {
                        const vehicleSeats = data.cars.find(c => c.name === booking.car_type)?.seats || 'N/A';
                        return (
                          <div key={booking.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-[15px] font-bold text-slate-900">{booking.user_name}</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-black  px-1.5 py-0.5 rounded-md ${
                                    booking.status === 'confirmed' ? 'bg-green-500/10 text-green-600' : 
                                    booking.status === 'pending' ? 'bg-orange-500/10 text-orange-600' : 
                                    'bg-slate-100 text-slate-400'
                                  }`}>
                                    {booking.status}
                                  </span>
                                  <div className="text-xs font-medium text-slate-400">{booking.phone}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a href={`tel:${booking.phone}`} className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                  <Phone size={14} />
                                </a>
                                <a href={`https://wa.me/${formatPhoneForWhatsApp(booking.phone)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#25D366]/10 rounded-lg text-[#25D366]">
                                  <WhatsAppIcon size={14} />
                                </a>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                               <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-center">
                                 <span className="text-[8px] font-black text-slate-300 block mb-0.5">Trip Type</span>
                                 <div className="text-[10px] font-black text-slate-800 truncate leading-tight">
                                   {(booking.trip_category || 'Trip').replace('-', ' ')}
                                 </div>
                                 <div className="text-[8px] font-bold text-primary truncate mt-0.5">
                                   {booking.trip_category === 'local' 
                                     ? booking.local_package 
                                     : (booking.sub_type || '').replace('-', ' ')}
                                 </div>
                               </div>

                               <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-center">
                                 <span className="text-[8px] font-black text-slate-300 block mb-0.5">Logistics</span>
                                 <div className="flex gap-1.5 pt-0.5">
                                   {booking.audit_data ? (
                                     <>
                                       <button 
                                         onClick={() => setViewingPlan(booking)}
                                         className="flex-1 bg-primary/5 hover:bg-primary/10 py-1 rounded-md text-[8px] font-black text-primary flex items-center justify-center gap-1 transition-colors"
                                       >
                                         <Timer size={8} /> PLAN
                                       </button>
                                       <button 
                                         onClick={() => setViewingFare(booking)}
                                         className="flex-1 bg-primary/5 hover:bg-primary/10 py-1 rounded-md text-[8px] font-black text-primary flex items-center justify-center gap-1 transition-colors"
                                       >
                                         <Calculator size={8} /> FARE
                                       </button>
                                     </>
                                   ) : (
                                     <span className="text-[8px] font-bold text-slate-300 italic">No Snapshot</span>
                                   )}
                                 </div>
                                 {booking.audit_data && (
                                   <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between items-center px-1">
                                      <span className="text-[7px] font-black text-slate-300 uppercase">Est. Total</span>
                                      <span className="text-[10px] font-black text-primary">
                                        ₹{(booking.audit_data.totalFare || 
                                           booking.audit_data.total || 
                                           (Number(booking.audit_data.baseFare || 0) + 
                                            Number(booking.audit_data.totalDayBata || 0) + 
                                            Number(booking.audit_data.totalNightBata || 0))
                                          ).toLocaleString()}
                                      </span>
                                   </div>
                                 )}
                               </div>

                               <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-center col-span-2">
                                 <span className="text-[8px] font-black text-slate-300 block mb-0.5">Vehicle Details</span>
                                 <div className="flex justify-between items-center">
                                   <div className="text-[10px] font-black text-slate-900 truncate">
                                      {booking.car_type}
                                   </div>
                                   <div className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                      {data.cars.find(c => c.name === booking.car_type)?.seats || 'N/A'} Seats
                                   </div>
                                 </div>
                               </div>
                             </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-green-600 opacity-60 ">PD</span>
                                  <span className="text-[10px] font-bold text-slate-700">{formatDate(booking.booking_date)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-green-600 opacity-60 ">PT</span>
                                  <span className="text-[10px] font-bold text-slate-700">{formatTime(booking.booking_time)}</span>
                                </div>
                                {(booking.sub_type === 'round-trip' || booking.sub_type === 'two-way') && booking.return_date && (
                                  <>
                                    <div className="flex flex-col">
                                      <span className="text-[7px] font-black text-red-500 opacity-70 ">RD</span>
                                      <span className="text-[10px] font-bold text-slate-700">{formatDate(booking.return_date)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[7px] font-black text-red-500 opacity-70 ">RT</span>
                                      <span className="text-[10px] font-bold text-slate-700">{formatTime(booking.return_time)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <button 
                                onClick={() => setViewingBooking(booking)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500  flex items-center gap-1"
                              >
                                Route
                                {booking.stops?.length > 0 && <span className="text-primary">+{booking.stops.length}</span>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(data.bookings.length === 0) && (
                      <div className="py-12 text-center text-slate-400 font-bold text-sm ">No bookings found</div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {data.messages.map((msg) => (
                      <div key={msg.id} className="p-3 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                          <div>
                            <h3 className="font-black text-sm md:text-lg text-slate-900">{msg.name}</h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1 font-bold">
                              <span>{msg.email}</span>
                              <div className="flex items-center gap-2">
                                <span>{msg.phone}</span>
                                <a 
                                  href={`https://wa.me/${formatPhoneForWhatsApp(msg.phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-[#25D366]/10 rounded-full transition-all"
                                >
                                  <WhatsAppIcon size={12} className="text-[#25D366]" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="text-[9px] md:text-xs text-slate-300 font-bold">
                            {formatDate(msg.created_at)}
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px] md:text-sm bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-slate-100 font-medium">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                    {data.messages.length === 0 && (
                      <div className="py-12 text-center text-slate-400 font-bold text-sm ">No messages found</div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'cars' && (
                  <motion.div
                    key="cars"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-slate-900  ">Fleet Management</h2>
                        <p className="text-[10px] font-bold text-slate-400   mt-1">Configure your vehicles and pricing</p>
                      </div>
                    </div>
                    {/* Add Car Form */}
                    <div className="mb-6 md:mb-10 bg-slate-50 p-4 md:p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-inner">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-sm md:text-base text-slate-800 flex items-center gap-3  tracking-wider">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Plus size={18} className="text-primary" />
                          </div>
                          Add New Vehicle
                        </h3>
                        {formStep === 'details' && (
                          <button 
                            onClick={() => { setFormStep('category'); setSelectedCategory(null); }}
                            className="text-[10px] font-black text-primary  flex items-center gap-1 hover:underline"
                          >
                            <RotateCcw size={12} />
                            Change Category
                          </button>
                        )}
                      </div>

                      {formStep === 'category' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'outstation', label: 'Outstation', icon: MapPin, desc: 'Long distance trips' },
                            { id: 'local', label: 'Local', icon: Calendar, desc: 'Hourly packages' },
                            { id: 'airport', label: 'Airport', icon: Plane, desc: 'Pickup/Drop service' }
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => { setSelectedCategory(cat.id); setFormStep('details'); }}
                              className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all flex flex-col items-center text-center gap-3 active:scale-95"
                            >
                              <div className="w-16 h-16 bg-slate-50 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-colors">
                                <cat.icon size={32} className="text-slate-400 group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <h4 className="font-black text-secondary  ">{cat.label}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">{cat.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <form onSubmit={addCar} className="space-y-6">
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-primary   mb-6 px-1 italic">
                              Category: {selectedCategory} Booking
                            </p>
                            
                            {selectedCategory === 'local' ? (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Car Name</label>
                                    <input name="name" placeholder="e.g., Swift Dzire" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Package Name</label>
                                    <input name="local_package" defaultValue="8 Hours / 80 KM" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Base Fare (Pkg Price)</label>
                                    <input name="base_fare" type="number" placeholder="₹2100" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Extra KM Rate</label>
                                    <input name="extra_km_price" type="number" placeholder="₹12" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Extra HR Rate</label>
                                    <input name="extra_hr_price" type="number" placeholder="₹150" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400   mb-2 ml-1">Vehicle Image</label>
                                    <div className="relative group">
                                      <input name="image_url" placeholder="Paste Image URL here" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 group-hover:bg-white" />
                                      <div className="mt-2 p-4 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300">
                                        <Car size={32} />
                                        <span className="text-[10px] font-bold mt-1 ">Image Holder</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col justify-end gap-6 pb-2">
                                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                      <input type="checkbox" name="is_ac" defaultChecked className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 cursor-pointer transition-all" />
                                      <span className="text-xs font-black text-slate-900 ">Air Conditioned (AC)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                      <input type="checkbox" name="is_round_trip_only" className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 cursor-pointer transition-all" />
                                      <span className="text-xs font-black text-orange-600 ">Round Trip Only (Heavy Duty)</span>
                                    </label>
                                    <div>
                                      <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">Seating Style (Optional)</label>
                                      <input name="seating_style" placeholder="e.g., 2+2 or 3+2" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                    </div>
                                    <button type="submit" className="w-full bg-secondary text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10 text-sm  tracking-wide flex items-center justify-center gap-3">
                                      <Save size={18} />
                                      Create local Vehicle
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                  <Zap size={40} className="text-primary animate-pulse" />
                                </div>
                                <h4 className="text-lg font-black text-secondary  ">Coming Soon</h4>
                                <p className="text-slate-400 text-xs font-bold max-w-xs mx-auto">
                                  Specialized forms for {selectedCategory} are being refined. Check back later!
                                </p>
                                <button 
                                  type="button"
                                  onClick={() => { setFormStep('category'); setSelectedCategory(null); }}
                                  className="text-xs font-black text-primary underline "
                                >
                                  Go Back
                                </button>
                              </div>
                            )}
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Cars List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {data.cars.map((car) => (
                        <div key={car.id} className="relative group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            {/* Car Image/Placeholder */}
                            <div className="w-full sm:w-40 h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                              {car.image_url ? (
                                <img src={car.image_url} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                <Car size={40} className="text-slate-200" />
                              )}
                              <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[8px] font-black   ${
                                car.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {car.is_available ? 'Live' : 'Hidden'}
                              </div>
                            </div>

                            {/* Car Details */}
                            <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-black text-lg text-slate-900 leading-tight">{car.name}</h4>
                                  <div className="flex gap-1">
                                    {car.available_categories?.map(cat => (
                                      <span key={cat} className="text-[7px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mb-4">
                                  {car.is_ac ? 'AC Vehicle' : 'Non-AC'} • {car.seats || 4} Seats 
                                  {car.seating_style && <span className="text-primary ml-1">• Layout: {car.seating_style}</span>}
                                  {car.is_round_trip_only && <span className="text-orange-600 ml-1">• Round Trip Only</span>}
                                </p>

                                {car.available_categories?.includes('local') ? (
                                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="text-center">
                                      <span className="text-[7px] font-black text-slate-300 block">Pkg Price</span>
                                      <span className="text-xs font-black text-slate-800">₹{car.base_fare}</span>
                                    </div>
                                    <div className="text-center border-x border-slate-200/50">
                                      <span className="text-[7px] font-black text-slate-300 block">Ex KM</span>
                                      <span className="text-xs font-black text-slate-800">₹{car.extra_km_price}</span>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-[7px] font-black text-slate-300 block">Ex HR</span>
                                      <span className="text-xs font-black text-slate-800">₹{car.extra_hr_price}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <span className="text-[7px] font-black text-slate-300 block">Round Trip</span>
                                        <span className="text-xs font-black text-slate-800">₹{car.price_per_km}/KM</span>
                                      </div>
                                      <div className="w-px h-6 bg-slate-200/50" />
                                      <div>
                                        <span className="text-[7px] font-black text-slate-300 block">One Way</span>
                                        <span className="text-xs font-black text-slate-800">₹{car.price_per_km_one_way || 0}/KM</span>
                                      </div>
                                      <div className="w-px h-6 bg-slate-200/50 ml-auto" />
                                      <div className="text-right">
                                        <span className="text-[7px] font-black text-slate-300 block">Min Dist</span>
                                        <span className="text-xs font-black text-slate-800">{car.min_km}KM</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => setEditingCar(car)}
                                    className="p-2 text-slate-900 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(car.id); }}
                                    className="p-2 text-slate-900 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => toggleCarAvailability(car.id, car.is_available)}
                                  className={`px-4 py-1.5 rounded-full text-[9px] font-black  tracking-wider transition-all shadow-sm active:scale-95 ${
                                    car.is_available 
                                      ? 'bg-secondary text-white hover:bg-black' 
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {car.is_available ? 'Disable Vehicle' : 'Enable Vehicle'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-[340px] md:max-w-sm w-full border border-slate-100 text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2  ">Delete Vehicle?</h3>
              <p className="text-slate-500 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed font-medium">
                This action cannot be undone. This vehicle will be permanently removed from your fleet.
              </p>
              <div className="flex gap-2 md:gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl md:rounded-2xl transition-all text-[11px] md:text-sm "
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteCar}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-500/20 text-[11px] md:text-sm "
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Vehicle Modal */}
      <AnimatePresence>
        {editingCar && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
              onClick={() => setEditingCar(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900   flex items-center gap-2">
                  <Pencil size={20} className="text-primary" />
                  Edit Vehicle
                </h3>
                <button onClick={() => setEditingCar(null)} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateCar} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Vehicle Name</label>
                    <input
                      name="name"
                      defaultValue={editingCar.name}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Vehicle Image URL</label>
                      <input
                        name="image_url"
                        defaultValue={editingCar.image_url}
                        placeholder="https://example.com/image.png"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    {/* Outstation Pricing (Conditional) */}
                    {editingCar.available_categories?.includes('outstation') && (
                      <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 px-1">Outstation Pricing</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Round Trip ₹/KM</label>
                            <input
                              name="price_round_trip"
                              type="number"
                              min="0"
                              step="0.1"
                              defaultValue={editingCar.price_per_km}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">One Way ₹/KM</label>
                            <input
                              name="price_one_way"
                              type="number"
                              min="0"
                              step="0.1"
                              defaultValue={editingCar.price_per_km_one_way || 0}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Min KM / Day</label>
                            <input
                              name="min_km"
                              type="number"
                              defaultValue={editingCar.min_km || 0}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Driver Bata</label>
                            <input
                              name="driver_bata"
                              type="number"
                              defaultValue={editingCar.driver_bata || 0}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Night Bata</label>
                            <input
                              name="night_bata"
                              type="number"
                              defaultValue={editingCar.night_bata || 0}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Permit Charge</label>
                            <input
                              name="permit_charge"
                              type="number"
                              defaultValue={editingCar.permit_charge || 0}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Seats</label>
                            <input
                              name="seats"
                              type="number"
                              min="1"
                              defaultValue={editingCar.seats}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Local Pricing (Conditional) */}
                    {editingCar.available_categories?.includes('local') && (
                      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[10px] font-black text-primary  ">Local Package Settings</p>
                          {!editingCar.available_categories?.includes('outstation') && (
                             <div className="flex items-center gap-2">
                               <label className="text-[10px] font-black text-slate-400 ">Seats:</label>
                               <input name="seats" type="number" defaultValue={editingCar.seats} className="w-12 bg-transparent border-b border-primary/10 text-[10px] font-black text-secondary outline-none text-center" />
                             </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-400  mb-1 ml-1">Package Name</label>
                            <input name="local_package" defaultValue={editingCar.local_package} className="w-full px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400  mb-1 ml-1">Base Fare</label>
                            <input name="base_fare" type="number" defaultValue={editingCar.base_fare} className="w-full px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400  mb-1 ml-1">Extra KM Rate</label>
                            <input name="extra_km_price" type="number" defaultValue={editingCar.extra_km_price} className="w-full px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400  mb-1 ml-1">Extra HR Rate</label>
                            <input name="extra_hr_price" type="number" defaultValue={editingCar.extra_hr_price} className="w-full px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6 pt-2">
                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-black text-slate-400   ml-1">Available For</label>
                      <div className="flex flex-wrap items-center gap-6 px-1">
                        {['outstation', 'local', 'airport'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              name="categories" 
                              value={cat} 
                              defaultChecked={editingCar.available_categories?.includes(cat) ?? true}
                              className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" 
                            />
                            <span className="text-xs font-bold text-slate-600  group-hover:text-primary transition-colors">
                              {cat === 'airport' ? 'Airport Transfer' : cat}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-black text-slate-400   ml-1">AC Status</label>
                      <label className="flex items-center gap-2 cursor-pointer group px-1 w-fit">
                        <input 
                          type="checkbox" 
                          name="is_ac" 
                          defaultChecked={editingCar.is_ac ?? true}
                          className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-slate-900  group-hover:text-primary transition-colors">
                          AC Vehicle
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-black text-slate-400 ml-1">Fleet Settings</label>
                      <label className="flex items-center gap-2 cursor-pointer group px-1 w-fit">
                        <input 
                          type="checkbox" 
                          name="is_round_trip_only" 
                          defaultChecked={editingCar.is_round_trip_only ?? false}
                          className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                          Round Trip Only (Heavy Duty)
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-1">Seating Style (Optional)</label>
                      <input
                        name="seating_style"
                        defaultValue={editingCar.seating_style}
                        placeholder="e.g., 2+2 or 3+2"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingCar(null)}
                    className="flex-1 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black rounded-xl transition-all text-xs "
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-secondary text-white font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-black/10 text-xs  flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Route Modal */}
      <AnimatePresence>
        {viewingBooking && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
              onClick={() => setViewingBooking(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-8 max-w-2xl w-full border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-sm md:text-xl font-black text-secondary  ">Full Route Details</h3>
                <button onClick={() => setViewingBooking(null)} className="text-slate-300 hover:text-secondary">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4 md:space-y-6 text-left max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-8">
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300   block mb-0.5 md:mb-1">Category</span>
                    <p className="font-black text-[10px] md:text-sm text-slate-800  ">{(viewingBooking.trip_category || '-').replace('-', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300   block mb-0.5 md:mb-1">Type/Package</span>
                    <p className="font-black text-[10px] md:text-sm text-primary  ">
                      {viewingBooking.trip_category === 'local' 
                        ? viewingBooking.local_package 
                        : (viewingBooking.sub_type || '-').replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div className="relative pl-6 md:pl-8 border-l-2 border-dashed border-slate-100 space-y-4 md:space-y-6">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-7.5 md:-left-9.5 top-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 ring-4 ring-green-50" />
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300   block mb-0.5 md:mb-1">Pickup Point</span>
                    <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.pickup}</p>
                  </div>

                  {/* Stops */}
                  {viewingBooking.stops && viewingBooking.stops.map((stop, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-7.5 md:-left-9.5 top-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-400 ring-4 ring-blue-50" />
                      <span className="text-[8px] md:text-[10px] font-black text-slate-300   block mb-0.5 md:mb-1">Stop {idx + 1}</span>
                      <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{stop}</p>
                    </div>
                  ))}

                  {/* Drop off */}
                  <div className="relative">
                    <div className="absolute -left-7.5 md:-left-9.5 top-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300   block mb-0.5 md:mb-1">Final Destination</span>
                    <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.drop_off}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="text-left font-black">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-300   block">Customer</span>
                  <p className="text-[11px] md:text-sm text-slate-800">{viewingBooking.user_name}</p>
                </div>
                <button 
                  onClick={() => setViewingBooking(null)}
                  className="px-6 py-2.5 md:px-8 md:py-3 bg-secondary text-white font-black rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-lg text-[10px] md:text-sm  tracking-wide"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Reset Confirmation Modal */}
      <AnimatePresence>
        {resetConfirmType && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
              onClick={() => setResetConfirmType(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-[340px] md:max-w-sm w-full border border-slate-100 text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Database className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2  ">Reset {resetConfirmType}?</h3>
              <p className="text-slate-500 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed font-medium">
                This will permanently delete all {resetConfirmType} from your database. This action cannot be undone.
              </p>
              <div className="flex gap-2 md:gap-3">
                <button 
                  onClick={() => setResetConfirmType(null)}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl md:rounded-2xl transition-all text-[11px] md:text-sm "
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetData}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-500/20 text-[11px] md:text-sm "
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <TripPlanModal
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        formData={{
          date: viewingPlan?.booking_date,
          time: viewingPlan?.booking_time,
          returnDate: viewingPlan?.return_date,
          returnTime: viewingPlan?.return_time,
          estimatedDistance: viewingPlan?.audit_data?.roadDistance / (viewingPlan?.sub_type === 'two-way' ? 2 : 1),
          routeLegs: viewingPlan?.audit_data?.routeLegs,
          tripType: viewingPlan?.sub_type
        }}
        strategy={viewingPlan?.audit_data?.selectedScenario}
      />

      <FareDetailModal
        isOpen={!!viewingFare}
        onClose={() => setViewingFare(null)}
        car={data.cars.find(c => c.name === viewingFare?.car_type)}
        data={viewingFare?.audit_data}
      />
    </div>
  );
};

export default AdminDashboard;
