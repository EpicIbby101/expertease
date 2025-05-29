'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Drawer = ({ isOpen, onClose, children }: DrawerProps) => {
  // Store the scroll position
  const scrollPosRef = useRef(0);
  
  // Prevent body scrolling when drawer is open without jumping
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position first
      scrollPosRef.current = window.scrollY;
      
      // Add a class to body instead of using inline styles
      document.body.classList.add('drawer-open');
      
      // Apply the scroll position as a negative top margin 
      document.body.style.top = `-${scrollPosRef.current}px`;
    } else {
      // Restore scroll position when drawer is closed
      document.body.classList.remove('drawer-open');
      document.body.style.top = '';
      
      // Only restore if we have a saved position
      if (scrollPosRef.current) {
        window.scrollTo({
          top: scrollPosRef.current,
          behavior: 'instant' // Instant to avoid animation
        });
      }
    }
    
    return () => {
      // Clean up in case component unmounts while drawer is open
      document.body.classList.remove('drawer-open');
      document.body.style.top = '';
    };
  }, [isOpen]);
  
  // Force rerender of children when drawer is opened
  const [key, setKey] = React.useState(0);
  useEffect(() => {
    if (isOpen) {
      setKey(prev => prev + 1);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full w-[280px] bg-black z-[1001] overflow-auto border-l border-green-900/30 shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ backgroundColor: '#000000', boxShadow: '0 0 15px rgba(20, 83, 45, 0.25)' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-4">
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 px-4 py-2" key={key}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 