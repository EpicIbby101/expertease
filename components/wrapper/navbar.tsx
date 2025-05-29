'use client';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import config from '@/config';
import { UserProfile } from '../user-profile';
import { Drawer } from '../ui/drawer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation items with sections to scroll to
const navigationItems = [
  { title: 'Home', href: '#hero', section: 'hero' },
  { title: 'Benefits', href: '#benefits', section: 'benefits' },
  { title: 'Tech Stack', href: '#tech-stack', section: 'tech-stack' },
  { title: 'Pricing', href: '#pricing', section: 'pricing' },
  { title: 'FAQ', href: '#faq', section: 'faq' },
];

export default function NavBar() {
  // Auth setup
  let userId = null;
  if (config?.auth?.enabled) {
    const user = useAuth();
    userId = user?.userId;
  }

  // State for mobile menu, scroll, and active section
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Handle scroll events for navbar appearance and active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 10);

      // Determine which section is currently in view
      const sections = navigationItems.map(item => item.section);
      
      // Find all sections and their positions
      const sectionPositions = sections.map(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return { 
            section, 
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height
          };
        }
        return null;
      }).filter(Boolean);
      
      // Find the current active section
      const viewportHeight = window.innerHeight;
      const viewportCenter = viewportHeight / 4; // Use the top quarter as detection point
      
      // Find the section that occupies the center of the screen
      const currentSection = sectionPositions.find(section => {
        if (section && typeof section.top === 'number' && typeof section.bottom === 'number') {
          return section.top <= viewportCenter && section.bottom >= viewportCenter;
        }
        return false;
      });
      
      // Default to hero if no section is active or we're at the top of the page
      if (currentSection) {
        setActiveSection(currentSection.section);
      } else if (scrollPosition < 50) { // Reduced from 100
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial call to set the active section on page load
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle smooth scrolling to sections
  const scrollToSection = (section: string) => {
    const element = document.getElementById(section);
    if (element) {
      // First close drawer if it's open
      if (isDrawerOpen) {
        setDrawerOpen(false);
        
        // Add a small delay before scrolling to allow drawer to close
        // and the scroll position to be restored
        setTimeout(() => {
          performScroll(element);
        }, 400); // Increased to give more time for drawer close animation
      } else {
        performScroll(element);
      }
    }
  };
  
  // Helper function to perform the actual scrolling
  const performScroll = (element: HTMLElement) => {
    // Get the height of the navbar
    const navbarHeight = 100; // Buffer to avoid content being hidden under navbar
    
    // Calculate scroll position
    const offsetPosition = element.offsetTop - navbarHeight;
    
    // Scroll to the position
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      }
    }
  };
  
  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        delay: 0.2
      }
    }
  };
  
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3, 
        delay: 0.3 + (i * 0.1),
        ease: "easeOut"
      }
    })
  };
  
  const underlineVariants = {
    hidden: { width: "0%" },
    visible: { 
      width: "100%", 
      transition: { 
        duration: 0.3, 
        ease: "easeOut" 
      }
    }
  };

  return (
    <motion.header 
      className={`w-full z-40 fixed top-0 left-0 transition-all duration-300 ${hasScrolled ? 'bg-black/90 backdrop-blur-sm border-b border-green-900/20' : 'bg-transparent'}`}
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
    >
      <div className="container relative mx-auto min-h-20 flex justify-between items-center px-4 sm:px-6 md:px-8">
        {/* Logo */}
        <motion.div 
          className="flex items-center"
          variants={logoVariants}
        >
          <Link href="/" className="text-xl font-bold text-white">
            Titan
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-6">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  custom={index}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={cn(
                        "text-sm font-medium text-white cursor-pointer relative py-2",
                      )}
                      onClick={() => scrollToSection(item.section)}
                    >
                      {item.title}
                      {activeSection === item.section && (
                        <motion.div 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                          layoutId="activeSection"
                          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        />
                      )}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </motion.div>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth Buttons */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {/* Sign in button - visible only on desktop */}
          <div className="hidden md:block">
            {userId ? (
              <UserProfile />
            ) : (
              <Button
                variant="outline"
                className="text-white border-green-800/40 hover:bg-green-900/20"
                onClick={() => window.location.assign('/sign-in')}
                disabled={!config?.auth?.enabled}
              >
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              onClick={() => setDrawerOpen(true)}
              className="transition-all hover:bg-green-900/20"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col gap-6 pt-4">
          <motion.h2 
            className="text-xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Menu
          </motion.h2>
          
          {/* Navigation Items */}
          <div className="flex flex-col gap-4">
            {navigationItems.map((item, index) => (
              <motion.button
                key={item.title}
                className={cn(
                  "flex text-left text-lg font-medium py-3 px-4 border-l-2 transition-colors w-full",
                  activeSection === item.section
                    ? "text-green-400 border-green-500 bg-green-900/10"
                    : "text-white border-transparent hover:border-green-600/30 hover:bg-green-900/5"
                )}
                onClick={() => scrollToSection(item.section)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                {item.title}
              </motion.button>
            ))}
          </div>
          
          {/* Mobile Auth Button */}
          <motion.div 
            className="mt-6 pt-6 border-t border-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {userId ? (
              <div className="p-4">
                <UserProfile />
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-white border-green-800/40 hover:bg-green-900/20"
                onClick={() => window.location.assign('/sign-in')}
                disabled={!config?.auth?.enabled}
              >
                Sign in
              </Button>
            )}
          </motion.div>
        </div>
      </Drawer>
    </motion.header>
  );
}
