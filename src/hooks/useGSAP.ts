
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useGSAP = (
  callback: (context: { selector: (selector: string) => Element[] }) => void,
  dependencies: React.DependencyList = []
) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const selector = (selector: string): Element[] => {
        const elements = gsap.utils.toArray(selector, containerRef.current);
        return elements.filter((el): el is Element => el instanceof Element);
      };
      
      callback({ selector });
    }, containerRef.current);

    return () => context.revert();
  }, dependencies);

  return containerRef;
};
