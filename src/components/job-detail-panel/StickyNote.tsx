import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { StickyNote as StickyNoteType } from '../../types/job';

interface StickyNoteProps {
  note: StickyNoteType;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const StickyNote = ({ note, onEdit, onDelete }: StickyNoteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = () => {
    if (editedContent.trim()) {
      onEdit(note.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
    setShowMenu(false);
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      <div 
        className="h-64 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        style={{
          backgroundColor: note.color || '#FEF3C7', // Beige clair par défaut
        }}
      >
        {/* Header with Menu */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs text-gray-600 font-medium">{formattedDate}</span>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="flex flex-col h-[calc(100%-3rem)]">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 w-full p-2 bg-white/50 rounded border border-gray-300 dark:border-gray-600 focus:border-gray-400 focus:outline-none resize-none text-sm"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={handleCancel}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleSave}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words overflow-y-auto h-[calc(100%-2rem)] cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {note.content}
          </div>
        )}
      </div>
    </motion.div>
  );
};

