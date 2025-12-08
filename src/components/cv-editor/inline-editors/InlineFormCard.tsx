import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface InlineFormCardProps {
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  saveLabel?: string;
}

export default function InlineFormCard({
  children,
  onCancel,
  onSave,
  onDelete,
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
      {/* Premium Card with subtle border glow */}
      <div className="bg-white dark:bg-[#242325] rounded-xl border-2 border-gray-300/80 dark:border-[#4a494b]/80 shadow-xl shadow-gray-900/5 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        {/* Form Content */}
        <div className="p-4 space-y-3">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-900/20 border-t border-gray-200/80 dark:border-[#3d3c3e]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e] hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
            >
              Cancel
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="group px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-[#2b2a2c] border border-red-200/60 dark:border-red-800/60 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200"
                title="Delete this item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 text-xs font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            {saveLabel || (isEditing ? 'Save' : 'Create')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
