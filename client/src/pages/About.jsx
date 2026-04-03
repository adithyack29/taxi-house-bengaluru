import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Clock, Users, MapPin, Award, HeartHandshake, Zap, ChevronRight } from 'lucide-react';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const values = [
    {
      title: 'Safety First',
      desc: 'All our drivers undergo rigorous background checks and training to ensure your peace of mind.',
      icon: Shield,
    },
    {
      title: 'Transparent Pricing',
      desc: 'No hidden costs or surge surprises. What you see is exactly what you pay for your journey.',
      icon: HeartHandshake,
    },
    {
      title: 'Punctuality',
      desc: 'Our advanced dispatch system ensures we reach your doorstep on time, every time.',
      icon: Zap,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-background min-h-screen pt-10"
    >
      {/* Hero Section */}
      <section className="relative h-[45vh] flex items-center justify-center overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 z-0 scale-110">
          <img 
            src="/about-1.png" 
            alt="Taxi House Bengaluru" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/80 to-secondary" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              Our Story
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              Reliability is our <br />
              <span className="text-primary">Second Name</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Serving Bengaluru and beyond since 2024, Taxi House is the gold standard in premium, safe, and professional transportation.
            </p>
          </motion.div>
        </div>
      </section>


      {/* Story & Image Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-secondary tracking-tight">
                Deep Roots in the <br />
                <span className="text-primary">Silicon Valley of India</span>
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  Established in 2024, Taxi House grew from a single-car operation to one of Bengaluru's most trusted name in travel. We understand the unique pulse of this city—the fast-paced professional life, the vibrant tourism, and the need for reliable transport at any hour.
                </p>
                <p>
                  We are not just a taxi service; we are your local travel partners who know the best routes through Whitefield, the fastest ways to the airport, and the hidden gems across Karnataka.
                </p>
              </div>
              
              <div className="pt-4">
                <img 
                  src="/about-2.png" 
                  alt="Our Fleet" 
                  className="rounded-3xl shadow-2xl shadow-primary/20 aspect-video object-cover w-full scale-95 hover:scale-100 transition-transform duration-500"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="bg-secondary p-10 md:p-12 rounded-[2.5rem] text-white shadow-2xl">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                   <div className="w-2 h-8 bg-primary rounded-full" />
                   Our Mission
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed italic mb-8">
                  "To provide safe, reliable, and premium transportation solutions that allow our customers to navigate Bengaluru with complete peace of mind."
                </p>
                
                <div className="space-y-6">
                  {values.map((v, i) => {
                    const VIcon = v.icon;
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
                          <VIcon size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">{v.title}</h4>
                          <p className="text-sm text-gray-400 font-medium leading-normal">{v.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section (Simple) */}
      <section className="bg-primary py-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-8">
            Experience the difference <br /> with Taxi House today.
          </h2>
          <button className="px-8 py-4 bg-secondary text-primary font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl group">
            <Link to="/#booking" className="flex items-center gap-2">
              Book Your Ride Now
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </button>
        </div>
      </section>
    </motion.div>
  );
};

export default About;
