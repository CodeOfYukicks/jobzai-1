import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, Activity, StickyNote, History, Calendar, 
  ChevronRight, MessageSquare, Send, User, Bot, Loader2, 
  ChevronDown, Plus, Mic, Square, MicOff
} from 'lucide-react';
import NotesDocumentManager from './NotesDocumentManager';
import { NoteDocument } from './DocumentsLibrary';
import { toast } from 'sonner';

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
}: RightSidebarPanelProps) {
  
  const localChatEndRef = useRef<HTMLDivElement>(null);
  const localChatContainerRef = useRef<HTMLDivElement>(null);
  
  const effectiveChatEndRef = chatEndRef || localChatEndRef;
  const effectiveChatContainerRef = chatContainerRef || localChatContainerRef;

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
        toast.error('Please allow microphone access');
      } else {
        setRecordingError('Recording error');
        toast.error('Error starting recording');
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
              toast.success('Voice transcribed');
            }
            resolve(null);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
    } catch (error) {
      toast.error('Transcription failed');
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
    <div className="hidden lg:flex fixed right-0 top-0 h-screen w-[380px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-30 flex-col">
      
      {/* Tab Headers - Notion style */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = sidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-4
                  text-sm font-medium transition-colors duration-200
                  border-b-2 -mb-px
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xl:inline">{tab.label}</span>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6 min-h-0 overflow-y-auto"
            >
              {/* Progress Header - Google Blue accent */}
              <div className="flex items-center gap-5">
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 h-16 w-16 -rotate-90 transform">
                    <circle
                      cx="32" cy="32" r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <motion.circle
                      cx="32" cy="32" r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className="text-blue-500"
                      initial={{ strokeDasharray: 175.9, strokeDashoffset: 175.9 }}
                      animate={{ strokeDashoffset: 175.9 - (175.9 * preparationProgress) / 100 }}
                      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </svg>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {preparationProgress}%
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Preparation
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {milestones.filter((m) => m.completed).length}/{milestones.length} completed
                  </p>
                </div>
              </div>

              {/* Milestones - Monochrome style */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-400 dark:text-slate-500">
                  Milestones
                </span>

                <div className="space-y-1">
                  {milestones.map((milestone, index) => (
                    <button
                      key={milestone.id}
                      type="button"
                      onClick={milestone.action}
                      className={`
                        group w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
                        ${milestone.completed
                          ? 'bg-slate-50 dark:bg-slate-800/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                        ${milestone.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        }
                      `}>
                        {milestone.completed ? (
                          <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          milestone.completed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {milestone.label}
                        </div>
                      </div>

                      {!milestone.completed && (
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTES TAB */}
          {sidebarTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4 min-h-0 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-400 dark:text-slate-500">
                  Session History
                </span>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {sortedHistory.length} total
                </span>
              </div>

              {/* Empty State */}
              {sortedHistory.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <History className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">No sessions yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Start a practice session
                  </p>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-2">
                {sortedHistory.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onViewHistorySession?.(session)}
                    className="group w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            {formatRelativeDate(session.date)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          Practice Session
                        </div>
                      </div>
                      {/* Score badge - Google colors */}
                      <span className={`
                        px-2 py-1 rounded-md text-xs font-bold
                        ${session.overallScore >= 80 
                          ? 'bg-green-500 text-white' 
                          : session.overallScore >= 60
                          ? 'bg-blue-500 text-white'
                          : session.overallScore >= 40
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                        }
                      `}>
                        {session.overallScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{session.answeredCount}/{session.questionsCount} answered</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* COACH TAB */}
          {sidebarTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
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
                      className="sticky top-2 left-1/2 -translate-x-1/2 z-20 mx-auto px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>New messages</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center px-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-4">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      Interview Coach
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6">
                      Practice answers and get feedback
                    </p>

                    {/* Suggestion Cards - Minimal */}
                    <div className="w-full space-y-2">
                      {chatSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setMessage?.(suggestion.text)}
                          className="w-full p-3 rounded-lg text-left border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                        >
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {suggestion.text}
                          </span>
                          <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {suggestion.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Chat Messages - Monochrome */
                  chatMessages.map((msg, index) => {
                    if (msg.role === 'assistant' && msg.content === '__thinking__') {
                      return (
                        <div key={index} className="flex justify-start">
                          <div className="flex items-start gap-2.5 max-w-[85%]">
                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-slate-500">Thinking...</span>
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
                        <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {msg.role === 'user' && userPhotoURL ? (
                            <img 
                              src={userPhotoURL} 
                              alt="You" 
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === 'user' 
                                ? 'bg-slate-200 dark:bg-slate-700' 
                                : 'bg-blue-500'
                            }`}>
                              {msg.role === 'user' 
                                ? <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> 
                                : <Bot className="w-3.5 h-3.5 text-white" />
                              }
                            </div>
                          )}
                          <div className={`px-3.5 py-2.5 rounded-2xl ${
                            msg.role === 'user'
                              ? 'rounded-tr-md bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                              : 'rounded-tl-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {displayContent}
                            </p>
                            {msg.role === 'assistant' && 
                             msg.content !== '__thinking__' && 
                             typingMessages[index] !== undefined && 
                             (() => {
                               const fullText = msg.content.replace(/<think>[\s\S]*<\/think>/g, '').trim();
                               return typingMessages[index].length < fullText.length;
                             })() && (
                              <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse" />
                            )}
                            <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 dark:text-slate-500' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={effectiveChatEndRef} />
              </div>

              {/* Input Area - Monochrome */}
              <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {chatMessages.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={onClearChat}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Clear chat
                    </button>
                  </div>
                )}
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 rounded-full bg-slate-900 dark:bg-white"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Recording... {formatRecordingTime(recordingTime)}
                    </span>
                    <button onClick={stopRecording} className="ml-auto text-xs text-slate-500 hover:text-slate-700 font-medium">
                      Stop
                    </button>
                  </div>
                )}

                {/* Transcribing Indicator */}
                {isTranscribing && (
                  <div className="flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span className="text-xs font-medium text-slate-500">
                      Transcribing...
                    </span>
                  </div>
                )}

                {/* Input Container */}
                <div className={`relative flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border transition-all ${
                  isRecording 
                    ? 'border-slate-400 dark:border-slate-600' 
                    : 'border-slate-200 dark:border-slate-700 focus-within:border-slate-400 dark:focus-within:border-slate-600'
                }`}>
                  <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
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
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 py-2.5 focus:outline-none resize-none min-h-[40px] max-h-[120px]"
                    disabled={isSending || isRecording || isTranscribing}
                  />
                  
                  <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                    {isTranscribing ? (
                      <div className="p-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : isRecording ? (
                      <button
                        onClick={toggleRecording}
                        className="p-2 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Stop recording"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={toggleRecording}
                        disabled={isSending}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                        title="Record voice message"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSendMessage}
                      disabled={!message?.trim() || isSending || isRecording || isTranscribing}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 mt-2 text-center">
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
