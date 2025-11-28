import { ReactNode, useState, useRef } from 'react';
import { ChevronDown, Edit2, Check, Plus, Sparkles } from 'lucide-react';

interface ProfileSectionCardProps {
  title: string;
  icon?: ReactNode;
  completion?: number; // 0-100
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onEdit?: () => void;
  onAdd?: () => void;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  id?: string;
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  aiSuggestion?: string;
  onAcceptSuggestion?: () => void;
  onDismissSuggestion?: () => void;
}

const ProfileSectionCard = ({
  title,
  icon,
  completion,
  isCollapsible = true,
  defaultCollapsed = false,
  onEdit,
  onAdd,
  children,
  className = '',
  headerActions,
  id,
  emptyState,
  aiSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion
}: ProfileSectionCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const isEmpty = completion === 0;


  // Scroll into view when navigating via command palette
  const scrollIntoView = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      id={id}
      ref={contentRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden
        bg-white dark:bg-gray-800
        rounded-2xl
        border border-gray-300 dark:border-gray-600
        shadow-sm
        transition-shadow duration-300
        ${isHovered ? 'shadow-md' : ''}
        ${className}
      `}
    >
      {/* Subtle top border gradient for premium feel */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-50" />

      {/* Header */}
      <div
        className={`
          relative px-5 py-4
          ${isCollapsible ? 'cursor-pointer select-none' : ''}
          ${!isCollapsed ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}
          transition-colors duration-200
          ${isCollapsible && isHovered ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}
        `}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with dynamic styling based on completion */}
            {icon && (
              <div
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-colors duration-300"
              >
                {icon}
              </div>
            )}

            {/* Title and completion */}
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Header actions slot */}
            {headerActions}

            {/* Add button */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}

            {/* Edit button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit section"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Collapse toggle */}
            {isCollapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
        {!isCollapsed && (
          <div className="overflow-hidden">
            <div className="relative px-5 py-4">
              {/* AI Suggestion Banner */}
                {aiSuggestion && (
                  <div className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
                    <div className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700">
                      <Sparkles className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{aiSuggestion}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {onAcceptSuggestion && (
                          <button
                            onClick={onAcceptSuggestion}
                            className="px-3 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        )}
                        {onDismissSuggestion && (
                          <button
                            onClick={onDismissSuggestion}
                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Empty State */}
              {emptyState && isEmpty ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {icon && (
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 mb-3">
                      {icon}
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {emptyState.title}
                  </p>
                  {emptyState.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xs mb-4">
                      {emptyState.description}
                    </p>
                  )}
                  {emptyState.actionLabel && emptyState.onAction && (
                    <button
                      onClick={emptyState.onAction}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {emptyState.actionLabel}
                    </button>
                  )}
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default ProfileSectionCard;
