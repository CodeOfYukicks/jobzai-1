import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Trash2,
  Edit3,
  MoreHorizontal,
  Type,
} from 'lucide-react';
import { NotionDocument, extractTextPreview } from '../../lib/notionDocService';

interface NotionPreviewCardProps {
  note: NotionDocument;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  compact?: boolean;
  draggable?: boolean;
}

function formatDateString(dateInput: any): string {
  if (!dateInput) return 'Unknown date';

  try {
    let date: Date;

    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Unknown date';
    }

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

const NotionPreviewCard = memo(
  ({
    note,
    onDelete,
    onEdit,
    onRename,
    compact = false,
    draggable = true,
  }: NotionPreviewCardProps) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(note.title);
    const [contextMenu, setContextMenu] = useState<{
      open: boolean;
      x: number;
      y: number;
    }>({ open: false, x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Card dimensions
    const targetWidth = compact ? 140 : 220;
    const scaledHeight = compact ? 180 : 280;

    const preview = extractTextPreview(note.content, 100);

    const handleEdit = useCallback(() => {
      onEdit(note.id);
    }, [note.id, onEdit]);

    const confirmDelete = useCallback(() => {
      onDelete(note.id);
      setIsDeleteDialogOpen(false);
    }, [note.id, onDelete]);

    const handleRename = useCallback(() => {
      if (onRename && newTitle.trim() && newTitle !== note.title) {
        onRename(note.id, newTitle.trim());
      }
      setIsRenaming(false);
    }, [note.id, note.title, newTitle, onRename]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const x = e.clientX;
      const y = e.clientY;

      const menuWidth = 160;
      const menuHeight = 120;
      const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
      const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

      setContextMenu({ open: true, x: adjustedX, y: adjustedY });
    }, []);

    const closeContextMenu = useCallback(() => {
      setContextMenu((prev) => ({ ...prev, open: false }));
    }, []);

    useEffect(() => {
      if (!contextMenu.open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contextMenuRef.current &&
          !contextMenuRef.current.contains(e.target as Node)
        ) {
          closeContextMenu();
        }
      };

      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('contextmenu', closeContextMenu, true);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('contextmenu', closeContextMenu, true);
      };
    }, [contextMenu.open, closeContextMenu]);

    useEffect(() => {
      if (isRenaming && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isRenaming]);

    const handleDragStart = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.setData('application/x-note-id', note.id);
        e.dataTransfer.effectAllowed = 'move';

        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        position: absolute;
        top: -1000px;
        left: -1000px;
      `;
        dragImage.textContent = note.emoji || '📝';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 40, 50);

        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 100);
      },
      [note.id, note.emoji]
    );

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -8,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        className="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-pointer"
        onClick={handleEdit}
        onContextMenu={handleContextMenu}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
      >
        {/* Note Preview Card */}
        <div
          className="relative mb-4"
          style={{
            width: `${targetWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {/* Purple Glow Effect */}
          <div
            className="absolute -inset-4 rounded-lg opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 -z-30"
            style={{
              background:
                'radial-gradient(circle at center, rgba(139, 92, 246, 0.25), transparent 70%)',
            }}
          />

          {/* Stack effect layers */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-gray-700/80 rounded-lg transform translate-y-1.5 translate-x-1.5 opacity-0 group-hover:opacity-60 transition-all duration-300 -z-10 shadow-sm" />
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 dark:bg-gray-600/60 rounded-lg transform translate-y-3 translate-x-3 opacity-0 group-hover:opacity-40 transition-all duration-300 -z-20 shadow-sm" />

          <div className="relative w-full h-full bg-white dark:bg-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden rounded-lg ring-1 ring-black/5 group-hover:ring-purple-500/20 flex flex-col">
            {/* Header with emoji and cover */}
            <div className="relative h-16 bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-100 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <span className="text-3xl">{note.emoji || '📝'}</span>
            </div>

            {/* Content preview */}
            <div className="flex-1 p-3 overflow-hidden">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                {note.title || 'Untitled'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 leading-relaxed">
                {preview || 'Empty note...'}
              </p>
            </div>

            {/* Note badge */}
            <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-purple-500 text-white text-[8px] font-bold rounded shadow-lg">
              NOTE
            </div>

            {/* Glass Action Bar - Appears on hover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center gap-1 px-2 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-full shadow-xl border border-black/5 dark:border-white/10">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </motion.button>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                {onRename && (
                  <>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRenaming(true);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                      title="Rename"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </motion.button>
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                  </>
                )}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="w-full flex flex-col items-center gap-1">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
                if (e.key === 'Escape') {
                  setNewTitle(note.title);
                  setIsRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-gray-900 dark:text-white text-center 
                bg-transparent border-b-2 border-purple-500 outline-none w-full max-w-[180px]"
            />
          ) : (
            <h3
              className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px] text-center"
              title={note.title}
            >
              {note.title || 'Untitled'}
            </h3>
          )}

          {!compact && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateString(note.updatedAt || note.createdAt)}
              </span>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu.open &&
          typeof window !== 'undefined' &&
          document?.body &&
          createPortal(
            <div
              ref={contextMenuRef}
              className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl
              border border-gray-200 dark:border-gray-700 py-1.5 min-w-[160px]"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  closeContextMenu();
                  handleEdit();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-purple-500" />
                Edit Note
              </button>
              {onRename && (
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    closeContextMenu();
                    setIsRenaming(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
                >
                  <Type className="w-4 h-4 text-blue-500" />
                  Rename
                </button>
              )}
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  closeContextMenu();
                  setIsDeleteDialogOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>,
            document.body
          )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {isDeleteDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsDeleteDialogOpen(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Note?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  "{note.title || 'Untitled'}" will be permanently deleted.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                    rounded-lg transition-colors shadow-lg shadow-red-600/25"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

NotionPreviewCard.displayName = 'NotionPreviewCard';

export default NotionPreviewCard;
export type { NotionPreviewCardProps };

