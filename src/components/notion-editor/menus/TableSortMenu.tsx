import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { SortConfig, ColumnMetadata } from '../extensions/EnhancedTable';

interface TableSortMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function TableSortMenu({ editor, isOpen, onClose, position }: TableSortMenuProps) {
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
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
        setSorts(tableNode.attrs.metadata.sorts || []);
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

  const addSort = (columnId: string) => {
    const existingSort = sorts.find(s => s.columnId === columnId);
    if (existingSort) {
      // Toggle direction
      const newSorts = sorts.map(s =>
        s.columnId === columnId
          ? { ...s, direction: s.direction === 'asc' ? 'desc' as const : 'asc' as const }
          : s
      );
      setSorts(newSorts);
      applySorts(newSorts);
    } else {
      // Add new sort
      const newSorts = [...sorts, { columnId, direction: 'asc' as const }];
      setSorts(newSorts);
      applySorts(newSorts);
    }
  };

  const removeSort = (columnId: string) => {
    const newSorts = sorts.filter(s => s.columnId !== columnId);
    setSorts(newSorts);
    applySorts(newSorts);
  };

  const clearAllSorts = () => {
    setSorts([]);
    applySorts([]);
  };

  const applySorts = (newSorts: SortConfig[]) => {
    editor.chain().focus().updateTableMetadata({ sorts: newSorts }).run();
    
    // Apply sorting to table rows
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

    // Extract rows (skip header row if exists)
    const rows: any[] = [];
    let hasHeader = false;
    
    tableNode.forEach((rowNode: any, offset: number, index: number) => {
      if (index === 0 && rowNode.firstChild?.type.name === 'tableHeader') {
        hasHeader = true;
      } else {
        rows.push({ node: rowNode, index });
      }
    });

    if (rows.length === 0) return;

    // Sort rows based on sort configs
    const sortedRows = [...rows].sort((a, b) => {
      for (const sort of newSorts) {
        const colIndex = columns.findIndex(c => c.id === sort.columnId);
        if (colIndex === -1) continue;

        const cellA = a.node.child(colIndex);
        const cellB = b.node.child(colIndex);

        const valueA = cellA.attrs.cellValue || cellA.textContent || '';
        const valueB = cellB.attrs.cellValue || cellB.textContent || '';

        const column = columns[colIndex];
        let comparison = 0;

        // Type-specific comparison
        if (column.type === 'number') {
          const numA = parseFloat(valueA) || 0;
          const numB = parseFloat(valueB) || 0;
          comparison = numA - numB;
        } else if (column.type === 'date') {
          const dateA = new Date(valueA).getTime() || 0;
          const dateB = new Date(valueB).getTime() || 0;
          comparison = dateA - dateB;
        } else if (column.type === 'checkbox') {
          const boolA = valueA === true || valueA === 'true';
          const boolB = valueB === true || valueB === 'true';
          comparison = (boolA ? 1 : 0) - (boolB ? 1 : 0);
        } else {
          // Text comparison
          comparison = String(valueA).localeCompare(String(valueB));
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    // Rebuild table with sorted rows
    const { tr } = editor.state;
    const headerRow = hasHeader ? tableNode.child(0) : null;
    
    const newTableContent: any[] = [];
    if (headerRow) {
      newTableContent.push(headerRow);
    }
    sortedRows.forEach(row => {
      newTableContent.push(row.node);
    });

    // Create new table node
    const newTable = tableNode.type.create(
      tableNode.attrs,
      newTableContent
    );

    tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
    editor.view.dispatch(tr);
  };

  if (!isOpen) return null;

  const availableColumns = columns.filter(col => !sorts.find(s => s.columnId === col.id));

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-2 min-w-[280px] max-h-[400px] overflow-y-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Sort
            </p>
            {sorts.length > 0 && (
              <button
                onClick={clearAllSorts}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Active Sorts */}
        {sorts.length > 0 && (
          <div className="px-2 py-2 space-y-1">
            {sorts.map((sort, index) => {
              const column = columns.find(c => c.id === sort.columnId);
              if (!column) return null;

              return (
                <div
                  key={sort.columnId}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded group"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">
                    {column.name}
                  </span>
                  <button
                    onClick={() => addSort(sort.columnId)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {sort.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => removeSort(sort.columnId)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Sort */}
        {availableColumns.length > 0 && (
          <>
            {sorts.length > 0 && (
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            )}
            <div className="px-2 py-1">
              <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Add sort
              </p>
              {availableColumns.map((column) => (
                <button
                  key={column.id}
                  onClick={() => addSort(column.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {column.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {sorts.length === 0 && availableColumns.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No columns available
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}








