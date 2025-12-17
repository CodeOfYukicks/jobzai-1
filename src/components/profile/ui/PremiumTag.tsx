import { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface Tag {
  id?: string;
  label: string;
  value?: string;
}

interface PremiumTagProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'outlined' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export const PremiumTag = ({
  label,
  onRemove,
  variant = 'default',
  size = 'md'
}: PremiumTagProps) => {
  const variantStyles = {
    default: 'bg-gray-100 dark:bg-[#3d3c3e]/60 text-gray-700 dark:text-gray-300',
    outlined: 'bg-transparent border border-gray-200 dark:border-[#3d3c3e] text-gray-700 dark:text-gray-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      layout
      className={`
        inline-flex items-center gap-1.5 rounded-lg font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.span>
  );
};

interface PremiumTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  label?: string;
}

export const PremiumTagInput = ({
  tags,
  onChange,
  placeholder = 'Type and press Enter',
  maxTags,
  suggestions = [],
  label
}: PremiumTagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && (!maxTags || tags.length < maxTags)) {
      onChange([...tags, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  ).slice(0, 5);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className={`
          flex flex-wrap gap-2 p-3
          bg-white dark:bg-[#2b2a2c]
          border border-gray-200/80 dark:border-[#3d3c3e]
          rounded-xl
          min-h-[52px]
          transition-all duration-200
          focus-within:ring-2 focus-within:ring-gray-900/5 dark:focus-within:ring-white/10
          focus-within:border-gray-300 dark:focus-within:border-[#4a494b]
        `}>
          <AnimatePresence mode="popLayout">
            {tags.map((tag, index) => (
              <PremiumTag
                key={tag}
                label={tag}
                onRemove={() => removeTag(index)}
              />
            ))}
          </AnimatePresence>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={maxTags ? tags.length >= maxTags : false}
            className="
              flex-1 min-w-[120px] py-1
              bg-transparent
              text-gray-900 dark:text-white
              text-[15px]
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-xl shadow-lg overflow-hidden"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {maxTags && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {tags.length}/{maxTags} added
        </p>
      )}
    </div>
  );
};

// Add button for adding items
interface PremiumAddButtonProps {
  onClick: () => void;
  label?: string;
  size?: 'sm' | 'md';
}

export const PremiumAddButton = ({
  onClick,
  label = 'Add',
  size = 'md'
}: PremiumAddButtonProps) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm'
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center gap-1.5 font-medium
        text-gray-600 dark:text-gray-400
        hover:text-gray-900 dark:hover:text-white
        hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
        rounded-lg transition-all duration-200
        ${sizeStyles[size]}
      `}
    >
      <Plus className="w-4 h-4" />
      {label}
    </motion.button>
  );
};

export default PremiumTag;














