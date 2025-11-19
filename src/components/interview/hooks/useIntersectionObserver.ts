import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Hook to detect when an element enters the viewport using Intersection Observer
 * Useful for lazy rendering and performance optimization
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = '50px', enabled = true } = options;
  const elementRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);
        
        // Once it has intersected, keep it rendered (don't unrender when scrolling away)
        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, enabled, hasIntersected]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
}

