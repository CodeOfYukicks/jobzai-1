import React from 'react';

type StepType = 'technical' | 'hr' | 'manager' | 'final' | 'other';

const labelMap: Record<StepType, string> = {
  technical: 'Technical',
  hr: 'HR',
  manager: 'Manager',
  final: 'Final',
  other: 'Other',
};

export function StepChip({
  type,
  className = '',
  muted = false,
}: {
  type: StepType;
  className?: string;
  muted?: boolean;
}) {
  const base =
    'inline-flex items-center rounded-full border text-[10px] font-medium px-2 py-0.5 transition-colors';
  const active =
    'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
  const inactive = 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]';

  const darkTone: Record<StepType, string> = {
    hr: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/40',
    technical: 'dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900/40',
    manager: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/40',
    final: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
    other: 'dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
  };

  return (
    <span className={[base, muted ? inactive : active, darkTone[type], className].join(' ')}>
      {labelMap[type]}
    </span>
  );
}


