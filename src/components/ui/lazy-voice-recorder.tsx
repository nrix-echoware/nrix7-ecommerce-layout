import React, { Suspense, lazy } from 'react';
import { MessageSquare, Mic } from 'lucide-react';

// Lazy load the heavy VoiceRecorder component
const VoiceRecorder = lazy(() => import('./voice-recorder').then(module => ({ 
  default: module.VoiceRecorder 
})));

interface LazyVoiceRecorderProps {
  onAudioData?: (audioBlob: Blob) => void;
  className?: string;
  isAuthenticated?: boolean;
  user?: any;
}

// Loading fallback component
const VoiceRecorderSkeleton = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50" />
    
    {/* Animated background pattern */}
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 animate-pulse" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                         radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)`,
        animation: 'pulse 3s ease-in-out infinite'
      }} />
    </div>
    
    {/* Content skeleton */}
    <div className="relative z-10 p-12 flex flex-col justify-center items-center h-full">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
            <MessageSquare className="w-6 h-6 text-white/60" />
          </div>
          <div className="h-8 bg-white/20 rounded-lg mb-4 animate-pulse" />
          <div className="h-6 bg-white/15 rounded-lg w-3/4 mx-auto animate-pulse" />
        </div>
        
        {/* Controls skeleton */}
        <div className="flex justify-center items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse flex items-center justify-center">
            <Mic className="w-8 h-8 text-white/60" />
          </div>
        </div>
        
        {/* Status skeleton */}
        <div className="h-6 bg-white/15 rounded-lg w-1/2 mx-auto animate-pulse mb-6" />
        
        {/* Authentication status skeleton */}
        <div className="h-4 bg-white/10 rounded w-1/3 mx-auto animate-pulse" />
      </div>
    </div>
    
    <style jsx>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

export function LazyVoiceRecorder(props: LazyVoiceRecorderProps) {
  return (
    <Suspense fallback={<VoiceRecorderSkeleton className={props.className} />}>
      <VoiceRecorder {...props} />
    </Suspense>
  );
}
