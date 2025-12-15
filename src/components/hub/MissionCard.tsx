/**
 * MissionCard Component
 * Premium mission card with circular progress ring and micro-animations
 * Inspired by Notion/Vercel/Linear achievement systems
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Target, CheckCircle2, Sparkles } from 'lucide-react';
import { Mission } from '../../types/missions';

interface MissionCardProps {
  mission: Mission;
  index: number;
}

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Target,
};

// Circular Progress Ring Component
const ProgressRing = ({ 
  progress, 
  size = 56, 
  strokeWidth = 4,
  color 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
      </svg>
      
      {/* Progress ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.1 
          }}
          style={{
            filter: progress === 100 ? `drop-shadow(0 0 6px ${color}40)` : 'none',
          }}
        />
      </svg>
      
      {/* Glow effect when complete */}
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};

export default function MissionCard({ mission, index }: MissionCardProps) {
  const Icon = iconMap[mission.icon] || Briefcase;
  const progress = Math.min((mission.current / mission.target) * 100, 100);
  const isComplete = mission.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.34, 1.56, 0.64, 1] 
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden
        bg-white/80 dark:bg-gray-800/80
        backdrop-blur-xl
        rounded-2xl
        border border-gray-200/60 dark:border-gray-700/50
        p-4
        transition-all duration-300
        ${isComplete 
          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' 
          : 'hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      style={{
        boxShadow: isComplete 
          ? `0 4px 20px ${mission.color}20, 0 0 0 1px ${mission.color}30`
          : '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
        ...(isComplete && { '--tw-ring-color': mission.color } as React.CSSProperties),
      }}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${mission.color} 0%, transparent 50%)`,
        }}
      />
      
      {/* Completion sparkle effect */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2"
          >
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles 
                className="w-4 h-4" 
                style={{ color: mission.color }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {/* Progress Ring with Icon */}
        <div className="relative flex-shrink-0">
          <ProgressRing 
            progress={progress} 
            color={mission.color}
            size={56}
            strokeWidth={4}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                >
                  <CheckCircle2 
                    className="w-6 h-6" 
                    style={{ color: mission.color }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Icon 
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`
              font-semibold text-sm
              ${isComplete 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-700 dark:text-gray-200'
              }
            `}>
              {mission.title}
            </h3>
            {mission.xpReward && (
              <span 
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${mission.color}15`,
                  color: mission.color,
                }}
              >
                +{mission.xpReward} XP
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
            {mission.description}
          </p>

          {/* Progress bar and counter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: mission.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.2 
                }}
              />
            </div>
            <span className={`
              text-xs font-medium tabular-nums
              ${isComplete 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}>
              {mission.current}/{mission.target}
            </span>
          </div>
        </div>
      </div>

      {/* Completion overlay shine effect */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${mission.color}30, transparent)`,
              transform: 'skewX(-20deg)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}






