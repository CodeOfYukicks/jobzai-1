import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Play,
  Square,
  ChevronDown,
  Wifi,
  WifiOff,
  Volume2,
  User,
  Bot,
  Briefcase,
  Building,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  LiveInterviewClient,
  createLiveInterviewClient,
  type JobContext,
  type UserProfile,
} from '../lib/liveInterviewClient';
import type { ConnectionStatus, TranscriptEntry } from '../types/openai-realtime';

// ============================================
// INTERFACES
// ============================================

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location?: string;
  jobDescription?: string;
  requirements?: string[];
  status: string;
}

// ============================================
// COMPONENT
// ============================================

export default function MockInterviewPage() {
  const { currentUser } = useAuth();
  
  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const clientRef = useRef<LiveInterviewClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================
  // EFFECTS
  // ============================================

  // Load user's job applications
  useEffect(() => {
    const loadApplications = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingApplications(true);
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const snapshot = await getDocs(query(applicationsRef));
        
        const apps: JobApplication[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          apps.push({
            id: doc.id,
            companyName: data.companyName || 'Unknown Company',
            position: data.position || 'Unknown Position',
            location: data.location,
            jobDescription: data.jobDescription || data.description,
            requirements: data.requirements,
            status: data.status || 'pending',
          });
        });
        
        // Sort by company name
        apps.sort((a, b) => a.companyName.localeCompare(b.companyName));
        setApplications(apps);
      } catch (error) {
        console.error('Error loading applications:', error);
        toast.error('Failed to load job applications');
      } finally {
        setIsLoadingApplications(false);
      }
    };
    
    loadApplications();
  }, [currentUser]);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || currentUser.email,
            currentPosition: data.currentPosition,
            yearsOfExperience: data.yearsOfExperience,
            skills: data.skills || [],
            education: data.educationLevel ? `${data.educationLevel} in ${data.educationField || 'General Studies'}` : undefined,
            cvText: data.cvText,
            targetPosition: data.targetPosition,
            targetSectors: data.targetSectors,
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [currentUser]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stop();
      }
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleStartInterview = useCallback(async () => {
    if (!selectedApplication) {
      toast.error('Please select a job application first');
      return;
    }
    
    if (!userProfile) {
      toast.error('User profile not loaded. Please try again.');
      return;
    }
    
    setError(null);
    
    // Create job context from selected application
    const jobContext: JobContext = {
      companyName: selectedApplication.companyName,
      position: selectedApplication.position,
      jobDescription: selectedApplication.jobDescription,
      requirements: selectedApplication.requirements,
    };
    
    // Create client with callbacks
    const client = createLiveInterviewClient({
      onConnectionStatusChange: setConnectionStatus,
      onTranscriptUpdate: setTranscript,
      onAudioLevelChange: (level, source) => {
        if (source === 'input') {
          setInputAudioLevel(level);
        } else {
          setOutputAudioLevel(level);
        }
      },
      onError: (err) => {
        console.error('Interview client error:', err);
        setError(err.message);
        toast.error(err.message);
      },
      onSessionStarted: () => {
        toast.success('Interview session started');
      },
      onSessionEnded: () => {
        toast.info('Interview session ended');
      },
    });
    
    clientRef.current = client;
    
    try {
      await client.start(jobContext, userProfile);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
    }
  }, [selectedApplication, userProfile]);

  const handleStopInterview = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.stop();
      clientRef.current = null;
    }
  }, []);

  const handleSelectApplication = (app: JobApplication) => {
    setSelectedApplication(app);
    setIsDropdownOpen(false);
  };

  // ============================================
  // HELPERS
  // ============================================

  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'disconnected':
        return { label: 'Ready', color: 'bg-gray-400', icon: WifiOff, pulse: false };
      case 'connecting':
        return { label: 'Connecting...', color: 'bg-amber-400', icon: Wifi, pulse: true };
      case 'ready':
        return { label: 'Connected', color: 'bg-blue-400', icon: Wifi, pulse: false };
      case 'live':
        return { label: 'Live', color: 'bg-green-500', icon: CheckCircle2, pulse: true };
      case 'ended':
        return { label: 'Session Ended', color: 'bg-gray-400', icon: CheckCircle2, pulse: false };
      case 'error':
        return { label: 'Error', color: 'bg-red-500', icon: AlertCircle, pulse: false };
      default:
        return { label: 'Unknown', color: 'bg-gray-400', icon: WifiOff, pulse: false };
    }
  };

  const isSessionActive = connectionStatus === 'connecting' || connectionStatus === 'ready' || connectionStatus === 'live';

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthLayout>
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Title and Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#8B85FF] shadow-lg shadow-[#635BFF]/20">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Mock Interview
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI-powered voice interview practice
                    </p>
                  </div>
                </div>
                
                {/* Connection Status Badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = getStatusConfig(connectionStatus);
                    const StatusIcon = config.icon;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}/10 border border-current/20`}
                      >
                        <div className="relative">
                          <StatusIcon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
                          {config.pulse && (
                            <span className={`absolute inset-0 rounded-full ${config.color} animate-ping opacity-50`} />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${config.color.replace('bg-', 'text-')}`}>
                          {config.label}
                        </span>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Application Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isSessionActive}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all
                      ${isSessionActive 
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-60' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-[#635BFF] dark:hover:border-[#635BFF] hover:shadow-md'
                      }`}
                  >
                    {selectedApplication ? (
                      <>
                        <Building className="h-4 w-4 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedApplication.companyName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedApplication.position}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Select a job application
                        </span>
                      </>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50"
                      >
                        {isLoadingApplications ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#635BFF]" />
                          </div>
                        ) : applications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Briefcase className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No job applications found
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Add applications from the Job Board
                            </p>
                          </div>
                        ) : (
                          <div className="py-2">
                            {applications.map((app) => (
                              <button
                                key={app.id}
                                onClick={() => handleSelectApplication(app)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                  ${selectedApplication?.id === app.id ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''}`}
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                  <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {app.companyName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {app.position}
                                  </p>
                                </div>
                                {selectedApplication?.id === app.id && (
                                  <CheckCircle2 className="h-4 w-4 text-[#635BFF]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Start/Stop Button */}
                {isSessionActive ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStopInterview}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/20 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    Stop Interview
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartInterview}
                    disabled={!selectedApplication}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all
                      ${selectedApplication
                        ? 'bg-gradient-to-r from-[#635BFF] to-[#8B85FF] hover:from-[#5248e6] hover:to-[#7c75ff] text-white shadow-[#635BFF]/20'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                      }`}
                  >
                    <Play className="h-4 w-4" />
                    Start Interview
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Audio Visualizers Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Input (Microphone) Visualizer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isSessionActive && inputAudioLevel > 0.1 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {isSessionActive ? (
                      <Mic className={`h-5 w-5 ${inputAudioLevel > 0.1 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    ) : (
                      <MicOff className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Your Voice</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Microphone input</p>
                  </div>
                </div>
                
                {/* Equalizer Bars */}
                <div className="flex items-end justify-center gap-1 h-32">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const baseHeight = isSessionActive ? Math.random() * 0.3 + 0.1 : 0.05;
                    const height = isSessionActive ? Math.max(baseHeight, inputAudioLevel * (0.5 + Math.random() * 0.5)) : baseHeight;
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: `${height * 100}%` }}
                        transition={{ duration: 0.1 }}
                        className={`w-4 rounded-full ${
                          isSessionActive && inputAudioLevel > 0.1
                            ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ minHeight: '4px' }}
                      />
                    );
                  })}
                </div>
              </motion.div>
              
              {/* Output (AI) Visualizer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isSessionActive && outputAudioLevel > 0.1 ? 'bg-[#635BFF]/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Volume2 className={`h-5 w-5 ${isSessionActive && outputAudioLevel > 0.1 ? 'text-[#635BFF]' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Interviewer</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Audio output</p>
                  </div>
                </div>
                
                {/* Equalizer Bars */}
                <div className="flex items-end justify-center gap-1 h-32">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const baseHeight = isSessionActive ? Math.random() * 0.3 + 0.1 : 0.05;
                    const height = isSessionActive ? Math.max(baseHeight, outputAudioLevel * (0.5 + Math.random() * 0.5)) : baseHeight;
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: `${height * 100}%` }}
                        transition={{ duration: 0.1 }}
                        className={`w-4 rounded-full ${
                          isSessionActive && outputAudioLevel > 0.1
                            ? 'bg-gradient-to-t from-[#635BFF] to-[#A5A0FF]'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ minHeight: '4px' }}
                      />
                    );
                  })}
                </div>
              </motion.div>
              
              {/* Tips Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#635BFF]/5 to-[#8B85FF]/5 dark:from-[#635BFF]/10 dark:to-[#8B85FF]/10 rounded-2xl border border-[#635BFF]/20 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-[#635BFF]" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tips</h3>
                </div>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#635BFF] mt-0.5">•</span>
                    Speak clearly and at a natural pace
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#635BFF] mt-0.5">•</span>
                    Use the STAR method for behavioral questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#635BFF] mt-0.5">•</span>
                    Take a moment to think before answering
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#635BFF] mt-0.5">•</span>
                    You can interrupt the AI at any time
                  </li>
                </ul>
              </motion.div>
            </div>
            
            {/* Transcript Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden"
            >
              {/* Transcript Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Transcript
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time conversation transcript
                </p>
              </div>
              
              {/* Transcript Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <Mic className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Ready to Practice
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                      Select a job application and click "Start Interview" to begin your mock interview session.
                    </p>
                  </div>
                ) : (
                  <>
                    {transcript.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.role === 'assistant'
                            ? 'bg-gradient-to-br from-[#635BFF] to-[#8B85FF]'
                            : 'bg-gradient-to-br from-emerald-500 to-green-600'
                        }`}>
                          {entry.role === 'assistant' ? (
                            <Bot className="h-4 w-4 text-white" />
                          ) : (
                            <User className="h-4 w-4 text-white" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex-1 max-w-[80%] ${entry.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block px-4 py-3 rounded-2xl ${
                            entry.role === 'assistant'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                              : 'bg-[#635BFF] text-white rounded-tr-none'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {entry.text || (
                                <span className="flex items-center gap-2 text-gray-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Listening...
                                </span>
                              )}
                            </p>
                          </div>
                          {!entry.isComplete && entry.text && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-400">
                                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                {entry.role === 'assistant' ? 'Speaking...' : 'Transcribing...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </>
                )}
              </div>
              
              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex-shrink-0 mx-6 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Connection Error
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

