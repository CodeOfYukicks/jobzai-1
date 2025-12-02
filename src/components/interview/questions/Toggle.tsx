import { memo, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ToggleProps {
  label: string;
  description?: string;
  icon?: ReactNode | string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const Toggle = memo(function Toggle({ 
  label, 
  isOpen, 
  onToggle, 
  children 
}: ToggleProps) {
  return (
    <div className="group">
      {/* Toggle Button - Minimal */}
      <button
        type="button"
        onClick={onToggle}
        className="
          flex items-center gap-2 
          text-sm font-medium
          text-slate-500 dark:text-slate-400
          hover:text-slate-700 dark:hover:text-slate-200
          transition-colors duration-200
        "
      >
        <ChevronRight 
          className={`
            w-4 h-4 
            transition-transform duration-200
            ${isOpen ? 'rotate-90' : ''}
          `} 
        />
        <span>{label}</span>
      </button>

      {/* Content - Clean reveal */}
      {isOpen && (
        <div className="mt-4 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="
            p-5 rounded-xl
            bg-slate-50 dark:bg-slate-800/50
            border border-slate-100 dark:border-slate-800
            text-sm leading-relaxed text-slate-700 dark:text-slate-300
          ">
            {children}
          </div>
        </div>
      )}
    </div>
  );
});
