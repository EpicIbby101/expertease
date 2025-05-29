'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const FloatingCTA = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Only show the floating CTA when scrolled down
  const showCTA = scrollPosition > 500;

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ opacity: 0, y: 100 }}
      animate={{ 
        opacity: showCTA ? 1 : 0, 
        y: showCTA ? 0 : 100,
        scale: showCTA ? 1 : 0.8,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.3
      }}
    >
      <div className="relative">
        {/* Electric pulse background */}
        <motion.div
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-70 blur-sm"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Electric sparks */}
        <motion.div
          className="absolute -top-2 -right-2 text-green-400"
          animate={{ 
            opacity: [0, 1, 0],
            rotate: [0, 15, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 1
          }}
        >
          <Sparkles size={16} />
        </motion.div>
        
        {/* Main button */}
        <Button
          asChild
          size="lg"
          className="relative bg-white dark:bg-black text-black dark:text-white border border-green-500 hover:bg-green-500/10 transition-all duration-300 group"
        >
          <Link href="https://github.com/ObaidUr-Rahmaan/titan" target="_blank">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span>Get Titan</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <ArrowRight className="h-4 w-4 group-hover:text-green-500" />
              </motion.div>
              <Zap className="h-4 w-4 text-green-500" />
            </motion.div>
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default FloatingCTA; 