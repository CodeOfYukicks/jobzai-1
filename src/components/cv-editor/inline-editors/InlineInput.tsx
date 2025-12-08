import { InputHTMLAttributes, forwardRef } from 'react';

interface InlineInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InlineInput = forwardRef<HTMLInputElement, InlineInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
          {label}
        </label>
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-3.5 py-2.5 
            bg-white dark:bg-[#242325]/50 
            border border-gray-200/80 dark:border-[#3d3c3e]/60 
            rounded-lg 
            text-sm text-gray-900 dark:text-gray-100 
            placeholder-gray-400 dark:placeholder-gray-500
            font-normal
            focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50
            transition-all duration-200
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-[#2b2a2c]/50' : ''}
            ${className}
          `}
        />
      </div>
    );
  }
);

InlineInput.displayName = 'InlineInput';

export default InlineInput;
