import { memo } from 'react';

interface TagProps {
  label: string;
}

export const Tag = memo(function Tag({ label }: TagProps) {
  return (
    <span className="inline-flex items-center rounded-md border border-purple-200/60 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
      {label}
    </span>
  );
});



