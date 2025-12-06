/**
 * DailyMissions Component
 * Clean, modern missions card matching Quote & Weather widget aesthetic
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  Circle,
  Flame
} from 'lucide-react';
import { useMissions } from '../../contexts/MissionsContext';

export default function DailyMissions() {
  const { 
    missions, 
    stats, 
    loading, 
    error,
    refreshMissions 
  } = useMissions();

  // Calculate overall progress
  const completedCount = useMemo(() => {
    return missions.filter(m => m.status === 'completed').length;
  }, [missions]);

  const overallProgress = useMemo(() => {
    if (missions.length === 0) return 0;
    return (completedCount / missions.length) * 100;
  }, [missions, completedCount]);

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#635BFF] rounded-2xl h-full min-h-[220px] flex items-center justify-center"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
          <span className="text-sm text-white/70 font-medium">
            Loading missions...
          </span>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#635BFF] rounded-2xl h-full min-h-[220px] flex flex-col items-center justify-center p-6"
      >
        <p className="text-sm text-white/70 mb-3">{error}</p>
        <button
          onClick={refreshMissions}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#635BFF] bg-white rounded-lg hover:bg-white/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative h-full"
    >
      {/* Main card */}
      <div className="group relative bg-[#635BFF] rounded-2xl h-full min-h-[220px] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#635BFF]/30 flex flex-col">
        
        {/* Header Section */}
        <div className="px-6 pt-5 pb-3">
          {/* Top row: Title + Streak */}
          <div className="flex items-center justify-between mb-3">
            <div className="uppercase font-bold text-white/60 text-xs tracking-wide">
              Daily Missions
            </div>
            {stats && stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-white/80">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-xs font-bold">{stats.currentStreak}</span>
              </div>
            )}
          </div>

          {/* Icon + Progress row */}
          <div className="flex items-center justify-between">
            {/* Target Icon */}
            <div className="text-[#8B85FF]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>

            {/* Progress Summary */}
            <div className="text-right">
              <div className="text-3xl font-black text-white leading-none">
                {completedCount}/{missions.length}
              </div>
              <div className="text-[10px] text-white/50 font-medium">completed</div>
            </div>
          </div>
        </div>

        {/* Missions List */}
        <div className="px-6 pb-4 space-y-2 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {missions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <p className="text-sm text-white/50">No missions today</p>
              </motion.div>
            ) : (
              missions.slice(0, 3).map((mission, index) => {
                const isComplete = mission.status === 'completed';
                const progress = Math.min((mission.current / mission.target) * 100, 100);
                
                  return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                      ${isComplete 
                        ? 'bg-white/20' 
                        : 'bg-white/10 hover:bg-white/15'
                      }
                    `}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-300" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/40" />
                      )}
                    </div>

                    {/* Mission Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${isComplete ? 'text-white line-through opacity-70' : 'text-white'}`}>
                        {mission.title}
                      </div>
                      <div className={`text-xs mt-0.5 ${isComplete ? 'text-white/40' : 'text-white/60'}`}>
                        {mission.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isComplete ? 'bg-green-300' : 'bg-white/60'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/60 tabular-nums">
                          {mission.current}/{mission.target}
                        </span>
                        {/* XP Badge */}
                        {mission.xpReward && (
                          <span className="text-[10px] font-bold text-green-300">
                            +{mission.xpReward} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>

        {/* All complete celebration */}
        {overallProgress === 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-2xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
