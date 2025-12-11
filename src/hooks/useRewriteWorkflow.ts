import { useState, useCallback, useRef } from 'react';
import { rewriteTextWithAI } from '../lib/emailTemplates';
import { notify } from '../lib/notify';
import { ActionType } from '../components/assistant/RewritePreviewModal';

interface AIAction {
  id: string;
  label: string;
  tone: string;
}

interface RewriteHistoryItem {
  id: string;
  originalText: string;
  rewrittenText: string;
  actionType: ActionType;
  timestamp: Date;
}

interface UseRewriteWorkflowOptions {
  onApply?: (text: string) => void;
  maxHistorySize?: number;
}

export interface UseRewriteWorkflowReturn {
  // State
  isPreviewOpen: boolean;
  isProcessing: boolean;
  isApplying: boolean;
  originalText: string;
  rewrittenText: string;
  actionType: ActionType | null;
  error: string | null;
  
  // Actions
  startRewrite: (text: string, action: AIAction) => Promise<void>;
  acceptRewrite: () => Promise<void>;
  rejectRewrite: () => void;
  closePreview: () => void;
  editRewrite: (text: string) => void;
  
  // History
  rewriteHistory: RewriteHistoryItem[];
  undoLastRewrite: () => void;
  canUndo: boolean;
}

const actionTypeMap: Record<string, ActionType> = {
  improve: 'improve',
  shorten: 'shorten',
  expand: 'expand',
  formal: 'formal',
  casual: 'casual',
  grammar: 'grammar',
};

export function useRewriteWorkflow({
  onApply,
  maxHistorySize = 10,
}: UseRewriteWorkflowOptions = {}): UseRewriteWorkflowReturn {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewriteHistory, setRewriteHistory] = useState<RewriteHistoryItem[]>([]);
  
  // Ref to store the callback that will apply the text
  const applyCallbackRef = useRef<((text: string) => void) | undefined>(onApply);
  
  // Update callback ref when it changes
  applyCallbackRef.current = onApply;

  const startRewrite = useCallback(async (text: string, action: AIAction) => {
    setIsProcessing(true);
    setError(null);
    setOriginalText(text);
    
    // Map action ID to ActionType
    const mappedActionType = actionTypeMap[action.id] || 'improve';
    setActionType(mappedActionType);

    try {
      // Call AI service
      const rewritten = await rewriteTextWithAI({
        text,
        tone: action.tone,
      });

      setRewrittenText(rewritten);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Error rewriting text:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to rewrite text';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const acceptRewrite = useCallback(async () => {
    setIsApplying(true);
    
    try {
      // Add to history
      if (actionType) {
        const historyItem: RewriteHistoryItem = {
          id: `rewrite_${Date.now()}`,
          originalText,
          rewrittenText,
          actionType,
          timestamp: new Date(),
        };
        
        setRewriteHistory(prev => {
          const newHistory = [historyItem, ...prev];
          return newHistory.slice(0, maxHistorySize);
        });
      }
      
      // Apply the rewrite using the callback
      if (applyCallbackRef.current) {
        applyCallbackRef.current(rewrittenText);
      }
      
      // Show success notification
      notify.success('Text updated successfully!');
      
      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Close preview
      setIsPreviewOpen(false);
      
      // Reset state
      setOriginalText('');
      setRewrittenText('');
      setActionType(null);
    } catch (err) {
      console.error('Error applying rewrite:', err);
      notify.error('Failed to apply changes');
    } finally {
      setIsApplying(false);
    }
  }, [originalText, rewrittenText, actionType, maxHistorySize]);

  const rejectRewrite = useCallback(() => {
    setIsPreviewOpen(false);
    setOriginalText('');
    setRewrittenText('');
    setActionType(null);
    setError(null);
  }, []);

  const closePreview = useCallback(() => {
    if (!isApplying) {
      rejectRewrite();
    }
  }, [isApplying, rejectRewrite]);

  const editRewrite = useCallback((text: string) => {
    setRewrittenText(text);
  }, []);

  const undoLastRewrite = useCallback(() => {
    if (rewriteHistory.length > 0) {
      const lastRewrite = rewriteHistory[0];
      
      // Apply the original text back
      if (applyCallbackRef.current) {
        applyCallbackRef.current(lastRewrite.originalText);
      }
      
      // Remove from history
      setRewriteHistory(prev => prev.slice(1));
      
      notify.success('Changes undone');
    }
  }, [rewriteHistory]);

  return {
    // State
    isPreviewOpen,
    isProcessing,
    isApplying,
    originalText,
    rewrittenText,
    actionType,
    error,
    
    // Actions
    startRewrite,
    acceptRewrite,
    rejectRewrite,
    closePreview,
    editRewrite,
    
    // History
    rewriteHistory,
    undoLastRewrite,
    canUndo: rewriteHistory.length > 0,
  };
}

