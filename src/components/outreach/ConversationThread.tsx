import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid, isToday, isYesterday } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Mail, 
  Linkedin, 
  Phone, 
  User,
  MessageSquare,
  Check,
  CheckCheck,
  Eye,
  Reply,
  Clock,
} from 'lucide-react';
import { OutreachMessage, OutreachChannel, OutreachMessageStatus, OUTREACH_CHANNEL_CONFIG } from '../../types/job';
import { ProfileAvatar, generateGenderedAvatarConfigByName, ProfileAvatarConfig, DEFAULT_PROFILE_AVATAR_CONFIG } from '../profile/avatar';
import type { ProfileAvatarType } from '../profile/avatar';

interface ConversationThreadProps {
  messages: OutreachMessage[];
  contactName: string;
  contactInitials?: string;
  onReply?: (message: OutreachMessage) => void;
}

// Helper to validate and fix date
const fixDate = (dateStr: string): Date => {
  try {
    let date = parseISO(dateStr);
    
    // Check if date is valid
    if (!isValid(date)) {
      return new Date(); // Return current date if invalid
    }
    
    // Check if year is wrong (before 2020) - likely corrupted data
    const year = date.getFullYear();
    if (year < 2020) {
      // Fix the year to current year
      const currentYear = new Date().getFullYear();
      date = new Date(date);
      date.setFullYear(currentYear);
    }
    
    return date;
  } catch {
    return new Date();
  }
};

// Helper to format date intelligently
const formatMessageDate = (dateStr: string): string => {
  try {
    const date = fixDate(dateStr);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, yyyy • HH:mm');
  } catch {
    return dateStr;
  }
};

// Get channel icon
const ChannelIcon = ({ channel, className = "w-3 h-3" }: { channel: OutreachChannel; className?: string }) => {
  const icons: Record<OutreachChannel, React.ReactNode> = {
    email: <Mail className={className} />,
    linkedin: <Linkedin className={className} />,
    phone: <Phone className={className} />,
    in_person: <User className={className} />,
    referral: <User className={className} />,
    event: <User className={className} />,
    cold_call: <Phone className={className} />,
    twitter: <MessageSquare className={className} />,
    other: <MessageSquare className={className} />,
  };
  return icons[channel] || icons.other;
};

// Status indicator
const StatusIcon = ({ status }: { status?: OutreachMessageStatus }) => {
  if (!status || status === 'draft') {
    return <Clock className="w-3 h-3 text-gray-400" />;
  }
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-gray-400" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-gray-400" />;
  }
  if (status === 'opened') {
    return <Eye className="w-3 h-3 text-blue-500" />;
  }
  if (status === 'replied') {
    return <Reply className="w-3 h-3 text-green-500" />;
  }
  return null;
};

// Single message bubble
const MessageBubble = ({ 
  message, 
  contactName,
  contactInitials,
  onReply,
  userAvatarType,
  userAvatarConfig,
  userPhotoURL,
}: { 
  message: OutreachMessage; 
  contactName: string;
  contactInitials: string;
  onReply?: (message: OutreachMessage) => void;
  userAvatarType?: ProfileAvatarType;
  userAvatarConfig?: ProfileAvatarConfig;
  userPhotoURL?: string | null;
}) => {
  const isSent = message.type === 'sent';
  const config = OUTREACH_CHANNEL_CONFIG[message.channel];
  
  // Render user avatar based on type
  const renderUserAvatar = () => {
    if (userAvatarType === 'avatar' && userAvatarConfig && userAvatarConfig.hair && userAvatarConfig.hair.length > 0) {
      return (
        <ProfileAvatar
          config={userAvatarConfig}
          size={32}
          className="rounded-full flex-shrink-0"
        />
      );
    } else if (userPhotoURL) {
      return (
        <img
          src={userPhotoURL}
          alt="You"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      );
    } else {
      // Fallback to gradient with "You" text
      return (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white">
          You
        </div>
      );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isSent ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {isSent ? (
        renderUserAvatar()
      ) : (
        <ProfileAvatar
          config={generateGenderedAvatarConfigByName(contactName)}
          size={32}
          className="rounded-full flex-shrink-0"
        />
      )}
      
      {/* Message content */}
      <div className={`flex-1 max-w-[80%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header with name and channel */}
        <div className={`flex items-center gap-2 mb-1 ${isSent ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {isSent ? 'You' : contactName}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${config.color}`}>
            <ChannelIcon channel={message.channel} className="w-2.5 h-2.5" />
            {config.label}
          </span>
        </div>
        
        {/* Message bubble */}
        <div className={`
          rounded-2xl px-4 py-2.5 
          ${isSent 
            ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white rounded-tr-md' 
            : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-900 dark:text-white rounded-tl-md'
          }
        `}>
          {/* Subject if present */}
          {message.subject && (
            <div className={`text-xs font-semibold mb-1.5 pb-1.5 border-b ${
              isSent ? 'border-white/20' : 'border-gray-200 dark:border-[#4a494b]'
            }`}>
              {message.subject}
            </div>
          )}
          
          {/* Content */}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
        
        {/* Footer with time and status */}
        <div className={`flex items-center gap-2 mt-1 ${isSent ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">
            {formatMessageDate(message.sentAt)}
          </span>
          {isSent && <StatusIcon status={message.status} />}
          {!isSent && onReply && (
            <button
              onClick={() => onReply(message)}
              className="text-[10px] text-[#8B5CF6] hover:text-[#7C3AED] font-medium flex items-center gap-1 transition-colors"
              title="Reply to this message"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Empty state
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B5CF6]/10 to-[#EC4899]/10 flex items-center justify-center mb-4">
      <MessageSquare className="w-8 h-8 text-[#8B5CF6]" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No messages yet
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
      Start the conversation by sending your first message to this contact.
    </p>
  </div>
);

export function ConversationThread({ 
  messages, 
  contactName,
  contactInitials,
  onReply,
}: ConversationThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  // User avatar state
  const [userAvatarType, setUserAvatarType] = useState<ProfileAvatarType>('photo');
  const [userAvatarConfig, setUserAvatarConfig] = useState<ProfileAvatarConfig>(DEFAULT_PROFILE_AVATAR_CONFIG);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);
  
  // Load user avatar config from Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      const loadUserAvatar = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.profilePhoto) {
              setUserPhotoURL(userData.profilePhoto);
            }
            if (userData.profileAvatarType) {
              setUserAvatarType(userData.profileAvatarType);
            }
            if (userData.profileAvatarConfig) {
              setUserAvatarConfig(userData.profileAvatarConfig);
            }
            // Fallback to auth photoURL
            if (!userData.profilePhoto && currentUser.photoURL) {
              setUserPhotoURL(currentUser.photoURL);
            }
          }
        } catch (error) {
          console.error('[ConversationThread] Error loading user avatar:', error);
        }
      };
      loadUserAvatar();
    }
  }, [currentUser?.uid, currentUser?.photoURL]);
  
  // Get initials from contact name if not provided
  const initials = contactInitials || contactName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  if (!messages || messages.length === 0) {
    return <EmptyState />;
  }
  
  // Sort messages by date (oldest first), fixing any incorrect dates
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = fixDate(a.sentAt);
    const dateB = fixDate(b.sentAt);
    return dateA.getTime() - dateB.getTime();
  });

  // Group messages by date (using fixed dates)
  const groupedMessages = sortedMessages.reduce((groups, message) => {
    const fixedDate = fixDate(message.sentAt);
    const date = format(fixedDate, 'yyyy-MM-dd'); // Use consistent date format
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, OutreachMessage[]>);
  
  // Sort dates chronologically
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
    >
      <AnimatePresence mode="popLayout">
        {sortedDates.map((date) => {
          const msgs = groupedMessages[date];
          return (
          <div key={date} className="space-y-4">
            {/* Date separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#3d3c3e]" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                {(() => {
                  const parsedDate = new Date(date);
                  if (isToday(parsedDate)) return 'Today';
                  if (isYesterday(parsedDate)) return 'Yesterday';
                  return format(parsedDate, 'MMMM d, yyyy');
                })()}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#3d3c3e]" />
            </div>
            
            {/* Messages for this date */}
            {msgs.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                contactName={contactName}
                contactInitials={initials}
                onReply={onReply}
                userAvatarType={userAvatarType}
                userAvatarConfig={userAvatarConfig}
                userPhotoURL={userPhotoURL}
              />
            ))}
          </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ConversationThread;

