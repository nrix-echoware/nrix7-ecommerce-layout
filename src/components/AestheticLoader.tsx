import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface AestheticLoaderProps {
  onComplete: () => void;
}

const AestheticLoader: React.FC<AestheticLoaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mathPatternRef = useRef<HTMLDivElement>(null);
  const loaderConfig = useSelector((state: RootState) => state.siteConfig.config.loader);

  // Mathematical functions for patterns
  const createMathematicalPattern = () => {
    if (!mathPatternRef.current) return;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('class', 'absolute inset-0 opacity-20');
    
    // Create mathematical curves and patterns
    const patterns = [
      // Spiral pattern
      { type: 'spiral', color: '#f97316', opacity: 0.3 },
      // Sine wave pattern
      { type: 'sine', color: '#ea580c', opacity: 0.4 },
      // Fibonacci spiral
      { type: 'fibonacci', color: '#dc2626', opacity: 0.2 },
      // Golden ratio rectangles
      { type: 'golden', color: '#b91c1c', opacity: 0.3 }
    ];

    patterns.forEach((pattern, index) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = '';

      switch (pattern.type) {
        case 'spiral':
          // Archimedean spiral: r = aθ
          pathData = 'M 200 200 ';
          for (let t = 0; t < 4 * Math.PI; t += 0.1) {
            const r = 2 * t;
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

      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', pattern.color);
      path.setAttribute('stroke-width', '1');
      path.setAttribute('opacity', pattern.opacity.toString());
      path.style.animationDelay = `${index * 0.5}s`;
      path.style.animation = 'drawPath 3s ease-in-out infinite';
      
      svg.appendChild(path);
    });

    mathPatternRef.current.appendChild(svg);
  };

  useEffect(() => {
    const tl = gsap.timeline();

    // Create mathematical patterns
    createMathematicalPattern();

    // Initial setup
    gsap.set([logoRef.current, textRef.current, progressRef.current], {
      opacity: 0,
      y: 30
    });

    gsap.set(mathPatternRef.current?.querySelector('svg'), {
      opacity: 0,
      scale: 0.8
    });

    // Main animation timeline with configurable duration
    const totalDuration = loaderConfig.duration;
    const particleDuration = totalDuration * 0.4;
    const contentDuration = totalDuration * 0.3;
    const progressDuration = totalDuration * 0.2;
    const exitDuration = totalDuration * 0.1;

    tl.to(mathPatternRef.current?.querySelector('svg'), {
      opacity: 1,
      scale: 1,
      duration: particleDuration,
      ease: "power2.out"
    })
    .to(logoRef.current, {
      opacity: 1,
      y: 0,
      duration: contentDuration,
      ease: "power3.out"
    }, "-=0.5")
    .to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: contentDuration * 0.8,
      ease: "power2.out"
    }, "-=0.3")
    .to(progressRef.current, {
      opacity: 1,
      y: 0,
      duration: contentDuration * 0.6,
      ease: "power2.out"
    }, "-=0.2")
    .to(progressRef.current?.querySelector('.progress-bar'), {
      width: '100%',
      duration: progressDuration,
      ease: "power2.inOut"
    }, "-=0.1")
    .to([logoRef.current, textRef.current, progressRef.current], {
      opacity: 0,
      y: -30,
      duration: exitDuration,
      ease: "power2.in"
    }, "+=0.2")
    .to(mathPatternRef.current?.querySelector('svg'), {
      opacity: 0,
      scale: 1.2,
      duration: exitDuration,
      ease: "power2.in"
    }, "-=0.1")
    .to(containerRef.current, {
      opacity: 0,
      duration: exitDuration,
      ease: "power2.inOut",
      onComplete: onComplete
    });

    return () => {
      tl.kill();
    };
  }, [onComplete, loaderConfig]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-orange-50 to-white"
    >
      {/* Mathematical pattern background */}
      <div ref={mathPatternRef} className="absolute inset-0 overflow-hidden">
        {/* Patterns will be created dynamically */}
      </div>

      {/* Geometric overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-white/50 to-orange-100/30" />

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div ref={logoRef} className="mb-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="w-16 h-16 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-inner"></div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-xl opacity-50 -z-10"></div>
          </div>
        </div>

        {/* Text */}
        <div ref={textRef} className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
            {loaderConfig.name}
          </h1>
          <p className="text-gray-700 text-lg font-light tracking-wide">
            {loaderConfig.description}
          </p>
        </div>

        {/* Progress bar */}
        <div ref={progressRef} className="w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="progress-bar h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-full w-0 shadow-lg"></div>
          </div>
          <p className="text-gray-600 text-sm mt-3 font-light">Initializing systems...</p>
        </div>
      </div>

      {/* Corner mathematical elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-2 border-orange-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
        <div className="w-full h-full border-2 border-orange-300/20 rounded-full animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
      </div>
      <div className="absolute top-8 right-8 w-12 h-12 border-2 border-orange-500/30 transform rotate-45 animate-pulse"></div>
      <div className="absolute bottom-8 left-8 w-20 h-20 border-2 border-orange-400/20 rounded-full animate-spin" style={{ animationDuration: '10s' }}>
        <div className="w-full h-full border-2 border-orange-300/20 rounded-full animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}></div>
      </div>
      <div className="absolute bottom-8 right-8 w-14 h-14 border-2 border-orange-500/20 transform rotate-45 animate-pulse"></div>

      {/* Add CSS for path drawing animation */}
      <style>{`
        @keyframes drawPath {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
      `}</style>
    </div>
  );
};

export default AestheticLoader;

