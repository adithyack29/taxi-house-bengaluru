import React from 'react';
import { Star, Quote, CheckCircle2, MessageSquare } from 'lucide-react';
import { testimonials } from '../data/testimonials';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const Testimonials = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="py-16 lg:py-28 bg-gray-50/50 overflow-hidden relative px-4">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none flex items-center justify-center">
        <MessageSquare size={800} strokeWidth={0.5} className="text-secondary" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 lg:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 text-primary font-bold tracking-tight text-xs mb-4"
          >
            <Star size={14} className="fill-primary" />
            <span>Real Customer Feedback</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-secondary leading-[1.1] tracking-tight"
          >
            Trusted By <span className="text-primary italic">Thousands</span> <br />
            Of Happy Riders
          </motion.h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div 
              key={testimonial.id} 
              variants={itemVariants}
              className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between relative group hover:border-primary/30 transition-all duration-300"
            >
              <Quote className="absolute top-8 right-8 text-gray-100 group-hover:text-primary/20 transition-colors" size={48} strokeWidth={3} />
              
              <div className="mb-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill={i < testimonial.rating ? "currentColor" : "none"} className={i < testimonial.rating ? "text-primary" : "text-gray-200"} size={16} />
                  ))}
                </div>
                
                <p className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg leading-relaxed italic relative z-10">
                  "{testimonial.text}"
                </p>
              </div>
              
              <div className="flex items-center pt-6 border-t border-gray-50 mt-auto">
                <div className="w-12 h-12 bg-secondary text-primary rounded-xl flex items-center justify-center font-black text-xl mr-4 shadow-md group-hover:scale-110 transition-transform">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-secondary leading-none mb-1 tracking-tight">{testimonial.name}</h4>
                  <div className="flex items-center text-[10px] font-bold text-green-600">
                    <CheckCircle2 size={10} className="mr-1" />
                    Verified Customer
                  </div>
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

