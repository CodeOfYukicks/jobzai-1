import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CampaignFilters {
  status?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onFilterChange: (filters: CampaignFilters) => void;
}

export function CampaignFilters({ filters, onFilterChange }: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const handleDateChange = (key: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...(filters.dateRange || { start: null, end: null }),
        [key]: value ? new Date(value) : null
      }
    });
  };

  const clearFilters = () => {
    onFilterChange({});
    setIsOpen(false);
  };

  const hasActiveFilters = filters.status || (filters.dateRange?.start || filters.dateRange?.end);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        {hasActiveFilters && (
          <span className="ml-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-medium px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-200 dark:border-gray-700"
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter Campaigns</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear all
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="space-y-3">
                  <div>
                    <input
                      type="date"
                      value={filters.dateRange?.start ? new Date(filters.dateRange.start).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      placeholder="Start date"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filters.dateRange?.end ? new Date(filters.dateRange.end).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      placeholder="End date"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
