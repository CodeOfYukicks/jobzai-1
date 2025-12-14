import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, X, Loader2, Sparkles } from 'lucide-react';

interface AIEditFloatingBarProps {
  isVisible: boolean;
  isStreaming: boolean;
  onAccept: (mode: 'replace' | 'insert') => void;
  onReject: () => void;
  streamingText?: string;
}

export default function AIEditFloatingBar({
  isVisible,
  isStreaming,
  onAccept,
  onReject,
  streamingText = '',
}: AIEditFloatingBarProps) {
  // Keyboard shortcuts: Enter to replace, Escape to reject
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onReject();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isStreaming) {
      e.preventDefault();
      onAccept('replace');
    }
  }, [isVisible, isStreaming, onAccept, onReject]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate word count from streaming text
  const wordCount = streamingText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 
            bg-white/95 dark:bg-[#1e1e1f]/95 
            backdrop-blur-xl 
            border border-gray-200/60 dark:border-white/10
            rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30
            ring-1 ring-black/5 dark:ring-white/5"
          >
            {/* AI Indicator */}
            <div className="flex items-center gap-2 pr-3 border-r border-gray-200 dark:border-white/10">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                ${isStreaming 
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}
              >
                {isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {isStreaming ? 'Writing...' : 'Ready'}
                </span>
                {wordCount > 0 && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {wordCount} words
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Discard Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-1.5 
                  text-xs font-medium
                  text-gray-500 dark:text-gray-400
                  hover:text-gray-700 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-white/10
                  rounded-lg transition-all duration-150"
                title="Discard (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard</span>
              </motion.button>

              {/* Replace Button */}
              <motion.button
                whileHover={{ scale: isStreaming ? 1 : 1.02 }}
                whileTap={{ scale: isStreaming ? 1 : 0.98 }}
                onClick={() => onAccept('replace')}
                disabled={isStreaming}
                className={`flex items-center gap-1.5 px-3 py-1.5 
                  text-xs font-semibold
                  rounded-lg transition-all duration-150
                  ${isStreaming 
                    ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 cursor-not-allowed' 
                    : 'text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-500/20'
                  }`}
                title={isStreaming ? 'Wait for AI...' : 'Replace content (⌘+Enter)'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </motion.button>

              {/* Add Below Button */}
              <motion.button
                whileHover={{ scale: isStreaming ? 1 : 1.02 }}
                whileTap={{ scale: isStreaming ? 1 : 0.98 }}
                onClick={() => onAccept('insert')}
                disabled={isStreaming}
                className={`flex items-center gap-1.5 px-3 py-1.5 
                  text-xs font-semibold
                  rounded-lg transition-all duration-150
                  ${isStreaming 
                    ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 cursor-not-allowed' 
                    : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30'
                  }`}
                title={isStreaming ? 'Wait for AI...' : 'Add below current content'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add below</span>
              </motion.button>
            </div>

            {/* Keyboard hint */}
            <div className="hidden md:flex items-center pl-2 border-l border-gray-200 dark:border-white/10">
              <kbd className="px-1.5 py-0.5 text-[9px] font-medium 
                text-gray-400 dark:text-gray-500 
                bg-gray-100 dark:bg-white/5 
                rounded border border-gray-200 dark:border-white/10">
                esc
              </kbd>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
