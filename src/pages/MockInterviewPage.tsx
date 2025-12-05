import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, getDoc, addDoc, updateDoc, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
  X,
  History,
  Clock,
  ChevronRight,
  Trash2,
  Headphones,
  Volume2,
  BarChart3,
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

interface InterviewAnalysis {
  summary: string;
  answerQuality?: {
    didTheyAnswer: string;
    specificExamples: string;
    starMethodUsage: string;
  };
  jobFit?: {
    score: number;
    assessment: string;
    missingSkills: string[];
    relevantExperience: string;
  };
  strengths: string[];
  improvements: string[];
  scores: {
    communication: number;
    relevance: number;
    structure: number;
    confidence: number;
    overall: number;
  };
  memorableQuotes?: {
    good: string;
    needsWork: string;
  };
  recommendation: string;
}

// Interface for saved mock interview sessions
export interface MockInterviewSession {
  id: string;
  date: string;
  applicationId: string;
  companyName: string;
  position: string;
  elapsedTime: number;
  transcript: TranscriptEntry[];
  analysis: InterviewAnalysis | null;
  createdAt?: any;
}

type Phase = 'setup' | 'preparation' | 'live' | 'results';

// ============================================
// COMPONENT
// ============================================

export default function MockInterviewPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
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
  
  // Past sessions state
  const [pastSessions, setPastSessions] = useState<MockInterviewSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Results state
  const [finalTranscript, setFinalTranscript] = useState<TranscriptEntry[]>([]);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
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

  // Load past mock interview sessions
  useEffect(() => {
    const loadPastSessions = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingSessions(true);
        const sessionsRef = collection(db, 'users', currentUser.uid, 'mockInterviewSessions');
        
        // Try with orderBy first, fallback to simple query if index doesn't exist
        let snapshot;
        try {
          snapshot = await getDocs(query(sessionsRef, orderBy('createdAt', 'desc')));
        } catch (indexError) {
          console.warn('Firestore index not ready, using unordered query:', indexError);
          snapshot = await getDocs(query(sessionsRef));
        }
        
        const sessions: MockInterviewSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sessions.push({
            id: docSnap.id,
            date: data.date,
            applicationId: data.applicationId,
            companyName: data.companyName,
            position: data.position,
            elapsedTime: data.elapsedTime,
            transcript: data.transcript || [],
            analysis: data.analysis,
            createdAt: data.createdAt,
          });
        });
        
        // Sort by date if we got unordered results
        sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log('📋 Loaded past sessions:', sessions.length);
        setPastSessions(sessions);
      } catch (error) {
        console.error('Error loading past sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    
    loadPastSessions();
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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer effect - updates every second during live phase
  useEffect(() => {
    if (phase === 'live' && connectionStatus === 'live') {
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        if (clientRef.current) {
          const elapsed = Math.floor(clientRef.current.getElapsedTime() / 1000);
          setElapsedTime(elapsed);
          
          // Warning at 9 minutes (540 seconds)
          if (elapsed >= 540 && !isTimeWarning) {
            setIsTimeWarning(true);
            toast.warning('1 minute remaining!', { duration: 5000 });
          }
          
          // Auto-conclude at 10 minutes (600 seconds)
          if (elapsed >= 600 && !clientRef.current.hasEnded()) {
            console.log('⏱️ Time is up! Concluding interview...');
            clientRef.current.concludeInterview();
          }
        }
      }, 1000);
    } else {
      // Clear timer when not in live phase
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [phase, connectionStatus, isTimeWarning]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleStopInterview = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.stop();
      clientRef.current = null;
    }
  }, []);

  // Show confirmation modal when user clicks End Interview
  const handleEndInterviewClick = useCallback(() => {
    setShowEndConfirmation(true);
  }, []);

  const handleBackToSetup = useCallback(async () => {
    await handleStopInterview();
    setTranscript([]);
    setFinalTranscript([]);
    setAnalysis(null);
    setError(null);
    setConnectionStatus('disconnected');
    setElapsedTime(0);
    setIsTimeWarning(false);
    setCurrentSessionId(null);
    setPhase('setup');
  }, [handleStopInterview]);

  const handleSelectApplication = (app: JobApplication) => {
    setSelectedApplication(app);
  };

  // Save session to Firestore (with optional analysis - null when saving before analysis)
  const saveSessionToFirestore = useCallback(async (
    transcriptData: TranscriptEntry[],
    analysisData: InterviewAnalysis | null = null
  ) => {
    console.log('🔄 saveSessionToFirestore called', { 
      hasUser: !!currentUser, 
      hasApp: !!selectedApplication,
      transcriptLength: transcriptData.length,
      hasAnalysis: !!analysisData 
    });
    
    if (!currentUser || !selectedApplication) {
      console.error('❌ Cannot save session: missing user or application');
      return null;
    }
    
    try {
      const sessionsRef = collection(db, 'users', currentUser.uid, 'mockInterviewSessions');
      const now = new Date().toISOString();
      const sessionData = {
        date: now,
        applicationId: selectedApplication.id,
        companyName: selectedApplication.companyName,
        position: selectedApplication.position,
        elapsedTime: elapsedTime,
        transcript: transcriptData,
        analysis: analysisData,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(sessionsRef, sessionData);
      console.log('✅ Mock interview session saved:', docRef.id);
      
      // Add to local state with actual date (not serverTimestamp sentinel)
      const newSession: MockInterviewSession = {
        id: docRef.id,
        date: now,
        applicationId: selectedApplication.id,
        companyName: selectedApplication.companyName,
        position: selectedApplication.position,
        elapsedTime: elapsedTime,
        transcript: transcriptData,
        analysis: analysisData,
        createdAt: now, // Use actual date for local state
      };
      setPastSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving session:', error);
      return null;
    }
  }, [currentUser, selectedApplication, elapsedTime]);

  // Update session with analysis once it completes
  const updateSessionAnalysis = useCallback(async (
    sessionId: string,
    analysisData: InterviewAnalysis
  ) => {
    if (!currentUser) return;
    
    try {
      const sessionRef = doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId);
      await updateDoc(sessionRef, {
        analysis: analysisData,
      });
      console.log('✅ Session analysis updated:', sessionId);
      
      // Update local state
      setPastSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, analysis: analysisData }
          : session
      ));
    } catch (error) {
      console.error('Error updating session analysis:', error);
    }
  }, [currentUser]);

  // Analyze the interview transcript
  // sessionIdOverride is used when called immediately after saving (to avoid stale closure)
  const analyzeInterview = useCallback(async (sessionIdOverride?: string) => {
    if (!selectedApplication) return;
    
    setIsLoadingAnalysis(true);
    
    try {
      // Get transcript from state (already saved in finalTranscript)
      const transcriptToAnalyze = finalTranscript.length > 0 ? finalTranscript : transcript;
      
      const response = await fetch('/api/analyze-live-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptToAnalyze,
          jobContext: {
            companyName: selectedApplication.companyName,
            position: selectedApplication.position,
            jobDescription: selectedApplication.jobDescription,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze interview');
      }
      
      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      
      // Update session with analysis (session was already created before analysis started)
      // Use override if provided (to avoid stale closure), otherwise use state
      const sessionIdToUpdate = sessionIdOverride || currentSessionId;
      if (sessionIdToUpdate) {
        console.log('📊 Updating session with analysis:', sessionIdToUpdate);
        await updateSessionAnalysis(sessionIdToUpdate, analysisResult);
      } else {
        console.warn('⚠️ No sessionId available to update with analysis');
      }
    } catch (error) {
      console.error('Error analyzing interview:', error);
      toast.error('Failed to analyze interview');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [selectedApplication, finalTranscript, transcript, currentSessionId, updateSessionAnalysis]);

  // Confirm and end interview - go directly to results
  const handleConfirmEndInterview = useCallback(async () => {
    console.log('🎬 handleConfirmEndInterview called');
    setShowEndConfirmation(false);
    
    // Get transcript before stopping
    const transcriptData = clientRef.current ? clientRef.current.getFullTranscript() : transcript;
    console.log('📝 Got transcript:', transcriptData.length, 'entries');
    setFinalTranscript(transcriptData);
    
    // Stop the interview
    await handleStopInterview();
    console.log('🛑 Interview stopped');
    
    // Save session immediately (before analysis) so it appears in history
    const sessionId = await saveSessionToFirestore(transcriptData, null);
    console.log('💾 Session saved with ID:', sessionId);
    
    // Go to results and start analysis
    setPhase('results');
    setIsLoadingAnalysis(true);
    
    // Analyze interview - pass sessionId directly to avoid stale closure
    analyzeInterview(sessionId || undefined);
  }, [handleStopInterview, transcript, saveSessionToFirestore, analyzeInterview]);

  // Start interview handler - transitions to preparation phase
  const handleStartInterview = useCallback(() => {
    if (!selectedApplication) {
      toast.error('Please select a job application first');
      return;
    }
    
    if (!userProfile) {
      toast.error('User profile not loaded. Please try again.');
      return;
    }
    
    // Transition to preparation phase
    setPhase('preparation');
  }, [selectedApplication, userProfile]);

  // Begin interview handler - actually starts the live interview
  const handleBeginInterview = useCallback(async () => {
    if (!selectedApplication || !userProfile) {
      toast.error('Missing required data. Please go back and try again.');
      setPhase('setup');
      return;
    }
    
    setError(null);
    setTranscript([]);
    setCurrentSessionId(null);
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
      onInterviewConcluded: async () => {
        console.log('🏁 Interview concluded (auto), transitioning to results...');
        // Get final transcript before transitioning
        const transcriptData = clientRef.current ? clientRef.current.getFullTranscript() : [];
        console.log('📝 Got transcript:', transcriptData.length, 'entries');
        setFinalTranscript(transcriptData);
        
        // Stop the client
        await handleStopInterview();
        console.log('🛑 Interview stopped');
        
        // Save session immediately (before analysis)
        const sessionId = await saveSessionToFirestore(transcriptData, null);
        console.log('💾 Session saved with ID:', sessionId);
        
        // Transition to results phase
        setPhase('results');
        setIsLoadingAnalysis(true);
        
        // Start analysis - pass sessionId directly to avoid stale closure
        analyzeInterview(sessionId || undefined);
      },
    });
    
    clientRef.current = client;
    
    try {
      await client.start(jobContext, userProfile);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
    }
  }, [selectedApplication, userProfile, handleStopInterview, saveSessionToFirestore, analyzeInterview]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Delete a past session
  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId));
      setPastSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  }, [currentUser]);

  // Navigate to session detail page
  const handleViewSession = useCallback((sessionId: string) => {
    navigate(`/mock-interview/${sessionId}`);
  }, [navigate]);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (score >= 6) return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-50 dark:bg-amber-500/10' };
    return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bgLight: 'bg-red-50 dark:bg-red-500/10' };
  };

  // Format date for display
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

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

  // Render the job selection panel (left side or centered when no history)
  const renderJobSelectionPanel = () => (
    <div className="w-full max-w-md mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
  );

  // Render a past session card
  const renderSessionCard = (session: MockInterviewSession, index: number) => {
    const isAnalyzing = !session.analysis;
    const scoreColors = getScoreColor(session.analysis?.scores?.overall || 0);
    
    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
        whileHover={{ y: -2 }}
        onClick={() => handleViewSession(session.id)}
        className={`group relative bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 
          border border-gray-200/60 dark:border-gray-700/50
          hover:border-gray-300/80 dark:hover:border-gray-600/60
          shadow-sm hover:shadow-md
          cursor-pointer transition-all duration-200
          ${isAnalyzing ? 'animate-pulse' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          <CompanyLogo
            companyName={session.companyName}
            size="md"
            className="rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.position}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.companyName}
                </p>
              </div>

              {/* Score Badge or Analyzing state */}
              {isAnalyzing ? (
                <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : session.analysis?.scores?.overall ? (
                <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${scoreColors.bgLight} ${scoreColors.text}`}>
                  {session.analysis.scores.overall}/10
                </div>
              ) : null}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(session.elapsedTime)}
              </span>
              <span>{formatSessionDate(session.date)}</span>
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={(e) => handleDeleteSession(session.id, e)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
              dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="p-1.5 text-gray-400 dark:text-gray-500">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </motion.div>
    );
  };

  // Render the history panel (right side)
  const renderHistoryPanel = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
          <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">
          Past Interviews
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : pastSessions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Mic className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              No interviews yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Complete your first mock interview to see it here
            </p>
          </div>
        ) : (
          pastSessions.map((session, index) => renderSessionCard(session, index))
        )}
      </div>
    </motion.div>
  );

  const renderSetupPhase = () => {
    const hasPastSessions = pastSessions.length > 0 || isLoadingSessions;
    
    return (
      <motion.div
        key="setup"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="h-full flex"
      >
        {hasPastSessions ? (
          // Split layout when there are past sessions
          <>
            {/* Left Panel - Job Selection */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
              {renderJobSelectionPanel()}
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-200/60 dark:bg-gray-700/40 my-6" />

            {/* Right Panel - History */}
            <div className="w-[340px] flex-shrink-0 p-6 overflow-hidden">
              {renderHistoryPanel()}
            </div>
          </>
        ) : (
          // Centered layout when no past sessions
          <div className="flex-1 flex items-center justify-center p-6">
            {renderJobSelectionPanel()}
          </div>
        )}
      </motion.div>
    );
  };

  // ============================================
  // RENDER - PREPARATION PHASE
  // ============================================

  const renderPreparationPhase = () => {
    return (
      <motion.div
        key="preparation"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="h-full flex items-center justify-center p-6 overflow-y-auto"
      >
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-10"
          >
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-600/10 to-cyan-600/10 dark:from-violet-600/20 dark:to-cyan-600/20 border border-gray-200 dark:border-white/10 mb-4">
              <Headphones className="h-6 w-6 text-violet-500 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Before We Begin
            </h1>
            {selectedApplication && (
              <div className="flex items-center justify-center gap-3 mt-1">
                <CompanyLogo 
                  companyName={selectedApplication.companyName} 
                  size="lg" 
                  className="!rounded-lg"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedApplication.position} at {selectedApplication.companyName}
                </p>
              </div>
            )}
          </motion.div>

          {/* Instructions List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-10"
          >
            {/* Instruction 1 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-violet-500 dark:text-violet-400" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  Find a Quiet Space
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a room with minimal background noise
                </p>
              </div>
            </motion.div>

            {/* Instruction 2 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  10 Minutes Duration
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Take your time to answer each question thoughtfully
                </p>
              </div>
            </motion.div>

            {/* Instruction 3 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <Mic className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  Speak Naturally
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Respond as you would in a real interview
                </p>
              </div>
            </motion.div>

            {/* Instruction 4 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  Detailed Feedback
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive AI-powered analysis after your interview
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Mic reminder */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center text-xs text-gray-400 dark:text-gray-500 mb-8"
          >
            Make sure your microphone is enabled and working properly
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBeginInterview}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              <Play className="h-4 w-4" />
              I'm Ready, Let's Start
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('setup')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  };

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

            {/* Right: Timer + Status + Stop */}
            <div className="flex items-center gap-3">
              {/* Timer */}
              {isSessionActive && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                    isTimeWarning 
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-orange-200 dark:border-orange-500/20' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-mono font-semibold ${
                    isTimeWarning 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatTime(elapsedTime)} / 10:00
                  </span>
                </motion.div>
              )}

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
                  onClick={handleEndInterviewClick}
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

      {/* End Interview Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEndConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient Header */}
              <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500" />
              
              {/* Content */}
              <div className="p-6">
                {/* Close Button */}
                <button
                  onClick={() => setShowEndConfirmation(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20">
                    <Square className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  End Interview?
                </h3>

                {/* Description */}
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                  Your interview will end and you'll receive a detailed analysis of your performance.
                </p>

                {/* Time completed */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time: {formatTime(elapsedTime)}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndConfirmation(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Continue Interview
                  </button>
                  <button
                    onClick={handleConfirmEndInterview}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-violet-500/25 transition-all"
                  >
                    End & Analyze
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ============================================
  // RENDER - RESULTS PHASE
  // ============================================

  const renderResultsPhase = () => (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToSetup}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
              
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Interview Results
                </h1>
                {selectedApplication && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedApplication.position} at {selectedApplication.companyName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
                Completed in {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Transcript */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Full Transcript
                </h2>
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
              {(finalTranscript.length > 0 ? finalTranscript : transcript).map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl ${
                    entry.role === 'assistant' 
                      ? 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600' 
                      : 'bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      entry.role === 'assistant' 
                        ? 'text-violet-600 dark:text-violet-400' 
                        : 'text-cyan-600 dark:text-cyan-400'
                    }`}>
                      {entry.role === 'assistant' ? 'AI Interviewer' : 'You'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Performance Analysis
                </h2>
              </div>
            </div>
            
            <div className="p-5">
              {isLoadingAnalysis ? (
                <div className="flex flex-col items-center justify-center py-16">
                  {/* Premium Loading Animation */}
                  <div className="relative mb-8">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-500/20" />
                    {/* Animated gradient ring */}
                    <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-violet-500 border-r-cyan-500 animate-spin" />
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Text */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Analyzing Your Performance
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    Our AI is evaluating your responses and preparing detailed feedback...
                  </p>
                  
                  {/* Progress dots */}
                  <div className="flex gap-1.5 mt-6">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
                  {/* Overall Score with color coding */}
                  <div className={`text-center p-4 rounded-xl border ${
                    analysis.scores.overall >= 8 
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border-emerald-200 dark:border-emerald-500/20'
                      : analysis.scores.overall >= 6
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border-amber-200 dark:border-amber-500/20'
                        : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 border-red-200 dark:border-red-500/20'
                  }`}>
                    <div className={`text-4xl font-bold mb-1 ${
                      analysis.scores.overall >= 8 
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : analysis.scores.overall >= 6
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {analysis.scores.overall}/10
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
                  </div>

                  {/* Individual Scores */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Communication', score: analysis.scores.communication },
                      { label: 'Relevance', score: analysis.scores.relevance },
                      { label: 'Structure', score: analysis.scores.structure },
                      { label: 'Confidence', score: analysis.scores.confidence },
                    ].map(({ label, score }) => (
                      <div key={label} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                          <span className={`text-sm font-bold ${
                            score >= 8 ? 'text-emerald-600 dark:text-emerald-400' :
                            score >= 6 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>{score}/10</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              score >= 8 ? 'bg-emerald-500' :
                              score >= 6 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Job Fit Assessment */}
                  {analysis.jobFit && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-violet-500" />
                          Job Fit
                        </h3>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                          analysis.jobFit.score >= 7 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          analysis.jobFit.score >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>{analysis.jobFit.score}/10</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{analysis.jobFit.assessment}</p>
                      {analysis.jobFit.missingSkills && analysis.jobFit.missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">Missing:</span>
                          {analysis.jobFit.missingSkills.map((skill, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Answer Quality */}
                  {analysis.answerQuality && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Answer Quality</h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Did you answer? </span>
                          <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.didTheyAnswer}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Specific examples: </span>
                          <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.specificExamples}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">STAR method: </span>
                          <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.starMethodUsage}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Honest Assessment</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Memorable Quotes */}
                  {analysis.memorableQuotes && (
                    <div className="space-y-2">
                      {analysis.memorableQuotes.good && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500">
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Good quote</span>
                          <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{analysis.memorableQuotes.good}"</p>
                        </div>
                      )}
                      {analysis.memorableQuotes.needsWork && (
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border-l-2 border-amber-500">
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Needs work</span>
                          <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{analysis.memorableQuotes.needsWork}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strengths */}
                  <div>
                    <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      What You Did Well
                    </h3>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div>
                    <h3 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      What to Fix
                    </h3>
                    <ul className="space-y-1">
                      {analysis.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <span className="text-red-500 mt-0.5">✗</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Plan */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-500/10 dark:to-cyan-500/10 border border-violet-100 dark:border-violet-500/20">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">🎯 Action Plan</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No analysis available yet.
                  </p>
                  <button
                    onClick={analyzeInterview}
                    className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                  >
                    Analyze Interview
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
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
          {phase === 'setup' && renderSetupPhase()}
          {phase === 'preparation' && renderPreparationPhase()}
          {phase === 'live' && renderLivePhase()}
          {phase === 'results' && renderResultsPhase()}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
