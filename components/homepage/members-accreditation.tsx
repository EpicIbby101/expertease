"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const accreditations = [
  {
    name: "CPI",
    description: "Safety Intervention Training",
    image: "/logos/CPI-Logo.jpg",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Restraint Reduction Network",
    description: "All Of Our Trainers Are Members",
    image: "/logos/RRN-Logo.png",
    color: "from-green-400 to-emerald-400",
  },
  {
    name: "ROSPA",
    description: "Manual Handling",
    image: "/logos/ROSPA-Logo.jpg",
    color: "from-emerald-500 to-green-500",
  },
];

export default function MembersAccreditation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className="w-full bg-black overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Members and Accreditation
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            All our courses are accredited by one of the organisations below.
            Furthermore, all of our trainers are members of the Restraint
            Reduction Network.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {accreditations.map((accreditation, index) => {
            return (
              <motion.div
                key={accreditation.name}
                initial={{ opacity: 0, y: 50 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-green-500/20 hover:border-green-500/40 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${accreditation.color} flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 overflow-hidden`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-[90%] h-[90%] bg-white rounded-full flex items-center justify-center p-2">
                      <div className="relative w-full h-full min-h-[56px]">
                        <Image
                          src={accreditation.image}
                          alt={accreditation.name}
                          fill
                          className="object-contain p-1"
                          sizes="72px"
                          unoptimized
                          onError={(e) => {
                            console.error(`Failed to load image: ${accreditation.image}`);
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                    {accreditation.name}
                  </h3>
                  <p className="text-green-400 font-medium">
                    {accreditation.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

