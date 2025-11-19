import { motion } from 'framer-motion';
import { JobApplication, StickyNote } from '../../types/job';
import { NoteEditor } from './NoteEditor';
import { StickyNotesGrid } from './StickyNotesGrid';

interface NotesTabProps {
  job: JobApplication;
  onUpdate?: (updates: Partial<JobApplication>) => Promise<void>;
}

export const NotesTab = ({ job, onUpdate }: NotesTabProps) => {
  const notes = job.stickyNotes || [];

  const handleAddNote = async (content: string) => {
    if (!onUpdate) return;

    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      content,
      color: '#FEF3C7', // Beige clair par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    
    await onUpdate({
      stickyNotes: updatedNotes,
    });
  };

  const handleEditNote = async (id: string, content: string) => {
    if (!onUpdate) return;

    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, content, updatedAt: new Date().toISOString() }
        : note
    );

    await onUpdate({
      stickyNotes: updatedNotes,
    });
  };

  const handleDeleteNote = async (id: string) => {
    if (!onUpdate) return;

    const updatedNotes = notes.filter(note => note.id !== id);

    await onUpdate({
      stickyNotes: updatedNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Note Editor */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <NoteEditor onSave={handleAddNote} />
      </motion.div>

      {/* Sticky Notes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Notes {notes.length > 0 && `(${notes.length})`}
          </h3>
        </div>
        
        <StickyNotesGrid
          notes={notes}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
        />
      </motion.div>
    </div>
  );
};

