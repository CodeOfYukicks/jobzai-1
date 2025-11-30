import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Scale,
  Rocket,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AdaptationLevel } from '../../types/premiumATS';

interface AdaptationLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (level: AdaptationLevel) => void;
  isLoading?: boolean;
}

const levelIcons = {
  conservative: Shield,
  balanced: Scale,
  optimized: Rocket,
};

const levelColors = {
  conservative: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    selectedBorder: 'border-blue-500 dark:border-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-500/20',
  },
  balanced: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    selectedBorder: 'border-purple-500 dark:border-purple-400',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    ring: 'ring-purple-500/20',
  },
  optimized: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    selectedBorder: 'border-amber-500 dark:border-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/20',
  },
};

const levelData = {
  conservative: {
    name: 'Level 1 - Conservative',
    description: 'Light edits, keeps your original voice',
    features: ['Grammar fixes', 'Formatting', '3-5 keywords'],
    scoreGain: '+5-10%',
  },
  balanced: {
    name: 'Level 2 - Balanced',
    description: 'Moderate rewrite with natural optimization',
    features: ['Enhanced bullets', '10-15 keywords', 'Better summary'],
    scoreGain: '+15-25%',
  },
  optimized: {
    name: 'Level 3 - Maximum',
    description: 'Full transformation for best match',
    features: ['Complete rewrite', '20+ keywords', 'Senior tone'],
    scoreGain: '+30-40%',
  },
};

export default function AdaptationLevelModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: AdaptationLevelModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<AdaptationLevel>('balanced');

  const handleConfirm = () => {
    onConfirm(selectedLevel);
  };

  if (!isOpen) return null;

  const levels: AdaptationLevel[] = ['conservative', 'balanced', 'optimized'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal - Compact Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
              {/* Compact Header */}
              <div className="relative px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Adaptation Level
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose rewrite intensity
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Compact Level Cards */}
              <div className="p-4 space-y-2">
                {levels.map((levelKey) => {
                  const level = levelData[levelKey];
                  const Icon = levelIcons[levelKey];
                  const colors = levelColors[levelKey];
                  const isSelected = selectedLevel === levelKey;

                  return (
                    <motion.button
                      key={levelKey}
                      onClick={() => setSelectedLevel(levelKey)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${colors.bg} ${colors.selectedBorder} ring-2 ${colors.ring}`
                          : `bg-white dark:bg-[#26262B] ${colors.border} hover:${colors.bg}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${colors.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                              {level.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.badge}`}>
                              {level.scoreGain}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {level.description}
                          </p>
                        </div>

                        {/* Check */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 bg-green-500 rounded-full flex-shrink-0"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Features - Inline */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 ml-11">
                        {level.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1"
                          >
                            <span className={`w-1 h-1 rounded-full ${colors.icon.replace('text-', 'bg-')}`} />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Compact Footer */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1C] rounded-b-2xl">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="group flex items-center gap-2 px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate CV</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

