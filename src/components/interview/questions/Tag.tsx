import { memo } from 'react';

type TagVariant = 'technical' | 'behavioral' | 'company' | 'role' | 'default';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

// Stronger, more visible colors for each tag type
const variantStyles: Record<TagVariant, string> = {
  technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800',
  behavioral: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800',
  company: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800',
  role: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700',
};

// Map label to variant
function getVariantFromLabel(label: string): TagVariant {
  const lower = label.toLowerCase();
  if (lower.includes('technical')) return 'technical';
  if (lower.includes('behavioral')) return 'behavioral';
  if (lower.includes('company')) return 'company';
  if (lower.includes('role')) return 'role';
  return 'default';
}

export const Tag = memo(function Tag({ label, variant }: TagProps) {
  const resolvedVariant = variant || getVariantFromLabel(label);
  
  return (
    <span 
      className={`
        inline-flex items-center 
        px-2.5 py-1
        text-xs font-semibold
        rounded-md
        ${variantStyles[resolvedVariant]}
      `}
    >
      {label}
    </span>
  );
});
