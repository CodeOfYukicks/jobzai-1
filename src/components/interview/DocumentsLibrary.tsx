import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Clock, Search, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-800"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Delete Document?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            This will permanently delete "<span className="font-medium text-gray-900 dark:text-gray-300">{document.title}</span>". 
            This action cannot be undone.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-200 dark:shadow-none"
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
      onClick={onOpen}
      className={`group relative bg-white dark:bg-[#1A1A1D] border rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
        isHighlighted 
          ? 'border-purple-400 dark:border-purple-600 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30 ring-2 ring-purple-200 dark:ring-purple-800' 
          : 'border-gray-200 dark:border-[#2A2A2E] hover:border-indigo-200 dark:hover:border-indigo-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {document.title || 'Untitled'}
          </h3>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-3 h-[3.6em]">
        {getPreview() || <span className="italic opacity-60">No content yet...</span>}
      </p>

      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
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
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-[#1E1F22]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white dark:bg-[#1E1F22] border-b border-gray-100 dark:border-[#2A2A2E]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            My Notes
          </h2>
          <button
            onClick={onCreateDocument}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 transition-transform shadow-sm"
            title="New Note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#1A1A1D] border-none rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {documents.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 rotate-3">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              No notes yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-[200px]">
              Capture your thoughts, questions, and answers during preparation.
            </p>
            <button
              onClick={onCreateDocument}
              className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              Create First Note
            </button>
          </div>
        ) : (
          /* Documents Grid */
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  ref={doc.id === highlightedDocumentId ? highlightedRef : null}
                >
                  <DocumentCard
                    document={doc}
                    onOpen={() => onOpenDocument(doc.id)}
                    onDelete={() => setDocumentToDelete(doc)}
                    isHighlighted={doc.id === highlightedDocumentId}
                  />
                </div>
              ))}
            </AnimatePresence>
            {sortedDocuments.length === 0 && searchQuery && (
               <div className="text-center py-8 text-sm text-gray-500">
                 No notes match your search.
               </div>
            )}
          </div>
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
