'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <div ref={ref} className="w-full pt-8 py-16 bg-black">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-semibold tracking-tight text-white text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem 
              value="item-1" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Question 1
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-2" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Question 2
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-3" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Question 3
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-4" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Question 4
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-5" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Question 5
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
