import { ReactNode } from 'react';

interface PremiumLabelProps {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  description?: string;
  className?: string;
}

export const PremiumLabel = ({
  children,
  required = false,
  htmlFor,
  description,
  className = ''
}: PremiumLabelProps) => {
  return (
    <div className={`mb-3 ${className}`}>
      <label 
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-800 dark:text-gray-200 tracking-tight"
      >
        {children}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

// Section divider with optional title
interface SectionDividerProps {
  title?: string;
  className?: string;
}

export const SectionDivider = ({ title, className = '' }: SectionDividerProps) => {
  if (title) {
    return (
      <div className={`relative py-4 ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/60 dark:border-gray-700/40" />
        </div>
        <div className="relative flex justify-start">
          <span className="pr-3 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 ${className}`}>
      <div className="w-full border-t border-gray-200/60 dark:border-gray-700/40" />
    </div>
  );
};

// Field group wrapper for consistent spacing
interface FieldGroupProps {
  children: ReactNode;
  className?: string;
}

export const FieldGroup = ({ children, className = '' }: FieldGroupProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
};

// Empty state for sections
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && (
        <div className="p-3 mb-4 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

// Skeleton loader for fields
export const FieldSkeleton = () => {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  );
};

// Loading skeleton for section content
export const SectionSkeleton = () => {
  return (
    <div className="space-y-6">
      <FieldSkeleton />
      <FieldSkeleton />
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default PremiumLabel;

