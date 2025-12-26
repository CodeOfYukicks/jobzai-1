import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check, Save, RefreshCw, FileText, Maximize2 } from 'lucide-react';
import { notify } from '@/lib/notify';
import { GeneratedEmail } from '../../types/job';
import NotionEditor from '../notion-editor/NotionEditor';
import {
  convertTextToTiptapContent,
  convertTiptapToText,
  TiptapDocument,
} from '../../lib/textToTiptap';
import { FocusModeView } from './FocusModeView';

interface GeneratedContentViewProps {
  content: string;
  toolType: 'cover_letter' | 'follow_up';
  toolName: string;
  onBack: () => void;
  onSave?: (email: GeneratedEmail, noteId?: string) => Promise<void>;
  onRegenerate?: () => void;
  onContentUpdate?: (content: string) => void;
}

export const GeneratedContentView = ({
  content,
  toolType,
  toolName,
  onBack,
  onSave,
  onRegenerate,
  onContentUpdate,
}: GeneratedContentViewProps) => {
  // Convert initial plain text to Tiptap format
  const [tiptapContent, setTiptapContent] = useState<TiptapDocument>(() =>
    convertTextToTiptapContent(content)
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Update content when prop changes
  useEffect(() => {
    const newTiptapContent = convertTextToTiptapContent(content);
    setTiptapContent(newTiptapContent);
    setHasChanges(false);
  }, [content]);

  const handleEditorChange = useCallback((newContent: TiptapDocument) => {
    setTiptapContent(newContent);
    setHasChanges(true);

    // Notify parent of content changes
    const plainText = convertTiptapToText(newContent);
    onContentUpdate?.(plainText);
  }, [onContentUpdate]);

  const handleCopy = async () => {
    const plainText = convertTiptapToText(tiptapContent);
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

    const plainText = convertTiptapToText(tiptapContent);

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
        // noteId will be added by the parent component after creating the NotionDocument
      };

      await onSave(newEmail);
      notify.success('Saved as note!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const getToolEmoji = () => {
    switch (toolType) {
      case 'cover_letter':
        return '✉️';
      case 'follow_up':
        return '📧';
      default:
        return '📝';
    }
  };

  // Focus Mode View
  if (isFocusMode) {
    return (
      <FocusModeView
        content={tiptapContent}
        toolName={toolName}
        toolType={toolType}
        onClose={() => setIsFocusMode(false)}
        onSave={onSave}
        onRegenerate={onRegenerate}
        onContentChange={handleEditorChange}
      />
    );
  }

  return (
    <div className="min-h-[500px] md:min-h-[500px] flex flex-col bg-white dark:bg-[#1a1a1a] md:dark:bg-[#242325]">
      {/* Mobile Header - Minimal */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2b2a2c]">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2b2a2c]"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">
          {toolName}
        </h2>
        {hasChanges && (
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-[#3d3c3e] bg-white dark:bg-[#242325]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {toolName}
          </h2>
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved</span>
            </span>
          )}
        </div>
        <div className="w-16" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Content - Clean */}
        <div className="md:hidden px-4 py-4 pb-32">
          <div className="bg-white dark:bg-[#2b2a2c] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]">
            <NotionEditor
              content={tiptapContent}
              onChange={handleEditorChange}
              placeholder="Start editing your content..."
              editable={true}
              autofocus={false}
              className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-p:text-sm prose-p:leading-relaxed"
            />
          </div>
        </div>

        {/* Desktop Content - Premium Layout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden md:block max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-12"
        >
          {/* Document Header - Desktop only */}
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-[#3d3c3e]">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/30">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  AI Generated {toolName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Edit and refine your content below
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Editor */}
          <div className="bg-white dark:bg-[#242325] rounded-2xl p-6 border border-gray-100/50 dark:border-[#3d3c3e]/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <NotionEditor
              content={tiptapContent}
              onChange={handleEditorChange}
              placeholder="Start editing your content..."
              editable={true}
              autofocus={false}
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-100"
            />
          </div>

          {/* Helpful tip - Desktop only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30"
          >
            <span className="text-purple-500 dark:text-purple-400 mt-0.5 text-base">💡</span>
            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              <strong className="font-semibold">Tip:</strong> Type <code className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-xs">/</code> to access formatting commands like headings, lists, and quotes.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Action Bar - Sticky Bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-[60] bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#2b2a2c] px-4 py-3">
        <div className="flex gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] text-sm font-medium text-gray-700 dark:text-gray-300 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Redo</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform ${isCopied
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300'
              }`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#635BFF] text-sm font-medium text-white active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Action Bar */}
      <div className="hidden md:block border-t border-gray-100/50 dark:border-[#3d3c3e]/50 px-8 sm:px-12 lg:px-16 xl:px-20 py-6 bg-white/90 dark:bg-[#242325]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onRegenerate && (
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRegenerate}
                className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 backdrop-blur-lg bg-white/80 dark:bg-[#2b2a2c]/80 border border-gray-200/50 dark:border-[#3d3c3e]/50 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-gray-300/50 dark:hover:border-gray-600/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50"
              >
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span>Regenerate</span>
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFocusMode(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 backdrop-blur-lg bg-white/80 dark:bg-[#2b2a2c]/80 border border-gray-200/50 dark:border-[#3d3c3e]/50 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-gray-300/50 dark:hover:border-gray-600/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50"
              title="Enter focus mode for distraction-free editing"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Focus Mode</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: isCopied ? 1 : 1.02, y: isCopied ? 0 : -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 backdrop-blur-lg border ${isCopied
                ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50 text-green-700 dark:text-green-400 shadow-lg shadow-green-200/50 dark:shadow-green-900/50'
                : 'bg-white/80 dark:bg-[#2b2a2c]/80 border-gray-200/50 dark:border-[#3d3c3e]/50 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-gray-300/50 dark:hover:border-gray-600/50 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50'
                }`}
            >
              {isCopied ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </motion.button>
            {onSave && (
              <motion.button
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#635BFF] to-[#7c75ff] hover:from-[#5a52e6] hover:to-[#6d65e6] rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#635BFF]/30 hover:shadow-xl hover:shadow-[#635BFF]/40 disabled:hover:shadow-lg disabled:hover:shadow-[#635BFF]/30"
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
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
