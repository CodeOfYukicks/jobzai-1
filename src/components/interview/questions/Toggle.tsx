import { memo, useMemo, ReactNode } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface ToggleProps {
  label: string;
  description?: string;
  icon?: ReactNode | string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const Toggle = memo(function Toggle({ label, description, icon, isOpen, onToggle, children }: ToggleProps) {
  const renderIcon = useMemo(() => {
    if (typeof icon === 'string') {
      return (
        <span className="text-sm leading-none" aria-hidden>
          {icon}
        </span>
      );
    }
    return icon;
  }, [icon]);

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600">
          <Sparkles className="h-4 w-4 text-amber-400 fill-current" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{label}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="animate-slideDown px-4 pb-4 pt-0">
            <div className="pl-[44px]">
                {children}
            </div>
        </div>
      )}
    </div>
  );
});
