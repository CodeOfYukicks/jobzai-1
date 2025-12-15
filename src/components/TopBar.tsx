import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Command, User, Settings, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitch from './ThemeSwitch';
import { NotificationCenter } from './NotificationCenter';
import { useAssistant } from '../contexts/AssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarConfig, DEFAULT_AVATAR_CONFIG, loadAvatarConfig } from './assistant/avatar';
import type { ProfileAvatarConfig, ProfileAvatarType } from './profile/avatar';
import { ProfileAvatar, DEFAULT_PROFILE_AVATAR_CONFIG } from './profile/avatar';

interface TopBarProps {
  profilePhoto: string;
  profileAvatarType?: ProfileAvatarType;
  profileAvatarConfig?: ProfileAvatarConfig;
  userInitial: string;
  userFirstName: string;
  userEmail: string;
  isDarkMode: boolean;
  onThemeToggle: (checked: boolean) => void;
  sidebarWidth: number;
  profileCompletion: number;
  onSignOut: () => void;
  onOpenSearch?: () => void;
}

export default function TopBar({
  profilePhoto,
  profileAvatarType = 'photo',
  profileAvatarConfig = DEFAULT_PROFILE_AVATAR_CONFIG,
  userInitial,
  userFirstName,
  userEmail,
  isDarkMode,
  onThemeToggle,
  sidebarWidth,
  profileCompletion,
  onSignOut,
  onOpenSearch,
}: TopBarProps) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { isOpen: isAssistantOpen, openAssistant, closeAssistant } = useAssistant();
  const { currentUser } = useAuth();
  
  // Avatar config for assistant button
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  
  // Load avatar config - reload when assistant closes (after potential save)
  useEffect(() => {
    const loadConfig = async () => {
      if (currentUser?.uid) {
        try {
          const config = await loadAvatarConfig(currentUser.uid);
          setAvatarConfig(config);
        } catch (error) {
          console.error('[TopBar] Error loading avatar config:', error);
        }
      }
    };
    loadConfig();
  }, [currentUser?.uid, isAssistantOpen]); // Reload when assistant opens/closes

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="fixed top-0 right-0 z-50 h-12 bg-white dark:bg-[#2b2a2c] border-b border-gray-200 dark:border-[#3d3c3e]"
      style={{ left: sidebarWidth }}
    >
      <div className="h-full flex items-center justify-center px-4 relative">
        {/* Center: Search Bar */}
        <div className="w-full max-w-xl">
          <button
            onClick={onOpenSearch}
            className="relative group w-full"
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-hover:text-[#635BFF] transition-colors" />
            </div>
            <div
              className="w-full h-9 pl-10 pr-20 bg-gray-50 dark:bg-[#242325] 
                border border-gray-200 dark:border-[#3d3c3e] 
                rounded-lg text-sm text-left
                text-gray-400 dark:text-gray-500
                group-hover:border-[#635BFF]/50 group-hover:bg-white dark:group-hover:bg-[#2b2a2c]
                group-hover:shadow-sm
                transition-all duration-200
                flex items-center cursor-pointer"
            >
              Search across Jobzai...
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#3d3c3e] border border-gray-200 dark:border-[#4a494b] group-hover:border-[#635BFF]/30 transition-colors">
                <Command className="h-3 w-3 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400">K</span>
              </div>
            </div>
          </button>
        </div>

        {/* Right: Actions - Positioned absolutely */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Assistant Button with AI Glow */}
          <div className="ai-glow-wrapper">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Directly check state and toggle - this prevents conflicts with backdrop/click handlers
                if (isAssistantOpen) {
                  closeAssistant();
                } else {
                  openAssistant();
                }
              }}
              onMouseDown={(e) => {
                // Prevent mousedown from triggering click outside handlers
                e.stopPropagation();
              }}
              className="relative flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-lg
                bg-gray-900 dark:bg-white
                border border-gray-900 dark:border-white
                hover:bg-gray-800 dark:hover:bg-gray-100
                active:scale-[0.98]
                transition-all duration-150"
              aria-label="Assistant"
              title="AI Assistant"
            >
              <Avatar 
                config={avatarConfig}
                size={24}
                className="rounded-md"
              />
              <span className="text-[13px] font-medium text-white dark:text-gray-900">Assistant</span>
            </button>
          </div>

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
                  {profileAvatarType === 'avatar' && profileAvatarConfig.hair ? (
                    <ProfileAvatar 
                      config={profileAvatarConfig}
                      size={28}
                      className="h-full w-full"
                    />
                  ) : profilePhoto ? (
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
                        {profileAvatarType === 'avatar' && profileAvatarConfig.hair ? (
                          <ProfileAvatar 
                            config={profileAvatarConfig}
                            size={40}
                            className="h-full w-full"
                          />
                        ) : profilePhoto ? (
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
