import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb } from 'lucide-react';

interface ToggleProps {
  label: string;
  description?: string;
  icon?: ReactNode | string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const Toggle = memo(function Toggle({ 
  label, 
  isOpen, 
  onToggle, 
  children 
}: ToggleProps) {
  return (
    <div className="group">
      {/* Toggle Button - Premium minimal */}
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className="
          flex items-center gap-2 
          text-sm font-medium
          text-jobzai-600 dark:text-jobzai-400
          hover:text-jobzai-700 dark:hover:text-jobzai-300
          transition-colors duration-200
        "
      >
        <ChevronRight 
          className={`
            w-4 h-4 
            transition-transform duration-200
            ${isOpen ? 'rotate-90' : ''}
          `} 
        />
        <span>{label}</span>
      </motion.button>

      {/* Content - Premium reveal with animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 pl-6">
              <div className="
                relative
                p-5 rounded-xl
                bg-gradient-to-br from-jobzai-50/80 to-slate-50 dark:from-jobzai-950/30 dark:to-slate-900/50
                ring-1 ring-jobzai-200/40 dark:ring-jobzai-800/30
                text-sm leading-relaxed text-slate-700 dark:text-slate-300
              ">
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-jobzai-500 to-jobzai-400 rounded-l-xl" />
                
                {/* Icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-jobzai-100 dark:bg-jobzai-900/50">
                    <Lightbulb className="w-4 h-4 text-jobzai-600 dark:text-jobzai-400" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
