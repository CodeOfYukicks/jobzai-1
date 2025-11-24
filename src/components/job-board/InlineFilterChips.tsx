import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FilterState } from '../../types/job-board';

interface InlineFilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (category: keyof FilterState, value: string) => void;
  onClearAll: () => void;
}

interface FilterChip {
  category: keyof FilterState;
  value: string;
  label: string;
  color: string;
}

export function InlineFilterChips({ filters, onRemoveFilter, onClearAll }: InlineFilterChipsProps) {
  // Build array of active filter chips
  const chips: FilterChip[] = [];

  // Employment Type
  filters.employmentType.forEach(value => {
    chips.push({
      category: 'employmentType',
      value,
      label: formatLabel(value),
      color: 'blue',
    });
  });

  // Work Location
  filters.workLocation.forEach(value => {
    chips.push({
      category: 'workLocation',
      value,
      label: formatLabel(value),
      color: 'green',
    });
  });

  // Experience Level
  filters.experienceLevel.forEach(value => {
    chips.push({
      category: 'experienceLevel',
      value,
      label: formatLabel(value),
      color: 'purple',
    });
  });

  // Industries
  filters.industries.forEach(value => {
    chips.push({
      category: 'industries',
      value,
      label: value,
      color: 'orange',
    });
  });

  // Technologies
  filters.technologies.forEach(value => {
    chips.push({
      category: 'technologies',
      value,
      label: value,
      color: 'indigo',
    });
  });

  // Skills
  filters.skills.forEach(value => {
    chips.push({
      category: 'skills',
      value,
      label: value,
      color: 'pink',
    });
  });

  // Date Posted
  if (filters.datePosted !== 'any') {
    chips.push({
      category: 'datePosted',
      value: filters.datePosted,
      label: formatDateLabel(filters.datePosted),
      color: 'gray',
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AnimatePresence mode="popLayout">
        {chips.map((chip, index) => (
          <motion.div
            key={`${chip.category}-${chip.value}`}
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ 
              duration: 0.18, 
              delay: index * 0.03,
              ease: [0.34, 1.56, 0.64, 1]
            }}
            whileHover={{ scale: 1.05 }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-all duration-150 shadow-sm
              ${getChipStyles(chip.color)}
            `}
          >
            <span>{chip.label}</span>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemoveFilter(chip.category, chip.value)}
              className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${chip.label} filter`}
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {chips.length > 2 && (
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearAll}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ml-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Clear all
        </motion.button>
      )}
    </div>
  );
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateLabel(value: string): string {
  switch (value) {
    case 'past24h': return 'Last 24h';
    case 'pastWeek': return 'Past week';
    case 'pastMonth': return 'Past month';
    default: return value;
  }
}

function getChipStyles(color: string): string {
  const styles: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return styles[color] || styles.gray;
}

