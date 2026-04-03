import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppButton';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple message handler could be added here
    alert('Thank you for contacting Taxi House! We will get back to you shortly.');
  };

  const contactInfo = [
    {
      title: 'Phone',
      description: '24/7 Support',
      detail: '+91 77959 65640',
      href: 'tel:+917795965640',
      icon: Phone,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary'
    },
    {
      title: 'WhatsApp',
      description: 'Quick Response',
      detail: '+91 77959 65640',
      href: 'https://wa.me/917795965640',
      icon: WhatsAppIcon,
      bgColor: 'bg-[#25D366]/10',
      textColor: 'text-[#25D366]'
    },
    {
      title: 'Email',
      description: 'Our team is here to help.',
      detail: 'taxihousebengaluru@gmail.com',
      href: 'mailto:taxihousebengaluru@gmail.com',
      icon: Mail,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary'
    },
    {
      title: 'Office',
      description: '',
      detail: 'Shop No. 1, 2nd Floor, Survey No. 2, Near VNR Fuelling Station, Yadavanahalli, Bengaluru - 562107',
      icon: MapPin,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-50 min-h-screen py-6 sm:py-16 lg:py-24 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.8fr] gap-4 sm:gap-10 items-start">
          
          {/* Left Column: Info Cards */}
          <div className="space-y-3 sm:space-y-6">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-3 sm:gap-5 hover:shadow-md transition-shadow"
                >
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-full ${info.bgColor} flex items-center justify-center ${info.textColor}`}>
                    <Icon size={18} sm:size={26} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-base sm:text-xl font-bold text-secondary mb-0.5 sm:mb-1">{info.title}</h3>
                    <p className="text-[10px] sm:text-sm text-gray-400 font-medium mb-1.5 sm:mb-3">{info.description}</p>
                    {info.href ? (
                      <a href={info.href} className="text-sm sm:text-lg font-extrabold text-primary hover:underline transition-all block break-all">
                        {info.detail}
                      </a>
                    ) : (
                      <p className="text-xs sm:text-base font-semibold text-secondary leading-relaxed break-words">
                        {info.detail}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-5 sm:p-10 md:p-12 rounded-[1.25rem] sm:rounded-[2rem] shadow-xl border border-gray-50 h-full"
          >
            <h2 className="text-xl sm:text-3xl font-extrabold text-secondary mb-5 sm:mb-8 leading-tight">
              Get in Touch With Our <br className="hidden sm:block" />
              <span className="text-primary">Cab Service in Bangalore</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="name" className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="phone" className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="email" className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="message" className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wide">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium resize-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 sm:py-5 bg-primary text-secondary font-bold text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary/20 mt-2 sm:mt-4 group"
              >
                <Send size={16} sm:size={20} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                Send Message
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
