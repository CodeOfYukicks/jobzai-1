import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BulletInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  icon?: string;
  emptyText?: string;
  maxHeight?: string;
}

export const BulletInput = ({
  items,
  onChange,
  placeholder = "Type and press Enter to add more...",
  icon = "•",
  emptyText = "No items added yet",
  maxHeight = "300px"
}: BulletInputProps) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});

  // Auto-focus on newly added items
  useEffect(() => {
    if (focusedIndex !== null && inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex]?.focus();
    }
  }, [items.length]);

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const value = target.value;

    // Enter key: add new bullet
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(index + 1, 0, '');
      onChange(newItems);
      setFocusedIndex(index + 1);
    }

    // Backspace on empty: remove bullet
    if (e.key === 'Backspace' && value === '' && items.length > 1) {
      e.preventDefault();
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
      setFocusedIndex(Math.max(0, index - 1));
      
      // Focus previous input
      setTimeout(() => {
        const prevIndex = Math.max(0, index - 1);
        inputRefs.current[prevIndex]?.focus();
        // Move cursor to end
        const prevInput = inputRefs.current[prevIndex];
        if (prevInput) {
          prevInput.selectionStart = prevInput.value.length;
          prevInput.selectionEnd = prevInput.value.length;
        }
      }, 0);
    }

    // Arrow Up: focus previous
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    // Arrow Down: focus next
    if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      onChange(['']);
    } else {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
    }
  };

  const addItem = () => {
    onChange([...items, '']);
    setFocusedIndex(items.length);
  };

  // Auto-resize textarea
  const adjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {items.length === 0 || (items.length === 1 && items[0] === '') ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-400 dark:text-gray-500 italic py-2"
          >
            {emptyText}
          </motion.div>
        ) : null}
        
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            layout
            className="flex gap-2 group"
          >
            {/* Bullet Icon */}
            <div className="flex-shrink-0 pt-3 text-gray-400 dark:text-gray-500 font-bold select-none">
              {icon}
            </div>

            {/* Textarea */}
            <textarea
              ref={(el) => { inputRefs.current[index] = el; }}
              value={item}
              onChange={(e) => {
                handleChange(index, e.target.value);
                adjustHeight(e.target);
              }}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setFocusedIndex(index)}
              onInput={(e) => adjustHeight(e.currentTarget)}
              placeholder={index === 0 ? placeholder : "Continue typing..."}
              rows={1}
              className="
                flex-1 px-3 py-2 
                bg-white dark:bg-[#2b2a2c]
                border border-gray-300 dark:border-[#4a494b]
                rounded-lg
                text-gray-900 dark:text-gray-100
                text-sm
                placeholder:text-gray-400 dark:placeholder:text-gray-400
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
                focus:border-gray-400 dark:focus:border-gray-500
                resize-none
                overflow-hidden
              "
              style={{ minHeight: '40px', maxHeight }}
            />

            {/* Remove Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => removeItem(index)}
              className="
                flex-shrink-0 p-2 mt-1
                text-gray-400 hover:text-red-500 dark:hover:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                rounded-lg
                transition-all
                opacity-0 group-hover:opacity-100
              "
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Helper Text */}
      {items.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-4"
        >
          <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded text-xs">Enter</kbd> to add</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded text-xs">Backspace</kbd> on empty to remove</span>
        </motion.p>
      )}
    </div>
  );
};

export default BulletInput;

