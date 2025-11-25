import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '');
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        {/* Input */}
        <input
          ref={ref}
          {...props}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            peer w-full px-0 py-3 bg-transparent border-0 border-b-2 
            text-sm text-gray-900 dark:text-white
            placeholder-transparent
            focus:outline-none focus:ring-0
            transition-colors
            ${error 
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500' 
              : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500'
            }
            ${className}
          `}
          placeholder={label}
        />

        {/* Floating Label */}
        <label
          className={`
            absolute left-0 transition-all duration-200 pointer-events-none
            ${isFocused || hasValue || props.value
              ? 'text-xs -top-3.5'
              : 'text-sm top-3'
            }
            ${error
              ? 'text-red-500 dark:text-red-400'
              : isFocused
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {label}
        </label>

        {/* Error or Helper Text */}
        {(error || helperText) && (
          <p className={`
            mt-1.5 text-xs
            ${error 
              ? 'text-red-500 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;

