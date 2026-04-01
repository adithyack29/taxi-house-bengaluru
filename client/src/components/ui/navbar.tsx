'use client'
import { Link } from 'react-router-dom'
import { Equal, X } from 'lucide-react'
import { Button } from '@/components/ui/liquid-glass-button'
import React from 'react'
import { cn } from '@/lib/utils' 
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Fleet', href: '/fleet' },
    { name: 'Contact', href: '/contact' },
]

export const Header = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const [lastScrollY, setLastScrollY] = React.useState(0)
    const { currentUser } = useAuth()
    const isLoggedIn = !!currentUser

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            
            // Check for scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                // Scrolling Down -> Hide
                setIsVisible(false)
            } else if (currentScrollY < lastScrollY && currentScrollY > 50) {
                // Scrolling Up -> Show
                setIsVisible(true)
            } else if (currentScrollY <= 50) {
                // At the very top -> Always Show
                setIsVisible(true)
            }
            
            setIsScrolled(currentScrollY > 50)
            setLastScrollY(currentScrollY)
        }
        
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    return (
        <header>
            <nav
                data-state={menuState ? 'active' : 'inactive'}
                className={cn(
                    "fixed left-0 w-full z-50 top-0 transition-transform duration-500 ease-in-out",
                    !isVisible ? "-translate-y-[120%]" : "translate-y-0"
                )}>
                <div className={cn(
                    'w-full transition-all duration-500 px-6 lg:px-12 border-b', 
                    isScrolled 
                        ? 'bg-black/95 backdrop-blur-lg shadow-lg border-white/10 py-1' 
                        : 'bg-black border-white/10 py-1.5'
                )}>
                    <div className="mx-auto max-w-7xl relative flex flex-wrap items-center justify-between gap-6 lg:gap-0">
                        <div className="flex w-full justify-between lg:w-auto text-white">
                            <Link
                                to="/"
                                aria-label="home"
                                className="flex gap-2.5 items-center group">
                                <img src="/logo.png" alt="Taxi House" className="h-10 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                                <p className="font-black text-xl lg:text-2xl tracking-tighter"> Taxi House</p>  
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Equal className={cn("m-auto size-7 duration-200 transition-all", menuState && "rotate-180 scale-0 opacity-0")} />
                                <X className={cn("absolute inset-0 m-auto size-7 -rotate-180 scale-0 opacity-0 duration-200 transition-all", menuState && "rotate-0 scale-100 opacity-100")} />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-10 text-base">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            to={item.href}
                                            className="transition-colors block duration-150 font-bold tracking-tight py-2 text-white/90 hover:text-white lg:text-lg">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={cn(
                            "bg-black lg:bg-transparent hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 lg:border-none p-6 shadow-2xl lg:shadow-none lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0",
                            menuState && "block animate-in fade-in slide-in-from-top-4 duration-300"
                        )}>
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-lg">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                to={item.href}
                                                onClick={() => setMenuState(false)}
                                                className="text-white/90 hover:text-white block duration-150 font-bold tracking-tight">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                {isLoggedIn ? (
                                    <Button
                                        asChild
                                        variant="cool"
                                        size="default"
                                        className="font-bold text-base px-6"
                                        onClick={() => setMenuState(false)}>
                                        <Link to="/profile">
                                            <span>{currentUser.displayName || 'Account'}</span>
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="default"
                                            className="font-bold px-8 text-base bg-white/5 text-white border-white/20 hover:bg-white/10"
                                            onClick={() => setMenuState(false)}>
                                            <Link to="/login">
                                                <span>Login</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="default"
                                            className="font-bold px-8 text-base"
                                            onClick={() => setMenuState(false)}>
                                            <Link to="/signup">
                                                <span>Sign Up</span>
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
