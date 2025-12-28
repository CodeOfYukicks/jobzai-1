import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileSearch,
  Briefcase,
  Clock,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import {
  navigationGroups,
  applyPaths,
  trackPaths,
  preparePaths,
  menuPaths,
  type NavItem
} from '../../config/navigationConfig';

// Tab categories that show submenus
type TabCategory = 'apply' | 'track' | 'prepare';

// Bottom tab bar configuration - 5 tabs max (intent-based)
const BOTTOM_TABS = [
  { id: 'hub', icon: Home, label: 'Hub', path: '/hub', hasSubmenu: false },
  { id: 'apply', icon: FileSearch, label: 'Apply', path: null, hasSubmenu: true },
  { id: 'track', icon: Briefcase, label: 'Track', path: null, hasSubmenu: true },
  { id: 'prepare', icon: Clock, label: 'Prepare', path: null, hasSubmenu: true },
  { id: 'menu', icon: Menu, label: 'Menu', path: null, hasSubmenu: false },
] as const;

// Category items for submenus
const CATEGORY_ITEMS: Record<TabCategory, NavItem[]> = {
  apply: navigationGroups.apply,
  track: navigationGroups.track,
  prepare: navigationGroups.prepare,
};

// Menu sections for full-screen modal
const MENU_SECTIONS = [
  { id: 'apply', label: 'Apply', items: navigationGroups.apply },
  { id: 'track', label: 'Track', items: navigationGroups.track },
  { id: 'prepare', label: 'Prepare', items: navigationGroups.prepare },
  { id: 'improve', label: 'Improve', items: navigationGroups.improve },
  { id: 'account', label: 'Account', items: navigationGroups.account },
] as const;

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<TabCategory | null>(null);

  // Check if a path is active
  const isActivePath = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub';
    if (path === '/dashboard') return location.pathname === '/' || location.pathname.startsWith('/dashboard');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Determine which tab is active based on current path
  const getActiveTab = () => {
    if (location.pathname === '/hub') return 'hub';
    if (applyPaths.some(p => isActivePath(p))) return 'apply';
    if (trackPaths.some(p => isActivePath(p))) return 'track';
    if (preparePaths.some(p => isActivePath(p))) return 'prepare';
    if (menuPaths.some(p => isActivePath(p))) return 'menu';
    return null;
  };

  const activeTab = getActiveTab();

  // Brand color - matches the app's primary violet
  const activeColor = 'text-[#635BFF]';
  const activeBg = 'bg-[#635BFF]';

  const handleTabPress = (tab: typeof BOTTOM_TABS[number]) => {
    if (tab.id === 'menu') {
      setActiveSubmenu(null);
      setIsMenuOpen(true);
    } else if (tab.id === 'hub') {
      setActiveSubmenu(null);
      navigate('/hub');
    } else if (tab.hasSubmenu) {
      // Toggle submenu for category tabs
      if (activeSubmenu === tab.id) {
        setActiveSubmenu(null);
      } else {
        setActiveSubmenu(tab.id as TabCategory);
      }
    }
  };

  const handleSubmenuItemPress = (item: NavItem) => {
    setActiveSubmenu(null);
    navigate(item.href);
  };

  const handleMenuItemPress = (item: NavItem) => {
    setIsMenuOpen(false);
    navigate(item.href);
  };

  const closeSubmenu = () => {
    setActiveSubmenu(null);
  };

  return (
    <>
      {/* Category Submenu Popover */}
      <AnimatePresence>
        {activeSubmenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSubmenu}
            />

            {/* Submenu Sheet */}
            <motion.div
              className="fixed bottom-[88px] left-4 right-4 z-40 md:hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl shadow-black/20 border border-gray-200/50 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {activeSubmenu}
                  </h3>
                </div>

                {/* Items */}
                <div className="p-2">
                  {CATEGORY_ITEMS[activeSubmenu].map((item) => {
                    const isItemActive = isActivePath(item.href);
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleSubmenuItemPress(item)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-xl
                          transition-all active:scale-[0.98]
                          ${isItemActive
                            ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-lg
                          ${isItemActive
                            ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                            : 'bg-gray-100 dark:bg-gray-800'
                          }
                        `}>
                          <item.icon
                            className={`w-4 h-4 ${isItemActive
                                ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                                : 'text-gray-500 dark:text-gray-400'
                              }`}
                            strokeWidth={isItemActive ? 2.5 : 2}
                          />
                        </div>

                        {/* Label */}
                        <span className={`
                          flex-1 text-left text-[14px]
                          ${isItemActive
                            ? 'font-semibold text-[#635BFF] dark:text-[#a5a0ff]'
                            : 'font-medium text-gray-700 dark:text-gray-200'
                          }
                        `}>
                          {item.name}
                        </span>

                        {/* Chevron */}
                        <ChevronRight className={`
                          w-4 h-4
                          ${isItemActive
                            ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                            : 'text-gray-300 dark:text-gray-600'
                          }
                        `} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden rounded-2xl bg-white/70 dark:bg-[#2b2a2c]/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl shadow-black/10"
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <nav className="h-[64px] max-w-[480px] mx-auto px-2 flex items-center justify-around">
          {BOTTOM_TABS.map((tab) => {
            const isActive = tab.id === 'menu' ? isMenuOpen : activeTab === tab.id;
            const isSubmenuOpen = activeSubmenu === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                className="relative flex flex-col items-center justify-center min-w-[56px] h-full active:scale-95 transition-transform"
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={isSubmenuOpen ? true : undefined}
              >
                {/* Active pill indicator */}
                <AnimatePresence>
                  {(isActive || isSubmenuOpen) && (
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
                <tab.icon
                  className={`w-5 h-5 mb-0.5 transition-colors ${isActive || isSubmenuOpen ? activeColor : 'text-gray-400 dark:text-gray-500'
                    }`}
                  strokeWidth={isActive || isSubmenuOpen ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] leading-tight tracking-tight whitespace-nowrap transition-colors ${isActive || isSubmenuOpen ? `${activeColor} font-semibold` : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Full-Screen Navigation Menu Modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Full-Screen Sheet */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-[#1a1a1a]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
              >
                <div className="px-4 py-4 space-y-6">
                  {MENU_SECTIONS.map((section) => (
                    <div key={section.id}>
                      {/* Section Header */}
                      <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {section.label}
                      </h3>

                      {/* Section Items */}
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const isItemActive = isActivePath(item.href);
                          return (
                            <button
                              key={item.href}
                              onClick={() => handleMenuItemPress(item)}
                              className={`
                                w-full flex items-center gap-3 px-3 py-3.5 rounded-xl
                                transition-all active:scale-[0.98]
                                ${isItemActive
                                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }
                              `}
                            >
                              {/* Icon */}
                              <div className={`
                                flex items-center justify-center w-9 h-9 rounded-lg
                                ${isItemActive
                                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                                  : 'bg-gray-100 dark:bg-gray-800'
                                }
                              `}>
                                <item.icon
                                  className={`w-5 h-5 ${isItemActive
                                      ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                                      : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  strokeWidth={isItemActive ? 2.5 : 2}
                                />
                              </div>

                              {/* Label */}
                              <span className={`
                                flex-1 text-left text-[15px]
                                ${isItemActive
                                  ? 'font-semibold text-[#635BFF] dark:text-[#a5a0ff]'
                                  : 'font-medium text-gray-700 dark:text-gray-200'
                                }
                              `}>
                                {item.name}
                              </span>

                              {/* Chevron */}
                              <ChevronRight className={`
                                w-4 h-4
                                ${isItemActive
                                  ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                                  : 'text-gray-300 dark:text-gray-600'
                                }
                              `} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}