
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimationController } from '../utils/animations';
import { ArrowLeft, Home } from 'lucide-react';
import { gsap } from 'gsap';

const NotFound = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && numberRef.current && textRef.current && buttonRef.current) {
      const tl = gsap.timeline();
      
      // Animate 404 number with a glitch effect
      tl.fromTo(numberRef.current,
        { opacity: 0, scale: 0.8, y: 50 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "back.out(1.7)"
        }
      )
      .fromTo(textRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out"
        },
        "-=0.4"
      )
      .fromTo(buttonRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        },
        "-=0.2"
      );

      // Add floating animation to the 404 number
      gsap.to(numberRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }, []);

  const handleBackClick = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div ref={containerRef} className="text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div 
          ref={numberRef}
          className="mb-8"
        >
          <h1 className="text-9xl md:text-[12rem] font-light text-neutral-900 leading-none">
            404
          </h1>
        </div>

        {/* Text Content */}
        <div ref={textRef} className="mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900">
            Page Not Found
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-neutral-500">
            Don't worry, even the best explorers sometimes take a wrong turn.
          </p>
        </div>

        {/* Action Buttons */}
        <div ref={buttonRef} className="space-y-4">
          <Link
            to="/"
            onClick={handleBackClick}
            className="inline-flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-neutral-800 transition-all duration-200 group"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            Back to Home
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              About Us
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-neutral-200 rounded-full opacity-20 animate-[morph_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-neutral-200 rounded-full opacity-20 animate-[morph_6s_ease-in-out_infinite_reverse]" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
