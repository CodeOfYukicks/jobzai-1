import React from 'react';

type SubscoreKey = 'skills' | 'experience' | 'education' | 'industryFit';

export interface SubscoreGridProps {
  scores: Record<SubscoreKey, number>;
}

const order: { key: SubscoreKey; label: string }[] = [
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'industryFit', label: 'Industry Fit' },
];

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-purple-500';
  if (score >= 60) return 'bg-indigo-500';
  return 'bg-pink-500';
}

export const SubscoreGrid: React.FC<SubscoreGridProps> = ({ scores }) => {
  return (
    <div className="grid grid-cols-2 gap-4 min-w-[180px]">
      {order.map(({ key, label }) => {
        const raw = scores[key] ?? 0;
        const value = Math.max(0, Math.min(100, raw));

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {Math.round(value)}%
              </span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-indigo-100 dark:bg-indigo-900/40 overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubscoreGrid;


