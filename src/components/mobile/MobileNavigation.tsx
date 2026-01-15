import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronRight,
  Home,
  Menu,
  Sparkles
} from 'lucide-react';
import { navigationGroups, type NavItem } from '../../config/navigationConfig';
import MobileAIAssistantModal from './MobileAIAssistantModal';

// Navigation sections for drawer - cleaner organization
const DRAWER_SECTIONS = [
  { id: 'apply', label: 'Apply', items: navigationGroups.apply },
  { id: 'track', label: 'Track', items: navigationGroups.track },
  { id: 'prepare', label: 'Prepare', items: navigationGroups.prepare },
  { id: 'improve', label: 'Improve', items: navigationGroups.improve },
  { id: 'account', label: 'Account', items: navigationGroups.account },
] as const;

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Modal states
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if path is active
  const isActivePath = (path: string) => {
    if (path === '/hub') return location.pathname === '/hub';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation handler
  const handleNavigate = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  // Open AI from drawer
  const handleOpenAI = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setIsAIOpen(true), 150); // Small delay for smooth transition
  };

  return (
    <>
      {/* AI Assistant Modal */}
      <MobileAIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* Single Menu FAB */}
      <motion.button
        onClick={() => setIsDrawerOpen(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed z-40 md:hidden w-14 h-14 rounded-full bg-white dark:bg-[#2c2c2e] shadow-xl flex items-center justify-center"
        style={{
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
          right: '16px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-white/80" strokeWidth={1.75} />
      </motion.button>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
              className="fixed top-0 right-0 bottom-0 z-50 md:hidden w-[85%] max-w-[360px] bg-white dark:bg-[#0C0C0E] shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                paddingTop: 'env(safe-area-inset-top)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-white/[0.06]">
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white/90">
                  Menu
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center justify-center w-8 h-8 -mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-white/40" />
                </button>
              </div>

              {/* AI Assistant Button - Premium CTA */}
              <div className="px-4 pt-4 pb-2">
                <button
                  onClick={handleOpenAI}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: '#B3DE17' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-black" strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block text-[15px] font-semibold text-black">
                      AI Assistant
                    </span>
                    <span className="block text-[12px] text-black/60">
                      Ask anything, get help
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-black/40" />
                </button>
              </div>

              {/* Hub Quick Access */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <button
                  onClick={() => handleNavigate('/hub')}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActivePath('/hub')
                      ? 'bg-[hsl(252,45%,58%)]/10'
                      : 'bg-gray-50 dark:bg-white/[0.04] active:bg-gray-100 dark:active:bg-white/[0.08]'
                    }
                  `}
                >
                  <Home className={`w-5 h-5 ${isActivePath('/hub') ? 'text-[hsl(252,45%,58%)]' : 'text-gray-500 dark:text-white/50'}`} strokeWidth={1.75} />
                  <span className={`text-[15px] ${isActivePath('/hub') ? 'font-semibold text-[hsl(252,45%,58%)]' : 'font-medium text-gray-700 dark:text-white/80'}`}>
                    Home
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-300 dark:text-white/20" />
                </button>
              </div>

              {/* Scrollable Navigation Sections */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
              >
                <div className="py-4">
                  {DRAWER_SECTIONS.map((section, sectionIndex) => (
                    <div key={section.id} className={sectionIndex > 0 ? 'mt-6' : ''}>
                      {/* Section Header */}
                      <h3 className="px-5 mb-1 text-[11px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-[0.5px]">
                        {section.label}
                      </h3>

                      {/* Section Items */}
                      <div>
                        {section.items.map((item: NavItem, index: number) => {
                          const isItemActive = isActivePath(item.href);
                          const isLast = index === section.items.length - 1;
                          return (
                            <div key={item.href}>
                              <button
                                onClick={() => handleNavigate(item.href)}
                                className="w-full flex items-center gap-3 px-5 py-3 transition-all duration-150 active:bg-black/[0.04] dark:active:bg-white/[0.04]"
                              >
                                {/* Icon */}
                                <item.icon
                                  className={`w-5 h-5 flex-shrink-0 ${isItemActive
                                    ? 'text-[#A78BFA]'
                                    : 'text-gray-400 dark:text-white/40'
                                    }`}
                                  strokeWidth={1.5}
                                />

                                {/* Label */}
                                <span className={`
                                  flex-1 text-left text-[16px]
                                  ${isItemActive
                                    ? 'font-medium text-[#A78BFA]'
                                    : 'font-normal text-gray-800 dark:text-white/[0.88]'
                                  }
                                `}>
                                  {item.name}
                                </span>

                                {/* Chevron */}
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20" />
                              </button>
                              {/* Separator */}
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