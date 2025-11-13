import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Mail, Lightbulb, Clock, Briefcase, FileSearch, LayoutGrid } from 'lucide-react';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const PRIMARY_TABS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ScrollText, label: 'Resume', path: '/cv-optimizer' },
  { icon: Briefcase, label: 'Apps', path: '/applications' },
  { icon: Mail, label: 'Templates', path: '/email-templates' },
  // "More" will be a button opening a sheet, not a route
];

const MORE_ITEMS: NavItem[] = [
  { icon: FileSearch, label: 'ATS Check', path: '/cv-analysis' },
  { icon: Clock, label: 'Interviews', path: '/upcoming-interviews' },
  { icon: ScrollText, label: 'Campaigns', path: '/campaigns' },
  { icon: Lightbulb, label: 'Ideas', path: '/recommendations' },
];

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname.startsWith('/dashboard');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const isAnyMoreActive = MORE_ITEMS.some(i => isActivePath(i.path));

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:hidden border-t border-gray-200/80 dark:border-gray-800/80"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.06)',
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="bg-white/90 dark:bg-gray-900/85">
          <nav className="h-[64px] max-w-[520px] mx-auto px-3 flex items-center justify-between">
            {PRIMARY_TABS.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex-1 basis-0 flex flex-col items-center justify-center h-full active:scale-[0.98] transition-transform"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="tab-dot"
                        className="absolute top-1 w-8 h-1 rounded-full bg-purple-500/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <item.icon
                    className={`w-6 h-6 mb-0.5 transition-colors ${
                      isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <span
                    className={`text-[11px] leading-none tracking-tight whitespace-nowrap transition-colors ${
                      isActive ? 'text-purple-600 dark:text-purple-300 font-medium' : 'text-gray-500 dark:text-gray-400'
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
              className="relative flex-1 basis-0 flex flex-col items-center justify-center h-full active:scale-[0.98] transition-transform"
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen}
            >
              <AnimatePresence>
                {isAnyMoreActive && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute top-1 w-8 h-1 rounded-full bg-purple-500/90"
                  />
                )}
              </AnimatePresence>
              <LayoutGrid
                className={`w-6 h-6 mb-0.5 ${isAnyMoreActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
              />
              <span
                className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                  isAnyMoreActive ? 'text-purple-600 dark:text-purple-300 font-medium' : 'text-gray-500 dark:text-gray-400'
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
            <motion.div
              className="fixed inset-0 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 md:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
            >
              <div className="mx-auto max-w-[520px] rounded-t-2xl bg-white dark:bg-gray-900 shadow-xl border-t border-gray-200/80 dark:border-gray-800/80">
                <div className="flex items-center justify-center py-2">
                  <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>
                <div className="px-4 pb-3 grid grid-cols-4 gap-3">
                  {MORE_ITEMS.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setIsMoreOpen(false);
                          navigate(item.path);
                        }}
                        className="group flex flex-col items-center p-3 rounded-xl bg-gray-50/60 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <item.icon
                          className={`w-6 h-6 mb-1 ${
                            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-[12px] leading-none tracking-tight ${
                            isActive ? 'text-purple-600 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="w-full py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition"
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