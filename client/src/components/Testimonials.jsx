import React from 'react';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '../data/testimonials';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const Testimonials = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="py-16 sm:py-24 bg-background overflow-hidden relative px-4">
      <div className="absolute top-0 right-0 p-16 sm:p-32 opacity-5 pointer-events-none">
        <Quote size={300} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary font-bold tracking-wider uppercase text-xs sm:text-sm">Customer Stories</span>
          <h2 className="text-3xl sm:text-4xl font-black text-secondary mt-2 mb-4">What Our Clients Say</h2>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div 
              key={testimonial.id} 
              variants={itemVariants}
              whileHover={isHoverable ? { y: -5, scale: 1.02 } : {}}
              className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between relative group"
            >
              <Quote className="absolute top-6 right-6 text-gray-200 group-hover-desktop-only:text-primary transition-colors" size={40} />
              
              <div className="flex gap-1 mb-6 text-primary">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} fill="currentColor" size={20} />
                ))}
              </div>
              
              <p className="text-gray-600 mb-8 italic text-lg leading-relaxed flex-grow z-10 relative">
                "{testimonial.text}"
              </p>
              
              <div className="flex items-center mt-auto">
                <div className="w-12 h-12 bg-secondary text-primary rounded-full flex items-center justify-center font-bold text-xl mr-4 shadow-md">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-secondary">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">Verified Customer</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
