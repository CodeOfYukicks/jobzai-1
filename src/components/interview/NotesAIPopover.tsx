import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Minimize2,
  Maximize2,
  Briefcase,
  MessageCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { toast } from '@/contexts/ToastContext';
import { rewriteTextWithAI } from '../../lib/emailTemplates';

interface NotesAIPopoverProps {
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
  onRewrite: (text: string) => void;
}

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  tone: string;
  description: string;
}

const aiActions: AIAction[] = [
  {
    id: 'improve',
    label: 'Improve',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    tone: 'professional',
    description: '',
  },
  {
    id: 'shorten',
    label: 'Shorten',
    icon: <Minimize2 className="w-3.5 h-3.5" />,
    tone: 'concise',
    description: '',
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: <Maximize2 className="w-3.5 h-3.5" />,
    tone: 'enthusiastic',
    description: '',
  },
  {
    id: 'formal',
    label: 'Professional',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    tone: 'formal',
    description: '',
  },
  {
    id: 'casual',
    label: 'Casual',
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    tone: 'friendly',
    description: '',
  },
  {
    id: 'grammar',
    label: 'Fix Grammar',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    tone: 'correct',
    description: '',
  },
];

export default function NotesAIPopover({
  position,
  selectedText,
  onClose,
  onRewrite,
}: NotesAIPopoverProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    // Adjust position to ensure popover stays within viewport
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        newX = viewportWidth - rect.width - 20;
      }
      if (newX < 10) {
        newX = 10;
      }

      // Adjust vertical position (show below if not enough space above)
      if (newY < rect.height + 20) {
        newY = position.y + 40; // Show below selection
      }

      if (newX !== position.x || newY !== position.y) {
        setAdjustedPosition({ x: newX, y: newY });
      }
    }
  }, [position]);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = async (action: AIAction) => {
    setProcessing(action.id);

    try {
      // Show loading toast
      const loadingToast = toast.loading(`${action.label}ing text...`);

      // Call AI service
      const rewrittenText = await rewriteTextWithAI({
        text: selectedText,
        tone: action.tone,
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success
      toast.success(`Text ${action.label.toLowerCase()}ed!`);

      // Apply rewritten text
      onRewrite(rewrittenText);
    } catch (error) {
      console.error('Error rewriting text:', error);
      toast.error('Failed to rewrite text. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          transform: 'translateX(-50%) translateY(-100%)',
          zIndex: 9999,
        }}
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden w-[240px]"
      >
        {/* Simple Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold">AI Enhance</span>
          </div>
        </div>

        {/* Single Column Actions */}
        <div className="p-2">
          {aiActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={processing !== null}
              className={[
                'group w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-150',
                processing === action.id
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                  : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={[
                    'transition-colors',
                    processing === action.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400',
                  ].join(' ')}
                >
                  {processing === action.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    action.icon
                  )}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </div>
              <ChevronRight
                className={[
                  'w-3.5 h-3.5 transition-all duration-150',
                  processing === action.id
                    ? 'text-purple-600 dark:text-purple-400 opacity-100'
                    : 'text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5',
                ].join(' ')}
              />
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

