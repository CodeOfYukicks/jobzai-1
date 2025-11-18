import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  icon?: ReactNode | string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Toggle({ label, description, icon = '▸', isOpen, onToggle, children }: ToggleProps) {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <span className="text-lg leading-none" aria-hidden>
          {icon}
        </span>
      );
    }
    return icon;
  };

  return (
    <div className="rounded-[12px] border border-transparent bg-black/[0.012] p-3 transition hover:border-black/[0.05] dark:bg-white/5 dark:hover:border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/20"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm shadow-black/5 dark:bg-white/10">
          <span className="text-lg">{renderIcon()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-neutral-500">{description}</p>}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-200">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

