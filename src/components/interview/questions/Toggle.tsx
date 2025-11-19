import { memo, useMemo, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ToggleProps {
  label: string;
  description?: string;
  icon?: ReactNode | string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const Toggle = memo(function Toggle({ label, description, icon = '▸', isOpen, onToggle, children }: ToggleProps) {
  const renderIcon = useMemo(() => {
    if (typeof icon === 'string') {
      return (
        <span className="text-base leading-none" aria-hidden>
          {icon}
        </span>
      );
    }
    return icon;
  }, [icon]);

  return (
    <div className="rounded-lg border border-purple-200/40 bg-purple-50/30 transition-colors hover:bg-purple-50/50 dark:border-purple-500/20 dark:bg-purple-500/5 dark:hover:bg-purple-500/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-[#1c1c1e]"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white text-base dark:bg-white/[0.08]">
          {renderIcon}
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-neutral-900 dark:text-white">{label}</p>
          {description && <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{description}</p>}
        </div>
        <ChevronRight
          className={`h-4 w-4 flex-shrink-0 text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="overflow-hidden transition-all duration-200 ease-out">
          <div className="px-3.5 pb-3 pt-1 text-sm text-neutral-600 dark:text-neutral-300">{children}</div>
        </div>
      )}
    </div>
  );
});
