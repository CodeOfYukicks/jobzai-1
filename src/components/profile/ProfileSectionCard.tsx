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
        relative
        bg-white dark:bg-[#2b2a2c]
        rounded-xl
        border border-gray-200 dark:border-[#3d3c3e]
        transition-shadow duration-200
        ${isHovered ? 'shadow-sm' : ''}
        ${className}
      `}
    >
      {/* Header - LinkedIn style: simple with title and actions */}
      <div
        className={`
          px-6 py-4
          ${isCollapsible ? 'cursor-pointer select-none' : ''}
          ${!isCollapsed ? 'border-b border-gray-100 dark:border-[#3d3c3e]/50' : ''}
          transition-colors duration-150
          ${isCollapsible && isHovered ? 'bg-gray-50/50 dark:bg-[#3d3c3e]/10' : ''}
        `}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          {/* Actions - LinkedIn style: icon buttons on the right */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Header actions slot */}
            {headerActions}

            {/* Add button */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Add"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            {/* Edit button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Edit section"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}

            {/* Collapse toggle */}
            {isCollapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ChevronDown 
                  className="w-5 h-5 transition-transform duration-200" 
                  style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-6 py-4">
          {/* AI Suggestion Banner */}
          {aiSuggestion && (
            <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-blue-50 dark:bg-[#3d3c3e] border border-blue-100 dark:border-[#3d3c3e]">
              <div className="p-1.5 rounded bg-blue-100 dark:bg-[#3d3c3e]">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">{aiSuggestion}</p>
                <div className="flex items-center gap-2 mt-2">
                  {onAcceptSuggestion && (
                    <button
                      onClick={onAcceptSuggestion}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-full transition-colors"
                    >
                      Apply
                    </button>
                  )}
                  {onDismissSuggestion && (
                    <button
                      onClick={onDismissSuggestion}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {icon && (
                <div className="p-3 rounded-full bg-gray-100 dark:bg-[#3d3c3e]/50 text-gray-400 dark:text-gray-500 mb-4">
                  {icon}
                </div>
              )}
              <p className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                {emptyState.title}
              </p>
              {emptyState.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
                  {emptyState.description}
                </p>
              )}
              {emptyState.actionLabel && emptyState.onAction && (
                <button
                  onClick={emptyState.onAction}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0A66C2] border border-[#0A66C2] hover:bg-blue-50 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
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
      )}
    </div>
  );
};

export default ProfileSectionCard;
