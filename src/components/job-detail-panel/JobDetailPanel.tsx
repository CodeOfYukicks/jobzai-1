import { Fragment, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Edit3,
  Save,
  Trash2,
  Plus,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Archive,
  Sparkles,
  FileText,
  StickyNote,
  Target,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { JobApplication, Interview, StatusChange, BoardType } from '../../types/job';
import { JobStatusBadge } from './JobStatusBadge';
import { PropertyRow } from './PropertyRow';
import { SectionCard } from './SectionCard';
import { TimelineItem } from './TimelineItem';
import { InterviewCard } from './InterviewCard';
import { AddInterviewForm } from './AddInterviewForm';
import { AIToolsTab } from './AIToolsTab';
import { NotesTab } from './NotesTab';
import { EnhancedJobSummary } from './EnhancedJobSummary';
import { ResumeLab } from './ResumeLab';
import { LinkedDocumentsTab } from './LinkedDocumentsTab';
import { ContactTab } from './ContactTab';
import { notify } from '@/lib/notify';
import { CompanyLogo } from '../common/CompanyLogo';
import { ConversationThread } from '../outreach/ConversationThread';
import { MessageComposer } from '../outreach/MessageComposer';
import { PremiumChatComposer } from '../outreach/PremiumChatComposer';
import { OutreachMessage } from '../../types/job';
import { getAuth } from 'firebase/auth';

// Helper function to safely parse dates from Firestore
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();

  // If it's already a Date object
  if (dateValue instanceof Date) return dateValue;

  // If it's a Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's a timestamp number
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // If it's an ISO string
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }

  return new Date();
};

// Helper function to format dates safely
const formatDate = (dateValue: any, formatString: string): string => {
  try {
    const date = parseDate(dateValue);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

interface JobDetailPanelProps {
  job: JobApplication | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (updatedJob: Partial<JobApplication>) => Promise<void>;
  onDelete?: () => Promise<void>;
  boardType?: BoardType;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  // Job Application statuses
  applied: {
    icon: Circle,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50'
  },
  interview: {
    icon: TrendingUp,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/50'
  },
  offer: {
    icon: CheckCircle2,
    color: 'text-green-500 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/50'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/50'
  },
  archived: {
    icon: Archive,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-[#2b2a2c]/50',
    border: 'border-gray-200 dark:border-[#3d3c3e]'
  },
  pending_decision: {
    icon: AlertCircle,
    color: 'text-yellow-500 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800/50'
  },
  wishlist: {
    icon: Tag,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/50'
  },
  // Campaign/Outreach statuses
  targets: {
    icon: Target,
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800/50'
  },
  contacted: {
    icon: Circle,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50'
  },
  follow_up: {
    icon: AlertCircle,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/50'
  },
  replied: {
    icon: CheckCircle2,
    color: 'text-cyan-500 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800/50'
  },
  meeting: {
    icon: Calendar,
    color: 'text-indigo-500 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800/50'
  },
  opportunity: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/50'
  },
  no_response: {
    icon: XCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700/50'
  },
  closed: {
    icon: Archive,
    color: 'text-gray-600 dark:text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800/70',
    border: 'border-gray-300 dark:border-gray-600/50'
  },
};

export const JobDetailPanel = ({ job, open, onClose, onUpdate, onDelete, boardType = 'jobs' }: JobDetailPanelProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<JobApplication>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contact' | 'interviews' | 'meetings' | 'messages' | 'activity' | 'ai-tools' | 'notes' | 'resume-lab' | 'linked-documents'>(boardType === 'campaigns' ? 'contact' : 'overview');
  const [showAddInterviewForm, setShowAddInterviewForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<OutreachMessage | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<OutreachMessage[]>([]);
  const [isCheckingReplies, setIsCheckingReplies] = useState(false);
  
  // Campaign mode detection
  const isCampaignMode = boardType === 'campaigns';
  
  // Backend URL
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Sync local messages with job prop
  useEffect(() => {
    if (job?.conversationHistory) {
      setLocalMessages(job.conversationHistory);
    } else {
      setLocalMessages([]);
    }
  }, [job?.conversationHistory]);

  // Function to check for new replies
  const handleCheckReplies = useCallback(async (isManual = false) => {
    if (!job?.gmailThreadId || !onUpdate) return;

    setIsCheckingReplies(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      // Fetch the full thread to get all messages
      const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${job.gmailThreadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.needsReconnect) {
          notify.error('Gmail token expired. Please reconnect Gmail.');
        } else if (isManual) {
          notify.error('Failed to check for replies');
        }
        return;
      }

      const data = await response.json();
      
      if (!data.success || !data.reply) {
        if (isManual) {
          notify.info('No new replies found');
        }
        return; // No reply found
      }

      // Get existing messages to check for duplicates
      const existingMessages = job.conversationHistory || [];
      
      // Create a signature for the new reply to check if it already exists
      // Use first 100 chars of content + date (without time) as unique identifier
      const replyDate = data.reply.date ? new Date(data.reply.date).toISOString().split('T')[0] : '';
      const replySignature = `${data.reply.body.substring(0, 100).trim()}-${replyDate}`;
      
      // Check if this reply already exists
      const replyExists = existingMessages.some(msg => {
        if (msg.type !== 'received') return false;
        const msgDate = msg.sentAt ? new Date(msg.sentAt).toISOString().split('T')[0] : '';
        const msgSignature = `${msg.content.substring(0, 100).trim()}-${msgDate}`;
        return msgSignature === replySignature;
      });
      
      if (replyExists) {
        if (isManual) {
          notify.info('No new replies found');
        }
        return; // Reply already exists
      }

      // Parse the date - API now returns ISO string
      let replySentAt: string;
      try {
        const parsedDate = new Date(data.reply.date);
        replySentAt = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
      } catch {
        replySentAt = new Date().toISOString();
      }

      // Add the new reply to conversation history
      const newReplyMessage: OutreachMessage = {
        id: crypto.randomUUID(),
        type: 'received',
        channel: 'email',
        subject: data.reply.subject || undefined,
        content: data.reply.body,
        sentAt: replySentAt,
        status: 'replied',
      };

      // Clean undefined values
      const cleanedMessage = Object.fromEntries(
        Object.entries(newReplyMessage).filter(([_, value]) => value !== undefined)
      ) as OutreachMessage;

      const updatedHistory = [...existingMessages, cleanedMessage];

      // Update local messages immediately
      setLocalMessages(updatedHistory);

      // Prepare update object, removing undefined values
      const updates: Partial<JobApplication> = {
        conversationHistory: updatedHistory,
        updatedAt: new Date().toISOString(), // Ensure updatedAt is set to trigger onSnapshot
      };

      // Update status to 'replied' if it's currently 'contacted' or 'targets'
      if (job.status === 'contacted' || job.status === 'targets') {
        updates.status = 'replied';
      }

      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ) as Partial<JobApplication>;

      await onUpdate(cleanUpdates);
      notify.success('New reply found and added!');
    } catch (error: any) {
      console.error('Error checking replies:', error);
      // Don't show error on auto-check, only log it
    } finally {
      setIsCheckingReplies(false);
    }
  }, [job, onUpdate, BACKEND_URL]);

  // Auto-check for replies when Messages tab is opened and job has gmailThreadId
  useEffect(() => {
    if (activeTab === 'messages' && isCampaignMode && job?.gmailThreadId && open) {
      // Check for replies after a short delay to avoid too frequent checks
      const timer = setTimeout(() => {
        handleCheckReplies();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isCampaignMode, job?.gmailThreadId, open, handleCheckReplies]);

  // Reset active tab to 'contact' when opening modal for campaigns
  useEffect(() => {
    if (open && boardType === 'campaigns') {
      setActiveTab('contact');
    } else if (open && boardType === 'jobs') {
      setActiveTab('overview');
    }
  }, [open, boardType]);

  if (!job) return null;

  const handleClose = () => {
    setShowAddInterviewForm(false);
    setIsEditing(false);
    setEditedJob({});
    setShowMessageComposer(false);
    setReplyToMessage(null);
    onClose();
  };

  const handleQuickSend = async (content: string) => {
    if (!content.trim() || !onUpdate || !job) return;

    const messageData: Omit<OutreachMessage, 'id'> = {
      type: 'sent',
      channel: 'email',
      subject: replyToMessage?.subject ? `Re: ${replyToMessage.subject.replace(/^Re: /i, '')}` : undefined,
      content: content.trim(),
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    const success = await handleSendMessage(messageData);
    if (success) {
      // Clear the draft only on success
      setEditedJob({ ...editedJob, messageDraft: '' });
    }
  };

  const handleSendMessage = async (messageData: Omit<OutreachMessage, 'id'>) => {
    if (!onUpdate || !job) return false;

    setIsSendingMessage(true);
    
    // Helper to remove undefined fields (Firestore forbids undefined anywhere)
    const sanitizeMessage = (msg: OutreachMessage): OutreachMessage => {
      return Object.fromEntries(
        Object.entries(msg).filter(([, value]) => value !== undefined)
      ) as OutreachMessage;
    };

    // Prepare new message and sanitize
    const newMessage: OutreachMessage = sanitizeMessage({
      ...messageData,
      id: crypto.randomUUID(),
    });

    try {
      // If it's an email and we have a gmailThreadId, send via Gmail API
      if (messageData.channel === 'email' && job.gmailThreadId && messageData.status !== 'draft') {
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          
          const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${job.gmailThreadId}/reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              message: messageData.content
            })
          });

          // Check if response is OK before trying to parse JSON
          if (!response.ok) {
            // Try to parse error response as JSON, fallback to status text
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
              // If response is not JSON (e.g., HTML error page), use status text
              const text = await response.text();
              if (response.status === 404) {
                errorMessage = 'API endpoint not found. Please restart the server.';
              }
            }
            notify.error(errorMessage);
            return false;
          }
          
          const data = await response.json();
          
          if (data.success) {
            notify.success('Message sent successfully!');
            // Update gmailThreadId if we got a new one (shouldn't happen for replies, but just in case)
            if (data.threadId && data.threadId !== job.gmailThreadId) {
              // This shouldn't happen for replies, but handle it anyway
            }
          } else if (data.needsReconnect) {
            notify.error('Gmail token expired. Please reconnect Gmail.');
            return false;
          } else {
            notify.error(data.error || 'Failed to send email');
            return false;
          }
        } catch (error: any) {
          console.error('Error sending via Gmail API:', error);
          
          // Check if it's a connection error
          if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED') || error.name === 'TypeError') {
            notify.error(`Cannot connect to backend server at ${BACKEND_URL}. Please make sure the server is running.`);
            return false;
          }
          
          // Other errors
          notify.error(error.message || 'Failed to send email');
          return false;
        }
      } else if (messageData.channel === 'email' && !job.gmailThreadId) {
        notify.error('No Gmail thread linked. Cannot send email.');
        return false;
      }

      // Add message to conversation history only after successful send/update
      const updatedHistory = [...(job.conversationHistory || []), newMessage].map(sanitizeMessage);

      // Prepare update object, removing undefined values (Firestore doesn't accept undefined)
      const updates: Partial<JobApplication> = {
        conversationHistory: updatedHistory,
        lastContactedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Ensure updatedAt is set to trigger onSnapshot
      };

      // Update status if it's a new message (not a draft)
      if (messageData.status === 'sent' && job.status === 'targets') {
        updates.status = 'contacted';
      }

      // Remove any undefined values before sending to Firestore
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ) as Partial<JobApplication>;

      // Update the job application
      await onUpdate(cleanUpdates);

      setShowMessageComposer(false);
      setReplyToMessage(null);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      notify.error('Failed to send message');
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleOpenComposer = (replyTo?: OutreachMessage) => {
    setReplyToMessage(replyTo || null);
    setShowMessageComposer(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const updates = { ...editedJob };

      // Check if status changed
      if (updates.status && updates.status !== job.status) {
        const newStatusChange: StatusChange = {
          status: updates.status,
          date: new Date().toISOString(),
          notes: 'Status updated',
        };

        // Append to statusHistory
        updates.statusHistory = [
          ...(job.statusHistory || []),
          newStatusChange
        ];
      }

      await onUpdate(updates);
      setIsEditing(false);
      setEditedJob({});
      notify.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving:', error);
      notify.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    await onDelete();
    setShowDeleteModal(false);
    onClose();
  };

  const handleAddInterview = async (interviewData: Omit<Interview, 'id'>) => {
    if (!onUpdate || !job) return;

    try {
      // Create new interview with unique ID
      const newInterview: Interview = {
        ...interviewData,
        id: crypto.randomUUID(),
      };

      // Update job with new interview
      const updatedInterviews = [...(job.interviews || []), newInterview];

      // Only update interviews - let parent component handle status change via modal prompt
      // if status is 'wishlist' or 'applied'
      const updates: Partial<JobApplication> = {
        interviews: updatedInterviews,
      };

      // Don't auto-update status if it's wishlist or applied - let modal handle it
      // For other statuses, keep existing behavior (though they probably won't need status change)

      await onUpdate(updates);
      setShowAddInterviewForm(false);
      
      // Don't show toast here - parent component will show modal or toast as appropriate
    } catch (error) {
      console.error('Error adding interview:', error);
      notify.error('Failed to schedule interview');
    }
  };

  // Get status config with fallback for unknown statuses
  const defaultStatus = {
    icon: Circle,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700/50'
  };
  const currentStatus = statusConfig[job.status] || defaultStatus;
  const StatusIcon = currentStatus.icon;

  return (
    <>
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-400"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-6xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#242325] shadow-2xl rounded-l-3xl border-l border-gray-200 dark:border-[#3d3c3e]">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#242325]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#3d3c3e]">
                      <div className="px-8 py-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center gap-3 mb-3">
                              {/* Company Logo or Contact Avatar */}
                              {isCampaignMode ? (
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                  {(job.contactName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                              ) : (
                              <CompanyLogo
                                companyName={job.companyName}
                                size="lg"
                                className={`rounded-xl ${currentStatus.bg} ${currentStatus.border} border`}
                                showInitials={true}
                              />
                              )}
                              <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                                {isCampaignMode ? (job.contactName || 'Unknown Contact') : job.position}
                              </Dialog.Title>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                              {isCampaignMode ? (
                                <>
                                  <span className="text-lg font-medium">{job.contactRole || 'No role'}</span>
                                  <span className="text-gray-400 dark:text-gray-600">@</span>
                                  <span className="font-medium">{job.companyName}</span>
                                </>
                              ) : (
                                <>
                              <span className="text-lg font-medium">{job.companyName}</span>
                              <span className="text-gray-400 dark:text-gray-600">•</span>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                </button>
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                                  >
                                    <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                  </a>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={handleDelete}
                                    className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditing(false);
                                    setEditedJob({});
                                  }}
                                  className="px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-gray-900 dark:text-gray-100"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={handleClose}
                              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group ml-2"
                            >
                              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-4">
                          <JobStatusBadge
                            status={job.status}
                            isEditing={isEditing}
                            onChange={(newStatus) => setEditedJob({ ...editedJob, status: newStatus })}
                            boardType={boardType}
                          />
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="px-8 flex gap-6 border-t border-gray-100 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] overflow-x-auto">
                        {(isCampaignMode ? [
                          // Campaign-specific tabs
                          { id: 'contact', label: 'Contact', icon: null, badge: null },
                          { id: 'messages', label: 'Messages', icon: null, badge: job.conversationHistory?.length || 0 },
                          { id: 'meetings', label: 'Meetings', icon: null, badge: (job.meetings?.length || job.interviews?.length) || 0 },
                          { id: 'activity', label: 'Timeline', icon: null, badge: null },
                          { id: 'notes', label: 'Notes', icon: StickyNote, badge: job.stickyNotes?.length || 0 },
                          { id: 'ai-tools', label: 'Compose', icon: Sparkles, badge: null },
                        ] : [
                          // Jobs-specific tabs
                          { id: 'overview', label: 'Overview', icon: null, badge: null },
                          { id: 'interviews', label: 'Interviews', icon: null, badge: job.interviews?.length || 0 },
                          { id: 'activity', label: 'Activity', icon: null, badge: null },
                          { id: 'notes', label: 'Notes', icon: StickyNote, badge: job.stickyNotes?.length || 0 },
                          { id: 'ai-tools', label: 'Document Studio', icon: Sparkles, badge: null },
                          { id: 'resume-lab', label: 'Resume Lab', icon: Target, badge: (job.cvAnalysisIds?.length || (job.cvAnalysisId ? 1 : 0)) || 'link' },
                          { id: 'linked-documents', label: 'Linked Documents', icon: FileText, badge: ((job.linkedResumeIds?.length || 0) + (job.linkedNoteIds?.length || 0) + (job.linkedDocumentIds?.length || 0) + (job.linkedWhiteboardIds?.length || 0)) > 0 ? ((job.linkedResumeIds?.length || 0) + (job.linkedNoteIds?.length || 0) + (job.linkedDocumentIds?.length || 0) + (job.linkedWhiteboardIds?.length || 0)) : null },
                        ]).map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setShowAddInterviewForm(false);
                            }}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                              }`}
                          >
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            <span>{tab.label}</span>
                            {tab.badge && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${tab.badge === 'New'
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
                                  : typeof tab.badge === 'number' && tab.badge > 0
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-gray-200 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300'
                                  }`}
                              >
                                {tab.badge}
                              </motion.span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Two-Column Layout */}
                    <div className="flex-1 px-8 py-6">
                      <div className={`grid grid-cols-1 ${activeTab === 'ai-tools' || activeTab === 'notes' || activeTab === 'resume-lab' || activeTab === 'linked-documents' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
                        {/* Left Column - Main Content */}
                        <div className={`${activeTab === 'ai-tools' || activeTab === 'notes' || activeTab === 'resume-lab' || activeTab === 'linked-documents' ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
                          {activeTab === 'overview' && (
                            <div className="space-y-8">
                              {/* Quick Stats / Highlights */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Applied</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {format(parseDate(job.appliedDate), 'MMM d, yyyy')}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Salary</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {job.salary || 'Not specified'}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Work Type</div>
                                  <div className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {job.workType || 'Not specified'}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Platform</div>
                                  <div className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {job.platform || 'Direct'}
                                  </div>
                                </div>
                              </div>

                              {/* AI Powered Summary Section */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    AI Summary
                                  </h3>
                                  {!isEditing && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                                      Auto-generated
                                    </span>
                                  )}
                                </div>

                                {isEditing ? (
                                  <textarea
                                    value={editedJob.description !== undefined ? editedJob.description : job.description || ''}
                                    onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                                    className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    placeholder="• Key responsibilities and main duties...&#10;• Required qualifications and experience...&#10;• Notable aspects and unique selling points..."
                                  />
                                ) : (
                                  <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-100 dark:border-[#3d3c3e] p-6 shadow-sm">
                                    <EnhancedJobSummary job={job} />
                                  </div>
                                )}
                              </div>

                              {/* Full Job Description Section */}
                              {job.fullJobDescription && (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    Full Description
                                  </h3>
                                  <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-100 dark:border-[#3d3c3e] p-6 shadow-sm">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {job.fullJobDescription}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Contact Tab - Campaign Mode */}
                          {activeTab === 'contact' && isCampaignMode && (
                            <ContactTab
                              job={job}
                              isEditing={isEditing}
                              editedJob={editedJob}
                              onEdit={(updates) => setEditedJob({ ...editedJob, ...updates })}
                            />
                          )}

                          {/* Messages Tab - Campaign Mode */}
                          {activeTab === 'messages' && isCampaignMode && (
                            <div className="flex flex-col h-full space-y-6">
                              <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  Conversation History
                                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {localMessages.length > 0 ? localMessages.length : (job.conversationHistory?.length || 0)}
                                  </span>
                                </h3>
                                {job.gmailThreadId && (
                                  <button
                                    onClick={() => handleCheckReplies(true)}
                                    disabled={isCheckingReplies}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3d3c3e] rounded-xl hover:bg-gray-200 dark:hover:bg-[#4a494b] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isCheckingReplies ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Checking...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-4 h-4" />
                                        Check Replies
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-100 dark:border-[#3d3c3e] shadow-sm overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6">
                                  <ConversationThread
                                    messages={localMessages.length > 0 ? localMessages : (job.conversationHistory || [])}
                                    contactName={job.contactName || job.companyName || 'Contact'}
                                    contactInitials={(job.contactName || job.companyName || 'U')
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)}
                                    onReply={(message) => handleOpenComposer(message)}
                                  />
                                </div>

                                {/* Premium Message Composer with AI */}
                                <div className="border-t border-gray-200 dark:border-[#3d3c3e] p-4 bg-gray-50/50 dark:bg-[#1e1e22]/50">
                                  <PremiumChatComposer
                                    conversationHistory={localMessages.length > 0 ? localMessages : (job.conversationHistory || [])}
                                    contactContext={{
                                      contactName: job.contactName || job.companyName || 'Contact',
                                      contactRole: job.contactRole,
                                      companyName: job.companyName || '',
                                      relationshipGoal: job.relationshipGoal,
                                      warmthLevel: job.warmthLevel,
                                    }}
                                    onSend={handleQuickSend}
                                    isSending={isSendingMessage}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Meetings Tab - Campaign Mode */}
                          {activeTab === 'meetings' && isCampaignMode && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  Meetings
                                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {(job.meetings?.length || job.interviews?.length) || 0}
                                  </span>
                                </h3>
                                {!showAddInterviewForm && (
                                  <button
                                    onClick={() => setShowAddInterviewForm(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-900/20 dark:shadow-none"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Schedule Meeting
                                  </button>
                                )}
                              </div>

                              <AnimatePresence>
                                {showAddInterviewForm && (
                                  <AddInterviewForm
                                    onAdd={handleAddInterview}
                                    onCancel={() => setShowAddInterviewForm(false)}
                                  />
                                )}
                              </AnimatePresence>

                              {(job.meetings || job.interviews) && (job.meetings?.length || job.interviews?.length) ? (
                                <div className="grid gap-3">
                                  {(job.interviews || []).map((interview) => (
                                    <InterviewCard
                                      key={interview.id}
                                      interview={interview}
                                      jobApplication={job}
                                      onDelete={async (interviewId) => {
                                        if (!onUpdate || !job) return;
                                        const updatedInterviews = job.interviews?.filter(i => i.id !== interviewId) || [];
                                        await onUpdate({ interviews: updatedInterviews });
                                        notify.success('Meeting removed');
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-4">
                                    <Calendar className="w-8 h-8 text-purple-500" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No meetings yet</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                    Schedule a coffee chat, call, or meeting to advance this relationship.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'interviews' && !isCampaignMode && (
                            <div className="space-y-6">
                              {/* Add Interview Form */}
                              <AnimatePresence>
                                {showAddInterviewForm && (
                                  <AddInterviewForm
                                    onAdd={handleAddInterview}
                                    onCancel={() => setShowAddInterviewForm(false)}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Interviews List */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Interview Schedule
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {job.interviews?.length || 0}
                                    </span>
                                  </h3>
                                  {!showAddInterviewForm && (
                                    <button
                                      onClick={() => setShowAddInterviewForm(true)}
                                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-900/20 dark:shadow-none"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Interview
                                    </button>
                                  )}
                                </div>

                                {job.interviews && job.interviews.length > 0 ? (
                                  <div className="grid gap-3">
                                    {job.interviews.map((interview) => (
                                      <InterviewCard
                                        key={interview.id}
                                        interview={interview}
                                        jobApplication={job}
                                        onDelete={async (interviewId) => {
                                          if (!onUpdate || !job) return;
                                          
                                          try {
                                            const updatedInterviews = job.interviews?.filter(
                                              (i) => i.id !== interviewId
                                            ) || [];
                                            
                                            await onUpdate({
                                              interviews: updatedInterviews,
                                            });
                                            
                                            notify.success('Interview deleted successfully');
                                          } catch (error) {
                                            console.error('Error deleting interview:', error);
                                            notify.error('Failed to delete interview');
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  !showAddInterviewForm && (
                                    <div className="text-center py-16 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-2xl border border-dashed border-gray-200 dark:border-[#3d3c3e]">
                                      <div className="w-16 h-16 bg-white dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-[#3d3c3e]">
                                        <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                      </div>
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                        No interviews scheduled
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                                        Keep track of your interview process by adding scheduled interviews here.
                                      </p>
                                      <button
                                        onClick={() => setShowAddInterviewForm(true)}
                                        className="px-5 py-2.5 bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white border border-gray-200 dark:border-[#3d3c3e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-all font-medium text-sm inline-flex items-center gap-2 shadow-sm"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Schedule First Interview
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === 'activity' && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  Activity History
                                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {job.statusHistory?.length || 0}
                                  </span>
                                </h3>
                              </div>

                              {job.statusHistory && job.statusHistory.length > 0 ? (
                                <div className="space-y-0 pl-2">
                                  {[...job.statusHistory].reverse().map((change, index) => (
                                    <TimelineItem
                                      key={index}
                                      change={change}
                                      index={index}
                                      isLast={index === job.statusHistory!.length - 1}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-16 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-2xl border border-dashed border-gray-200 dark:border-[#3d3c3e]">
                                  <div className="w-16 h-16 bg-white dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-[#3d3c3e]">
                                    <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                  </div>
                                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                    No activity recorded
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Status changes and updates will appear here.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'ai-tools' && (
                            <AIToolsTab job={job} onUpdate={onUpdate} />
                          )}

                          {activeTab === 'notes' && (
                            <NotesTab job={job} onUpdate={onUpdate} />
                          )}

                          {activeTab === 'resume-lab' && (
                            <ResumeLab 
                              cvAnalysisIds={job.cvAnalysisIds} 
                              cvAnalysisId={job.cvAnalysisId}
                              job={{
                                id: job.id,
                                position: job.position,
                                companyName: job.companyName,
                                fullJobDescription: job.fullJobDescription,
                                description: job.description,
                                url: job.url,
                              }}
                            />
                          )}

                          {activeTab === 'linked-documents' && (
                            <LinkedDocumentsTab job={job} onUpdate={onUpdate} />
                          )}
                        </div>

                        {/* Right Column - Sidebar (hidden for AI Tools, Notes, Resume Lab, and Linked Documents tabs) */}
                        {activeTab !== 'ai-tools' && activeTab !== 'notes' && activeTab !== 'resume-lab' && activeTab !== 'linked-documents' && (
                          <div className="lg:col-span-1 space-y-4">
                            {/* Status Card */}
                            <SectionCard title="Application Status">
                              <div className={`p-4 rounded-xl ${currentStatus.bg} ${currentStatus.border} border`}>
                                <div className="flex items-center gap-3">
                                  <StatusIcon className={`w-5 h-5 ${currentStatus.color}`} />
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{job.status.replace('_', ' ')}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Current stage</div>
                                  </div>
                                </div>
                              </div>
                            </SectionCard>

                            {/* Key Details */}
                            <SectionCard title="Key Details">
                              <div className="space-y-3">
                                <PropertyRow
                                  icon={Calendar}
                                  label="Applied"
                                  value={formatDate(job.appliedDate, 'MMM d, yyyy')}
                                />
                                <PropertyRow icon={MapPin} label="Location" value={job.location} />
                                {job.salary && (
                                  <PropertyRow icon={DollarSign} label="Salary" value={job.salary} isEditing={isEditing} />
                                )}
                                {job.url && (
                                  <PropertyRow
                                    icon={ExternalLink}
                                    label="Job Posting"
                                    value="View Original"
                                    link={job.url}
                                  />
                                )}
                              </div>
                            </SectionCard>

                            {/* Quick Stats */}
                            <SectionCard title="Quick Stats">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2b2a2c] rounded-lg">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Interviews</span>
                                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {job.interviews?.length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2b2a2c] rounded-lg">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Status Changes</span>
                                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {job.statusHistory?.length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2b2a2c] rounded-lg">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Days Since Applied</span>
                                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {Math.floor(
                                      (new Date().getTime() - parseDate(job.appliedDate).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </SectionCard>

                            {/* Metadata */}
                            <div className="p-4 bg-gray-50 dark:bg-[#2b2a2c] rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <div>Created: {formatDate(job.createdAt, 'MMM d, yyyy HH:mm')}</div>
                              <div>Updated: {formatDate(job.updatedAt, 'MMM d, yyyy HH:mm')}</div>
                              <div className="pt-2 border-t border-gray-200 dark:border-[#3d3c3e] mt-2">ID: {job.id}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div >
          </div >
        </div >
      </Dialog >
    </Transition >

      {/* Premium Delete Confirmation Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
              style={{ zIndex: 200 }}
            >
              <motion.div
                initial={{ scale: 0.96, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 10, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white dark:bg-[#242325] rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-[#3d3c3e]/50 overflow-hidden pointer-events-auto"
                style={{ zIndex: 201 }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 pointer-events-none" />
                
                {/* Content */}
                <div className="relative px-8 py-8 z-10 pointer-events-auto">
                  {/* Icon - Premium */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20 rounded-2xl blur-xl" />
                      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/30">
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Title - Refined typography */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2 tracking-tight">
                    Delete Application?
                  </h3>

                  {/* Message - Minimalist */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
                    Are you sure you want to delete this application? This action cannot be undone.
                  </p>

                  {/* Application Info - Ultra minimalist */}
                  {job && (
                    <div className="mb-8 pb-6 border-b border-gray-100 dark:border-[#3d3c3e]">
                      <div className="text-center space-y-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {job.position}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {job.companyName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons - Premium design */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#2b2a2c]/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-200/50 dark:border-[#3d3c3e]/50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleConfirmDelete}
                      className="relative flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 dark:shadow-red-500/20 overflow-hidden group"
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                      <span className="relative z-10">Delete</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Message Composer Modal */}
      {isCampaignMode && (
        <MessageComposer
          isOpen={showMessageComposer}
          onClose={() => {
            setShowMessageComposer(false);
            setReplyToMessage(null);
          }}
          onSend={handleSendMessage}
          contactName={job.contactName || job.companyName || 'Contact'}
          companyName={job.companyName || ''}
          defaultChannel="email"
          replyTo={replyToMessage || undefined}
        />
      )}
    </>
  );
};

