import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

interface Slide {
  image: string;
  heading: string;
  subtext: string;
  tag?: string;
}

const slides: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    heading: 'Minimal Luxury',
    subtext: 'Timeless essentials for the modern wardrobe.',
    tag: 'New',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    heading: 'Modern Silhouettes',
    subtext: 'Effortless style, elevated basics.',
    tag: 'Sale',
  },
  {
    image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    heading: 'Sustainable Craft',
    subtext: 'Responsibly sourced, beautifully made.',
    tag: 'Featured',
  },
];

export const HeroSlider: React.FC = () => {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bgRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    timeline.current = gsap.timeline({ defaults: { duration: 1, ease: 'power3.out' } });
    timeline.current.fromTo(
      textRefs.current,
      { opacity: 0, y: 60, skewY: 8 },
      { opacity: 1, y: 0, skewY: 0, stagger: 0.15 },
    );
    timeline.current.fromTo(
      bgRef.current,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 1.2 },
      0.2
    );
    return () => { timeline.current?.kill(); };
  }, [active]);

  // Auto-advance
  useEffect(() => {
    const id = setTimeout(() => setActive((a) => (a + 1) % slides.length), 4200);
    return () => clearTimeout(id);
  }, [active]);

  const handleNav = (dir: number) => {
    setActive((prev) => (prev + dir + slides.length) % slides.length);
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-neutral-100">
      <div ref={bgRef} className="absolute inset-0 z-0">
        <img
          src={slides[active].image}
          alt="Hero background"
          className="object-cover w-full h-full opacity-80 scale-105 transition-all duration-700"
        />
        {/* Layered SVG or shape for extra depth */}
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" width="600" height="600" viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="280" fill="#222" />
        </svg>
      </div>
      <div ref={containerRef} className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div ref={el => textRefs.current[0] = el} className="text-5xl md:text-7xl font-light tracking-tight text-neutral-900 drop-shadow-xl">
          {slides[active].heading}
        </div>
        <div ref={el => textRefs.current[1] = el} className="text-black text-xl md:text-2xl font-normal text-neutral-500 max-w-xl">
          {slides[active].subtext}
        </div>
        <div ref={el => textRefs.current[2] = el}>
          <a
            href="#products"
            className="mt-8 inline-block px-8 py-3 rounded font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg relative group"
          >
            <span className="relative z-10">Shop the Collection</span>
            <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
          </a>
        </div>
        {/* {slides[active].tag && (
          <div className="absolute top-8 left-8 bg-white/80 text-neutral-900 px-4 py-1 rounded-full text-xs font-semibold shadow minimal-shadow animate-pulse">
            {slides[active].tag}
          </div>
        )} */}
      </div>
      {/* Navigation arrows */}
      <button
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-neutral-200 transition-all"
        onClick={() => handleNav(-1)}
        aria-label="Previous slide"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-neutral-200 transition-all"
        onClick={() => handleNav(1)}
        aria-label="Next slide"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
      </button>
      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`block w-2 h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-neutral-900 scale-125' : 'bg-neutral-400'}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
