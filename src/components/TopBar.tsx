import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitch from './ThemeSwitch';

interface TopBarProps {
  profilePhoto: string;
  userInitial: string;
  userFirstName: string;
  isDarkMode: boolean;
  onThemeToggle: (checked: boolean) => void;
  sidebarWidth: number;
}

export default function TopBar({
  profilePhoto,
  userInitial,
  userFirstName,
  isDarkMode,
  onThemeToggle,
  sidebarWidth,
}: TopBarProps) {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="fixed top-0 right-0 z-40 h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      <div className="h-full flex items-center justify-center px-4 relative">
        {/* Center: Search Bar */}
        <div className="w-full max-w-xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#635BFF] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search across Jobzai..."
              className="w-full h-9 pl-10 pr-20 bg-gray-50 dark:bg-gray-900/50 
                border border-gray-200 dark:border-gray-700 
                rounded-lg text-sm text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF]
                transition-all duration-200"
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <Command className="h-3 w-3 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400">K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions - Positioned absolutely */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Theme Toggle */}
          <div className="hidden sm:flex items-center">
            <ThemeSwitch
              checked={isDarkMode}
              onChange={onThemeToggle}
              size={12}
              widthEm={4.5}
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex items-center justify-center h-8 w-8 rounded-lg
                text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-700/50
                hover:text-gray-700 dark:hover:text-gray-200
                transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#635BFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#635BFF]"></span>
              </span>
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 
                    rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 
                    overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <button className="text-xs font-medium text-[#635BFF] hover:text-[#7c75ff] transition-colors">
                        Mark all read
                      </button>
                    </div>
                  </div>

                  {/* Empty State */}
                  <div className="px-4 py-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      No notifications yet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      We'll notify you when something important happens
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <button className="w-full text-xs font-medium text-gray-600 dark:text-gray-300 
                      hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors text-center">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat (placeholder) */}
          <button
            className="flex items-center justify-center h-8 w-8 rounded-lg
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-700/50
              hover:text-gray-700 dark:hover:text-gray-200
              transition-all duration-200"
            aria-label="Chat"
            title="Chat (coming soon)"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

          {/* User Avatar */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-700/50
              transition-all duration-200 group"
          >
            <div className="relative">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#635BFF] to-[#7c75ff] 
                flex items-center justify-center overflow-hidden
                ring-2 ring-transparent group-hover:ring-[#635BFF]/20 transition-all">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt={userFirstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {userInitial}
                  </span>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 
                border-[1.5px] border-white dark:border-gray-800" />
            </div>
            <span className="hidden sm:block text-[13px] font-medium text-gray-700 dark:text-gray-200 
              group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {userFirstName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
