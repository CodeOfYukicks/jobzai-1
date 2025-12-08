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

  // Helpers to derive subtle overlays from the note color so the enlarged view
  // keeps the same sticky vibe as the original card.
  const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '');
    const matches = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!matches) return null;
    return {
      r: parseInt(matches[1], 16),
      g: parseInt(matches[2], 16),
      b: parseInt(matches[3], 16),
    };
  };

  const toRgba = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(254,243,199,${alpha})`; // fall back to soft yellow
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  const noteColor = note.color || '#FEF3C7';
  const sheenOverlay = toRgba(noteColor, 0.32);
  const depthOverlay = toRgba(noteColor, 0.18);
  const edgeOverlay = toRgba(noteColor, 0.45);

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
      {/* Tape effect for premium sticky feel */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 w-16 h-4 rounded-sm bg-black/10 border border-white/40 shadow-sm rotate-[-2deg] backdrop-blur-[2px]" />

      <div 
        className="relative min-h-[280px] h-72 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-black/5 overflow-hidden"
        style={{
          backgroundColor: noteColor,
          backgroundImage: `
            linear-gradient(180deg, ${sheenOverlay} 0%, transparent 45%),
            linear-gradient(135deg, ${depthOverlay} 0%, transparent 60%),
            linear-gradient(90deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 30%)
          `,
          boxShadow: '0 18px 38px -20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        {/* Header with Menu */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs text-gray-700 font-medium drop-shadow-sm">{formattedDate}</span>
          
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
                    className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-[#2b2a2c] rounded-lg shadow-lg border border-gray-200 dark:border-[#3d3c3e] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
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
              className="flex-1 w-full p-3 rounded-xl border border-white/50 bg-white/25 backdrop-blur-[2px] shadow-inner focus:border-black/10 focus:outline-none resize-none text-sm text-gray-900 placeholder:text-gray-600"
              style={{
                boxShadow: `inset 0 1px 0 ${edgeOverlay}, inset 0 -12px 24px ${toRgba('#000000', 0.08)}`,
              }}
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


