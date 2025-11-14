import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}

export const SectionCard = ({ title, icon: Icon, children, action }: SectionCardProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};

