'use client';

import { motion } from 'framer-motion';
import { BoltIcon, RocketLaunchIcon, BoltSlashIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface PerformanceDriverProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  gradient: string;
  delay: number;
  url: string;
}

function PerformanceDriver({ icon, name, description, gradient, delay, url }: PerformanceDriverProps) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className="flex flex-col items-center p-2 md:p-4 group cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-2 md:mb-3 ${gradient} transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-green-500/20`}
      >
        {icon}
      </motion.div>
      <h3 className="text-white text-base md:text-lg font-semibold mb-1 transition-colors duration-300 group-hover:text-green-400">{name}</h3>
      <p className="text-white/60 text-[11px] md:text-xs text-center max-w-[140px] md:max-w-[200px]">{description}</p>
    </motion.a>
  );
}

export function PerformanceDrivers() {
  const drivers = [
    {
      icon: <BoltIcon className="h-7 w-7 text-white group-hover:text-white" />,
      name: 'Bun',
      description: 'Lightning-fast JavaScript runtime with native bundler for up to 5x faster builds and startup',
      gradient: 'bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 group-hover:from-pink-500/30 group-hover:to-purple-600/30 transition-colors duration-300',
      delay: 0.1,
      url: 'https://bun.sh',
    },
    {
      icon: <RocketLaunchIcon className="h-7 w-7 text-white group-hover:text-white" />,
      name: 'Turbopack',
      description: 'Incremental bundler that delivers 700x faster updates and speedy cold starts',
      gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-cyan-600/30 transition-colors duration-300',
      delay: 0.2,
      url: 'https://turbo.build/pack',
    },
    {
      icon: <BoltSlashIcon className="h-7 w-7 text-white group-hover:text-white" />,
      name: 'Biome',
      description: 'High-performance linting and formatting tool that runs up to 30x faster than ESLint and Prettier',
      gradient: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 group-hover:from-amber-500/30 group-hover:to-orange-600/30 transition-colors duration-300',
      delay: 0.3,
      url: 'https://biomejs.dev',
    },
    {
      icon: <BeakerIcon className="h-7 w-7 text-white group-hover:text-white" />,
      name: 'Drizzle',
      description: 'TypeSafe ORM with near-zero runtime overhead for faster database operations',
      gradient: 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 group-hover:from-emerald-500/30 group-hover:to-green-600/30 transition-colors duration-300',
      delay: 0.4,
      url: 'https://orm.drizzle.team',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="w-full mt-16 mb-8"
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100px' }}
        transition={{ duration: 1, delay: 0.3 }}
        className="h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mb-8"
      />
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center text-white/70 text-sm font-medium mb-6 md:mb-8"
      >
        POWERED BY CUTTING-EDGE TECH
      </motion.h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 justify-items-center gap-2 md:gap-6 max-w-4xl mx-auto">
        {drivers.map((driver) => (
          <PerformanceDriver
            key={driver.name}
            icon={driver.icon}
            name={driver.name}
            description={driver.description}
            gradient={driver.gradient}
            delay={driver.delay}
            url={driver.url}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100px' }}
        transition={{ duration: 1, delay: 1 }}
        className="h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mt-8"
      />
    </motion.div>
  );
} 