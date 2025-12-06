import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, MessageSquare, Sparkles, X } from 'lucide-react';
import { rewriteTextWithAI } from '../lib/emailTemplates';
import { toast } from '@/contexts/ToastContext';

interface TextHighlightPopoverProps {
  position: { x: number, y: number } | null;
  selectedText: string;
  onClose: () => void;
  onRewrite: (text: string, tone: string) => void;
}

const toneOptions = [
  { id: 'formal', label: 'Formal', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: 'friendly', label: 'Friendly', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: 'persuasive', label: 'Persuasive', icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: 'concise', label: 'Concise', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'enthusiastic', label: 'Enthusiastic', icon: <Sparkles className="h-3.5 w-3.5" /> },
];

export default function TextHighlightPopover({ 
  position, 
  selectedText, 
  onClose,
  onRewrite
}: TextHighlightPopoverProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicks outside the popover
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleRewrite = async (toneId: string) => {
    setIsProcessing(toneId);
    
    try {
      // Call the AI service to rewrite the text
      const rewrittenText = await rewriteTextWithAI({
        text: selectedText,
        tone: toneId
      });
      
      onRewrite(rewrittenText, toneId);
    } catch (error) {
      console.error('Error rewriting text:', error);
      toast.error('Failed to rewrite text. Please try again.');
    } finally {
      setIsProcessing(null);
      onClose();
    }
  };

  if (!position) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        style={{ 
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          transform: 'translateX(-50%)',
        }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-64 max-w-[calc(100vw-40px)]"
      >
        <div className="p-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            <span>AI Rewrite</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        
        <div className="p-1.5">
          {toneOptions.map((tone) => (
            <button
              key={tone.id}
              onClick={() => handleRewrite(tone.id)}
              disabled={isProcessing !== null}
              className={`w-full text-left px-3 py-1.5 rounded-md flex items-center space-x-2
                hover:bg-purple-50 dark:hover:bg-purple-900/20
                ${isProcessing === tone.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                text-sm text-gray-700 dark:text-gray-300
                disabled:opacity-50 disabled:cursor-wait
                transition-colors duration-150
              `}
            >
              <div className={`
                flex-shrink-0 w-5 h-5 flex items-center justify-center
                ${isProcessing === tone.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}
              `}>
                {isProcessing === tone.id ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  tone.icon
                )}
              </div>
              <span>{tone.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 