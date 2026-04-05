import React, { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { testimonials } from '../data/testimonials';
import { motion, AnimatePresence } from 'framer-motion';

const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
    </svg>
);

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); 
    const [cardsPerPage, setCardsPerPage] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            setCardsPerPage(window.innerWidth < 768 ? 1 : 3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const totalTestimonials = testimonials.length;

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + cardsPerPage) % totalTestimonials);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - cardsPerPage + totalTestimonials) % totalTestimonials);
    };

    const visibleTestimonials = Array.from({ length: cardsPerPage }).map((_, i) => 
        testimonials[(currentIndex + i) % totalTestimonials]
    );

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
        })
    };

    return (
        <section className="py-8 sm:py-16 lg:py-28 bg-gray-100/30 overflow-hidden relative px-4 min-h-[500px]">
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none flex items-center justify-center">
                <MessageSquare size={800} strokeWidth={0.5} className="text-secondary" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-10 sm:mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center space-x-2 text-primary font-bold tracking-tight text-xs mb-4"
                    >
                        <Star size={14} className="fill-primary" />
                        <span>Google Verified Reviews</span>
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-5xl lg:text-7xl font-bold text-secondary leading-[1.1] tracking-tight"
                    >
                        Trusted By <span className="text-primary italic">Thousands</span> <br />
                        Of Happy Riders
                    </motion.h2>
                </div>

                <div className="relative group px-0 sm:px-12">
                    {/* Navigation Arrows */}
                    <button 
                        onClick={handlePrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-secondary hover:bg-primary transition-all active:scale-90 hidden sm:flex border border-gray-100 backdrop-blur-sm"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-secondary hover:bg-primary transition-all active:scale-90 hidden sm:flex border border-gray-100 backdrop-blur-sm"
                    >
                        <ChevronRight size={24} strokeWidth={2.5} />
                    </button>

                    <div className="relative overflow-hidden pt-4 pb-8">
                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.div 
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "tween", duration: 0.8, ease: "easeInOut" },
                                    opacity: { duration: 0.6 }
                                }}
                                className={`grid grid-cols-1 ${cardsPerPage === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6 sm:gap-8`}
                            >
                                {visibleTestimonials.map((testimonial) => (
                                    <div 
                                        key={testimonial.id}
                                        className="bg-white p-6 sm:p-10 rounded-[2rem] shadow-xl shadow-gray-200/30 border border-gray-100 flex flex-col justify-between relative group/card hover:border-primary/40 transition-all duration-300 h-full w-full"
                                    >
                                        <a 
                                            href="https://www.google.com/search?sca_esv=c886fa4b6d8c3132&rlz=1C5CHFA_enIN1187IN1187&sxsrf=ANbL-n5XytiQxSo36iJyFajm11UdogLYtA:1775398827629&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOZC58CQR6-8Xsxumyfk13caecCDwgCkoJLxV9mM19MZ67unwTSAqjxWjRnNUsdEbmhHm31PE8VQw6Cvk7mChKz0DsEvuMlFaNGl49hCA1ABN4eFviQ%3D%3D&q=Taxi+House+Bengaluru+Reviews&sa=X&ved=2ahUKEwjth9KD9NaTAxVfTWwGHYCeLsMQ0bkNegQIPxAD&biw=1710&bih=986&dpr=2" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="absolute top-8 left-8 hover:scale-110 transition-transform z-20"
                                            title="View original Google review"
                                        >
                                            <GoogleLogo />
                                        </a>

                                        <Quote className="absolute top-8 right-8 text-gray-50 group-hover/card:text-primary/10 transition-colors" size={40} strokeWidth={3} />
                                        
                                        <div className="mt-8 mb-6">
                                            <div className="flex gap-1 mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} fill={i < testimonial.rating ? "currentColor" : "none"} className={i < testimonial.rating ? "text-primary" : "text-gray-200"} size={16} />
                                                ))}
                                            </div>
                                            
                                            <p className="text-gray-800 font-medium text-sm sm:text-lg leading-relaxed relative z-10 italic">
                                                "{testimonial.text}"
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center pt-6 border-t border-gray-50 mt-auto">
                                            <div className="w-12 h-12 bg-secondary text-primary rounded-xl flex items-center justify-center font-black text-xl mr-4 shadow-md group-hover/card:scale-110 transition-transform">
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
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
                
                {/* Mobile Navigation Arrows */}
                <div className="flex sm:hidden justify-center gap-4 mt-8">
                    <button 
                        onClick={handlePrev}
                        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-secondary active:bg-primary transition-all border border-gray-100"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-secondary active:bg-primary transition-all border border-gray-100"
                    >
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                </div>
                
                {/* Carousel Progress Indicator */}
                <div className="mt-8 sm:mt-12 flex justify-center gap-2">
                    {[...Array(Math.ceil(totalTestimonials / cardsPerPage))].map((_, i) => (
                        <div 
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${Math.floor(currentIndex / cardsPerPage) === i ? "w-8 bg-primary" : "w-2 bg-gray-200"}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

