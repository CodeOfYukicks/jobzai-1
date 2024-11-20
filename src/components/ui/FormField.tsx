import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  error?: string;
  className?: string;
  icon?: React.ElementType;
}

export function FormField({ 
  label, 
  error, 
  type = 'text', 
  icon: Icon, 
  options, 
  className = '', 
  ...props 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {type === 'select' ? (
          <select
            className={`w-full rounded-xl bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            className={`w-full rounded-xl bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              placeholder:text-gray-400
              transition-all duration-200
              min-h-[120px] resize-y`}
            {...props}
          />
        ) : (
          <input
            className={`w-full rounded-xl bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          />
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
} 