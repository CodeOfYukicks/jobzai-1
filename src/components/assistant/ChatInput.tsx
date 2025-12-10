import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLocation } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordCreditHistory } from '../../lib/creditHistory';
import { notify } from '../../lib/notify';

interface ChatInputProps {
  placeholder?: string;
}

const CREDIT_COST = 1;

export default function ChatInput({ placeholder = 'Ask me anything...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  
  const { 
    addMessage, 
    updateMessage, 
    isLoading, 
    setIsLoading,
    currentPageContext,
    pendingMessage,
    setPendingMessage,
    pageData,
  } = useAssistant();
  
  const { currentUser, userData } = useAuth();
  const { profile } = useUserProfile();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Process and send a message
  const processSendMessage = useCallback(async (messageContent: string) => {
    const trimmedInput = messageContent.trim();
    if (!trimmedInput || isLoading) return;

    // Check if user has enough credits
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const currentCredits = userDoc.data()?.credits ?? 0;
        const isPremium = userDoc.data()?.plan === 'premium';
        
        // Premium users have unlimited credits
        if (!isPremium && currentCredits < CREDIT_COST) {
          notify.error('Not enough credits. Please upgrade your plan.');
          return;
        }
      } catch (error) {
        console.error('Error checking credits:', error);
        // Continue anyway - don't block the user
      }
    }

    // Clear input
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedInput,
    });

    // Add placeholder for assistant response
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    setIsLoading(true);

    try {
      // Deduct credit before making API call
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const currentCredits = userDoc.data()?.credits ?? 0;
          const isPremium = userDoc.data()?.plan === 'premium';
          
          // Only deduct for non-premium users
          if (!isPremium && currentCredits > 0) {
            const newCredits = currentCredits - CREDIT_COST;
            await updateDoc(userRef, { credits: newCredits });
            await recordCreditHistory(
              currentUser.uid,
              newCredits,
              -CREDIT_COST,
              'assistant',
              `assistant_${Date.now()}`
            );
          }
        } catch (error) {
          console.error('Error deducting credits:', error);
          // Continue anyway - credit deduction failure shouldn't block the user
        }
      }

      // Build user context for the API
      const userContext = {
        firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
        email: profile?.email || currentUser?.email,
        currentJobTitle: profile?.currentJobTitle,
        industry: profile?.industry,
        skills: profile?.skills,
        yearsOfExperience: profile?.yearsOfExperience,
      };

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          pageContext: {
            pathname: location.pathname,
            pageName: currentPageContext?.pageName,
            pageDescription: currentPageContext?.pageDescription,
          },
          userContext,
          userId: currentUser?.uid,
          pageData: pageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response with proper buffer handling
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Add new chunk to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    // Update message with each chunk for smooth streaming effect
                    updateMessage(assistantMessageId, fullContent, true);
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        }
        
        // Mark streaming as complete
        updateMessage(assistantMessageId, fullContent || 'No response received', false);
      } else {
        // Handle JSON response (fallback)
        const data = await response.json();
        updateMessage(assistantMessageId, data.content || data.message || 'No response received', false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(
        assistantMessageId, 
        'Sorry, I encountered an error. Please try again.', 
        false
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentUser, addMessage, setIsLoading, profile, userData, location.pathname, currentPageContext, updateMessage, pageData]);

  // Handle pending messages from QuickActions
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      setPendingMessage(null);
      processSendMessage(pendingMessage);
    }
  }, [pendingMessage, isLoading, setPendingMessage, processSendMessage]);

  const sendMessage = () => {
    processSendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative">
      {/* Input container with integrated send button */}
      <div className="relative bg-gray-50/80 dark:bg-white/[0.03] 
        rounded-2xl border border-gray-200/80 dark:border-white/[0.06]
        focus-within:border-gray-300 dark:focus-within:border-white/[0.1]
        focus-within:bg-gray-50 dark:focus-within:bg-white/[0.04]
        transition-all duration-200
        flex items-end">
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 px-4 py-3.5 bg-transparent resize-none
            text-[15px] text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            max-h-[120px] min-h-[48px]"
        />

        {/* Send button - integrated */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className={`flex-shrink-0 m-2 p-2.5 rounded-xl
            transition-all duration-200
            ${input.trim() && !isLoading
              ? 'bg-[#635BFF] text-white shadow-sm shadow-indigo-500/25 hover:bg-[#5851ea]' 
              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500'
            }
            disabled:cursor-not-allowed`}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
