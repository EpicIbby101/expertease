'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen, FileQuestion, Video, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Course Modules', href: '/dashboard/modules', icon: BookOpen },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: FileQuestion },
  { name: 'Video Assessments', href: '/dashboard/video-assessments', icon: Video },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed left-4 top-20 z-50 bg-card border rounded-lg p-2 hover:bg-accent md:hidden transition-transform duration-500 ease-in-out"
        >
          <Menu size={20} />
        </button>
      )}

      <div
        className={cn(
          'h-[calc(100vh-4rem)] bg-card border-r transition-all duration-500 ease-in-out z-40',
          isCollapsed ? 'w-16' : 'w-64',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && isOpen && 'translate-x-0',
          isMobile ? 'fixed left-0 top-16' : 'relative'
        )}
      >
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 bg-card border rounded-full p-1 hover:bg-accent transition-transform duration-500 ease-in-out"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        <div className="p-4 border-b">
          <h2 className={cn(
            "font-semibold text-lg transition-all duration-500 ease-in-out",
            isCollapsed && "text-center"
          )}>
            {isCollapsed ? "Nav" : "Navigation"}
          </h2>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-all duration-500 ease-in-out"
              >
                <Icon size={isCollapsed ? 24 : 20} className={cn(
                  "transition-all duration-500 ease-in-out",
                  isCollapsed && "mx-auto"
                )} />
                {!isCollapsed && <span className="transition-opacity duration-500 ease-in-out">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
} 