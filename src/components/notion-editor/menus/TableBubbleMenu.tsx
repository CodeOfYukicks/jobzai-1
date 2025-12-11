import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Link as LinkIcon,
  List,
  ChevronDown,
  Combine,
  Split,
} from 'lucide-react';

interface TableBubbleMenuProps {
  editor: Editor;
}

export default function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColumnTypeMenu, setShowColumnTypeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const columnTypeMenuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    // Only show if table is active
    if (!editor.isActive('table')) {
      setIsVisible(false);
      return;
    }

    const { selection } = editor.state;
    const { from } = selection;

    // Get the coordinates of the current position
    const coords = editor.view.coordsAtPos(from);

    // Position above the table
    setPosition({ 
      top: coords.top - 50, 
      left: coords.left 
    });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    const handleUpdate = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (columnTypeMenuRef.current && !columnTypeMenuRef.current.contains(event.target as Node)) {
        setShowColumnTypeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columnTypes = [
    { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { type: 'select', label: 'Select', icon: <List className="w-4 h-4" /> },
    { type: 'multi-select', label: 'Multi-select', icon: <List className="w-4 h-4" /> },
    { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
    { type: 'url', label: 'URL', icon: <LinkIcon className="w-4 h-4" /> },
  ];

  const handleSetColumnType = (type: string) => {
    // Get current column index
    const { selection } = editor.state;
    let columnIndex = 0;
    let found = false;

    editor.state.doc.descendants((node, pos) => {
      if (found) return false;
      
      if (node.type.name === 'table') {
        let cellCount = 0;
        node.descendants((cellNode, cellPos) => {
          if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
            if (pos + cellPos + 1 <= selection.from && pos + cellPos + cellNode.nodeSize >= selection.from) {
              const row = node.firstChild;
              if (row) {
                columnIndex = cellCount % row.childCount;
                found = true;
                return false;
              }
            }
            cellCount++;
          }
        });
        return false;
      }
    });

    editor.chain().focus().setColumnType(columnIndex, type as any).run();
    setShowColumnTypeMenu(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 transition-opacity duration-150"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-1 flex items-center gap-0.5">
      {/* Add Row Before */}
      <button
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Add row before"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* Add Row After */}
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Add row after"
      >
        <ArrowDown className="w-4 h-4" />
      </button>

      {/* Add Column Before */}
      <button
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Add column before"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Add Column After */}
      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Add column after"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Column Type Selector */}
      <div className="relative" ref={columnTypeMenuRef}>
        <button
          onClick={() => setShowColumnTypeMenu(!showColumnTypeMenu)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1"
          title="Column type"
        >
          <Type className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>

        <AnimatePresence>
          {showColumnTypeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 min-w-[180px] z-50"
            >
              {columnTypes.map((columnType) => (
                <button
                  key={columnType.type}
                  onClick={() => handleSetColumnType(columnType.type)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
                >
                  <div className="text-gray-600 dark:text-gray-400">
                    {columnType.icon}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {columnType.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Delete Row */}
      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
        title="Delete row"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Delete Column */}
      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
        title="Delete column"
      >
        <Trash2 className="w-4 h-4 rotate-90" />
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* More Options */}
      <div className="relative" ref={moreMenuRef}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 min-w-[180px] z-50"
            >
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeaderRow().run();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Toggle header row
                </span>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().toggleHeaderColumn().run();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Toggle header column
                </span>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().mergeCells().run();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Combine className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Merge cells
                </span>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().splitCell().run();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Split className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Split cell
                </span>
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

              <button
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-left transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete table</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

