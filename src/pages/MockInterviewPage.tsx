import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Play,
  Square,
  Building,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  LiveInterviewClient,
  createLiveInterviewClient,
  type JobContext,
  type UserProfile,
} from '../lib/liveInterviewClient';
import type { ConnectionStatus, TranscriptEntry } from '../types/openai-realtime';
import { AIOrb, type OrbState } from '../components/interview/AIOrb';
import { CompanyLogo } from '../components/common/CompanyLogo';

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

type Phase = 'setup' | 'live';

// ============================================
// COMPONENT
// ============================================

export default function MockInterviewPage() {
  const { currentUser } = useAuth();
  
  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');
  
  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const clientRef = useRef<LiveInterviewClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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
    setTranscript([]);
    setPhase('live');
    
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

  const handleBackToSetup = useCallback(async () => {
    await handleStopInterview();
    setTranscript([]);
    setError(null);
    setConnectionStatus('disconnected');
    setPhase('setup');
  }, [handleStopInterview]);

  const handleSelectApplication = (app: JobApplication) => {
    setSelectedApplication(app);
  };

  // ============================================
  // HELPERS
  // ============================================

  const getOrbState = (): OrbState => {
    if (connectionStatus === 'live') {
      if (outputAudioLevel > 0.1) return 'speaking';
      return 'listening';
    }
    return 'idle';
  };

  const getAIStatusLabel = () => {
    if (connectionStatus === 'connecting') return 'Connecting';
    if (connectionStatus === 'live') {
      if (outputAudioLevel > 0.1) return 'Speaking';
      if (inputAudioLevel > 0.1) return 'Listening';
      return 'Listening';
    }
    return 'Ready';
  };

  const getAIStatusColor = () => {
    if (connectionStatus === 'connecting') return 'text-amber-500 dark:text-amber-400';
    if (connectionStatus === 'live') {
      if (outputAudioLevel > 0.1) return 'text-violet-500 dark:text-violet-400';
      return 'text-cyan-500 dark:text-cyan-400';
    }
    return 'text-gray-500';
  };

  const isSessionActive = connectionStatus === 'connecting' || connectionStatus === 'ready' || connectionStatus === 'live';

  // Filter applications based on search query
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.companyName.toLowerCase().includes(query) ||
      app.position.toLowerCase().includes(query)
    );
  });

  // ============================================
  // RENDER - SETUP PHASE
  // ============================================

  const renderSetupPhase = () => (
    <motion.div
      key="setup"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-600/10 to-cyan-600/10 dark:from-violet-600/20 dark:to-cyan-600/20 border border-gray-200 dark:border-white/10 mb-4">
            <Mic className="h-6 w-6 text-violet-500 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
            Mock Interview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a position to practice
          </p>
                      </motion.div>

        {/* Job Selection */}
                      <motion.div
          initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
                      >
                        {isLoadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500 dark:text-violet-400" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
              <Building className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                No job applications found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Add applications from the Job Board to practice
              </p>
            </div>
                        ) : (
            <>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company or position..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              {/* Application List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No matching applications</p>
                  </div>
                ) : (
                  filteredApplications.map((app, index) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.03 }}
                  onClick={() => handleSelectApplication(app)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                    ${selectedApplication?.id === app.id 
                      ? 'bg-violet-500/10 border-violet-500/30' 
                      : 'bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                >
                  <CompanyLogo 
                    companyName={app.companyName} 
                    size="lg" 
                    className="!rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-colors
                      ${selectedApplication?.id === app.id 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                    >
                      {app.companyName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {app.position}
                    </p>
                  </div>
                  {selectedApplication?.id === app.id && (
                    <CheckCircle2 className="h-5 w-5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
                  )}
                </motion.button>
                  ))
                                )}
                          </div>
            </>
                        )}
                      </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            whileHover={{ scale: selectedApplication ? 1.02 : 1 }}
            whileTap={{ scale: selectedApplication ? 0.98 : 1 }}
            onClick={handleStartInterview}
            disabled={!selectedApplication}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all
              ${selectedApplication
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            <Play className="h-4 w-4" />
            Start Interview
          </motion.button>
        </motion.div>
              </div>
    </motion.div>
  );

  // ============================================
  // RENDER - LIVE PHASE
  // ============================================

  const renderLivePhase = () => (
              <motion.div
      key="live"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col"
    >
      {/* Premium Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Company Info */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToSetup}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
              
              {selectedApplication && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                  <CompanyLogo 
                    companyName={selectedApplication.companyName} 
                    size="md" 
                    className="!rounded-lg ring-2 ring-gray-100 dark:ring-gray-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {selectedApplication.companyName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedApplication.position}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Status + Stop */}
            <div className="flex items-center gap-3">
              {/* Live Status Badge */}
              {isSessionActive && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-200 dark:border-emerald-500/20"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Live Session
                  </span>
                </motion.div>
              )}

              {/* Stop Button */}
              {isSessionActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStopInterview}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium transition-all"
                >
                  <Square className="h-3.5 w-3.5" />
                  End Interview
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
                
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Orb Section - Center */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* The Orb */}
            <AIOrb 
              state={getOrbState()} 
              audioLevel={Math.max(inputAudioLevel, outputAudioLevel)}
              className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64"
            />

            {/* Status indicator below orb */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <motion.span 
                  animate={{
                    scale: getOrbState() !== 'idle' ? [1, 1.3, 1] : 1,
                    opacity: getOrbState() !== 'idle' ? [0.6, 1, 0.6] : 0.4
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${
                    getOrbState() === 'speaking' 
                      ? 'bg-violet-500' 
                      : getOrbState() === 'listening' 
                      ? 'bg-cyan-500' 
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  getOrbState() === 'speaking' 
                    ? 'text-violet-600 dark:text-violet-400' 
                    : getOrbState() === 'listening' 
                    ? 'text-cyan-600 dark:text-cyan-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {getOrbState() === 'speaking' 
                    ? 'AI Speaking' 
                    : getOrbState() === 'listening' 
                    ? 'Listening to you' 
                    : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'AI Interviewer'}
                </span>
              </div>
              {selectedApplication && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Interview for {selectedApplication.position}
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
            
        {/* Transcript Panel - Right */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[380px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          {/* Transcript Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                  <Mic className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Live Transcript
                </h2>
              </div>
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${
                connectionStatus === 'live'
                  ? outputAudioLevel > 0.1
                    ? 'bg-violet-50 dark:bg-violet-500/10'
                    : 'bg-cyan-50 dark:bg-cyan-500/10'
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-50 dark:bg-amber-500/10'
                    : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'live' 
                    ? outputAudioLevel > 0.1 
                      ? 'bg-violet-500 dark:bg-violet-400 animate-pulse' 
                      : 'bg-cyan-500 dark:bg-cyan-400 animate-pulse'
                    : connectionStatus === 'connecting'
                      ? 'bg-amber-500 dark:bg-amber-400 animate-pulse'
                      : 'bg-gray-400 dark:bg-gray-500'
                }`} />
                <span className={`text-[11px] font-medium ${getAIStatusColor()}`}>
                  {getAIStatusLabel()}
                </span>
              </div>
            </div>
          </div>
              
              {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-500/10 dark:to-cyan-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center mb-4">
                  <Mic className="h-6 w-6 text-violet-500 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {connectionStatus === 'connecting' 
                    ? 'Connecting...' 
                    : 'Ready to listen'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[180px]">
                  {connectionStatus === 'connecting' 
                    ? 'Setting up your AI interviewer' 
                    : 'The conversation will appear here'}
                </p>
              </div>
                ) : (
                  <>
                    {transcript.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl ${
                          entry.role === 'assistant' 
                            ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700' 
                            : 'bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20'
                        }`}
                      >
                        {/* Role label */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            entry.role === 'assistant' 
                              ? 'text-violet-600 dark:text-violet-400' 
                              : 'text-cyan-600 dark:text-cyan-400'
                          }`}>
                            {entry.role === 'assistant' ? 'AI Interviewer' : 'You'}
                          </span>
                          {!entry.isComplete && (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        
                        {/* Message text */}
                        <p className={`text-sm leading-relaxed ${
                          entry.role === 'assistant' 
                            ? 'text-gray-700 dark:text-gray-200' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {entry.text || (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              Listening...
                            </span>
                          )}
                        </p>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex-shrink-0 mx-4 mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-lg bg-red-100 dark:bg-red-500/20">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-0.5">Connection Error</p>
                    <p className="text-xs text-red-600 dark:text-red-400/90">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </motion.div>
          </div>
    </motion.div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthLayout>
      <div className="h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'setup' ? renderSetupPhase() : renderLivePhase()}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
