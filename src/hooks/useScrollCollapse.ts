import { useEffect, useState, useRef, RefObject } from 'react';

interface UseScrollCollapseOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useScrollCollapse(
  scrollContainerRef: RefObject<HTMLElement>,
  options: UseScrollCollapseOptions = {}
) {
  const { threshold = 80, enabled = true } = options;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const tickingRef = useRef(false);
  
  // Throttle: minimum time between state updates (ms)
  const THROTTLE_MS = 150;

  useEffect(() => {
    if (!enabled || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const handleScroll = () => {
      if (tickingRef.current) return;
      
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const now = Date.now();
        const currentScrollY = container.scrollTop;
        
        // Throttle state updates
        if (now - lastUpdateTimeRef.current < THROTTLE_MS) {
          tickingRef.current = false;
          return;
        }
        
        const scrollingDown = currentScrollY > lastScrollYRef.current;
        const shouldCollapse = currentScrollY > threshold && scrollingDown;
        const shouldExpand = currentScrollY < threshold;
        
        // Only update state if it actually changes
        if (shouldCollapse && !isCollapsed) {
          setIsCollapsed(true);
          lastUpdateTimeRef.current = now;
        } else if (shouldExpand && isCollapsed) {
          setIsCollapsed(false);
          lastUpdateTimeRef.current = now;
        }

        lastScrollYRef.current = currentScrollY;
        tickingRef.current = false;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef, threshold, enabled, isCollapsed]);

  return isCollapsed;
}

