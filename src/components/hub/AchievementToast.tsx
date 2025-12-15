/**
 * AchievementToast Component
 * Premium, minimal achievement notification with elegant animations
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Mission } from '../../types/missions';

interface AchievementToastProps {
  mission: Mission | null;
  onComplete: () => void;
}

export default function AchievementToast({ mission, onComplete }: AchievementToastProps) {
  const [progress, setProgress] = useState(100);
  const duration = 4000; // 4 seconds

  useEffect(() => {
    if (!mission) {
      setProgress(100);
      return;
    }

    // Start progress countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [mission, onComplete]);

  return (
    <AnimatePresence>
      {mission && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
          className="fixed bottom-6 right-6 z-[200] pointer-events-auto"
        >
          {/* Premium glass card */}
          <div 
            className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(39, 39, 42, 0.9) 100%)',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              minWidth: '320px',
            }}
          >
            {/* Subtle gradient accent line at top */}
            <div 
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(134, 239, 172, 0.6) 20%, rgba(134, 239, 172, 0.8) 50%, rgba(134, 239, 172, 0.6) 80%, transparent)',
              }}
            />

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-4">
                {/* Success indicator - elegant circle with check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="relative flex-shrink-0"
                >
                  {/* Outer glow ring */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="absolute -inset-1 rounded-xl opacity-40"
                    style={{
                      background: 'radial-gradient(circle, rgba(134, 239, 172, 0.4) 0%, transparent 70%)',
                    }}
                  />
                  <div 
                    className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(134, 239, 172, 0.15) 0%, rgba(134, 239, 172, 0.05) 100%)',
                      border: '1px solid rgba(134, 239, 172, 0.25)',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: 0.2,
                      }}
                    >
                      <Check className="w-5 h-5 text-green-400" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Mission info */}
                <div className="flex-1 min-w-0">
                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center gap-1.5 mb-1"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Completed
                    </span>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-[15px] font-semibold text-white truncate leading-tight"
                  >
                    {mission.title}
                  </motion.h3>

                  {/* XP Reward */}
                  {mission.xpReward && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="flex items-center gap-1.5 mt-1.5"
                    >
                      <div 
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%)',
                          border: '1px solid rgba(251, 191, 36, 0.2)',
                        }}
                      >
                        <Zap className="w-3 h-3 text-amber-400" fill="currentColor" />
                        <span className="text-xs font-semibold text-amber-400">
                          +{mission.xpReward} XP
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Subtle progress bar at bottom */}
            <div className="h-0.5 bg-white/[0.03]">
              <motion.div
                className="h-full"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(134, 239, 172, 0.3), rgba(134, 239, 172, 0.15))',
                }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
