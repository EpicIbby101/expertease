'use client';

import { Computer, Network, Zap } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import OrbitingCirclesComponent from '@/components/homepage/orbiting-circles';
import Image from 'next/image';
import { Cover } from '@/components/ui/cover';

const features = [
  {
    name: 'Launch faster',
    description:
      'Skip weeks of setup and configuration. Titan comes pre-configured with authentication, database, payments, and analytics - everything you need to launch your SaaS in days, not months.',
    icon: Zap,
  },
  {
    name: 'Production Ready',
    description:
      'Built with best-in-class providers for scale - all integrated and ready to go. Enterprise-grade security with row-level protection, API rate limiting, and comprehensive authentication. No compromises on quality, security or performance.',
    icon: Computer,
  },
  {
    name: 'Scale with confidence',
    description:
      'Built for growth from day one. Your tech stack shouldn\'t be a limiting factor. With industry-leading providers like Vercel, Supabase, and Clerk handling the infrastructure, you can focus on your product while scaling to millions of users.',
    icon: Network,
  },
];

// Electric highlight component
const ElectricHighlight = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.span
      className="relative inline-block"
    >
      {children}
      <motion.span
        className="absolute inset-0 z-[-1] bg-gradient-to-r from-green-300/30 to-emerald-400/30 rounded-md"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ 
          opacity: [0, 0.4, 0], 
          scale: [0.85, 1.05, 0.85],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "loop", 
          ease: "easeInOut" 
        }}
      />
    </motion.span>
  );
};

export default function SideBySide() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  
  return (
    <motion.div 
      ref={ref}
      className="overflow-hidden bg-black py-16 w-full"
    >
      <style jsx global>{`
        circle {
          stroke: rgba(74, 222, 128, 0.2) !important;
          stroke-width: 1px !important;
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-y-12 md:gap-y-16 lg:gap-x-12 lg:max-w-none lg:grid-cols-2">
          <motion.div 
            className="lg:pr-8 lg:pt-4"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="lg:max-w-lg">
              <motion.h2
                className="text-3xl md:text-4xl font-semibold tracking-tight text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                Everything you need to ship fast
              </motion.h2>
              <motion.dl 
                className="mt-10 max-w-xl space-y-8 leading-7 text-gray-300 lg:max-w-none"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {features.map((feature, index) => (
                  <motion.div 
                    key={feature.name} 
                    className="relative pl-9"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.4 + (index * 0.1),
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <dt className="inline font-semibold text-white mb-1 flex items-start">
                      <motion.div
                        className="absolute left-1 top-1 h-5 w-5 text-green-400"
                        whileHover={{ 
                          rotate: 360, 
                          scale: 1.2, 
                          transition: { duration: 0.5 } 
                        }}
                        animate={
                          feature.name === 'Launch faster' 
                            ? { 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.2, 1],
                                transition: { 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  repeatDelay: 3
                                }
                              } 
                            : {}
                        }
                      >
                        <feature.icon aria-hidden="true" />
                      </motion.div>
                      <span className="text-green-400">
                        {feature.name}
                      </span>
                    </dt>
                    <dd className="block text-gray-400 mt-1 pl-0">{feature.description}</dd>
                  </motion.div>
                ))}
              </motion.dl>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center"
          >
            {/* Replace old orbiting circles with our new component */}
            <OrbitingCirclesComponent />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
