
import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { PromotionalReel, PromotionalImage } from '../types/promotional';

gsap.registerPlugin(ScrollTrigger);

interface PromotionalReelsProps {
  reels: PromotionalReel[];
}

const PromotionalReels: React.FC<PromotionalReelsProps> = ({ reels }) => {
  const [selectedReel, setSelectedReel] = useState<PromotionalReel | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Entrance animation for reel items
    gsap.fromTo(
      '.reel-item',
      { 
        opacity: 0, 
        scale: 0.8,
        y: 50 
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Floating animation for reel items
    gsap.utils.toArray('.reel-item').forEach((item, index) => {
      gsap.to(item as Element, {
        y: -10,
        duration: 2 + index * 0.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.2
      });
    });
  }, []);

  const openReel = (reel: PromotionalReel) => {
    setSelectedReel(reel);
    setCurrentImageIndex(0);
    
    // Modal entrance animation
    gsap.fromTo(
      modalRef.current,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
  };

  const closeReel = () => {
    // Modal exit animation
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.5,
      duration: 0.3,
      ease: 'back.in(1.7)',
      onComplete: () => setSelectedReel(null)
    });
  };

  const nextImage = () => {
    if (!selectedReel) return;
    
    gsap.to(imageRef.current, {
      x: -20,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setCurrentImageIndex((prev) => 
          prev === selectedReel.images.length - 1 ? 0 : prev + 1
        );
        gsap.fromTo(
          imageRef.current,
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    });
  };

  const prevImage = () => {
    if (!selectedReel) return;
    
    gsap.to(imageRef.current, {
      x: 20,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setCurrentImageIndex((prev) => 
          prev === 0 ? selectedReel.images.length - 1 : prev - 1
        );
        gsap.fromTo(
          imageRef.current,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    });
  };

  const handleReelClick = (reel: PromotionalReel) => {
    // Click animation
    gsap.to(event?.currentTarget, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => openReel(reel)
    });
  };

  return (
    <>
      <section ref={containerRef} className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
              Featured <span className="font-serif italic">Stories</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our latest collections and behind-the-scenes moments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {reels.map((reel, index) => (
              <div
                key={index}
                className="reel-item cursor-pointer group"
                onClick={() => handleReelClick(reel)}
              >
                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-1 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={reel.media}
                      alt={reel.name}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <p className="text-center mt-3 text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                  {reel.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedReel && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6 flex justify-between items-center">
              <h3 className="text-white text-xl font-semibold">
                {selectedReel.name}
              </h3>
              <button
                onClick={closeReel}
                className="text-white hover:text-gray-300 transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                ref={imageRef}
                src={selectedReel.images[currentImageIndex]?.url}
                alt={selectedReel.images[currentImageIndex]?.title}
                className="w-full h-full object-contain"
              />

              {/* Navigation Buttons */}
              {selectedReel.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="text-white">
                <h4 className="text-lg font-semibold mb-2">
                  {selectedReel.images[currentImageIndex]?.title}
                </h4>
                <p className="text-gray-200 mb-4">
                  {selectedReel.images[currentImageIndex]?.description}
                </p>
                {selectedReel.images[currentImageIndex]?.link && (
                  <a
                    href={selectedReel.images[currentImageIndex].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span>Learn More</span>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {/* Dots Indicator */}
              {selectedReel.images.length > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  {selectedReel.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromotionalReels;
