import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SelectOption {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface PremiumSelectProps {
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'cards';
}

export const PremiumSelect = ({
  options,
  value,
  onChange,
  multiple = false,
  columns = 2,
  size = 'md',
  variant = 'default'
}: PremiumSelectProps) => {
  const isSelected = (optionId: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  };

  const handleSelect = (optionId: string) => {
    if (multiple && Array.isArray(value)) {
      if (value.includes(optionId)) {
        onChange(value.filter(v => v !== optionId));
      } else {
        onChange([...value, optionId]);
      }
    } else {
      onChange(optionId);
    }
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4'
  };

  const sizeStyles = {
    sm: 'p-2.5 text-sm',
    md: 'p-3.5',
    lg: 'p-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-2.5`}>
      {options.map((option) => {
        const selected = isSelected(option.id);
        
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              relative text-left rounded-xl transition-all duration-200
              ${sizeStyles[size]}
              ${variant === 'outlined' ? 'border' : ''}
              ${selected
                ? 'bg-gray-100 dark:bg-gray-700/60 ring-1 ring-gray-900/10 dark:ring-white/10'
                : 'bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/80 dark:hover:bg-gray-700/40'
              }
              ${variant === 'outlined' && selected
                ? 'border-gray-300 dark:border-gray-600'
                : variant === 'outlined'
                  ? 'border-gray-200/60 dark:border-gray-700/40 hover:border-gray-300 dark:hover:border-gray-600'
                  : ''
              }
            `}
          >
            <div className="flex items-start gap-3">
              {option.icon && (
                <div className={`
                  flex-shrink-0 mt-0.5
                  ${selected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}
                `}>
                  {option.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`
                  font-medium text-[15px] tracking-tight
                  ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                `}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {option.description}
                  </div>
                )}
              </div>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-white dark:text-gray-900" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

// Compact chip-style selection for inline use
interface PremiumChipSelectProps {
  options: Array<{ id: string; label: string }>;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export const PremiumChipSelect = ({
  options,
  value,
  onChange,
  multiple = false
}: PremiumChipSelectProps) => {
  const isSelected = (optionId: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  };

  const handleSelect = (optionId: string) => {
    if (multiple && Array.isArray(value)) {
      if (value.includes(optionId)) {
        onChange(value.filter(v => v !== optionId));
      } else {
        onChange([...value, optionId]);
      }
    } else {
      onChange(optionId);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = isSelected(option.id);
        
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200
              ${selected
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
};

// Toggle switch style
interface PremiumToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const PremiumToggle = ({
  checked,
  onChange,
  label,
  description
}: PremiumToggleProps) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left group"
    >
      <div className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5
        ${checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
      `}>
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`
            absolute top-1 w-4 h-4 rounded-full
            ${checked ? 'bg-white dark:bg-gray-900' : 'bg-white dark:bg-gray-400'}
            shadow-sm
          `}
        />
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
              {label}
            </div>
          )}
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

export default PremiumSelect;













