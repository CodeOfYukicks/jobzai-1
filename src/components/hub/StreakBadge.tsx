/**
 * StreakBadge Component
 * Premium flame/fire streak indicator with pulsing animation
 * Shows consecutive days of mission completion
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Trophy } from 'lucide-react';
import { MissionStats, STREAK_MILESTONES } from '../../types/missions';

interface StreakBadgeProps {
  stats: MissionStats | null;
  compact?: boolean;
}

// Get streak tier based on current streak
const getStreakTier = (streak: number): {
  tier: string;
  color: string;
  glowColor: string;
  icon: React.ElementType;
} => {
  if (streak >= 30) {
    return {
      tier: 'Legendary',
      color: '#FFD700', // Gold
      glowColor: 'rgba(255, 215, 0, 0.4)',
      icon: Trophy,
    };
  }
  if (streak >= 14) {
    return {
      tier: 'Epic',
      color: '#A855F7', // Purple
      glowColor: 'rgba(168, 85, 247, 0.4)',
      icon: Flame,
    };
  }
  if (streak >= 7) {
    return {
      tier: 'Rare',
      color: '#3B82F6', // Blue
      glowColor: 'rgba(59, 130, 246, 0.4)',
      icon: Flame,
    };
  }
  if (streak >= 3) {
    return {
      tier: 'Warming Up',
      color: '#F97316', // Orange
      glowColor: 'rgba(249, 115, 22, 0.4)',
      icon: Flame,
    };
  }
  return {
    tier: 'Starting',
    color: '#6B7280', // Gray
    glowColor: 'rgba(107, 114, 128, 0.2)',
    icon: Zap,
  };
};

// Calculate progress to next milestone
const getNextMilestone = (streak: number): { next: number; progress: number } => {
  const nextMilestone = STREAK_MILESTONES.find(m => m > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const prevMilestone = STREAK_MILESTONES.filter(m => m <= streak).pop() || 0;
  const progress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  return { next: nextMilestone, progress: Math.min(progress, 100) };
};

export default function StreakBadge({ stats, compact = false }: StreakBadgeProps) {
  const streak = stats?.currentStreak || 0;
  const { tier, color, glowColor, icon: Icon } = getStreakTier(streak);
  const { next: nextMilestone, progress: milestoneProgress } = getNextMilestone(streak);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80"
        style={{
          boxShadow: streak >= 3 ? `0 0 12px ${glowColor}` : 'none',
        }}
      >
        <motion.div
          animate={streak >= 3 ? {
            scale: [1, 1.15, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </motion.div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {streak}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/50 p-4"
      style={{
        boxShadow: streak >= 3 
          ? `0 4px 20px ${glowColor}, 0 0 0 1px ${color}20`
          : '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      {/* Background glow for active streaks */}
      <AnimatePresence>
        {streak >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${color}10 0%, transparent 50%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {/* Flame Icon with Glow */}
        <div className="relative">
          <motion.div
            animate={streak >= 3 ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${color}15`,
              }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
          </motion.div>
          
          {/* Glow ring animation for active streaks */}
          {streak >= 3 && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                boxShadow: [
                  `0 0 0 0px ${color}30`,
                  `0 0 0 8px ${color}00`,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <motion.span
              key={streak}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {streak}
            </motion.span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              day{streak !== 1 ? 's' : ''} streak
            </span>
          </div>
          
          <p className="text-xs font-medium mb-2" style={{ color }}>
            {tier}
          </p>

          {/* Progress to next milestone */}
          {streak < STREAK_MILESTONES[STREAK_MILESTONES.length - 1] && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${milestoneProgress}%` }}
                  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tabular-nums">
                {nextMilestone}d
              </span>
            </div>
          )}
        </div>

        {/* Best streak badge */}
        {stats && stats.longestStreak > streak && (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Best
            </p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
              {stats.longestStreak}d
            </p>
          </div>
        )}
      </div>

      {/* Milestone celebration particles */}
      <AnimatePresence>
        {STREAK_MILESTONES.includes(streak) && streak > 0 && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: 0,
                  x: '50%',
                  y: '50%',
                }}
                animate={{ 
                  opacity: 0, 
                  scale: 1,
                  x: `${50 + Math.cos(i * 60 * Math.PI / 180) * 80}%`,
                  y: `${50 + Math.sin(i * 60 * Math.PI / 180) * 80}%`,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 rounded-full pointer-events-none"
                style={{ backgroundColor: color }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


