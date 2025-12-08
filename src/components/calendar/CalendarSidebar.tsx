import { useState } from 'react';
import { Calendar, Filter, Plus, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarView } from './types';

interface CalendarSidebarProps {
  selectedView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onAddEvent: () => void;
  onTodayClick: () => void;
  showApplications: boolean;
  showInterviews: boolean;
  onToggleApplications: () => void;
  onToggleInterviews: () => void;
}

interface TooltipButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}

const TooltipButton = ({ icon, label, onClick, active = false, badge }: TooltipButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
        className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
          active
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-semibold bg-purple-600 text-white rounded-full">
            {badge}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-16 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 dark:bg-[#3d3c3e] text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CalendarSidebar = ({
  selectedView,
  onViewChange,
  onAddEvent,
  onTodayClick,
  showApplications,
  showInterviews,
  onToggleApplications,
  onToggleInterviews,
}: CalendarSidebarProps) => {
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const activeFilters = [!showApplications, !showInterviews].filter(Boolean).length;

  return (
    <div className="hidden lg:flex fixed left-0 top-16 bottom-0 w-16 bg-white/80 dark:bg-[#242325]/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-[#3d3c3e]/50 flex-col items-center py-6 gap-2 z-[40]">
      {/* Logo/Brand */}
      <div className="mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="w-full px-2 space-y-2">
        {/* View Switcher */}
        <div className="relative">
          <TooltipButton
            icon={
              selectedView === 'month' ? (
                <CalendarDays className="w-5 h-5" />
              ) : selectedView === 'week' ? (
                <CalendarRange className="w-5 h-5" />
              ) : (
                <CalendarClock className="w-5 h-5" />
              )
            }
            label={`View: ${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)}`}
            onClick={() => setShowViewMenu(!showViewMenu)}
            active={showViewMenu}
          />

          <AnimatePresence>
            {showViewMenu && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-16 top-0 z-50 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] py-2 min-w-[140px]"
              >
                {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => {
                      onViewChange(view);
                      setShowViewMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                      selectedView === view
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Today Button */}
        <TooltipButton
          icon={<Calendar className="w-5 h-5" />}
          label="Today"
          onClick={onTodayClick}
        />

        {/* Filter Toggle */}
        <div className="relative">
          <TooltipButton
            icon={<Filter className="w-5 h-5" />}
            label="Filters"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            active={showFilterMenu}
            badge={activeFilters > 0 ? activeFilters : undefined}
          />

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-16 top-0 z-50 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] py-2 min-w-[180px]"
              >
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Event Types
                </div>
                <button
                  onClick={onToggleApplications}
                  className="w-full px-4 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]"
                >
                  <span className={showApplications ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}>
                    Applications
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors ${
                      showApplications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-[#4a494b]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                        showApplications ? 'translate-x-4' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
                <button
                  onClick={onToggleInterviews}
                  className="w-full px-4 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]"
                >
                  <span className={showInterviews ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}>
                    Interviews
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors ${
                      showInterviews ? 'bg-purple-600' : 'bg-gray-300 dark:bg-[#4a494b]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                        showInterviews ? 'translate-x-4' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-gray-200 dark:bg-[#2b2a2c] my-2" />

        {/* Add Event Button */}
        <TooltipButton
          icon={<Plus className="w-5 h-5" />}
          label="Add Event"
          onClick={onAddEvent}
        />
      </div>
    </div>
  );
};

