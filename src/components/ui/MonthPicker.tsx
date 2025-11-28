import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthPickerProps {
  value: string; // Format: YYYY-MM
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const months = [
  { value: '01', label: 'January', short: 'Jan' },
  { value: '02', label: 'February', short: 'Feb' },
  { value: '03', label: 'March', short: 'Mar' },
  { value: '04', label: 'April', short: 'Apr' },
  { value: '05', label: 'May', short: 'May' },
  { value: '06', label: 'June', short: 'Jun' },
  { value: '07', label: 'July', short: 'Jul' },
  { value: '08', label: 'August', short: 'Aug' },
  { value: '09', label: 'September', short: 'Sep' },
  { value: '10', label: 'October', short: 'Oct' },
  { value: '11', label: 'November', short: 'Nov' },
  { value: '12', label: 'December', short: 'Dec' },
];

export default function MonthPicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select month',
  className = '',
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    if (value) {
      return parseInt(value.split('-')[0]);
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleMonthSelect = (monthValue: string) => {
    const newValue = `${currentYear}-${monthValue}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const [year, month] = val.split('-');
    const monthObj = months.find(m => m.value === month);
    return monthObj ? `${monthObj.label} ${year}` : val;
  };

  const selectedMonth = value ? value.split('-')[1] : null;

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    onChange(`${now.getFullYear()}-${month}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-xl border transition-all duration-200
          bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white
          flex items-center justify-between
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-200/60 dark:border-gray-700/50' 
            : 'border-gray-200/80 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10'
          }
          ${isOpen ? 'ring-2 ring-gray-900/5 dark:ring-white/10 border-gray-300 dark:border-gray-500' : ''}
        `}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className={`text-left flex-1 truncate text-[15px] ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden"
            style={{ 
              minWidth: '280px',
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            {/* Year Navigation */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setCurrentYear(currentYear - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </motion.button>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                {currentYear}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setCurrentYear(currentYear + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Months Grid */}
            <div className="p-3">
              <div className="grid grid-cols-4 gap-1.5">
                {months.map((month) => {
                  const isSelected = selectedMonth === month.value && value?.startsWith(String(currentYear));
                  return (
                    <motion.button
                      key={month.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handleMonthSelect(month.value)}
                      className={`
                        px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200
                        ${isSelected
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}
                    >
                      {month.short}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
