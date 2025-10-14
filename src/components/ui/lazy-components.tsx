import React, { Suspense, lazy } from 'react';

// Lazy load heavy UI components
export const LazyDialog = lazy(() => import('./dialog').then(module => ({ 
  default: module.Dialog 
})));

export const LazyDialogContent = lazy(() => import('./dialog').then(module => ({ 
  default: module.DialogContent 
})));

export const LazyDialogHeader = lazy(() => import('./dialog').then(module => ({ 
  default: module.DialogHeader 
})));

export const LazyDialogTitle = lazy(() => import('./dialog').then(module => ({ 
  default: module.DialogTitle 
})));

export const LazyDialogDescription = lazy(() => import('./dialog').then(module => ({ 
  default: module.DialogDescription 
})));

export const LazyDialogFooter = lazy(() => import('./dialog').then(module => ({ 
  default: module.DialogFooter 
})));

// Lazy load form components
export const LazySelect = lazy(() => import('./select').then(module => ({ 
  default: module.Select 
})));

export const LazySelectTrigger = lazy(() => import('./select').then(module => ({ 
  default: module.SelectTrigger 
})));

export const LazySelectValue = lazy(() => import('./select').then(module => ({ 
  default: module.SelectValue 
})));

export const LazySelectContent = lazy(() => import('./select').then(module => ({ 
  default: module.SelectContent 
})));

export const LazySelectItem = lazy(() => import('./select').then(module => ({ 
  default: module.SelectItem 
})));

// Lazy load other heavy components
export const LazyCarousel = lazy(() => import('./carousel').then(module => ({ 
  default: module.Carousel 
})));

export const LazyChart = lazy(() => import('./chart').then(module => ({ 
  default: module.Chart 
})));

// Generic loading fallback component
export const LoadingFallback = ({ className = '', children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      {children || <p className="text-gray-600">Loading...</p>}
    </div>
  </div>
);

// Higher-order component for lazy loading with fallback
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
