
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as anime from 'animejs';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500);
      }
    });

    // Animate the logo with anime.js
    if (logoRef.current) {
      anime.default({
        targets: logoRef.current.querySelectorAll('path'),
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1500,
        delay: (el, i) => i * 250,
        complete: () => {
          // Start GSAP timeline after SVG animation
          tl.fromTo(textRef.current, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 }
          )
          .to([logoRef.current, textRef.current], {
            opacity: 0,
            y: -20,
            duration: 0.6,
            delay: 0.5
          })
          .to(containerRef.current, {
            opacity: 0,
            duration: 0.4
          });
        }
      });
    }

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-background z-50 flex items-center justify-center"
    >
      <div className="text-center">
        <svg
          ref={logoRef}
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="mx-auto mb-8"
        >
          <path
            d="M20 20 L100 20 L100 100 L20 100 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="320"
            strokeDashoffset="320"
          />
          <path
            d="M40 40 L80 40 L80 80 L40 80 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="160"
            strokeDashoffset="160"
          />
        </svg>
        
        <h1 
          ref={textRef}
          className="text-2xl font-playfair font-light tracking-wider opacity-0"
        >
          Ethereal
        </h1>
      </div>
    </div>
  );
};

export default LoadingScreen;
