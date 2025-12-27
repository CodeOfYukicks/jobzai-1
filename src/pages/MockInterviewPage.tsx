import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, getDoc, addDoc, updateDoc, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import AuthLayout from '../components/AuthLayout';
import MobileTopBar from '../components/mobile/MobileTopBar';
import { motion, AnimatePresence } from 'framer-motion';
import type { KanbanBoard } from '../types/job';
import {
  Mic,
  MicOff,
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
  Volume2,
  BarChart3,
} from 'lucide-react';
import { useRealtimeInterview, type JobContext, type UserProfile } from '../hooks/useRealtimeInterview';
import type { TranscriptEntry } from '../types/openai-realtime';
import type { MockInterviewAnalysis } from '../types/interview';
import { AIOrb, type OrbState } from '../components/interview/AIOrb';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { MockInterviewResultsView } from '../components/interview/MockInterviewResultsView';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { CREDIT_COSTS } from '../lib/planLimits';
import { CreditConfirmModal } from '../components/CreditConfirmModal';

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

// Legacy interface for backward compatibility with old saved sessions
interface LegacyInterviewAnalysis {
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

// Union type for analysis - supports both old and new format
type InterviewAnalysisUnion = MockInterviewAnalysis | LegacyInterviewAnalysis;

// Interface for saved mock interview sessions
export interface MockInterviewSession {
  id: string;
  date: string;
  applicationId: string;
  companyName: string;
  position: string;
  elapsedTime: number;
  transcript: TranscriptEntry[];
  analysis: InterviewAnalysisUnion | null;
  createdAt?: any;
}

type Phase = 'setup' | 'preparation' | 'live' | 'results';

// ============================================
// HELPER: Detect if analysis is legacy format
// ============================================

function isLegacyAnalysis(analysis: unknown): analysis is LegacyInterviewAnalysis {
  if (!analysis || typeof analysis !== 'object') return false;
  const a = analysis as Record<string, unknown>;
  // Legacy format has "scores.overall" (1-10), new format has "overallScore" (0-100)
  return 'scores' in a && typeof a.scores === 'object' && a.scores !== null && 'overall' in (a.scores as Record<string, unknown>);
}

// ============================================
// HELPER: Convert legacy analysis to new format
// ============================================

function convertLegacyAnalysis(legacy: LegacyInterviewAnalysis): MockInterviewAnalysis {
  const overallScore = (legacy.scores?.overall || 5) * 10;
  const commScore = (legacy.scores?.communication || 5) * 10;
  const relevanceScore = (legacy.scores?.relevance || 5) * 10;
  const structureScore = (legacy.scores?.structure || 5) * 10;
  const confidenceScore = (legacy.scores?.confidence || 5) * 10;
  const jobFitScore = (legacy.jobFit?.score || 5) * 10;

  return {
    verdict: {
      passed: overallScore >= 60,
      confidence: overallScore >= 70 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      hireDecision: overallScore >= 70 ? 'yes' : overallScore >= 50 ? 'maybe' : 'no',
    },
    overallScore,
    executiveSummary: legacy.summary || 'No summary available.',
    contentAnalysis: {
      relevanceScore: relevanceScore,
      specificityScore: relevanceScore,
      didAnswerQuestions: legacy.answerQuality?.didTheyAnswer ?
        (legacy.answerQuality.didTheyAnswer.toLowerCase().includes('yes') ? 'yes' :
          legacy.answerQuality.didTheyAnswer.toLowerCase().includes('partial') ? 'partially' : 'no')
        : 'partially',
      examplesProvided: 0,
      examplesQuality: 'generic',
      starMethodUsage: { situation: false, task: false, action: false, result: false },
      contentVerdict: legacy.answerQuality?.didTheyAnswer || '',
    },
    expressionAnalysis: {
      organizationScore: structureScore,
      clarityScore: commScore,
      confidenceScore: confidenceScore,
      structureAssessment: structureScore >= 70 ? 'organized' : structureScore >= 40 ? 'mixed' : 'scattered',
      rambling: false,
      expressionVerdict: '',
    },
    jobFitAnalysis: {
      fitScore: jobFitScore,
      matchedSkills: [],
      missingSkills: legacy.jobFit?.missingSkills || [],
      experienceRelevance: jobFitScore >= 70 ? 'high' : jobFitScore >= 40 ? 'medium' : 'low',
      wouldSurvive90Days: jobFitScore >= 60 ? 'likely' : jobFitScore >= 40 ? 'uncertain' : 'unlikely',
      competitivePosition: legacy.jobFit?.assessment || '',
      jobFitVerdict: legacy.jobFit?.assessment || '',
    },
    transcriptHighlights: [
      ...(legacy.memorableQuotes?.good ? [{
        entryId: 'quote-good',
        excerpt: legacy.memorableQuotes.good,
        type: 'strength' as const,
        category: 'content' as const,
        feedback: 'Good quote from your interview',
      }] : []),
      ...(legacy.memorableQuotes?.needsWork ? [{
        entryId: 'quote-work',
        excerpt: legacy.memorableQuotes.needsWork,
        type: 'improvement' as const,
        category: 'content' as const,
        feedback: 'This could be improved',
      }] : []),
    ],
    strengths: legacy.strengths || [],
    criticalIssues: legacy.improvements || [],
    actionPlan: legacy.recommendation ? [legacy.recommendation] : [],
  };
}

// ============================================
// HELPER: Normalize analysis data with defaults
// ============================================

function normalizeAnalysis(rawAnalysis: Partial<MockInterviewAnalysis>): MockInterviewAnalysis {
  return {
    ...rawAnalysis,
    verdict: rawAnalysis.verdict || {
      passed: false,
      confidence: 'low',
      hireDecision: 'no',
    },
    overallScore: rawAnalysis.overallScore ?? 0,
    executiveSummary: rawAnalysis.executiveSummary?.trim() || 'Analysis complete. Review your performance below.',
    contentAnalysis: rawAnalysis.contentAnalysis || {
      relevanceScore: 0,
      specificityScore: 0,
      didAnswerQuestions: 'no',
      examplesProvided: 0,
      examplesQuality: 'none',
      starMethodUsage: { situation: false, task: false, action: false, result: false },
      contentVerdict: '',
    },
    expressionAnalysis: rawAnalysis.expressionAnalysis || {
      organizationScore: 0,
      clarityScore: 0,
      confidenceScore: 0,
      structureAssessment: 'minimal',
      rambling: false,
      expressionVerdict: '',
    },
    jobFitAnalysis: rawAnalysis.jobFitAnalysis || {
      fitScore: 0,
      matchedSkills: [],
      missingSkills: [],
      experienceRelevance: 'low',
      wouldSurvive90Days: 'unlikely',
      competitivePosition: '',
      jobFitVerdict: '',
    },
    transcriptHighlights: rawAnalysis.transcriptHighlights || [],
    responseAnalysis: rawAnalysis.responseAnalysis || [],
    strengths: rawAnalysis.strengths || [],
    criticalIssues: rawAnalysis.criticalIssues || [],
    actionPlan: rawAnalysis.actionPlan || [],
  } as MockInterviewAnalysis;
}

// ============================================
// COMPONENT
// ============================================

export default function MockInterviewPage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const limits = usePlanLimits();

  // Navigation state from JobDetailPanel
  const navigationState = location.state as {
    viewSessionId?: string;
    selectedJobId?: string;
  } | null;

  // ============================================
  // REALTIME INTERVIEW HOOK
  // ============================================
  const {
    connectionStatus,
    transcript,
    error: hookError,
    isAISpeaking,
    elapsedTime: hookElapsedTime,
    isMuted,
    connect,
    disconnect,
    concludeInterview,
    getFullTranscript,
    toggleMute,
    inputAudioLevel,
    outputAudioLevel,
  } = useRealtimeInterview();

  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');
  const [showPastSessions, setShowPastSessions] = useState(false);

  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Derived error (hook error or local error)
  const error = hookError || localError;

  // Past sessions state
  const [pastSessions, setPastSessions] = useState<MockInterviewSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Timer state (use hook's elapsed time)
  const elapsedTime = hookElapsedTime;
  const [isTimeWarning, setIsTimeWarning] = useState(false);

  // Results state
  const [finalTranscript, setFinalTranscript] = useState<TranscriptEntry[]>([]);
  const [analysis, setAnalysis] = useState<MockInterviewAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Viewing past session state (when clicking on history)
  const [viewingSession, setViewingSession] = useState<MockInterviewSession | null>(null);

  // Confirmation modal state
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showNavigationConfirmation, setShowNavigationConfirmation] = useState(false);

  // Mobile UI state
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  // Refs
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Microphone test state (for preparation phase)
  const [micLevel, setMicLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micAnimationRef = useRef<number | null>(null);

  // Plan limits state
  const {
    userCredits,
    getUsageStats,
    canUseForFree,
    checkAndUseFeature,
    isLoading: isLoadingLimits
  } = usePlanLimits();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingInterviewStart, setPendingInterviewStart] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Load user's job applications
  useEffect(() => {
    const loadApplications = async () => {
      if (!currentUser) return;

      try {
        setIsLoadingApplications(true);

        // First, load boards to identify campaign boards
        const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
        const boardsSnapshot = await getDocs(query(boardsRef));
        const campaignBoardIds = new Set<string>();

        boardsSnapshot.forEach((doc) => {
          const board = { id: doc.id, ...doc.data() } as KanbanBoard;
          if (board.boardType === 'campaigns') {
            campaignBoardIds.add(board.id);
          }
        });

        // Then load applications
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const snapshot = await getDocs(query(applicationsRef));

        const apps: JobApplication[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();

          // Skip applications that belong to campaign boards
          // Check if application has boardType: 'campaigns' or boardId pointing to a campaign board
          const isCampaignApp = data.boardType === 'campaigns' ||
            (data.boardId && campaignBoardIds.has(data.boardId));

          if (isCampaignApp) {
            return; // Skip this application
          }

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
        notify.error('Failed to load job applications');
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

  // Handle navigation state from JobDetailPanel
  useEffect(() => {
    if (!navigationState) return;

    // Handle viewing a specific session
    if (navigationState.viewSessionId && pastSessions.length > 0 && !isLoadingSessions) {
      const session = pastSessions.find(s => s.id === navigationState.viewSessionId);
      if (session) {
        // Convert analysis if it's in legacy format, then normalize
        let analysisData: MockInterviewAnalysis | null = null;
        if (session.analysis) {
          if (isLegacyAnalysis(session.analysis)) {
            analysisData = normalizeAnalysis(convertLegacyAnalysis(session.analysis));
          } else {
            analysisData = normalizeAnalysis(session.analysis as MockInterviewAnalysis);
          }
        }

        setViewingSession(session);
        setAnalysis(analysisData);
        setFinalTranscript(session.transcript);
        setIsLoadingAnalysis(!session.analysis);
        setPhase('results');

        // Clear the navigation state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }

    // Handle pre-selecting a job for new interview
    if (navigationState.selectedJobId && applications.length > 0 && !isLoadingApplications) {
      const app = applications.find(a => a.id === navigationState.selectedJobId);
      if (app) {
        setSelectedApplication(app);

        // Clear the navigation state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [navigationState, pastSessions, isLoadingSessions, applications, isLoadingApplications]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Timer warning effect - watch for 9 minute warning
  useEffect(() => {
    if (phase === 'live' && elapsedTime >= 540 && !isTimeWarning) {
      setIsTimeWarning(true);
      notify.warning('1 minute remaining!', { duration: 5000 });
    }
  }, [phase, elapsedTime, isTimeWarning]);

  // Poll for analysis ONLY when viewing a past session that doesn't have analysis yet
  // This is a rare edge case - normally analysis is available immediately
  useEffect(() => {
    // Only poll when:
    // 1. Viewing a past session from history (viewingSession is set)
    // 2. That session doesn't have analysis yet
    // 3. We're in results phase with loading state
    if (!currentUser || !viewingSession || analysis || !isLoadingAnalysis || phase !== 'results') {
      return;
    }

    console.log('🔄 Polling for analysis on past session:', viewingSession.id);

    const pollInterval = setInterval(async () => {
      try {
        const sessionRef = doc(db, 'users', currentUser.uid, 'mockInterviewSessions', viewingSession.id);
        const sessionDoc = await getDoc(sessionRef);

        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          if (data.analysis) {
            // Analysis ready - normalize and display
            const analysisData = normalizeAnalysis(
              isLegacyAnalysis(data.analysis)
                ? convertLegacyAnalysis(data.analysis)
                : data.analysis as MockInterviewAnalysis
            );

            console.log('✅ Analysis received via polling');
            setAnalysis(analysisData);
            setIsLoadingAnalysis(false);
          }
        }
      } catch (error) {
        console.error('Error polling for analysis:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [currentUser, viewingSession, analysis, isLoadingAnalysis, phase]);

  // Microphone test effect - runs during preparation phase
  useEffect(() => {
    if (phase !== 'preparation') {
      // Cleanup when leaving preparation phase
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
        micAnimationRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      setMicLevel(0);
      setMicStatus('idle');
      return;
    }

    // Start microphone test when entering preparation phase
    const startMicTest = async () => {
      try {
        setMicStatus('requesting');

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        setMicStatus('active');

        // Animation loop for audio level
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average level
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

          setMicLevel(normalizedLevel);

          micAnimationRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error('Microphone access error:', err);
        setMicStatus('error');
      }
    };

    startMicTest();

    // Cleanup
    return () => {
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { });
      }
    };
  }, [phase]);

  // Block browser refresh/close when interview is active
  useEffect(() => {
    const isInterviewActive = phase === 'live' && (connectionStatus === 'connecting' || connectionStatus === 'ready' || connectionStatus === 'live');

    if (!isInterviewActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = 'You have an active interview session. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [phase, connectionStatus]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleStopInterview = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Block browser back/forward navigation when interview is active
  const isInterviewActive = phase === 'live' && (connectionStatus === 'connecting' || connectionStatus === 'ready' || connectionStatus === 'live');
  const isInterviewActiveRef = useRef(isInterviewActive);
  isInterviewActiveRef.current = isInterviewActive;


  const pendingNavigationRef = useRef<string | null>(null);

  // Block browser back button
  useEffect(() => {
    if (!isInterviewActive) return;

    // Push a dummy state to detect back button
    window.history.pushState({ interviewActive: true }, '');

    const handlePopState = () => {
      if (isInterviewActiveRef.current) {
        // Prevent navigation by pushing state back
        window.history.pushState({ interviewActive: true }, '');
        // Show confirmation modal
        setShowNavigationConfirmation(true);
        pendingNavigationRef.current = 'back';
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInterviewActive]);

  // Block link clicks (sidebar navigation, etc.)
  useEffect(() => {
    if (!isInterviewActive) return;

    const handleLinkClick = (event: MouseEvent) => {
      // Find if click was on a link or inside a link
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;

      if (!link) return;

      const href = link.getAttribute('href');

      // Only intercept internal navigation links (not external links or anchors)
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return;
      }

      // Check if it's navigating away from mock-interview page
      if (href !== '/mock-interview' && !href.startsWith('/mock-interview?')) {
        event.preventDefault();
        event.stopPropagation();
        pendingNavigationRef.current = href;
        setShowNavigationConfirmation(true);
      }
    };

    // Use capture phase to intercept before React Router handles it
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isInterviewActive]);

  // Handle navigation confirmation
  const handleConfirmNavigation = useCallback(() => {
    setShowNavigationConfirmation(false);
    handleStopInterview();

    // Navigate after stopping
    const destination = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (destination === 'back') {
      window.history.back();
    } else if (destination) {
      navigate(destination);
    }
  }, [handleStopInterview, navigate]);

  const handleCancelNavigation = useCallback(() => {
    setShowNavigationConfirmation(false);
    pendingNavigationRef.current = null;
  }, []);

  // Show confirmation modal when user clicks End Interview
  const handleEndInterviewClick = useCallback(() => {
    setShowEndConfirmation(true);
  }, []);

  const handleBackToSetup = useCallback(() => {
    handleStopInterview();
    setFinalTranscript([]);
    setAnalysis(null);
    setLocalError(null);
    setIsTimeWarning(false);
    setCurrentSessionId(null);
    setViewingSession(null); // Clear viewing session when going back
    setPhase('setup');
  }, [handleStopInterview]);

  const handleSelectApplication = (app: JobApplication) => {
    setSelectedApplication(app);
  };

  // Save session to Firestore (with optional analysis - null when saving before analysis)
  const saveSessionToFirestore = useCallback(async (
    transcriptData: TranscriptEntry[],
    analysisData: InterviewAnalysisUnion | null = null
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
  // Pattern: Update local state FIRST (immediate), then persist to Firestore (background)
  const updateSessionAnalysis = useCallback(async (
    sessionId: string,
    analysisData: InterviewAnalysisUnion
  ) => {
    // 1. Update local state IMMEDIATELY - this ensures clicking on history shows correct data
    console.log('📊 Updating local pastSessions state:', sessionId);
    setPastSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, analysis: analysisData }
        : session
    ));

    // 2. Save to Firestore (can be async - we don't need to wait)
    if (!currentUser) {
      console.warn('⚠️ No user - skipping Firestore save');
      return;
    }

    try {
      const sessionRef = doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId);
      await updateDoc(sessionRef, {
        analysis: analysisData,
      });
      console.log('✅ Analysis saved to Firestore:', sessionId);
    } catch (error) {
      console.error('❌ Error saving analysis to Firestore:', error);
      // Note: Local state is already updated, so UI will still work
    }
  }, [currentUser]);

  // Analyze the interview transcript
  // transcriptData is passed directly to avoid stale closure issues
  // sessionIdOverride is used when called immediately after saving
  const analyzeInterview = useCallback(async (transcriptData: TranscriptEntry[], sessionIdOverride?: string) => {
    if (!selectedApplication) return;

    // Validate transcript is not empty and contains user responses
    if (!transcriptData || transcriptData.length === 0) {
      console.error('❌ Cannot analyze: transcript is empty');
      setIsLoadingAnalysis(false);
      notify.error('No transcript data available for analysis');
      return;
    }

    const userResponses = transcriptData.filter(e => e.role === 'user' && e.text && e.text.trim().length > 0);
    if (userResponses.length === 0) {
      console.error('❌ Cannot analyze: no user responses in transcript');
      setIsLoadingAnalysis(false);
      notify.error('No user responses found in transcript');
      return;
    }

    console.log('📊 Analyzing transcript with', transcriptData.length, 'entries and', userResponses.length, 'user responses');

    setIsLoadingAnalysis(true);

    // Track start time to ensure minimum loading duration
    const startTime = Date.now();
    const MIN_LOADING_DURATION = 2000; // Minimum 2 seconds loading

    try {
      // Use transcript passed as parameter to avoid stale closure
      const transcriptToAnalyze = transcriptData;

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
            requirements: selectedApplication.requirements,
          },
          // Pass user profile for context-aware analysis
          userProfile: userProfile ? {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            currentPosition: userProfile.currentPosition,
            yearsOfExperience: userProfile.yearsOfExperience,
            skills: userProfile.skills,
            education: userProfile.education,
            cvText: userProfile.cvText,
            targetPosition: userProfile.targetPosition,
            targetSectors: userProfile.targetSectors,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze interview');
      }

      const analysisResult = await response.json();
      console.log('📊 Analysis result received:', {
        overallScore: analysisResult.overallScore,
        hasExecutiveSummary: !!analysisResult.executiveSummary,
        executiveSummaryLength: analysisResult.executiveSummary?.length,
      });

      // Normalize analysis with all required fields and defaults
      const processedAnalysis = normalizeAnalysis(analysisResult);

      console.log('📊 Processed analysis:', {
        overallScore: processedAnalysis.overallScore,
        hasExecutiveSummary: !!processedAnalysis.executiveSummary,
        strengthsCount: processedAnalysis.strengths?.length,
        criticalIssuesCount: processedAnalysis.criticalIssues?.length,
        actionPlanCount: processedAnalysis.actionPlan?.length,
      });

      // Validate that analysis is complete and not empty
      const isAnalysisComplete = (
        processedAnalysis.overallScore > 0 ||
        (processedAnalysis.executiveSummary && processedAnalysis.executiveSummary.trim().length > 50) ||
        (processedAnalysis.strengths && processedAnalysis.strengths.length > 0) ||
        (processedAnalysis.criticalIssues && processedAnalysis.criticalIssues.length > 0)
      );

      if (!isAnalysisComplete) {
        console.warn('⚠️ Analysis appears incomplete or empty');
        notify.error('Analysis returned incomplete results. Please try again.');
        setIsLoadingAnalysis(false);
        return;
      }

      // Ensure minimum loading duration for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // SIMPLE PATTERN (like InterviewPrepPage):
      // 1. Set analysis to state IMMEDIATELY (only when complete)
      // 2. Save to Firestore in background (updates pastSessions too)
      setAnalysis(processedAnalysis);
      setIsLoadingAnalysis(false);

      // Save to Firestore in background - this also updates pastSessions state
      const sessionIdToUpdate = sessionIdOverride || currentSessionId;
      if (sessionIdToUpdate) {
        console.log('📊 Saving analysis to Firestore:', sessionIdToUpdate);
        // Don't await - save in background
        updateSessionAnalysis(sessionIdToUpdate, processedAnalysis).catch(err => {
          console.error('Error saving analysis to Firestore:', err);
        });
      } else {
        console.warn('⚠️ No sessionId available to save analysis');
      }
    } catch (error) {
      console.error('Error analyzing interview:', error);
      notify.error('Failed to analyze interview');
      // Also update loading state in error case
      setIsLoadingAnalysis(false);
    }
  }, [selectedApplication, currentSessionId, updateSessionAnalysis, userProfile]);

  // Confirm and end interview - go directly to results
  const handleConfirmEndInterview = useCallback(async () => {
    console.log('🎬 handleConfirmEndInterview called');
    setShowEndConfirmation(false);

    // Get transcript before stopping
    const transcriptData = getFullTranscript();
    console.log('📝 Got transcript:', transcriptData.length, 'entries');
    setFinalTranscript(transcriptData);

    // Stop the interview
    handleStopInterview();
    console.log('🛑 Interview stopped');

    // Save session immediately (before analysis) so it appears in history
    const sessionId = await saveSessionToFirestore(transcriptData, null);
    console.log('💾 Session saved with ID:', sessionId);

    // Go to results and start analysis
    setPhase('results');
    setIsLoadingAnalysis(true);

    // Analyze interview - pass transcript and sessionId directly to avoid stale closure
    analyzeInterview(transcriptData, sessionId || undefined);
  }, [handleStopInterview, getFullTranscript, saveSessionToFirestore, analyzeInterview]);

  // Start interview handler - transitions to preparation phase
  const handleStartInterview = useCallback(() => {
    if (!selectedApplication) {
      notify.error('Please select a job application first');
      return;
    }

    if (!userProfile) {
      notify.error('User profile not loaded. Please try again.');
      return;
    }

    // Transition to preparation phase
    setPhase('preparation');
  }, [selectedApplication, userProfile]);

  // Begin interview handler - actually starts the live interview
  const handleBeginInterview = useCallback(async (useCredits: boolean = false) => {
    if (!selectedApplication || !userProfile) {
      notify.error('Missing required data. Please go back and try again.');
      setPhase('setup');
      return;
    }

    // Check if user can use for free or needs to pay
    const isFree = canUseForFree('mockInterviews');

    if (!isFree && !useCredits) {
      // Show credit confirmation modal
      setShowCreditModal(true);
      setPendingInterviewStart(true);
      return;
    }

    // Use the feature (either free quota or deduct credits)
    const result = await checkAndUseFeature('mockInterview', 1);

    if (!result.success) {
      notify.error(result.error || 'Failed to start interview');
      setShowCreditModal(false);
      setPendingInterviewStart(false);
      return;
    }

    if (result.usedCredits) {
      notify.info(`${result.creditCost} credits used for this mock interview`);
    }

    setShowCreditModal(false);
    setPendingInterviewStart(false);
    setLocalError(null);
    setCurrentSessionId(null);
    setPhase('live');

    // Create job context from selected application
    const jobContext: JobContext = {
      companyName: selectedApplication.companyName,
      position: selectedApplication.position,
      jobDescription: selectedApplication.jobDescription,
      requirements: selectedApplication.requirements,
    };

    try {
      await connect(jobContext, userProfile);
      notify.success('Interview session started');
    } catch (err) {
      console.error('Failed to start interview:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start interview';
      setLocalError(errorMsg);
      notify.error(errorMsg);
    }
  }, [selectedApplication, userProfile, connect, canUseForFree, checkAndUseFeature]);

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
      if (isAISpeaking || outputAudioLevel > 0.1) return 'speaking';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isSessionActive = connectionStatus === 'connecting' || connectionStatus === 'ready' || connectionStatus === 'live';

  // Delete a past session
  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId));
      setPastSessions(prev => prev.filter(s => s.id !== sessionId));
      notify.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      notify.error('Failed to delete session');
    }
  }, [currentUser]);

  // View a past session - load data and switch to results phase
  const handleViewSession = useCallback((session: MockInterviewSession) => {
    // Convert analysis if it's in legacy format, then normalize
    let analysisData: MockInterviewAnalysis | null = null;
    if (session.analysis) {
      if (isLegacyAnalysis(session.analysis)) {
        // Legacy format - convert first, then normalize
        analysisData = normalizeAnalysis(convertLegacyAnalysis(session.analysis));
      } else {
        // New format - normalize to ensure all fields are present
        analysisData = normalizeAnalysis(session.analysis as MockInterviewAnalysis);
      }
    }

    // CRITICAL: Set all state together for React to batch updates properly
    // This ensures consistent behavior with the immediate analysis display
    setViewingSession(session);
    setAnalysis(analysisData);
    setFinalTranscript(session.transcript);
    setIsLoadingAnalysis(!session.analysis); // If no analysis yet, show loading
    setPhase('results');
    setShowPastSessions(false); // Close bottom sheet if open
  }, []);

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
        {/* Personalized Greeting */}
        {userProfile?.firstName && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-xl font-medium text-gray-400 dark:text-gray-500 mb-3"
          >
            {getGreeting()}, {userProfile.firstName}
          </motion.p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mock Interview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select a position to practice
        </p>

        {/* Usage Quota Indicator */}
        {!isLoadingLimits && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Sessions used:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {getUsageStats('mockInterviews').used}/{getUsageStats('mockInterviews').limit}
              </span>
            </div>
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getUsageStats('mockInterviews').percentage >= 100
                  ? 'bg-red-500'
                  : getUsageStats('mockInterviews').percentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-[#635bff]'
                  }`}
                style={{ width: `${Math.min(100, getUsageStats('mockInterviews').percentage)}%` }}
              />
            </div>
            {getUsageStats('mockInterviews').remaining === 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                50 credits/session
              </span>
            )}
          </div>
        )}
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
              ? 'bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] text-gray-900 font-semibold shadow-sm hover:shadow-md'
              : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
        >
          <Play className="h-4 w-4" />
          Start Interview
        </motion.button>
      </motion.div>
    </div>
  );

  // Helper function to get overall score from either old or new analysis format
  const getAnalysisOverallScore = (analysisData: InterviewAnalysisUnion | null): number | null => {
    if (!analysisData) return null;
    // New format uses overallScore (0-100)
    if ('overallScore' in analysisData && typeof analysisData.overallScore === 'number') {
      return analysisData.overallScore;
    }
    // Legacy format uses scores.overall (1-10)
    if ('scores' in analysisData && analysisData.scores?.overall) {
      return analysisData.scores.overall * 10; // Convert to 0-100 scale
    }
    return null;
  };

  // Render a past session card
  const renderSessionCard = (session: MockInterviewSession, index: number) => {
    const isAnalyzing = !session.analysis;
    const overallScore = getAnalysisOverallScore(session.analysis);
    const scoreColors = getScoreColor(overallScore ? Math.round(overallScore / 10) : 0);

    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
        whileHover={{ y: -2 }}
        onClick={() => handleViewSession(session)}
        className={`group relative bg-white/80 dark:bg-[#2b2a2c]/60 backdrop-blur-sm rounded-xl p-4 
          border border-gray-200/60 dark:border-[#3d3c3e]/50
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
            className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
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
              ) : overallScore !== null ? (
                <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${scoreColors.bgLight} ${scoreColors.text}`}>
                  {overallScore}/100
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
        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#2b2a2c]">
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
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center mx-auto mb-3">
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
        className="h-full flex relative"
      >
        {/* Decorative Grid Background */}
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        {/* Mobile Layout (md:hidden) */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 md:hidden overflow-hidden pb-24">
          {/* Mobile-Native Job Selection Panel - Centered */}
          <div className="w-full max-w-md flex flex-col">

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {userProfile?.firstName ? `${getGreeting()}, ${userProfile.firstName}` : getGreeting()}
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Select a position to practice
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100/50 dark:bg-white/[0.03] border-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Job List - Fixed height showing ~4 items */}
            <div className="overflow-y-auto space-y-1.5 max-h-[280px] mb-6">
              {isLoadingApplications ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500">No applications found</p>
                </div>
              ) : (
                filteredApplications.map((app, index) => (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectApplication(app)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left overflow-hidden
                        ${selectedApplication?.id === app.id
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-white dark:bg-[#2b2a2c] border-transparent shadow-sm'
                      }`}
                  >
                    <CompanyLogo
                      companyName={app.companyName}
                      size="sm"
                      className="!rounded-lg !w-9 !h-9 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className={`text-sm font-semibold truncate ${selectedApplication?.id === app.id ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                        {app.position}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {app.companyName}
                      </p>
                    </div>
                    {selectedApplication?.id === app.id && (
                      <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    )}
                  </motion.button>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3">
              <button
                onClick={handleStartInterview}
                disabled={!selectedApplication}
                className={`w-full py-3 rounded-xl text-base font-semibold shadow-lg transition-all
                    ${selectedApplication
                    ? 'bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900'
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Start practicing
              </button>

              {hasPastSessions && (
                <button
                  onClick={() => setShowPastSessions(true)}
                  className="w-full py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  View past sessions ({pastSessions.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (hidden md:flex) */}
        <div className="hidden md:flex flex-1 w-full relative z-10">
          {hasPastSessions ? (
            // Split layout when there are past sessions
            <>
              {/* Left Panel - Job Selection */}
              <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                {renderJobSelectionPanel()}
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200/60 dark:bg-[#3d3c3e]/40 my-6" />

              {/* Right Panel - History */}
              <div className="w-[340px] flex-shrink-0 p-6 overflow-hidden" id="past-sessions-desktop">
                {renderHistoryPanel()}
              </div>
            </>
          ) : (
            // Centered layout when no past sessions
            <div className="flex-1 flex items-center justify-center p-6">
              {renderJobSelectionPanel()}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ============================================
  // RENDER - PREPARATION PHASE
  // ============================================

  const renderPreparationPhase = () => {
    // Determine mic ready state
    const isMicReady = micStatus === 'active';
    const isMicSpeaking = micStatus === 'active' && micLevel > 0.1;

    return (
      <motion.div
        key="preparation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full flex flex-col items-center justify-center p-8 relative"
      >
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="w-full max-w-sm mx-auto flex flex-col items-center">

          {/* Hero: Company Logo with Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative mb-4"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 blur-xl opacity-20 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full scale-125" />

            {selectedApplication && (
              <div className="relative">
                <CompanyLogo
                  companyName={selectedApplication.companyName}
                  size="lg"
                  className="!rounded-xl !w-14 !h-14 shadow-xl ring-1 ring-white/10"
                />
              </div>
            )}
          </motion.div>

          {/* Position & Company */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            {selectedApplication && (
              <>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5 leading-tight">
                  {selectedApplication.position}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  at {selectedApplication.companyName}
                </p>
              </>
            )}
          </motion.div>

          {/* Mobile-Native Settings Card (md:hidden) */}
          <div className="w-full bg-white dark:bg-[#2b2a2c] rounded-xl p-0 overflow-hidden border border-gray-100 dark:border-[#3d3c3e] mb-36 md:hidden">
            {/* Setting: Environment */}
            <button className="w-full flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#3d3c3e/50] active:bg-gray-50 dark:active:bg-[#343335] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Environment</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Quiet space</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Setting: Duration */}
            <button className="w-full flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#3d3c3e/50] active:bg-gray-50 dark:active:bg-[#343335] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Duration</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">10 minutes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Setting: Mode */}
            <button className="w-full flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#3d3c3e/50] active:bg-gray-50 dark:active:bg-[#343335] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Mode</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Speaking</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Setting: Feedback */}
            <button className="w-full flex items-center justify-between p-3 active:bg-gray-50 dark:active:bg-[#343335] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Feedback</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Structure & Content</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Desktop Grid (hidden md:grid) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden md:grid grid-cols-4 gap-2 mb-10 w-full"
          >
            {/* Quiet Space */}
            <div className="group relative flex flex-col items-center p-3 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50/50 dark:hover:bg-violet-500/[0.05] transition-all cursor-default">
              <Volume2 className="w-4 h-4 text-violet-500 dark:text-violet-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Quiet</span>
            </div>

            {/* Duration */}
            <div className="group relative flex flex-col items-center p-3 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/[0.05] transition-all cursor-default">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">10 min</span>
            </div>

            {/* Speak Naturally */}
            <div className="group relative flex flex-col items-center p-3 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.05] transition-all cursor-default">
              <div className="relative">
                <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                {isMicReady && (
                  <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ${isMicSpeaking ? 'animate-pulse' : ''}`} />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isMicReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {isMicSpeaking ? 'Speaking' : isMicReady ? 'Ready' : 'Natural'}
              </span>
            </div>

            {/* AI Feedback */}
            <div className="group relative flex flex-col items-center p-3 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06] hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-500/[0.05] transition-all cursor-default">
              <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">AI</span>
            </div>
          </motion.div>

          {/* Sticky Bottom Action - Mobile Only (fixed bottom-16) */}
          <div className="fixed bottom-[64px] left-0 right-0 p-4 pt-10 bg-gradient-to-t from-white via-white to-transparent dark:from-[#1a1a1a] dark:via-[#1a1a1a] z-30 md:hidden">
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-center text-xs text-gray-400">
                Ready? The AI interviewer will start speaking first.
              </p>
              {/* Start Interview Button (Full Width) */}
              <button
                onClick={() => handleBeginInterview(false)}
                className="w-full py-3.5 rounded-xl bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900 text-base font-semibold shadow-lg active:scale-[0.98] transition-all"
              >
                Start Interview
              </button>
              {/* Back Link (Subtle) */}
              <button
                onClick={() => setPhase('setup')}
                className="w-full py-2 text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to role selection
              </button>
            </div>
          </div>

          {/* Premium CTA (Desktop Only) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-4 hidden md:block"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(183, 226, 25, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBeginInterview(false)}
              disabled={!isMicReady}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isMicReady
                ? 'bg-[#b7e219] hover:bg-[#c5eb2d] text-gray-900 shadow-lg shadow-[#b7e219]/20'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
            >
              <Play className="h-4 w-4" />
              Start Interview
            </motion.button>

            {/* Back Link */}
            <button
              onClick={() => setPhase('setup')}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </motion.div>

        </div>
      </motion.div>
    );
  };

  // ============================================
  // RENDER - LIVE PHASE (DESKTOP)
  // ============================================

  const renderLivePhaseDesktop = () => (
    <motion.div
      key="live-desktop"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col"
    >
      {/* Premium Header */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-[#242325]/95 backdrop-blur-md border-b border-gray-200/60 dark:border-[#3d3c3e]/60 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Company Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (connectionStatus === 'live' || connectionStatus === 'ready' || connectionStatus === 'connecting') {
                    setShowBackConfirmation(true);
                  } else {
                    handleBackToSetup();
                  }
                }}
                className="flex-shrink-0 p-2.5 rounded-xl bg-gray-100/80 dark:bg-[#2b2a2c]/80 hover:bg-gray-200/80 dark:hover:bg-[#3d3c3e]/80 border border-gray-200/50 dark:border-[#3d3c3e]/50 transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>

              {selectedApplication && (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  <CompanyLogo
                    companyName={selectedApplication.companyName}
                    size="md"
                    className="!rounded-xl flex-shrink-0 ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                      {selectedApplication.companyName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {selectedApplication.position}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Unified Status Bar */}
            {isSessionActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center h-10 rounded-full bg-[#1a1a1b] dark:bg-[#1a1a1b] border border-[#2d2d2e] shadow-lg overflow-hidden"
              >
                {/* Timer Section */}
                <div className={`flex items-center gap-2 px-4 h-full border-r border-[#2d2d2e] ${isTimeWarning ? 'bg-orange-500/10' : ''
                  }`}>
                  <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${isTimeWarning
                    ? 'text-orange-400'
                    : 'text-gray-400'
                    }`} />
                  <span className={`text-sm font-mono font-medium tracking-tight whitespace-nowrap ${isTimeWarning
                    ? 'text-orange-400'
                    : 'text-gray-300'
                    }`}>
                    {formatTime(elapsedTime)} <span className="text-gray-500">/ 10:00</span>
                  </span>
                </div>

                {/* Live Status Section */}
                <div className="flex items-center gap-2 px-4 h-full border-r border-[#2d2d2e]">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium text-emerald-400 whitespace-nowrap">
                    Live Session
                  </span>
                </div>

                {/* End Interview Button */}
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEndInterviewClick}
                  className="flex items-center gap-2 px-4 h-full text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Square className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">End Interview</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Orb Section - Center */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-0 overflow-visible">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center overflow-visible"
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
              className="mt-8 flex flex-col items-center gap-4"
            >
              {/* AI Status */}
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{
                    scale: getOrbState() !== 'idle' && !isMuted ? [1, 1.3, 1] : 1,
                    opacity: getOrbState() !== 'idle' && !isMuted ? [0.6, 1, 0.6] : 0.4
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${getOrbState() === 'speaking'
                    ? 'bg-violet-500'
                    : getOrbState() === 'listening'
                      ? 'bg-cyan-500'
                      : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                />
                <span className={`text-sm font-medium ${getOrbState() === 'speaking'
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

              {/* Premium Mute Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isMuted
                  ? 'bg-red-500/15 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                  : 'bg-white/5 dark:bg-white/[0.03] border border-white/10 dark:border-white/[0.08] hover:bg-white/10 dark:hover:bg-white/[0.06] hover:border-white/20 dark:hover:border-white/15'
                  }`}
              >
                {/* Animated ring when muted */}
                {isMuted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.5, 0.2, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-red-500/50"
                  />
                )}

                {/* Icon */}
                <div className={`relative p-1.5 rounded-full transition-colors ${isMuted
                  ? 'bg-red-500/20'
                  : 'bg-white/5 dark:bg-white/[0.05] group-hover:bg-white/10'
                  }`}>
                  {isMuted ? (
                    <MicOff className="h-4 w-4 text-red-400" />
                  ) : (
                    <Mic className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-300" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-sm font-medium transition-colors ${isMuted
                  ? 'text-red-400'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-300'
                  }`}>
                  {isMuted ? 'Tap to unmute' : 'Mute mic'}
                </span>
              </motion.button>

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
          className="w-full lg:w-[380px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-[#3d3c3e] bg-gray-50/80 dark:bg-[#242325]/80 backdrop-blur-sm"
        >
          {/* Transcript Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 dark:border-[#3d3c3e] bg-white dark:bg-[#242325]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                  <Mic className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Live Transcript
                </h2>
              </div>
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${connectionStatus === 'live'
                ? outputAudioLevel > 0.1
                  ? 'bg-violet-50 dark:bg-violet-500/10'
                  : 'bg-cyan-50 dark:bg-cyan-500/10'
                : connectionStatus === 'connecting'
                  ? 'bg-amber-50 dark:bg-amber-500/10'
                  : 'bg-gray-100 dark:bg-[#2b2a2c]'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'live'
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
                    className={`p-3 rounded-xl ${entry.role === 'assistant'
                      ? 'bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-[#3d3c3e]'
                      : 'bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20'
                      }`}
                  >
                    {/* Role label */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${entry.role === 'assistant'
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
                    <p className={`text-sm leading-relaxed ${entry.role === 'assistant'
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
  // RENDER - LIVE PHASE (MOBILE IMMERSIVE)
  // ============================================
  const renderLivePhaseMobile = () => (
    <motion.div
      key="live-mobile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col md:hidden"
    >
      {/* 1. Header: Timer & End Action */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4">
        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${isTimeWarning ? 'bg-orange-500/10 border-orange-500/20' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className={`text-sm font-mono font-medium ${isTimeWarning ? 'text-orange-400' : 'text-gray-200'}`}>
            {formatTime(elapsedTime)}
          </span>
        </div>

        {/* End Button */}
        <button
          onClick={handleEndInterviewClick}
          className="px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 active:scale-95 transition-all"
        >
          End Interview
        </button>
      </div>

      {/* 2. Main Content: The Orb (Centered) */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Orb */}
        <div className="relative z-10 scale-110">
          <AIOrb
            state={getOrbState()}
            audioLevel={Math.max(inputAudioLevel, outputAudioLevel)}
            className="w-64 h-64"
          />
        </div>

        {/* Status Text (Below Orb) */}
        <div className="mt-12 text-center space-y-2">
          <p className={`text-lg font-medium transition-colors duration-300 ${getOrbState() === 'speaking' ? 'text-violet-400' :
            getOrbState() === 'listening' ? 'text-cyan-400' :
              'text-gray-400'
            }`}>
            {getOrbState() === 'speaking' ? 'AI Speaking' :
              getOrbState() === 'listening' ? 'Listening...' :
                'Thinking...'}
          </p>
          {selectedApplication && (
            <p className="text-sm text-gray-500 max-w-[240px] mx-auto truncate">
              {selectedApplication.position}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Controls */}
      <div className="pb-safe pt-8 px-8 flex flex-col items-center gap-8">
        {/* Mic Toggle (Large) */}
        <button
          onClick={toggleMute}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isMuted
            ? 'bg-red-500/20 text-red-500 border-2 border-red-500/50'
            : 'bg-white text-black hover:scale-105 active:scale-95'
            }`}
        >
          {isMuted ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Transcript Handle */}
        <button
          onClick={() => setIsTranscriptOpen(true)}
          className="flex flex-col items-center gap-2 text-gray-500 hover:text-white transition-colors py-4 w-full"
        >
          <div className="w-10 h-1 bg-gray-700/50 rounded-full" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-60">
            Open Transcript
          </span>
        </button>
      </div>

      {/* 4. Transcript Bottom Sheet */}
      <AnimatePresence>
        {isTranscriptOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col pt-safe-top"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Live Transcript</h3>
              <button
                onClick={() => setIsTranscriptOpen(false)}
                className="p-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-col ${entry.role === 'assistant' ? 'items-start' : 'items-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 ${entry.role === 'assistant'
                    ? 'bg-white/5 text-gray-200 rounded-tl-sm'
                    : 'bg-violet-600 text-white rounded-tr-sm'
                    }`}>
                    <p className="text-base leading-relaxed">{entry.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1.5 px-1 uppercase tracking-wider">
                    {entry.role === 'assistant' ? 'AI Interviewer' : 'You'}
                  </span>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderLivePhase = () => (
    <>
      <div className="hidden md:block h-full">
        {renderLivePhaseDesktop()}
      </div>
      {renderLivePhaseMobile()}

      {/* End Interview Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEndConfirmation(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#2b2a2c] rounded-xl w-full max-w-sm mx-4 shadow-xl border border-gray-200/50 dark:border-[#3d3c3e]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  End Interview
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEndConfirmation(false)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your session will end and you'll receive a detailed performance analysis.
                </p>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#242325] mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1b] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Session Duration</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 p-4 pt-0">
                <button
                  onClick={() => setShowEndConfirmation(false)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEndInterview}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900 transition-colors"
                >
                  End & Analyze
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Confirmation Modal */}
      <AnimatePresence>
        {showBackConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBackConfirmation(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#2b2a2c] rounded-xl w-full max-w-sm mx-4 shadow-xl border border-gray-200/50 dark:border-[#3d3c3e]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Leave Interview?
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBackConfirmation(false)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your interview session is still active. If you leave now, your progress will be lost and no analysis will be generated.
                </p>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#242325] mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1b] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Current Session</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 p-4 pt-0">
                <button
                  onClick={() => setShowBackConfirmation(false)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900 transition-colors"
                >
                  Continue Interview
                </button>
                <button
                  onClick={() => {
                    setShowBackConfirmation(false);
                    handleBackToSetup();
                  }}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-colors"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // ============================================
  // RENDER - RESULTS PHASE
  // ============================================

  const renderResultsPhase = () => {
    // Use viewingSession data if viewing a past session, otherwise use live data
    const displayTranscript = viewingSession ? viewingSession.transcript : (finalTranscript.length > 0 ? finalTranscript : transcript);
    const displayCompanyName = viewingSession ? viewingSession.companyName : (selectedApplication?.companyName || 'Company');
    const displayPosition = viewingSession ? viewingSession.position : (selectedApplication?.position || 'Position');
    const displayElapsedTime = viewingSession ? viewingSession.elapsedTime : elapsedTime;

    return (
      <motion.div
        key="results"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="h-full"
      >
        <MockInterviewResultsView
          transcript={displayTranscript}
          analysis={analysis}
          isLoading={isLoadingAnalysis}
          companyName={displayCompanyName}
          position={displayPosition}
          elapsedTime={displayElapsedTime}
          onBack={handleBackToSetup}
        />
      </motion.div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthLayout>
      {/* Mobile Top Bar */}
      <MobileTopBar
        title="Mock Interview"
        subtitle={phase === 'setup' ? 'Select an interview' : phase === 'live' ? 'Live Session' : 'Results'}
      />

      <div className="h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'setup' && renderSetupPhase()}
          {phase === 'preparation' && renderPreparationPhase()}
          {phase === 'live' && renderLivePhase()}
          {phase === 'results' && renderResultsPhase()}
        </AnimatePresence>
      </div>

      {/* Mobile Past Sessions Bottom Sheet */}
      <AnimatePresence>
        {showPastSessions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPastSessions(false)}
              className="fixed inset-0 bg-black/40 z-[60] md:hidden backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[70] bg-white dark:bg-[#1a1a1a] rounded-t-2xl shadow-2xl overflow-hidden md:hidden h-[80vh] flex flex-col border-t border-gray-200 dark:border-[#333]"
            >
              {/* Handle */}
              <div
                className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-pointer"
                onClick={() => setShowPastSessions(false)}
              >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-[#333] flex-shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-violet-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Past Sessions</h3>
                </div>
                <button
                  onClick={() => setShowPastSessions(false)}
                  className="p-2 bg-gray-100 dark:bg-[#333] rounded-full hover:bg-gray-200 dark:hover:bg-[#444] transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                {pastSessions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No past sessions found.</div>
                ) : (
                  pastSessions.map((session, index) => renderSessionCard(session, index))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation Confirmation Modal (for page navigation during active interview) */}
      <AnimatePresence>
        {showNavigationConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleCancelNavigation}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#2b2a2c] rounded-xl w-full max-w-sm mx-4 shadow-xl border border-gray-200/50 dark:border-[#3d3c3e]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Leave Interview?
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelNavigation}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your interview session is still active. If you leave now, your progress will be lost and no analysis will be generated.
                </p>

                {/* Session Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#242325] mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1b] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Current Session</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-4 pt-0">
                <button
                  onClick={handleCancelNavigation}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900 transition-colors"
                >
                  Continue Interview
                </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-colors"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Confirmation Modal */}
      <CreditConfirmModal
        isOpen={showCreditModal}
        onClose={() => {
          setShowCreditModal(false);
          setPendingInterviewStart(false);
        }}
        onConfirm={() => handleBeginInterview(true)}
        featureName="Mock Interview"
        creditCost={CREDIT_COSTS.mockInterview}
        userCredits={userCredits}
        remainingQuota={getUsageStats('mockInterviews').remaining}
        planLimit={getUsageStats('mockInterviews').limit}
        isLoading={pendingInterviewStart && !showCreditModal}
      />
    </AuthLayout>
  );
}
