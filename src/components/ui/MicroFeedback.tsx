/**
 * MicroFeedback Component
 * 
 * A subtle, elegant feedback indicator that appears briefly.
 * Much less intrusive than traditional toasts.
 * 
 * - Small, minimal design
 * - Appears at bottom center
 * - Auto-dismisses quickly
 * - Supports success, error, warning, info, copied states
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info, Copy } from 'lucide-react';
import { setMicroFeedbackListener } from '@/lib/notify';

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'copied';

interface FeedbackState {
  type: FeedbackType;
  message: string;
}

const feedbackConfig: Record<FeedbackType, {
  icon: typeof Check;
  bgColor: string;
  iconColor: string;
  textColor: string;
}> = {
  success: {
    icon: Check,
    bgColor: 'bg-[#004b23]/95',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
  error: {
    icon: X,
    bgColor: 'bg-red-500/95',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/95',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/95',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
  copied: {
    icon: Copy,
    bgColor: 'bg-violet-500/95',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
};

export function MicroFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    // Register as the global micro-feedback listener
    setMicroFeedbackListener((newFeedback) => {
      setFeedback(newFeedback);
    });

    return () => {
      setMicroFeedbackListener(null);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.message}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
              mass: 0.8
            }}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg
              backdrop-blur-md border border-white/20
              ${feedbackConfig[feedback.type].bgColor}
            `}
          >
            {/* Icon with subtle animation */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
            >
              {(() => {
                const Icon = feedbackConfig[feedback.type].icon;
                return (
                  <Icon
                    className={`w-4 h-4 ${feedbackConfig[feedback.type].iconColor}`}
                    strokeWidth={2.5}
                  />
                );
              })()}
            </motion.div>

            {/* Message */}
            <span className={`text-[13px] font-medium ${feedbackConfig[feedback.type].textColor}`}>
              {feedback.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MicroFeedback;

