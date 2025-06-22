import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

interface ParallaxSectionProps {
  title: string;
  bgImage: string;
  fgImage: string;
  children?: React.ReactNode;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({ title, bgImage, fgImage, children }) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!bgRef.current || !fgRef.current || !titleRef.current) return;
    gsap.to(bgRef.current, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: bgRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
    gsap.to(fgRef.current, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: fgRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
    gsap.fromTo(titleRef.current, { opacity: 0, y: 40, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 1, scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });
  }, []);

  return (
    <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-white">
      <div ref={bgRef} className="absolute inset-0 z-0">
        <img src={bgImage} alt="Background" className="object-cover w-full h-full opacity-70" />
      </div>
      <div ref={fgRef} className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <img src={fgImage} alt="Foreground" className="object-contain w-1/2 h-1/2 opacity-90" />
      </div>
      <div className="relative z-20 w-full text-center">
        <h2 ref={titleRef} className="text-4xl md:text-5xl font-light text-neutral-900 mb-4 drop-shadow-xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
};

export default ParallaxSection;
