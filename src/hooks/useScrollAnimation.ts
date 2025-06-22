
import { useEffect, useRef } from 'react';
import { AnimationController } from '../utils/animations';

export const useScrollAnimation = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      const animation = AnimationController.scrollReveal(elementRef.current);
      
      return () => {
        animation.kill();
      };
    }
  }, []);

  return elementRef;
};
