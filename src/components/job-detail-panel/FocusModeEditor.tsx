import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Save, Check, Loader2, FileText, Undo2, Redo2 } from 'lucide-react';
import { AIChat } from './AIChat';
import { toast } from 'sonner';

interface FocusModeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  documentType: 'cover_letter' | 'follow_up';
  title: string;
  onSave?: (content: string) => Promise<void>;
}

export const FocusModeEditor = ({
  isOpen,
  onClose,
  initialContent,
  documentType,
  title,
  onSave,
}: FocusModeEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Undo/Redo history management
  const [contentHistory, setContentHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUpdatingFromHistory = useRef(false);

  useEffect(() => {
    setContent(initialContent);
    setContentHistory([initialContent]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);
  }, [initialContent, isOpen]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setHasUnsavedChanges(content !== initialContent);
  }, [content, initialContent]);

  // Add content to history when it changes (but not from undo/redo)
  useEffect(() => {
    if (!isUpdatingFromHistory.current && content !== contentHistory[historyIndex]) {
      const newHistory = contentHistory.slice(0, historyIndex + 1);
      newHistory.push(content);
      // Limit history to 50 items to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      setContentHistory(newHistory);
    }
    isUpdatingFromHistory.current = false;
  }, [content]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, historyIndex, contentHistory]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUpdatingFromHistory.current = true;
      setHistoryIndex(historyIndex - 1);
      setContent(contentHistory[historyIndex - 1]);
      toast.success('Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < contentHistory.length - 1) {
      isUpdatingFromHistory.current = true;
      setHistoryIndex(historyIndex + 1);
      setContent(contentHistory[historyIndex + 1]);
      toast.success('Redone');
    }
  };

  const updateContentWithHistory = (newContent: string) => {
    setContent(newContent);
    // The history will be updated automatically by the useEffect
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!onSave) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(content);
      toast.success('Saved successfully!');
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full h-screen flex flex-col bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="flex-shrink-0 px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                          {title}
                        </Dialog.Title>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {wordCount} {wordCount === 1 ? 'word' : 'words'}
                          </p>
                          {hasUnsavedChanges && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
                              Unsaved changes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Undo/Redo buttons */}
                      <div className="flex items-center gap-1 mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                        <button
                          onClick={handleUndo}
                          disabled={historyIndex <= 0}
                          title={`Undo (${navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'})`}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Undo2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={handleRedo}
                          disabled={historyIndex >= contentHistory.length - 1}
                          title={`Redo (${navigator.platform.includes('Mac') ? '⌘⇧Z' : 'Ctrl+Shift+Z'})`}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Redo2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        {contentHistory.length > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {historyIndex + 1}/{contentHistory.length}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onSave && (
                        <button
                          onClick={handleSave}
                          disabled={isSaving || !hasUnsavedChanges}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Split-screen Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Editor (Left - 60%) */}
                  <div className="w-[60%] flex flex-col border-r border-gray-200 dark:border-gray-700">
                    <div className="flex-1 overflow-y-auto p-8">
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full min-h-[600px] p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none font-sans text-base leading-relaxed"
                        placeholder="Start writing or paste your content here..."
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* AI Chat (Right - 40%) */}
                  <div className="w-[40%] flex flex-col">
                    <AIChat
                      documentContent={content}
                      documentType={documentType}
                      onApplyText={(text) => {
                        updateContentWithHistory(text);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

