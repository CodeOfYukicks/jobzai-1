import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
  showEditIcon?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

const EditableText = ({
  value,
  onSave,
  placeholder = 'Click to edit...',
  className = '',
  inputClassName = '',
  as: Component = 'p',
  multiline = false,
  maxLength,
  disabled = false,
  showEditIcon = true,
  autoSave = true,
  autoSaveDelay = 800
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setEditValue(newValue);
    
    if (autoSave) {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
      autoSaveTimeout.current = setTimeout(() => {
        if (newValue !== value) {
          onSave(newValue);
        }
      }, autoSaveDelay);
    }
  }, [autoSave, autoSaveDelay, value, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [multiline, handleSave, handleCancel]);

  const handleClick = useCallback(() => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
    }
  }, [disabled, isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  const displayValue = value || placeholder;
  const isEmpty = !value;

  // Base styles for different text elements
  const baseStyles: Record<string, string> = {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-xl font-semibold',
    p: 'text-base',
    span: 'text-sm'
  };

  const inputStyles = `
    w-full bg-transparent border-none outline-none 
    focus:ring-0 focus:outline-none
    ${baseStyles[Component]}
    ${inputClassName}
  `;

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="relative group"
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`
              ${inputStyles}
              min-h-[80px] resize-none
              px-3 py-2 rounded-lg
              bg-white dark:bg-gray-800
              border-2 border-indigo-500 dark:border-indigo-400
              shadow-sm shadow-indigo-500/10
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-all duration-200
            `}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`
              ${inputStyles}
              px-3 py-1.5 rounded-lg
              bg-white dark:bg-gray-800
              border-2 border-indigo-500 dark:border-indigo-400
              shadow-sm shadow-indigo-500/10
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-all duration-200
            `}
          />
        )}
        
        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleSave}
            className="p-1 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05 }}
            onClick={handleCancel}
            className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        
        {/* Character count */}
        {maxLength && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-2 -bottom-5 text-xs text-gray-400"
          >
            {editValue.length}/{maxLength}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`
        relative group cursor-pointer
        ${disabled ? 'cursor-default' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <Component
        className={`
          ${baseStyles[Component]}
          ${isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-white'}
          ${!disabled ? 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50' : ''}
          px-3 py-1.5 -mx-3 -my-1.5 rounded-lg
          transition-all duration-200
          ${className}
        `}
      >
        {displayValue}
      </Component>
      
      {/* Edit icon on hover */}
      <AnimatePresence>
        {showEditIcon && isHovered && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <Pencil className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditableText;














