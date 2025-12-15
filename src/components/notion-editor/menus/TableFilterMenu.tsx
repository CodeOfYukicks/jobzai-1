import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Plus, ChevronDown } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { FilterConfig, ColumnMetadata } from '../extensions/EnhancedTable';

interface TableFilterMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_equal', label: 'Greater than or equal' },
    { value: 'less_equal', label: 'Less than or equal' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  select: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  'multi-select': [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  date: [
    { value: 'is', label: 'Is' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  checkbox: [
    { value: 'is_checked', label: 'Is checked' },
    { value: 'is_not_checked', label: 'Is not checked' },
  ],
  url: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
};

export default function TableFilterMenu({ editor, isOpen, onClose, position }: TableFilterMenuProps) {
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [editingFilter, setEditingFilter] = useState<FilterConfig | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Get table metadata
      const { selection } = editor.state;
      let tableNode: any = null;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
          tableNode = node;
          return false;
        }
      });

      if (tableNode?.attrs.metadata) {
        setColumns(tableNode.attrs.metadata.columns || []);
        setFilters(tableNode.attrs.metadata.filters || []);
      }
    }
  }, [isOpen, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const addFilter = () => {
    if (columns.length === 0) return;
    
    const newFilter: FilterConfig = {
      columnId: columns[0].id,
      operator: 'contains',
      value: '',
    };
    setEditingFilter(newFilter);
  };

  const saveFilter = (filter: FilterConfig) => {
    const existingIndex = filters.findIndex(f => f.columnId === filter.columnId && f.operator === filter.operator);
    let newFilters: FilterConfig[];
    
    if (existingIndex >= 0) {
      newFilters = [...filters];
      newFilters[existingIndex] = filter;
    } else {
      newFilters = [...filters, filter];
    }
    
    setFilters(newFilters);
    applyFilters(newFilters);
    setEditingFilter(null);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters([]);
    applyFilters([]);
  };

  const applyFilters = (newFilters: FilterConfig[]) => {
    editor.chain().focus().updateTableMetadata({ filters: newFilters }).run();
    
    // Apply filtering by hiding/showing rows
    const { selection } = editor.state;
    let tablePos: number | null = null;
    let tableNode: any = null;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
        tablePos = pos;
        tableNode = node;
        return false;
      }
    });

    if (!tableNode || !tablePos) return;

    // For now, we'll just store the filters in metadata
    // In a full implementation, you would add display:none styles to filtered rows
    // or use a custom node view to handle row visibility
  };

  const matchesFilter = (cellValue: any, filter: FilterConfig, columnType: string): boolean => {
    const { operator, value } = filter;

    switch (operator) {
      case 'contains':
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      case 'is':
        return cellValue === value;
      case 'is_not':
        return cellValue !== value;
      case 'is_empty':
        return !cellValue || cellValue === '';
      case 'is_not_empty':
        return cellValue && cellValue !== '';
      case 'equals':
        return parseFloat(cellValue) === parseFloat(value);
      case 'not_equals':
        return parseFloat(cellValue) !== parseFloat(value);
      case 'greater_than':
        return parseFloat(cellValue) > parseFloat(value);
      case 'less_than':
        return parseFloat(cellValue) < parseFloat(value);
      case 'greater_equal':
        return parseFloat(cellValue) >= parseFloat(value);
      case 'less_equal':
        return parseFloat(cellValue) <= parseFloat(value);
      case 'before':
        return new Date(cellValue) < new Date(value);
      case 'after':
        return new Date(cellValue) > new Date(value);
      case 'is_checked':
        return cellValue === true || cellValue === 'true';
      case 'is_not_checked':
        return cellValue !== true && cellValue !== 'true';
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-2 min-w-[320px] max-h-[500px] overflow-y-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </p>
            {filters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {filters.length > 0 && (
          <div className="px-2 py-2 space-y-2">
            {filters.map((filter, index) => {
              const column = columns.find(c => c.id === filter.columnId);
              if (!column) return null;

              const operators = OPERATORS[column.type] || OPERATORS.text;
              const operatorLabel = operators.find(op => op.value === filter.operator)?.label || filter.operator;

              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-2 bg-gray-50 dark:bg-gray-800 rounded group"
                >
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {column.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 mx-1">
                      {operatorLabel.toLowerCase()}
                    </span>
                    {!['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(filter.operator) && (
                      <span className="text-gray-900 dark:text-white font-medium">
                        "{filter.value}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFilter(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Filter */}
        {editingFilter ? (
          <FilterEditor
            filter={editingFilter}
            columns={columns}
            onSave={saveFilter}
            onCancel={() => setEditingFilter(null)}
          />
        ) : (
          <div className="px-2 py-2">
            <button
              onClick={addFilter}
              disabled={columns.length === 0}
              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                Add filter
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Filter Editor Component
interface FilterEditorProps {
  filter: FilterConfig;
  columns: ColumnMetadata[];
  onSave: (filter: FilterConfig) => void;
  onCancel: () => void;
}

function FilterEditor({ filter, columns, onSave, onCancel }: FilterEditorProps) {
  const [selectedColumn, setSelectedColumn] = useState(filter.columnId);
  const [selectedOperator, setSelectedOperator] = useState(filter.operator);
  const [value, setValue] = useState(filter.value);

  const column = columns.find(c => c.id === selectedColumn);
  const operators = column ? OPERATORS[column.type] || OPERATORS.text : OPERATORS.text;

  const needsValue = !['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(selectedOperator);

  const handleSave = () => {
    onSave({
      columnId: selectedColumn,
      operator: selectedOperator,
      value: needsValue ? value : null,
    });
  };

  return (
    <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Column
        </label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Operator
        </label>
        <select
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {needsValue && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Value
          </label>
          {column?.type === 'select' && column.options ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Select an option...</option>
              {column.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : column?.type === 'date' ? (
            <input
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          ) : column?.type === 'number' ? (
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter number..."
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value..."
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={needsValue && !value}
          className="flex-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}




