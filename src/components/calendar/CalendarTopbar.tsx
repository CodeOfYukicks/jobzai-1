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
  onToggleApplications?: () => void;
  onToggleInterviews?: () => void;
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
  onToggleApplications,
  onToggleInterviews,
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

  const activeFilters = [!showApplications, !showInterviews].filter(Boolean).length;

  return (
    <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {getDateDisplay()}
          </h1>
          {getSubtitle() && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getSubtitle()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View Switcher - Notion Style */}
        {onViewChange && (
          <div className="hidden sm:flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewChange(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  selectedView === option.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {option.icon}
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filter Button - Notion Style */}
        {onToggleApplications && onToggleInterviews && (
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                showFilterMenu
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full">
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
                  className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[220px]"
                >
                  <div className="px-3 py-2 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Event Types
                  </div>
                  <button
                    onClick={onToggleApplications}
                    className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      <span className={`font-medium ${showApplications ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        Applications
                      </span>
                    </div>
                    <div
                      className={`w-8 h-[18px] rounded-full transition-colors ${
                        showApplications ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-transform transform ${
                          showApplications 
                            ? 'translate-x-[14px] bg-white dark:bg-gray-900' 
                            : 'translate-x-0.5 bg-white dark:bg-gray-500'
                        } mt-[2px]`}
                      />
                    </div>
                  </button>
                  <button
                    onClick={onToggleInterviews}
                    className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className={`font-medium ${showInterviews ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        Interviews
                      </span>
                    </div>
                    <div
                      className={`w-8 h-[18px] rounded-full transition-colors ${
                        showInterviews ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-transform transform ${
                          showInterviews 
                            ? 'translate-x-[14px] bg-white dark:bg-gray-900' 
                            : 'translate-x-0.5 bg-white dark:bg-gray-500'
                        } mt-[2px]`}
                      />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Today Button - Notion Style */}
        <button
          onClick={onToday}
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-150"
        >
          Today
        </button>

        {/* Navigation Buttons - Notion Style */}
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 transition-colors rounded-l-lg border-r border-gray-200 dark:border-gray-700"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 transition-colors rounded-r-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Add Event Button - Notion Style */}
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-lg transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        )}
      </div>
    </div>
  );
};
