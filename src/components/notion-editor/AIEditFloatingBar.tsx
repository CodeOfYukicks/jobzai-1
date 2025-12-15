import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X, Check } from 'lucide-react';
import Avatar from '../assistant/avatar/Avatar';
import { AvatarConfig } from '../assistant/avatar/avatarConfig';

interface AIEditFloatingBarProps {
  isVisible: boolean;
  isStreaming: boolean;
  onAccept: (mode: 'replace' | 'insert') => void;
  onReject: () => void;
  streamingText?: string;
  // Optional layout offsets for centering relative to content area
  sidebarWidth?: number;
  assistantWidth?: number;
  // Avatar config for premium branding
  avatarConfig?: AvatarConfig;
}

export default function AIEditFloatingBar({
  isVisible,
  isStreaming,
  onAccept,
  onReject,
  streamingText = '',
  sidebarWidth = 0,
  assistantWidth = 0,
  avatarConfig,
}: AIEditFloatingBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

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

  // Calculate the center position relative to the note content area
  // The note content is between the sidebar (left) and assistant panel (right)
  // Center of content = sidebarWidth + (viewport - sidebarWidth - assistantWidth) / 2
  // This equals: (viewport + sidebarWidth - assistantWidth) / 2
  const contentCenter = sidebarWidth > 0 || assistantWidth > 0
    ? `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px - ${assistantWidth}px) / 2)`
    : '50%';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={barRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 35,
            mass: 0.5
          }}
          style={{ left: contentCenter }}
          className="fixed bottom-6 -translate-x-1/2 z-50"
        >
          {/* Minimal Notion-style container */}
          <div className="relative">
            {/* Subtle shadow */}
            <div className="absolute inset-0 rounded-xl bg-black/5 dark:bg-black/20 blur-xl -z-10" />
            
            {/* Main container */}
            <div className="flex items-center gap-1 p-1.5
              bg-white dark:bg-[#252525]
              border border-gray-200/80 dark:border-[#3a3a3a]
              rounded-xl
              shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.02)]
              dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)]"
            >
              {/* AI Status Indicator with Avatar */}
              <div className="flex items-center gap-2.5 pl-1.5 pr-3">
                {/* Avatar with animated ring */}
                <div className="relative">
                  {isStreaming ? (
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0px rgba(139, 92, 246, 0.4)',
                          '0 0 0 4px rgba(139, 92, 246, 0.15)',
                          '0 0 0 0px rgba(139, 92, 246, 0.4)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-lg"
                    >
                      <Avatar 
                        config={avatarConfig}
                        size={28}
                        className="rounded-lg ring-1 ring-purple-200/60 dark:ring-purple-500/30"
                      />
                    </motion.div>
                  ) : (
                    <div className="relative">
                      <Avatar 
                        config={avatarConfig}
                        size={28}
                        className="rounded-lg ring-1 ring-emerald-200/60 dark:ring-emerald-500/30"
                      />
                      {/* Success checkmark overlay */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full 
                          bg-emerald-500 dark:bg-emerald-400 
                          flex items-center justify-center
                          ring-2 ring-white dark:ring-[#252525]"
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </motion.div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col min-w-[60px]">
                  <span className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
                    {isStreaming ? 'Writing' : 'Done'}
                  </span>
                  {wordCount > 0 && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums leading-tight">
                      {wordCount} words
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 dark:bg-[#3a3a3a]" />

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 px-1">
                {/* Discard Button */}
                <button
                  onClick={onReject}
                  className="flex items-center gap-1.5 px-3 py-2
                    text-[13px] font-medium
                    text-gray-600 dark:text-gray-400
                    hover:text-gray-900 dark:hover:text-white
                    hover:bg-gray-100 dark:hover:bg-[#333]
                    rounded-lg transition-all duration-150"
                >
                  <X className="w-4 h-4" />
                  <span>Discard</span>
                </button>

                {/* Replace Button */}
                <button
                  onClick={() => onAccept('replace')}
                  disabled={isStreaming}
                  className={`flex items-center gap-1.5 px-3 py-2
                    text-[13px] font-medium
                    rounded-lg transition-all duration-150
                    ${isStreaming 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                    }`}
                >
                  <svg 
                    viewBox="0 0 16 16" 
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5.5L6.5 11L4 8.5" />
                  </svg>
                  <span>Replace</span>
                </button>

                {/* Add Below Button */}
                <button
                  onClick={() => onAccept('insert')}
                  disabled={isStreaming}
                  className={`flex items-center gap-1.5 px-3 py-2
                    text-[13px] font-medium
                    rounded-lg transition-all duration-150
                    ${isStreaming 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                    }`}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Add below</span>
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 dark:bg-[#3a3a3a]" />

              {/* Keyboard hint */}
              <div className="flex items-center px-2.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium
                  text-gray-400 dark:text-gray-500 uppercase
                  bg-gray-100 dark:bg-[#333]
                  rounded border border-gray-200 dark:border-[#444]">
                  esc
                </kbd>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
