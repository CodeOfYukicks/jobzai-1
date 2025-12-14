import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarDays, CalendarRange, CalendarClock, Loader2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import { CalendarView } from './types';

interface GoogleCalendarProps {
  isConnected: boolean;
  isLoading: boolean;
  email: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  showGoogleEvents?: boolean;
  onToggleGoogleEvents?: () => void;
}

interface CalendarTopbarProps {
  currentDate: Date;
  selectedView: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange?: (view: CalendarView) => void;
  onAddEvent?: () => void;
  showApplications?: boolean;
  showInterviews?: boolean;
  showWishlists?: boolean;
  onToggleApplications?: () => void;
  onToggleInterviews?: () => void;
  onToggleWishlists?: () => void;
  googleCalendar?: GoogleCalendarProps;
}

export const CalendarTopbar = ({
  currentDate,
  selectedView,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onAddEvent,
  showApplications = true,
  showInterviews = true,
  showWishlists = true,
  onToggleApplications,
  onToggleInterviews,
  onToggleWishlists,
  googleCalendar,
}: CalendarTopbarProps) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showGoogleMenu, setShowGoogleMenu] = useState(false);

  const getDateDisplay = () => {
    if (selectedView === 'month') {
      return moment(currentDate).format('MMMM YYYY');
    } else if (selectedView === 'week') {
      const startOfWeek = moment(currentDate).startOf('week');
      const endOfWeek = moment(currentDate).endOf('week');
      if (startOfWeek.month() === endOfWeek.month()) {
        return `${startOfWeek.format('MMMM D')} - ${endOfWeek.format('D, YYYY')}`;
      }
      return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
    } else {
      return moment(currentDate).format('dddd, MMMM D, YYYY');
    }
  };

  const getSubtitle = () => {
    const today = moment();
    const current = moment(currentDate);
    
    if (selectedView === 'day') {
      if (current.isSame(today, 'day')) {
        return 'Today';
      } else if (current.isSame(today.clone().add(1, 'day'), 'day')) {
        return 'Tomorrow';
      } else if (current.isSame(today.clone().subtract(1, 'day'), 'day')) {
        return 'Yesterday';
      }
    }
    return null;
  };

  const viewOptions: { value: CalendarView; label: string; icon: React.ReactNode }[] = [
    { value: 'month', label: 'Month', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'week', label: 'Week', icon: <CalendarRange className="w-4 h-4" /> },
    { value: 'day', label: 'Day', icon: <CalendarClock className="w-4 h-4" /> },
  ];

  const activeFilters = [!showApplications, !showInterviews, !showWishlists].filter(Boolean).length;

  return (
    <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-[#3d3c3e]">
      {/* Left: Date Display */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getDateDisplay()}
          </h1>
          {getSubtitle() && (
            <p className="text-sm text-[#635BFF] dark:text-[#a5a0ff] mt-1 font-medium">
              {getSubtitle()}
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Google Calendar Button */}
        {googleCalendar && (
          <div className="relative">
            <button
              onClick={() => setShowGoogleMenu(!showGoogleMenu)}
              disabled={googleCalendar.isLoading}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                googleCalendar.isConnected
                  ? 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                  : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] hover:border-[#4285F4] dark:hover:border-[#4285F4]'
              }`}
            >
              {googleCalendar.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleCalendar.isConnected ? (
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {googleCalendar.email?.split('@')[0]}
                </span>
              ) : (
                <span className="hidden sm:inline">Connect Google</span>
              )}
              {googleCalendar.isConnected && (
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {showGoogleMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#242325] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] py-2 min-w-[260px]"
                >
                  {googleCalendar.isConnected ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Google Calendar</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{googleCalendar.email}</p>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Synced</span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Google Events */}
                      {googleCalendar.onToggleGoogleEvents && (
                        <button
                          onClick={googleCalendar.onToggleGoogleEvents}
                          className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-sm bg-[#4285F4]" />
                            <span className={`font-medium ${googleCalendar.showGoogleEvents !== false ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                              Show Google Events
                            </span>
                          </div>
                          <div
                            className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${
                              googleCalendar.showGoogleEvents !== false
                                ? 'bg-[#4285F4]' 
                                : 'bg-gray-200 dark:bg-[#3d3c3e]'
                            }`}
                          >
                            <motion.div
                              animate={{ x: googleCalendar.showGoogleEvents !== false ? 20 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm bg-white"
                            />
                          </div>
                        </button>
                      )}

                      <div className="border-t border-gray-100 dark:border-[#3d3c3e] mt-1 pt-1">
                        <button
                          onClick={() => {
                            googleCalendar.onDisconnect();
                            setShowGoogleMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        googleCalendar.onConnect();
                        setShowGoogleMenu(false);
                      }}
                      disabled={googleCalendar.isLoading}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Connect Google Calendar</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sync your events automatically</p>
                      </div>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* View Switcher - Transparent Style */}
        {onViewChange && (
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-[#2b2a2c] p-1 rounded-lg">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewChange(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedView === option.value
                    ? 'bg-white dark:bg-[#3d3c3e] text-[#635BFF] dark:text-[#a5a0ff] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#635BFF] dark:hover:text-[#a5a0ff]'
                }`}
              >
                {option.icon}
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filter Button - Transparent Style */}
        {onToggleApplications && onToggleInterviews && (
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilterMenu || activeFilters > 0
                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff] border border-[#635BFF]/30 dark:border-[#a5a0ff]/30'
                  : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilters > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#635BFF] dark:bg-[#7c75ff] px-1 text-xs font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#242325] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] py-2 min-w-[240px]"
                >
                  <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Event Types
                  </div>
                  
                  {/* Applications Toggle */}
                  <button
                    onClick={onToggleApplications}
                    className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm bg-[#635BFF]" />
                      <span className={`font-medium ${showApplications ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        Applications
                      </span>
                    </div>
                    <div
                      className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${
                        showApplications 
                          ? 'bg-[#635BFF] dark:bg-[#7c75ff]' 
                          : 'bg-gray-200 dark:bg-[#3d3c3e]'
                      }`}
                    >
                      <motion.div
                        animate={{ x: showApplications ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm bg-white"
                      />
                    </div>
                  </button>
                  
                  {/* Interviews Toggle */}
                  <button
                    onClick={onToggleInterviews}
                    className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                      <span className={`font-medium ${showInterviews ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        Interviews
                      </span>
                    </div>
                    <div
                      className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${
                        showInterviews 
                          ? 'bg-emerald-500 dark:bg-emerald-500' 
                          : 'bg-gray-200 dark:bg-[#3d3c3e]'
                      }`}
                    >
                      <motion.div
                        animate={{ x: showInterviews ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm bg-white"
                      />
                    </div>
                  </button>
                  
                  {/* Wishlists Toggle */}
                  <button
                    onClick={onToggleWishlists}
                    className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm bg-pink-500" />
                      <span className={`font-medium ${showWishlists ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        Wishlist
                      </span>
                    </div>
                    <div
                      className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${
                        showWishlists 
                          ? 'bg-pink-500 dark:bg-pink-500' 
                          : 'bg-gray-200 dark:bg-[#3d3c3e]'
                      }`}
                    >
                      <motion.div
                        animate={{ x: showWishlists ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm bg-white"
                      />
                    </div>
                  </button>
                  
                  {/* Google Events Toggle */}
                  {googleCalendar?.isConnected && googleCalendar.onToggleGoogleEvents && (
                    <button
                      onClick={googleCalendar.onToggleGoogleEvents}
                      className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 border-t border-gray-100 dark:border-[#3d3c3e]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm bg-[#4285F4]" />
                        <span className={`font-medium ${googleCalendar.showGoogleEvents !== false ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                          Google Events
                        </span>
                      </div>
                      <div
                        className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${
                          googleCalendar.showGoogleEvents !== false
                            ? 'bg-[#4285F4]' 
                            : 'bg-gray-200 dark:bg-[#3d3c3e]'
                        }`}
                      >
                        <motion.div
                          animate={{ x: googleCalendar.showGoogleEvents !== false ? 20 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm bg-white"
                        />
                      </div>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Today Button - Transparent Style */}
        <button
          onClick={onToday}
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#635BFF] dark:hover:text-[#a5a0ff] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
        >
          Today
        </button>

        {/* Navigation Buttons - Transparent Style */}
        <div className="flex items-center border border-gray-200 dark:border-[#3d3c3e] rounded-lg">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-500 dark:text-gray-400 hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors rounded-l-lg border-r border-gray-200 dark:border-[#3d3c3e]"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-500 dark:text-gray-400 hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors rounded-r-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Add Event Button - Transparent Style like JobApplicationsPage */}
        {onAddEvent && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddEvent}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-200 
              bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm
              border border-gray-200 dark:border-[#3d3c3e] rounded-lg
              hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/80 
              hover:border-gray-300 dark:hover:border-gray-600
              shadow-sm hover:shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};
