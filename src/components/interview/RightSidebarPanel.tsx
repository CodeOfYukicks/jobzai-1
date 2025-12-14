import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, Activity, StickyNote, History, Calendar, 
  ChevronRight, MessageSquare, Send, User, Bot, Loader2, 
  ChevronDown, ChevronUp, Plus, Mic, Square, Sparkles
} from 'lucide-react';
import NotesDocumentManager from './NotesDocumentManager';
import { NoteDocument } from './DocumentsLibrary';
import { notify } from '@/lib/notify';
import ContextDocumentSelector, { ContextDocument } from './ContextDocumentSelector';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface LiveSessionRecord {
  id: string;
  date: string;
  timestamp: number;
  questionsCount: number;
  answeredCount: number;
  overallScore: number;
  passed: boolean;
  tier: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  analysis: any;
  answers: Record<number, string>;
  questions?: any[];
}

interface Milestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action: () => void;
}

interface RightSidebarPanelProps {
  preparationProgress: number;
  milestones: Milestone[];
  sidebarTab: 'progress' | 'notes' | 'history' | 'coach';
  setSidebarTab: (tab: 'progress' | 'notes' | 'history' | 'coach') => void;
  noteDocuments: NoteDocument[];
  activeNoteDocumentId: string | null;
  onDocumentsChange: (documents: NoteDocument[], activeDocumentId: string | null) => void;
  liveSessionHistory?: LiveSessionRecord[];
  onViewHistorySession?: (session: LiveSessionRecord) => void;
  highlightedDocumentId?: string | null;
  chatMessages?: ChatMessage[];
  message?: string;
  setMessage?: (text: string) => void;
  sendMessage?: () => Promise<void>;
  isSending?: boolean;
  typingMessages?: Record<number, string>;
  isUserNearBottom?: boolean;
  setIsUserNearBottom?: (value: boolean) => void;
  chatEndRef?: React.RefObject<HTMLDivElement>;
  chatContainerRef?: React.RefObject<HTMLDivElement>;
  onClearChat?: () => void;
  position?: string;
  userPhotoURL?: string | null;
  contextDocuments?: ContextDocument[];
  onContextDocumentsChange?: (documents: ContextDocument[]) => void;
  userId?: string;
}

export default function RightSidebarPanel({
  preparationProgress,
  milestones,
  sidebarTab,
  setSidebarTab,
  noteDocuments,
  activeNoteDocumentId,
  onDocumentsChange,
  liveSessionHistory = [],
  onViewHistorySession,
  highlightedDocumentId,
  chatMessages = [],
  message = '',
  setMessage,
  sendMessage,
  isSending = false,
  typingMessages = {},
  isUserNearBottom = true,
  setIsUserNearBottom,
  chatEndRef,
  chatContainerRef,
  onClearChat,
  position,
  userPhotoURL,
  contextDocuments = [],
  onContextDocumentsChange,
  userId,
}: RightSidebarPanelProps) {
  
  const localChatEndRef = useRef<HTMLDivElement>(null);
  const localChatContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  const effectiveChatEndRef = chatEndRef || localChatEndRef;
  const effectiveChatContainerRef = chatContainerRef || localChatContainerRef;

  // Context section collapse state
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  
  // Tab indicator position state
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  // Calculate indicator position based on active tab
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeButton = tabsContainerRef.current.querySelector(`[data-tab-id="${sidebarTab}"]`) as HTMLButtonElement;
      if (activeButton) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [sidebarTab]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.error('Error stopping media recorder:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (sidebarTab !== 'coach') {
      setIsRecording(false);
      setIsTranscribing(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [sidebarTab]);

  const startRecording = async () => {
    try {
      setRecordingError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => await transcribeAudio();
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setRecordingError('Microphone access denied');
        notify.error('Please allow microphone access');
      } else {
        setRecordingError('Recording error');
        notify.error('Error starting recording');
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error('Error stopping media recorder:', e);
      }
    }
  };

  const transcribeAudio = async () => {
    try {
      setIsTranscribing(true);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size < 1000) {
        setIsTranscribing(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const response = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Audio })
            });

            if (!response.ok) throw new Error('Transcription failed');
            const data = await response.json();

            if (data.status === 'success' && data.transcription) {
              setMessage?.(data.transcription);
              notify.success('Voice transcribed');
            }
            resolve(null);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
    } catch (error) {
      notify.error('Transcription failed');
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedHistory = [...liveSessionHistory].sort((a, b) => b.timestamp - a.timestamp);

  const chatSuggestions = [
    { text: "How should I introduce myself?", description: "Craft a memorable first impression" },
    { text: "Common questions for this role", description: "Prepare for what to expect" },
    { text: "Tips for highlighting experience", description: "Stand out with your background" },
  ];

  const handleSendMessage = async () => {
    if (sendMessage) await sendMessage();
  };

  const scrollToBottom = () => {
    if (effectiveChatEndRef.current) {
      effectiveChatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setIsUserNearBottom?.(true);
    }
  };

  const tabs = [
    { id: 'progress', icon: Activity, label: 'Progress' },
    { id: 'notes', icon: StickyNote, label: 'Notes' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'coach', icon: MessageSquare, label: 'Coach' },
  ];

  return (
    <div className="hidden lg:flex fixed right-0 top-12 h-[calc(100vh-48px)] w-[400px] bg-white dark:bg-[#2b2a2c] border-l border-gray-100 dark:border-[#3d3c3e] z-30 flex-col">
      
      {/* Tab Headers - Minimal style */}
      <div className="flex-shrink-0">
        <div className="relative flex border-b border-gray-100 dark:border-[#3d3c3e]" ref={tabsContainerRef}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = sidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => setSidebarTab(tab.id as any)}
                className={`relative flex-1 px-4 py-3.5 text-xs font-medium transition-all ${isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="sidebarTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* PROGRESS TAB */}
          {sidebarTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-8 space-y-8 min-h-0 overflow-y-auto"
            >
              {/* Progress Header - Premium Minimalist Design */}
              <div className="flex items-center gap-8">
                <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
                  {/* Subtle background circle */}
                  <svg className="absolute inset-0 h-24 w-24 -rotate-90 transform">
                    <circle
                      cx="48" cy="48" r="42"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <motion.circle
                      cx="48" cy="48" r="42"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      stroke="#b7e219"
                      initial={{ strokeDasharray: 263.9, strokeDashoffset: 263.9 }}
                      animate={{ strokeDashoffset: 263.9 - (263.9 * preparationProgress) / 100 }}
                      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </svg>
                  <span className="relative text-2xl font-bold text-white dark:text-white tracking-tight">
                    {preparationProgress}%
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white dark:text-white mb-1">
                    Preparation
                  </h3>
                  <p className="text-sm font-normal text-gray-400 dark:text-gray-400">
                    {milestones.filter((m) => m.completed).length}/{milestones.length} completed
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">
                  Milestones
                </span>

                <div className="space-y-2">
                  {milestones.map((milestone, index) => (
                    <motion.button
                      key={milestone.id}
                      type="button"
                      onClick={milestone.action}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      className={`
                        group w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200
                        ${milestone.completed
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30'
                          : 'bg-white dark:bg-[#26262B]/50 ring-1 ring-gray-200/60 dark:ring-gray-800/60 hover:ring-gray-300/80 dark:hover:ring-gray-700/60 hover:bg-gray-50 dark:hover:bg-[#26262B]'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all
                        ${milestone.completed
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        }
                      `}>
                        {milestone.completed ? (
                          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                        ) : (
                          <span className="text-xs font-semibold">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          milestone.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-white'
                        }`}>
                          {milestone.label}
                        </div>
                      </div>

                      {!milestone.completed && (
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTES TAB */}
          {sidebarTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="min-h-0 flex flex-col overflow-y-auto"
            >
              <NotesDocumentManager
                documents={noteDocuments}
                activeDocumentId={activeNoteDocumentId}
                onDocumentsChange={onDocumentsChange}
                highlightedDocumentId={highlightedDocumentId}
              />
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {sidebarTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-4 min-h-0 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">
                  Session History
                </span>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {sortedHistory.length}
                </span>
              </div>

              {/* Empty State */}
              {sortedHistory.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 mx-auto bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <History className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No sessions yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px] mx-auto">
                    Start a practice session to track your progress
                  </p>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-3">
                {sortedHistory.map((session, index) => (
                  <motion.button
                    key={session.id}
                    onClick={() => onViewHistorySession?.(session)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group w-full p-4 rounded-xl bg-white dark:bg-[#26262B]/50 ring-1 ring-gray-200/60 dark:ring-gray-800/60 text-left transition-all hover:ring-gray-300/80 dark:hover:ring-gray-700/60 hover:bg-gray-50 dark:hover:bg-[#26262B]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            {formatRelativeDate(session.date)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          Practice Session
                        </div>
                      </div>
                      {/* Score badge */}
                      <span className={`
                        px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm
                        ${session.overallScore >= 80 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                          : session.overallScore >= 60
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : session.overallScore >= 40
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
                        }
                      `}>
                        {session.overallScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{session.answeredCount}/{session.questionsCount} answered</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* COACH TAB */}
          {sidebarTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Context Section - Premium Notion/Vercel Style */}
              {userId && (
                <div className="flex-shrink-0">
                  {/* Context Header */}
                  <button
                    onClick={() => setIsContextExpanded(!isContextExpanded)}
                    className="group w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-200"
                  >
                    {/* Animated chevron */}
                    <motion.div
                      initial={false}
                      animate={{ rotate: isContextExpanded ? 90 : 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    </motion.div>
                    
                    <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 tracking-[-0.01em]">
                      Context
                    </span>
                    
                    {/* Document count badge */}
                    {contextDocuments.length > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/60 rounded">
                        {contextDocuments.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Context Content - Collapsible */}
                  <AnimatePresence initial={false}>
                    {isContextExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4">
                          <ContextDocumentSelector
                            selectedDocuments={contextDocuments}
                            onDocumentsChange={onContextDocumentsChange || (() => {})}
                            userId={userId}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Subtle separator */}
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200/60 dark:via-gray-700/40 to-transparent" />
                </div>
              )}

              {/* Chat Messages Area */}
              <div 
                ref={effectiveChatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              >
                {/* Scroll to bottom button */}
                <AnimatePresence>
                  {!isUserNearBottom && chatMessages.length > 2 && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={scrollToBottom}
                      className="sticky top-2 left-1/2 -translate-x-1/2 z-20 mx-auto px-3 py-1.5 rounded-full bg-white dark:bg-[#26262B] ring-1 ring-gray-200/60 dark:ring-gray-800/60 shadow-lg flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>New messages</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center px-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/30 shadow-inner">
                      <Sparkles className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      Interview Coach
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6 max-w-[220px]">
                      Practice answers and get AI-powered feedback
                    </p>

                    {/* Suggestion Cards */}
                    <div className="w-full space-y-2">
                      {chatSuggestions.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setMessage?.(suggestion.text)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full p-3.5 rounded-xl text-left bg-white dark:bg-[#26262B]/50 ring-1 ring-gray-200/60 dark:ring-gray-800/60 hover:ring-gray-300/80 dark:hover:ring-gray-700/60 hover:bg-gray-50 dark:hover:bg-[#26262B] transition-all"
                        >
                          <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                            {suggestion.text}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {suggestion.description}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Chat Messages - Premium styling */
                  chatMessages.map((msg, index) => {
                    if (msg.role === 'assistant' && msg.content === '__thinking__') {
                      return (
                        <div key={index} className="flex justify-start">
                          <div className="flex items-start gap-2.5 max-w-[85%]">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-gray-100 dark:bg-gray-800">
                              <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-lg bg-gray-50 dark:bg-[#26262B] ring-1 ring-gray-200/60 dark:ring-gray-800/60">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    let displayContent = msg.content;
                    
                    // Clean up assistant messages
                    if (msg.role === 'assistant' && msg.content !== '__thinking__') {
                      // Remove reasoning tags and clean up
                      const fullText = displayContent
                        .replace(/<think>[\s\S]*?<\/think>/g, '')
                        .replace(/\[\d+\]/g, '') // Remove citation numbers
                        .trim();
                      
                      // Use typed text if available and animation is in progress
                      if (typingMessages[index] !== undefined) {
                        const typedText = typingMessages[index];
                        if (typedText.length > 0 && typedText.length < fullText.length) {
                          // Animation in progress - use typed text
                          displayContent = typedText;
                        } else if (typedText.length === fullText.length) {
                          // Animation complete - use full text
                          displayContent = fullText;
                        } else {
                          // Fallback to full text if typing message seems incorrect
                          displayContent = fullText;
                        }
                      } else {
                        // No typing animation data - show full text
                        displayContent = fullText;
                      }
                    }

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {msg.role === 'user' && userPhotoURL ? (
                            <img 
                              src={userPhotoURL} 
                              alt="You" 
                              className="w-8 h-8 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-200/60 dark:ring-gray-800/60"
                            />
                          ) : (
                            <div 
                              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                msg.role === 'user' 
                                  ? 'bg-gray-200 dark:bg-gray-800' 
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              {msg.role === 'user' 
                                ? <User className="w-4 h-4 text-gray-600 dark:text-gray-300" /> 
                                : <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              }
                            </div>
                          )}
                          <div 
                            className={`px-4 py-3 rounded-2xl ${
                              msg.role === 'user'
                                ? 'rounded-tr-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                                : 'rounded-tl-lg bg-gray-50 dark:bg-[#26262B] ring-1 ring-gray-200/60 dark:ring-gray-800/60 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {displayContent}
                            </p>
                            {msg.role === 'assistant' && 
                             msg.content !== '__thinking__' && 
                             typingMessages[index] !== undefined && 
                             (() => {
                               const fullText = msg.content
                                 .replace(/<think>[\s\S]*?<\/think>/g, '')
                                 .trim();
                               const typedText = typingMessages[index];
                               return typedText && typedText.length > 0 && typedText.length < fullText.length;
                             })() && (
                              <span className="inline-block w-0.5 h-4 bg-gray-400 dark:bg-gray-500 ml-0.5 animate-pulse" />
                            )}
                            <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/60 dark:text-gray-900/60' : 'text-gray-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={effectiveChatEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800/80 bg-white/80 dark:bg-[#1A1A1D]/80 backdrop-blur-sm">
                {chatMessages.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={onClearChat}
                      className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Clear chat
                    </button>
                  </div>
                )}
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 mb-3 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 ring-1 ring-gray-200/50 dark:ring-gray-700/30">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 14, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 rounded-full bg-gray-500 dark:bg-gray-400"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Recording... {formatRecordingTime(recordingTime)}
                    </span>
                    <button onClick={stopRecording} className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold">
                      Stop
                    </button>
                  </div>
                )}

                {/* Transcribing Indicator */}
                {isTranscribing && (
                  <div className="flex items-center justify-center gap-2 mb-3 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-[#26262B] ring-1 ring-gray-200/60 dark:ring-gray-800/60">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">
                      Transcribing...
                    </span>
                  </div>
                )}

                {/* Input Container */}
                <div className={`relative flex items-center gap-2 bg-gray-50/80 dark:bg-[#26262B]/50 rounded-xl ring-1 transition-all ${
                  isRecording 
                    ? 'ring-gray-400/50 dark:ring-gray-600/50' 
                    : 'ring-gray-200/60 dark:ring-gray-800/60 focus-within:ring-gray-400/50 dark:focus-within:ring-gray-600/50'
                }`}>
                  <button className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0">
                    <Plus className="w-5 h-5" />
                  </button>
                  
                  <textarea
                    value={message}
                    onChange={(e) => setMessage?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isRecording ? "Recording..." : isTranscribing ? "Transcribing..." : "Ask a question..."}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 py-3 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
                    disabled={isSending || isRecording || isTranscribing}
                  />
                  
                  <div className="flex items-center gap-1.5 pr-2 flex-shrink-0">
                    {isTranscribing ? (
                      <div className="p-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : isRecording ? (
                      <button
                        onClick={toggleRecording}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Stop recording"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={toggleRecording}
                        disabled={isSending}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                        title="Record voice message"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    <motion.button
                      onClick={handleSendMessage}
                      disabled={!message?.trim() || isSending || isRecording || isTranscribing}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-400 mt-2.5 text-center">
                  Press Enter to send
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
