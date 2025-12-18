import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Link as LinkIcon,
  List,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';
import { ColumnMetadata } from '../extensions/EnhancedTable';

interface ColumnTypeSelectorProps {
  columnType: ColumnMetadata['type'];
  columnOptions?: string[];
  onTypeChange: (type: ColumnMetadata['type']) => void;
  onOptionsChange?: (options: string[]) => void;
}

export default function ColumnTypeSelector({
  columnType,
  columnOptions = [],
  onTypeChange,
  onOptionsChange,
}: ColumnTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);
  const [newOption, setNewOption] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowOptionsEditor(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columnTypes = [
    { type: 'text' as const, label: 'Text', icon: <Type className="w-4 h-4" />, description: 'Plain text' },
    { type: 'number' as const, label: 'Number', icon: <Hash className="w-4 h-4" />, description: 'Numeric values' },
    { type: 'select' as const, label: 'Select', icon: <List className="w-4 h-4" />, description: 'Single choice' },
    { type: 'multi-select' as const, label: 'Multi-select', icon: <List className="w-4 h-4" />, description: 'Multiple choices' },
    { type: 'date' as const, label: 'Date', icon: <Calendar className="w-4 h-4" />, description: 'Date picker' },
    { type: 'checkbox' as const, label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" />, description: 'True/false' },
    { type: 'url' as const, label: 'URL', icon: <LinkIcon className="w-4 h-4" />, description: 'Web link' },
  ];

  const currentType = columnTypes.find(t => t.type === columnType);

  const handleTypeSelect = (type: ColumnMetadata['type']) => {
    onTypeChange(type);
    if (type === 'select' || type === 'multi-select') {
      setShowOptionsEditor(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim() && onOptionsChange) {
      onOptionsChange([...columnOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (onOptionsChange) {
      onOptionsChange(columnOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {currentType?.icon}
        <span className="text-gray-700 dark:text-gray-300">{currentType?.label}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 min-w-[240px] z-50"
          >
            {!showOptionsEditor ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Column Type
                  </p>
                </div>
                {columnTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => handleTypeSelect(type.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors ${
                      columnType === type.type ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="text-gray-600 dark:text-gray-400">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Edit Options
                  </p>
                </div>
                <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {columnOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded group"
                    >
                      <span className="flex-1 text-sm text-gray-900 dark:text-white">
                        {option}
                      </span>
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      placeholder="Add option..."
                      className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none"
                    />
                    <button
                      onClick={handleAddOption}
                      disabled={!newOption.trim()}
                      className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowOptionsEditor(false);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}







