import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Bot, Clock as ClockIcon, Loader2, ChevronDown, HelpCircle, X } from 'lucide-react';
import { ChatMessage, Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';

interface ChatTabProps {
  application: JobApplication;
  interview: Interview;
  chatMessages: ChatMessage[];
  message: string;
  isSending: boolean;
  typingMessages: Record<number, string>;
  isUserNearBottom: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  currentUser: any;
  applicationId: string;
  setMessage: (text: string) => void;
  sendMessage: () => Promise<void>;
  saveChatHistory: (messages: ChatMessage[]) => Promise<void>;
  setIsUserNearBottom: (value: boolean) => void;
}

const ChatTab = memo(function ChatTab({
  application,
  interview,
  chatMessages,
  message,
  isSending,
  typingMessages,
  isUserNearBottom,
  chatEndRef,
  chatContainerRef,
  currentUser,
  applicationId,
  setMessage,
  sendMessage,
  saveChatHistory,
  setIsUserNearBottom,
}: ChatTabProps) {
  const suggestions = interview?.preparation?.suggestedQuestions && interview.preparation.suggestedQuestions.length > 0
    ? [
        "How should I introduce myself for this role?",
        `What are the most common questions for a ${application?.position || 'this role'}?`,
        "How can I highlight my relevant experience?",
        "Can you help me practice answering behavioral questions?"
      ]
    : [
        "How should I introduce myself?",
        "What are the most common questions for this role?",
        "How can I highlight my relevant experience?",
        "Can you help me practice answering questions?"
      ];

  return (
    <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-200 dark:border-[#3d3c3e] flex flex-col h-[750px] sm:h-[800px] shadow-lg overflow-hidden backdrop-blur-sm">
      {/* Compact Header */}
      <div className="px-5 py-3.5 border-b border-gray-200/60 dark:border-[#3d3c3e]/50 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Interview Trainer
          </h3>
        </div>
        {chatMessages.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Online</span>
          </div>
        )}
      </div>
      
      {/* Chat messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-gradient-to-b from-gray-50/30 via-white to-white dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/20 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent relative"
      >
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(196, 181, 253, 0.5);
            border-radius: 10px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(196, 181, 253, 0.8);
          }
        `}</style>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!isUserNearBottom && chatMessages.length > 2 && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => {
                if (chatEndRef.current) {
                  chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  setIsUserNearBottom(true);
                }
              }}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 mx-auto px-4 py-2 rounded-full bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-xl border border-gray-200/60 dark:border-[#3d3c3e]/50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <ChevronDown className="w-4 h-4" />
              <span>New messages</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center mb-5 shadow-lg">
              <MessageSquare className="w-10 h-10 text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-center max-w-md font-semibold mb-1.5 text-base text-gray-900 dark:text-white">
              Start practicing with your AI trainer
            </p>
            <p className="text-center text-xs max-w-md mb-6 text-gray-500 dark:text-gray-400">
              Get personalized feedback and practice answers
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(suggestion);
                    setTimeout(() => {
                      const input = document.querySelector('textarea[placeholder*="Ask a question"]') as HTMLTextAreaElement;
                      input?.focus();
                    }, 100);
                  }}
                  className="text-xs text-left p-3 border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg hover:border-purple-300/60 dark:hover:border-purple-700/50 hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-all shadow-sm hover:shadow-md backdrop-blur-sm bg-white/50 dark:bg-[#2b2a2c]/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100/80 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium leading-snug">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            if (msg.role === 'assistant' && msg.content === '__thinking__') {
              return (
                <div key={index} className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[70%] sm:max-w-[65%] flex-row">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 shadow-md ring-1 ring-indigo-200/50 dark:ring-indigo-900/50">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 animate-pulse" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 animate-pulse" style={{ animationDelay: '0.6s' }} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-tight">
                          Processing...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            let displayContent = msg.content;
            if (msg.role === 'assistant' && displayContent.includes('<think>')) {
              displayContent = displayContent.replace(/<think>[\s\S]*<\/think>/g, '');
            }
            
            if (msg.role === 'assistant' && msg.content !== '__thinking__') {
              const fullText = displayContent.replace(/<think>[\s\S]*<\/think>/g, '').trim();
              if (typingMessages[index] !== undefined && typingMessages[index].length < fullText.length) {
                displayContent = typingMessages[index];
              } else {
                displayContent = fullText;
              }
            }
            
            return (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  flex items-start gap-3 max-w-[75%] sm:max-w-[70%] 
                  ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
                `}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-1
                    ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 ring-purple-200/50 dark:ring-purple-900/30'
                      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 ring-indigo-200/50 dark:ring-indigo-900/30'}
                  `}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`
                    px-4 py-3 rounded-xl shadow-sm backdrop-blur-sm
                    ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-sm'
                      : 'bg-white/90 dark:bg-[#2b2a2c]/90 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/60 dark:border-[#3d3c3e]/50'}
                  `}>
                    <p className="text-sm leading-6 whitespace-pre-wrap break-words">{displayContent}</p>
                    
                    {msg.role === 'assistant' && 
                     msg.content !== '__thinking__' && 
                     typingMessages[index] !== undefined && 
                     (() => {
                       const fullText = msg.content.replace(/<think>[\s\S]*<\/think>/g, '').trim();
                       const typedText = typingMessages[index] || '';
                       return typedText.length > 0 && typedText.length < fullText.length;
                     })() && (
                      <span className="inline-block w-0.5 h-4 bg-purple-500 dark:bg-purple-400 ml-1 animate-pulse" />
                    )}
                    
                    <div className={`text-[10px] mt-2 flex items-center justify-end gap-1
                      ${msg.role === 'user' ? 'text-purple-200/70' : 'text-gray-400 dark:text-gray-500'}
                    `}>
                      <ClockIcon className="w-3 h-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input area */}
      <div className="px-5 sm:px-6 py-4 border-t border-gray-200/60 dark:border-[#3d3c3e]/50 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl relative">
        <div className="flex gap-3 items-end">
          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask a question or practice an answer..."
              rows={1}
              className="w-full p-4 pr-14 text-sm bg-gray-50/80 dark:bg-[#242325]/50 border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 dark:text-white resize-none min-h-[52px] max-h-[140px] transition-all shadow-sm hover:shadow-md focus:shadow-lg leading-5"
              style={{ 
                height: 'auto',
                overflow: 'hidden'
              }}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              className="absolute right-2.5 bottom-2.5 p-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3" />
            <span>Enter to send • Shift+Enter for new line</span>
          </p>
          {chatMessages.length > 0 && (
            <button
              onClick={async () => {
                if (currentUser && application && interview && applicationId) {
                  try {
                    await saveChatHistory([]);
                  } catch (error) {
                    // Handle error silently or show toast
                  }
                }
              }}
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ChatTab;

