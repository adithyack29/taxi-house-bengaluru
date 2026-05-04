import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, Home, Calendar, MapPin, IndianRupee, RotateCcw, ChevronLeft, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus('error');
        setErrorMessage('Order ID is missing from URL.');
        return;
      }

      setStatus('verifying');

      try {
        // Give Cashfree a second to process the webhooks/internal state
        await new Promise(resolve => setTimeout(resolve, 1500));

        const verifyRes = await fetch('/api/cashfree-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        
        if (!verifyRes.ok) {
          const errData = await verifyRes.json();
          const msg = errData.details || errData.error || 'Server error during verification';
          setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
          setStatus('error');
          return;
        }
        
        const verifyData = await verifyRes.json();

        console.log('[Verify] verifyData:', verifyData);

        if (verifyData.status === 'SUCCESS') {
          // 2. Fetch booking details from Supabase
          // The status update was handled by the backend /api/cashfree-verify
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('cashfree_order_id', orderId);

          if (error) {
            console.error('[Verify] Supabase fetch error:', error);
            setErrorMessage(`Database Error: ${error.message}`);
            throw error;
          }

          if (!data || data.length === 0) {
            console.error('[Verify] No booking found with order_id:', orderId);
            setErrorMessage(`No booking record found for Order: ${orderId}`);
            setStatus('error');
            return;
          }

          setBooking(data[0]);
          setStatus('success');
        } else if (verifyData.status === 'PENDING') {
          setStatus('pending_confirmation');
        } else {
          console.error('[Verify] Cashfree verification status:', verifyData.status, verifyData.message);
          setErrorMessage(verifyData.message || `Verification status: ${verifyData.status}`);
          setStatus('error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setErrorMessage(err.message || 'An unexpected error occurred during verification.');
        setStatus('error');
      }
    };

    verifyPayment();
  }, [orderId, navigate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRetry = () => {
    window.location.reload();
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 text-center max-w-sm w-full"
        >
          <Loader2 className="animate-spin text-primary mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-black text-secondary mb-2 tracking-tight">Verifying Payment</h2>
          <p className="text-gray-400 font-medium text-sm">Please wait while we confirm your transaction with Cashfree...</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'pending_confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-secondary mb-2 tracking-tight">Payment Pending</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            We're waiting for Cashfree to confirm your payment. This usually takes a few seconds.
          </p>
          <button 
            onClick={handleManualRetry}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-secondary px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-primary/90 transition-all mb-4"
          >
            <RotateCcw size={18} />
            Check Again
          </button>
          <button onClick={() => navigate(-1)} className="w-full text-gray-400 hover:text-secondary text-xs font-bold uppercase tracking-widest border-b border-transparent hover:border-gray-200 transition-all inline-flex items-center justify-center gap-1">
            <ChevronLeft size={14} /> Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 max-w-sm w-full"
          >
            <AlertCircle size={60} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-secondary mb-2 tracking-tight">Verification Failed</h2>
            
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 text-left">
              <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-2 border-b border-red-100 pb-1">Error Information</p>
              <p className="text-red-800 text-sm font-bold leading-relaxed">{errorMessage}</p>
              
              {/* Added tech details display */}
              {errorMessage ? (
                <div className="mt-3 pt-3 border-t border-red-100">
                  <p className="text-[9px] text-red-400 font-bold uppercase mb-1">Technical Details</p>
                  <pre className="text-[10px] bg-white/50 p-2 rounded-lg break-all whitespace-pre-wrap font-mono text-red-600 border border-red-100/50 max-h-48 overflow-y-auto w-full">
                    {errorMessage}
                  </pre>
                </div>
              ) : null}
            </div>

            <p className="text-gray-500 mb-8 text-xs leading-relaxed font-medium">
              Order ID: <span className="font-bold text-secondary">{orderId}</span>
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleManualRetry}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-secondary px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-primary/90 transition-all"
              >
                <RotateCcw size={18} />
                Try Verify Again
              </button>
              <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-secondary/90 transition-all"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            </div>
          </motion.div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 max-w-xl w-full overflow-hidden"
      >
        <div className="bg-green-500 p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle size={120} />
            </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/30"
          >
            <CheckCircle size={48} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Booking Confirmed!</h2>
          <p className="text-white/80 font-medium">Your ride has been successfully scheduled.</p>
        </div>

        <div className="p-8 sm:p-12 space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
                    <div className="flex items-center gap-2 group">
                      <p className="text-sm font-black text-secondary">{orderId}</p>
                      <button 
                        onClick={copyToClipboard}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-primary relative"
                        title="Copy Booking ID"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-white text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-tighter">Copied!</span>
                        )}
                      </button>
                    </div>
                </div>
                {booking && (
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
                        <p className="text-sm font-black text-secondary">{booking.car_type}</p>
                    </div>
                )}
            </div>

            {booking && (
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                    <div className="flex items-start gap-4">
                        <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                            <p className="text-sm font-bold text-secondary line-clamp-2">{booking.pickup}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
                        <Calendar size={18} className="text-primary shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                            <p className="text-sm font-bold text-secondary">{booking.booking_date} at {booking.booking_time}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
                        <IndianRupee size={18} className="text-primary shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount Paid (Token)</p>
                            <p className="text-sm font-bold text-secondary">₹{booking.amount}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <Link 
                    to="/" 
                    className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-secondary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                    <Home size={18} />
                    Back to Homepage
                </Link>
            </div>
        </div>
      </motion.div>

      <div className="mt-12 text-center text-gray-400 max-w-md">
          <p className="text-xs font-medium">A confirmation SMS and Email has been sent to your registered contact details. For any assistance, please contact +91 77959 65640.</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
