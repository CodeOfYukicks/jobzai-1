import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'gradient';
  backgroundColor?: string;
  animated?: boolean;
}

const ProgressRing = ({
  progress,
  size = 80,
  strokeWidth = 6,
  className = '',
  showPercentage = true,
  showLabel = false,
  label = 'Complete',
  color = 'gradient',
  backgroundColor = 'rgba(229, 231, 235, 0.5)',
  animated = true
}: ProgressRingProps) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  
  const center = size / 2;

  // Color configurations
  const colorConfigs = {
    indigo: {
      stroke: '#6366f1',
      gradient: null
    },
    green: {
      stroke: '#22c55e',
      gradient: null
    },
    amber: {
      stroke: '#f59e0b',
      gradient: null
    },
    red: {
      stroke: '#ef4444',
      gradient: null
    },
    gradient: {
      stroke: 'url(#progressGradient)',
      gradient: ['#6366f1', '#8b5cf6', '#a855f7']
    }
  };

  const currentColor = colorConfigs[color];

  // Get status color based on progress
  const getStatusColor = () => {
    if (normalizedProgress >= 80) return 'text-green-600 dark:text-green-400';
    if (normalizedProgress >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Gradient definition */}
        {color === 'gradient' && (
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          className="dark:opacity-30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={currentColor.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={animated ? { 
            duration: 1,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.2
          } : { duration: 0 }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={animated ? { delay: 0.5, duration: 0.3 } : { duration: 0 }}
            className={`text-lg font-bold ${getStatusColor()}`}
            style={{ fontSize: size * 0.22 }}
          >
            {Math.round(normalizedProgress)}%
          </motion.span>
        )}
        {showLabel && (
          <motion.span
            initial={animated ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={animated ? { delay: 0.6, duration: 0.3 } : { duration: 0 }}
            className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
};

// Compact version for inline use
export const CompactProgressRing = ({
  progress,
  size = 24,
  strokeWidth = 3,
  className = ''
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  const center = size / 2;

  const getColor = () => {
    if (normalizedProgress >= 80) return '#22c55e';
    if (normalizedProgress >= 50) return '#f59e0b';
    return '#6366f1';
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`transform -rotate-90 ${className}`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(229, 231, 235, 0.5)"
        strokeWidth={strokeWidth}
        className="dark:opacity-30"
      />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </svg>
  );
};

export default ProgressRing;














