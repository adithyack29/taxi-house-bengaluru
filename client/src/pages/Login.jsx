import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useHoverQuery } from '../hooks/useHoverQuery';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Phone, 1: OTP
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const isHoverable = useHoverQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier;
    const formattedNumber = `+91${phoneNumber}`;

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep(1);
      setResendTimer(60);
    } catch (err) {
      console.error('OTP Send Error:', err);
      setError(err.message.includes('reCAPTCHA') ? 'reCAPTCHA verification failed. Please try again.' : 'Failed to send OTP. Please check the number.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(otp);
      // Success will be handled by the AuthContext listener
      navigate('/');
    } catch (err) {
      console.error('OTP Verify Error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div id="recaptcha-container"></div>

      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-4">
            <img src="/logo.png" alt="Taxi House Bengaluru" className="h-24 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-extrabold text-secondary mb-2">Welcome Back</h2>
          <p className="text-gray-500 text-lg">
            {step === 0 ? "Login with your phone number" : "Enter the verification code"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center border border-red-100"
          >
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.form 
              key="phone-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp} 
              className="space-y-6"
            >
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-gray-500 font-bold border-r pr-3 mr-3">
                    +91
                  </div>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-20 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-secondary text-lg tracking-wider"
                  />
                </div>
              </div>

              <motion.button 
                type="submit" 
                whileHover={isHoverable && !isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading || phoneNumber.length < 10}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-secondary bg-primary hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Get OTP <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp} 
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-sm font-bold text-gray-700">Verification Code</label>
                  <button 
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-secondary text-xl tracking-[0.5em] font-bold"
                  />
                </div>
              </div>

              <motion.button 
                type="submit" 
                whileHover={isHoverable && !isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading || otp.length < 6}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-secondary bg-primary hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </motion.button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-400">Resend OTP in <span className="font-bold">{resendTimer}s</span></p>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleSendOtp}
                    className="text-sm text-secondary font-bold hover:text-primary transition-colors"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center border-t border-gray-100 pt-8">
          <p className="text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-secondary font-bold hover:text-primary transition-colors underline decoration-primary/30 decoration-2 underline-offset-4">
              Create one here
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
