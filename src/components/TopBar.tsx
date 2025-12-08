import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, Command, User, Settings, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitch from './ThemeSwitch';

interface TopBarProps {
  profilePhoto: string;
  userInitial: string;
  userFirstName: string;
  userEmail: string;
  isDarkMode: boolean;
  onThemeToggle: (checked: boolean) => void;
  sidebarWidth: number;
  profileCompletion: number;
  onSignOut: () => void;
}

export default function TopBar({
  profilePhoto,
  userInitial,
  userFirstName,
  userEmail,
  isDarkMode,
  onThemeToggle,
  sidebarWidth,
  profileCompletion,
  onSignOut,
}: TopBarProps) {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="fixed top-0 right-0 z-40 h-12 bg-white dark:bg-[#2b2a2c] border-b border-gray-200 dark:border-[#3d3c3e]"
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
              className="w-full h-9 pl-10 pr-20 bg-gray-50 dark:bg-[#242325] 
                border border-gray-200 dark:border-[#3d3c3e] 
                rounded-lg text-sm text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF]
                transition-all duration-200"
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#3d3c3e] border border-gray-200 dark:border-[#4a494b]">
                <Command className="h-3 w-3 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400">K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions - Positioned absolutely */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex items-center justify-center h-8 w-8 rounded-lg
                text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
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
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2b2a2c] 
                    rounded-xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] 
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
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#3d3c3e] mb-3">
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
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#242325]">
                    <button className="w-full text-xs font-medium text-gray-600 dark:text-gray-300 
                      hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors text-center">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Assistant Button */}
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg
              bg-[#b7e219]
              border border-gray-200 dark:border-[#4a494b]
              text-gray-900
              hover:bg-[#a5cc17]
              hover:border-gray-300 dark:hover:border-[#5a595b]
              active:scale-[0.98]
              transition-all duration-150"
            aria-label="Assistant"
            title="AI Assistant"
          >
            <Sparkles className="h-4 w-4 text-gray-900" />
            <span className="text-[13px] font-medium text-gray-900">Assistant</span>
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg
                hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
                transition-all duration-200 group"
            >
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7c75ff] 
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
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#2b2a2c] 
                    rounded-xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] 
                    overflow-hidden z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#635BFF] to-[#7c75ff] 
                        flex items-center justify-center overflow-hidden flex-shrink-0">
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt={userFirstName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {userInitial}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {userFirstName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/professional-profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                        hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <span>Your profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                        hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      to="/billing"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                        hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>Billing</span>
                    </Link>
                  </div>

                  {/* Theme Toggle */}
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-200">Theme</span>
                      <ThemeSwitch
                        checked={isDarkMode}
                        onChange={onThemeToggle}
                        size={12}
                        widthEm={4.5}
                      />
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Profile completion
                      </span>
                      <span className="text-xs font-bold text-[#635BFF] dark:text-[#a5a0ff]">
                        {profileCompletion}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#635BFF] to-[#7c75ff] rounded-full transition-all duration-500"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                    {profileCompletion < 100 && (
                      <Link
                        to="/professional-profile"
                        className="flex items-center justify-between mt-2 text-xs text-[#635BFF] dark:text-[#a5a0ff] 
                          hover:text-[#7c75ff] transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <span>Complete your profile</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 
                        hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
