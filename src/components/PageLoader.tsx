import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

const MORPH_PATHS = [
  // Circle
  'M40,20 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0',
  // Squircle
  'M30,20 Q30,10 40,10 Q50,10 50,20 Q50,30 40,30 Q30,30 30,20',
  // Wave
  'M20,20 Q40,0 60,20 Q80,40 60,60 Q40,80 20,60 Q0,40 20,20',
  // Back to Circle
  'M40,20 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0',
];

const PageLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;
    animate(
      pathRef.current,
      {
        d: [
          { value: MORPH_PATHS[0] },
          { value: MORPH_PATHS[1] },
          { value: MORPH_PATHS[2] },
          { value: MORPH_PATHS[3] },
        ],
        duration: 1800,
        direction: 'alternate',
        easing: 'easeInOutSine',
        loop: 2,
        complete: onComplete,
      }
    );
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <svg width="120" height="120" viewBox="0 0 80 80" fill="none">
        <path
          ref={pathRef}
          d={MORPH_PATHS[0]}
          fill="#222"
          stroke="#444"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.10))' }}
        />
      </svg>
    </div>
  );
};

export default PageLoader;
