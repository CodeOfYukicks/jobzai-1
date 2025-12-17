import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Plus, RefreshCw, Eye, Sparkles } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="mt-4 relative group"
      >
        {/* Main Card */}
        <div className={`
          relative overflow-hidden rounded-xl
          bg-white dark:bg-[#1e1e1e]
          border border-[#e8e8e8] dark:border-[#303030]
          transition-all duration-300 ease-out
          ${isHovered ? 'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-[#d0d0d0] dark:border-[#404040]' : 'shadow-sm'}
        `}>
          
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9b87f5] to-transparent opacity-60" />
          
          {/* Content */}
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[#f7f6f3] dark:bg-[#2a2a2a]">
                <Sparkles className="w-3 h-3 text-[#9b87f5]" />
              </div>
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#9b9a97] dark:text-[#6b6b6b]">
                {action === 'insert' ? 'Suggested Addition' : 'Suggested Replacement'}
              </span>
            </div>

            {/* Content Preview */}
            <div className="mb-4">
              <div className="relative">
                <div className={`
                  max-h-28 overflow-y-auto
                  p-3 rounded-lg
                  bg-[#fbfbfa] dark:bg-[#252525]
                  border border-[#eeeeec] dark:border-[#333333]
                  transition-colors duration-200
                `}>
                  <p className="text-[13px] leading-relaxed text-[#37352f] dark:text-[#e3e3e3] whitespace-pre-wrap font-normal">
                    {content.substring(0, 350)}{content.length > 350 ? '...' : ''}
                  </p>
                </div>
                
                {/* Fade overlay for long content */}
                {content.length > 200 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#fbfbfa] dark:from-[#252525] to-transparent pointer-events-none rounded-b-lg" />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Preview button */}
              <AnimatePresence>
                {currentNoteContent && action === 'replace' && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePreview}
                    disabled={isApplying || isApplied}
                    className={`
                      flex-1 px-4 py-2.5 rounded-lg
                      font-medium text-[13px]
                      flex items-center justify-center gap-2
                      bg-[#f7f6f3] dark:bg-[#2a2a2a]
                      text-[#37352f] dark:text-[#e3e3e3]
                      border border-[#e8e8e8] dark:border-[#363636]
                      hover:bg-[#eeeeec] dark:hover:bg-[#333333]
                      hover:border-[#d8d8d8] dark:hover:border-[#404040]
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <Eye className="w-4 h-4 opacity-70" />
                    <span>Preview</span>
                  </motion.button>
                )}
              </AnimatePresence>
              
              {/* Apply/Replace button */}
              <motion.button
                whileHover={{ scale: isApplied ? 1 : 1.01 }}
                whileTap={{ scale: isApplied ? 1 : 0.98 }}
                onClick={handleDirectApply}
                disabled={isApplying || isApplied}
                className={`
                  ${currentNoteContent && action === 'replace' ? 'flex-1' : 'w-full'} 
                  px-4 py-2.5 rounded-lg
                  font-medium text-[13px]
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${isApplied
                    ? 'bg-[#2ecc71] text-white cursor-default'
                    : `
                      bg-[#9b87f5] hover:bg-[#8b77e5]
                      text-white
                      shadow-sm hover:shadow-md
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `
                  }
                `}
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

            {/* Subtle helper text */}
            <p className="mt-3 text-[11px] text-center text-[#9b9a97] dark:text-[#6b6b6b]">
              {description}
            </p>
          </div>
        </div>
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
