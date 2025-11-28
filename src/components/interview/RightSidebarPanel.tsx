import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, Activity, StickyNote, History, Calendar, 
  ChevronRight, MessageSquare, Send, User, Bot, Loader2, 
  ChevronDown, Plus, Mic, Sparkles, Globe, Lightbulb, Square, MicOff
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
  // Chat props
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
  // Chat props
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

  // Cleanup on unmount or tab change
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

  // Reset recording state when tab changes
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

      console.log('🎤 Starting voice recording for chat...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, transcribing...');
        await transcribeAudio();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      console.log('✅ Recording started');

    } catch (err: any) {
      console.error('❌ Error starting recording:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingError('Microphone access denied');
        toast.error('Please allow microphone access');
      } else if (err.name === 'NotFoundError') {
        setRecordingError('No microphone found');
        toast.error('No microphone detected');
      } else {
        setRecordingError('Recording error');
        toast.error('Error starting recording');
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

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
      console.log('🔄 Transcribing with Whisper...');

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) {
        console.log('Audio too short, skipping transcription');
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
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                audioData: base64Audio,
              })
            });

            if (!response.ok) {
              throw new Error('Transcription failed');
            }

            const data = await response.json();

            if (data.status === 'success' && data.transcription) {
              console.log('✅ Transcription received:', data.transcription.substring(0, 50) + '...');
              setMessage?.(data.transcription);
              toast.success('Voice transcribed');
            } else {
              throw new Error(data.message || 'Transcription failed');
            }

            resolve(null);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });

    } catch (error) {
      console.error('❌ Error transcribing:', error);
      toast.error('Transcription failed');
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      'excellent': { label: 'Excellent', color: 'bg-emerald-500', text: 'text-white' },
      'good': { label: 'Good', color: 'bg-blue-500', text: 'text-white' },
      'needs-improvement': { label: 'Needs Work', color: 'bg-amber-500', text: 'text-white' },
      'poor': { label: 'Poor', color: 'bg-red-500', text: 'text-white' }
    };
    return badges[tier as keyof typeof badges] || badges['needs-improvement'];
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
    { 
      text: "How should I introduce myself?", 
      description: "Craft a memorable first impression",
      accentLine: "bg-violet-400/40 dark:bg-violet-400/30 group-hover:bg-violet-500/60 dark:group-hover:bg-violet-400/50",
      hoverBorder: "hover:border-violet-300/60 dark:hover:border-violet-400/20"
    },
    { 
      text: "Common questions for this role", 
      description: "Prepare for what to expect",
      accentLine: "bg-blue-400/40 dark:bg-blue-400/30 group-hover:bg-blue-500/60 dark:group-hover:bg-blue-400/50",
      hoverBorder: "hover:border-blue-300/60 dark:hover:border-blue-400/20"
    },
    { 
      text: "Tips for highlighting experience", 
      description: "Stand out with your background",
      accentLine: "bg-amber-400/40 dark:bg-amber-400/30 group-hover:bg-amber-500/60 dark:group-hover:bg-amber-400/50",
      hoverBorder: "hover:border-amber-300/60 dark:hover:border-amber-400/20"
    },
  ];

  const handleSendMessage = async () => {
    if (sendMessage) {
      await sendMessage();
    }
  };

  const scrollToBottom = () => {
    if (effectiveChatEndRef.current) {
      effectiveChatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setIsUserNearBottom?.(true);
    }
  };

  return (
    <div className="hidden lg:flex fixed right-0 top-0 h-screen w-[400px] bg-white dark:bg-[#1E1F22] border-l border-gray-200 dark:border-[#2A2A2E] shadow-[0_0_40px_rgba(0,0,0,0.05)] z-30 flex-col">
        {/* Tab Headers */}
        <div className="flex-shrink-0 flex items-center justify-around px-2 pt-4 pb-2 border-b border-gray-100 dark:border-[#2A2A2E]">
          {['progress', 'notes', 'history', 'coach'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab as any)}
              className="relative flex-1 pb-3 group"
            >
              <div className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                sidebarTab === tab 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`}>
                {tab === 'progress' && <Activity className="w-4 h-4" />}
                {tab === 'notes' && <StickyNote className="w-4 h-4" />}
                {tab === 'history' && <History className="w-4 h-4" />}
                {tab === 'coach' && <MessageSquare className="w-4 h-4" />}
                <span className="capitalize">{tab === 'coach' ? 'Coach' : tab}</span>
              </div>
              {sidebarTab === tab && (
                <motion.div
                  layoutId="activeTabSidebar"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-white rounded-full mx-3"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {sidebarTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-8 min-h-0 overflow-y-auto custom-scrollbar"
              >
                {/* Progress Header with Circular Indicator */}
                <div className="bg-gray-50 dark:bg-[#1A1A1D] rounded-2xl p-6 flex items-center gap-6 border border-gray-100 dark:border-[#2A2A2E]">
                  <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
                    {/* Background circle */}
                    <svg className="absolute inset-0 h-20 w-20 -rotate-90 transform">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circle */}
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        className="text-indigo-600 dark:text-indigo-500"
                        initial={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 }}
                        animate={{
                          strokeDashoffset: 213.6 - (213.6 * preparationProgress) / 100
                        }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {preparationProgress}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Your Progress
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {milestones.filter((m) => m.completed).length === milestones.length
                        ? "All set! Good luck! 🚀"
                        : `${milestones.length - milestones.filter(m => m.completed).length} steps remaining`}
                    </p>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Milestones
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {milestones.filter((m) => m.completed).length}/{milestones.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <motion.button
                        key={milestone.id}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={milestone.action}
                        className={`
                          group relative w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 border
                          ${milestone.completed
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-white dark:bg-[#1A1A1D] border-gray-100 dark:border-[#2A2A2E] hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className={`
                          flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors
                          ${milestone.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }
                        `}>
                          {milestone.completed ? (
                            <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold mb-0.5 ${
                            milestone.completed ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                          }`}>
                            {milestone.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {milestone.description}
                          </div>
                        </div>

                        {!milestone.completed && (
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 transition-colors self-center" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {sidebarTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-0 flex flex-col overflow-y-auto custom-scrollbar"
              >
                <NotesDocumentManager
                  documents={noteDocuments}
                  activeDocumentId={activeNoteDocumentId}
                  onDocumentsChange={onDocumentsChange}
                  highlightedDocumentId={highlightedDocumentId}
                />
              </motion.div>
            )}

            {sidebarTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-6 min-h-0 overflow-y-auto custom-scrollbar"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Session History
                  </h3>
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                    {sortedHistory.length} Total
                  </span>
                </div>

                {/* Empty State */}
                {sortedHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 dark:border-gray-700 dark:bg-gray-900/20">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                        <History className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No sessions yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Start a "Prepare Live" session to see history
                    </p>
                  </div>
                )}

                {/* Sessions List */}
                <div className="space-y-4">
                  {sortedHistory.map((session, index) => {
                    const tierBadge = getTierBadge(session.tier);
                    
                    return (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onViewHistorySession?.(session)}
                        className="group w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md dark:border-gray-700 dark:bg-[#1A1A1D] dark:hover:border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {formatRelativeDate(session.date)}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Interview Session
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${tierBadge.color} ${tierBadge.text}`}>
                                {tierBadge.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`rounded-lg p-2.5 flex flex-col items-center justify-center ${getScoreBg(session.overallScore)}`}>
                                <span className={`text-xs font-semibold mb-0.5 ${getScoreColor(session.overallScore)}`}>Score</span>
                                <span className={`text-lg font-bold ${getScoreColor(session.overallScore)}`}>{session.overallScore}</span>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5 flex flex-col items-center justify-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Answered</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {session.answeredCount}<span className="text-gray-400 text-sm font-normal">/{session.questionsCount}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-xs text-gray-500 dark:text-gray-400">View detailed analysis</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sidebarTab === 'coach' && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-indigo-500/5"
              >
                {/* Chat Messages Area */}
                <div 
                  ref={effectiveChatContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 coach-scrollbar"
                >
                  {/* Scroll to bottom button */}
                  <AnimatePresence>
                    {!isUserNearBottom && chatMessages.length > 2 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        onClick={scrollToBottom}
                        className="sticky top-2 left-1/2 -translate-x-1/2 z-20 mx-auto px-3 py-1.5 rounded-full bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-lg flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-all"
                      >
                        <ChevronDown className="w-3 h-3" />
                        <span>New messages</span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-5 relative">
                      {/* Subtle radial gradient background */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06)_0%,transparent_70%)] pointer-events-none" />
                      
                      {/* Premium Empty State */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        {/* Refined Icon with subtle glow */}
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          className="relative mb-5"
                        >
                          <div className="absolute inset-0 w-12 h-12 rounded-xl bg-violet-500/20 dark:bg-violet-400/10 blur-xl" />
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 dark:from-violet-400/10 dark:to-purple-500/10 flex items-center justify-center backdrop-blur-sm border border-violet-200/50 dark:border-violet-400/20">
                            <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                          </div>
                        </motion.div>

                        {/* Typography */}
                        <motion.h3
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          className="text-[15px] font-medium tracking-tight text-gray-900 dark:text-white mb-1.5"
                        >
                          Interview Coach
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          className="text-[13px] text-gray-500/80 dark:text-white/40 text-center mb-8 font-light"
                        >
                          Practice answers and get feedback
                        </motion.p>

                        {/* Premium Suggestion Cards */}
                        <div className="w-full space-y-2.5">
                          {chatSuggestions.map((suggestion, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                delay: 0.25 + i * 0.08,
                                duration: 0.5,
                                ease: [0.23, 1, 0.32, 1]
                              }}
                              whileHover={{ 
                                y: -1,
                                transition: { duration: 0.2 }
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setMessage?.(suggestion.text)}
                              className={`
                                w-full group relative overflow-hidden
                                p-3.5 rounded-xl text-left
                                bg-white/60 dark:bg-white/[0.02]
                                border border-gray-200/60 dark:border-white/[0.06]
                                ${suggestion.hoverBorder}
                                hover:bg-white dark:hover:bg-white/[0.04]
                                transition-all duration-300
                              `}
                            >
                              {/* Subtle left accent line */}
                              <div className={`
                                absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full
                                ${suggestion.accentLine}
                                group-hover:h-8
                                transition-all duration-300
                              `} />
                              
                              <div className="pl-2.5">
                                <span className="block text-[13px] font-medium text-gray-800 dark:text-white/85 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                                  {suggestion.text}
                                </span>
                                <span className="block text-[11px] text-gray-400 dark:text-white/30 mt-0.5 font-light">
                                  {suggestion.description}
                                </span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    /* Chat Messages */
                    chatMessages.map((msg, index) => {
                      // Thinking indicator
                      if (msg.role === 'assistant' && msg.content === '__thinking__') {
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-start gap-2.5 max-w-[85%]">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{
                                          duration: 1,
                                          repeat: Infinity,
                                          delay: i * 0.2,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-white/40">Thinking...</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      // Process content
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
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'user' && userPhotoURL ? (
                              <img 
                                src={userPhotoURL} 
                                alt="You" 
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-200 dark:ring-white/20"
                              />
                            ) : (
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' 
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
                              }`}>
                                {msg.role === 'user' 
                                  ? <User className="w-3.5 h-3.5 text-white" /> 
                                  : <Bot className="w-3.5 h-3.5 text-white" />
                                }
                              </div>
                            )}
                            <div className={`px-3.5 py-2.5 rounded-2xl ${
                              msg.role === 'user'
                                ? 'rounded-tr-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm'
                                : 'rounded-tl-md bg-white dark:bg-indigo-500/10 border border-gray-200 dark:border-indigo-500/20 text-gray-800 dark:text-white/90 shadow-sm dark:shadow-none'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {displayContent}
                              </p>
                              {/* Typing cursor */}
                              {msg.role === 'assistant' && 
                               msg.content !== '__thinking__' && 
                               typingMessages[index] !== undefined && 
                               (() => {
                                 const fullText = msg.content.replace(/<think>[\s\S]*<\/think>/g, '').trim();
                                 return typingMessages[index].length < fullText.length;
                               })() && (
                                <span className="inline-block w-0.5 h-3.5 bg-violet-500 dark:bg-violet-400 ml-0.5 animate-pulse" />
                              )}
                              <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400 dark:text-white/30'}`}>
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

                {/* Input Area - Premium Design */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-white/[0.06] bg-white dark:bg-indigo-500/5">
                  {/* Quick Actions Row */}
                  {chatMessages.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={onClearChat}
                        className="text-[10px] text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        Clear chat
                      </button>
                      {position && (
                        <span className="text-[10px] text-gray-400 dark:text-white/20 flex-1 text-right truncate">
                          {position}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30"
                    >
                      <div className="flex items-center gap-1">
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                            className="w-1 rounded-full bg-red-500"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        Recording... {formatRecordingTime(recordingTime)}
                      </span>
                      <button
                        onClick={stopRecording}
                        className="ml-auto text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                      >
                        Stop
                      </button>
                    </motion.div>
                  )}

                  {/* Transcribing Indicator */}
                  {isTranscribing && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                        Transcribing with Whisper AI...
                      </span>
                    </motion.div>
                  )}

                  {/* Input Container */}
                  <div className={`relative flex items-center gap-2 bg-gray-100 dark:bg-indigo-500/10 rounded-xl border transition-all ${
                    isRecording 
                      ? 'border-red-300 dark:border-red-800/50' 
                      : 'border-gray-200 dark:border-white/[0.08] focus-within:border-violet-500/50 focus-within:bg-gray-50 dark:focus-within:bg-white/[0.06]'
                  }`}>
                    <button className="p-2.5 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors flex-shrink-0">
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
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 py-2.5 focus:outline-none resize-none min-h-[40px] max-h-[120px]"
                      style={{ height: 'auto', overflow: 'hidden' }}
                      disabled={isSending || isRecording || isTranscribing}
                    />
                    
                    <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                      {/* Voice Recording Button */}
                      {isTranscribing ? (
                        <div className="p-2 text-violet-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : isRecording ? (
                        <button
                          onClick={toggleRecording}
                          className="p-2 text-red-500 hover:text-red-600 transition-colors relative"
                          title="Stop recording"
                        >
                          <Square className="w-4 h-4 fill-current" />
                          <span className="absolute -top-1 -right-1 text-[9px] font-mono font-medium text-red-500 bg-red-50 dark:bg-red-900/30 px-1 rounded">
                            {formatRecordingTime(recordingTime)}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={toggleRecording}
                          disabled={isSending}
                          className="p-2 text-gray-400 dark:text-white/30 hover:text-violet-500 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
                          title="Record voice message"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={handleSendMessage}
                        disabled={!message?.trim() || isSending || isRecording || isTranscribing}
                        className="p-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-violet-500"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Helper Text */}
                  <p className="text-[10px] text-gray-400 dark:text-white/20 mt-2 text-center">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
        .coach-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .coach-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .coach-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
        .coach-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .coach-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .dark .coach-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
