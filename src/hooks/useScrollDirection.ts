import { useState, useEffect, RefObject } from 'react';

interface ScrollState {
  showSidebar: boolean;
  scrollDirection: 'up' | 'down' | null;
  scrollY: number;
}

/**
 * Hook to detect when sidebar is out of viewport
 * Sidebar hides only when it's physically scrolled out of view
 */
export function useSidebarVisibility(sidebarRef: RefObject<HTMLElement>): ScrollState {
  const [showSidebar, setShowSidebar] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const checkSidebarVisibility = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Determine scroll direction
      const scrollDifference = currentScrollY - lastScrollY;
      if (Math.abs(scrollDifference) > 5) {
        setScrollDirection(scrollDifference > 0 ? 'down' : 'up');
      }

      // Check if sidebar is in viewport
      if (sidebarRef.current) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const sidebarBottom = sidebarRect.bottom;
        const windowHeight = window.innerHeight;

        // Sidebar is visible if its bottom is still in viewport
        // Add some buffer (100px) for smooth transition
        const isVisible = sidebarBottom > 100;

        setShowSidebar(isVisible);
      }

      setLastScrollY(currentScrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkSidebarVisibility);
        ticking = true;
      }
    };

    // Initial check
    checkSidebarVisibility();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkSidebarVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkSidebarVisibility);
    };
  }, [lastScrollY, sidebarRef]);

  return { showSidebar, scrollDirection, scrollY };
}

