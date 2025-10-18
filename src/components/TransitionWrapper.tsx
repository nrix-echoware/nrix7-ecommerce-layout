import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface TransitionWrapperProps {
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [pendingLocation, setPendingLocation] = useState<typeof location | null>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const loaderConfig = useSelector((state: RootState) => state.siteConfig.config.loader);

  // Safety check for initial render
  if (!location || !displayLocation) {
    return <div className="relative">{children}</div>;
  }

  useEffect(() => {
    if (location !== displayLocation && !isTransitioning && !animationRef.current) {
      // Store the pending location but don't update display yet
      setPendingLocation(location);
      setIsTransitioning(true);
      
      // Create glassy broken glass overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[9999] opacity-0';
      overlay.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-orange-50/30 to-white/20 backdrop-blur-md">
          <!-- Broken glass pattern -->
          <div class="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" viewBox="0 0 1000 1000" class="absolute inset-0">
              <defs>
                <pattern id="brokenGlass" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  <path d="M0 0 L200 50 L180 200 L50 180 Z" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                  <path d="M50 0 L200 100 L150 200 L0 150 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                  <path d="M100 0 L200 150 L100 200 L0 100 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#brokenGlass)"/>
            </svg>
          </div>
          
          <!-- Glass shards effect -->
          <div class="absolute inset-0">
            <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-lg transform rotate-12 border border-white/20"></div>
            <div class="absolute top-1/3 right-1/3 w-24 h-24 bg-white/15 rounded-lg transform -rotate-6 border border-white/25"></div>
            <div class="absolute bottom-1/4 left-1/3 w-28 h-28 bg-white/8 rounded-lg transform rotate-45 border border-white/15"></div>
            <div class="absolute bottom-1/3 right-1/4 w-20 h-20 bg-white/12 rounded-lg transform -rotate-12 border border-white/20"></div>
            <div class="absolute top-1/2 left-1/2 w-16 h-16 bg-white/18 rounded-lg transform rotate-30 border border-white/30"></div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <!-- Logo -->
            <div class="mb-8">
              <div class="relative">
                <div class="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3">
                  <div class="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <div class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-inner"></div>
                  </div>
                </div>
                <div class="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-xl opacity-50 -z-10"></div>
              </div>
            </div>
            
            <!-- Text -->
            <div class="mb-6">
              <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
                ${loaderConfig.name}
              </h1>
              <p class="text-gray-700 text-base font-light tracking-wide">
                ${loaderConfig.description}
              </p>
            </div>
            
            <!-- Simple loading text -->
            <div class="w-48 mx-auto">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Animate transition with glassy effect
      const tl = gsap.timeline({
        onComplete: () => {
          // Update the displayed location only after animation completes
          setDisplayLocation(location);
          setPendingLocation(null);
          setIsTransitioning(false);
          animationRef.current = null;
          
          // Cleanup
          document.body.removeChild(overlay);
        }
      });

      // Store animation reference to prevent multiple animations
      animationRef.current = tl;

      // Simple fade in → fade out
      tl.to(overlay, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.inOut"
      })
      .to(overlay, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut"
      }, "+=0.5");
    }
  }, [location, displayLocation, isTransitioning, loaderConfig]);

  // Show transition overlay when transitioning
    if (isTransitioning) {
      return <div className="fixed inset-0 z-[9999] pointer-events-none"></div>;
    }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayLocation?.pathname || 'default'}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ 
          duration: 0.2, 
          ease: "easeInOut"
        }}
        className="relative"
        ref={transitionRef}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransitionWrapper;
