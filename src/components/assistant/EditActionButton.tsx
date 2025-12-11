import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Plus, RefreshCw, Eye } from 'lucide-react';
import RewritePreviewModal from './RewritePreviewModal';
import { useAssistant } from '../../contexts/AssistantContext';

interface EditActionButtonProps {
  action: 'insert' | 'replace';
  content: string;
  onApply: (content: string) => Promise<void>;
}

export default function EditActionButton({ action, content, onApply }: EditActionButtonProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { pageData } = useAssistant();
  
  // Try to get current note content from pageData
  const currentNoteContent = pageData?.currentNote?.content || '';

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleDirectApply = async () => {
    if (isApplying || isApplied) return;

    setIsApplying(true);
    try {
      await onApply(content);
      setIsApplied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsApplied(false);
      }, 2000);
    } catch (error) {
      console.error('Error applying edit:', error);
      setIsApplying(false);
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleAcceptFromPreview = async () => {
    setIsApplying(true);
    try {
      await onApply(content);
      setIsApplied(true);
      setShowPreview(false);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsApplied(false);
      }, 2000);
    } catch (error) {
      console.error('Error applying edit:', error);
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleRejectPreview = () => {
    setShowPreview(false);
  };

  const Icon = action === 'insert' ? Plus : RefreshCw;
  const label = action === 'insert' ? 'Insert' : 'Replace';
  const description = action === 'insert' 
    ? 'Add this content to your note' 
    : 'Replace your note with this content';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/15 border border-indigo-200/60 dark:border-indigo-500/20"
      >
        {/* Preview of content */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-2">
            Suggested {action === 'insert' ? 'Addition' : 'Replacement'}
          </p>
          <div className="max-h-32 overflow-y-auto p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
              {content.substring(0, 300)}{content.length > 300 ? '...' : ''}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Preview button */}
          {currentNoteContent && action === 'replace' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePreview}
              disabled={isApplying || isApplied}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 
                flex items-center justify-center gap-2
                bg-white dark:bg-[#2d2d2e] 
                text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-white/10
                hover:bg-gray-50 dark:hover:bg-[#3d3d3e]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </motion.button>
          )}
          
          {/* Apply button */}
          <motion.button
            whileHover={{ scale: isApplied ? 1 : 1.02 }}
            whileTap={{ scale: isApplied ? 1 : 0.98 }}
            onClick={handleDirectApply}
            disabled={isApplying || isApplied}
            className={`${currentNoteContent && action === 'replace' ? 'flex-1' : 'w-full'} px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              isApplied
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title={description}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying...</span>
              </>
            ) : isApplied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Applied!</span>
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-center text-indigo-600 dark:text-indigo-400">
          {description}
        </p>
      </motion.div>
      
      {/* Preview Modal */}
      {showPreview && (
        <RewritePreviewModal
          isOpen={showPreview}
          onClose={handleRejectPreview}
          originalText={currentNoteContent}
          rewrittenText={content}
          actionType={action === 'insert' ? 'improve' : 'improve'} // Default to improve
          onAccept={handleAcceptFromPreview}
          onReject={handleRejectPreview}
        />
      )}
    </>
  );
}

