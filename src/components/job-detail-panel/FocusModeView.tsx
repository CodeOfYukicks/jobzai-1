import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Save, RefreshCw } from 'lucide-react';
import { notify } from '@/lib/notify';
import { GeneratedEmail } from '../../types/job';
import NotionEditor from '../notion-editor/NotionEditor';
import {
  convertTiptapToText,
  TiptapDocument,
} from '../../lib/textToTiptap';

interface FocusModeViewProps {
  content: TiptapDocument;
  toolName: string;
  toolType: 'cover_letter' | 'follow_up';
  onClose: () => void;
  onSave?: (email: GeneratedEmail, noteId?: string) => Promise<void>;
  onRegenerate?: () => void;
  onContentChange: (content: TiptapDocument) => void;
}

export const FocusModeView = ({
  content,
  toolName,
  toolType,
  onClose,
  onSave,
  onRegenerate,
  onContentChange,
}: FocusModeViewProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditorChange = useCallback((newContent: TiptapDocument) => {
    onContentChange(newContent);
  }, [onContentChange]);

  // Handle Escape key to close focus mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCopy = async () => {
    const plainText = convertTiptapToText(content);
    try {
      await navigator.clipboard.writeText(plainText);
      setIsCopied(true);
      notify.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      notify.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    const plainText = convertTiptapToText(content);

    if (!plainText.trim()) {
      notify.error('No content to save');
      return;
    }

    setIsSaving(true);

    try {
      const newEmail: GeneratedEmail = {
        id: crypto.randomUUID(),
        type: toolType,
        content: plainText,
        createdAt: new Date().toISOString(),
      };

      await onSave(newEmail);
      notify.success('Saved as note!');
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-gray-900/60 dark:bg-[#1a1a1c]/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 flex flex-col bg-white dark:bg-[#242325] shadow-2xl"
        >
          {/* Header - Minimaliste avec seulement le bouton de fermeture */}
          <div className="flex items-center justify-end px-8 py-4 border-b border-gray-100 dark:border-[#3d3c3e] bg-white/80 dark:bg-[#242325]/80 backdrop-blur-xl">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label="Close focus mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area - Style Notion comme dans ResumeBuilderPage */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#242325]">
            <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 pb-48 pt-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {/* Large Title - Notion style */}
                <div className="mb-8">
                  <h1 className="w-full text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none overflow-hidden leading-tight">
                    {toolName}
                  </h1>
                </div>

                {/* Editor - Style Notion */}
                <NotionEditor
                  content={content}
                  onChange={handleEditorChange}
                  placeholder="Type '/' for commands..."
                  editable={true}
                  autofocus={true}
                />
              </motion.div>
            </div>
          </div>

          {/* Barre d'actions simplifiée */}
          <div className="border-t border-gray-100 dark:border-[#3d3c3e] px-8 py-5 bg-white/80 dark:bg-[#242325]/80 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Copied</span>
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
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save as Note</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

