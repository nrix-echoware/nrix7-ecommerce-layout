import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';

interface TransitionWrapperProps {
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [pendingLocation, setPendingLocation] = useState<typeof location | null>(null);
  const transitionRef = useRef<HTMLDivElement>(null);

  // Safety check for initial render
  if (!location || !displayLocation) {
    return <div className="relative">{children}</div>;
  }

  useEffect(() => {
    if (location !== displayLocation && !isTransitioning) {
      // Store the pending location but don't update display yet
      setPendingLocation(location);
      setIsTransitioning(true);
      
      // Create transition overlay that covers everything
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[9999] bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 transform translate-x-full';
      document.body.appendChild(overlay);

      const panel = document.createElement('div');
      panel.className = 'fixed inset-0 z-[9998] bg-gradient-to-br from-white via-orange-50 to-white transform translate-x-full';
      document.body.appendChild(panel);

      // Generate beautiful mathematical patterns
      const createTransitionPatterns = () => {
        const patterns = [
          { type: 'spiral', color: '#f97316', opacity: 0.3 },
          { type: 'sine', color: '#ea580c', opacity: 0.4 },
          { type: 'fibonacci', color: '#dc2626', opacity: 0.2 },
          { type: 'golden', color: '#b91c1c', opacity: 0.3 }
        ];

        let svgContent = '';
        patterns.forEach((pattern, index) => {
          let pathData = '';
          
          switch (pattern.type) {
            case 'spiral':
              // Archimedean spiral
              pathData = 'M 200 200 ';
              for (let t = 0; t < 20; t += 0.1) {
                const r = 5 * t;
                const x = 200 + r * Math.cos(t);
                const y = 200 + r * Math.sin(t);
                pathData += `L ${x} ${y} `;
              }
              break;
            
            case 'sine':
              // Sine wave pattern
              pathData = 'M 0 200 ';
              for (let x = 0; x <= 400; x += 2) {
                const y = 200 + 50 * Math.sin(x * 0.02);
                pathData += `L ${x} ${y} `;
              }
              break;
            
            case 'fibonacci':
              // Fibonacci spiral approximation
              pathData = 'M 200 200 ';
              let a = 0, b = 1;
              for (let i = 0; i < 20; i++) {
                const temp = a + b;
                a = b;
                b = temp;
                const angle = i * 0.5;
                const radius = a * 2;
                const x = 200 + radius * Math.cos(angle);
                const y = 200 + radius * Math.sin(angle);
                pathData += `L ${x} ${y} `;
              }
              break;
            
            case 'golden':
              // Golden ratio rectangles
              const phi = (1 + Math.sqrt(5)) / 2;
              pathData = 'M 200 200 ';
              for (let i = 0; i < 10; i++) {
                const size = 20 * Math.pow(phi, i);
                const x = 200 - size / 2;
                const y = 200 - size / 2;
                pathData += `M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z `;
              }
              break;
          }

          svgContent += `<path d="${pathData}" fill="none" stroke="${pattern.color}" stroke-width="1" opacity="${pattern.opacity}" style="animation: drawPath 3s ease-in-out infinite; animation-delay: ${index * 0.5}s;"></path>`;
        });

        return svgContent;
      };

      // Add beautiful mathematical patterns to panel
      panel.innerHTML = `
        <div class="absolute inset-0 overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 400 400" class="absolute inset-0 opacity-20">
            ${createTransitionPatterns()}
          </svg>
        </div>
        <div class="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-white/50 to-orange-100/30"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 animate-pulse">
            <div class="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div class="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-inner"></div>
            </div>
          </div>
        </div>
      `;

      // Add CSS animation for mathematical patterns
      const style = document.createElement('style');
      style.textContent = `
        @keyframes drawPath {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
      `;
      document.head.appendChild(style);

      // Animate transition
      const tl = gsap.timeline({
        onComplete: () => {
          // Update the displayed location only after animation completes
          if (pendingLocation) {
            setDisplayLocation(pendingLocation);
            setPendingLocation(null);
          }
          setIsTransitioning(false);
          
          // Cleanup
          document.body.removeChild(overlay);
          document.body.removeChild(panel);
          document.head.removeChild(style);
        }
      });

      tl.to(panel, {
        x: '0%',
        duration: 0.3,
        ease: "power2.inOut"
      })
      .to(overlay, {
        x: '0%',
        duration: 0.2,
        ease: "power2.inOut"
      }, "-=0.1")
      .to(overlay, {
        x: '100%',
        duration: 0.2,
        ease: "power2.inOut"
      })
      .to(panel, {
        x: '100%',
        duration: 0.3,
        ease: "power2.inOut"
      }, "-=0.1");
    }
  }, [location, displayLocation, isTransitioning, pendingLocation]);

  // Show transition overlay when transitioning
    if (isTransitioning) {
      return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-white via-orange-50 to-white">
          <div className="absolute inset-0 overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="absolute inset-0 opacity-20">
              <path d="M 200 200 L 200 200 " fill="none" stroke="#f97316" strokeWidth="1" opacity="0.3" style={{animation: 'drawPath 3s ease-in-out infinite', animationDelay: '0s'}}></path>
              <path d="M 0 200 L 0 200 " fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.4" style={{animation: 'drawPath 3s ease-in-out infinite', animationDelay: '0.5s'}}></path>
              <path d="M 200 200 L 200 200 " fill="none" stroke="#dc2626" strokeWidth="1" opacity="0.2" style={{animation: 'drawPath 3s ease-in-out infinite', animationDelay: '1s'}}></path>
              <path d="M 200 200 L 200 200 " fill="none" stroke="#b91c1c" strokeWidth="1" opacity="0.3" style={{animation: 'drawPath 3s ease-in-out infinite', animationDelay: '1.5s'}}></path>
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-white/50 to-orange-100/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 animate-pulse">
              <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-inner"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

  return (
    <>
      <style>{`
        @keyframes drawPath {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
      `}</style>
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
    </>
  );
};

export default TransitionWrapper;
