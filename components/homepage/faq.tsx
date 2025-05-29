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
                What's included in the Titan boilerplate?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
                Titan includes everything you need to build a modern SaaS application with Next.js 14, including authentication with Clerk, database with Supabase, UI components with Shadcn, payments with Stripe, dark mode, and more.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-2" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                How do I get started with Titan?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
                Getting started is simple. Clone the repository, install dependencies, and configure your environment variables. Follow our comprehensive documentation for detailed instructions on setup and deployment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-3" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Can I customize Titan to match my brand?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
                Absolutely! Titan is designed to be fully customizable. You can easily change colors, typography, and other design elements to match your brand identity. The codebase is modular and easily customizable.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-4" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Is Titan suitable for production?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
                Yes, Titan is built for production use. All of the providers operate smoothly at high-scale. Vercel also takes care of a lot of the infrastructure for you (including DDOS protection). You shouldn't be worrying about any self-hosting until a significant amount of users are on your platform (e.g. 500,000 MAU).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-5" 
              className="border border-green-900/30 rounded-lg px-6 bg-black hover:border-green-500/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-white hover:text-green-400 text-lg font-medium py-4">
                Do you offer support for Titan?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4">
                Yes. We offer community support through the #ask-for-help Discord channel in the <a href="https://discord.gg/Gh67NqaY" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">Discord Server</a>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
