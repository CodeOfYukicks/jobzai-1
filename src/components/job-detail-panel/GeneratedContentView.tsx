import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedEmail } from '../../types/job';

interface GeneratedContentViewProps {
  content: string;
  toolType: 'cover_letter' | 'follow_up';
  toolName: string;
  onBack: () => void;
  onSave?: (email: GeneratedEmail) => Promise<void>;
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
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update display content when prop changes (but not when editing)
  useEffect(() => {
    if (!editMode && content !== displayContent) {
      setDisplayContent(content);
      setEditedContent(content);
    }
  }, [content, editMode]);

  const handleCopy = async () => {
    const contentToCopy = editMode ? editedContent : displayContent;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    const contentToSave = editMode ? editedContent : displayContent;
    
    if (!contentToSave) {
      toast.error('No content to save');
      return;
    }

    setIsSaving(true);
    
    try {
      const newEmail: GeneratedEmail = {
        id: crypto.randomUUID(),
        type: toolType,
        content: contentToSave,
        createdAt: new Date().toISOString(),
      };

      await onSave(newEmail);
      toast.success('Saved to history!');
      // Update displayed content with edited version
      if (editMode) {
        setDisplayContent(editedContent);
        onContentUpdate?.(editedContent);
      }
      setEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
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
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {toolName}
        </h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {editMode ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[400px] p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none leading-relaxed"
              placeholder="Edit your content..."
            />
            <div className="flex items-center gap-3">
              <button
              onClick={() => {
                setEditMode(false);
                setEditedContent(displayContent);
              }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-sans leading-relaxed bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                {displayContent}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Bar */}
      {!editMode && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                >
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

