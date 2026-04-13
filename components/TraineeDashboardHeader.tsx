'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, Trophy, HelpCircle } from 'lucide-react';

export default function TraineeDashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <TooltipProvider>
      <>
        {/* Sticky Navbar - Appears on Scroll */}
        {isScrolled && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-end h-16 gap-3">
                <Link href="/trainee/courses">
                  <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Button>
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/trainee/courses">
                      <Button size="sm" variant="outline" className="h-10 w-10 rounded-full p-0 border-gray-300">
                        <Trophy className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Achievements</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/trainee/support">
                      <Button size="sm" variant="outline" className="h-10 w-10 rounded-full p-0 border-gray-300">
                        <HelpCircle className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get Help & Support</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Original Header Buttons - Hidden when scrolled */}
        <div className={`transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            <Link href="/trainee/courses">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all text-base font-semibold px-6 py-6">
                <Sparkles className="h-5 w-5 mr-2" />
                Browse Courses
              </Button>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/trainee/courses">
                  <Button size="lg" className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 shadow-xl hover:shadow-2xl transition-all h-14 w-14 rounded-full p-0">
                    <Trophy className="h-6 w-6" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Achievements</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/trainee/support">
                  <Button size="lg" className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 shadow-xl hover:shadow-2xl transition-all h-14 w-14 rounded-full p-0">
                    <HelpCircle className="h-6 w-6" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </>
    </TooltipProvider>
  );
}

