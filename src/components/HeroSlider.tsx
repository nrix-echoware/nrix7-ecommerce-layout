import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface Slide {
  image: string;
  heading: string;
  subtext: string;
  tag?: string;
}

const fallbackSlides: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?q=80&w=2073&auto=format&fit=crop',
    heading: 'Minimal Luxury',
    subtext: 'Timeless essentials for the modern wardrobe.',
    tag: 'New',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
    heading: 'Modern Silhouettes',
    subtext: 'Effortless style, elevated basics.',
    tag: 'Sale',
  },
  {
    image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?q=80&w=2070&auto=format&fit=crop',
    heading: 'Sustainable Craft',
    subtext: 'Responsibly sourced, beautifully made.',
    tag: 'Featured',
  },
];

export const HeroSlider: React.FC = () => {
  const slidesFromConfig = useSelector((s: RootState) => s.siteConfig.config.hero.slides) as Slide[];
  const slides = slidesFromConfig && slidesFromConfig.length ? slidesFromConfig : fallbackSlides;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const transitionTlRef = useRef<gsap.core.Timeline | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const prevIndexRef = useRef<number>(0);

  // Initialize visual state on mount or when slides change
  useEffect(() => {
    // Kill any existing animation
    transitionTlRef.current?.kill();
    transitionTlRef.current = null;

    // Hide all slides initially
    imageRefs.current.forEach((img) => {
      if (img) gsap.set(img, { autoAlpha: 0, scale: 1.05 });
    });
    textRefs.current.forEach((grp) => {
      if (grp) gsap.set(grp, { autoAlpha: 0, y: 20 });
    });

    // Reveal the initial active slide
    const img = imageRefs.current[active];
    const grp = textRefs.current[active];
    if (img) gsap.set(img, { autoAlpha: 1, scale: 1 });
    if (grp) gsap.set(grp, { autoAlpha: 1, y: 0 });

    prevIndexRef.current = active;

    return () => {
      transitionTlRef.current?.kill();
    };
    // We intentionally skip active here to avoid re-initializing on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // Handle transitions when active changes
  useEffect(() => {
    const prev = prevIndexRef.current;
    const next = active;
    if (prev === next) return;

    transitionTlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    transitionTlRef.current = tl;

    const prevImg = imageRefs.current[prev];
    const prevTxt = textRefs.current[prev];
    const nextImg = imageRefs.current[next];
    const nextTxt = textRefs.current[next];

    if (nextImg) gsap.set(nextImg, { autoAlpha: 0, scale: 1.05 });
    if (nextTxt) gsap.set(nextTxt, { autoAlpha: 0, y: 20 });

    // Outgoing
    if (prevTxt) tl.to(prevTxt, { autoAlpha: 0, y: 10, duration: 0.4 }, 0);
    if (prevImg) tl.to(prevImg, { autoAlpha: 0, scale: 1.03, duration: 0.8 }, 0);

    // Incoming
    if (nextImg) tl.to(nextImg, { autoAlpha: 1, scale: 1, duration: 1.0 }, 0.1);
    if (nextTxt) tl.to(nextTxt, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.25);

    prevIndexRef.current = next;

    return () => {
      tl.kill();
    };
  }, [active]);

  // Autoplay with pause on hover
  useEffect(() => {
    if (paused) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    // timeoutRef.current = window.setTimeout(() => {
    //   setActive((a) => (a + 1) % slides.length);
    // }, 5000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, paused, slides.length]);

  const handleDotClick = (i: number) => {
    if (i === active) return;
    setActive(i);
  };

  return (
    <section
      className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div key={i} className="absolute inset-0">
          <img
            ref={(el) => (imageRefs.current[i] = el)}
            src={s.image}
            alt={s.heading}
            className="w-full h-full object-cover"
          />
          {/* Soft vignette for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/20 to-white/60" />
        </div>
      ))}

      {/* Text overlays */}
      {slides.map((s, i) => (
        <div
          key={`txt-${i}`}
          ref={(el) => (textRefs.current[i] = el)}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center px-6">
            <div className="text-4xl md:text-6xl font-light tracking-tight text-neutral-900">
              {s.heading}
            </div>
            <div className="mt-3 text-neutral-900 text-lg md:text-2xl font-normal max-w-2xl mx-auto">
              {s.subtext}
            </div>
            <Link
              to="/products"
              className="mt-8 inline-block px-8 py-3 rounded font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg"
            >
              Shop the Collection
            </Link>
          </div>
        </div>
      ))}

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={`dot-${i}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === active ? 'bg-neutral-900 scale-125' : 'bg-neutral-400 hover:bg-neutral-500'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
