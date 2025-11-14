import React, { ReactNode, useState } from 'react';
import { ChevronDown, MoreHorizontal, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /**
   * When true, the body can be collapsed by clicking the header.
   */
  collapsible?: boolean;
  /**
   * Initial open state for collapsible cards. Defaults to true.
   */
  defaultOpen?: boolean;
  /**
   * Optional actions rendered on the right side of the header.
   * If not provided, a subtle default AI/menu button is shown.
   */
  actions?: ReactNode;
}

export function SectionCard({
  title,
  icon,
  subtitle,
  children,
  className = '',
  collapsible = false,
  defaultOpen = true,
  actions,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const isOpen = collapsible ? open : true;

  const HeaderTag: React.ElementType = collapsible ? 'button' : 'div';

  return (
    <section
      className={[
        'bg-white dark:bg-[#111827]',
        'border border-neutral-200/80 dark:border-neutral-800/70',
        'rounded-xl p-6',
        'transition-shadow duration-200',
        'shadow-xs hover:shadow-sm',
        className,
      ].join(' ')}
    >
      <HeaderTag
        type={collapsible ? 'button' : undefined}
        onClick={collapsible ? () => setOpen((prev) => !prev) : undefined}
        className={[
          'w-full flex items-start justify-between gap-3',
          collapsible ? 'cursor-pointer select-none' : '',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900/70 text-neutral-700 dark:text-neutral-200">
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions ?? (
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/70 px-2 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 hover:border-neutral-300 dark:hover:text-neutral-200 dark:hover:border-neutral-700 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span>AI</span>
            </button>
          )}
          {collapsible && (
            <ChevronDown
              className={[
                'h-4 w-4 text-neutral-400 transition-transform duration-200',
                isOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          )}
        </div>
      </HeaderTag>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : { opacity: 0 }}
            animate={collapsible ? { opacity: 1, height: 'auto' } : { opacity: 1 }}
            exit={collapsible ? { opacity: 0, height: 0 } : { opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className={collapsible ? 'overflow-hidden' : ''}
          >
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default SectionCard;


