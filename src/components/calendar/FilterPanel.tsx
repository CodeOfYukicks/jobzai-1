import { motion } from 'framer-motion';

interface FilterPanelProps {
  showApplications: boolean;
  showInterviews: boolean;
  onToggleApplications: () => void;
  onToggleInterviews: () => void;
}

export const FilterPanel = ({
  showApplications,
  showInterviews,
  onToggleApplications,
  onToggleInterviews,
}: FilterPanelProps) => {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleApplications}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          showApplications
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-500 dark:text-gray-400'
        }`}
      >
        Applications
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleInterviews}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          showInterviews
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
            : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-500 dark:text-gray-400'
        }`}
      >
        Interviews
      </motion.button>
    </div>
  );
};

