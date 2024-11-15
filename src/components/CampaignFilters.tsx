import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CampaignFilters {
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

export default function CampaignFilters({ filters, onFilterChange }: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value ? new Date(value) : null
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
        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
          hasActiveFilters
            ? 'bg-[#8D75E6] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Filter className="h-5 w-5 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 bg-white text-[#8D75E6] text-xs font-medium px-2 py-0.5 rounded-full">
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
            className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 border border-gray-200"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filter Campaigns</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#8D75E6] focus:ring-[#8D75E6]"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#8D75E6] focus:ring-[#8D75E6]"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#8D75E6] focus:ring-[#8D75E6]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}