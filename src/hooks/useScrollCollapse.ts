import { useEffect, useState, RefObject } from 'react';

interface UseScrollCollapseOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useScrollCollapse(
  scrollContainerRef: RefObject<HTMLElement>,
  options: UseScrollCollapseOptions = {}
) {
  const { threshold = 50, enabled = true } = options;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!enabled || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop;
          
          // Only collapse when scrolling down past threshold
          if (currentScrollY > threshold && currentScrollY > lastScrollY) {
            setIsCollapsed(true);
          } 
          // Expand when scrolling back to near top
          else if (currentScrollY < threshold) {
            setIsCollapsed(false);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef, threshold, enabled, lastScrollY]);

  return isCollapsed;
}

