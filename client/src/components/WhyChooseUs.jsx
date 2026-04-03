import React from 'react';
import { Clock, Users, ShieldCheck, ThumbsUp, Star, Award, HeartHandshake, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const features = [
  {
    icon: Award,
    title: 'Top Rated Service',
    desc: 'Consistently rated 4.8+ by thousands of happy commuters across Bengaluru.'
  },
  {
    icon: ShieldCheck,
    title: 'Safety First',
    desc: 'Background-verified professional drivers and real-time GPS tracking for every ride.'
  },
  {
    icon: Clock,
    title: 'Zero Wait Time',
    desc: 'Our optimized dispatch system ensures we are always at your doorstep on time.'
  },
  {
    icon: HeartHandshake,
    title: 'Transparent Pricing',
    desc: 'No hidden charges. What you see on the estimate is exactly what you pay.'
  }
];

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

const WhyChooseUs = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-white overflow-hidden px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col lg:flex-row items-start justify-between mb-10 sm:mb-16 gap-6 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-left lg:max-w-2xl"
          >
            <div className="inline-flex items-center space-x-2 text-primary font-bold tracking-tight text-[10px] sm:text-xs mb-3 sm:mb-4">
              <Zap size={12} sm:size={14} className="fill-primary" />
              <span>The Taxi House Advantage</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-secondary leading-[1.1] tracking-tight">
              Why Choose Us For <br />
              <span className="text-primary">Your Commute?</span>
            </h2>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-500 font-medium max-w-md text-sm sm:text-base leading-relaxed"
          >
            We provide a premium travel experience that combines local expertise with professional standards across Karnataka.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="group p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-secondary text-primary mb-4 sm:mb-6 transition-transform">
                  <Icon size={20} sm:size={24} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-secondary mb-2 sm:mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

export default WhyChooseUs;

