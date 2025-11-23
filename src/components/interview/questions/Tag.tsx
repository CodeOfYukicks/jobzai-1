import { memo } from 'react';

interface TagProps {
  label: string;
}

export const Tag = memo(function Tag({ label }: TagProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400 tracking-wide border border-transparent dark:border-gray-700">
      {label}
    </span>
  );
});
