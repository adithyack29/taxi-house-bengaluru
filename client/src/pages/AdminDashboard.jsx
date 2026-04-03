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
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="text-primary" />
              Owner Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Trial backend management system</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Reset Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsResetMenuOpen(!isResetMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
              >
                <RotateCcw size={14} className="text-orange-500" />
                <span>Reset Data</span>
                <ChevronDown size={14} className={`transition-transform ${isResetMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isResetMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsResetMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[110] overflow-hidden p-1"
                    >
                      <button 
                        onClick={() => { setResetConfirmType('bookings'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-[11px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Calendar size={14} />
                        Clear Bookings
                      </button>
                      <button 
                        onClick={() => { setResetConfirmType('messages'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-[11px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        <MessageSquare size={14} />
                        Clear Messages
                      </button>
                      <div className="h-px bg-slate-50 my-1 mx-2" />
                      <button 
                        onClick={() => { setResetConfirmType('cars'); setIsResetMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-[11px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Car size={14} />
                        Reset Fleet (Cars)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold"
            >
              <Power size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'cars', label: 'Manage Cars', icon: Car },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary text-secondary shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="p-4 sm:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'bookings' && (
                  <motion.div
                    key="bookings"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-4 font-bold text-slate-800 uppercase text-xs tracking-widest">Customer</th>
                            <th className="pb-4 font-bold text-slate-800 uppercase text-xs tracking-widest px-4 text-center">Trip Type</th>
                            <th className="pb-4 font-bold text-slate-800 uppercase text-xs tracking-widest">Schedule</th>
                            <th className="pb-4 font-bold text-slate-800 uppercase text-xs tracking-widest">Vehicle</th>
                            <th className="pb-4 font-bold text-slate-800 uppercase text-xs tracking-widest text-center">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4">
                                <div className="text-sm font-bold text-slate-900">{booking.user_name}</div>
                                <div className="text-xs font-semibold text-slate-50">{booking.phone}</div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">
                                    {(booking.trip_category || 'Trip').replace('-', ' ')}
                                  </span>
                                  <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full mb-2">
                                    {booking.trip_category === 'local' 
                                      ? booking.local_package 
                                      : (booking.sub_type || '').replace('-', ' ')}
                                  </span>
                                  <button 
                                    onClick={() => setViewingBooking(booking)}
                                    className="text-[10px] font-black text-secondary/40 uppercase hover:text-primary transition-colors flex items-center gap-1"
                                  >
                                    <span>Route Info</span>
                                    {booking.stops?.length > 0 && <span>(+{booking.stops.length})</span>}
                                  </button>
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="text-sm font-black text-slate-900">
                                  {booking.booking_date?.split('-').reverse().join('/')}
                                </div>
                                <div className="text-xs text-slate-500 font-bold mb-1">{booking.booking_time?.substring(0, 5)}</div>
                                {booking.return_date && (
                                  <div className="flex flex-col border-t border-slate-50 pt-1 mt-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase leading-none">Return</span>
                                    <span className="text-[11px] font-bold text-orange-600">
                                      {booking.return_date.split('-').reverse().join('/')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-4">
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-black">
                                  {booking.car_type}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <a 
                                    href={`https://wa.me/${formatPhoneForWhatsApp(booking.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-[#25D366]/10 rounded-full transition-all group/wa"
                                    title="WhatsApp Customer"
                                  >
                                    <WhatsAppIcon size={18} className="text-[#25D366]" />
                                  </a>
                                  <a 
                                    href={`tel:${booking.phone}`}
                                    className="p-1.5 hover:bg-blue-500/10 rounded-full transition-all group/call"
                                    title="Call Customer"
                                  >
                                    <Phone size={18} className="text-blue-500" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {data.bookings.length === 0 && (
                            <tr>
                              <td colSpan="5" className="py-12 text-center text-slate-400">No bookings found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
                      <div key={msg.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">{msg.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span>{msg.email}</span>
                              <span>•</span>
                              <div className="flex items-center gap-2">
                                <span>{msg.phone}</span>
                                <a 
                                  href={`https://wa.me/${formatPhoneForWhatsApp(msg.phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-[#25D366]/10 rounded-full transition-all group/wa"
                                  title="Chat on WhatsApp"
                                >
                                  <WhatsAppIcon size={18} className="text-[#25D366]" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                    {data.messages.length === 0 && (
                      <div className="py-12 text-center text-slate-400">No messages found</div>
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
                    <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-primary" />
                        Add New Vehicle
                      </h3>
                      <form onSubmit={addCar} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <input name="name" placeholder="Car Name (e.g. Innova Hycross)" className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <input name="seats" type="number" min="1" placeholder="Seats" className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <input name="price" type="number" min="0" step="0.1" placeholder="Price/KM" className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none" required />
                        <button type="submit" className="bg-primary text-secondary font-bold py-2 rounded-xl hover:bg-primary/90 transition-all text-sm shadow-md">
                          Add Car
                        </button>
                      </form>
                    </div>

                    {/* Cars List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.cars.map((car) => (
                        <div key={car.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                              <Car />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{car.name}</h4>
                              <div className="text-xs text-slate-500">
                                {car.seats} Seats • ₹{car.price_per_km}/km
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleCarAvailability(car.id, car.is_available)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                car.is_available 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {car.is_available ? <CheckCircle size={14} /> : <XCircle size={14} />}
                              {car.is_available ? 'Available' : 'Unavailable'}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteId(car.id); }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={18} />
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
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Vehicle?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                This action cannot be undone. This vehicle will be permanently removed from your fleet.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteCar}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
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
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-secondary uppercase tracking-tight">Full Route Details</h3>
                <button onClick={() => setViewingBooking(null)} className="text-slate-400 hover:text-secondary">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6 text-left max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Category</span>
                    <p className="font-bold text-slate-800 uppercase tracking-tight">{(viewingBooking.trip_category || '-').replace('-', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Type/Package</span>
                    <p className="font-bold text-primary uppercase tracking-tight">
                      {viewingBooking.trip_category === 'local' 
                        ? viewingBooking.local_package 
                        : (viewingBooking.sub_type || '-').replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div className="relative pl-8 border-l-2 border-dashed border-slate-100 space-y-6">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-9.5 top-0 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-50" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Pickup Point</span>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.pickup}</p>
                  </div>

                  {/* Stops */}
                  {viewingBooking.stops && viewingBooking.stops.map((stop, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-9.5 top-0 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-50" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Stop {idx + 1}</span>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{stop}</p>
                    </div>
                  ))}

                  {/* Drop off */}
                  <div className="relative">
                    <div className="absolute -left-9.5 top-0 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Final Destination</span>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{viewingBooking.drop_off}</p>
                  </div>

                  {viewingBooking.return_date && (
                    <div className="relative pt-2">
                       <div className="absolute -left-9.5 top-2 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-50" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Return Date</span>
                       <p className="text-sm font-bold text-orange-600">
                         {viewingBooking.return_date.split('-').reverse().join('/')}
                       </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Customer</span>
                  <p className="font-bold text-slate-800">{viewingBooking.user_name}</p>
                </div>
                <button 
                  onClick={() => setViewingBooking(null)}
                  className="px-8 py-3 bg-secondary text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg"
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
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="text-red-500" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize">Reset {resetConfirmType}?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                This will permanently delete all {resetConfirmType} from your database. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setResetConfirmType(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetData}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
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
