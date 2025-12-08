import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Wand2, MessageSquare, Check } from 'lucide-react';
import { ChatMessage } from '../../types/job';
import { sendChatMessage, quickActions, findSection, replaceSection } from '../../lib/aiChatAssistant';
import { toast } from '@/contexts/ToastContext';

interface AIChatProps {
  documentContent: string;
  documentType: 'cover_letter' | 'follow_up';
  onApplyText?: (text: string) => void;
}

interface MessageMetadata {
  isPartialChange?: boolean;
  targetSection?: string;
}

export const AIChat = ({ documentContent, documentType, onApplyText }: AIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI writing assistant. I can see your ${documentType === 'cover_letter' ? 'cover letter' : 'follow-up email'} and help you improve it. Ask me anything or use the quick actions below!`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<number>>(new Set());
  const [messageMetadata, setMessageMetadata] = useState<Map<number, MessageMetadata>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if message content is substantial enough to be applied as document text
  const isApplicableContent = (content: string): boolean => {
    // Must be at least 100 characters and contain multiple sentences or paragraphs
    const trimmed = content.trim();
    return trimmed.length >= 100 && (
      trimmed.split('\n').length > 2 || 
      trimmed.split('.').length > 3
    );
  };

  const handleApplyToEditor = (content: string, messageId: number) => {
    if (!onApplyText) return;
    
    const metadata = messageMetadata.get(messageId);
    let finalContent = content;
    
    // If this is a partial change, perform smart replacement
    if (metadata?.isPartialChange && metadata?.targetSection) {
      const sectionType = metadata.targetSection as 'last_paragraph' | 'first_paragraph' | 'opening' | 'closing' | 'middle' | 'specific_section';
      
      console.log('Attempting partial replacement:', {
        sectionType,
        contentLength: content.length,
        documentLength: documentContent.length
      });
      
      const section = findSection(documentContent, sectionType);
      
      if (section) {
        console.log('Found section:', {
          start: section.start,
          end: section.end,
          originalText: section.text.substring(0, 50) + '...'
        });
        
        // Replace only the target section
        finalContent = replaceSection(documentContent, content, section);
        
        console.log('After replacement, length:', finalContent.length);
        
        const sectionName = metadata.targetSection.replace(/_/g, ' ');
        toast.success(`Replaced ${sectionName} in editor!`);
      } else {
        console.warn('Section not found, using full replacement');
        // If section not found, fall back to full replacement
        finalContent = content;
        toast.info('Section not found, applied as full replacement');
      }
    } else {
      // Full document replacement
      finalContent = content;
      toast.success('Applied to editor!');
    }
    
    onApplyText(finalContent);
    setAppliedMessageIds(prev => new Set([...prev, messageId]));
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await sendChatMessage({
        message: textToSend,
        documentContent,
        documentType,
        chatHistory: messages,
      });

      if (response.error) {
        toast.error(response.errorMessage || 'Failed to get AI response');
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Store metadata for smart replacement
      if (response.isPartialChange || response.targetSection) {
        setMessageMetadata(prev => new Map(prev).set(assistantMessage.timestamp, {
          isPartialChange: response.isPartialChange,
          targetSection: response.targetSection,
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: keyof typeof quickActions) => {
    const actionMessage = quickActions[action](documentContent);
    handleSend(actionMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#242325]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ask me anything about your {documentType === 'cover_letter' ? 'cover letter' : 'email'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-[#2b2a2c] border-b border-gray-200 dark:border-[#3d3c3e]">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('improveTone')}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Improve Tone
          </button>
          <button
            onClick={() => handleQuickAction('makeMoreConcise')}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Make Concise
          </button>
          <button
            onClick={() => handleQuickAction('fixGrammar')}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Fix Grammar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const canApply = message.role === 'assistant' && 
                            index > 0 && 
                            isApplicableContent(message.content) &&
                            onApplyText;
            const isApplied = appliedMessageIds.has(message.timestamp);
            
            return (
              <motion.div
                key={`${message.timestamp}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                        : 'bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#3d3c3e] shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Apply to Editor Button */}
                  {canApply && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => handleApplyToEditor(message.content, message.timestamp)}
                      disabled={isApplied}
                      className={`self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isApplied
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 cursor-default'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Editor</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply to Editor</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-[#2b2a2c] border-t border-gray-200 dark:border-[#3d3c3e]">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything or describe what you'd like to change..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none text-sm"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '44px';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

