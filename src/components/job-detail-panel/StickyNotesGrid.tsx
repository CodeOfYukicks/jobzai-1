import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote as StickyNoteType } from '../../types/job';
import { StickyNote } from './StickyNote';
import { StickyNote as StickyNoteIcon } from 'lucide-react';

interface StickyNotesGridProps {
  notes: StickyNoteType[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const StickyNotesGrid = ({ notes, onEdit, onDelete }: StickyNotesGridProps) => {
  if (notes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
          <StickyNoteIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No notes yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create your first sticky note using the editor above
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};


