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
  Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WhatsAppIcon } from '../components/WhatsAppButton';

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
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const [resetConfirmType, setResetConfirmType] = useState(null); // 'bookings', 'messages', 'cars'

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
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        setData(prev => ({ ...prev, bookings: bookings || [] }));
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
          .order('name', { ascending: true });
        setData(prev => ({ ...prev, cars: cars || [] }));
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
      seats: parseInt(formData.get('seats')),
      price_per_km: parseFloat(formData.get('price')),
      is_available: true
    };

    try {
      await supabase.from('cars').insert([newCar]);
      e.target.reset();
      fetchData();
    } catch (error) {
      console.error('Error adding car:', error);
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
    <div className="min-h-screen bg-slate-50 pt-10 md:pt-20 pb-8 flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="text-primary" size={20} />
              Owner Dashboard
            </h1>
            <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-tight opacity-70">Backend management system</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Reset Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsResetMenuOpen(!isResetMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-black text-[10px] hover:bg-slate-50 transition-all shadow-sm"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-[10px] font-black"
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 md:px-6 py-2 md:py-2.5 rounded-lg font-black text-[11px] md:text-sm transition-all whitespace-nowrap ${
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
                            <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Customer</th>
                            <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4 text-center">Trip Type</th>
                            <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Schedule</th>
                            <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Vehicle</th>
                            <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3">
                                <div className="text-sm font-black text-slate-900">{booking.user_name}</div>
                                <div className="text-[10px] font-bold text-slate-400">{booking.phone}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-0.5">
                                    {(booking.trip_category || 'Trip').replace('-', ' ')}
                                  </span>
                                  <span className="text-[9px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-full mb-1">
                                    {booking.trip_category === 'local' 
                                      ? booking.local_package 
                                      : (booking.sub_type || '').replace('-', ' ')}
                                  </span>
                                  <button 
                                    onClick={() => setViewingBooking(booking)}
                                    className="text-[9px] font-black text-slate-300 uppercase hover:text-primary transition-colors flex items-center gap-1"
                                  >
                                    <span>Route</span>
                                    {booking.stops?.length > 0 && <span>(+{booking.stops.length})</span>}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="text-[11px] font-black text-slate-900">
                                  {booking.booking_date?.split('-').reverse().join('/')}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold">{booking.booking_time?.substring(0, 5)}</div>
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">
                                  {booking.car_type}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <a 
                                    href={`https://wa.me/${formatPhoneForWhatsApp(booking.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-[#25D366]/10 rounded-lg transition-all"
                                  >
                                    <WhatsAppIcon size={14} className="text-[#25D366]" />
                                  </a>
                                  <a 
                                    href={`tel:${booking.phone}`}
                                    className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-all"
                                  >
                                    <Phone size={14} className="text-blue-500" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {data.bookings.map((booking) => (
                        <div key={booking.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-[13px] font-black text-slate-900">{booking.user_name}</div>
                              <div className="text-[10px] font-bold text-slate-400">{booking.phone}</div>
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
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Trip Type</span>
                              <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                                {(booking.trip_category || 'Trip').replace('-', ' ')}
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Vehicle</span>
                              <div className="text-[10px] font-black text-primary uppercase truncate">
                                {booking.car_type}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-300 uppercase">Date</span>
                                <span className="text-[10px] font-bold text-slate-700">{booking.booking_date?.split('-').reverse().join('/')}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-300 uppercase">Time</span>
                                <span className="text-[10px] font-bold text-slate-700">{booking.booking_time?.substring(0, 5)}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setViewingBooking(booking)}
                              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"
                            >
                              Route Info
                              {booking.stops?.length > 0 && <span className="text-primary">+{booking.stops.length}</span>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(data.bookings.length === 0) && (
                      <div className="py-12 text-center text-slate-400 font-bold text-sm tracking-tight">No bookings found</div>
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
                            {new Date(msg.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px] md:text-sm bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-slate-100 font-medium">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                    {data.messages.length === 0 && (
                      <div className="py-12 text-center text-slate-400 font-bold text-sm tracking-tight">No messages found</div>
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
                    {/* Add Car Form */}
                    <div className="mb-6 md:mb-10 bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-dashed border-slate-200">
                      <h3 className="font-black text-xs md:text-sm text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <Plus size={16} className="text-primary" />
                        Add New Vehicle
                      </h3>
                      <form onSubmit={addCar} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <input name="name" placeholder="Name" className="col-span-2 md:col-span-1 px-3 py-2 rounded-lg border border-slate-200 text-[11px] md:text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <input name="seats" type="number" min="1" placeholder="Seats" className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] md:text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <input name="price" type="number" min="0" step="0.1" placeholder="₹/KM" className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] md:text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <button type="submit" className="col-span-2 md:col-span-1 bg-primary text-secondary font-black py-2 rounded-lg hover:bg-primary/90 transition-all text-[11px] md:text-sm shadow-md uppercase">
                          Add Car
                        </button>
                      </form>
                    </div>

                    {/* Cars List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                      {data.cars.map((car) => (
                        <div key={car.id} className="flex items-center justify-between p-3 md:p-5 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-lg md:rounded-xl flex items-center justify-center text-slate-300">
                              <Car size={20} />
                            </div>
                            <div>
                              <h4 className="font-black text-sm md:text-lg text-slate-900 leading-tight">{car.name}</h4>
                              <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-tight">
                                {car.seats} Seats • ₹{car.price_per_km}/km
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <button 
                              onClick={() => toggleCarAvailability(car.id, car.is_available)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase ${
                                car.is_available 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {car.is_available ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              <span className="hidden xs:inline">{car.is_available ? 'Available' : 'Disabled'}</span>
                              <span className="xs:hidden">{car.is_available ? 'ON' : 'OFF'}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteId(car.id); }}
                              className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
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
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Delete Vehicle?</h3>
              <p className="text-slate-500 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed font-medium">
                This action cannot be undone. This vehicle will be permanently removed from your fleet.
              </p>
              <div className="flex gap-2 md:gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl md:rounded-2xl transition-all text-[11px] md:text-sm uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteCar}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-500/20 text-[11px] md:text-sm uppercase"
                >
                  Delete
                </button>
              </div>
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
                <h3 className="text-sm md:text-xl font-black text-secondary uppercase tracking-tight">Full Route Details</h3>
                <button onClick={() => setViewingBooking(null)} className="text-slate-300 hover:text-secondary">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4 md:space-y-6 text-left max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-8">
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5 md:mb-1">Category</span>
                    <p className="font-black text-[10px] md:text-sm text-slate-800 uppercase tracking-tight">{(viewingBooking.trip_category || '-').replace('-', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5 md:mb-1">Type/Package</span>
                    <p className="font-black text-[10px] md:text-sm text-primary uppercase tracking-tight">
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
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5 md:mb-1">Pickup Point</span>
                    <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.pickup}</p>
                  </div>

                  {/* Stops */}
                  {viewingBooking.stops && viewingBooking.stops.map((stop, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-7.5 md:-left-9.5 top-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-400 ring-4 ring-blue-50" />
                      <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5 md:mb-1">Stop {idx + 1}</span>
                      <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{stop}</p>
                    </div>
                  ))}

                  {/* Drop off */}
                  <div className="relative">
                    <div className="absolute -left-7.5 md:-left-9.5 top-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                    <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5 md:mb-1">Final Destination</span>
                    <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.drop_off}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="text-left font-black">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block">Customer</span>
                  <p className="text-[11px] md:text-sm text-slate-800">{viewingBooking.user_name}</p>
                </div>
                <button 
                  onClick={() => setViewingBooking(null)}
                  className="px-6 py-2.5 md:px-8 md:py-3 bg-secondary text-white font-black rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-lg text-[10px] md:text-sm uppercase tracking-wide"
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
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Reset {resetConfirmType}?</h3>
              <p className="text-slate-500 text-[11px] md:text-sm mb-6 md:mb-8 leading-relaxed font-medium">
                This will permanently delete all {resetConfirmType} from your database. This action cannot be undone.
              </p>
              <div className="flex gap-2 md:gap-3">
                <button 
                  onClick={() => setResetConfirmType(null)}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl md:rounded-2xl transition-all text-[11px] md:text-sm uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetData}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-500/20 text-[11px] md:text-sm uppercase"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
