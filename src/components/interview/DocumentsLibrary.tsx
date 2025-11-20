import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Clock } from 'lucide-react';
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
}

interface DeleteModalProps {
  document: NoteDocument;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ document, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Delete Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DocumentCard({ document, onOpen, onDelete }: {
  document: NoteDocument;
  onOpen: () => void;
  onDelete: () => void;
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
    return text.substring(0, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="group relative bg-[#FFCC66] dark:bg-[#D4A947] border border-[#E6B84D] dark:border-[#B8903D] rounded-xl p-5 hover:shadow-lg hover:border-[#D4A947] dark:hover:border-[#E6B84D] transition-all duration-200 cursor-pointer"
      onClick={onOpen}
    >
      {/* Document Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FFD77A] dark:bg-[#B8903D] flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#8B7332] dark:text-[#FFE699]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-900 truncate mb-1">
            {document.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-800">
            <Clock className="w-3.5 h-3.5" />
            <span>{getTimeAgo(document.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {getPreview() && (
        <p className="text-sm text-gray-800 dark:text-gray-900 line-clamp-2 mb-4">
          {getPreview()}...
        </p>
      )}

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-200 text-gray-600 hover:text-red-600 dark:hover:text-red-700 transition-all duration-200"
        title="Delete document"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function DocumentsLibrary({
  documents,
  onCreateDocument,
  onOpenDocument,
  onDeleteDocument,
}: DocumentsLibraryProps) {
  const [documentToDelete, setDocumentToDelete] = useState<NoteDocument | null>(null);

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete.id);
      toast.success('Document deleted');
      setDocumentToDelete(null);
    }
  };

  // Sort documents by most recently updated
  const sortedDocuments = [...documents].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </p>
          </div>
          <button
            onClick={onCreateDocument}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFCC66] hover:bg-[#FFD77A] text-gray-900 text-sm font-medium rounded-lg transition-colors border border-[#E6B84D]"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {documents.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[#FFD77A] dark:bg-[#D4A947] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#8B7332] dark:text-[#FFE699]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No documents yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              Create your first document to start taking notes with rich text formatting and AI assistance
            </p>
            <button
              onClick={onCreateDocument}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FFCC66] hover:bg-[#FFD77A] text-gray-900 text-sm font-medium rounded-lg transition-colors border border-[#E6B84D]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          /* Documents Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {sortedDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onOpen={() => onOpenDocument(doc.id)}
                  onDelete={() => setDocumentToDelete(doc)}
                />
              ))}
            </AnimatePresence>
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

