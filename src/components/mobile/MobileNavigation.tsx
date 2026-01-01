import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileSearch,
  Briefcase,
  Clock,
  Menu,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Avatar } from '../assistant/avatar';
import { DEFAULT_AVATAR_CONFIG } from '../assistant/avatar';
import {
  navigationGroups,
  applyPaths,
  trackPaths,
  preparePaths,
  menuPaths,
  type NavItem
} from '../../config/navigationConfig';
import MobileAIAssistantModal from './MobileAIAssistantModal';

// Tab categories that show submenus
type TabCategory = 'apply' | 'track' | 'prepare';

// Bottom tab bar configuration - 5 tabs max (intent-based)
const BOTTOM_TABS = [
  { id: 'hub', icon: Home, label: 'Hub', path: '/hub', hasSubmenu: false },
  { id: 'apply', icon: FileSearch, label: 'Apply', path: null, hasSubmenu: true },
  { id: 'ai', icon: Sparkles, label: '', path: null, hasSubmenu: false, isSpecial: true },
  { id: 'track', icon: Briefcase, label: 'Track', path: null, hasSubmenu: true },
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
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<TabCategory | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);

  // Scroll detection refs
  const lastScrollY = useRef(0);
  const scrollThreshold = 60; // Pixels before triggering minimize

  // Scroll handler for minimize/expand behavior
  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY.current;

    // At top of page — always expanded
    if (currentY < 20) {
      setIsMinimized(false);
    }
    // Scrolling down past threshold
    else if (delta > 0 && currentY > scrollThreshold && !isMinimized) {
      setIsMinimized(true);
    }
    // Any upward scroll
    else if (delta < -5 && isMinimized) {
      setIsMinimized(false);
    }

    lastScrollY.current = currentY;
  }, [isMinimized]);

  // Attach scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
    if (preparePaths.some(p => isActivePath(p))) return 'prepare'; // Still accessible via menu
    if (menuPaths.some(p => isActivePath(p))) return 'menu';
    return null;
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: typeof BOTTOM_TABS[number]) => {
    if (tab.id === 'menu') {
      setActiveSubmenu(null);
      setIsMenuOpen(true);
    } else if (tab.id === 'ai') {
      setActiveSubmenu(null);
      setIsAIOpen(true);
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
      {/* AI Assistant Modal */}
      <MobileAIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

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

            {/* Submenu Sheet - Premium iOS-like design */}
            <motion.div
              className="fixed bottom-[88px] left-4 right-4 z-40 md:hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="bg-white dark:bg-[#0C0C0E] rounded-2xl shadow-2xl shadow-black/25 border border-gray-200/30 dark:border-white/[0.06] overflow-hidden">
                {/* Header - Subtle section label */}
                <div className="px-5 pt-4 pb-2">
                  <h3 className="text-[11px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-[0.5px]">
                    {activeSubmenu}
                  </h3>
                </div>

                {/* Items - Flat list design */}
                <div className="px-1 pb-2">
                  {CATEGORY_ITEMS[activeSubmenu].map((item, index) => {
                    const isItemActive = isActivePath(item.href);
                    const isLast = index === CATEGORY_ITEMS[activeSubmenu].length - 1;
                    return (
                      <div key={item.href}>
                        <button
                          onClick={() => handleSubmenuItemPress(item)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3
                            transition-all duration-150
                            active:bg-black/[0.04] dark:active:bg-white/[0.04]
                            ${isItemActive ? '' : ''}
                          `}
                        >
                          {/* Icon - Secondary, muted */}
                          <item.icon
                            className={`w-5 h-5 flex-shrink-0 ${isItemActive
                              ? 'text-[#A78BFA]'
                              : 'text-gray-400 dark:text-white/40'
                              }`}
                            strokeWidth={1.5}
                          />

                          {/* Label - Typography first */}
                          <span className={`
                            flex-1 text-left text-[16px]
                            ${isItemActive
                              ? 'font-medium text-[#A78BFA]'
                              : 'font-normal text-gray-800 dark:text-white/[0.88]'
                            }
                          `}>
                            {item.name}
                          </span>

                          {/* Chevron - Subtle */}
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20" />
                        </button>
                        {/* Inset separator */}
                        {!isLast && (
                          <div className="ml-12 mr-4 h-px bg-gray-100 dark:bg-white/[0.06]" />
                        )}
                      </div>
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
        animate={{
          y: 0,
          height: isMinimized ? 52 : 72,
        }}
        transition={{
          height: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }
        }}
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden rounded-2xl bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] shadow-2xl shadow-black/10"
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <nav className={`h-full max-w-[480px] mx-auto px-2 flex items-center justify-around transition-all duration-200`}>
          {BOTTOM_TABS.map((tab) => {
            const isActive = tab.id === 'menu' ? isMenuOpen : activeTab === tab.id;
            const isSubmenuOpen = activeSubmenu === tab.id;
            const isAI = tab.id === 'ai';

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                onTouchStart={() => isAI && setIsAvatarPressed(true)}
                onTouchEnd={() => isAI && setIsAvatarPressed(false)}
                onMouseDown={() => isAI && setIsAvatarPressed(true)}
                onMouseUp={() => isAI && setIsAvatarPressed(false)}
                onMouseLeave={() => isAI && setIsAvatarPressed(false)}
                animate={{
                  scale: isAvatarPressed && isAI ? 0.92 : (isActive || isSubmenuOpen ? 1.02 : 1),
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30
                }}
                className={`relative flex flex-col items-center justify-center min-w-[52px] h-full transition-all
                  ${isAI ? '' : 'active:scale-95'}
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={isSubmenuOpen ? true : undefined}
              >
                {/* Active pill indicator (except for AI) */}
                <AnimatePresence>
                  {(isActive || isSubmenuOpen) && !isAI && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      className={`absolute top-1 w-5 h-0.5 rounded-full bg-[hsl(252,45%,58%)] opacity-80`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.8, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* AI Avatar - Premium, calm design */}
                {isAI ? (
                  <motion.div
                    className="relative flex items-center justify-center"
                    animate={{
                      scale: isMinimized ? 0.75 : 1,
                    }}
                    transition={{
                      scale: { duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }
                    }}
                  >
                    {/* Outer ambient glow - very subtle */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, hsla(252, 45%, 58%, 0.12) 0%, transparent 70%)',
                        transform: 'scale(1.8)',
                        filter: 'blur(8px)',
                        opacity: isAvatarPressed ? 0.3 : 0.15,
                        transition: 'opacity 320ms ease-in-out',
                      }}
                    />

                    {/* Avatar container with refined border */}
                    <div
                      className="relative rounded-full bg-white dark:bg-[#2c2c2e] p-[2px] overflow-hidden"
                      style={{
                        width: isMinimized ? 36 : 48,
                        height: isMinimized ? 36 : 48,
                        boxShadow: `
                          0 0 0 1px rgba(255, 255, 255, 0.08),
                          0 4px 20px hsla(252, 45%, 58%, ${isAvatarPressed ? 0.25 : 0.12}),
                          0 0 32px hsla(252, 45%, 58%, 0.06)
                        `,
                        border: '1.5px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <Avatar
                        config={DEFAULT_AVATAR_CONFIG}
                        size={isMinimized ? 32 : 44}
                        className="bg-transparent rounded-full overflow-hidden"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <tab.icon
                      className={`
                        transition-all duration-200
                        ${isActive || isSubmenuOpen
                          ? 'text-[hsl(252,45%,58%)] dark:text-[hsl(252,60%,72%)]'
                          : 'text-gray-400 dark:text-gray-500'
                        }
                        ${isMinimized ? 'w-5 h-5' : 'w-[22px] h-[22px]'}
                      `}
                      strokeWidth={isActive || isSubmenuOpen ? 2.25 : 1.75}
                    />
                  </div>
                )}

                {/* Label - fades out when minimized */}
                {!isAI && (
                  <motion.span
                    animate={{
                      opacity: isMinimized ? 0 : 1,
                      height: isMinimized ? 0 : 'auto',
                      marginTop: isMinimized ? 0 : 2,
                    }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`text-[10px] leading-tight tracking-tight whitespace-nowrap overflow-hidden
                      ${isActive || isSubmenuOpen
                        ? 'font-semibold text-[hsl(252,45%,58%)] dark:text-[hsl(252,60%,72%)]'
                        : 'font-medium text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </motion.button>
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

            {/* Full-Screen Sheet - Premium iOS-like design */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-[#0C0C0E]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Header - Minimal */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-white/[0.06]">
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white/90">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-8 h-8 -mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-white/40" />
                </button>
              </div>

              {/* Scrollable Content - Flat list design */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
              >
                <div className="py-4">
                  {MENU_SECTIONS.map((section, sectionIndex) => (
                    <div key={section.id} className={sectionIndex > 0 ? 'mt-6' : ''}>
                      {/* Section Header - Subtle label */}
                      <h3 className="px-5 mb-1 text-[11px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-[0.5px]">
                        {section.label}
                      </h3>

                      {/* Section Items - Flat list */}
                      <div>
                        {section.items.map((item, index) => {
                          const isItemActive = isActivePath(item.href);
                          const isLast = index === section.items.length - 1;
                          return (
                            <div key={item.href}>
                              <button
                                onClick={() => handleMenuItemPress(item)}
                                className="w-full flex items-center gap-3 px-5 py-3 transition-all duration-150 active:bg-black/[0.04] dark:active:bg-white/[0.04]"
                              >
                                {/* Icon - Secondary, muted */}
                                <item.icon
                                  className={`w-5 h-5 flex-shrink-0 ${isItemActive
                                    ? 'text-[#A78BFA]'
                                    : 'text-gray-400 dark:text-white/40'
                                    }`}
                                  strokeWidth={1.5}
                                />

                                {/* Label - Typography first */}
                                <span className={`
                                  flex-1 text-left text-[16px]
                                  ${isItemActive
                                    ? 'font-medium text-[#A78BFA]'
                                    : 'font-normal text-gray-800 dark:text-white/[0.88]'
                                  }
                                `}>
                                  {item.name}
                                </span>

                                {/* Chevron - Subtle */}
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20" />
                              </button>
                              {/* Inset separator */}
                              {!isLast && (
                                <div className="ml-14 mr-5 h-px bg-gray-100 dark:bg-white/[0.06]" />
                              )}
                            </div>
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