import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Clock, Search, MoreVertical } from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
}

interface DocumentsLibraryProps {
  documents: NoteDocument[];
  onCreateDocument: () => void;
  onOpenDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  highlightedDocumentId?: string | null;
}

interface DeleteModalProps {
  document: NoteDocument;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ document, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full ring-1 ring-slate-200/60 dark:ring-slate-800/60"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Delete Document?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This will permanently delete "<span className="font-medium text-slate-900 dark:text-slate-300">{document.title}</span>". 
            This action cannot be undone.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DocumentCard({ document, onOpen, onDelete, isHighlighted }: {
  document: NoteDocument;
  onOpen: () => void;
  onDelete: () => void;
  isHighlighted?: boolean;
}) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  // Extract preview from HTML content
  const getPreview = () => {
    if (document.preview) return document.preview;
    const div = window.document.createElement('div');
    div.innerHTML = document.content;
    const text = div.textContent || div.innerText || '';
    return text.substring(0, 120);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className={`group relative bg-white dark:bg-slate-800/50 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
        isHighlighted 
          ? 'ring-2 ring-jobzai-400 dark:ring-jobzai-500 shadow-lg shadow-jobzai-200/30 dark:shadow-jobzai-900/20' 
          : 'ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:ring-jobzai-300/50 dark:hover:ring-jobzai-600/30 hover:shadow-premium-soft'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-jobzai-50 dark:bg-jobzai-900/30 flex items-center justify-center">
            <FileText className="w-4 h-4 text-jobzai-600 dark:text-jobzai-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {document.title || 'Untitled'}
          </h3>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 h-[3.6em]">
        {getPreview() || <span className="italic opacity-60">No content yet...</span>}
      </p>

      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
        <Clock className="w-3 h-3" />
        <span>Edited {getTimeAgo(document.updatedAt)}</span>
      </div>
    </motion.div>
  );
}

export default function DocumentsLibrary({
  documents,
  onCreateDocument,
  onOpenDocument,
  onDeleteDocument,
  highlightedDocumentId,
}: DocumentsLibraryProps) {
  const [documentToDelete, setDocumentToDelete] = useState<NoteDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted document when it appears (only once, then allow normal scrolling)
  useEffect(() => {
    if (highlightedDocumentId && highlightedRef.current) {
      const timeoutId = setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [highlightedDocumentId]);

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete.id);
      toast.success('Document deleted');
      setDocumentToDelete(null);
    }
  };

  // Sort documents by most recently updated
  const sortedDocuments = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.preview?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            My Notes
          </h2>
          <motion.button
            onClick={onCreateDocument}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg transition-transform"
            style={{ 
              background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', 
              boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)' 
            }}
            title="New Note"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-700/60 focus:ring-jobzai-400/50 dark:focus:ring-jobzai-600/50 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {documents.length === 0 ? (
          /* Empty State - Matching History tab style */
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-jobzai-100 to-jobzai-50 dark:from-jobzai-900/30 dark:to-jobzai-950/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <FileText className="w-6 h-6 text-jobzai-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              No notes yet
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 max-w-[200px]">
              Capture your thoughts, questions, and answers during preparation.
            </p>
            <motion.button
              onClick={onCreateDocument}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-medium rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:ring-jobzai-300/50 dark:hover:ring-jobzai-600/30 hover:shadow-premium-soft transition-all"
            >
              Create First Note
            </motion.button>
          </div>
        ) : (
          /* Documents List */
          <>
            <AnimatePresence>
              {sortedDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  ref={doc.id === highlightedDocumentId ? highlightedRef : null}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DocumentCard
                    document={doc}
                    onOpen={() => onOpenDocument(doc.id)}
                    onDelete={() => setDocumentToDelete(doc)}
                    isHighlighted={doc.id === highlightedDocumentId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {sortedDocuments.length === 0 && searchQuery && (
               <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                 No notes match your search.
               </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {documentToDelete && (
          <DeleteConfirmationModal
            document={documentToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDocumentToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
