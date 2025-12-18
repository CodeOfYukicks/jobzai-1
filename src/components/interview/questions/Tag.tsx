import { memo } from 'react';

interface TagProps {
  label: string;
}

const tagColors: Record<string, { bg: string; text: string }> = {
  Technical: {
    bg: 'bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-200/50 dark:ring-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  Behavioral: {
    bg: 'bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200/50 dark:ring-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  Company: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  Role: {
    bg: 'bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-200/50 dark:ring-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

export const Tag = memo(function Tag({ label }: TagProps) {
  const colors = tagColors[label] || {
    bg: 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/50',
    text: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <span 
      className={`
        inline-flex items-center 
        px-2.5 py-1
        text-[10px] font-semibold uppercase tracking-wide
        rounded-lg
        ${colors.bg}
        ${colors.text}
      `}
    >
      {label}
    </span>
  );
});
