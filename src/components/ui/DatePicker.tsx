import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
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
  return firstDay === 0 ? 6 : firstDay - 1;
};

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Sélectionner une date',
  className = '',
  buttonClassName = '',
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month: month - 1 };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 380; // Approximate height
      
      // Position above if not enough space below
      const positionAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      
      setDropdownPosition({
        top: positionAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 320 - 8)),
        width: Math.max(rect.width, 300),
      });
    }
  }, []);

  // Synchronize currentDate with value
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        setCurrentDate({ year, month: month - 1 });
      }
    }
  }, [value]);

  // Update position on open and scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
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
    const [year, month, day] = val.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return val;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month: month - 1, day };
  })() : null;

  const goToCurrentDate = () => {
    const now = new Date();
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() });
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    onChange(`${now.getFullYear()}-${month}-${day}`);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => ({
      year: prev.month === 0 ? prev.year - 1 : prev.year,
      month: prev.month === 0 ? 11 : prev.month - 1,
    }));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => ({
      year: prev.month === 11 ? prev.year + 1 : prev.year,
      month: prev.month === 11 ? 0 : prev.month + 1,
    }));
  };

  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDay = getFirstDayOfMonth(currentDate.year, currentDate.month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Previous month padding
  const prevMonth = currentDate.month === 0 ? 11 : currentDate.month - 1;
  const prevYear = currentDate.month === 0 ? currentDate.year - 1 : currentDate.year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  const prevMonthDays = Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + 1 + i);
  
  // Next month padding (fill to 6 rows)
  const totalCells = prevMonthDays.length + days.length;
  const nextMonthDays = Array.from({ length: Math.max(0, 42 - totalCells) }, (_, i) => i + 1);

  const calendarDropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[99999] bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#3d3c3e] overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(dropdownPosition.width, 300),
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          {/* Header with Month/Year Navigation */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {months[currentDate.month].label} {currentDate.year}
              </h3>
            </div>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 px-3 py-2 bg-gray-50 dark:bg-[#242325]">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month days */}
              {prevMonthDays.map((day) => (
                <div
                  key={`prev-${day}`}
                  className="aspect-square flex items-center justify-center text-sm text-gray-300 dark:text-gray-600"
                >
                  {day}
                </div>
              ))}
              
              {/* Current month days */}
              {days.map((day) => {
                const isSelected = 
                  selectedDate &&
                  day === selectedDate.day &&
                  currentDate.month === selectedDate.month &&
                  currentDate.year === selectedDate.year;
                
                const today = new Date();
                const isToday = 
                  day === today.getDate() &&
                  currentDate.month === today.getMonth() &&
                  currentDate.year === today.getFullYear();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all duration-150
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30 scale-105'
                        : isToday
                        ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] font-bold ring-2 ring-[#8B5CF6]/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6]'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
              
              {/* Next month days */}
              {nextMonthDays.map((day) => (
                <div
                  key={`next-${day}`}
                  className="aspect-square flex items-center justify-center text-sm text-gray-300 dark:text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325]">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={goToCurrentDate}
              className="px-4 py-1.5 text-sm font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
          bg-white dark:bg-[#242325] text-gray-900 dark:text-gray-100
          flex items-center justify-between
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-[#3d3c3e]' 
            : 'border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20'
          }
          ${isOpen ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20' : ''}
          ${buttonClassName}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <span className={`text-left flex-1 truncate ${value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}`}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </button>

      {/* Portal for Calendar Dropdown */}
      {typeof document !== 'undefined' && createPortal(calendarDropdown, document.body)}
    </div>
  );
}
