import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarSubmenuProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  isCollapsed: boolean;
  activePaths: string[];
  defaultOpen?: boolean;
}

export default function SidebarSubmenu({
  title,
  icon: Icon,
  children,
  isCollapsed,
  activePaths,
  defaultOpen = false,
}: SidebarSubmenuProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    // Initialize based on current path
    const shouldBeOpen = activePaths.some((path) => {
      if (path === '/cv-optimizer') {
        return location.pathname.startsWith('/cv-optimizer');
      }
      return location.pathname === path || location.pathname.startsWith(path + '/');
    });
    return shouldBeOpen || defaultOpen;
  });
  const [wasManuallyClosed, setWasManuallyClosed] = useState(false);
  const [lastPathname, setLastPathname] = useState(location.pathname);

  // Auto-open/close only when pathname changes (navigation)
  useEffect(() => {
    const shouldBeOpen = activePaths.some((path) => {
      if (path === '/cv-optimizer') {
        return location.pathname.startsWith('/cv-optimizer');
      }
      return location.pathname === path || location.pathname.startsWith(path + '/');
    });
    
    // Only react to pathname changes, not re-renders
    if (location.pathname !== lastPathname) {
      setLastPathname(location.pathname);
      
      // If navigating to an active path, always open the menu (navigation resets manual close)
      if (shouldBeOpen) {
        setIsOpen(true);
        setWasManuallyClosed(false);
      }
      // If navigating away from active paths, close it
      else {
        setIsOpen(false);
        setWasManuallyClosed(false); // Reset when navigating away
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activePaths]);

  // Don't render if collapsed
  if (isCollapsed) {
    return null;
  }

  const isActive = activePaths.some((path) => {
    if (path === '/cv-optimizer') {
      return location.pathname.startsWith('/cv-optimizer');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          // If user is closing the menu, mark it as manually closed
          if (!newState) {
            setWasManuallyClosed(true);
          } else {
            // If user is opening it, reset the manual close flag
            setWasManuallyClosed(false);
          }
        }}
        className={`group w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl 
          transition-all duration-200 relative overflow-hidden
          ${isActive
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <Icon
            className={`h-5 w-5 transition-colors
              ${isActive
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
              }`}
          />
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 text-gray-400
            ${isOpen ? 'rotate-180' : 'rotate-0'}
            ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}
          `}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-4 space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

