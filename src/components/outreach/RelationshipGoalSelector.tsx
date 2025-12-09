import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, UserPlus } from 'lucide-react';
import { RelationshipGoal, RELATIONSHIP_GOAL_LABELS, RELATIONSHIP_GOAL_COLORS } from '../../types/job';

interface RelationshipGoalSelectorProps {
  value: RelationshipGoal | undefined;
  onChange: (goal: RelationshipGoal) => void;
  size?: 'sm' | 'md' | 'lg';
}

const goalIcons: Record<RelationshipGoal, React.ReactNode> = {
  networking: <Users className="w-5 h-5" />,
  prospecting: <Target className="w-5 h-5" />,
  referral: <UserPlus className="w-5 h-5" />,
};

const goalDescriptions: Record<RelationshipGoal, string> = {
  networking: 'Build professional relationships',
  prospecting: 'Find hidden job opportunities',
  referral: 'Get internal recommendations',
};

const sizeClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function RelationshipGoalSelector({ 
  value, 
  onChange,
  size = 'md',
}: RelationshipGoalSelectorProps) {
  const goals: RelationshipGoal[] = ['networking', 'prospecting', 'referral'];
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {goals.map((goal) => {
        const isActive = goal === value;
        const colors = RELATIONSHIP_GOAL_COLORS[goal];
        
        return (
          <motion.button
            key={goal}
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(goal)}
            className={`
              ${sizeClasses[size]}
              rounded-xl border-2 transition-all duration-200
              flex flex-col items-center text-center gap-2
              ${isActive 
                ? `${colors.bg} ${colors.border} shadow-sm` 
                : 'bg-gray-50 dark:bg-[#2b2a2c] border-gray-200 dark:border-[#3d3c3e] hover:border-gray-300 dark:hover:border-[#4a494b]'
              }
            `}
          >
            <div className={`
              p-2 rounded-lg transition-colors
              ${isActive 
                ? `${colors.bg} ${colors.text}` 
                : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-500 dark:text-gray-400'
              }
            `}>
              {goalIcons[goal]}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isActive ? colors.text : 'text-gray-700 dark:text-gray-300'}`}>
                {RELATIONSHIP_GOAL_LABELS[goal]}
              </p>
              <p className={`text-[10px] mt-0.5 ${isActive ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {goalDescriptions[goal]}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact badge version
interface RelationshipGoalBadgeProps {
  goal: RelationshipGoal;
  size?: 'sm' | 'md';
}

export function RelationshipGoalBadge({ goal, size = 'md' }: RelationshipGoalBadgeProps) {
  const colors = RELATIONSHIP_GOAL_COLORS[goal];
  const sizeStyles = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5 gap-1' 
    : 'text-xs px-2 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
  
  const icons: Record<RelationshipGoal, React.ReactNode> = {
    networking: <Users className={iconSize} />,
    prospecting: <Target className={iconSize} />,
    referral: <UserPlus className={iconSize} />,
  };
  
  return (
    <span className={`
      inline-flex items-center ${sizeStyles} rounded-full font-medium
      ${colors.bg} ${colors.text} border ${colors.border}
    `}>
      {icons[goal]}
      <span>{RELATIONSHIP_GOAL_LABELS[goal]}</span>
    </span>
  );
}

export default RelationshipGoalSelector;

