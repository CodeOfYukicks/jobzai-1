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
      className={`glass-card rounded-xl shadow-premium overflow-hidden relative group ${className}`}
    >
      {/* Gradient accent border on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div 
                className="text-purple-600 dark:text-purple-400 p-1.5 rounded-lg bg-purple-50/80 dark:bg-purple-900/30 backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {icon}
              </motion.div>
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
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-sm shimmer-effect">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Complete</span>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-full border border-amber-400/30">
                    <span className="text-xs font-bold gradient-text">
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
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/30 backdrop-blur-sm rounded-lg transition-all duration-300"
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
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/30 backdrop-blur-sm rounded-lg transition-all duration-300"
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






