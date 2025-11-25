import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InlineFormCardProps {
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  isEditing?: boolean;
  saveLabel?: string;
}

export default function InlineFormCard({
  children,
  onCancel,
  onSave,
  isEditing = false,
  saveLabel
}: InlineFormCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Clean Card with subtle blue accent */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-500/10 overflow-hidden">
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 to-blue-600" />
        
        {/* Form Content */}
        <div className="p-3 space-y-3">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="px-3 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all"
          >
            {saveLabel || (isEditing ? 'Save' : 'Create')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
