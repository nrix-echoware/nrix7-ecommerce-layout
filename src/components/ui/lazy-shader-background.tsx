import React, { Suspense, lazy } from 'react';

// Lazy load the heavy ShaderBackground component
const ShaderBackground = lazy(() => import('./shader-background').then(module => ({ 
  default: module.default 
})));

interface LazyShaderBackgroundProps {
  audioLevel?: number;
  className?: string;
}

// Loading fallback for shader background
const ShaderBackgroundSkeleton = ({ className }: { className?: string }) => (
  <div className={`w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50" />
    
    {/* Animated background pattern */}
    <div className="absolute inset-0 opacity-40">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 animate-pulse" />
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 40% 60%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 60% 40%, rgba(34, 197, 94, 0.4) 0%, transparent 50%)`,
          animation: 'shaderPulse 4s ease-in-out infinite'
        }}
      />
    </div>
    
    <style jsx>{`
      @keyframes shaderPulse {
        0%, 100% { 
          opacity: 0.3; 
          transform: scale(1);
        }
        50% { 
          opacity: 0.6; 
          transform: scale(1.02);
        }
      }
    `}</style>
  </div>
);

export function LazyShaderBackground(props: LazyShaderBackgroundProps) {
  return (
    <Suspense fallback={<ShaderBackgroundSkeleton className={props.className} />}>
      <ShaderBackground {...props} />
    </Suspense>
  );
}
