/**
 * MissionCelebration Component
 * Full-screen celebration overlay with confetti and premium animations
 * Triggered when a mission is completed
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mission, DAILY_MISSIONS_CONFIG } from '../../types/missions';

interface MissionCelebrationProps {
  completedMission: Mission | null;
  onComplete: () => void;
}

export default function MissionCelebration({ completedMission, onComplete }: MissionCelebrationProps) {
  // Premium confetti burst
  const fireConfetti = useCallback(() => {
    if (!completedMission) return;

    const colors = [completedMission.color, '#FFD700', '#FFFFFF'];
    
    // Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5, x: 0.5 },
      colors,
      startVelocity: 30,
      gravity: 0.8,
      scalar: 1.2,
      drift: 0,
      ticks: 200,
      shapes: ['circle', 'square'],
    });

    // Side cannons with delay
    setTimeout(() => {
      // Left cannon
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
        startVelocity: 45,
        gravity: 1,
        scalar: 0.9,
      });
      // Right cannon
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
        startVelocity: 45,
        gravity: 1,
        scalar: 0.9,
      });
    }, 150);

    // Star shower
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0, x: 0.5 },
        colors,
        startVelocity: 15,
        gravity: 0.5,
        scalar: 1.5,
        shapes: ['star'],
        flat: true,
      });
    }, 300);
  }, [completedMission]);

  // Trigger confetti and auto-dismiss
  useEffect(() => {
    if (completedMission) {
      fireConfetti();
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [completedMission, fireConfetti, onComplete]);

  const config = completedMission 
    ? DAILY_MISSIONS_CONFIG.find(c => c.type === completedMission.type)
    : null;

  return (
    <AnimatePresence>
      {completedMission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Radial gradient pulse background */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 2, 3],
              opacity: [0, 0.3, 0],
            }}
            transition={{ 
              duration: 1.5,
              ease: "easeOut",
            }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${completedMission.color}40 0%, transparent 50%)`,
            }}
          />

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
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
                scale: [0, 1, 0.5],
                x: Math.cos(i * 30 * Math.PI / 180) * 150,
                y: Math.sin(i * 30 * Math.PI / 180) * 150 - 50,
              }}
              transition={{ 
                duration: 1.5,
                delay: i * 0.05,
                ease: "easeOut",
              }}
              className="absolute"
            >
              <Star 
                className="w-4 h-4" 
                style={{ color: i % 2 === 0 ? completedMission.color : '#FFD700' }}
                fill={i % 2 === 0 ? completedMission.color : '#FFD700'}
              />
            </motion.div>
          ))}

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center pointer-events-auto"
            style={{
              boxShadow: `0 25px 50px -12px ${completedMission.color}30, 0 0 0 1px ${completedMission.color}20`,
            }}
          >
            {/* Top glow accent */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full"
              style={{ backgroundColor: completedMission.color }}
            />

            {/* Sparkle decorations */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-6 -right-6"
            >
              <Sparkles className="w-12 h-12 text-yellow-400 opacity-60" />
            </motion.div>

            {/* Success icon with ring */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.2,
                }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: `${completedMission.color}15` }}
              />
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 0 0px ${completedMission.color}40`,
                    `0 0 0 20px ${completedMission.color}00`,
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full"
              />
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <CheckCircle2 
                  className="w-12 h-12" 
                  style={{ color: completedMission.color }}
                />
              </motion.div>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            >
              Mission Complete!
            </motion.h2>

            {/* Mission name */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-medium mb-4"
              style={{ color: completedMission.color }}
            >
              {completedMission.title}
            </motion.p>

            {/* XP reward */}
            {config?.xpReward && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  +{config.xpReward} XP
                </span>
              </motion.div>
            )}

            {/* Motivational text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-gray-500 dark:text-gray-400 mt-4"
            >
              Keep up the great work! 🎯
            </motion.p>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="text-xs text-gray-400 dark:text-gray-500 mt-6"
            >
              Auto-dismissing in a moment...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}







