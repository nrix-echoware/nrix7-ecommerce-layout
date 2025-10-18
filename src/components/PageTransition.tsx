import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, isVisible }) => {
  const transitionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      // Exit animation
      const tl = gsap.timeline();
      
      tl.to(overlayRef.current, {
        x: '0%',
        duration: 0.6,
        ease: "power2.inOut"
      })
      .to(transitionRef.current, {
        x: '100%',
        duration: 0.8,
        ease: "power2.inOut"
      }, "-=0.3");
    } else {
      // Enter animation
      const tl = gsap.timeline();
      
      tl.set([overlayRef.current, transitionRef.current], {
        x: '100%'
      })
      .to(transitionRef.current, {
        x: '0%',
        duration: 0.8,
        ease: "power2.inOut"
      })
      .to(overlayRef.current, {
        x: '0%',
        duration: 0.6,
        ease: "power2.inOut"
      }, "-=0.3");
    }
  }, [isVisible]);

  return (
    <div className="relative overflow-hidden">
      {/* Transition overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 transform translate-x-full"
      />
      
      {/* Transition panel */}
      <div 
        ref={transitionRef}
        className="fixed inset-0 z-40 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transform translate-x-full"
      >
        {/* Animated elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 bg-white/20 rounded-xl"></div>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 animate-pulse"
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 2 + 's',
                animationDuration: (2 + Math.random() * 2) + 's'
              }}
            />
          ))}
        </div>
      </div>

      {/* Page content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageTransition;
