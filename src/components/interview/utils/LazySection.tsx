import { ReactNode, useRef, useEffect, useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
}

/**
 * Component that only renders its children when it enters the viewport
 * Uses Intersection Observer for efficient lazy loading
 */
export function LazySection({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  minHeight = '200px',
  className = '',
}: LazySectionProps) {
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin,
    enabled: true,
  });

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ minHeight: !hasIntersected ? minHeight : undefined }}
    >
      {hasIntersected ? children : (fallback || <div style={{ minHeight }} />)}
    </div>
  );
}

