import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import { CalendarView } from './types';

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
}: CalendarTopbarProps) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
