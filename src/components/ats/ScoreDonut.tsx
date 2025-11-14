import React from 'react';

interface ScoreDonutProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreDonut: React.FC<ScoreDonutProps> = ({
  value,
  size = 100,
  strokeWidth = 8,
}) => {
  const safeValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          className="dark:stroke-gray-700"
          fill="transparent"
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out stroke-indigo-500"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {Math.round(safeValue)}%
        </span>
      </div>
    </div>
  );
};

export default ScoreDonut;


