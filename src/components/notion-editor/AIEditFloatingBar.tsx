import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, X, Loader2, Check } from 'lucide-react';

interface AIEditFloatingBarProps {
  isVisible: boolean;
  isStreaming: boolean;
  onAccept: (mode: 'replace' | 'insert') => void;
  onReject: () => void;
  streamingText?: string;
  // Optional layout offsets for centering relative to content area
  sidebarWidth?: number;
  assistantWidth?: number;
}

export default function AIEditFloatingBar({
  isVisible,
  isStreaming,
  onAccept,
  onReject,
  streamingText = '',
  sidebarWidth = 0,
  assistantWidth = 0,
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

  // Calculate the horizontal center offset to account for sidebars
  // Center = (viewport - sidebar - assistant) / 2 + sidebar
  const horizontalOffset = sidebarWidth > 0 || assistantWidth > 0
    ? `calc(50% + ${(sidebarWidth - assistantWidth) / 2}px)`
    : '50%';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={barRef}
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ 
            type: 'spring', 
            stiffness: 380, 
            damping: 28,
            mass: 0.8
          }}
          style={{ left: horizontalOffset }}
          className="fixed bottom-8 -translate-x-1/2 z-50"
        >
          {/* Premium Apple-style glassmorphism container */}
          <div className="relative">
            {/* Animated gradient glow behind the bar */}
            <motion.div 
              className="absolute -inset-2 rounded-[32px] opacity-70 dark:opacity-50 blur-2xl"
              style={{
                background: isStreaming 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(192, 132, 252, 0.35), rgba(236, 72, 153, 0.25))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(52, 211, 153, 0.3), rgba(59, 130, 246, 0.2))'
              }}
              animate={{
                scale: [1, 1.02, 1],
                opacity: isStreaming ? [0.5, 0.7, 0.5] : 0.6
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Main container with premium glassmorphism */}
            <div className="relative flex items-center gap-4 px-5 py-3.5
              bg-white/75 dark:bg-[#1c1c1e]/75
              backdrop-blur-3xl backdrop-saturate-[200%]
              border border-white/60 dark:border-white/[0.12]
              rounded-[24px]
              shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2),0_4px_20px_-8px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)]
              dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_4px_20px_-8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)]"
            >
              {/* AI Status Indicator - Apple style pill */}
              <div className="flex items-center gap-3 pr-4 border-r border-gray-200/50 dark:border-white/[0.1]">
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center
                  transition-all duration-700 ease-out overflow-hidden
                  ${isStreaming 
                    ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500' 
                    : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500'
                  }`}
                >
                  {/* Shimmering overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-white/40" />
                  
                  {/* Inner shadow for depth */}
                  <div className="absolute inset-0 rounded-2xl shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]" />
                  
                  {isStreaming ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin relative z-10 drop-shadow-sm" />
                  ) : (
                    <Check className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
                  )}
                  
                  {/* Animated pulsing ring for streaming */}
                  {isStreaming && (
                    <motion.div
                      className="absolute -inset-1 rounded-2xl border-2 border-violet-300/60"
                      animate={{ 
                        scale: [1, 1.15, 1], 
                        opacity: [0.6, 0, 0.6] 
                      }}
                      transition={{ 
                        duration: 1.8, 
                        repeat: Infinity, 
                        ease: 'easeOut' 
                      }}
                    />
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-gray-800 dark:text-white tracking-tight">
                    {isStreaming ? 'Writing' : 'Ready'}
                  </span>
                  {wordCount > 0 && (
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium tabular-nums">
                      {wordCount} words
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons - Apple style with refined aesthetics */}
              <div className="flex items-center gap-2.5">
                {/* Discard Button - Subtle & refined */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onReject}
                  className="flex items-center gap-2 px-4 py-2.5
                    text-[13px] font-semibold
                    text-gray-500 dark:text-gray-400
                    hover:text-gray-700 dark:hover:text-gray-200
                    hover:bg-gray-100/70 dark:hover:bg-white/[0.08]
                    rounded-xl transition-all duration-200"
                  title="Discard (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>Discard</span>
                </motion.button>

                {/* Replace Button - Primary CTA with premium styling */}
                <motion.button
                  whileHover={{ scale: isStreaming ? 1 : 1.04 }}
                  whileTap={{ scale: isStreaming ? 1 : 0.96 }}
                  onClick={() => onAccept('replace')}
                  disabled={isStreaming}
                  className={`relative flex items-center gap-2 px-5 py-2.5
                    text-[13px] font-semibold
                    rounded-xl transition-all duration-200 overflow-hidden
                    ${isStreaming 
                      ? 'text-gray-400 dark:text-gray-500 bg-gray-100/60 dark:bg-white/[0.04] cursor-not-allowed' 
                      : 'text-white bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-600 hover:via-purple-600 hover:to-violet-700 shadow-lg shadow-violet-500/30 dark:shadow-violet-500/25'
                    }`}
                  title={isStreaming ? 'Wait for AI...' : 'Replace content (⌘+Enter)'}
                >
                  {/* Shimmer shine effect on hover */}
                  {!isStreaming && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-white/30" />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                  <RefreshCw className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Replace</span>
                </motion.button>

                {/* Add Below Button - Secondary with elegant styling */}
                <motion.button
                  whileHover={{ scale: isStreaming ? 1 : 1.04 }}
                  whileTap={{ scale: isStreaming ? 1 : 0.96 }}
                  onClick={() => onAccept('insert')}
                  disabled={isStreaming}
                  className={`flex items-center gap-2 px-5 py-2.5
                    text-[13px] font-semibold
                    rounded-xl transition-all duration-200
                    ${isStreaming 
                      ? 'text-gray-400 dark:text-gray-500 bg-gray-100/60 dark:bg-white/[0.04] cursor-not-allowed' 
                      : 'text-violet-600 dark:text-violet-300 bg-violet-50/80 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25 border border-violet-200/70 dark:border-violet-400/20'
                    }`}
                  title={isStreaming ? 'Wait for AI...' : 'Add below current content'}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add below</span>
                </motion.button>
              </div>

              {/* Keyboard hint - Apple style minimal */}
              <div className="hidden md:flex items-center pl-3 border-l border-gray-200/50 dark:border-white/[0.1]">
                <kbd className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider
                  text-gray-400 dark:text-gray-500 uppercase
                  bg-gray-50/80 dark:bg-white/[0.05]
                  rounded-lg border border-gray-200/60 dark:border-white/[0.08]
                  shadow-[0_2px_0_rgba(0,0,0,0.04)]
                  dark:shadow-[0_2px_0_rgba(255,255,255,0.02)]">
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
