import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const months = [
  { value: 0, label: 'Janvier', short: 'janv.' },
  { value: 1, label: 'Février', short: 'févr.' },
  { value: 2, label: 'Mars', short: 'mars' },
  { value: 3, label: 'Avril', short: 'avr.' },
  { value: 4, label: 'Mai', short: 'mai' },
  { value: 5, label: 'Juin', short: 'juin' },
  { value: 6, label: 'Juillet', short: 'juil.' },
  { value: 7, label: 'Août', short: 'août' },
  { value: 8, label: 'Septembre', short: 'sept.' },
  { value: 9, label: 'Octobre', short: 'oct.' },
  { value: 10, label: 'Novembre', short: 'nov.' },
  { value: 11, label: 'Décembre', short: 'déc.' },
];

const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return firstDay === 0 ? 6 : firstDay - 1;
};

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'jj/mm/aaaa',
  className = '',
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month: month - 1 }; // month is 0-indexed
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize currentDate with value when value changes
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        setCurrentDate({ year, month: month - 1 });
      }
    }
  }, [value]);

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

  const handleDateSelect = (day: number) => {
    const newValue = `${currentDate.year}-${String(currentDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    // Parse YYYY-MM-DD format correctly
    const [year, month, day] = val.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return val;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  // Parse selected date correctly from YYYY-MM-DD format
  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month: month - 1, day }; // month is 0-indexed
  })() : null;
  const selectedDay = selectedDate ? selectedDate.day : null;
  const selectedMonth = selectedDate ? selectedDate.month : null;
  const selectedYear = selectedDate ? selectedDate.year : null;

  const goToCurrentDate = () => {
    const now = new Date();
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() });
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    onChange(`${now.getFullYear()}-${month}-${day}`);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDay = getFirstDayOfMonth(currentDate.year, currentDate.month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Get previous month's days to fill the grid
  const prevMonthDays = [];
  const prevMonth = currentDate.month === 0 ? 11 : currentDate.month - 1;
  const prevYear = currentDate.month === 0 ? currentDate.year - 1 : currentDate.year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
    prevMonthDays.push(i);
  }
  
  // Get next month's days to fill the grid
  const totalCells = prevMonthDays.length + days.length;
  const nextMonthDays = [];
  const remainingCells = 42 - totalCells; // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(i);
  }

  const currentMonthLabel = months[currentDate.month].label;

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
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
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
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {currentMonthLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    // Toggle year selector (simplified - just show year)
                    const yearInput = prompt('Entrez l\'année:', String(currentDate.year));
                    if (yearInput && !isNaN(parseInt(yearInput))) {
                      setCurrentDate(prev => ({ ...prev, year: parseInt(yearInput) }));
                    }
                  }}
                  className="text-base font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {currentDate.year}
                </button>
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
              {daysOfWeek.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="p-2">
              <div className="grid grid-cols-7 gap-1">
                {/* Previous month days */}
                {prevMonthDays.map((day) => (
                  <button
                    key={`prev-${day}`}
                    type="button"
                    disabled
                    className="p-2 text-xs text-gray-300 dark:text-gray-600 cursor-default"
                  >
                    {day}
                  </button>
                ))}
                
                {/* Current month days */}
                {days.map((day) => {
                  const isSelected = 
                    selectedDate &&
                    day === selectedDay &&
                    currentDate.month === selectedMonth &&
                    currentDate.year === selectedYear;
                  
                  const isToday = (() => {
                    const today = new Date();
                    return (
                      day === today.getDate() &&
                      currentDate.month === today.getMonth() &&
                      currentDate.year === today.getFullYear()
                    );
                  })();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`
                        p-2 text-xs font-medium rounded-md transition-all duration-200
                        ${isSelected
                          ? 'bg-purple-600 text-white shadow-md'
                          : isToday
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
                
                {/* Next month days */}
                {nextMonthDays.map((day) => (
                  <button
                    key={`next-${day}`}
                    type="button"
                    disabled
                    className="p-2 text-xs text-gray-300 dark:text-gray-600 cursor-default"
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={goToCurrentDate}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Aujourd'hui
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

