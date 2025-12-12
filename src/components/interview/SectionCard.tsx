import React, { ReactNode, useState } from 'react';
import { ChevronDown, MoreHorizontal, Sparkles } from 'lucide-react';

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
        'rounded-xl border border-black/[0.06] bg-white p-6',
        'transition-colors duration-200',
        'dark:border-white/[0.08] dark:bg-[#2b2a2c]',
        className,
      ].join(' ')}
    >
      <HeaderTag
        type={collapsible ? 'button' : undefined}
        onClick={collapsible ? () => setOpen((prev) => !prev) : undefined}
        className={[
          'flex w-full items-start justify-between gap-3',
          collapsible ? 'cursor-pointer select-none' : '',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-200">
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
              className="inline-flex h-7 items-center gap-1 rounded-md border border-black/[0.08] bg-neutral-50 px-2.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-black/[0.12] hover:bg-neutral-100 hover:text-neutral-800 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-neutral-400 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.08] dark:hover:text-neutral-200"
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

      {isOpen && (
        <div
          className={[
            collapsible ? 'overflow-hidden transition-all duration-200 ease-out' : '',
            'mt-4 space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300',
          ].join(' ')}
          style={
            collapsible
              ? {
                  animation: 'fadeIn 0.2s ease-out',
                }
              : {}
          }
        >
          {children}
        </div>
      )}
    </section>
  );
}

export default SectionCard;


