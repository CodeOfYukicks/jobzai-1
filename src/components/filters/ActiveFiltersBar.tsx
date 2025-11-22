import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveFilter {
    category: string;
    value: string;
    label: string;
}

interface ActiveFiltersBarProps {
    filters: ActiveFilter[];
    onRemove: (category: string, value: string) => void;
    onClearAll: () => void;
}

export function ActiveFiltersBar({ filters, onRemove, onClearAll }: ActiveFiltersBarProps) {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 py-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Active filters:
            </span>

            <AnimatePresence mode="popLayout">
                {filters.map((filter) => (
                    <motion.button
                        key={`${filter.category}-${filter.value}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => onRemove(filter.category, filter.value)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group"
                    >
                        <span>{filter.label}</span>
                        <X className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </motion.button>
                ))}
            </AnimatePresence>

            {filters.length > 1 && (
                <button
                    onClick={onClearAll}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors ml-1"
                >
                    Clear all
                </button>
            )}
        </div>
    );
}
