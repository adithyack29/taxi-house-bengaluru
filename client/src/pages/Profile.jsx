import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Phone, Calendar, MapPin, AlertCircle, Save } from 'lucide-react';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    homeAddress: '',
    emergencyContact: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing data
  useEffect(() => {
    if (currentUser) {
      // Basic Firebase Auth data
      const baseData = {
        displayName: currentUser.displayName || '',
        phoneNumber: currentUser.phoneNumber || '',
      };
      
      // Load extended data from localStorage
      const storedData = localStorage.getItem(`user_profile_${currentUser.uid}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setFormData({ 
          ...baseData, 
          ...parsedData,
          // Prioritize the phone number from Firebase Auth if it exists
          phoneNumber: baseData.phoneNumber || parsedData.phoneNumber || ''
        });
      } else {
        setFormData(prev => ({ ...prev, ...baseData }));
      }
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      
      // 1. Update core Firebase Auth profile
      if (formData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: formData.displayName });
      }

      // 2. Save extended details to database (localStorage for this demo)
      const extendedData = {
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        homeAddress: formData.homeAddress,
        emergencyContact: formData.emergencyContact
      };
      localStorage.setItem(`user_profile_${currentUser.uid}`, JSON.stringify(extendedData));
      
      setMessage('Profile updated successfully!');
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-xl text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  const displayHeaderName = currentUser.displayName || 'User';

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10"
      >
        <div className="flex items-center space-x-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
          <div className="bg-primary/20 p-3 sm:p-4 rounded-full text-primary">
            <User size={32} sm:size={40} />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-secondary">{displayHeaderName}</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <Phone size={16} className="mr-2" />
              {currentUser.phoneNumber || 'No phone number linked'}
            </p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm border border-green-100">{message}</div>}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  required
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-secondary transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="tel" 
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91 98765 43210" 
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-secondary transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="date" 
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-secondary transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
              <div className="relative group">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="tel" 
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency Phone Number" 
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-secondary transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Home Address (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Address / Default Pickup Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <textarea 
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleChange}
                  placeholder="Enter your full address for quick taxi pickups..." 
                  rows={3}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-secondary transition-all resize-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 sm:pt-6 mt-4 sm:mt-8">
            <motion.button 
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="flex-1 flex justify-center items-center space-x-2 bg-primary text-secondary py-3 sm:py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 text-sm sm:text-base"
            >
              <Save size={18} sm:size={20} />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </motion.button>
            
            <motion.button 
              type="button"
              onClick={handleLogout}
              whileTap={{ scale: 0.97 }}
              className="flex-1 sm:flex-none flex justify-center items-center space-x-2 border-2 border-red-100 text-red-600 px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm sm:text-base"
            >
              <LogOut size={18} sm:size={20} />
              <span>Log Out</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
