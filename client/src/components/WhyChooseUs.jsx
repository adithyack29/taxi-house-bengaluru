import React from 'react';
import { Clock, Users, ShieldCheck, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverQuery } from '../hooks/useHoverQuery';

const features = [
  {
    icon: Clock,
    title: '24/7 Service',
    desc: 'We are available round-the-clock to ensure you never miss a flight or an important meeting.'
  },
  {
    icon: Users,
    title: 'Professional Drivers',
    desc: 'All our drivers are background-verified, courteous, and trained for safe driving.'
  },
  {
    icon: ShieldCheck,
    title: 'On-Time Pickup',
    desc: 'Punctuality is our priority. We guarantee timely pickups and drops across Bengaluru.'
  },
  {
    icon: ThumbsUp,
    title: 'Clean Vehicles',
    desc: 'Well-maintained and sanitized cars for a comfortable and hygienic travel experience.'
  }
];

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

const WhyChooseUs = () => {
  const isHoverable = useHoverQuery();

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold text-secondary mb-4">Why Choose Taxi House?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            We prioritize your safety, comfort, and time. Here's why thousands of customers in Bengaluru trust us.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                whileHover={isHoverable ? { y: -5, backgroundColor: 'var(--color-bg-gray-50)' } : {}}
                className="text-center p-6 rounded-2xl transition-colors"
              >
                <motion.div 
                  whileHover={isHoverable ? { scale: 1.1 } : {}}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6"
                >
                  <Icon size={36} />
                </motion.div>
                <h3 className="text-xl font-bold text-secondary mb-3">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
