import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react';

interface ProfileSectionCardProps {
  title: string;
  icon?: ReactNode;
  completion?: number; // 0-100
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onEdit?: () => void;
  children: ReactNode;
  className?: string;
}

const ProfileSectionCard = ({
  title,
  icon,
  completion,
  isCollapsible = false,
  defaultCollapsed = false,
  onEdit,
  children,
  className = ''
}: ProfileSectionCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const isComplete = completion !== undefined && completion === 100;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-purple-600 dark:text-purple-400">{icon}</div>}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {completion !== undefined && (
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Complete</span>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      {completion}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit section"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {isCollapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-6 py-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProfileSectionCard;






