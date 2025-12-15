import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Plus, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

// Number Cell Editor
interface NumberCellEditorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onClose: () => void;
}

export function NumberCellEditor({ value, onChange, onClose }: NumberCellEditorProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const numValue = parseFloat(inputValue);
    onChange(isNaN(numValue) ? null : numValue);
    onClose();
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        className="w-32 px-2 py-1 text-sm bg-transparent border-none outline-none"
        placeholder="Enter number..."
      />
      <button
        onClick={handleSave}
        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Select Cell Editor
interface SelectCellEditorProps {
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
  onClose: () => void;
}

export function SelectCellEditor({ value, options, onChange, onClose }: SelectCellEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute z-50 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 min-w-[200px] max-h-[300px] overflow-y-auto"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search options..."
          className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
          autoFocus
        />
      </div>
      <div className="py-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                onClose();
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                value === option ? 'bg-gray-50 dark:bg-gray-800/50 font-medium' : ''
              }`}
            >
              {option}
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            No options found
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Multi-Select Cell Editor
interface MultiSelectCellEditorProps {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  onClose: () => void;
}

export function MultiSelectCellEditor({ value, options, onChange, onClose }: MultiSelectCellEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute z-50 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 min-w-[200px] max-h-[300px] overflow-y-auto"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search options..."
          className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
          autoFocus
        />
      </div>
      <div className="py-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                value.includes(option)
                  ? 'bg-purple-600 border-purple-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {value.includes(option) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{option}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            No options found
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="w-full px-3 py-1.5 text-sm text-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}

// Date Cell Editor
interface DateCellEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onClose: () => void;
}

export function DateCellEditor({ value, onChange, onClose }: DateCellEditorProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    onChange(inputValue || null);
    onClose();
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
      <CalendarIcon className="w-4 h-4 text-gray-400 ml-1" />
      <input
        ref={inputRef}
        type="date"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        className="px-2 py-1 text-sm bg-transparent border-none outline-none"
      />
      <button
        onClick={handleSave}
        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Checkbox Cell Editor
interface CheckboxCellEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function CheckboxCellEditor({ value, onChange }: CheckboxCellEditorProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        value
          ? 'bg-purple-600 border-purple-600'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      {value && <Check className="w-3.5 h-3.5 text-white" />}
    </button>
  );
}

// URL Cell Editor
interface URLCellEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onClose: () => void;
}

export function URLCellEditor({ value, onChange, onClose }: URLCellEditorProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const validateURL = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (validateURL(inputValue)) {
      onChange(inputValue || null);
      onClose();
    } else {
      setIsValid(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg min-w-[250px]">
      <div className="flex items-center gap-1">
        <ExternalLink className="w-4 h-4 text-gray-400 ml-1" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsValid(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          className="flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none"
          placeholder="https://example.com"
        />
        <button
          onClick={handleSave}
          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded transition-colors"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {!isValid && (
        <p className="text-xs text-red-600 dark:text-red-400 px-2">
          Please enter a valid URL
        </p>
      )}
    </div>
  );
}

// Cell Value Display Components
export function NumberCellDisplay({ value }: { value: number | null }) {
  return (
    <span className="text-right w-full block">
      {value !== null ? value.toLocaleString() : ''}
    </span>
  );
}

export function SelectCellDisplay({ value }: { value: string | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
      {value}
    </span>
  );
}

export function MultiSelectCellDisplay({ value }: { value: string[] }) {
  if (!value || value.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function DateCellDisplay({ value }: { value: string | null }) {
  if (!value) return null;
  const date = new Date(value);
  return (
    <span className="text-sm">
      {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
    </span>
  );
}

export function URLCellDisplay({ value }: { value: string | null }) {
  if (!value) return null;
  const url = value.startsWith('http') ? value : `https://${value}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="truncate max-w-[200px]">{value}</span>
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  );
}



