/**
 * AchievementToast Component
 * Clean, modern achievement notification matching the Daily Missions card aesthetic
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Target, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mission } from '../../types/missions';

interface AchievementToastProps {
  mission: Mission | null;
  onComplete: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Target,
};

export default function AchievementToast({ mission, onComplete }: AchievementToastProps) {
  const [progress, setProgress] = useState(100);
  const duration = 4000; // 4 seconds

  // Subtle confetti burst from bottom right
  const fireConfetti = useCallback(() => {
    if (!mission) return;
    
    // Small burst from the toast position
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x: 0.9, y: 0.85 },
      colors: ['#635BFF', '#8B85FF', '#B7E219', '#FFD700', '#FFFFFF'],
      startVelocity: 25,
      gravity: 0.8,
      scalar: 0.9,
      ticks: 150,
      shapes: ['circle'],
      disableForReducedMotion: true,
    });
  }, [mission]);

  useEffect(() => {
    if (!mission) {
      setProgress(100);
      return;
    }

    // Fire confetti when toast appears
    fireConfetti();

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
  }, [mission, onComplete, fireConfetti]);

  const Icon = mission ? (iconMap[mission.icon] || Target) : Target;

  return (
    <AnimatePresence>
      {mission && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className="fixed bottom-6 right-6 z-[200] pointer-events-auto"
        >
          {/* Main card - matching Daily Missions purple aesthetic */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-[#635BFF] shadow-2xl"
            style={{
              boxShadow: '0 25px 50px -12px rgba(99, 91, 255, 0.5), 0 0 40px rgba(99, 91, 255, 0.3)',
              minWidth: '300px',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-2">
              <div className="uppercase font-bold text-white/60 text-[10px] tracking-widest">
                Mission Complete
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-4">
                {/* Check icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-7 h-7 text-green-300" />
                </motion.div>

                {/* Mission info */}
                <div className="flex-1 min-w-0">
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg font-black text-white truncate"
                >
                  {mission.title}
                </motion.h3>

                {mission.xpReward && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 mt-1"
                    >
                      <span className="text-sm font-bold text-green-300">
                      +{mission.xpReward} XP
                    </span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="text-lg"
                      >
                        🎉
                      </motion.span>
                  </motion.div>
                )}
                </div>
              </div>
            </div>

            {/* Progress bar (auto-dismiss indicator) */}
            <div className="h-1 bg-white/10">
              <motion.div
                className="h-full bg-white/40"
                style={{ 
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.05 }}
              />
            </div>

            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          </div>

          {/* Floating emoji particles */}
          {['✨', '🎯', '⭐', '🏆'].map((emoji, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0.8],
                x: (Math.random() - 0.5) * 120,
                y: -60 - Math.random() * 40,
              }}
              transition={{ 
                duration: 1.5,
                delay: 0.15 + i * 0.1,
                ease: "easeOut",
              }}
              className="absolute left-1/2 bottom-full pointer-events-none text-xl"
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
