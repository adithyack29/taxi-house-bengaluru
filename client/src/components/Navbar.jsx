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
            <span className="text-2xl font-bold tracking-tight text-secondary">
              Taxi<span className="text-primary">House</span>
            </span>
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
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-40 flex flex-col lg:hidden overflow-y-auto"
            >
              <div className="px-6 pt-24 pb-6 flex flex-col space-y-4">
                
                {/* Auth section top */}
                {isLoggedIn ? (
                  <div className="flex flex-col space-y-3 mb-6 border-b border-gray-100 pb-6">
                    <motion.button 
                      onClick={() => { toggleMenu(); navigate('/profile'); }}
                      className="flex items-center space-x-3 text-secondary font-semibold p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
                        <User size={24} />
                      </div>
                      <span className="truncate text-lg">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <motion.button 
                      onClick={() => { toggleMenu(); navigate('/login'); }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center space-x-2 w-full bg-primary text-secondary px-5 py-3 rounded-xl font-bold shadow-md"
                    >
                      <LogIn size={20} />
                      <span>Log In / Sign Up</span>
                    </motion.button>
                  </div>
                )}

                <Link to="/" onClick={toggleMenu} className="block py-3 text-xl font-medium text-secondary">
                  Home
                </Link>
                <Link to="/services" onClick={toggleMenu} className="block py-3 text-xl font-medium text-secondary">
                  Services
                </Link>
                <Link to="/fleet" onClick={toggleMenu} className="block py-3 text-xl font-medium text-secondary">
                  Fleet
                </Link>
                <Link to="/contact" onClick={toggleMenu} className="block py-3 text-xl font-medium text-secondary">
                  Contact
                </Link>
                <motion.a 
                  href="tel:+919876543210" 
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 flex items-center justify-center space-x-2 w-full bg-secondary text-white px-5 py-3 rounded-xl font-semibold shadow-md"
                >
                  <PhoneCall size={20} />
                  <span>Call Us Now</span>
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
