import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileSectionCardProps {
  title: string;
  icon?: ReactNode;
  completion?: number; // 0-100
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onEdit?: () => void;
  children: ReactNode;
  className?: string;
}

const ProfileSectionCard = ({
  title,
  icon,
  completion,
  isCollapsible = false,
  defaultCollapsed = false,
  onEdit,
  children,
  className = ''
}: ProfileSectionCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const isComplete = completion !== undefined && completion === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative group ${className}`}
    >

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-gray-500 dark:text-gray-400">
                {icon}
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            {completion !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                {isComplete ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                    <Check className="w-3 h-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Done</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    <span className="text-[10px] font-semibold">
                      {completion}%
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <motion.button
                onClick={onEdit}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                title="Edit section"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
            )}
            {isCollapsible && (
              <motion.button
                onClick={() => setIsCollapsed(!isCollapsed)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileSectionCard;






