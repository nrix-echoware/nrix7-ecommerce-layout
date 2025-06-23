
import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ExternalLink, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { PromotionalReel, PromotionalImage } from '../types/promotional';

gsap.registerPlugin(ScrollTrigger);

interface PromotionalReelsProps {
  reels: PromotionalReel[];
}

const PromotionalReels: React.FC<PromotionalReelsProps> = ({ reels }) => {
  const [selectedReel, setSelectedReel] = useState<PromotionalReel | null>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const STORY_DURATION = 4000; // 4 seconds per image

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
  }, []);

  const startTimer = () => {
    if (!selectedReel || !isPlaying) return;
    
    startTimeRef.current = Date.now() - pausedTimeRef.current;
    
    const updateProgress = () => {
      if (!isPlaying) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        nextContent();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };
    
    requestAnimationFrame(updateProgress);
  };

  const stopTimer = () => {
    pausedTimeRef.current = Date.now() - startTimeRef.current;
  };

  const resetTimer = () => {
    setProgress(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = Date.now();
  };

  const nextContent = () => {
    if (!selectedReel) return;

    if (currentImageIndex < selectedReel.images.length - 1) {
      // Next image in current reel
      setCurrentImageIndex(prev => prev + 1);
    } else if (currentReelIndex < reels.length - 1) {
      // Next reel
      const nextReel = reels[currentReelIndex + 1];
      setCurrentReelIndex(prev => prev + 1);
      setSelectedReel(nextReel);
      setCurrentImageIndex(0);
    } else {
      // End of all reels
      closeReel();
      return;
    }
    
    resetTimer();
    
    // Animate image change
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  };

  const prevContent = () => {
    if (!selectedReel) return;

    if (currentImageIndex > 0) {
      // Previous image in current reel
      setCurrentImageIndex(prev => prev - 1);
    } else if (currentReelIndex > 0) {
      // Previous reel
      const prevReel = reels[currentReelIndex - 1];
      setCurrentReelIndex(prev => prev - 1);
      setSelectedReel(prevReel);
      setCurrentImageIndex(prevReel.images.length - 1);
    }
    
    resetTimer();
    
    // Animate image change
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (selectedReel && isPlaying) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [selectedReel, isPlaying, currentImageIndex]);

  const openReel = (reel: PromotionalReel, index: number) => {
    setSelectedReel(reel);
    setCurrentReelIndex(index);
    setCurrentImageIndex(0);
    setIsPlaying(true);
    resetTimer();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Modal entrance animation
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  };

  const closeReel = () => {
    setIsPlaying(false);
    
    // Restore body scroll
    document.body.style.overflow = 'unset';
    
    // Modal exit animation
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setSelectedReel(null);
          setProgress(0);
          pausedTimeRef.current = 0;
        }
      });
    }
  };

  const handleReelClick = (reel: PromotionalReel, index: number) => {
    // Click animation
    const target = document.querySelector(`[data-reel-index="${index}"]`);
    if (target) {
      gsap.to(target, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
        onComplete: () => openReel(reel, index)
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedReel) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevContent();
          break;
        case 'ArrowRight':
          nextContent();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          closeReel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReel, currentImageIndex, currentReelIndex, isPlaying]);

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
                data-reel-index={index}
                className="reel-item cursor-pointer group"
                onClick={() => handleReelClick(reel, index)}
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

      {/* Full Screen Modal */}
      {selectedReel && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div
            ref={modalRef}
            className="relative w-full h-full max-w-md mx-auto bg-black flex flex-col"
            style={{ maxWidth: '100vw', maxHeight: '100vh' }}
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
              {selectedReel.images.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{
                      width: index < currentImageIndex ? '100%' : 
                             index === currentImageIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-12 left-4 right-4 z-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                  <img
                    src={selectedReel.media}
                    alt={selectedReel.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-white font-medium text-sm">
                  {selectedReel.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-gray-300 transition-colors duration-200 p-2"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={closeReel}
                  className="text-white hover:text-gray-300 transition-colors duration-200 p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <img
                ref={imageRef}
                src={selectedReel.images[currentImageIndex]?.url}
                alt={selectedReel.images[currentImageIndex]?.title}
                className="w-full h-full object-contain max-w-full max-h-full"
              />

              {/* Touch Areas for Navigation */}
              <div
                className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                onClick={prevContent}
              />
              <div
                className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                onClick={nextContent}
              />
              <div
                className="absolute left-1/3 top-0 w-1/3 h-full z-10 cursor-pointer"
                onClick={togglePlayPause}
              />
            </div>

            {/* Bottom Info */}
            {selectedReel.images[currentImageIndex] && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 z-20">
                <div className="text-white">
                  <h4 className="text-lg font-semibold mb-2">
                    {selectedReel.images[currentImageIndex]?.title}
                  </h4>
                  <p className="text-gray-200 mb-4 text-sm">
                    {selectedReel.images[currentImageIndex]?.description}
                  </p>
                  {selectedReel.images[currentImageIndex]?.link && (
                    <a
                      href={selectedReel.images[currentImageIndex].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 text-sm"
                    >
                      <span>Learn More</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Hints (Desktop) */}
            <div className="hidden md:block">
              {(currentImageIndex > 0 || currentReelIndex > 0) && (
                <button
                  onClick={prevContent}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 z-20"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              
              {(currentImageIndex < selectedReel.images.length - 1) || (currentReelIndex < reels.length - 1) ? (
                <button
                  onClick={nextContent}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 z-20"
                >
                  <ChevronRight size={20} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromotionalReels;
