import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Save, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedEmail } from '../../types/job';
import NotionEditor from '../notion-editor/NotionEditor';
import {
  convertTextToTiptapContent,
  convertTiptapToText,
  TiptapDocument,
} from '../../lib/textToTiptap';

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
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    const plainText = convertTiptapToText(tiptapContent);

    if (!plainText.trim()) {
      toast.error('No content to save');
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
      toast.success('Saved as note!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
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

  return (
    <div className="min-h-[500px] flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getToolEmoji()}</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {toolName}
          </h2>
          {hasChanges && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved</span>
            </span>
          )}
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Notion-like Editor */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto px-6 py-6"
        >
          {/* Document Header */}
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  AI Generated {toolName}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Edit using the rich text editor below
                </p>
              </div>
            </div>
          </div>

          {/* NotionEditor */}
          <div className="min-h-[300px] bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <NotionEditor
              content={tiptapContent}
              onChange={handleEditorChange}
              placeholder="Start editing your content..."
              editable={true}
              autofocus={false}
              className="min-h-[280px]"
            />
          </div>

          {/* Helpful tip */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
            <span className="text-purple-500 mt-0.5">💡</span>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              <strong>Tip:</strong> Type <code className="px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30">/</code> to access formatting commands like headings, lists, and quotes.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
    </div>
  );
};
