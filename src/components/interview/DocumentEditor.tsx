import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, FileText, Pencil } from 'lucide-react';
import RichTextNotesEditor from './RichTextNotesEditor';

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
}

interface DocumentEditorProps {
  document: NoteDocument;
  onBack: () => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: string) => void;
}

export default function DocumentEditor({
  document,
  onBack,
  onUpdateTitle,
  onUpdateContent,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update title when document changes
  useEffect(() => {
    setTitle(document.title);
  }, [document.id, document.title]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== document.title) {
      onUpdateTitle(document.id, trimmedTitle);
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    } else if (!trimmedTitle) {
      setTitle(document.title); // Reset to original if empty
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(document.title);
      setIsEditingTitle(false);
    }
  };

  const handleContentChange = (content: string) => {
    onUpdateContent(document.id, content);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'today';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-[#1E1F22]">
      {/* Premium Header */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1E1F22] border-b border-gray-100 dark:border-[#2A2A2E]">
        {/* Top Row: Back + Save Status */}
        <div className="flex items-center justify-between px-6 py-3">
          {/* Back Button - Premium Pill Style */}
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          {/* Save Status - Premium Pill */}
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#2A2A2E] text-gray-500 dark:text-gray-400"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-medium">Saving...</span>
              </motion.div>
            ) : lastSaved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Saved {getTimeAgo(lastSaved)}</span>
              </motion.div>
            ) : (
              <div className="w-[100px]" /> // Placeholder for layout balance
            )}
          </AnimatePresence>
        </div>

        {/* Title Section - Premium Card Style */}
        <div className="px-6 pb-5">
          <div className="bg-gray-50 dark:bg-[#1A1A1D] rounded-xl p-4 border border-gray-100 dark:border-[#2A2A2E]">
            <div className="flex items-start gap-4">
              {/* Document Icon Badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              
              {/* Title Area */}
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={handleTitleBlur}
                      onKeyDown={handleTitleKeyDown}
                      autoFocus
                      className="w-full text-base font-semibold text-gray-900 dark:text-white bg-white dark:bg-[#2A2A2E] border border-indigo-300 dark:border-indigo-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Enter document title..."
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-1">
                      Press Enter to save, Escape to cancel
                    </p>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={() => setIsEditingTitle(true)}
                    className="group w-full text-left"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {title || 'Untitled Document'}
                      </h1>
                      <div className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                          <Pencil className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      Click to edit title
                    </p>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <RichTextNotesEditor
          content={document.content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}

