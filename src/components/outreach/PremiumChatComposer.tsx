import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Loader2,
  Wand2,
  MessageSquare,
  Calendar,
  ThumbsUp,
  ArrowRight,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { OutreachMessage } from '../../types/job';
import {
  generateSmartReplies,
  generateDraftReply,
  SmartReply,
  ContactContext,
  UserContext,
  QuickActionType,
  quickActionIntents,
} from '../../lib/aiReplyAssistant';
import { notify } from '@/lib/notify';

interface PremiumChatComposerProps {
  conversationHistory: OutreachMessage[];
  contactContext: ContactContext;
  userContext?: UserContext;
  onSend: (content: string) => Promise<void>;
  isSending?: boolean;
  placeholder?: string;
  language?: 'en' | 'fr';
}

const quickActions: { type: QuickActionType; icon: React.ReactNode; label: string; labelFr: string }[] = [
  { type: 'thank', icon: <ThumbsUp className="w-3.5 h-3.5" />, label: 'Thank', labelFr: 'Remercier' },
  { type: 'follow_up', icon: <ArrowRight className="w-3.5 h-3.5" />, label: 'Follow up', labelFr: 'Relancer' },
  { type: 'schedule', icon: <Calendar className="w-3.5 h-3.5" />, label: 'Schedule', labelFr: 'Planifier' },
  { type: 'question', icon: <HelpCircle className="w-3.5 h-3.5" />, label: 'Ask', labelFr: 'Demander' },
];

export function PremiumChatComposer({
  conversationHistory,
  contactContext,
  userContext,
  onSend,
  isSending = false,
  placeholder,
  language = 'en',
}: PremiumChatComposerProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [smartReplies, setSmartReplies] = useState<SmartReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'friendly' | 'professional' | 'casual' | 'bold'>('professional');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Generate smart replies when AI panel opens
  const handleGenerateSmartReplies = useCallback(async () => {
    if (isLoadingReplies) return;
    
    setIsLoadingReplies(true);
    try {
      const replies = await generateSmartReplies({
        conversationHistory,
        contactContext,
        userContext,
        language,
      });
      setSmartReplies(replies);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      notify.error(language === 'fr' ? 'Erreur lors de la génération' : 'Failed to generate suggestions');
    } finally {
      setIsLoadingReplies(false);
    }
  }, [conversationHistory, contactContext, userContext, language, isLoadingReplies]);

  // Open AI panel and generate suggestions
  const handleOpenAIPanel = useCallback(() => {
    setShowAIPanel(true);
    if (smartReplies.length === 0) {
      handleGenerateSmartReplies();
    }
  }, [smartReplies.length, handleGenerateSmartReplies]);

  // Handle quick action
  const handleQuickAction = async (actionType: QuickActionType) => {
    if (isGeneratingDraft) return;

    setIsGeneratingDraft(true);
    try {
      const intent = quickActionIntents[actionType][language];
      const draft = await generateDraftReply({
        conversationHistory,
        contactContext,
        userContext,
        userIntent: intent,
        tone: selectedTone,
        language,
      });
      setMessage(draft);
      setShowAIPanel(false);
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error generating draft:', error);
      notify.error(language === 'fr' ? 'Erreur lors de la génération' : 'Failed to generate draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Use a smart reply
  const handleUseSmartReply = (reply: SmartReply) => {
    setMessage(reply.text);
    setShowAIPanel(false);
    textareaRef.current?.focus();
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    const content = message.trim();
    setMessage('');
    await onSend(content);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const defaultPlaceholder = language === 'fr'
    ? `Écrire à ${contactContext.contactName}...`
    : `Message ${contactContext.contactName}...`;

  return (
    <div ref={containerRef} className="relative">
      {/* AI Panel - Expandable */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-3 overflow-hidden"
          >
            <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-xl border border-[#8B5CF6]/20 shadow-2xl shadow-[#8B5CF6]/10 overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#EC4899]/20 to-[#8B5CF6]/20 opacity-50 animate-pulse pointer-events-none" style={{ padding: '1px' }} />
              
              {/* Header */}
              <div className="relative px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#8B5CF6] blur-lg opacity-40 pointer-events-none" />
                    <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#EC4899]">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90 tracking-tight">
                      {language === 'fr' ? 'Assistant IA' : 'AI Assistant'}
                    </h4>
                    <p className="text-[10px] text-white/40">
                      {language === 'fr' ? 'Suggestions basées sur la conversation' : 'Context-aware suggestions'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tone Selector */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 font-medium">
                  {language === 'fr' ? 'Ton' : 'Tone'}
                </p>
                <div className="flex gap-2">
                  {(['friendly', 'professional', 'casual', 'bold'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTone === tone
                          ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2.5 font-medium">
                  {language === 'fr' ? 'Actions rapides' : 'Quick Actions'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAction(action.type)}
                      disabled={isGeneratingDraft}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 text-white/70 hover:text-white hover:border-[#8B5CF6]/30 hover:from-[#8B5CF6]/10 hover:to-[#EC4899]/5 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingDraft ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        action.icon
                      )}
                      <span>{language === 'fr' ? action.labelFr : action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Smart Replies */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                    {language === 'fr' ? 'Suggestions' : 'Smart Replies'}
                  </p>
                  <button
                    onClick={handleGenerateSmartReplies}
                    disabled={isLoadingReplies}
                    className="inline-flex items-center gap-1 text-[10px] text-[#8B5CF6] hover:text-[#EC4899] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingReplies ? 'animate-spin' : ''}`} />
                    {language === 'fr' ? 'Régénérer' : 'Refresh'}
                  </button>
                </div>

                {isLoadingReplies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#8B5CF6] blur-xl opacity-30 animate-pulse pointer-events-none" />
                        <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin relative" />
                      </div>
                      <p className="text-xs text-white/40">
                        {language === 'fr' ? 'Analyse de la conversation...' : 'Analyzing conversation...'}
                      </p>
                    </div>
                  </div>
                ) : smartReplies.length > 0 ? (
                  <div className="space-y-2">
                    {smartReplies.map((reply, index) => (
                      <motion.button
                        key={reply.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleUseSmartReply(reply)}
                        className="w-full group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
                        <div className="relative flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#8B5CF6]/30 hover:bg-white/[0.06] transition-all text-left">
                          <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            reply.tone === 'friendly' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : reply.tone === 'professional'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 leading-relaxed group-hover:text-white transition-colors">
                              {reply.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                reply.tone === 'friendly'
                                  ? 'bg-emerald-500/10 text-emerald-400/70'
                                  : reply.tone === 'professional'
                                  ? 'bg-blue-500/10 text-blue-400/70'
                                  : 'bg-amber-500/10 text-amber-400/70'
                              }`}>
                                {reply.tone}
                              </span>
                            </div>
                          </div>
                          <Zap className="w-4 h-4 text-white/20 group-hover:text-[#8B5CF6] transition-colors flex-shrink-0" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-white/40">
                      {language === 'fr' 
                        ? 'Cliquez sur "Régénérer" pour obtenir des suggestions'
                        : 'Click "Refresh" to get suggestions'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Composer */}
      <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.01]' : ''}`}>
        {/* Glow effect on focus */}
        <div 
          className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#8B5CF6] opacity-0 blur-md transition-opacity duration-300 pointer-events-none ${
            isFocused ? 'opacity-30' : ''
          }`} 
        />
        
        {/* Glass container */}
        <div className={`relative rounded-2xl transition-all duration-300 ${
          isFocused 
            ? 'bg-white dark:bg-[#1e1e22] shadow-2xl shadow-[#8B5CF6]/10 border-[#8B5CF6]/30' 
            : 'bg-gray-50/80 dark:bg-[#1e1e22]/80 border-gray-200/50 dark:border-[#3d3c3e]/50'
        } backdrop-blur-xl border overflow-hidden`}>
          
          {/* AI Button - Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#3d3c3e]/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAIPanel}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                showAIPanel
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white shadow-lg shadow-[#8B5CF6]/30'
                  : 'bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 text-[#8B5CF6] hover:from-[#8B5CF6]/20 hover:to-[#EC4899]/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'IA' : 'AI'}</span>
              {showAIPanel ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </motion.button>
            
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#2b2a2c] text-[10px] font-mono">⏎</kbd>
              <span>{language === 'fr' ? 'envoyer' : 'send'}</span>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative px-4 py-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || defaultPlaceholder}
              rows={1}
              className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '150px' }}
            />
          </div>

          {/* Bottom bar with send button */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#3d3c3e]/50 bg-gray-50/50 dark:bg-[#242325]/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {message.length > 0 && (
                  <span className={message.length > 1000 ? 'text-red-400' : ''}>
                    {message.length}/1000
                  </span>
                )}
              </span>
            </div>
            
            {/* Premium Send Button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={!message.trim() || isSending || message.length > 1000}
              className="group relative overflow-hidden"
            >
              {/* Button glow */}
              <div className={`absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none ${
                message.trim() && !isSending ? 'group-hover:opacity-50' : ''
              }`} />
              
              {/* Button content */}
              <div className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                message.trim() && !isSending
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/30'
                  : 'bg-gray-200 dark:bg-[#3d3c3e] text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}>
                {/* Shimmer effect */}
                {isSending && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'fr' ? 'Envoi...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <span>{language === 'fr' ? 'Envoyer' : 'Send'}</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumChatComposer;

