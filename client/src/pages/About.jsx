import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, HeartHandshake, Zap, ChevronRight } from 'lucide-react';

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
      className="bg-background min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden bg-secondary text-white pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/about-1.png" 
            alt="Taxi House Bengaluru" 
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/80 to-secondary" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 sm:mb-8 border border-primary/20">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-10 leading-[1.1]">
              Reliability is our <br className="hidden sm:block" />
              <span className="text-primary">Second Name</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
              Serving Bengaluru and beyond since 2025, Taxi House is the gold standard in premium, safe, and professional transportation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story & Image Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 text-center lg:text-left"
            >
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-secondary tracking-tight leading-[1.1] max-w-2xl mx-auto lg:mx-0">
                Deep Roots in the <span className="text-primary">Silicon Valley of India</span>
              </h2>
              <div className="space-y-6 text-slate-600 leading-relaxed text-base sm:text-xl font-medium max-w-2xl mx-auto lg:mx-0">
                <p>
                  Established in 2025, Taxi House grew from a single-car operation to one of Bengaluru's most trusted name in travel. We understand the unique pulse of this city—the fast-paced professional life, the vibrant tourism, and the need for reliable transport at any hour.
                </p>
                <p>
                  We are not just a taxi service; we are your local travel partners who know the best routes through Whitefield, the fastest ways to the airport, and the hidden gems across Karnataka.
                </p>
              </div>
              
              <div className="pt-6">
                <div className="relative group overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/10">
                  <img 
                    src="/about-2.png" 
                    alt="Our Fleet" 
                    className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 lg:mt-0"
            >
              <div className="bg-secondary p-8 sm:p-12 lg:p-16 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/10" />
                
                <h3 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-12 flex items-center justify-center lg:justify-start gap-4">
                   <div className="w-2 h-8 bg-primary rounded-full" />
                   Our Mission
                </h3>
                <p className="text-lg sm:text-2xl text-slate-300 leading-relaxed italic mb-10 sm:mb-16 text-center lg:text-left border-l-4 border-primary/30 pl-6 lg:pl-8">
                  "To provide safe, reliable, and premium transportation solutions that allow our customers to navigate Bengaluru with complete peace of mind."
                </p>
                
                <div className="space-y-8 sm:space-y-10">
                  {values.map((v, i) => {
                    const VIcon = v.icon;
                    return (
                      <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 group/item">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-secondary transition-all duration-300 transform group-hover/item:rotate-6">
                          <VIcon size={32} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-xl sm:text-2xl text-white">{v.title}</h4>
                          <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed">{v.desc}</p>
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

      {/* CTA section */}
      <section className="bg-primary py-20 sm:py-32 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-2xl -ml-32 -mb-32" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-secondary mb-10 sm:mb-16 leading-[1.1] tracking-tight">
            Experience the difference <br className="hidden sm:block" /> with Taxi House today.
          </h2>
          <Link 
            to="/#booking" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-secondary text-primary font-black text-lg rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl group"
          >
            Book Your Ride Now
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </motion.div>
  );
};

export default About;
