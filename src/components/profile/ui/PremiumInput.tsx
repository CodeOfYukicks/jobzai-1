import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface PremiumTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, helperText, error, icon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 
              ${icon ? 'pl-11' : ''} 
              ${rightIcon ? 'pr-11' : ''}
              bg-white dark:bg-[#2b2a2c]
              border border-gray-300 dark:border-[#4a494b]
              rounded-xl
              text-gray-900 dark:text-gray-100
              text-[15px]
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
              focus:border-gray-400 dark:focus:border-[#5a595b]
              focus:shadow-sm
              hover:border-gray-400 dark:hover:border-[#5a595b]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

export const PremiumTextarea = forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ label, helperText, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-white dark:bg-[#2b2a2c]
            border border-gray-300 dark:border-[#4a494b]
            rounded-xl
            text-gray-900 dark:text-gray-100
            text-[15px]
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
            focus:border-gray-400 dark:focus:border-[#5a595b]
            focus:shadow-sm
            hover:border-gray-400 dark:hover:border-[#5a595b]
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        {(helperText || error) && (
          <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';

interface PremiumSelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const PremiumSelectNative = forwardRef<HTMLSelectElement, PremiumSelectNativeProps>(
  ({ label, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5
            bg-white dark:bg-[#2b2a2c]
            border border-gray-200/80 dark:border-[#3d3c3e]
            rounded-xl
            text-gray-900 dark:text-white
            text-[15px]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
            focus:border-gray-300 dark:focus:border-[#4a494b]
            focus:shadow-sm
            hover:border-gray-300 dark:hover:border-[#4a494b]
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none
            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
            bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]
            pr-10
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PremiumSelectNative.displayName = 'PremiumSelectNative';

export default PremiumInput;

