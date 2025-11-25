import { InputHTMLAttributes, forwardRef } from 'react';

interface InlineInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InlineInput = forwardRef<HTMLInputElement, InlineInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-3 py-2 
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700 
            rounded-lg 
            text-xs text-gray-900 dark:text-white 
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500
            transition-all duration-150
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}
            ${className}
          `}
        />
      </div>
    );
  }
);

InlineInput.displayName = 'InlineInput';

export default InlineInput;
