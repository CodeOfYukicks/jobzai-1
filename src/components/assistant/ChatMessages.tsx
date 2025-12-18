import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Play } from 'lucide-react';
import { useAssistant, ChatMessage } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTour, TOURS } from '../../contexts/TourContext';
import ReactMarkdown from 'react-markdown';
import { parseRecordMarkup, hasRecordMarkup } from './parseRecordMarkup';
import { parseEditNoteMarkup, hasEditNoteMarkup } from './parseEditNoteMarkup';
import RecordCard from './RecordCard';
import EditActionButton from './EditActionButton';
import { markdownToTiptap } from '../../lib/markdownToTiptap';
import { Avatar, AvatarConfig, DEFAULT_AVATAR_CONFIG, loadAvatarConfig } from './avatar';
import type { ProfileAvatarConfig, ProfileAvatarType } from '../profile/avatar';
import { ProfileAvatar, DEFAULT_PROFILE_AVATAR_CONFIG } from '../profile/avatar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AIUpdatingIndicator from './AIUpdatingIndicator';

// Regex to detect AI updating status markup: [AI_UPDATING:variant]
const AI_UPDATING_REGEX = /^\[AI_UPDATING:(note|selection)\]$/;

// Function to check if content is an AI updating status
function isAIUpdatingStatus(content: string): { isUpdating: boolean; variant?: 'note' | 'selection' } {
  const match = content.trim().match(AI_UPDATING_REGEX);
  if (match) {
    return { isUpdating: true, variant: match[1] as 'note' | 'selection' };
  }
  return { isUpdating: false };
}

// Regex to detect tour trigger markup: [[START_TOUR:tour-id]]
const TOUR_TRIGGER_REGEX = /\[\[START_TOUR:([a-zA-Z0-9_-]+)\]\]/g;

// Function to extract tour triggers from content
function extractTourTriggers(content: string): string[] {
  const triggers: string[] = [];
  let match;
  while ((match = TOUR_TRIGGER_REGEX.exec(content)) !== null) {
    triggers.push(match[1]);
  }
  TOUR_TRIGGER_REGEX.lastIndex = 0; // Reset regex state
  return triggers;
}

// Function to strip tour trigger markup from content for display
function stripTourTriggers(content: string): string {
  return content.replace(TOUR_TRIGGER_REGEX, '').trim();
}

interface MessageBubbleProps {
  message: ChatMessage;
  avatarConfig: AvatarConfig;
  userPhotoURL?: string | null;
  userAvatarType?: ProfileAvatarType;
  userAvatarConfig?: ProfileAvatarConfig;
}

// Markdown components configuration (reusable)
const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }: any) => <li className="mb-0.5">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-[13px] font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="p-3 rounded-xl bg-gray-200/80 dark:bg-white/10 overflow-x-auto text-[13px] my-2 font-mono">
      {children}
    </pre>
  ),
};

// Tour trigger button component
function TourTriggerButton({ tourId }: { tourId: string }) {
  const { startTour } = useTour();
  const { closeAssistant } = useAssistant();
  const tour = TOURS[tourId];
  
  if (!tour) return null;

  const handleStartTour = () => {
    closeAssistant();
    setTimeout(() => {
      startTour(tourId);
    }, 300); // Wait for modal to close
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleStartTour}
      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 
        bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] text-white text-sm font-semibold
        rounded-xl shadow-lg shadow-[#635BFF]/25 hover:shadow-[#635BFF]/40
        transition-all duration-200"
    >
      <Play className="h-4 w-4" />
      <span>Start Interactive Guide</span>
    </motion.button>
  );
}

// Component to render content with record cards, tour triggers, and edit actions
function MessageContent({ content }: { content: string }) {
  const { noteEditorCallbacks } = useAssistant();
  
  // Check for tour triggers first
  const tourTriggers = extractTourTriggers(content);
  
  // Strip tour markup from display content
  const displayContent = stripTourTriggers(content);
  
  // Check for EDIT_NOTE markup
  const hasEditActions = hasEditNoteMarkup(displayContent);
  const editNoteSegments = useMemo(() => 
    hasEditActions ? parseEditNoteMarkup(displayContent) : [], 
    [displayContent, hasEditActions]
  );
  
  const recordSegments = useMemo(() => parseRecordMarkup(displayContent), [displayContent]);

  // Handler to apply edit to note
  const handleApplyEdit = async (markdownContent: string) => {
    if (!noteEditorCallbacks?.setContent || !noteEditorCallbacks?.onContentChange) {
      console.warn('Note editor callbacks not available');
      return;
    }

    try {
      // Convert markdown to TipTap JSON format
      const tiptapContent = markdownToTiptap(markdownContent);
      
      // Update the editor display
      noteEditorCallbacks.setContent(tiptapContent);
      
      // Trigger save
      await noteEditorCallbacks.onContentChange(tiptapContent);
    } catch (error) {
      console.error('Error applying edit to note:', error);
      throw error;
    }
  };

  // If has EDIT_NOTE markup, render with edit action buttons
  if (hasEditActions) {
    return (
      <div className="space-y-2">
        {editNoteSegments.map((segment, index) => {
          if (segment.type === 'text' && segment.content) {
            // For text segments, also check for record cards
            const textRecordSegments = parseRecordMarkup(segment.content);
            const hasRecords = hasRecordMarkup(segment.content);
            
            if (hasRecords) {
              return (
                <div key={index} className="space-y-1">
                  {textRecordSegments.map((recordSeg, recIndex) => {
                    if (recordSeg.type === 'text') {
                      return (
                        <ReactMarkdown key={recIndex} components={markdownComponents}>
                          {recordSeg.content}
                        </ReactMarkdown>
                      );
                    } else {
                      return (
                        <RecordCard key={recIndex} data={recordSeg.data} />
                      );
                    }
                  })}
                </div>
              );
            }
            
            return (
              <ReactMarkdown key={index} components={markdownComponents}>
                {segment.content}
              </ReactMarkdown>
            );
          } else if (segment.type === 'edit' && segment.editAction) {
            return (
              <EditActionButton
                key={index}
                action={segment.editAction.action}
                content={segment.editAction.content}
                onApply={handleApplyEdit}
              />
            );
          }
          return null;
        })}
        {tourTriggers.map((tourId, index) => (
          <TourTriggerButton key={`tour-${index}`} tourId={tourId} />
        ))}
      </div>
    );
  }

  // If no record markup, render plain markdown
  if (!hasRecordMarkup(displayContent)) {
    return (
      <>
        <ReactMarkdown components={markdownComponents}>
          {displayContent}
        </ReactMarkdown>
        {tourTriggers.map((tourId, index) => (
          <TourTriggerButton key={index} tourId={tourId} />
        ))}
      </>
    );
  }

  // Render segments with cards
  return (
    <div className="space-y-1">
      {recordSegments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <ReactMarkdown key={index} components={markdownComponents}>
              {segment.content}
            </ReactMarkdown>
          );
        } else {
          return (
            <RecordCard key={index} data={segment.data} />
          );
        }
      })}
      {tourTriggers.map((tourId, index) => (
        <TourTriggerButton key={`tour-${index}`} tourId={tourId} />
      ))}
    </div>
  );
}

// Smooth typing effect component for streaming messages (with record card support)
function StreamingText({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [targetContent, setTargetContent] = useState('');
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Characters to reveal per frame (adjust for speed)
  const CHARS_PER_FRAME = 2;
  const FRAME_DELAY = 16; // ~60fps

  useEffect(() => {
    setTargetContent(content);
  }, [content]);

  useEffect(() => {
    // If we have more content to display
    if (displayedContent.length < targetContent.length) {
      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateRef.current >= FRAME_DELAY) {
          lastUpdateRef.current = timestamp;
          
          setDisplayedContent(prev => {
            const remaining = targetContent.length - prev.length;
            const charsToAdd = Math.min(CHARS_PER_FRAME, remaining);
            return targetContent.slice(0, prev.length + charsToAdd);
          });
        }
        
        if (displayedContent.length < targetContent.length) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [displayedContent, targetContent]);

  // When streaming ends, ensure all content is displayed
  useEffect(() => {
    if (!isStreaming && displayedContent !== content) {
      setDisplayedContent(content);
    }
  }, [isStreaming, content, displayedContent]);

  // Parse content with potential record cards
  const segments = useMemo(() => parseRecordMarkup(displayedContent), [displayedContent]);
  const hasCards = hasRecordMarkup(displayedContent);

  return (
    <>
      {hasCards ? (
        <div className="space-y-1">
          {segments.map((segment, index) => {
            if (segment.type === 'text') {
              return (
                <ReactMarkdown key={index} components={markdownComponents}>
                  {segment.content}
                </ReactMarkdown>
              );
            } else {
              return (
                <RecordCard key={index} data={segment.data} />
              );
            }
          })}
        </div>
      ) : (
        <ReactMarkdown components={markdownComponents}>
          {displayedContent}
        </ReactMarkdown>
      )}
      {/* Blinking cursor while streaming */}
      {isStreaming && displayedContent.length > 0 && (
        <span className="inline-block w-[2px] h-[1em] bg-gray-600 dark:bg-gray-400 ml-0.5 animate-pulse" />
      )}
    </>
  );
}

function MessageBubble({ message, avatarConfig, userPhotoURL, userAvatarType = 'photo', userAvatarConfig }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistantStreaming = !isUser && message.isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {isUser ? (
        // User avatar - show profile avatar, profile photo, or fallback to icon
        <div className="flex-shrink-0 h-8 w-8 rounded-lg overflow-hidden
          bg-gradient-to-br from-[#635BFF] to-[#8B7FFF] flex items-center justify-center"
        >
          {userAvatarType === 'avatar' && userAvatarConfig?.hair ? (
            <ProfileAvatar 
              config={userAvatarConfig}
              size={32}
              className="w-full h-full"
            />
          ) : userPhotoURL ? (
            <img 
              src={userPhotoURL} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-3.5 w-3.5 text-white" />
          )}
        </div>
      ) : (
        // AI avatar - use DiceBear avatar
        <Avatar 
          config={avatarConfig}
          size={32}
          className="flex-shrink-0 rounded-lg ring-1 ring-gray-200/60 dark:ring-white/10 
            bg-gray-50 dark:bg-[#2a2a2b]"
        />
      )}

      {/* Message content */}
      <div className={`flex-1 max-w-[85%] min-w-0 overflow-hidden ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-3 py-2.5 rounded-2xl text-[14px] leading-relaxed max-w-full overflow-hidden
          ${isUser 
            ? 'bg-gradient-to-br from-[#635BFF] to-[#7B6FFF] text-white rounded-tr-lg shadow-sm shadow-indigo-500/20' 
            : 'bg-gray-100/80 dark:bg-white/[0.05] text-gray-800 dark:text-gray-200 rounded-tl-lg'
          }`}
        >
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (() => {
            // Check if this is an AI updating status message
            const aiStatus = isAIUpdatingStatus(message.content);
            if (aiStatus.isUpdating && message.isStreaming) {
              return <AIUpdatingIndicator variant={aiStatus.variant} />;
            }
            
            return (
              <div className={`prose prose-sm max-w-none
                ${isUser 
                  ? 'prose-invert' 
                  : 'dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5'
                }`}
              >
                {isAssistantStreaming ? (
                  <StreamingText content={message.content} isStreaming={true} />
                ) : isUser ? (
                  <ReactMarkdown components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
            );
          })()}
        </div>
        
        {/* Timestamp - only show when not streaming */}
        {!message.isStreaming && (
          <p className={`text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium
            ${isUser ? 'text-right mr-1' : 'ml-1'}`}
          >
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-0.5">
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
      />
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

interface ChatMessagesProps {
  avatarConfig?: AvatarConfig;
}

export default function ChatMessages({ avatarConfig: propAvatarConfig }: ChatMessagesProps = {}) {
  const { messages, isLoading } = useAssistant();
  const { currentUser, userData } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Avatar config state - use prop if provided, otherwise load from storage
  const [localAvatarConfig, setLocalAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  
  // Profile avatar state (Lorelei style for user)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileAvatarType, setProfileAvatarType] = useState<ProfileAvatarType>('photo');
  const [profileAvatarConfig, setProfileAvatarConfig] = useState<ProfileAvatarConfig>(DEFAULT_PROFILE_AVATAR_CONFIG);
  
  // Load avatar configs
  useEffect(() => {
    if (currentUser?.uid) {
      const loadConfigs = async () => {
        try {
          // Load assistant avatar config
          if (!propAvatarConfig) {
            const config = await loadAvatarConfig(currentUser.uid);
            setLocalAvatarConfig(config);
          }
          
          // Load user profile avatar config from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.profilePhoto) {
              setProfilePhoto(userData.profilePhoto);
            }
            if (userData.profileAvatarType) {
              setProfileAvatarType(userData.profileAvatarType);
            }
            if (userData.profileAvatarConfig) {
              setProfileAvatarConfig(userData.profileAvatarConfig);
            }
          }
        } catch (error) {
          console.error('[ChatMessages] Error loading configs:', error);
        }
      };
      loadConfigs();
    }
  }, [currentUser?.uid, propAvatarConfig]);
  
  // Use prop config if provided, otherwise use local
  const avatarConfig = propAvatarConfig || localAvatarConfig;
  
  // Get user photo URL - check profile photo first, then fallback to auth photo
  const userPhotoURL = useMemo(() => {
    return profilePhoto || currentUser?.photoURL || (userData as any)?.photoURL || null;
  }, [profilePhoto, currentUser?.photoURL, userData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div ref={containerRef} className="space-y-4 py-4">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            avatarConfig={avatarConfig}
            userPhotoURL={userPhotoURL}
            userAvatarType={profileAvatarType}
            userAvatarConfig={profileAvatarConfig}
          />
        ))}
      </AnimatePresence>

      {/* Show typing indicator when loading and no streaming message */}
      {isLoading && !messages.some(m => m.isStreaming) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-3"
        >
          <Avatar 
            config={avatarConfig}
            size={32}
            className="flex-shrink-0 rounded-lg ring-1 ring-gray-200/60 dark:ring-white/10 
              bg-gray-50 dark:bg-[#2a2a2b]"
          />
          <div className="bg-gray-100/80 dark:bg-white/[0.05] rounded-2xl rounded-tl-lg px-4 py-2.5">
            <TypingIndicator />
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

