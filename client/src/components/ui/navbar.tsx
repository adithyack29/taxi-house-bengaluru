'use client'
import { Link, useLocation } from 'react-router-dom'
import { Equal, X, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/liquid-glass-button'
import React from 'react'
import { cn } from '@/lib/utils' 
import { motion, AnimatePresence } from 'framer-motion'

const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
]

export const Header = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const location = useLocation()

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 40)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isActive = (href: string) => {
        if (href === '/') return location.pathname === '/'
        return location.pathname.startsWith(href)
    }

    return (
        <header className="fixed top-0 left-0 w-full z-[1000] font-sans">
            {/* Top Info Bar */}
            <div className="hidden lg:block bg-secondary py-2 border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center text-[11px] font-semibold text-gray-400 tracking-tight">
                    <div className="flex items-center space-x-6">
                        <a href="tel:+917795965640" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone size={12} className="text-primary fill-primary/10" />
                            <span>+91 7795965640</span>
                        </a>
                        <a href="mailto:taxihousebengaluru@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Mail size={12} className="text-primary fill-primary/10" />
                            <span>taxihousebengaluru@gmail.com</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-primary">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            <span>Reliable Taxi • 24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className={cn(
                "w-full transition-all duration-300 ease-in-out border-b",
                isScrolled 
                    ? "bg-white/95 backdrop-blur-md shadow-lg py-1.5 sm:py-2 border-gray-100" 
                    : "bg-white py-2 sm:py-3 border-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
                    {/* Logo Area */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group">
                            <img src="/logo.png" alt="Taxi House" className="h-8 lg:h-12 w-auto object-contain transition-transform" />
                            <div className="ml-2 lg:ml-3">
                                <span className="text-lg lg:text-2xl font-bold tracking-tight text-secondary">Taxi <span className="text-primary">House</span></span>
                            </div>
                        </Link>
                    </div>

                    {/* Nav Links - Desktop */}
                    <div className="hidden lg:block absolute left-1/2 -translate-x-1/2">
                        <ul className="flex items-center space-x-1">
                            {menuItems.map((item) => (
                                <li key={item.name}>
                                    <Link 
                                        to={item.href}
                                        className={cn(
                                            "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                                            isActive(item.href) 
                                                ? "bg-primary/10 text-primary" 
                                                : "text-secondary hover:text-primary hover:bg-gray-50"
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA Area */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="hidden sm:flex items-center space-x-2 mr-1">
                        </div>
                        
                        <Button
                            asChild
                            variant="cool"
                            size="default"
                            className="font-bold text-[11px] sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-secondary transition-none shadow-none border-none pointer-events-auto"
                        >
                            <Link to="/#booking">
                                <span>Book Now</span>
                            </Link>
                        </Button>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMenuState(!menuState)}
                            className="lg:hidden p-2 text-secondary bg-gray-50 rounded-lg hover:bg-primary transition-all relative z-[100]"
                        >
                            {menuState ? <X size={24} /> : <Equal size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {menuState && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuState(false)} 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] lg:hidden" 
                        />
                        <motion.div 
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-0 left-0 right-0 z-[1100] bg-white lg:hidden flex flex-col p-6 rounded-b-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            {/* Menu Header with Logo & Close */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                <div className="flex items-center">
                                    <img src="/logo.png" alt="Taxi House" className="h-7 w-auto object-contain" />
                                    <span className="ml-2 text-sm font-bold text-secondary">Taxi <span className="text-primary">House</span></span>
                                </div>
                                <button
                                    onClick={() => setMenuState(false)}
                                    className="p-2 text-secondary bg-gray-50 rounded-xl hover:bg-primary transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <ul className="space-y-1">
                                {menuItems.map((item) => (
                                    <li key={item.name}>
                                        <Link 
                                            to={item.href}
                                            onClick={() => setMenuState(false)}
                                            className={cn(
                                                "block p-3 rounded-xl text-base font-bold transition-all",
                                                isActive(item.href) ? "bg-primary/10 text-primary" : "text-secondary active:bg-gray-50"
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            
                            <div className="mt-8">
                                <a href="tel:+917795965640" className="flex items-center justify-center gap-3 p-4 bg-secondary text-primary rounded-xl font-bold text-sm shadow-lg">
                                    <Phone size={18} />
                                    Call Now
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    )
}
