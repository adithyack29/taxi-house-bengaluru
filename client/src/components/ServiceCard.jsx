import React from 'react';
import { MapPin, Plane, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const iconMap = {
  MapPin: MapPin,
  Plane: Plane,
  Mountain: Mountain
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const ServiceCard = ({ service }) => {
  const IconComponent = iconMap[service.icon];
  const isHoverable = useHoverQuery();

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={isHoverable ? { scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" } : {}}
      className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 transition-colors group"
    >
      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover-desktop-only:bg-primary group-hover-desktop-only:text-white transition-colors">
        {IconComponent && <IconComponent size={32} />}
      </div>
      <h3 className="text-xl font-bold text-secondary mb-3">{service.title}</h3>
      <p className="text-gray-600 leading-relaxed">
        {service.description}
      </p>
    </motion.div>
  );
};

export default ServiceCard;
