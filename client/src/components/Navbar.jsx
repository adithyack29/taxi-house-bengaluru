import React, { useState, useEffect } from 'react';
import { Menu, X, PhoneCall, LogIn, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser } = useAuth();
  const isLoggedIn = !!currentUser;
  
  const location = useLocation();
  const navigate = useNavigate();
  const isHoverable = useHoverQuery();

  const toggleMenu = () => setIsOpen(!isOpen);
  const isActive = (path) => location.pathname === path;


  const linkStyles = (path) => 
    `text-lg font-medium transition-colors ${
      isActive(path) ? 'text-primary' : 'text-secondary hover-desktop-only:text-primary'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Taxi House Bengaluru" className="h-14 w-auto object-contain" />
            <span className="ml-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Bengaluru</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-8 items-center">
            <Link to="/" className={linkStyles('/')}>Home</Link>
            <Link to="/services" className={linkStyles('/services')}>Services</Link>
            <Link to="/fleet" className={linkStyles('/fleet')}>Fleet</Link>
            <Link to="/contact" className={linkStyles('/contact')}>Contact</Link>
            
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              <motion.a 
                href="tel:+919876543210" 
                whileHover={isHoverable ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-secondary text-primary px-5 py-2.5 rounded-full font-semibold shadow-sm"
              >
                <PhoneCall size={18} />
                <span>Call Now</span>
              </motion.a>

              {isLoggedIn ? (
                <motion.button 
                  onClick={() => navigate('/profile')}
                  whileHover={isHoverable ? { scale: 1.05 } : {}}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-gray-100 text-secondary px-5 py-2.5 rounded-full font-semibold cursor-pointer border border-transparent hover-desktop-only:border-gray-200 transition-colors"
                >
                  <User size={18} />
                  <span className="max-w-[150px] truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </motion.button>
              ) : (
                <motion.button 
                  onClick={() => navigate('/login')}
                  whileHover={isHoverable ? { scale: 1.05 } : {}}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-primary text-secondary px-6 py-2.5 rounded-xl border border-primary font-bold shadow-md hover-desktop-only:shadow-lg transition-shadow"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-secondary p-2 focus:outline-none relative z-50"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            
            {/* Slide-in Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl z-40 flex flex-col lg:hidden overflow-y-auto"
            >
              <div className="px-6 pt-24 pb-8 flex flex-col h-full">
                
                {/* Auth section top */}
                {isLoggedIn ? (
                  <div className="flex flex-col space-y-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <motion.button 
                      onClick={() => { toggleMenu(); navigate('/profile'); }}
                      className="flex items-center space-x-3 text-secondary font-bold p-1 rounded-xl transition-colors text-left"
                    >
                      <div className="bg-primary/20 p-2.5 rounded-full text-primary shrink-0">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-secondary text-sm font-black uppercase tracking-wider opacity-60">Account</span>
                        <span className="truncate text-lg">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                      </div>
                    </motion.button>
                  </div>
                ) : (
                  <div className="mb-8 border-b border-gray-100 pb-8">
                    <motion.button 
                      onClick={() => { toggleMenu(); navigate('/login'); }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center space-x-2 w-full bg-primary text-secondary px-5 py-4 rounded-2xl font-bold shadow-md"
                    >
                      <LogIn size={20} />
                      <span className="text-lg">Log In / Sign Up</span>
                    </motion.button>
                  </div>
                )}

                <div className="flex flex-col space-y-1 mb-auto">
                  <Link to="/" onClick={toggleMenu} className={`block py-4 px-4 rounded-xl text-xl font-bold transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-secondary'}`}>
                    Home
                  </Link>
                  <Link to="/services" onClick={toggleMenu} className={`block py-4 px-4 rounded-xl text-xl font-bold transition-colors ${isActive('/services') ? 'bg-primary/10 text-primary' : 'text-secondary'}`}>
                    Services
                  </Link>
                  <Link to="/fleet" onClick={toggleMenu} className={`block py-4 px-4 rounded-xl text-xl font-bold transition-colors ${isActive('/fleet') ? 'bg-primary/10 text-primary' : 'text-secondary'}`}>
                    Fleet
                  </Link>
                  <Link to="/contact" onClick={toggleMenu} className={`block py-4 px-4 rounded-xl text-xl font-bold transition-colors ${isActive('/contact') ? 'bg-primary/10 text-primary' : 'text-secondary'}`}>
                    Contact
                  </Link>
                </div>

                <div className="mt-8 space-y-4">
                  <motion.a 
                    href="tel:+919876543210" 
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center space-x-3 w-full bg-secondary text-white px-5 py-4 rounded-2xl font-bold shadow-lg"
                  >
                    <PhoneCall size={22} className="text-primary" />
                    <span className="text-lg">Call Us Now</span>
                  </motion.a>
                  <p className="text-center text-xs text-gray-400 font-medium pb-4">
                    © 2026 Taxi House Bengaluru. All rights reserved.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
