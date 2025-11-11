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
  { value: '01', label: 'Janvier', short: 'janv.' },
  { value: '02', label: 'Février', short: 'févr.' },
  { value: '03', label: 'Mars', short: 'mars' },
  { value: '04', label: 'Avril', short: 'avr.' },
  { value: '05', label: 'Mai', short: 'mai' },
  { value: '06', label: 'Juin', short: 'juin' },
  { value: '07', label: 'Juillet', short: 'juil.' },
  { value: '08', label: 'Août', short: 'août' },
  { value: '09', label: 'Septembre', short: 'sept.' },
  { value: '10', label: 'Octobre', short: 'oct.' },
  { value: '11', label: 'Novembre', short: 'nov.' },
  { value: '12', label: 'Décembre', short: 'déc.' },
];

export default function MonthPicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Sélectionner un mois',
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
          w-full px-4 py-2.5 rounded-lg border transition-all duration-200
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
          flex items-center justify-between
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600' 
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
          }
          ${isOpen ? 'ring-2 ring-purple-500 border-purple-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className={`text-left flex-1 truncate ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
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
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
            style={{ 
              minWidth: '320px',
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            {/* Year Navigation */}
            <div className="flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20">
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear - 1)}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {currentYear}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear + 1)}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Months Grid */}
            <div className="p-2.5 pb-2">
              <div className="grid grid-cols-4 gap-1.5">
                {months.map((month) => {
                  const isSelected = selectedMonth === month.value && value?.startsWith(String(currentYear));
                  return (
                    <button
                      key={month.value}
                      type="button"
                      onClick={() => handleMonthSelect(month.value)}
                      className={`
                        px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                        ${isSelected
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300'
                        }
                      `}
                    >
                      {month.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                Ce mois
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

