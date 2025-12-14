import { memo } from 'react';

interface TagProps {
  label: string;
}

export const Tag = memo(function Tag({ label }: TagProps) {
  return (
    <span 
      className="
        inline-flex items-center 
        px-2 py-0.5
        text-[10px] font-medium
        rounded
        bg-neutral-100 dark:bg-neutral-800
        text-neutral-600 dark:text-neutral-400
      "
    >
      {label}
    </span>
  );
});
