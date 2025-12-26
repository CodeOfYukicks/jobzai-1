import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Briefcase,
  FileSearch,
  Clock,
  LayoutGrid,
  Target,
  LayoutDashboard,
  Lightbulb,
  Settings,
  User,
  Calendar
} from 'lucide-react';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

// Primary tabs shown in the bottom nav bar
const PRIMARY_TABS: NavItem[] = [
  { icon: Home, label: 'Hub', path: '/hub' },
  { icon: Briefcase, label: 'Apps', path: '/applications' },
  { icon: FileSearch, label: 'Resume', path: '/cv-analysis' },
  { icon: Clock, label: 'Interviews', path: '/upcoming-interviews' },
  // "More" will be a button opening a sheet, not a route
];

// Items shown in the "More" bottom sheet
const MORE_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Target, label: 'Campaigns', path: '/campaigns-auto' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: Lightbulb, label: 'Insights', path: '/recommendations' },
  { icon: User, label: 'Profile', path: '/professional-profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActivePath = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub';
    if (path === '/dashboard') return location.pathname === '/' || location.pathname.startsWith('/dashboard');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isAnyMoreActive = MORE_ITEMS.some(i => isActivePath(i.path));

  // Brand color - matches the app's primary violet
  const activeColor = 'text-[#635BFF]';
  const activeBg = 'bg-[#635BFF]';

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-200/60 dark:border-[#3d3c3e]/60 bg-white/95 dark:bg-[#2b2a2c]/95 backdrop-blur-xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <nav className="h-[64px] max-w-[480px] mx-auto px-2 flex items-center justify-around">
            {PRIMARY_TABS.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center justify-center min-w-[56px] h-full active:scale-95 transition-transform"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active pill indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-indicator"
                        className={`absolute top-1.5 w-6 h-1 rounded-full ${activeBg}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <item.icon
                    className={`w-5 h-5 mb-0.5 transition-colors ${isActive ? activeColor : 'text-gray-400 dark:text-gray-500'
                      }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] leading-tight tracking-tight whitespace-nowrap transition-colors ${isActive ? `${activeColor} font-semibold` : 'text-gray-500 dark:text-gray-400 font-medium'
                      }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setIsMoreOpen(true)}
              className="relative flex flex-col items-center justify-center min-w-[56px] h-full active:scale-95 transition-transform"
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen}
            >
              <AnimatePresence>
                {isAnyMoreActive && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    className={`absolute top-1.5 w-6 h-1 rounded-full ${activeBg}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  />
                )}
              </AnimatePresence>
              <LayoutGrid
                className={`w-5 h-5 mb-0.5 transition-colors ${isAnyMoreActive ? activeColor : 'text-gray-400 dark:text-gray-500'
                  }`}
                strokeWidth={isAnyMoreActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] leading-tight tracking-tight whitespace-nowrap ${isAnyMoreActive ? `${activeColor} font-semibold` : 'text-gray-500 dark:text-gray-400 font-medium'
                  }`}
              >
                More
              </span>
            </button>
          </nav>
        </div>
      </motion.div>

      {/* More bottom sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 z-50 md:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div
                className="mx-auto max-w-[480px] rounded-t-2xl bg-white dark:bg-[#2b2a2c] shadow-2xl border-t border-gray-100 dark:border-[#3d3c3e]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                {/* Handle */}
                <div className="flex items-center justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Grid of items */}
                <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                  {MORE_ITEMS.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setIsMoreOpen(false);
                          navigate(item.path);
                        }}
                        className={`group flex flex-col items-center p-4 rounded-xl transition-all active:scale-95 ${isActive
                          ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                          : 'bg-gray-50 dark:bg-[#3d3c3e]/40 hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60'
                          }`}
                      >
                        <item.icon
                          className={`w-6 h-6 mb-2 ${isActive ? activeColor : 'text-gray-500 dark:text-gray-400'
                            }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span
                          className={`text-[12px] leading-tight text-center ${isActive ? `${activeColor} font-semibold` : 'text-gray-600 dark:text-gray-300 font-medium'
                            }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Close button */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="w-full py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 
                      bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-xl
                      hover:bg-gray-200 dark:hover:bg-[#3d3c3e] 
                      active:scale-[0.98] transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}