import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2,
  ChevronDown,
  Save,
  Mail,
  Linkedin,
  Phone,
} from 'lucide-react';
import { OutreachMessage, OutreachChannel, OUTREACH_CHANNEL_CONFIG } from '../../types/job';
import { OutreachChannelSelector } from './OutreachChannelBadge';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: Omit<OutreachMessage, 'id'>) => void;
  contactName: string;
  companyName: string;
  defaultChannel?: OutreachChannel;
  replyTo?: OutreachMessage;
}

export function MessageComposer({
  isOpen,
  onClose,
  onSend,
  contactName,
  companyName,
  defaultChannel = 'email',
  replyTo,
}: MessageComposerProps) {
  const [channel, setChannel] = useState<OutreachChannel>(defaultChannel);
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject || ''}` : '');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setContent('');
      setSaveAsDraft(false);
    }
  }, [isOpen]);
  
  const handleSend = () => {
    if (!content.trim()) return;
    
    const message: Omit<OutreachMessage, 'id'> = {
      type: 'sent',
      channel,
      subject: channel === 'email' ? subject : undefined,
      content: content.trim(),
      sentAt: new Date().toISOString(),
      status: saveAsDraft ? 'draft' : 'sent',
    };
    
    onSend(message);
    onClose();
  };
  
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    // Simulate AI generation - in real implementation, call your AI service
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const templates: Record<OutreachChannel, string> = {
      email: `Hi ${contactName},\n\nI hope this message finds you well. I came across your profile and was impressed by your work at ${companyName}.\n\nI'd love to connect and learn more about your experience in the industry. Would you be open to a brief chat sometime next week?\n\nBest regards`,
      linkedin: `Hi ${contactName}! 👋\n\nI noticed we share some common interests in the industry and I'd love to connect. Your work at ${companyName} caught my attention.\n\nWould you be open to a quick chat?`,
      phone: `Call notes for ${contactName} at ${companyName}:\n\n- Introduction and background\n- Discuss mutual interests\n- Explore potential opportunities\n- Next steps`,
      in_person: `Meeting with ${contactName} from ${companyName}:\n\n- Coffee chat / networking\n- Discuss industry trends\n- Explore collaboration opportunities`,
      referral: `Hi ${contactName},\n\nI was referred to you by [mutual connection]. They spoke highly of your expertise at ${companyName}.\n\nI'd love to connect and learn more about your experience.`,
      event: `Met ${contactName} at [event name].\n\nKey discussion points:\n- Shared interests\n- Industry insights\n- Follow-up actions`,
      cold_call: `Cold call to ${contactName} at ${companyName}:\n\n- Introduction pitch\n- Value proposition\n- Handle objections\n- Schedule follow-up`,
      twitter: `Hey ${contactName}! 👋 Loved your recent post about [topic]. Would love to connect and discuss more!`,
      other: `Note for ${contactName} at ${companyName}:\n\n[Add your message here]`,
    };
    
    setContent(templates[channel]);
    if (channel === 'email' && !subject) {
      setSubject(`Quick introduction - Networking opportunity`);
    }
    setIsGenerating(false);
  };
  
  const showSubject = channel === 'email';
  const config = OUTREACH_CHANNEL_CONFIG[channel];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#2b2a2c] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3d3c3e] flex items-center justify-between bg-gradient-to-r from-[#8B5CF6]/5 to-[#EC4899]/5">
              <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {replyTo ? 'Reply' : 'New Message'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To: {contactName} @ {companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Channel selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Channel
                </label>
                <OutreachChannelSelector
                  value={channel}
                  onChange={setChannel}
                  channels={['email', 'linkedin', 'phone', 'in_person', 'other']}
                />
              </div>
              
              {/* Subject (for email only) */}
              {showSubject && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all"
                  />
                </div>
              )}
              
              {/* Message content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B5CF6] hover:text-[#7C3AED] transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Write your ${config.label.toLowerCase()} message...`}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all resize-none"
                />
              </div>
              
              {/* Save as draft option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsDraft}
                  onChange={(e) => setSaveAsDraft(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-[#3d3c3e] text-[#8B5CF6] focus:ring-[#8B5CF6]/20"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Save as draft (don't mark as sent)
                </span>
              </label>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#3d3c3e] flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={!content.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg shadow-md shadow-[#8B5CF6]/25 hover:shadow-lg hover:shadow-[#8B5CF6]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                {saveAsDraft ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Log Message
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MessageComposer;

