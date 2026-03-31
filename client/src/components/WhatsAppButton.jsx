import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const WhatsAppButton = () => {
  const whatsappNumber = "917795965640";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi,%20I%20would%20like%20to%20book%20a%20taxi.%20Need%20more%20details.`;

  return (
    <motion.a 
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-xl flex items-center justify-center cursor-pointer"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={32} />
    </motion.a>
  );
};

export default WhatsAppButton;
