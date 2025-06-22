
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class AnimationController {
  static tl = gsap.timeline();

  static init() {
    // Set default GSAP settings
    gsap.defaults({
      duration: 0.8,
      ease: "power2.out"
    });

    // Refresh ScrollTrigger on resize
    ScrollTrigger.addEventListener('refresh', () => ScrollTrigger.refresh());
  }

  static pageTransition(element: HTMLElement, direction: 'in' | 'out') {
    if (direction === 'out') {
      return gsap.to(element, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        ease: "power2.in"
      });
    } else {
      return gsap.fromTo(element, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6,
          ease: "power2.out"
        }
      );
    }
  }

  static staggerFadeIn(elements: HTMLElement[], delay = 0.1) {
    return gsap.fromTo(elements,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: delay,
        ease: "power2.out"
      }
    );
  }

  static hoverScale(element: HTMLElement) {
    const tl = gsap.timeline({ paused: true });
    
    tl.to(element, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    });

    return {
      play: () => tl.play(),
      reverse: () => tl.reverse()
    };
  }

  static scrollReveal(element: HTMLElement, options = {}) {
    return gsap.fromTo(element,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
          ...options
        }
      }
    );
  }

  static morphExpand(fromElement: HTMLElement, toElement: HTMLElement) {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Set initial state
    gsap.set(toElement, {
      position: 'fixed',
      top: fromRect.top,
      left: fromRect.left,
      width: fromRect.width,
      height: fromRect.height,
      zIndex: 1000,
    });

    // Animate to final state
    return gsap.to(toElement, {
      top: toRect.top,
      left: toRect.left,
      width: toRect.width,
      height: toRect.height,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(toElement, { clearProps: "all" });
      }
    });
  }

  static navbarScrollEffect(navbar: HTMLElement) {
    return ScrollTrigger.create({
      start: "top -100",
      end: 99999,
      toggleClass: { 
        className: "scrolled", 
        targets: navbar 
      }
    });
  }

  static parallaxScroll(element: HTMLElement, speed = 0.5) {
    return gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  static cleanup() {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.killTweensOf("*");
  }
}
