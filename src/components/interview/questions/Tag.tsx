import { memo } from 'react';

type TagVariant = 'technical' | 'behavioral' | 'company' | 'role' | 'default';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

// Premium color palette with Jobzai violet for role-specific
const variantStyles: Record<TagVariant, string> = {
  technical: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 ring-1 ring-sky-200/60 dark:ring-sky-800/50',
  behavioral: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-800/50',
  company: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-800/50',
  role: 'bg-jobzai-50 text-jobzai-700 dark:bg-jobzai-950/50 dark:text-jobzai-300 ring-1 ring-jobzai-200/60 dark:ring-jobzai-800/50',
  default: 'bg-slate-100 text-slate-600 dark:bg-[#2b2a2c] dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/50',
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
        text-[11px] font-semibold tracking-wide
        rounded-lg
        transition-all duration-200
        hover:scale-105
        ${variantStyles[resolvedVariant]}
      `}
    >
      {label}
    </span>
  );
});
