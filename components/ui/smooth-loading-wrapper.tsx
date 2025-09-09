'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SmoothLoadingWrapperProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  minLoadingTime?: number; // Minimum time to show skeleton (ms)
  className?: string;
}

export function SmoothLoadingWrapper({ 
  isLoading, 
  children, 
  skeleton, 
  minLoadingTime = 800,
  className 
}: SmoothLoadingWrapperProps) {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
      setShowContent(false);
      setIsTransitioning(false);
    } else {
      // Start transition after minimum loading time
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        setShowSkeleton(false);
        
        // Small delay before showing content to allow fade transition
        setTimeout(() => {
          setShowContent(true);
          setIsTransitioning(false);
        }, 150);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);

  return (
    <div className={cn("relative", className)}>
      {/* Skeleton with fade out */}
      <div 
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          showSkeleton ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ 
          display: showSkeleton ? 'block' : 'none',
          position: showSkeleton ? 'relative' : 'absolute'
        }}
      >
        {skeleton}
      </div>

      {/* Content with fade in */}
      <div 
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          showContent ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          display: showContent ? 'block' : 'none',
          position: showContent ? 'relative' : 'absolute'
        }}
      >
        {children}
      </div>

      {/* Overlay during transition to prevent layout shift */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white/50 pointer-events-none" />
      )}
    </div>
  );
} 