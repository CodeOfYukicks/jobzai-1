import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc, serverTimestamp, query, getDocs, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { notify } from '@/lib/notify';
import AuthLayout from '../components/AuthLayout';
import { analyzeJobPost, JobPostAnalysisResult } from '../services/jobPostAnalyzer';
import { queryPerplexity } from '../lib/perplexity';
import { queryChatFast, queryQuestionGeneration } from '../lib/chatFast';
// Removed react-draggable - using manual drag implementation
import Xarrow, { Xwrapper } from 'react-xarrows';
import {
  ArrowLeft, Briefcase, Building, MapPin, Calendar, Clock, LinkIcon,
  MessageSquare, Check, AlertTriangle, BookOpen, FileText,
  PlayCircle, BookmarkPlus, Download, Share2,
  CheckCircle, XCircle, Clock as ClockIcon, ChevronDown,
  Loader2, Send, User, Bot, Save, Plus, X, StickyNote,
  ChevronLeft, LayoutDashboard, HelpCircle, CalendarDays,
  Search, RefreshCw, Maximize2, Minimize2, ArrowRight,
  MousePointer, Square, Circle, Minus, Link2, ArrowUp,
  CheckSquare, ExternalLink, BarChart2, Bookmark, ThumbsUp,
  Newspaper, Users, PieChart, Award, Flag, Edit, Sparkles, Zap, Brain, Target,
  Info, PanelLeftClose, TrendingUp, Lightbulb, Target as TargetIcon, History
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import PremiumHeroSection from '../components/interview/PremiumHeroSection';
import AICard from '../components/interview/AICard';
import SectionCard from '../components/interview/SectionCard';
import { InterviewQuestionsHeader } from '../components/interview/questions/InterviewQuestionsHeader';
import { QuestionCard, QuestionTag } from '../components/interview/questions/QuestionCard';
import { FocusQuestionModal } from '../components/interview/questions/FocusQuestionModal';
import { TldrawWhiteboard } from '../components/interview/TldrawWhiteboard';
import { Suspense } from 'react';
import { OverviewTab, QuestionsTab, SkillsTab, ResourcesTab, ChatTab } from '../components/interview/tabs';
import { LazySection } from '../components/interview/utils/LazySection';
import RightSidebarPanel from '../components/interview/RightSidebarPanel';
import { LiveInterviewSession, HistorySessionData } from '../components/interview/live/LiveInterviewSession';
import { LiveInterviewResults } from '../components/interview/live/LiveInterviewResults';
import { InterviewType, QuestionCount } from '../components/interview/live/LiveSessionConfig';
import ContextDocumentSelector, { ContextDocument } from '../components/interview/ContextDocumentSelector';
import {
  extractResumeText,
  extractNoteText,
  extractWhiteboardText,
  extractPDFText,
  truncateText,
} from '../lib/documentTextExtractor';
import { Resume } from './ResumeBuilderPage';
import { NotionDocument, getNotes } from '../lib/notionDocService';
import { WhiteboardDocument, getWhiteboards } from '../lib/whiteboardDocService';
import { ImportedDocument } from '../components/resume-builder/PDFPreviewCard';

// Interface for the job application data
interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  position?: { x: number; y: number };
  connections?: string[];
  width?: number;
  height?: number;
}

interface Connection {
  id: string;
  start: string;
  end: string;
  label?: string;
}

interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  stickyNotes?: Note[];
  noteConnections?: Connection[];
  feedback?: string;
  location?: string;
  preparation?: JobPostAnalysisResult;
  jobPostContent?: string;
  jobPostUrl?: string;
  lastAnalyzed?: string;
  skillRatings?: Record<string, number>;
  chatHistory?: ChatMessage[];
  checklist?: ChecklistItem[];
  companyNews?: NewsItem[];
  lastCompanyNewsUpdated?: string;
  skillCoach?: {
    microTasks?: Record<string, { id: string; label: string; done: boolean }[]>;
    starStories?: Record<string, { id: string; situation: string; action: string; result: string }[]>;
    readiness?: Record<string, 'ready' | 'needs_work'>;
  };
  resourcesData?: {
    reviewedTips?: string[];
    savedLinks?: { id: string; title: string; url: string }[];
    questionsToAsk?: string[];
    elevatorPitch?: string;
  };
  freeFormNotes?: string;
  noteDocuments?: NoteDocument[];
  activeNoteDocumentId?: string | null;
  liveSessionHistory?: LiveSessionRecord[];
  contextDocuments?: ContextDocument[];
}

interface ContextDocument {
  id: string;
  type: 'resume' | 'note' | 'whiteboard' | 'pdf';
  documentId: string;
  title: string;
  textContent?: string; // Contenu texte extrait (optionnel, peut être chargé à la demande)
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
  analysis: any; // Full InterviewAnalysis object
  answers: Record<number, string>;
}

interface NoteDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: string;
  appliedDate: string;
  url?: string;
  notes?: string;
  interviews?: Interview[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Shape {
  id: string;
  type: 'arrow' | 'line' | 'rectangle' | 'circle' | 'pen';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  color: string;
  label?: string;
  path?: string;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  section: 'overview' | 'questions' | 'skills' | 'resources' | 'chat';
  priority?: boolean;
}

interface PreparationDay {
  day: string;
  tasks: string[];
}

interface NewsItem {
  title: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  source?: string;
  url?: string;
}

const QUESTION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'technical', label: 'Technical' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'company-specific', label: 'Company' },
  { id: 'role-specific', label: 'Role' },
] as const;

type QuestionFilter = (typeof QUESTION_FILTERS)[number]['id'];

interface QuestionEntry {
  id: number;
  rawValue: string;
  text: string;
  tags: QuestionTag[];
  suggestedApproach?: string | null;
}

const sanitizeQuestionText = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/^["']?question["']?\s*:\s*["']?/i, '')
    .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
    .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
    .replace(/["']?\s*,\s*["']?answer["']?\s*:\s*["']?.*?$/gi, '')
    .replace(/["']?\s*,\s*["']?question["']?\s*:\s*["']?.*?$/gi, '')
    .replace(/["']\s*,\s*$/g, '')
    .replace(/,\s*$/g, '')
    .replace(/["']?\s*\}\s*,?\s*$/g, '')
    .replace(/["']?\s*\]\s*,?\s*$/g, '')
    .replace(/^["']?/g, '')
    .replace(/["']?$/g, '')
    .replace(/^\[+\s*/, '')
    .replace(/^\{+\s*/, '')
    .replace(/^\(+\s*/, '')
    .replace(/\s*\[+$/, '')
    .replace(/\s*\{+$/, '')
    .replace(/\s*\(+$/, '')
    .replace(/^\(([^)]*)$/, '$1')
    .replace(/^([^(]*)\)$/, '$1')
    .trim();
};

const cleanAnswerText = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
    .replace(/^["']?question["']?\s*:\s*["']?/i, '')
    .replace(/["']\s*,\s*$/g, '')
    .replace(/,\s*$/g, '')
    .replace(/["']?\s*\}\s*,?\s*$/g, '')
    .replace(/["']?\s*\]\s*,?\s*$/g, '')
    .replace(/^["']?/g, '')
    .replace(/["']?$/g, '')
    .replace(/^\[+\s*/, '')
    .replace(/^\{+\s*/, '')
    .replace(/^\(+\s*/, '')
    .replace(/\s*\[+$/, '')
    .replace(/\s*\{+$/, '')
    .replace(/\s*\(+$/, '')
    .replace(/^\(([^)]*)$/, '$1')
    .replace(/^([^(]*)\)$/, '$1')
    .trim();
};

const normalizeQuestionForMatch = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .replace(/^["']?question["']?\s*:\s*["']?/i, '')
    .replace(/^["']?/g, '')
    .replace(/["']?$/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Function to determine question tags based on content
const getQuestionTags = (question: string): ('technical' | 'behavioral' | 'company-specific' | 'role-specific')[] => {
  if (!question || typeof question !== 'string') return [];

  const lowerQuestion = question.toLowerCase();
  const tags: ('technical' | 'behavioral' | 'company-specific' | 'role-specific')[] = [];

  // Technical keywords
  const technicalKeywords = [
    'code', 'programming', 'algorithm', 'technical', 'technology', 'software', 'hardware',
    'system', 'database', 'api', 'framework', 'language', 'tool', 'platform', 'architecture',
    'debug', 'optimize', 'implement', 'develop', 'design pattern', 'data structure',
    'testing', 'deployment', 'infrastructure', 'security', 'performance', 'scalability'
  ];

  // Behavioral keywords
  const behavioralKeywords = [
    'tell me about', 'describe a time', 'situation', 'challenge', 'conflict', 'team',
    'leadership', 'mistake', 'failure', 'success', 'difficult', 'pressure', 'stress',
    'collaborate', 'communicate', 'manage', 'handle', 'deal with', 'experience',
    'example', 'story', 'scenario', 'how did you', 'what did you', 'when did you'
  ];

  // Company-specific keywords
  const companyKeywords = [
    'company', 'organization', 'firm', 'business', 'our company', 'this company',
    'why do you want to work', 'why are you interested', 'what do you know about',
    'culture', 'values', 'mission', 'vision', 'why us', 'why here'
  ];

  // Role-specific keywords
  const roleKeywords = [
    'this role', 'this position', 'job', 'responsibilities', 'duties', 'expectations',
    'qualifications', 'requirements', 'skills needed', 'what makes you qualified',
    'why are you a good fit', 'how do you fit', 'relevant experience'
  ];

  // Check for technical
  if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    tags.push('technical');
  }

  // Check for behavioral
  if (behavioralKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    tags.push('behavioral');
  }

  // Check for company-specific
  if (companyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    tags.push('company-specific');
  }

  // Check for role-specific
  if (roleKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    tags.push('role-specific');
  }

  // Default: if no tags found, assign based on question structure
  if (tags.length === 0) {
    // Questions starting with "How", "What", "Why" about processes are often technical
    if (lowerQuestion.startsWith('how') && (lowerQuestion.includes('would you') || lowerQuestion.includes('do you'))) {
      tags.push('technical');
    }
    // Questions about past experiences are behavioral
    else if (lowerQuestion.includes('have you') || lowerQuestion.includes('did you')) {
      tags.push('behavioral');
    }
    // Questions about the company
    else if (lowerQuestion.includes('why') && (lowerQuestion.includes('want') || lowerQuestion.includes('interested'))) {
      tags.push('company-specific');
    }
    // Default to role-specific
    else {
      tags.push('role-specific');
    }
  }

  return tags;
};

// Canvas limits
const CANVAS_MAX_X = 10000;
const CANVAS_MAX_Y = 10000;
const CANVAS_MIN_X = -1000;
const CANVAS_MIN_Y = -1000;

export default function InterviewPrepPage() {
  const { applicationId, interviewId } = useParams<{ applicationId: string, interviewId: string }>();
  const { currentUser } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState<number>(0);
  const [analyzingMessage, setAnalyzingMessage] = useState<string>("Analyzing Job Posting");
  const [regeneratingProgress, setRegeneratingProgress] = useState<number>(0);
  const [regeneratingMessage, setRegeneratingMessage] = useState<string>("Generating New Questions");
  const [jobUrl, setJobUrl] = useState('');
  const [tab, setTab] = useState<'overview' | 'questions' | 'skills' | 'resources' | 'chat'>('overview');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [typingMessages, setTypingMessages] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ffeb3b');
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [showStarExportModal, setShowStarExportModal] = useState(false);
  const [pendingStarExport, setPendingStarExport] = useState<{skill: string, storyId: string} | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [notePositions, setNotePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [noteSizes, setNoteSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingNoteId, setResizingNoteId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number; startX: number; startY: number } | null>(null);
  const [resizeType, setResizeType] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; mouseX: number; mouseY: number } | null>(null);
  // Ref to store potential drag info before actual drag starts (after 10px movement)
  const potentialDragRef = useRef<{ noteId: string; startPos: { x: number; y: number; mouseX: number; mouseY: number } } | null>(null);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'pen' | 'arrow' | 'line' | 'rectangle' | 'circle' | 'text' | 'sticky'>('select');
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [showConnectionMenu, setShowConnectionMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [connectionMenuPosition, setConnectionMenuPosition] = useState({ x: 0, y: 0 });
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [drawingColor, setDrawingColor] = useState('#ef4444'); // Red by default
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(3);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isResizingShape, setIsResizingShape] = useState(false);
  const [drawingPath, setDrawingPath] = useState<string>('');
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [showToolSubmenu, setShowToolSubmenu] = useState(false);
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [preparationProgress, setPreparationProgress] = useState<number>(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', task: 'Research company background', completed: false, section: 'overview' },
    { id: '2', task: 'Prepare 3-5 STAR stories', completed: false, section: 'questions' },
    { id: '3', task: 'Self-assess required skills', completed: false, section: 'skills', priority: true },
    { id: '4', task: 'Complete mock interview', completed: false, section: 'chat' },
    { id: '5', task: 'Prepare questions to ask interviewer', completed: false, section: 'resources' }
  ]);
  const [prepPlan, setPrepPlan] = useState<PreparationDay[]>([
    { day: 'Day 1 (Today)', tasks: ['Review company mission & values (15m)', 'Practice introducing yourself (10m)', 'Identify 3 relevant experiences (20m)'] },
    { day: 'Day 2', tasks: ['Research recent company news (20m)', 'Complete skills self-assessment (15m)', 'Practice 2 behavioral questions (30m)'] },
    { day: 'Day 3', tasks: ['Review interviewer LinkedIn (if known) (10m)', 'Full mock interview practice (45m)', 'Prepare questions to ask (15m)'] }
  ]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([
  ]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [skillCoach, setSkillCoach] = useState<Interview['skillCoach']>({ microTasks: {}, starStories: {}, readiness: {} });
  const [resourcesData, setResourcesData] = useState<Interview['resourcesData']>({ reviewedTips: [], savedLinks: [], questionsToAsk: [], elevatorPitch: '' });
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [activeQuestionFilter, setActiveQuestionFilter] = useState<QuestionFilter>('all');
  const [showAllChecklistItems, setShowAllChecklistItems] = useState(false);
  const [showAllNewsItems, setShowAllNewsItems] = useState(false);
  const [isJobSummaryOpen, setIsJobSummaryOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'progress' | 'notes' | 'history' | 'coach'>('progress');
  const [freeFormNotes, setFreeFormNotes] = useState<string>('');
  const [noteDocuments, setNoteDocuments] = useState<NoteDocument[]>([]);
  const [activeNoteDocumentId, setActiveNoteDocumentId] = useState<string | null>(null);
  const [highlightedDocumentId, setHighlightedDocumentId] = useState<string | null>(null);
  const documentsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tldrawWhiteboardRef = useRef<{ toggleFullscreen: () => void; addStarStoryToBoard: (skill: string, story: { situation: string; action: string; result: string }) => Promise<void> } | null>(null);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [liveSessionHistory, setLiveSessionHistory] = useState<LiveSessionRecord[]>([]);
  const [historySessionData, setHistorySessionData] = useState<HistorySessionData | null>(null);
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>([]);
  const [documentTextCache, setDocumentTextCache] = useState<Record<string, string>>({});

  // Play sound from Firebase Storage when user clicks "Prepare Live"
  const playFuturisticSound = async () => {
    try {
      console.log('🔊 Attempting to load sound from Firebase Storage...');
      // Get download URL from Firebase Storage
      const soundRef = ref(storage, 'sound/mixkit-magic-marimba-2820.wav');
      console.log('📁 Sound reference created:', soundRef.fullPath);
      
      const downloadURL = await getDownloadURL(soundRef);
      console.log('✅ Got download URL:', downloadURL);
      
      // Create and play audio
      const audio = new Audio(downloadURL);
      audio.volume = 0.7; // Increased volume
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('🔊 Audio loading started'));
      audio.addEventListener('loadeddata', () => console.log('✅ Audio data loaded'));
      audio.addEventListener('canplay', () => console.log('▶️ Audio can play'));
      audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e);
        console.error('Audio error details:', audio.error);
      });
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Sound playing successfully');
          })
          .catch(error => {
            console.error('❌ Could not play sound:', error);
            console.error('Error details:', error.message);
            // Try to show user-friendly error
            notify.error('Could not play sound. Please check your browser audio settings.');
          });
      }
    } catch (error: any) {
      console.error('❌ Could not load sound from Firebase Storage:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Show user-friendly error
      if (error?.code === 'storage/object-not-found') {
        notify.error('Sound file not found in Firebase Storage');
      } else if (error?.code === 'storage/unauthorized') {
        notify.error('Unauthorized access to sound file');
      } else {
        notify.error('Could not load sound file');
      }
    }
  };

  const handleStartLiveSession = () => {
    playFuturisticSound(); // Play sound when user clicks "Prepare Live"
    setIsLiveSessionOpen(true);
  };

  const handleSessionComplete = async (sessionData: {
    analysis: any;
    answers: Record<number, string>;
    questionsCount: number;
  }) => {
    if (!currentUser || !applicationId || !interviewId) return;

    const answeredCount = Object.keys(sessionData.answers).filter(
      key => sessionData.answers[parseInt(key)] && sessionData.answers[parseInt(key)].trim() !== ''
    ).length;

    const newRecord: LiveSessionRecord = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      questionsCount: sessionData.questionsCount,
      answeredCount,
      overallScore: sessionData.analysis.overallScore || 0,
      passed: sessionData.analysis.passed || false,
      tier: sessionData.analysis.tier || 'needs-improvement',
      analysis: sessionData.analysis,
      answers: sessionData.answers
    };

    const updatedHistory = [...liveSessionHistory, newRecord];
    setLiveSessionHistory(updatedHistory);

    // Save to Firestore
    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (applicationDoc.exists()) {
        const appData = applicationDoc.data();
        const interviews = appData.interviews || [];
        const interviewIndex = interviews.findIndex((i: Interview) => i.id === interviewId);
        
        if (interviewIndex !== -1) {
          interviews[interviewIndex].liveSessionHistory = updatedHistory;
          await updateDoc(applicationRef, { interviews });
          console.log('✅ Session history saved to Firestore');
        }
      }
    } catch (error) {
      console.error('❌ Error saving session history:', error);
    }
  };

  const questionEntries = useMemo<QuestionEntry[]>(() => {
    if (!interview?.preparation?.suggestedQuestions) return [];
    const answers = interview.preparation?.suggestedAnswers || [];

    const isGenericAnswer = (answer: string) => {
      const normalized = answer.toLowerCase();
      return (
        (normalized.includes('structure your answer using the star method') && answer.length < 100) ||
        normalized === 'use the star method' ||
        normalized === 'use star method' ||
        (normalized.includes('prepare a specific answer for this question') && answer.length < 150)
      );
    };

    const extractAnswer = (candidate: any): string | null => {
      if (!candidate) return null;
      let rawValue: string | null = null;
      if (typeof candidate === 'object' && 'answer' in candidate) {
        rawValue = String(candidate.answer);
      } else if (typeof candidate === 'string') {
        rawValue = candidate;
      }
      if (!rawValue) return null;
      const cleaned = cleanAnswerText(rawValue);
      if (!cleaned || cleaned.length < 10 || isGenericAnswer(cleaned)) return null;
      return cleaned;
    };

    const matchAnswerForQuestion = (normalizedQuestion: string): string | null => {
      if (!normalizedQuestion) return null;
      const directMatch = answers.find((entry: any) => {
        if (typeof entry !== 'object' || entry === null || !('question' in entry)) return false;
        const normalizedEntry = normalizeQuestionForMatch(entry.question);
        return normalizedEntry && normalizedEntry === normalizedQuestion;
      });
      if (directMatch) {
        const result = extractAnswer(directMatch);
        if (result) return result;
      }
      const fuzzyMatch = answers.find((entry: any) => {
        if (typeof entry !== 'object' || entry === null || !('question' in entry)) return false;
        const normalizedEntry = normalizeQuestionForMatch(entry.question);
        if (!normalizedEntry || !normalizedQuestion) return false;
        const shortest = Math.min(normalizedEntry.length, normalizedQuestion.length) || 1;
        const longest = Math.max(normalizedEntry.length, normalizedQuestion.length) || 1;
        const similarity = shortest / longest;
        return (
          similarity > 0.6 &&
          (normalizedEntry.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedEntry))
        );
      });
      if (fuzzyMatch) {
        const result = extractAnswer(fuzzyMatch);
        if (result) return result;
      }
      return null;
    };

    return interview.preparation.suggestedQuestions
      .map((rawQuestion, index) => {
        const text = sanitizeQuestionText(rawQuestion);
        if (!text || text.length < 10 || text === 'question' || text === 'questions') {
          return null;
        }
        const tags = getQuestionTags(text) as QuestionTag[];
        const normalizedQuestion = normalizeQuestionForMatch(rawQuestion);
        const suggestion =
          extractAnswer(answers[index]) ??
          matchAnswerForQuestion(normalizedQuestion);
        return {
          id: index,
          rawValue: typeof rawQuestion === 'string' ? rawQuestion : String(rawQuestion),
          text,
          tags,
          suggestedApproach: suggestion,
        };
      })
      .filter((entry): entry is QuestionEntry => Boolean(entry));
  }, [interview?.preparation?.suggestedQuestions, interview?.preparation?.suggestedAnswers]);

  const filteredQuestions = useMemo(() => {
    if (activeQuestionFilter === 'all') return questionEntries;
    return questionEntries.filter((entry) => entry.tags.includes(activeQuestionFilter as QuestionTag));
  }, [questionEntries, activeQuestionFilter]);

  useEffect(() => {
    if (questionEntries.length === 0) {
      setCollapsedQuestions({});
      return;
    }
    setCollapsedQuestions((prev) => {
      const next: Record<number, boolean> = {};
      let hasChanges = false;
      questionEntries.forEach(({ id }) => {
        if (prev[id] === undefined) {
          next[id] = true;
          hasChanges = true;
        } else {
          next[id] = prev[id];
        }
      });
      if (Object.keys(prev).length !== Object.keys(next).length) {
        hasChanges = true;
      }
      return hasChanges ? next : prev;
    });
  }, [questionEntries]);

  const handleToggleSaveQuestion = (rawQuestion: string) => {
    if (typeof window === 'undefined') return;
    setSavedQuestionsState((prev) => {
      const exists = prev.includes(rawQuestion);
      const updated = exists ? prev.filter((item) => item !== rawQuestion) : [...prev, rawQuestion];
      localStorage.setItem('savedQuestions', JSON.stringify(updated));
      if (exists) {
        notify.info('Question removed from saved list');
      } else {
        notify.success('Question saved');
      }
      return updated;
    });
  };

  const handleCreateNoteFromQuestion = (content: string, displayIndex: number) => {
    const newNoteId = uuidv4();
    const newNote: Note = {
      id: newNoteId,
      title: `Interview Question ${displayIndex}`,
      content,
      color: '#f48fb1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: 50, y: 50 }
    };
    const updatedNotes = [...stickyNotes, newNote];
    setStickyNotes(updatedNotes);
    setNotePositions(prev => ({
      ...prev,
      [newNoteId]: { x: 50, y: 50 }
    }));
    setNoteSizes(prev => ({
      ...prev,
      [newNoteId]: { width: 250, height: 200 }
    }));
    updateInterviewNotes(updatedNotes);
    notify.success('Note created from question');
  };

  const handleToggleSuggestionVisibility = (questionId: number) => {
    setCollapsedQuestions(prev => ({
      ...prev,
      [questionId]: prev[questionId] === false ? true : false
    }));
  };

  // Reusable company news fetcher
  const fetchCompanyNews = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;
    try {
      setIsNewsLoading(true);
      setNewsError(null);
      const prompt = `
Return 4-6 RECENT company updates about ${application.companyName} helpful for a candidate interviewing for "${application.position}". Use this job post if helpful: ${(interview.jobPostUrl || jobUrl)}.
Output ONLY JSON like {"items":[{"title":"...","date":"2 days ago","sentiment":"positive|neutral|negative","summary":"...","source":"Company Website","url":"https://..."}]}.
Include source (e.g., "Company Website", "LinkedIn", "Press Release") and URL when available.
`;
      const resp = await queryPerplexity(prompt);
      let content: any = resp?.text ?? resp?.choices?.[0]?.message?.content ?? '';
      if (typeof content !== 'string') content = String(content ?? '');
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      const parsed = JSON.parse(jsonString);
      const items: NewsItem[] = (parsed.items || parsed || []).map((it: any) => ({
        title: String(it.title || ''),
        date: String(it.date || ''),
        sentiment: (['positive', 'neutral', 'negative'].includes((it.sentiment || '').toLowerCase()) ? (it.sentiment || '').toLowerCase() : 'neutral') as 'positive' | 'neutral' | 'negative',
        summary: String(it.summary || ''),
        source: it.source ? String(it.source) : undefined,
        url: it.url ? String(it.url) : undefined
      })).filter((n: NewsItem) => n.title && n.summary);
      if (!items.length) throw new Error('No items parsed');
      setNewsItems(items);
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = {
          ...interview,
          companyNews: items,
          lastCompanyNewsUpdated: new Date().toISOString()
        };
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
        setInterview({ ...interview, companyNews: items, lastCompanyNewsUpdated: new Date().toISOString() });
      }
    } catch (e) {
      console.error('Error fetching company updates:', e);
      setNewsError('Failed to load company updates');
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Create a note from a news item
  const createNoteFromNews = async (news: NewsItem) => {
    if (!currentUser || !application || !interview || !applicationId) return;

    // Format news content as HTML
    const htmlContent = `
      <h2>Company Update: ${news.title}</h2>
      ${news.summary ? `<p>${news.summary}</p>` : ''}
      ${news.source ? `<p><strong>Source:</strong> ${news.source}</p>` : ''}
      ${news.url ? `<p><strong>Link:</strong> <a href="${news.url}" target="_blank" rel="noopener noreferrer">${news.url}</a></p>` : ''}
      <h3>Key Points to Mention:</h3>
      <ul>
        <li>${news.title}</li>
        ${news.summary ? `<li>${news.summary.split('.')[0]}</li>` : ''}
      </ul>
    `.trim();

    // Extract preview text
    const previewText = `${news.title} ${news.summary || ''}`.trim().substring(0, 100);

    // Create new note document
    const newDoc: NoteDocument = {
      id: uuidv4(),
      title: `Company Update: ${news.title.substring(0, 50)}${news.title.length > 50 ? '...' : ''}`,
      content: htmlContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preview: previewText,
    };

    // Add to documents and set as active
    const updatedDocs = [...noteDocuments, newDoc];
    setNoteDocuments(updatedDocs);
    setActiveNoteDocumentId(newDoc.id);
    
    // Highlight the newly created document
    setHighlightedDocumentId(newDoc.id);
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedDocumentId(null);
    }, 3000);
    
    // Open notes tab
    setSidebarTab('notes');

    // Save to Firebase
    await saveNoteDocuments(updatedDocs, newDoc.id);
    
    notify.success('Company update saved to Notes');
  };

  // Filter notes by color
  const filteredNotes = useMemo(() => {
    if (!filterColor) return stickyNotes;
    return stickyNotes.filter(note => note.color === filterColor);
  }, [stickyNotes, filterColor]);

  // État pour suivre les questions sauvegardées et celles qui sont réduites/étendues
  const [savedQuestionsState, setSavedQuestionsState] = useState<string[]>([]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<number, boolean>>({});
  const [focusedQuestion, setFocusedQuestion] = useState<QuestionEntry | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !applicationId || !interviewId) {
        notify.error('Missing required information');
        navigate('/applications');
        return;
      }

      // Get navigation state if available
      const navigationState = location.state as {
        interviewId?: string;
        companyName?: string;
        position?: string;
        interviewDate?: string;
        interviewTime?: string;
        jobUrl?: string;
        jobDescription?: string;
      } | null;

      try {
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);

        if (applicationSnapshot.exists()) {
          const appData = { id: applicationSnapshot.id, ...applicationSnapshot.data() } as JobApplication;
          setApplication(appData);

          const interviewData = appData.interviews?.find(interview => interview.id === interviewId);
          if (interviewData) {
            setInterview(interviewData);
            
            // Load live session history
            if (interviewData.liveSessionHistory) {
              setLiveSessionHistory(interviewData.liveSessionHistory);
            }

            // Load context documents
            if (interviewData.contextDocuments) {
              setContextDocuments(interviewData.contextDocuments);
            }

            // Use navigation state URL if available, otherwise use stored URL
            const urlToUse = navigationState?.jobUrl || interviewData.jobPostUrl || appData.url || '';
            setJobUrl(urlToUse);
          } else {
            notify.error('Interview not found');
            navigate('/applications');
          }
        } else {
          notify.error('Application not found');
          navigate('/applications');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        notify.error('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, applicationId, interviewId, navigate, location.state]);

  // Typing animation refs - declared early so they can be used in useEffect hooks
  const animatedMessagesRef = useRef<Set<string>>(new Set()); // Track by message ID (timestamp + content hash)
  const isInitialLoadRef = useRef(true);
  const typingIntervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const prevMessagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    if (interview?.skillRatings) {
      setSkillRatings(interview.skillRatings);
    }
  }, [interview]);

  // Reset animation refs when interviewId changes
  useEffect(() => {
    // Clear all animation state when switching interviews
    animatedMessagesRef.current.clear();
    typingIntervalsRef.current.forEach(interval => clearInterval(interval));
    typingIntervalsRef.current.clear();
    isInitialLoadRef.current = true;
    prevMessagesRef.current = [];
    setTypingMessages({});
  }, [interviewId]);

  // Initialize free-form notes from interview data
  useEffect(() => {
    if (interview?.freeFormNotes) {
      setFreeFormNotes(interview.freeFormNotes);
    }
  }, [interview]);

  // Initialize note documents and handle migration (only once on load)
  const hasInitializedDocuments = useRef(false);

  useEffect(() => {
    if (!interview || hasInitializedDocuments.current) return;

    if (interview.noteDocuments && interview.noteDocuments.length > 0) {
      // Use existing documents
      setNoteDocuments(interview.noteDocuments);
      setActiveNoteDocumentId(interview.activeNoteDocumentId || null);
      hasInitializedDocuments.current = true;
    } else if (interview.freeFormNotes && interview.freeFormNotes.trim()) {
      // Migrate old free-form notes to first document
      const migratedDoc: NoteDocument = {
        id: uuidv4(),
        title: 'My Notes',
        content: interview.freeFormNotes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preview: interview.freeFormNotes.substring(0, 100),
      };
      setNoteDocuments([migratedDoc]);
      setActiveNoteDocumentId(null); // Start in library view
      hasInitializedDocuments.current = true;
      // Save migrated structure
      saveNoteDocuments([migratedDoc], null);
    } else {
      hasInitializedDocuments.current = true;
    }
  }, [interview]);

  // Update drawingColor when theme changes
  useEffect(() => {
    const updateDrawingColor = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setDrawingColor(isDarkMode ? '#ffffff' : '#ef4444');
    };

    // Initial check
    updateDrawingColor();

    // Listen for theme changes
    const observer = new MutationObserver(updateDrawingColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Also listen to custom theme change events
    const handleThemeChange = () => updateDrawingColor();
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  // Remove undefined fields recursively for Firestore
  const sanitizeForFirestore = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(sanitizeForFirestore);
    }
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      Object.keys(value).forEach((k) => {
        const v = (value as any)[k];
        if (v !== undefined) {
          result[k] = sanitizeForFirestore(v);
        }
      });
      return result;
    }
    return value;
  };

  useEffect(() => {
    // Load chat history from interview data if available
    if (interview?.chatHistory) {
      setChatMessages(interview.chatHistory);
      
      // When loading from Firestore, mark all messages as already animated
      // and initialize typingMessages with full content to avoid animation
      const loadedMessages = interview.chatHistory;
      const initialTypingMessages: Record<number, string> = {};
      
      loadedMessages.forEach((msg, index) => {
        if (msg.role === 'assistant' && msg.content !== '__thinking__') {
          const fullText = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          if (fullText.length > 0) {
            const messageId = `${msg.timestamp}-${fullText.substring(0, 20)}`;
            animatedMessagesRef.current.add(messageId);
            initialTypingMessages[index] = fullText;
          }
        }
      });
      
      setTypingMessages(initialTypingMessages);
      // Reset isInitialLoadRef to true so the animation effect treats this as initial load
      isInitialLoadRef.current = true;
    } else {
      // No chat history, reset everything
      setChatMessages([]);
      setTypingMessages({});
      animatedMessagesRef.current.clear();
    }
  }, [interview?.chatHistory]);

  // Track scroll position - no automatic scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsUserNearBottom(distanceFromBottom < 100); // Within 100px of bottom
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // No automatic scrolling - user controls scroll position

  useEffect(() => {
    if (interview) {
      setNotes(interview.notes || '');
      // Load checklist from interview if available
      if (interview.checklist && interview.checklist.length > 0) {
        setChecklist(interview.checklist);
      }
      if (interview.skillCoach) setSkillCoach(interview.skillCoach);
      if (interview.resourcesData) setResourcesData(interview.resourcesData);

      // Initialize sticky notes
      if (interview.stickyNotes && interview.stickyNotes.length > 0) {
        setStickyNotes(interview.stickyNotes);

        // Initialize note positions only once or for newly added notes
        const positions = { ...notePositions };
        const sizes = { ...noteSizes };
        interview.stickyNotes.forEach((note, index) => {
          // Only set position if it doesn't already exist in notePositions
          if (!positions[note.id]) {
            positions[note.id] = note.position || {
              x: (index % 3) * 300 + 50,
              y: Math.floor(index / 3) * 200 + 50
            };
          }
          // Initialize sizes
          if (!sizes[note.id]) {
            sizes[note.id] = {
              width: note.width || 250,
              height: note.height || 200
            };
          }
        });
        setNotePositions(positions);
        setNoteSizes(sizes);
      } else {
        // If there are no sticky notes but there are old notes, convert them
        if (interview.notes && !interview.stickyNotes) {
          const initialNote: Note = {
            id: uuidv4(),
            title: 'Imported Notes',
            content: interview.notes,
            color: '#ffeb3b',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            position: { x: 50, y: 50 }
          };
          setStickyNotes([initialNote]);
        }
      }

      // Initialize connections
      if (interview.noteConnections) {
        setConnections(interview.noteConnections);
      }
    }
  }, [interview]);

  // Fetch dynamic company updates based on job post/company using Perplexity
  useEffect(() => {
    const shouldFetch = !!application?.companyName && !!interview?.preparation && !!(interview?.jobPostUrl || jobUrl);
    if (!shouldFetch || !currentUser || !application || !interview || !applicationId) return;

    const isStale = (() => {
      if (!interview.lastCompanyNewsUpdated) return true;
      const last = new Date(interview.lastCompanyNewsUpdated).getTime();
      const now = Date.now();
      return now - last > 1000 * 60 * 60 * 24; // refresh if older than 24h
    })();

    if (interview.companyNews && interview.companyNews.length > 0 && !isStale) {
      setNewsItems(interview.companyNews);
      return;
    }

    fetchCompanyNews();
  }, [application?.companyName, application?.position, interview?.preparation, interview?.jobPostUrl, jobUrl, currentUser, application, interview, applicationId]);

  const handleAnalyzeJobPost = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;

    if (!jobUrl) {
      notify.error('Please enter a job post URL');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingProgress(0);
    setAnalyzingMessage("Initializing AI analysis...");

    try {
      // Gradual progress updates for smooth animation
      setAnalyzingProgress(5);
      setAnalyzingMessage("Connecting to AI services...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(10);
      setAnalyzingMessage("Loading job posting...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(15);
      setAnalyzingMessage("Extracting job requirements...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(25);
      setAnalyzingMessage("Parsing job description...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(35);
      setAnalyzingMessage("Analyzing company information...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(45);
      setAnalyzingMessage("Cross-referencing with market data...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(55);
      setAnalyzingMessage("Generating initial insights...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(65);
      setAnalyzingMessage("Preparing interview questions...");
      await new Promise(resolve => setTimeout(resolve, 150));

      const analysisRaw = await analyzeJobPost(
        jobUrl,
        application.position,
        application.companyName,
        'perplexity' // Use Perplexity as default
      );

      // Ensure all required fields are present with default values if missing
      const analysisResult: JobPostAnalysisResult = {
        keyPoints: analysisRaw.keyPoints || [],
        requiredSkills: analysisRaw.requiredSkills || [],
        suggestedQuestions: analysisRaw.suggestedQuestions || [],
        suggestedAnswers: analysisRaw.suggestedAnswers || [],
        companyInfo: analysisRaw.companyInfo || '',
        positionDetails: analysisRaw.positionDetails || '',
        cultureFit: analysisRaw.cultureFit || '',
        error: analysisRaw.error
      };

      setAnalyzingProgress(75);
      setAnalyzingMessage("Refining interview questions...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(85);
      setAnalyzingMessage("Finalizing analysis...");
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check if there's an error
      if (analysisResult.error) {
        notify.error(analysisResult.error);
        setIsAnalyzing(false);
        setAnalyzingProgress(0);
        return;
      }

      // Validate that we have at least some data
      const hasData =
        analysisResult.keyPoints.length > 0 ||
        analysisResult.requiredSkills.length > 0 ||
        analysisResult.suggestedQuestions.length > 0 ||
        analysisResult.companyInfo ||
        analysisResult.positionDetails;

      if (!hasData) {
        notify.error('No data was extracted from the job posting. Please try again or check the URL.');
        setIsAnalyzing(false);
        setAnalyzingProgress(0);
        return;
      }

      // Log the data for debugging
      console.log('Analysis result:', {
        keyPoints: analysisResult.keyPoints.length,
        requiredSkills: analysisResult.requiredSkills.length,
        suggestedQuestions: analysisResult.suggestedQuestions.length,
        suggestedAnswers: analysisResult.suggestedAnswers.length,
        hasCompanyInfo: !!analysisResult.companyInfo,
        hasPositionDetails: !!analysisResult.positionDetails,
        hasCultureFit: !!analysisResult.cultureFit
      });

      const sanitizedResult = sanitizeForFirestore(analysisResult);

      // Find the index of the interview in the application
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex === -1) {
        notify.error('Could not find interview to update');
        setIsAnalyzing(false);
        return;
      }

      // Create updated interviews array
      const updatedInterviews = [...(application.interviews || [])];
      updatedInterviews[interviewIndex] = {
        ...interview,
        preparation: sanitizedResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      };

      // Update Firestore - Make sure applicationId is not undefined
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });

      // Update local state - also update the application state to ensure consistency
      setInterview({
        ...interview,
        preparation: sanitizedResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      });

      // Update application state to reflect the changes
      setApplication({
        ...application,
        interviews: updatedInterviews
      });

      setAnalyzingProgress(95);
      setAnalyzingMessage("Saving results...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setAnalyzingProgress(100);
      setAnalyzingMessage("Analysis complete!");

      // Small delay to show 100% before closing
      await new Promise(resolve => setTimeout(resolve, 300));

      notify.success('Job post analyzed successfully! All sections have been updated.');
    } catch (error) {
      console.error('Error analyzing job post:', error);
      notify.error('Failed to analyze job post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setAnalyzingProgress(0);
    }
  };

  // Add a function to update interview status
  const updateInterviewStatus = async (newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    if (!currentUser || !application || !interview || !applicationId) return;

    try {
      // Get the application reference
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);

      // Create updated interviews array
      const updatedInterviews = application.interviews?.map(item => {
        if (item.id === interviewId) {
          return { ...item, status: newStatus };
        }
        return item;
      });

      // Update in Firestore
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setInterview({
        ...interview,
        status: newStatus
      });

      // Close status menu
      setStatusMenuOpen(false);

      // Show success message
      notify.success(`Interview status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating interview status:', error);
      notify.error('Failed to update interview status');
    }
  };

  const handleRateSkill = async (skill: string, rating: number) => {
    if (!currentUser || !application || !interview || !applicationId) return;

    // Update local state
    const newRatings = { ...skillRatings, [skill]: rating };
    setSkillRatings(newRatings);

    try {
      // Find the index of the interview in the application
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex === -1) {
        notify.error('Could not find interview to update');
        return;
      }

      // Create updated interviews array
      const updatedInterviews = [...(application.interviews || [])];
      updatedInterviews[interviewIndex] = {
        ...interview,
        skillRatings: newRatings
      };

      // Update Firestore
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });

      // Update local interview state
      setInterview({
        ...interview,
        skillRatings: newRatings
      });

      // Provide subtle feedback
      notify.success('Skill rating updated', { duration: 1500 });
    } catch (error) {
      console.error('Error updating skill rating:', error);
      notify.error('Failed to save skill rating');
    }
  };

  // Helper function to save chat history to Firestore
  const saveChatHistory = async (messages: ChatMessage[]) => {
    if (!currentUser || !application || !interview || !applicationId) return;

    try {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = {
          ...interview,
          chatHistory: messages
        };

        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });

        // Update local interview state
        setInterview({
          ...interview,
          chatHistory: messages
        });
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Helper function to send a message directly with text (used for auto-sending practice messages)
  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isSending || !currentUser || !application || !interview || !applicationId) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    // Add a temporary assistant message for 'thinking...'
    const thinkingMessage: ChatMessage = {
      role: 'assistant',
      content: '__thinking__',
      timestamp: Date.now() + 1 // ensure unique timestamp
    };

    const updatedMessages = [...chatMessages, userMessage, thinkingMessage];
    setChatMessages(updatedMessages);
    setMessage('');
    setIsSending(true);

    try {
      // Load text content from context documents
      let documentContextText = '';
      if (contextDocuments.length > 0) {
        try {
          const documentTexts = await Promise.all(
            contextDocuments.map(doc => loadDocumentText(doc))
          );
          
          documentContextText = '\n\nADDITIONAL CONTEXT FROM USER DOCUMENTS:\n';
          contextDocuments.forEach((doc, index) => {
            const text = documentTexts[index];
            if (text && text.trim()) {
              documentContextText += `\n=== ${doc.title} (${doc.type}) ===\n${text}\n`;
            }
          });
        } catch (error) {
          console.error('Error loading document context:', error);
          // Continue without document context if loading fails
        }
      }

      // Build context for the AI based on the job details
      const context = `
        You are a conversational AI interview coach helping the user prepare for their ${interview.type} interview at ${application.companyName} for the ${application.position} position.

        KEY CONTEXT:
        - Position: ${application.position}
        - Company: ${application.companyName}
        - Required Skills: ${interview.preparation?.requiredSkills?.join(', ') || "Not specified"}
        ${documentContextText}
        
        CONVERSATIONAL GUIDELINES:
        - Keep your responses short and concise (2-3 paragraphs max)
        - Start with a brief, casual response before diving into advice
        - Don't dump all information at once - let the conversation flow naturally
        - If the user says "hello" or similar, respond with a brief greeting and ask how you can help
        - Ask follow-up questions to guide the conversation
        - Avoid walls of text - use short paragraphs with one main point each
        - Use the document context provided above to give personalized advice based on the user's actual background and experience
        
        USER'S CHAT HISTORY (for context only - don't reference this directly):
        ${chatMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}
      `;

      // Query GPT-4o-mini for fast, high-quality chat responses
      const response = await queryChatFast(
        context + "\n\nUser message: " + messageText,
        {
          temperature: 0.7,
          maxTokens: 1000
        }
      );

      // Check if the response contains an error
      let aiContent = response.text || "I'm sorry, I couldn't process your request. Please try again later.";
      // Remove <think> tags if present (shouldn't be needed for GPT but just in case)
      aiContent = aiContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now()
      };

      // Replace the last thinking message with the real response
      const newMessages = updatedMessages.slice(0, -1).concat(aiMessage);
      setChatMessages(newMessages);
      await saveChatHistory(newMessages);
    } catch (error) {
      // Replace the last thinking message with an error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. This might be due to network issues or browser settings blocking requests. Please try again later.",
        timestamp: Date.now()
      };
      const newMessages = updatedMessages.slice(0, -1).concat(errorMessage);
      setChatMessages(newMessages);
      try {
        await saveChatHistory(newMessages);
      } catch (saveError) {
        notify.error('Failed to save chat history');
      }
      notify.error('Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isSending || !currentUser || !application || !interview || !applicationId) return;
    await sendMessageWithText(message);
  };

  // Typing animation effect - ChatGPT style
  useEffect(() => {
    const wasInitialLoad = isInitialLoadRef.current;
    isInitialLoadRef.current = false;

    // Check if messages actually changed (not just a re-render)
    const messagesChanged = chatMessages.length !== prevMessagesRef.current.length ||
      chatMessages.some((msg, idx) => {
        const prevMsg = prevMessagesRef.current[idx];
        return !prevMsg || msg.content !== prevMsg.content || msg.role !== prevMsg.role || msg.timestamp !== prevMsg.timestamp;
      });

    if (!messagesChanged && !wasInitialLoad) {
      prevMessagesRef.current = [...chatMessages];
      return; // No actual changes, skip processing
    }

    chatMessages.forEach((msg, index) => {
      // Only animate assistant messages that are not thinking
      if (msg.role === 'assistant' && msg.content !== '__thinking__') {
        const fullText = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        
        if (fullText.length === 0) {
          return; // Skip empty messages
        }

        // Create a unique ID for this message based on timestamp and content
        const messageId = `${msg.timestamp}-${fullText.substring(0, 20)}`;
        
        // Check if this message is already fully typed (loaded from Firestore)
        const currentTypedText = typingMessages[index];
        if (currentTypedText === fullText) {
          // Already fully typed, mark as animated
          animatedMessagesRef.current.add(messageId);
          return;
        }

        // Check if this message content changed (e.g., "__thinking__" replaced with real content)
        const prevMsg = prevMessagesRef.current[index];
        const isContentChanged = !prevMsg || prevMsg.content !== msg.content;
        const isNewMessage = index >= prevMessagesRef.current.length;
        
        // Check if message was already marked as animated (loaded from Firestore)
        const isAlreadyAnimated = animatedMessagesRef.current.has(messageId);
        
        // Determine if we should animate: new message, content changed, or not yet animated
        // But NOT if it's initial load (messages loaded from Firestore) or already animated
        const shouldAnimate = (isNewMessage || isContentChanged) && 
                             !isAlreadyAnimated &&
                             !wasInitialLoad;

        if (shouldAnimate && fullText.length > 0) {
          // Mark as being animated
          animatedMessagesRef.current.add(messageId);
          
          // Clear any existing interval for this index
          const existingInterval = typingIntervalsRef.current.get(index);
          if (existingInterval) {
            clearInterval(existingInterval);
          }

          // Calculate adaptive typing speed based on message length
          // Longer messages get slightly faster typing to avoid too long animations
          const baseDelay = 15; // Base delay in ms per character
          const adaptiveDelay = fullText.length > 500 
            ? Math.max(8, baseDelay - Math.floor((fullText.length - 500) / 100)) // Faster for very long messages
            : baseDelay;

          // Start with empty string
          setTypingMessages(prev => ({ ...prev, [index]: '' }));

          // Animate typing character by character
          let currentIndex = 0;
          const typingInterval = setInterval(() => {
            if (currentIndex < fullText.length) {
              setTypingMessages(prev => ({
                ...prev,
                [index]: fullText.slice(0, currentIndex + 1)
              }));
              currentIndex++;
            } else {
              // Animation complete
              clearInterval(typingInterval);
              typingIntervalsRef.current.delete(index);
            }
          }, adaptiveDelay);

          typingIntervalsRef.current.set(index, typingInterval);
        } else if (wasInitialLoad || (!shouldAnimate && !currentTypedText)) {
          // Loaded message or already processed - show full text immediately
          if (!currentTypedText || currentTypedText !== fullText) {
            animatedMessagesRef.current.add(messageId);
            setTypingMessages(prev => ({ ...prev, [index]: fullText }));
          }
        }
      }
    });

    prevMessagesRef.current = [...chatMessages];

    // Cleanup intervals on unmount
    return () => {
      typingIntervalsRef.current.forEach(interval => clearInterval(interval));
      typingIntervalsRef.current.clear();
    };
  }, [chatMessages]);

  const updateInterviewNotes = (updatedNotes: Note[]) => {
    if (!currentUser || !application || !interview || !applicationId) return;

    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

    if (interviewIndex !== -1) {
      // Include sizes from noteSizes state
      const notesWithSizes = updatedNotes.map(note => ({
        ...note,
        width: noteSizes[note.id]?.width || note.width || 250,
        height: noteSizes[note.id]?.height || note.height || 200,
        position: notePositions[note.id] || note.position
      }));

      const updatedInterviews = [...(application.interviews || [])];
      updatedInterviews[interviewIndex] = {
        ...interview,
        stickyNotes: notesWithSizes
      };

      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      }).catch(error => {
        console.error('Error updating notes:', error);
        notify.error('Failed to update notes');
      });

      // Update the interview object without affecting notePositions or other state
      setInterview({
        ...interview,
        stickyNotes: notesWithSizes
      });
    }
  };

  const saveNotes = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;

    try {
      setIsSavingNotes(true);

      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = {
          ...interview,
          notes: notes
        };

        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });

        // Update local interview state
        setInterview(prev => {
          if (prev) {
            return {
              ...prev,
              notes: notes
            };
          }
          return prev;
        });

        notify.success('Notes saved successfully');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      notify.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const createNewNote = () => {
    setActiveNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('#ffeb3b');
    setIsNoteModalOpen(true);
  };

  const openNote = (note: Note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color);
    setIsNoteModalOpen(true);
  };

  // Handle double-click to edit note
  const [lastClickTime, setLastClickTime] = useState<{ noteId: string; time: number } | null>(null);
  const [showCanvasLimitWarning, setShowCanvasLimitWarning] = useState(false);

  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const now = Date.now();
    const note = stickyNotes.find(n => n.id === noteId);

    if (!note) return;

    // Check if this is a double-click (within 300ms)
    if (lastClickTime && lastClickTime.noteId === noteId && now - lastClickTime.time < 300) {
      // Double-click detected - open note for editing
      openNote(note);
      setLastClickTime(null);
    } else {
      // Single click - just record the time
      setLastClickTime({ noteId, time: now });
    }
  };

  const saveNote = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;

    try {
      // Prepare the new note or updated note
      let updatedNotes: Note[];
      const timestamp = Date.now();

      if (activeNote) {
        // Update existing note
        updatedNotes = stickyNotes.map(note =>
          note.id === activeNote.id
            ? {
              ...note,
              title: noteTitle,
              content: noteContent,
              color: noteColor,
              updatedAt: timestamp,
              position: notePositions[note.id],
              connections: connections
                .filter(conn => conn.start === note.id || conn.end === note.id)
                .map(conn => conn.start === note.id ? conn.end : conn.start)
            }
            : note
        );
      } else {
        // Create new note
        const newNoteId = uuidv4();
        const newNote: Note = {
          id: newNoteId,
          title: noteTitle,
          content: noteContent,
          color: noteColor,
          createdAt: timestamp,
          updatedAt: timestamp,
          position: { x: 50, y: 50 }
        };
        updatedNotes = [...stickyNotes, newNote];

        // Add new note position to notePositions
        setNotePositions(prev => ({
          ...prev,
          [newNoteId]: { x: 50, y: 50 }
        }));
        // Add new note size to noteSizes
        setNoteSizes(prev => ({
          ...prev,
          [newNoteId]: { width: 250, height: 200 }
        }));
      }

      setStickyNotes(updatedNotes);

      // Use the helper function to update the interview
      updateInterviewNotes(updatedNotes);

      notify.success(activeNote ? 'Note updated successfully' : 'Note created successfully');

      // Close the modal
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      notify.error('Failed to save note');
    }
  };

  // OPTIMIZATION: Memoized deleteNote handler
  const deleteNote = useCallback(async (noteId: string) => {
    if (!currentUser || !application || !interview || !applicationId) return;

    try {
      // Filter out the deleted note
      setStickyNotes(prevNotes => {
        const updatedNotes = prevNotes.filter(note => note.id !== noteId);
        // Use our helper function to update the interview
        updateInterviewNotes(updatedNotes);
        return updatedNotes;
      });

      notify.success('Note deleted successfully');

      // If the note modal is open and this note is being edited, close it
      if (isNoteModalOpen && activeNote && activeNote.id === noteId) {
        setIsNoteModalOpen(false);
        setActiveNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      notify.error('Failed to delete note');
    }
  }, [currentUser, application, interview, applicationId, isNoteModalOpen, activeNote]);

  const regenerateQuestions = async () => {
    if (!currentUser || !application || !interview || !interview.jobPostUrl || !applicationId) {
      notify.error('No job post URL available for generating new questions');
      return;
    }

    // Ne pas afficher d'info toast car nous avons un loader visuel
    setIsRegeneratingQuestions(true);
    setRegeneratingProgress(0);
    setRegeneratingMessage("Initializing question generation...");

    // Remonter en haut de la page pour voir le chargement
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Gradual progress updates for smooth animation
      setRegeneratingProgress(5);
      setRegeneratingMessage("Loading job requirements...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setRegeneratingProgress(10);
      setRegeneratingMessage("Analyzing job requirements...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setRegeneratingProgress(20);
      setRegeneratingMessage("Reviewing user profile...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setRegeneratingProgress(30);
      setRegeneratingMessage("Crafting question prompts...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setRegeneratingProgress(40);
      setRegeneratingMessage("Creating personalized questions...");
      await new Promise(resolve => setTimeout(resolve, 150));

      setRegeneratingProgress(50);
      setRegeneratingMessage("Querying AI for questions...");
      await new Promise(resolve => setTimeout(resolve, 150));
      // Récupérer les questions sauvegardées du localStorage
      const savedQuestions: string[] = JSON.parse(localStorage.getItem('savedQuestions') || '[]');

      // Call Perplexity to generate different questions
      const prompt = `
Based on this job posting for a ${application.position} position at ${application.companyName}: ${interview.jobPostUrl}

Please generate 5 different interview questions that might be asked during this interview. Make them varied - some behavioral, some technical, some about the company fit.

CRITICAL: For EACH question, provide a UNIQUE and HIGHLY SPECIFIC suggested answer approach that:
1. Directly addresses the specific question asked (NOT generic advice like "use STAR method")
2. Provides concrete, actionable guidance tailored to THAT EXACT question
3. References specific aspects of the question (e.g., if the question mentions "data analytics", the answer should specifically address data analytics)
4. Suggests specific skills, experiences, or examples relevant to THAT question
5. Is 2-4 sentences of practical, question-specific advice
6. Each answer must be DIFFERENT and UNIQUE - do not repeat the same guidance for different questions

IMPORTANT: 
- Do NOT use generic phrases like "Structure your answer using the STAR method" for all questions
- Each answer must be tailored to its specific question
- If a question is about technical skills, the answer should focus on technical aspects
- If a question is about behavioral situations, the answer should focus on behavioral examples
- Make each answer distinct and question-specific

Return the questions in a JSON format like this:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here",
    "Question 4 text here",
    "Question 5 text here"
  ],
  "answers": [
    {"question": "Question 1 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 1, addressing its particular focus and requirements"},
    {"question": "Question 2 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 2, addressing its particular focus and requirements"},
    {"question": "Question 3 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 3, addressing its particular focus and requirements"},
    {"question": "Question 4 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 4, addressing its particular focus and requirements"},
    {"question": "Question 5 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 5, addressing its particular focus and requirements"}
  ]
}

CRITICAL: The "question" field in each answer object must EXACTLY match the corresponding question in the questions array. This is essential for proper matching.
Make sure each answer is completely unique and specific to its question - no generic advice.
`;

      setRegeneratingProgress(60);
      setRegeneratingMessage("Waiting for GPT-4o response...");
      await new Promise(resolve => setTimeout(resolve, 150));

      // Use GPT-4o for higher quality question generation
      const response = await queryQuestionGeneration(prompt);

      if (response && !response.error) {
        setRegeneratingProgress(70);
        setRegeneratingMessage("Processing AI response...");
        await new Promise(resolve => setTimeout(resolve, 150));

        setRegeneratingProgress(80);
        setRegeneratingMessage("Parsing question data...");
        await new Promise(resolve => setTimeout(resolve, 150));

        setRegeneratingProgress(85);
        setRegeneratingMessage("Formatting questions...");
        await new Promise(resolve => setTimeout(resolve, 150));
        // Extract and clean the JSON from the response
        const contentFromAPI = response?.text || '';
        if (!contentFromAPI) {
          notify.error('Empty response from GPT-4o API');
          return;
        }

        try {
          // Clean content: remove <think> and <think> tags and other unwanted content
          const content = String(contentFromAPI)
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/<think>[\s\S]*?<\/redacted_reasoning>/g, '')
            .trim();

          // Check if there's JSON-looking content
          if (!/\{[\s\S]*\}/.test(content) && !/```json/.test(content)) {
            notify.error('Unexpected response format from Perplexity API');
            return;
          }

          // Find JSON content within the response - improved regex to capture full JSON objects
          let jsonString = '';

          // First try to find JSON in code blocks
          const jsonCodeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
          if (jsonCodeBlockMatch) {
            jsonString = jsonCodeBlockMatch[1].trim();
          } else {
            // Try to find JSON object - match from first { to last }
            const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
            if (jsonObjectMatch) {
              jsonString = jsonObjectMatch[0];
            } else {
              // Last resort: use the whole content
              jsonString = content;
            }
          }

          // Try to parse JSON
          const tryParse = (s: string) => {
            try {
              return JSON.parse(s);
            } catch {
              return null;
            }
          };

          let newQuestionsData = tryParse(jsonString);

          // If parsing failed, try to repair the JSON
          if (!newQuestionsData) {
            // Attempt minimal repairs: remove trailing commas, fix missing commas
            let repaired = jsonString
              .replace(/,\s*\]/g, ']')  // Remove trailing commas before ]
              .replace(/,\s*\}/g, '}')  // Remove trailing commas before }
              .replace(/"\s+"/g, '", "'); // Fix missing commas between quoted strings

            newQuestionsData = tryParse(repaired);

            // If still failing, try to extract questions from plain text
            if (!newQuestionsData) {
              const lines = content.split(/\n|\r/).map(l => l.trim());
              const questionsGuess = lines
                .filter(l => /\?$/.test(l) || /question/i.test(l))
                .map(l => l.replace(/^[-*•\d+\.]\s*/, '').replace(/^["']|["']$/g, ''))
                .filter(Boolean)
                .slice(0, 5);

              if (questionsGuess.length > 0) {
                newQuestionsData = { questions: questionsGuess };
              } else {
                notify.error('Failed to parse questions from API response');
                return;
              }
            }
          }

          // Fonction pour nettoyer les chaînes des préfixes JSON
          const cleanString = (str: string): string => {
            if (!str || typeof str !== 'string') return '';
            return str
              .trim()
              // Enlever les préfixes JSON comme "question": " ou "answer": "
              .replace(/^["']?question["']?\s*:\s*["']?/i, '')
              .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
              // Enlever les séparateurs JSON au milieu comme ", "answer": "
              .replace(/["']?\s*,\s*["']?answer["']?\s*:\s*["']?/gi, '')
              .replace(/["']?\s*,\s*["']?question["']?\s*:\s*["']?/gi, '')
              // Enlever les virgules à la fin (après les guillemets)
              .replace(/["']\s*,\s*$/g, '')
              .replace(/,\s*$/g, '')
              // Enlever les accolades et crochets à la fin
              .replace(/["']?\s*\}\s*$/g, '')
              .replace(/["']?\s*\]\s*$/g, '')
              .replace(/["']?\s*\}\s*,?\s*$/g, '')
              .replace(/["']?\s*\]\s*,?\s*$/g, '')
              // Enlever les guillemets au début
              .replace(/^["']?/g, '')
              // Enlever les guillemets à la fin (après avoir enlevé les virgules)
              .replace(/["']\s*$/g, '')
              .replace(/["']?$/g, '')
              // Enlever les objets JSON au début
              .replace(/^\{.*?:\s*["']?/, '')
              .replace(/^\[.*?:\s*["']?/, '')
              // Enlever les crochets/parenthèses non fermés au début
              .replace(/^\[+\s*/, '')
              .replace(/^\{+\s*/, '')
              .replace(/^\(+\s*/, '')
              // Enlever les crochets/parenthèses non fermés à la fin
              .replace(/\s*\[+$/, '')
              .replace(/\s*\{+$/, '')
              .replace(/\s*\(+$/, '')
              // Enlever les parenthèses non fermées (sans fermeture correspondante)
              .replace(/^\(([^)]*)$/, '$1') // Enlever parenthèse ouverte au début si pas de fermeture
              .replace(/^([^(]*)\)$/, '$1') // Enlever parenthèse fermée à la fin si pas d'ouverture
              .trim();
          };

          // Fonction pour séparer une question et une réponse si elles sont mélangées
          const splitQuestionAndAnswer = (str: string): { question: string | null, answer: string | null } => {
            if (!str || typeof str !== 'string') return { question: null, answer: null };

            // Chercher le pattern ", "answer": " dans la chaîne
            const answerMatch = str.match(/["']?\s*,\s*["']?answer["']?\s*:\s*["']?/i);
            if (answerMatch) {
              const index = answerMatch.index!;
              const question = str.substring(0, index).trim();
              const answer = str.substring(index + answerMatch[0].length).trim();

              // Nettoyer les deux parties
              const cleanedQuestion = cleanString(question);
              const cleanedAnswer = cleanString(answer);

              return {
                question: cleanedQuestion && cleanedQuestion.length > 10 ? cleanedQuestion : null,
                answer: cleanedAnswer && cleanedAnswer.length > 10 ? cleanedAnswer : null
              };
            }

            return { question: null, answer: null };
          };

          // Normaliser les données extraites
          const normalizeQuestions = (questions: any): string[] => {
            if (!questions) return [];
            if (!Array.isArray(questions)) return [];
            const result: string[] = [];

            questions.forEach(q => {
              if (typeof q === 'string') {
                // Filtrer les éléments invalides comme "questions": [ ou autres clés JSON
                if (q.trim().match(/^["']?\w+["']?\s*:\s*[\[{]/)) {
                  return; // Ignorer les clés JSON qui commencent par un crochet ou accolade
                }

                // Vérifier si la chaîne contient à la fois question et answer
                const split = splitQuestionAndAnswer(q);
                if (split.question) {
                  result.push(split.question);
                } else {
                  // Sinon, nettoyer la chaîne normalement
                  const cleaned = cleanString(q);
                  // Filtrer les valeurs invalides
                  if (cleaned &&
                    cleaned !== 'question' &&
                    cleaned !== 'answer' &&
                    cleaned !== 'questions' &&
                    !cleaned.match(/^["']?\w+["']?\s*:\s*[\[{]/) &&
                    cleaned.length > 10) {
                    result.push(cleaned);
                  }
                }
              } else if (typeof q === 'object' && q !== null) {
                // Si c'est un objet avec une propriété question, extraire la question
                if ('question' in q && typeof q.question === 'string') {
                  const cleaned = cleanString(q.question);
                  if (cleaned && cleaned.length > 10) {
                    result.push(cleaned);
                  }
                }
              }
            });

            return result.filter((q): q is string => q !== null && q.length > 10);
          };

          const normalizeAnswers = (answers: any, questions: string[]): { question: string, answer: string }[] => {
            if (!answers) return [];
            if (!Array.isArray(answers)) return [];
            const result: { question: string, answer: string }[] = [];

            answers.forEach((a, idx) => {
              if (typeof a === 'object' && a !== null) {
                // Vérifier que c'est un objet avec question et answer
                let question = typeof a.question === 'string' ? cleanString(a.question) : null;
                const answer = typeof a.answer === 'string' ? cleanString(a.answer) : null;

                // Si la question n'est pas présente mais qu'on a une question correspondante par index
                if (!question && questions[idx]) {
                  question = cleanString(questions[idx]);
                }

                // Filtrer les valeurs invalides
                if (question && question !== 'question' && question.length > 10 &&
                  answer && answer !== 'answer' && answer.length > 10) {
                  // Vérifier que la réponse n'est pas trop générique (mais accepter les réponses qui mentionnent STAR de manière contextuelle)
                  const answerLower = answer.toLowerCase();
                  // Ne filtrer que les réponses vraiment génériques (juste "use STAR method" sans contexte)
                  const isTooGeneric = (answerLower.includes('structure your answer using the star method') && answerLower.length < 100) ||
                    (answerLower === 'use the star method' || answerLower === 'use star method') ||
                    (answerLower.length < 30 && answerLower.includes('star method'));

                  if (!isTooGeneric) {
                    result.push({ question, answer });
                  }
                }
              } else if (typeof a === 'string') {
                // Si c'est une chaîne, essayer de la séparer
                const split = splitQuestionAndAnswer(a);
                if (split.question && split.answer) {
                  // Vérifier que la réponse n'est pas générique
                  const answerLower = split.answer.toLowerCase();
                  const isGeneric = answerLower.includes('structure your answer using the star method') ||
                    answerLower.includes('use the star method') ||
                    answerLower.includes('situation, task, action, result');

                  if (!isGeneric) {
                    result.push({ question: split.question, answer: split.answer });
                  }
                } else if (questions[idx]) {
                  // Si on a une question correspondante par index, l'utiliser
                  const question = cleanString(questions[idx]);
                  const answer = cleanString(a);
                  if (question && question.length > 10 && answer && answer.length > 10) {
                    const answerLower = answer.toLowerCase();
                    const isGeneric = answerLower.includes('structure your answer using the star method') ||
                      answerLower.includes('use the star method');

                    if (!isGeneric) {
                      result.push({ question, answer });
                    }
                  }
                }
              }
            });

            return result;
          };

          // Normaliser les questions et réponses extraites
          const normalizedQuestions = normalizeQuestions(newQuestionsData.questions);
          const normalizedAnswers = normalizeAnswers(newQuestionsData.answers, normalizedQuestions);

          // Fonction pour normaliser et comparer les questions (matching flexible)
          const normalizeForMatch = (str: string): string => {
            if (!str || typeof str !== 'string') return '';
            return str
              .toLowerCase()
              .replace(/^["']?question["']?\s*:\s*["']?/i, '')
              .replace(/^["']?/g, '')
              .replace(/["']?$/g, '')
              .replace(/[^\w\s]/g, '') // Enlever la ponctuation
              .replace(/\s+/g, ' ') // Normaliser les espaces
              .trim();
          };

          // Combiner les questions sauvegardées avec les nouvelles questions
          let combinedQuestions: string[] = [...savedQuestions];
          let combinedAnswers: { question: string, answer: string }[] = [];

          // Ajouter les nouvelles questions qui ne sont pas déjà sauvegardées
          // D'abord, vérifier si les questions d'origine contiennent des réponses
          if (newQuestionsData.questions) {
            newQuestionsData.questions.forEach((q: any, idx: number) => {
              if (typeof q === 'string') {
                // Vérifier si cette question contient aussi une réponse
                const split = splitQuestionAndAnswer(q);
                if (split.question && split.answer) {
                  // Extraire la question et la réponse
                  const normalizedQ = cleanString(split.question);
                  if (normalizedQ && normalizedQ.length > 10 && !savedQuestions.includes(normalizedQ)) {
                    combinedQuestions.push(normalizedQ);
                    combinedAnswers.push({
                      question: normalizedQ,
                      answer: cleanString(split.answer)
                    });
                  }
                } else {
                  // Question normale, utiliser les données normalisées
                  const normalizedQ = normalizedQuestions[idx];
                  if (normalizedQ && !savedQuestions.includes(normalizedQ)) {
                    combinedQuestions.push(normalizedQ);

                    // Chercher la réponse correspondante avec matching flexible
                    let matchingAnswer = normalizedAnswers.find(a => {
                      const aQuestionNorm = normalizeForMatch(a.question);
                      const qQuestionNorm = normalizeForMatch(normalizedQ);
                      return aQuestionNorm === qQuestionNorm;
                    });

                    // Si pas trouvé, chercher une correspondance partielle
                    if (!matchingAnswer) {
                      matchingAnswer = normalizedAnswers.find(a => {
                        const aQuestionNorm = normalizeForMatch(a.question);
                        const qQuestionNorm = normalizeForMatch(normalizedQ);
                        return aQuestionNorm.includes(qQuestionNorm) || qQuestionNorm.includes(aQuestionNorm);
                      });
                    }

                    // Si toujours pas trouvé, utiliser l'index correspondant
                    if (!matchingAnswer && normalizedAnswers[idx]) {
                      matchingAnswer = normalizedAnswers[idx];
                      // Vérifier que la question correspond (au moins partiellement)
                      const aQuestionNorm = normalizeForMatch(matchingAnswer.question);
                      const qQuestionNorm = normalizeForMatch(normalizedQ);
                      if (!aQuestionNorm.includes(qQuestionNorm) && !qQuestionNorm.includes(aQuestionNorm)) {
                        // Si la question ne correspond pas du tout, créer une nouvelle paire
                        matchingAnswer = { question: normalizedQ, answer: matchingAnswer.answer };
                      }
                    }

                    if (matchingAnswer) {
                      combinedAnswers.push({
                        question: normalizedQ,
                        answer: matchingAnswer.answer
                      });
                    }
                  }
                }
              } else if (typeof q === 'object' && q !== null) {
                // Objet avec question et answer
                const question = typeof q.question === 'string' ? cleanString(q.question) : null;
                const answer = typeof q.answer === 'string' ? cleanString(q.answer) : null;
                if (question && question.length > 10 && !savedQuestions.includes(question)) {
                  combinedQuestions.push(question);
                  if (answer && answer.length > 10) {
                    combinedAnswers.push({ question, answer });
                  }
                }
              }
            });
          }

          // Ajouter les réponses des questions sauvegardées
          savedQuestions.forEach((savedQuestion: string) => {
            // Chercher la réponse dans les réponses existantes
            const existingAnswer = interview.preparation?.suggestedAnswers?.find(a =>
              typeof a === 'object' && 'question' in a && a.question === savedQuestion
            );

            if (existingAnswer) {
              combinedAnswers.push(existingAnswer as { question: string, answer: string });
            }
            // Ne pas créer de réponse générique - on laissera l'affichage gérer le fallback
          });

          // S'assurer que chaque question a sa réponse correspondante
          // Améliorer le matching pour éviter les réponses génériques
          const finalAnswers: { question: string, answer: string }[] = [];
          combinedQuestions.forEach((q, idx) => {
            // Chercher si cette question a déjà une réponse dans combinedAnswers
            let matchingAnswer = combinedAnswers.find(a => {
              const aQuestionNorm = normalizeForMatch(a.question);
              const qQuestionNorm = normalizeForMatch(q);
              // Matching exact ou partiel (au moins 50% de similarité)
              return aQuestionNorm === qQuestionNorm ||
                (aQuestionNorm.length > 0 && qQuestionNorm.length > 0 &&
                  (aQuestionNorm.includes(qQuestionNorm) || qQuestionNorm.includes(aQuestionNorm)) &&
                  Math.min(aQuestionNorm.length, qQuestionNorm.length) / Math.max(aQuestionNorm.length, qQuestionNorm.length) > 0.5);
            });

            // Si pas trouvé, utiliser directement la réponse par index dans normalizedAnswers
            if (!matchingAnswer && normalizedAnswers[idx]) {
              matchingAnswer = {
                question: q,
                answer: normalizedAnswers[idx].answer
              };
            }

            // Si toujours pas trouvé, chercher dans normalizedAnswers par matching flexible
            if (!matchingAnswer && normalizedAnswers.length > 0) {
              matchingAnswer = normalizedAnswers.find(a => {
                const aQuestionNorm = normalizeForMatch(a.question);
                const qQuestionNorm = normalizeForMatch(q);
                // Matching plus souple : au moins 50% de similarité
                const similarity = Math.min(aQuestionNorm.length, qQuestionNorm.length) / Math.max(aQuestionNorm.length, qQuestionNorm.length);
                return (aQuestionNorm === qQuestionNorm ||
                  aQuestionNorm.includes(qQuestionNorm) ||
                  qQuestionNorm.includes(aQuestionNorm)) &&
                  similarity > 0.5;
              });

              if (matchingAnswer) {
                // Utiliser la réponse trouvée mais avec la question exacte
                matchingAnswer = {
                  question: q,
                  answer: matchingAnswer.answer
                };
              }
            }

            // Si toujours pas trouvé, utiliser la réponse par index même sans vérification stricte
            if (!matchingAnswer && normalizedAnswers.length > idx) {
              matchingAnswer = {
                question: q,
                answer: normalizedAnswers[idx].answer
              };
            }

            // Si une réponse correspondante est trouvée, l'ajouter
            if (matchingAnswer && matchingAnswer.answer && matchingAnswer.answer.length > 10) {
              finalAnswers.push(matchingAnswer);
            } else {
              // Si aucune réponse n'est trouvée, utiliser la première réponse disponible comme dernier recours
              if (normalizedAnswers.length > 0) {
                finalAnswers.push({
                  question: q,
                  answer: normalizedAnswers[0].answer
                });
              } else {
                console.warn(`No answer found for question: ${q.substring(0, 50)}...`);
              }
            }
          });

          // S'assurer que chaque question a sa réponse - utiliser directement l'index
          // Priorité : normalizedAnswers par index > finalAnswers par matching > combinedAnswers
          const completeAnswers: { question: string, answer: string }[] = [];
          combinedQuestions.forEach((q, idx) => {
            let answer: { question: string, answer: string } | null = null;

            // Priorité 1 : Utiliser directement normalizedAnswers par index (ordre correspondant)
            if (normalizedAnswers[idx] && normalizedAnswers[idx].answer && normalizedAnswers[idx].answer.length > 10) {
              answer = {
                question: q,
                answer: normalizedAnswers[idx].answer
              };
            }

            // Priorité 2 : Chercher dans finalAnswers par matching
            if (!answer) {
              const matched = finalAnswers.find(a => {
                const aQuestionNorm = normalizeForMatch(a.question);
                const qQuestionNorm = normalizeForMatch(q);
                return aQuestionNorm === qQuestionNorm ||
                  aQuestionNorm.includes(qQuestionNorm) ||
                  qQuestionNorm.includes(aQuestionNorm);
              });
              if (matched && matched.answer && matched.answer.length > 10) {
                answer = {
                  question: q,
                  answer: matched.answer
                };
              }
            }

            // Priorité 3 : Utiliser finalAnswers par index si disponible
            if (!answer && finalAnswers[idx] && finalAnswers[idx].answer && finalAnswers[idx].answer.length > 10) {
              answer = {
                question: q,
                answer: finalAnswers[idx].answer
              };
            }

            // Priorité 4 : Chercher dans combinedAnswers
            if (!answer) {
              const matched = combinedAnswers.find(a => {
                const aQuestionNorm = normalizeForMatch(a.question);
                const qQuestionNorm = normalizeForMatch(q);
                return aQuestionNorm === qQuestionNorm ||
                  aQuestionNorm.includes(qQuestionNorm) ||
                  qQuestionNorm.includes(aQuestionNorm);
              });
              if (matched && matched.answer && matched.answer.length > 10) {
                answer = {
                  question: q,
                  answer: matched.answer
                };
              }
            }

            // Si on a trouvé une réponse, l'ajouter
            if (answer && answer.answer && answer.answer.length > 10) {
              completeAnswers.push(answer);
            }
          });

          // Log pour déboguer
          console.log('Questions count:', combinedQuestions.length);
          console.log('Complete answers count:', completeAnswers.length);
          console.log('Normalized answers count:', normalizedAnswers.length);

          // Create updated preparation object with required fields
          const updatedPreparation: JobPostAnalysisResult = {
            keyPoints: interview.preparation?.keyPoints || [],
            requiredSkills: interview.preparation?.requiredSkills || [],
            suggestedQuestions: combinedQuestions,
            suggestedAnswers: completeAnswers.length > 0 ? completeAnswers : (finalAnswers.length > 0 ? finalAnswers : combinedAnswers),
            companyInfo: interview.preparation?.companyInfo,
            positionDetails: interview.preparation?.positionDetails,
            cultureFit: interview.preparation?.cultureFit
          };

          // Update Firestore - find the interview index
          const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

          if (interviewIndex === -1) {
            notify.error('Could not find interview to update');
            return;
          }

          // Create updated interviews array
          const updatedInterviews = [...(application.interviews || [])];
          updatedInterviews[interviewIndex] = {
            ...interview,
            preparation: updatedPreparation
          };

          // Update Firestore
          const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
          await updateDoc(applicationRef, {
            interviews: updatedInterviews,
            updatedAt: serverTimestamp()
          });

          // Update local state
          setInterview({
            ...interview,
            preparation: updatedPreparation
          });

          setRegeneratingProgress(90);
          setRegeneratingMessage("Categorizing questions...");
          await new Promise(resolve => setTimeout(resolve, 150));

          setRegeneratingProgress(95);
          setRegeneratingMessage("Saving questions...");
          await new Promise(resolve => setTimeout(resolve, 150));

          setRegeneratingProgress(100);
          setRegeneratingMessage("Questions generated!");

          // Small delay to show 100% before closing
          await new Promise(resolve => setTimeout(resolve, 300));

          notify.success('New interview questions generated successfully!');
        } catch (parseError) {
          console.error('Error parsing questions JSON:', parseError);
          notify.error('Failed to parse questions from API response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
        }
      } else {
        notify.error('Failed to generate new questions');
      }
    } catch (error) {
      console.error('Error generating new questions:', error);
      notify.error('Failed to generate new questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRegeneratingQuestions(false);
      setRegeneratingProgress(0);
    }
  };

  // Generate questions for live session based on type and count
  const generateLiveSessionQuestions = async (
    type: InterviewType,
    count: QuestionCount
  ): Promise<QuestionEntry[]> => {
    if (!currentUser || !application || !interview || !applicationId) {
      throw new Error('Missing required data for question generation');
    }

    const jobPostUrl = interview.jobPostUrl || '';
    const position = application.position || '';
    const companyName = application.companyName || '';
    const jobPostContent = interview.jobPostContent || '';

    // Build prompt based on interview type
    let typeSpecificInstructions = '';
    let questionFocus = '';

    switch (type) {
      case 'general':
        typeSpecificInstructions = `
Focus on GENERAL/HR questions about:
- Motivation and career goals
- Personality traits and work style
- Cultural fit and values alignment
- Behavioral questions using STAR method
- Why this role/company interests you
- Teamwork and collaboration examples
- Leadership and communication skills
- Work-life balance and preferences
`;
        questionFocus = 'general HR, behavioral, and cultural fit questions';
        break;

      case 'technical':
        typeSpecificInstructions = `
Focus on TECHNICAL questions specific to the ${position} role:
- Technical skills and competencies required for this position
- Hands-on technical problem-solving scenarios
- Specific tools, technologies, or platforms mentioned in the job description
- Technical challenges and how you've solved them
- System design, architecture, or implementation questions (if relevant)
- Code review, debugging, or optimization scenarios (if relevant)
- Technical knowledge assessment questions
- Real-world technical project examples
`;
        questionFocus = `technical questions specific to ${position}`;
        break;

      case 'company-specific':
        typeSpecificInstructions = `
Focus on COMPANY-SPECIFIC and ROLE-SPECIFIC questions:
- Deep knowledge about ${companyName} as a company
- Company culture, values, and mission alignment
- Recent company news, products, or initiatives
- Industry-specific challenges and opportunities
- Role-specific scenarios and responsibilities
- How your experience relates to this specific role at ${companyName}
- Questions about the company's future direction
- Why you want to work specifically at ${companyName} in this role
`;
        questionFocus = `company-specific questions about ${companyName} and role-specific questions for ${position}`;
        break;
    }

    const prompt = `
Based on this job posting for a ${position} position at ${companyName}${jobPostUrl ? `: ${jobPostUrl}` : ''}

${jobPostContent ? `JOB POSTING CONTENT:
"""
${jobPostContent}
"""` : ''}

Please generate ${count} different interview questions that might be asked during this interview.

${typeSpecificInstructions}

CRITICAL: For EACH question, provide a UNIQUE and HIGHLY SPECIFIC suggested answer approach that:
1. Directly addresses the specific question asked (NOT generic advice like "use STAR method")
2. Provides concrete, actionable guidance tailored to THAT EXACT question
3. References specific aspects of the question (e.g., if the question mentions "data analytics", the answer should specifically address data analytics)
4. Suggests specific skills, experiences, or examples relevant to THAT question
5. Is 2-4 sentences of practical, question-specific advice
6. Each answer must be DIFFERENT and UNIQUE - do not repeat the same guidance for different questions

IMPORTANT: 
- Do NOT use generic phrases like "Structure your answer using the STAR method" for all questions
- Each answer must be tailored to its specific question
- Focus on ${questionFocus}
- Make each answer distinct and question-specific

Return the questions in a JSON format like this:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    ...
  ],
  "answers": [
    {"question": "Question 1 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 1, addressing its particular focus and requirements"},
    {"question": "Question 2 text here", "answer": "Specific, detailed, unique guidance tailored specifically to Question 2, addressing its particular focus and requirements"},
    ...
  ]
}

CRITICAL: The "question" field in each answer object must EXACTLY match the corresponding question in the questions array. This is essential for proper matching.
Make sure each answer is completely unique and specific to its question - no generic advice.
Generate exactly ${count} questions.
`;

    try {
      // Use GPT-4o for higher quality question generation
      const response = await queryQuestionGeneration(prompt);

      if (!response || response.error) {
        throw new Error(response?.errorMessage || 'Empty response from GPT-4o API');
      }

      // Extract and clean the JSON from the response
      const contentFromAPI = response?.text || '';
      if (!contentFromAPI) {
        throw new Error('Empty response content from GPT-4o API');
      }

      // Clean content: remove unwanted tags (shouldn't be needed for GPT but just in case)
      const content = String(contentFromAPI)
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<think>[\s\S]*?<\/redacted_reasoning>/g, '')
        .trim();

      // Find JSON content within the response
      let jsonString = '';
      const jsonCodeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
      if (jsonCodeBlockMatch) {
        jsonString = jsonCodeBlockMatch[1].trim();
      } else {
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        } else {
          jsonString = content;
        }
      }

      // Parse JSON
      let questionsData: any;
      try {
        questionsData = JSON.parse(jsonString);
      } catch (parseError) {
        // Try to repair JSON
        const repaired = jsonString
          .replace(/,\s*\]/g, ']')
          .replace(/,\s*\}/g, '}')
          .replace(/"\s+"/g, '", "');
        questionsData = JSON.parse(repaired);
      }

      // Normalize questions and answers
      const normalizeString = (str: string): string => {
        if (!str || typeof str !== 'string') return '';
        return str
          .trim()
          .replace(/^["']?question["']?\s*:\s*["']?/i, '')
          .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
          .replace(/["']?\s*,\s*["']?answer["']?\s*:\s*["']?/gi, '')
          .replace(/["']?\s*,\s*["']?question["']?\s*:\s*["']?/gi, '')
          .replace(/["']\s*,\s*$/g, '')
          .replace(/,\s*$/g, '')
          .replace(/["']?\s*\}\s*$/g, '')
          .replace(/["']?\s*\]\s*$/g, '')
          .replace(/^["']/g, '')
          .replace(/["']$/g, '')
          .trim();
      };

      const questions: string[] = [];
      if (Array.isArray(questionsData.questions)) {
        questionsData.questions.forEach((q: any) => {
          if (typeof q === 'string') {
            const cleaned = normalizeString(q);
            if (cleaned && cleaned.length > 10) {
              questions.push(cleaned);
            }
          }
        });
      }

      const answersMap: Record<string, string> = {};
      if (Array.isArray(questionsData.answers)) {
        questionsData.answers.forEach((a: any) => {
          if (typeof a === 'object' && a !== null && a.question && a.answer) {
            const question = normalizeString(a.question);
            const answer = normalizeString(a.answer);
            if (question && answer && question.length > 10 && answer.length > 10) {
              answersMap[question] = answer;
            }
          }
        });
      }

      // Convert to QuestionEntry format
      const questionEntries: QuestionEntry[] = questions.map((question, index) => {
        const tags = getQuestionTags(question) as QuestionTag[];
        const answer = answersMap[question] || null;

        return {
          id: index,
          rawValue: question,
          text: sanitizeQuestionText(question),
          tags,
          suggestedApproach: answer,
        };
      }).filter((entry): entry is QuestionEntry => Boolean(entry && entry.text && entry.text.length > 10));

      console.log('✅ Generated questions for live session:', {
        type,
        count,
        requestedCount: count,
        actualCount: questionEntries.length,
        questions: questionEntries.map(q => ({
          id: q.id,
          text: q.text.substring(0, 60) + (q.text.length > 60 ? '...' : ''),
          tags: q.tags
        }))
      });

      // Ensure we have the exact number of questions requested
      if (questionEntries.length !== count) {
        console.warn(`⚠️ Generated ${questionEntries.length} questions but requested ${count}`);
        // If we have more, take only the requested count
        if (questionEntries.length > count) {
          return questionEntries.slice(0, count);
        }
        // If we have less, return what we have (better than nothing)
        console.warn(`⚠️ Only ${questionEntries.length} questions available, using all of them`);
      }

      return questionEntries;
    } catch (error) {
      console.error('Error generating live session questions:', error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Manual drag implementation handlers
  // Define handleNoteDragMove and handleNoteDragEnd first to avoid reference errors
  const handleNoteDragMove = useCallback((e: MouseEvent) => {
    // First check if we have a potential drag from the ref
    if (!potentialDragRef.current && !draggedNoteId) return;

    // If we have a potential drag but haven't activated it yet
    if (potentialDragRef.current && !draggedNoteId) {
      const { noteId, startPos } = potentialDragRef.current;
      const deltaX = e.clientX - startPos.mouseX;
      const deltaY = e.clientY - startPos.mouseY;

      // Only activate dragging if moved more than 10px
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        // Now activate the actual drag
        setDraggedNoteId(noteId);
        setDragStartPos(startPos);
        setIsDraggingNote(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        // Clear the ref since we've activated the drag
        potentialDragRef.current = null;
      } else {
        // Not enough movement yet, don't do anything
        return;
      }
    }

    // If we're already dragging, update position
    if (dragStartPos && draggedNoteId) {
      const deltaX = e.clientX - dragStartPos.mouseX;
      const deltaY = e.clientY - dragStartPos.mouseY;

      const newX = dragStartPos.x + deltaX;
      const newY = dragStartPos.y + deltaY;

      // Apply canvas limits
      const noteWidth = noteSizes[draggedNoteId]?.width || 250;
      const noteHeight = noteSizes[draggedNoteId]?.height || 200;
      const clampedX = Math.max(CANVAS_MIN_X, Math.min(CANVAS_MAX_X - noteWidth, newX));
      const clampedY = Math.max(CANVAS_MIN_Y, Math.min(CANVAS_MAX_Y - noteHeight, newY));

      setNotePositions(prev => ({
        ...prev,
        [draggedNoteId]: { x: clampedX, y: clampedY }
      }));
    }
  }, [dragStartPos, draggedNoteId, isDraggingNote, noteSizes]);

  const handleNoteDragEnd = useCallback((e?: MouseEvent) => {
    // Clean up potential drag ref if it exists (click without movement)
    if (potentialDragRef.current && !draggedNoteId) {
      potentialDragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      return;
    }

    if (!draggedNoteId || !dragStartPos) {
      // Reset states even if drag didn't actually happen
      setIsDraggingNote(false);
      setDraggedNoteId(null);
      setDragStartPos(null);
      potentialDragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      return;
    }

    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Save position if actually dragged (isDraggingNote means we moved > 10px)
    if (isDraggingNote && currentUser && application && interview && applicationId) {
      const finalPosition = notePositions[draggedNoteId];
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex !== -1 && finalPosition) {
        const updatedInterviews = [...(application.interviews || [])];
        const updatedNotes = stickyNotes.map(note => ({
          ...note,
          position: note.id === draggedNoteId ? finalPosition : notePositions[note.id]
        }));

        updatedInterviews[interviewIndex] = {
          ...interview,
          stickyNotes: updatedNotes
        };

        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        }).catch(error => {
          console.error('Error saving note positions:', error);
          notify.error('Failed to save note positions');
        });
      }
    } else if (dragStartPos) {
      // If we didn't actually drag, reset position to original
      setNotePositions(prev => ({
        ...prev,
        [draggedNoteId]: { x: dragStartPos.x, y: dragStartPos.y }
      }));
    }

    // Reset drag states
    setIsDraggingNote(false);
    setDraggedNoteId(null);
    setDragStartPos(null);
    potentialDragRef.current = null;
  }, [draggedNoteId, isDraggingNote, dragStartPos, currentUser, application, interview, applicationId, notePositions, stickyNotes]);

  const handleNoteDragStart = useCallback((noteId: string, e: React.MouseEvent) => {
    // Only start drag from the drag handle - check if target or its parent has the class
    const target = e.target as HTMLElement;
    const isDragHandle = target.classList.contains('drag-handle') || 
                         target.closest('.drag-handle') !== null;
    
    // Don't start drag if clicking on resize zones
    const isResizeZone = target.classList.contains('resize-zone') || 
                         target.closest('.resize-zone') !== null;
    
    // Don't start drag if clicking on buttons or content
    const isInteractive = target.tagName === 'BUTTON' || 
                          target.closest('button') !== null ||
                          target.closest('.note-content') !== null;
    
    if (!isDragHandle || isResizeZone || isInteractive) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const notePosition = notePositions[noteId] || { x: 0, y: 0 };
    
    // Store potential drag info in ref instead of state
    // This prevents event listeners from being added until we actually drag
    potentialDragRef.current = {
      noteId,
      startPos: {
        x: notePosition.x,
        y: notePosition.y,
        mouseX: e.clientX,
        mouseY: e.clientY
      }
    };
    
    setDragStartTime(Date.now());

    // Add event listeners directly here instead of using useEffect
    // This ensures they're added immediately when we click on drag-handle
    const moveHandler = (moveEvent: MouseEvent) => {
      if (!potentialDragRef.current && !draggedNoteId) {
        // Clean up if drag was cancelled
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        return;
      }
      handleNoteDragMove(moveEvent);
    };
    
    const upHandler = (upEvent: MouseEvent) => {
      handleNoteDragEnd(upEvent);
      // Always remove listeners after mouseup
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }, [notePositions]);

  // Event listeners are now added directly in handleNoteDragStart
  // This ensures they're only added when we actually click on the drag handle

  // Note resizing handlers
  const handleResizeStart = useCallback((noteId: string, resizeType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentSize = noteSizes[noteId] || {
      width: stickyNotes.find(n => n.id === noteId)?.width || 250,
      height: stickyNotes.find(n => n.id === noteId)?.height || 200
    };

    const currentPosition = notePositions[noteId] || { x: 0, y: 0 };

    setIsResizing(true);
    setResizingNoteId(noteId);
    setResizeType(resizeType);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height,
      startX: currentPosition.x,
      startY: currentPosition.y
    });
  }, [noteSizes, stickyNotes, notePositions]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizingNoteId || !resizeStart || !resizeType) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const minWidth = 150;
    const minHeight = 100;
    const startX = resizeStart.startX || 0;
    const startY = resizeStart.startY || 0;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = startX;
    let newY = startY;

    // Handle resize based on type
    if (resizeType.includes('e')) {
      newWidth = Math.max(minWidth, resizeStart.width + deltaX);
    }
    if (resizeType.includes('w')) {
      newWidth = Math.max(minWidth, resizeStart.width - deltaX);
      newX = startX + deltaX;
    }
    if (resizeType.includes('s')) {
      newHeight = Math.max(minHeight, resizeStart.height + deltaY);
    }
    if (resizeType.includes('n')) {
      newHeight = Math.max(minHeight, resizeStart.height - deltaY);
      newY = startY + deltaY;
    }

    // Update size
    setNoteSizes(prev => ({
      ...prev,
      [resizingNoteId]: {
        width: newWidth,
        height: newHeight
      }
    }));

    // Update position if needed (for north/west resizing)
    if (resizeType.includes('n') || resizeType.includes('w')) {
      setNotePositions(prev => ({
        ...prev,
        [resizingNoteId]: { x: newX, y: newY }
      }));
    }
  }, [isResizing, resizingNoteId, resizeStart, resizeType]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !resizingNoteId) return;

    setIsResizing(false);
    setResizeType(null);

    // Save to Firestore
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;

      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        const updatedNotes = stickyNotes.map(note => ({
          ...note,
          width: noteSizes[note.id]?.width || note.width || 250,
          height: noteSizes[note.id]?.height || note.height || 200,
          position: notePositions[note.id] || note.position
        }));

        updatedInterviews[interviewIndex] = {
          ...interview,
          stickyNotes: updatedNotes
        };

        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        }).catch(error => {
          console.error('Error saving note sizes:', error);
        });
      }
    }

    setResizingNoteId(null);
    setResizeStart(null);
  }, [isResizing, resizingNoteId, currentUser, application, interview, applicationId, stickyNotes, noteSizes, notePositions]);

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleToolDragStart = (tool: 'arrow' | 'line' | 'rectangle' | 'circle', e: React.DragEvent) => {
    e.dataTransfer.setData('tool', tool);
    setDraggedTool(tool);
  };

  const handleToolDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData('tool') as 'arrow' | 'line' | 'rectangle' | 'circle';
    if (!tool) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newShape: Shape = {
      id: uuidv4(),
      type: tool,
      startX: x,
      startY: y,
      endX: x + 100,
      endY: y + 100,
      color: '#6b21a8'
    };

    setShapes(prev => [...prev, newShape]);
    setSelectedShape(newShape.id);
    setDraggedTool(null);
  };

  const handleShapeClick = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShape(shapeId);
    setSelectedTool('select');
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    if (selectedTool !== 'select') return;
    e.stopPropagation();
    setIsResizingShape(true);
    setSelectedShape(shape.id);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      setSelectedShape(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle pen tool (free drawing)
    if (selectedTool === 'pen') {
      setIsDrawingPath(true);
      setPathPoints([{ x, y }]);
      setDrawingPath(`M ${x} ${y}`);
      return;
    }

    // Handle other tools - use dynamic color based on current dark mode state
    // Always check dark mode and use appropriate default color
    const isDarkMode = document.documentElement.classList.contains('dark');
    // If user hasn't explicitly chosen a color (still using default), use white in dark mode, red in light mode
    // Otherwise, use the color the user selected
    const isDefaultColor = drawingColor === '#ef4444' || drawingColor === '#ffffff';
    const shapeColor = isDefaultColor
      ? (isDarkMode ? '#ffffff' : '#ef4444')
      : drawingColor;

    setIsDrawingShape(true);
    const newShape: Shape = {
      id: uuidv4(),
      type: selectedTool,
      startX: x,
      startY: y,
      color: shapeColor
    };

    setDrawingShape(newShape);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle pen tool (free drawing)
    if (isDrawingPath && selectedTool === 'pen') {
      setPathPoints(prev => [...prev, { x, y }]);
      setDrawingPath(prev => `${prev} L ${x} ${y}`);
      return;
    }

    if (isDrawingShape && drawingShape) {
      setDrawingShape({
        ...drawingShape,
        endX: x,
        endY: y
      });
    } else if (isResizingShape && selectedShape) {
      setShapes(prev => prev.map(shape =>
        shape.id === selectedShape
          ? { ...shape, endX: x, endY: y }
          : shape
      ));
    }
  };

  // OPTIMIZATION: Memoized canvas mouse up handler
  const handleCanvasMouseUp = useCallback(() => {
    // Handle pen tool (free drawing)
    if (isDrawingPath && selectedTool === 'pen' && pathPoints.length > 1) {
      // Use dynamic color based on current dark mode state
      const isDarkMode = document.documentElement.classList.contains('dark');
      // If user hasn't explicitly chosen a color (still using default), use white in dark mode, red in light mode
      // Otherwise, use the color the user selected
      const isDefaultColor = drawingColor === '#ef4444' || drawingColor === '#ffffff';
      const pathColor = isDefaultColor
        ? (isDarkMode ? '#ffffff' : '#ef4444')
        : drawingColor;

      const pathShape: Shape = {
        id: uuidv4(),
        type: 'pen',
        startX: pathPoints[0].x,
        startY: pathPoints[0].y,
        endX: pathPoints[pathPoints.length - 1].x,
        endY: pathPoints[pathPoints.length - 1].y,
        color: pathColor,
        path: drawingPath
      };
      setShapes(prev => [...prev, pathShape]);
      setDrawingPath('');
      setPathPoints([]);
      setIsDrawingPath(false);
      return;
    }

    if (isDrawingShape && drawingShape) {
      setShapes(prev => [...prev, drawingShape]);
      setDrawingShape(null);
      setIsDrawingShape(false);
      setSelectedTool('select');
    }
    setIsResizingShape(false);
  }, [isDrawingPath, selectedTool, pathPoints, drawingColor, drawingPath, isDrawingShape, drawingShape]);

  // Resize handlers are already optimized above with useCallback

  // Close tool submenu when clicking outside
  useEffect(() => {
    if (showToolSubmenu) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.tool-submenu') && !target.closest('.tool-menu')) {
          setShowToolSubmenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showToolSubmenu]);

  const deleteShape = (shapeId: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
  };

  const openConnectionMenu = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNote(noteId);
    setShowConnectionMenu(true);
    setConnectionMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const startConnection = (noteId: string) => {
    setIsDrawingConnection(true);
    setConnectionStart(noteId);
    setShowConnectionMenu(false);
  };

  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };

  const toggleNotesExpanded = () => {
    setIsNotesExpanded(prev => !prev);
    if (!isNotesExpanded) {
      // Initialize positions for notes that don't have them
      const newPositions = { ...notePositions };
      const newSizes = { ...noteSizes };
      stickyNotes.forEach((note, index) => {
        if (!notePositions[note.id]) {
          newPositions[note.id] = {
            x: (index % 3) * 300 + 50,
            y: Math.floor(index / 3) * 200 + 50
          };
        }
        if (!noteSizes[note.id]) {
          newSizes[note.id] = {
            width: note.width || 250,
            height: note.height || 200
          };
        }
      });
      setNotePositions(newPositions);
      setNoteSizes(newSizes);
    }
  };

  // Calculate days until interview
  const getDaysUntilInterview = () => {
    if (!interview?.date) return { days: 0, hours: 0 };

    const interviewDate = new Date(`${interview.date}T${interview.time || '09:00'}`);
    const now = new Date();
    const diffMs = interviewDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days: diffDays, hours: diffHours };
  };

  // Calculate preparation progress - 4 milestones
  const getProgressMilestones = () => {
    const requiredSkills = interview?.preparation?.requiredSkills || [];
    const skillsRated = Object.keys(skillRatings).length;
    const skillsComplete = requiredSkills.length > 0 ? skillsRated >= Math.min(Math.ceil(requiredSkills.length * 0.6), requiredSkills.length) : false;
    const hasPassingSession = liveSessionHistory.some(s => s.overallScore >= 70);

    const milestones = [
      {
        id: 'analysis',
        label: 'Job Analysis',
        tooltip: 'Analyze the job posting to extract key requirements and skills',
        icon: <Search className="w-4 h-4" />,
        completed: !!interview?.preparation && !!interview?.preparation?.requiredSkills?.length,
        description: 'Analyze job posting',
        action: () => (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
      },
      {
        id: 'skills',
        label: 'Skills Assessment',
        tooltip: 'Rate your proficiency level on each required skill in the Skills tab',
        icon: <Briefcase className="w-4 h-4" />,
        completed: skillsComplete,
        description: `Rate at least ${requiredSkills.length > 0 ? Math.ceil(requiredSkills.length * 0.6) : 3} skills (${skillsRated}/${requiredSkills.length || '?'})`,
        action: () => setTab('skills')
      },
      {
        id: 'elevator',
        label: 'Elevator Pitch',
        tooltip: 'Write your personal introduction to confidently present yourself',
        icon: <BookOpen className="w-4 h-4" />,
        completed: !!(resourcesData?.elevatorPitch?.trim()),
        description: 'Write your pitch',
        action: () => setTab('resources')
      },
      {
        id: 'practice',
        label: 'Practice Session',
        tooltip: 'Complete a Live Interview session with a score of 70% or higher',
        icon: <MessageSquare className="w-4 h-4" />,
        completed: hasPassingSession,
        description: hasPassingSession ? 'Session passed!' : 'Score 70%+ in Live Interview',
        action: () => setIsLiveSessionOpen(true)
      }
    ];
    return milestones;
  };

  useEffect(() => {
    const milestones = getProgressMilestones();
    const completed = milestones.filter(m => m.completed).length;
    const total = milestones.length;
    setPreparationProgress(Math.round((completed / total) * 100));
  }, [interview?.preparation, skillRatings, resourcesData, liveSessionHistory]);

  // Compute gaps (descending) from requiredSkills and self-ratings
  const skillGaps = useMemo(() => {
    const required = interview?.preparation?.requiredSkills || [];
    const items = required.map((skill) => {
      const rating = skillRatings[skill] || 0;
      const gap = Math.max(0, 5 - rating);
      return { skill, rating, gap };
    });
    return items.sort((a, b) => b.gap - a.gap).slice(0, 5);
  }, [interview?.preparation?.requiredSkills, skillRatings]);

  // Helpers to update SkillCoach in Firestore
  const saveSkillCoach = async (updated: Interview['skillCoach']) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    if (interviewIndex === -1) return;
    const sanitized = sanitizeForFirestore(updated);
    const updatedInterviews = [...(application.interviews || [])];
    updatedInterviews[interviewIndex] = { ...interview, skillCoach: sanitized } as Interview;
    const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
    await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
    setInterview({ ...interview, skillCoach: sanitized });
  };

  const saveResourcesData = async (updated: Interview['resourcesData']) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    if (interviewIndex === -1) return;
    const sanitized = sanitizeForFirestore(updated);
    const updatedInterviews = [...(application.interviews || [])];
    updatedInterviews[interviewIndex] = { ...interview, resourcesData: sanitized } as Interview;
    const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
    await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
    setInterview({ ...interview, resourcesData: sanitized });
  };

  const generateQuestionsToAsk = async (): Promise<string[]> => {
    if (!application || !interview) return [];
    setIsGeneratingQuestions(true);
    try {
      const interviewType = interview.type === 'hr' ? 'HR/recruiter' : 
                           interview.type === 'technical' ? 'technical' : 
                           interview.type === 'manager' ? 'hiring manager' : 
                           interview.type === 'final' ? 'final round' : 'general';
      
      const prompt = `Generate 6 smart, thoughtful questions that a candidate should ask during a ${interviewType} interview at ${application.companyName} for a ${application.position} position.

Requirements:
- Questions should show genuine curiosity and research
- Mix of role-specific, team-related, and growth questions
- Avoid generic questions that could apply to any company
- Each question should help the candidate evaluate fit

Return ONLY a JSON array of 6 question strings, no other text. Example format:
["Question 1?", "Question 2?", ...]`;

      const response = await queryPerplexity(prompt);
      let questions: string[] = [];
      
      try {
        // Try to parse the response as JSON
        const text = response.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: split by newlines if JSON parsing fails
        const lines = (response.text || '').split('\n').filter(line => line.trim().length > 10 && line.includes('?'));
        questions = lines.slice(0, 6).map(q => q.replace(/^[\d\.\-\*]+\s*/, '').trim());
      }
      
      return questions.slice(0, 6);
    } catch (error) {
      console.error('Error generating questions:', error);
      notify.error('Failed to generate questions');
      return [];
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const generateElevatorPitch = async (): Promise<string> => {
    if (!application) return '';
    setIsGeneratingPitch(true);
    try {
      const skills = interview?.preparation?.requiredSkills?.slice(0, 5).join(', ') || '';
      
      // Build user profile context for personalization
      const userName = userProfile?.firstName 
        ? `${userProfile.firstName}${userProfile.lastName ? ' ' + userProfile.lastName : ''}`
        : '';
      const userSkills = userProfile?.skills?.slice(0, 8).join(', ') 
        || userProfile?.cvSkills?.slice(0, 8).join(', ') 
        || '';
      const userBackground = userProfile?.cvText 
        ? userProfile.cvText.slice(0, 800) 
        : '';
      
      const userInfo = userProfile ? `
About the candidate (use this to personalize the pitch):
${userName ? `- Name: ${userName}` : ''}
${userProfile.currentJobTitle ? `- Current role: ${userProfile.currentJobTitle}${userProfile.currentCompany ? ' at ' + userProfile.currentCompany : ''}` : ''}
${userProfile.yearsOfExperience ? `- Years of experience: ${userProfile.yearsOfExperience}` : ''}
${userSkills ? `- Key skills: ${userSkills}` : ''}
${userProfile.professionalSummary ? `- Professional summary: ${userProfile.professionalSummary}` : ''}
${userBackground ? `- Background from CV: ${userBackground}...` : ''}
` : '';
      
      const prompt = `Write a concise 30-second elevator pitch for someone interviewing for a ${application.position} position at ${application.companyName}.
${userInfo}
${skills ? `Relevant skills required for this role: ${skills}` : ''}

Requirements:
- 75-120 words (30-45 seconds when spoken)
- First person, conversational tone
- Structure: Who you are → What you do → Why this role excites you
- Use the candidate's ACTUAL background and experience from the profile data provided
- Highlight specific skills and achievements that match the role
- Specific and genuine, not generic
- End with enthusiasm for the opportunity

Return ONLY the pitch text, no explanations or formatting.`;

      const response = await queryPerplexity(prompt);
      const pitch = (response.text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      return pitch;
    } catch (error) {
      console.error('Error generating pitch:', error);
      notify.error('Failed to generate elevator pitch');
      return '';
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const saveFreeFormNotes = async (notes: string) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    if (interviewIndex === -1) return;
    const updatedInterviews = [...(application.interviews || [])];
    updatedInterviews[interviewIndex] = { ...interview, freeFormNotes: notes } as Interview;
    const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
    await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
    setInterview({ ...interview, freeFormNotes: notes });
  };

  const saveNoteDocuments = async (documents: NoteDocument[], activeId: string | null) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    if (interviewIndex === -1) return;
    const updatedInterviews = [...(application.interviews || [])];
    updatedInterviews[interviewIndex] = {
      ...interview,
      noteDocuments: documents,
      activeNoteDocumentId: activeId,
    } as Interview;
    const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
    await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
    setInterview({ ...interview, noteDocuments: documents, activeNoteDocumentId: activeId });
  };

  const handleDocumentsChange = useCallback((documents: NoteDocument[], activeId: string | null) => {
    setNoteDocuments(documents);
    setActiveNoteDocumentId(activeId);

    // Clear previous timeout
    if (documentsSaveTimeoutRef.current) {
      clearTimeout(documentsSaveTimeoutRef.current);
    }

    // Debounced save
    documentsSaveTimeoutRef.current = setTimeout(() => {
      saveNoteDocuments(documents, activeId);
    }, 1000);
  }, []);

  // Save context documents to Firestore
  const saveContextDocuments = async (documents: ContextDocument[]) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    if (interviewIndex === -1) return;
    const updatedInterviews = [...(application.interviews || [])];
    updatedInterviews[interviewIndex] = {
      ...interview,
      contextDocuments: documents,
    } as Interview;
    const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
    await updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() });
    setInterview({ ...interview, contextDocuments: documents });
  };

  // Load text content for a document (with caching)
  const loadDocumentText = async (doc: ContextDocument): Promise<string> => {
    const cacheKey = `${doc.type}-${doc.documentId}`;
    
    // Check cache first
    if (documentTextCache[cacheKey]) {
      return documentTextCache[cacheKey];
    }

    try {
      let text = '';

      switch (doc.type) {
        case 'resume': {
          // Fetch resume from Firestore
          const resumeRef = doc(db, 'users', currentUser!.uid, 'cvs', doc.documentId);
          const resumeSnap = await getDoc(resumeRef);
          if (resumeSnap.exists()) {
            const resumeData = resumeSnap.data();
            const resume: Resume = {
              id: resumeSnap.id,
              name: resumeData.name || 'Untitled Resume',
              cvData: resumeData.cvData,
              createdAt: resumeData.createdAt,
              updatedAt: resumeData.updatedAt,
              template: resumeData.template,
              layoutSettings: resumeData.layoutSettings,
              folderId: resumeData.folderId,
              tags: resumeData.tags || [],
            };
            text = extractResumeText(resume);
          }
          break;
        }
        case 'note': {
          // Fetch note from Firestore
          const note = await getNotes(currentUser!.uid).then(notes => 
            notes.find(n => n.id === doc.documentId)
          );
          if (note) {
            text = extractNoteText(note);
          }
          break;
        }
        case 'whiteboard': {
          // Fetch whiteboard from Firestore
          const whiteboards = await getWhiteboards(currentUser!.uid);
          const whiteboard = whiteboards.find(w => w.id === doc.documentId);
          if (whiteboard) {
            text = extractWhiteboardText(whiteboard);
          }
          break;
        }
        case 'pdf': {
          // Fetch PDF document from Firestore
          const pdfRef = doc(db, 'users', currentUser!.uid, 'documents', doc.documentId);
          const pdfSnap = await getDoc(pdfRef);
          if (pdfSnap.exists()) {
            const pdfData = pdfSnap.data();
            const pdfDoc: ImportedDocument = {
              id: pdfSnap.id,
              name: pdfData.name || 'Untitled Document',
              fileUrl: pdfData.fileUrl,
              fileSize: pdfData.fileSize || 0,
              pageCount: pdfData.pageCount,
              folderId: pdfData.folderId,
              createdAt: pdfData.createdAt,
              updatedAt: pdfData.updatedAt,
            };
            text = await extractPDFText(pdfDoc.fileUrl);
          }
          break;
        }
      }

      // Cache the text
      const truncatedText = truncateText(text, 5000);
      setDocumentTextCache(prev => ({ ...prev, [cacheKey]: truncatedText }));
      return truncatedText;
    } catch (error) {
      console.error('Error loading document text:', error);
      return `Error loading document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Handle context documents change
  const handleContextDocumentsChange = async (documents: ContextDocument[]) => {
    setContextDocuments(documents);
    await saveContextDocuments(documents);
  };

  // Debounce save for free-form notes (auto-save after 1 second of no typing)
  useEffect(() => {
    if (!interview) return;
    // Don't save on initial load
    if (freeFormNotes === interview.freeFormNotes) return;

    const timeoutId = setTimeout(() => {
      saveFreeFormNotes(freeFormNotes);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [freeFormNotes]);

  const toggleMicroTask = async (skill: string, taskId: string) => {
    const current = skillCoach?.microTasks?.[skill] || [];
    const nextTasks = current.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    const next = { ...skillCoach, microTasks: { ...(skillCoach?.microTasks || {}), [skill]: nextTasks } } as Interview['skillCoach'];
    setSkillCoach(next);
    await saveSkillCoach(next);
  };

  const ensureDefaultTasks = (skill: string) => {
    const base = skillCoach?.microTasks?.[skill];
    if (base && base.length) return base;
    const tasks = [
      { id: uuidv4(), label: 'Review role-specific docs/notes for this skill', done: false },
      { id: uuidv4(), label: 'Draft 1 STAR story showcasing this skill', done: false },
      { id: uuidv4(), label: 'Practise 2 targeted questions in Chat', done: false }
    ];
    const next = { ...skillCoach, microTasks: { ...(skillCoach?.microTasks || {}), [skill]: tasks } } as Interview['skillCoach'];
    setSkillCoach(next);
    saveSkillCoach(next);
    return tasks;
  };

  const addStarStory = async (skill: string, initialContent?: { situation: string; action: string; result: string }) => {
    const stories = skillCoach?.starStories?.[skill] || [];
    const newStory = {
      id: uuidv4(),
      situation: initialContent?.situation || '',
      action: initialContent?.action || '',
      result: initialContent?.result || '',
    };
    const nextStories = [...stories, newStory];
    const next = { ...skillCoach, starStories: { ...(skillCoach?.starStories || {}), [skill]: nextStories } } as Interview['skillCoach'];
    setSkillCoach(next);
    await saveSkillCoach(next);
  };

  const updateStarField = async (skill: string, storyId: string, field: 'situation' | 'action' | 'result', value: string) => {
    const stories = skillCoach?.starStories?.[skill] || [];
    const nextStories = stories.map(s => s.id === storyId ? { ...s, [field]: value } : s);
    const next = { ...skillCoach, starStories: { ...(skillCoach?.starStories || {}), [skill]: nextStories } } as Interview['skillCoach'];
    setSkillCoach(next);
    await saveSkillCoach(next);
  };

  const deleteStarStory = async (skill: string, storyId: string) => {
    const stories = skillCoach?.starStories?.[skill] || [];
    const nextStories = stories.filter(s => s.id !== storyId);
    const next = { ...skillCoach, starStories: { ...(skillCoach?.starStories || {}), [skill]: nextStories } } as Interview['skillCoach'];
    setSkillCoach(next);
    await saveSkillCoach(next);
  };

  const handleStarExportClick = (skill: string, storyId: string) => {
    setPendingStarExport({ skill, storyId });
    setShowStarExportModal(true);
  };

  const exportStoryToNotes = async (skill: string, storyId: string) => {
    const story = (skillCoach?.starStories?.[skill] || []).find(s => s.id === storyId);
    if (!story) return;

    // Format STAR story content as HTML
    const htmlContent = `
      <h2>STAR Story: ${skill}</h2>
      <h3>Situation</h3>
      <p>${story.situation || '<em>No situation provided</em>'}</p>
      <h3>Action</h3>
      <p>${story.action || '<em>No action provided</em>'}</p>
      <h3>Result</h3>
      <p>${story.result || '<em>No result provided</em>'}</p>
    `.trim();

    // Extract preview text
    const previewText = `${story.situation || ''} ${story.action || ''} ${story.result || ''}`.trim().substring(0, 100);

    // Create new note document
    const newDoc: NoteDocument = {
      id: uuidv4(),
      title: `${skill} - STAR Story`,
      content: htmlContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preview: previewText,
    };

    // Add to documents and set as active
    const updatedDocs = [...noteDocuments, newDoc];
    setNoteDocuments(updatedDocs);
    setActiveNoteDocumentId(newDoc.id);
    
    // Highlight the newly created document
    setHighlightedDocumentId(newDoc.id);
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedDocumentId(null);
    }, 3000);
    
    // Open notes tab
    setSidebarTab('notes');

    // Save to Firebase
    await saveNoteDocuments(updatedDocs, newDoc.id);
    
    notify.success('STAR story exported to Notes');
  };

  const exportStoryToStickyWhiteboard = async (skill: string, storyId: string) => {
    const story = (skillCoach?.starStories?.[skill] || []).find(s => s.id === storyId);
    if (!story) return;

    // Calculate positions for visual layout
    const baseX = 100;
    const baseY = 200;
    const noteSpacing = 340; // Space between notes
    const noteWidth = 280;
    const noteHeight = 200;
    const titleWidth = 300;
    const titleHeight = 120;

    // Create title note
    const titleNoteId = uuidv4();
    const titleNote: Note = {
      id: titleNoteId,
      title: `STAR: ${skill}`,
      content: `<strong>${skill}</strong>`,
      color: '#fbbf24', // Amber/yellow
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: baseX + noteWidth + (noteSpacing - titleWidth) / 2, y: baseY - 150 }
    };

    // Create Situation note
    const situationNoteId = uuidv4();
    const situationNote: Note = {
      id: situationNoteId,
      title: 'Situation',
      content: story.situation || '<em>No situation provided</em>',
      color: '#3b82f6', // Blue
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: baseX, y: baseY }
    };

    // Create Action note
    const actionNoteId = uuidv4();
    const actionNote: Note = {
      id: actionNoteId,
      title: 'Action',
      content: story.action || '<em>No action provided</em>',
      color: '#f97316', // Orange
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: baseX + noteSpacing, y: baseY }
    };

    // Create Result note
    const resultNoteId = uuidv4();
    const resultNote: Note = {
      id: resultNoteId,
      title: 'Result',
      content: story.result || '<em>No result provided</em>',
      color: '#10b981', // Green
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: baseX + noteSpacing * 2, y: baseY }
    };

    // Add all notes
    const newNotes = [titleNote, situationNote, actionNote, resultNote];
    const updatedNotes = [...stickyNotes, ...newNotes];
    setStickyNotes(updatedNotes);

    // Set positions and sizes
    const newPositions: Record<string, { x: number; y: number }> = {};
    const newSizes: Record<string, { width: number; height: number }> = {};

    newPositions[titleNoteId] = titleNote.position!;
    newSizes[titleNoteId] = { width: titleWidth, height: titleHeight };

    newPositions[situationNoteId] = situationNote.position!;
    newSizes[situationNoteId] = { width: noteWidth, height: noteHeight };

    newPositions[actionNoteId] = actionNote.position!;
    newSizes[actionNoteId] = { width: noteWidth, height: noteHeight };

    newPositions[resultNoteId] = resultNote.position!;
    newSizes[resultNoteId] = { width: noteWidth, height: noteHeight };

    setNotePositions(prev => ({ ...prev, ...newPositions }));
    setNoteSizes(prev => ({ ...prev, ...newSizes }));

    // Create arrows connecting Situation -> Action -> Result
    const arrow1Id = uuidv4();
    const arrow2Id = uuidv4();
    const arrow1: Shape = {
      id: arrow1Id,
      type: 'arrow',
      startX: baseX + noteWidth,
      startY: baseY + noteHeight / 2,
      endX: baseX + noteSpacing,
      endY: baseY + noteHeight / 2,
      color: '#6b7280' // Gray
    };
    const arrow2: Shape = {
      id: arrow2Id,
      type: 'arrow',
      startX: baseX + noteSpacing + noteWidth,
      startY: baseY + noteHeight / 2,
      endX: baseX + noteSpacing * 2,
      endY: baseY + noteHeight / 2,
      color: '#6b7280' // Gray
    };

    setShapes(prev => [...prev, arrow1, arrow2]);

    // Create a background rectangle to group visually
    const bgRectId = uuidv4();
    const bgRect: Shape = {
      id: bgRectId,
      type: 'rectangle',
      startX: baseX - 20,
      startY: baseY - 170,
      endX: baseX + noteSpacing * 2 + noteWidth + 20,
      endY: baseY + noteHeight + 20,
      color: 'rgba(99, 102, 241, 0.1)' // Semi-transparent indigo
    };
    setShapes(prev => [...prev, bgRect]);

    // Save to Firebase
    await updateInterviewNotes(updatedNotes);

    // Expand notes panel if not already expanded
    if (!isNotesExpanded) {
      setIsNotesExpanded(true);
    }

    notify.success('STAR story exported to Sticky Notes Whiteboard');
  };

  const exportStoryToTldrawWhiteboard = async (skill: string, storyId: string) => {
    const story = (skillCoach?.starStories?.[skill] || []).find(s => s.id === storyId);
    if (!story) return;

    if (!tldrawWhiteboardRef.current) {
      notify.error('Whiteboard is not ready. Please wait a moment and try again.');
      return;
    }

    try {
      await tldrawWhiteboardRef.current.addStarStoryToBoard(skill, {
        situation: story.situation || '',
        action: story.action || '',
        result: story.result || ''
      });
      notify.success('STAR story exported to TldrawWhiteboard');
    } catch (error) {
      console.error('Error exporting to TldrawWhiteboard:', error);
      notify.error('Failed to export to whiteboard');
    }
  };

  const practiceInChat = async (skill: string) => {
    const latestStory = (skillCoach?.starStories?.[skill] || [])[0];
    const position = application?.position || 'this role';
    const company = application?.companyName || 'this company';
    
    // Create a more conversational and clear question
    let practiceMessage = `Can you help me practice answering questions about ${skill} for the ${position} position at ${company}?`;
    
    // If there's a STAR story, include it in the context
    if (latestStory) {
      practiceMessage += `\n\nI have prepared a STAR story for this skill:\n\nSituation: ${latestStory.situation}\nAction: ${latestStory.action}\nResult: ${latestStory.result}\n\nCan you ask me a question about ${skill} and then provide feedback on my answer?`;
    } else {
      practiceMessage += ` Please ask me a relevant interview question about ${skill} so I can practice my answer.`;
    }
    
    // Switch to chat tab
    setTab('chat');
    
    // Set the message in the input field (for visual feedback)
    setMessage(practiceMessage);
    
    // Wait for the tab to switch, then send the message automatically
    setTimeout(() => {
      sendMessageWithText(practiceMessage);
    }, 200);
  };

  const shortenText = (text: string, max = 48) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  };

  // Charger les questions sauvegardées depuis localStorage au chargement
  useEffect(() => {
    const savedQuestions: string[] = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
    setSavedQuestionsState(savedQuestions);
  }, []);

  // Toggle checklist item completion
  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setChecklist(updated);
    // persist
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = { ...interview, checklist: updated };
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => { });
        setInterview({ ...interview, checklist: updated });
      }
    }
  };

  // Checklist CRUD
  const [newTaskText, setNewTaskText] = useState('');
  const addChecklistItem = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: uuidv4(), task: text, completed: false, section: 'overview' };
    const updated = [...checklist, item];
    setChecklist(updated);
    setNewTaskText('');
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = { ...interview, checklist: updated };
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => { });
        setInterview({ ...interview, checklist: updated });
      }
    }
  };
  const deleteChecklistItem = (id: string) => {
    const updated = checklist.filter(i => i.id !== id);
    setChecklist(updated);
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = { ...interview, checklist: updated };
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => { });
        setInterview({ ...interview, checklist: updated });
      }
    }
  };

  const updateChecklistItemText = (id: string, text: string) => {
    const updated = checklist.map(i => i.id === id ? { ...i, task: text } : i);
    setChecklist(updated);
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = { ...interview, checklist: updated };
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => { });
        setInterview({ ...interview, checklist: updated });
      }
    }
  };

  // Register page data with AI Assistant
  const interviewPrepSummary = useMemo(() => {
    if (!application || !interview) return null;
    
    const preparation = interview.preparation;
    const questions = preparation?.questions || [];
    
    return {
      company: application.companyName,
      position: application.position,
      interviewType: interview.type,
      interviewDate: interview.date,
      interviewTime: interview.time,
      status: interview.status,
      preparation: preparation ? {
        companyInfo: preparation.companyInfo?.substring(0, 500),
        roleOverview: preparation.roleOverview?.substring(0, 500),
        keyRequirements: preparation.keyRequirements?.slice(0, 5),
        questionsCount: questions.length,
        sampleQuestions: questions.slice(0, 5).map((q: any) => 
          typeof q === 'string' ? q : q.text || q.question
        ),
      } : null,
      skillRatings: Object.entries(skillRatings).map(([skill, rating]) => ({ skill, rating })),
      checklistProgress: {
        completed: checklist.filter(c => c.completed).length,
        total: checklist.length,
      },
      hasNotes: stickyNotes.length > 0 || !!freeFormNotes,
      chatMessagesCount: chatMessages.length,
    };
  }, [application, interview, skillRatings, checklist, stickyNotes, freeFormNotes, chatMessages.length]);

  useAssistantPageData('interviewPrep', interviewPrepSummary, !!application && !!interview);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-[#3d3c3e] rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-[#3d3c3e] rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-gray-200 dark:bg-[#3d3c3e] rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-[#3d3c3e] rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-[#3d3c3e] rounded"></div>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!application || !interview) {
    return (
      <AuthLayout>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Interview not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The interview you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="px-4 py-2 bg-gradient-to-r from-jobzai-500 to-jobzai-600 text-white rounded-lg hover:from-jobzai-600 hover:to-jobzai-700 transition-colors"
          >
            Return to Applications
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Right Sidebar Panel */}
      <RightSidebarPanel
        preparationProgress={preparationProgress}
        milestones={getProgressMilestones()}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        noteDocuments={noteDocuments}
        activeNoteDocumentId={activeNoteDocumentId}
        onDocumentsChange={handleDocumentsChange}
        liveSessionHistory={liveSessionHistory}
        onViewHistorySession={(session) => {
          // Prepare history session data for full-page view
          const historyData: HistorySessionData = {
            questions: questionEntries.slice(0, session.questionsCount),
            answers: session.answers,
            analysis: session.analysis,
            date: session.date,
          };
          setHistorySessionData(historyData);
          setIsLiveSessionOpen(true);
        }}
        highlightedDocumentId={highlightedDocumentId}
        // Chat props
        chatMessages={chatMessages}
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        isSending={isSending}
        typingMessages={typingMessages}
        isUserNearBottom={isUserNearBottom}
        setIsUserNearBottom={setIsUserNearBottom}
        chatEndRef={chatEndRef}
        chatContainerRef={chatContainerRef}
        onClearChat={async () => {
          if (currentUser && application && interview && applicationId) {
            try {
              await saveChatHistory([]);
              setChatMessages([]);
              setMessage('');
              notify.success('Chat cleared');
            } catch (error) {
              notify.error('Failed to clear chat');
            }
          } else {
            setChatMessages([]);
            setMessage('');
          }
        }}
        position={application?.position}
        userPhotoURL={currentUser?.photoURL}
        contextDocuments={contextDocuments}
        onContextDocumentsChange={handleContextDocumentsChange}
        userId={currentUser?.uid}
      />

      <MotionConfig transition={{ duration: 0.2 }}>
        <div className="min-h-0 flex-1 overflow-y-auto lg:pr-[400px]">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
            {/* Premium Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-10"
            >
              <PremiumHeroSection
                companyName={application?.companyName || ''}
                position={application?.position || 'Interview Preparation'}
                location={application?.location}
                interviewType={interview?.type as any}
                status={interview?.status as any}
                date={interview?.date || null}
                time={interview?.time || null}
              />
            </motion.div>
            {/* AI Analysis Card - Hidden once analysis is generated */}
            {(!interview?.preparation || isAnalyzing) && (
              <div className="mb-10">
                <AICard
                  jobUrl={jobUrl}
                  onJobUrlChange={setJobUrl}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyzeJobPost}
                  className="w-full"
                />
              </div>
            )}

            {/* Tab navigation */}
            <nav className="mb-8 border-b border-gray-200 dark:border-[#3d3c3e]">
              <div className="flex gap-8">
                {[
                  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
                  { id: 'questions' as const, label: 'Questions', icon: HelpCircle },
                  { id: 'skills' as const, label: 'Skills', icon: Briefcase },
                  { id: 'resources' as const, label: 'Resources', icon: BookOpen },
                ].map((tabItem) => {
                  const Icon = tabItem.icon;
                  return (
                    <button
                      key={tabItem.id}
                      onClick={() => setTab(tabItem.id)}
                      className={`relative pb-3 text-sm font-medium transition-colors ${
                        tab === tabItem.id
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tabItem.label}
                      {tab === tabItem.id && (
                        <motion.div
                          layoutId="mainTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Tab content */}
            <div className="mb-8 relative">
              {isAnalyzing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center px-6"
                  >
                    <div className="cvopt-walker mb-8" aria-label="Loading">
                      <div className="loader">
                        <svg className="legl" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20.69332" height="68.19944" viewBox="0,0,20.69332,68.19944">
                          <g transform="translate(-201.44063,-235.75466)">
                            <g strokeMiterlimit={10}>
                              <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                              <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                              <path d="M218.11971,301.20087c-2.20708,1.73229 -4.41416,0 -4.41416,0l-1.43017,-1.1437c-1.42954,-1.40829 -3.04351,-2.54728 -4.56954,-3.87927c-0.95183,-0.8308 -2.29837,-1.49883 -2.7652,-2.55433c-0.42378,-0.95815 0.14432,-2.02654 0.29355,-3.03399c0.41251,-2.78499 1.82164,-5.43386 2.41472,-8.22683c1.25895,-4.44509 2.73863,-8.98683 3.15318,-13.54796c0.22615,-2.4883 -0.21672,-5.0155 -0.00278,-7.50605c0.30636,-3.56649 1.24602,-7.10406 1.59992,-10.6738c0.29105,-2.93579 -0.00785,-5.9806 -0.00785,-8.93046c0,0 0,-2.44982 3.12129,-2.44982c3.12129,0 3.12129,2.44982 3.12129,2.44982c0,3.06839 0.28868,6.22201 -0.00786,9.27779c-0.34637,3.56935 -1.30115,7.10906 -1.59992,10.6738c-0.2103,2.50918 0.22586,5.05326 -0.00278,7.56284c-0.43159,4.7371 -1.94029,9.46317 -3.24651,14.07835c-0.47439,2.23403 -1.29927,4.31705 -2.05805,6.47156c-0.18628,0.52896 -0.1402,1.0974 -0.327,1.62624c-0.09463,0.26791 -0.64731,0.47816 -0.50641,0.73323c0.19122,0.34617 0.86423,0.3445 1.2346,0.58502c1.88637,1.22503 3.50777,2.79494 5.03,4.28305l0.96971,0.73991c0,0 2.20708,1.73229 0,3.46457z" fill="none" stroke="#191e2e" strokeWidth={7} />
                            </g>
                          </g>
                        </svg>
                        <svg className="legr" version="1.1" xmlns="http://www.w3.org/2000/svg" width="41.02537" height="64.85502" viewBox="0,0,41.02537,64.85502">
                          <g transform="translate(-241.54137,-218.44347)">
                            <g strokeMiterlimit={10}>
                              <path d="M279.06674,279.42662c-2.27967,1.98991 -6.08116,0.58804 -6.08116,0.58804l-2.47264,-0.92915c-2.58799,-1.18826 -5.31176,-2.08831 -7.99917,-3.18902c-1.67622,-0.68654 -3.82471,-1.16116 -4.93147,-2.13229c-1.00468,-0.88156 -0.69132,-2.00318 -0.92827,-3.00935c-0.65501,-2.78142 0.12275,-5.56236 -0.287,-8.37565c-0.2181,-4.51941 -0.17458,-9.16283 -1.60696,-13.68334c-0.78143,-2.46614 -2.50162,-4.88125 -3.30086,-7.34796c-1.14452,-3.53236 -1.40387,-7.12078 -2.48433,-10.66266c-0.88858,-2.91287 -2.63779,-5.85389 -3.93351,-8.74177c0,0 -1.07608,-2.39835 3.22395,-2.81415c4.30003,-0.41581 2.41605,1.98254 2.41605,1.98254c1.34779,3.00392 3.13072,6.05282 4.06444,9.0839c1.09065,3.54049 1.33011,7.13302 2.48433,10.66266c0.81245,2.48448 2.5308,4.917 3.31813,7.40431c1.48619,4.69506 1.48366,9.52281 1.71137,14.21503c0.32776,2.25028 0.10631,4.39942 0.00736,6.60975c-0.02429,0.54266 0.28888,1.09302 0.26382,1.63563c-0.01269,0.27488 -0.68173,0.55435 -0.37558,0.78529c0.41549,0.31342 1.34191,0.22213 1.95781,0.40826c3.13684,0.94799 6.06014,2.26892 8.81088,3.52298l1.66093,0.59519c0,0 6.76155,1.40187 4.48187,3.39177z" fill="none" stroke="#000000" strokeWidth={7} />
                              <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                              <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                            </g>
                          </g>
                        </svg>
                        <div className="bod">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="144.10576" height="144.91623" viewBox="0,0,144.10576,144.91623">
                            <g transform="translate(-164.41679,-112.94712)">
                              <g strokeMiterlimit={10}>
                                <path d="M166.9168,184.02633c0,-36.49454 35.0206,-66.07921 72.05288,-66.07921c37.03228,0 67.05288,29.58467 67.05288,66.07921c0,6.94489 -1.08716,13.63956 -3.10292,19.92772c-2.71464,8.46831 -7.1134,16.19939 -12.809,22.81158c-2.31017,2.68194 -7.54471,12.91599 -7.54471,12.91599c0,0 -5.46714,-1.18309 -8.44434,0.6266c-3.86867,2.35159 -10.95356,10.86714 -10.95356,10.86714c0,0 -6.96906,-3.20396 -9.87477,-2.58085c-2.64748,0.56773 -6.72538,5.77072 -6.72538,5.77072c0,0 -5.5023,-4.25969 -7.5982,-4.25969c-3.08622,0 -9.09924,3.48259 -9.09924,3.48259c0,0 -6.0782,-5.11244 -9.00348,-5.91884c-4.26461,-1.17561 -12.23343,0.75049 -12.23343,0.75049c0,0 -5.18164,-8.26065 -7.60688,-9.90388c-3.50443,-2.37445 -8.8271,-3.95414 -8.8271,-3.95414c0,0 -5.33472,-8.81718 -7.27019,-11.40895c-4.81099,-6.44239 -13.46422,-9.83437 -15.65729,-17.76175c-1.53558,-5.55073 -2.35527,-21.36472 -2.35527,-21.36472z" fill="#191e2e" stroke="#000000" strokeWidth={5} strokeLinecap="butt" />
                                <path d="M167.94713,180c0,-37.03228 35.0206,-67.05288 72.05288,-67.05288c37.03228,0 67.05288,30.0206 67.05288,67.05288c0,7.04722 -1.08716,13.84053 -3.10292,20.22135c-2.71464,8.59309 -7.1134,16.43809 -12.809,23.14771c-2.31017,2.72146 -7.54471,13.1063 -7.54471,13.1063c0,0 -5.46714,-1.20052 -8.44434,0.63584c-3.86867,2.38624 -10.95356,11.02726 -10.95356,11.02726c0,0 -6.96906,-3.25117 -9.87477,-2.61888c-2.64748,0.5761 -6.72538,5.85575 -6.72538,5.85575c0,0 -5.5023,-4.32246 -7.5982,-4.32246c-3.08622,0 -9.09924,3.5339 -9.09924,3.5339c0,0 -6.0782,-5.18777 -9.00348,-6.00605c-4.26461,-1.19293 -12.23343,0.76155 -12.23343,0.76155c0,0 -5.18164,-8.38236 -7.60688,-10.04981c-3.50443,-2.40943 -8.8271,-4.0124 -8.8271,-4.0124c0,0 -5.33472,-8.9471 -7.27019,-11.57706c-4.81099,-6.53732 -13.46422,-9.97928 -15.65729,-18.02347c-1.53558,-5.63252 -2.35527,-21.67953 -2.35527,-21.67953z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                <path d="M216.22445,188.06994c0,0 1.02834,11.73245 -3.62335,21.11235c-4.65169,9.3799 -13.06183,10.03776 -13.06183,10.03776c0,0 7.0703,-3.03121 10.89231,-10.7381c4.34839,-8.76831 5.79288,-20.41201 5.79288,-20.41201z" fill="none" stroke="#2f3a50" strokeWidth={3} strokeLinecap="round" />
                              </g>
                            </g>
                          </svg>
                          <svg className="head" version="1.1" xmlns="http://www.w3.org/2000/svg" width="115.68559" height="88.29441" viewBox="0,0,115.68559,88.29441">
                            <g transform="translate(-191.87889,-75.62023)">
                              <g strokeMiterlimit={10}>
                                <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                <path d="M195.12889,128.77752c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,0.60102 -9.22352,20.49284 -9.22352,20.49284l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="butt" />
                                <path d="M195.31785,124.43649c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,1.03481 -0.08666,2.8866 -0.08666,2.8866c0,0 16.8538,15.99287 16.21847,17.23929c-0.66726,1.30905 -23.05667,-4.14265 -23.05667,-4.14265l-2.29866,4.5096l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                <path d="M271.10348,122.46768l10.06374,-3.28166l24.06547,24.28424" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="round" />
                                <path d="M306.56448,144.85764l-41.62024,-8.16845l2.44004,-7.87698" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                                <path d="M276.02738,115.72434c-0.66448,-4.64715 2.56411,-8.95308 7.21127,-9.61756c4.64715,-0.66448 8.95309,2.56411 9.61757,7.21126c0.46467,3.24972 -1.94776,8.02206 -5.96624,9.09336c-2.11289,-1.73012 -5.08673,-5.03426 -5.08673,-5.03426c0,0 -4.12095,1.16329 -4.60481,1.54229c-0.16433,-0.04891 -0.62732,-0.38126 -0.72803,-0.61269c-0.30602,-0.70328 -0.36302,-2.02286 -0.44303,-2.58239z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                <path d="M242.49281,125.6424c0,-4.69442 3.80558,-8.5 8.5,-8.5c4.69442,0 8.5,3.80558 8.5,8.5c0,4.69442 -3.80558,8.5 -8.5,8.5c-4.69442,0 -8.5,-3.80558 -8.5,-8.5z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                              </g>
                            </g>
                          </svg>
                        </div>
                        <svg id="gnd" version="1.1" xmlns="http://www.w3.org/2000/svg" width={475} height={530} viewBox="0,0,163.40011,85.20095">
                          <g transform="translate(-176.25,-207.64957)">
                            <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeMiterlimit={10}>
                              <path d="M295.5,273.1829c0,0 -57.38915,6.69521 -76.94095,-9.01465c-13.65063,-10.50609 15.70098,-20.69467 -2.5451,-19.94465c-30.31027,2.05753 -38.51396,-26.84135 -38.51396,-26.84135c0,0 6.50084,13.30023 18.93224,19.17888c9.53286,4.50796 26.23632,-1.02541 32.09529,4.95137c3.62417,3.69704 2.8012,6.33005 0.66517,8.49452c-3.79415,3.84467 -11.7312,6.21103 -6.24682,10.43645c22.01082,16.95812 72.55412,12.73944 72.55412,12.73944z" fill="#000000" />
                              <path d="M338.92138,217.76285c0,0 -17.49626,12.55408 -45.36424,10.00353c-8.39872,-0.76867 -17.29557,-6.23066 -17.29557,-6.23066c0,0 3.06461,-2.23972 15.41857,0.72484c26.30467,6.31228 47.24124,-4.49771 47.24124,-4.49771z" fill="#000000" />
                              <path d="M209.14443,223.00182l1.34223,15.4356l-10.0667,-15.4356" fill="none" />
                              <path d="M198.20391,230.41806l12.95386,7.34824l6.71113,-12.08004" fill="none" />
                              <path d="M211.19621,238.53825l8.5262,-6.09014" fill="none" />
                              <path d="M317.57068,215.80173l5.27812,6.49615l0.40601,-13.39831" fill="none" />
                              <path d="M323.66082,222.70389l6.09014,-9.33822" fill="none" />
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>
                    <div className="w-[min(60vw,520px)] h-2 rounded-full bg-white/20 dark:bg-white/15 overflow-hidden mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-jobzai-500 via-jobzai-400 to-jobzai-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, analyzingProgress))}%` }}
                      />
                    </div>
                    <p className="text-base font-semibold text-white">
                      {analyzingMessage}
                    </p>
                    <p className="mt-2 text-sm text-white/80">
                      This may take up to 2 minutes.
                    </p>
                    <style>
                      {`
                  .cvopt-walker .loader {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    transform: translate(10px, -20px) scale(0.75);
                  }
                  .cvopt-walker .loader svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                  }
                  .cvopt-walker .head {
                    transform: translate(27px, -30px);
                    z-index: 3;
                    animation: bob-head 1s infinite ease-in;
                  }
                  .cvopt-walker .bod {
                    transform: translate(0px, 30px);
                    z-index: 3;
                    animation: bob-bod 1s infinite ease-in-out;
                  }
                  .cvopt-walker .legr {
                    transform: translate(75px, 135px);
                    z-index: 0;
                    animation: rstep-full 1s infinite ease-in;
                  }
                  .cvopt-walker .legr {
                    animation-delay: 0.45s;
                  }
                  .cvopt-walker .legl {
                    transform: translate(30px, 155px);
                    z-index: 3;
                    animation: lstep-full 1s infinite ease-in;
                  }
                  @keyframes bob-head {
                    0% { transform: translate(27px, -30px) rotate(3deg); }
                    5% { transform: translate(27px, -30px) rotate(3deg); }
                    25% { transform: translate(27px, -25px) rotate(0deg); }
                    50% { transform: translate(27px, -30px) rotate(-3deg); }
                    70% { transform: translate(27px, -25px) rotate(0deg); }
                    100% { transform: translate(27px, -30px) rotate(3deg); }
                  }
                  @keyframes bob-bod {
                    0% { transform: translate(0px, 30px) rotate(3deg); }
                    5% { transform: translate(0px, 30px) rotate(3deg); }
                    25% { transform: translate(0px, 35px) rotate(0deg); }
                    50% { transform: translate(0px, 30px) rotate(-3deg); }
                    70% { transform: translate(0px, 35px) rotate(0deg); }
                    100% { transform: translate(0px, 30px) rotate(3deg); }
                  }
                  @keyframes lstep-full {
                    0% { transform: translate(30px, 155px) rotate(-5deg); }
                    33% { transform: translate(62px, 140px) rotate(35deg); }
                    66% { transform: translate(55px, 155px) rotate(-25deg); }
                    100% { transform: translate(30px, 155px) rotate(-5deg); }
                  }
                  @keyframes rstep-full {
                    0% { transform: translate(75px, 135px) rotate(-5deg); }
                    33% { transform: translate(105px, 125px) rotate(35deg); }
                    66% { transform: translate(95px, 135px) rotate(-25deg); }
                    100% { transform: translate(75px, 135px) rotate(-5deg); }
                  }
                  .cvopt-walker #gnd {
                    transform: translate(-140px, 0) rotate(10deg);
                    z-index: -1;
                    filter: blur(0.5px) drop-shadow(1px 3px 5px #000000);
                    opacity: 0.25;
                    animation: scroll 5s infinite linear;
                  }
                  @keyframes scroll {
                    0% { transform: translate(50px, 25px); opacity: 0; }
                    33% { opacity: 0.25; }
                    66% { opacity: 0.25; }
                    100% { transform: translate(-100px, -50px); opacity: 0; }
                  }
                `}
                    </style>
                  </motion.div>
                </div>
              )}

              {!interview?.preparation ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#2b2a2c] rounded-xl p-8 border border-gray-200 dark:border-[#3d3c3e] text-center shadow-sm"
                >
                  <div className="max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-jobzai-100 dark:bg-jobzai-900/30 
                    rounded-full flex items-center justify-center mb-5">
                      <Search className="w-8 h-8 text-jobzai-600 dark:text-jobzai-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Get started with your preparation</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Enter a job posting URL above and click "Analyze" to get personalized interview preparation guidance.
                    </p>

                    <div className="bg-gray-50 dark:bg-[#3d3c3e]/30 p-4 rounded-lg text-left mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        What you'll get:
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6">
                        <li className="list-disc">Company and position insights</li>
                        <li className="list-disc">Tailored interview questions with answer guidance</li>
                        <li className="list-disc">Key skills assessment</li>
                        <li className="list-disc">Practice with an AI interview trainer</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()}
                      className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-jobzai-500 to-jobzai-600 text-white rounded-lg hover:from-jobzai-600 hover:to-jobzai-700 transition-colors text-sm font-medium"
                    >
                      <ArrowUp className="w-4 h-4 mr-1.5" />
                      Analyze a Job Posting
                    </button>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {tab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-jobzai-600" /></div>}>
                        <OverviewTab
                          application={application!}
                          interview={interview!}
                          checklist={checklist}
                          newsItems={newsItems}
                          isNewsLoading={isNewsLoading}
                          newsError={newsError}
                          showAllChecklistItems={showAllChecklistItems}
                          showAllNewsItems={showAllNewsItems}
                          newTaskText={newTaskText}
                          setTab={setTab}
                          setShowAllChecklistItems={setShowAllChecklistItems}
                          setShowAllNewsItems={setShowAllNewsItems}
                          setNewTaskText={setNewTaskText}
                          toggleChecklistItem={toggleChecklistItem}
                          addChecklistItem={addChecklistItem}
                          deleteChecklistItem={deleteChecklistItem}
                          updateChecklistItemText={updateChecklistItemText}
                          fetchCompanyNews={fetchCompanyNews}
                          createNoteFromNews={createNoteFromNews}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                  {false && tab === 'overview_old' && (
                    <motion.div
                      key="overview_old"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      {/* SECTION 1: Preparation Progress */}
                      <motion.article
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="group relative overflow-hidden rounded-xl bg-white px-6 py-7 shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 hover:shadow-md dark:bg-neutral-900/50 dark:ring-white/[0.05]"
                      >
                        {/* Header with circular progress */}
                        <header className="mb-6 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h2 className="mb-1.5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                              Preparation Progress
                            </h2>
                            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                              {getProgressMilestones().filter((m) => m.completed).length === 5
                                ? "You're fully prepared! 🎉"
                                : "Complete key milestones to feel interview-ready"}
                            </p>
                          </div>

                          {/* Circular progress indicator */}
                          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                            {/* Background circle */}
                            <svg className="absolute inset-0 h-16 w-16 -rotate-90 transform">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-neutral-100 dark:text-neutral-800"
                              />
                              {/* Progress circle */}
                              <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="url(#progressGradient)"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: 176 }}
                                animate={{
                                  strokeDashoffset: 176 - (176 * preparationProgress) / 100
                                }}
                                transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                                style={{
                                  strokeDasharray: 176,
                                }}
                              />
                              <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Percentage text */}
                            <div className="relative flex flex-col items-center">
                              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                                {preparationProgress}
                              </span>
                              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                                %
                              </span>
                            </div>
                          </div>
                        </header>

                        {/* Linear progress bar */}
                        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${preparationProgress}%` }}
                            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-jobzai-500 to-jobzai-600"
                          />
                        </div>

                        {/* Milestones */}
                        <div className="space-y-2">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                              Milestones
                            </span>
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              {getProgressMilestones().filter((m) => m.completed).length} of {getProgressMilestones().length}
                            </span>
                          </div>

                          {getProgressMilestones().map((milestone, index) => (
                            <motion.button
                              key={milestone.id}
                              type="button"
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              onClick={milestone.action}
                              className={[
                                'group/milestone relative w-full overflow-hidden rounded-lg transition-all duration-200',
                                milestone.completed
                                  ? 'bg-emerald-50/80 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:ring-emerald-800/40'
                                  : 'bg-neutral-50/50 ring-1 ring-black/[0.04] hover:bg-neutral-50 hover:ring-jobzai-200/50 dark:bg-white/[0.02] dark:ring-white/[0.05] dark:hover:bg-white/[0.04] dark:hover:ring-jobzai-500/30',
                              ].join(' ')}
                            >
                              {/* Hover gradient effect */}
                              {!milestone.completed && (
                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/milestone:opacity-100">
                                  <div className="absolute inset-0 bg-gradient-to-r from-jobzai-500/5 to-jobzai-600/5" />
                                </div>
                              )}

                              <div className="relative flex items-center gap-3 px-3.5 py-3">
                                {/* Icon */}
                                <div
                                  className={[
                                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                                    milestone.completed
                                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                                      : 'bg-white text-jobzai-600 ring-1 ring-black/[0.04] group-hover/milestone:bg-jobzai-50 group-hover/milestone:ring-jobzai-200/50 dark:bg-neutral-800 dark:text-jobzai-400 dark:ring-white/[0.08] dark:group-hover/milestone:bg-jobzai-950/50',
                                  ].join(' ')}
                                >
                                  {milestone.icon}
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1 text-left">
                                  <div
                                    className={[
                                      'truncate text-sm font-medium leading-tight',
                                      milestone.completed
                                        ? 'text-emerald-900 dark:text-emerald-200'
                                        : 'text-neutral-900 dark:text-neutral-100',
                                    ].join(' ')}
                                  >
                                    {milestone.label}
                                  </div>
                                  <div className="mt-0.5 truncate text-xs leading-tight text-neutral-600 dark:text-neutral-400">
                                    {milestone.description}
                                  </div>
                                </div>

                                {/* Status indicator */}
                                <div className="flex-shrink-0">
                                  {milestone.completed ? (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <ArrowRight className="h-4 w-4 text-neutral-400 transition-all duration-200 group-hover/milestone:translate-x-0.5 group-hover/milestone:text-jobzai-500 dark:text-neutral-500 dark:group-hover/milestone:text-jobzai-400" />
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.article>

                      {/* SECTION 2: QUICK ACTIONS - Checklist */}
                      <motion.article
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        whileHover={{ y: -2 }}
                        className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
                      >
                        <header className="mb-5">
                          <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Preparation Checklist</h2>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {checklist.filter((c) => c.completed).length}/{checklist.length} tasks completed
                          </p>
                        </header>

                        {/* Add Task Input */}
                        <div className="mb-5 flex items-center gap-2.5">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                              placeholder="Add a new task..."
                              className="w-full rounded-[10px] border border-black/[0.06] bg-white/80 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-jobzai-500/50 focus:outline-none focus:ring-2 focus:ring-jobzai-500/20 dark:border-white/10 dark:bg-white/5 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addChecklistItem();
                              }}
                            />
                          </div>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={addChecklistItem}
                            className="inline-flex items-center justify-center rounded-[10px] bg-jobzai-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-jobzai-700 transition-colors"
                          >
                            Add
                          </motion.button>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-2">
                          <AnimatePresence>
                            {(showAllChecklistItems ? checklist : checklist.slice(0, 5)).map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={[
                                  'flex items-center rounded-[10px] px-3 py-2.5 text-sm transition-all border',
                                  item.priority
                                    ? 'border-jobzai-200/50 bg-jobzai-50/60 dark:border-jobzai-800/50 dark:bg-jobzai-900/20'
                                    : item.completed
                                      ? 'border-black/[0.04] bg-neutral-50/60 dark:border-white/5 dark:bg-neutral-900/40'
                                      : 'border-black/[0.04] bg-white/60 dark:border-white/5 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10',
                                ].join(' ')}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem(item.id)}
                                  className={[
                                    'mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border-2 transition-all',
                                    item.completed
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-neutral-300 dark:border-neutral-600 hover:border-jobzai-500 dark:hover:border-jobzai-500',
                                  ].join(' ')}
                                >
                                  {item.completed && <Check className="h-3 w-3" />}
                                </button>
                                <input
                                  value={item.task}
                                  onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                  className={[
                                    'flex-1 bg-transparent text-sm outline-none',
                                    item.completed
                                      ? 'text-neutral-500 line-through dark:text-neutral-400'
                                      : 'text-neutral-800 dark:text-neutral-100',
                                  ].join(' ')}
                                />
                                <div className="ml-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTab(item.section)}
                                    className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-black/[0.08] dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20 transition-colors"
                                  >
                                    Go
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteChecklistItem(item.id)}
                                    className="rounded-full bg-red-50/80 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {checklist.length > 5 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="pt-2 text-center"
                            >
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowAllChecklistItems(!showAllChecklistItems)}
                                className="inline-flex items-center justify-center gap-1 text-xs font-medium text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-300 dark:hover:text-jobzai-200 transition-colors"
                              >
                                {showAllChecklistItems ? (
                                  <>
                                    <ChevronDown className="h-3 w-3 rotate-180" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    View all {checklist.length} tasks
                                    <ArrowRight className="h-3 w-3" />
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}
                        </div>
                      </motion.article>

                      {/* SECTION 3: KEY POINTS TO EMPHASIZE */}
                      <motion.article
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        whileHover={{ y: -2 }}
                        className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
                      >
                        <header className="mb-5">
                          <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Key Points to Emphasize</h2>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Core messages to highlight during the interview</p>
                        </header>

                        {interview?.preparation?.keyPoints && interview.preparation.keyPoints.length > 0 ? (
                          <div className="space-y-3">
                            <ul className="space-y-3">
                              {interview.preparation.keyPoints.slice(0, 5).map((point, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="flex items-start gap-3"
                                >
                                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    {point}
                                  </p>
                                </motion.li>
                              ))}
                            </ul>
                            {interview.preparation.keyPoints.length > 5 && (
                              <div className="pt-2 text-center">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1 text-xs font-medium text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-300 dark:hover:text-jobzai-200 transition-colors"
                                >
                                  View all {interview.preparation.keyPoints.length} points
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-black/[0.08] bg-[#FAFAFA] dark:border-white/10 dark:bg-white/5 px-4 py-8 text-center">
                            <Flag className="mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                              No key points available yet. Run the job post analysis to generate tailored talking points.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
                              }
                              className="inline-flex items-center justify-center gap-1 rounded-full bg-jobzai-50 px-3 py-1.5 text-xs font-medium text-jobzai-700 hover:bg-jobzai-100 dark:bg-jobzai-900/30 dark:text-jobzai-200 dark:hover:bg-jobzai-800/60 transition-colors"
                            >
                              <ArrowUp className="h-3 w-3" />
                              Analyze a job posting
                            </button>
                          </div>
                        )}
                      </motion.article>

                      {/* SECTION 4: DEEP DIVE - Company & Role */}
                      <div className="space-y-4">
                        {/* Company Profile */}
                        <motion.article
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          whileHover={{ y: -2 }}
                          className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
                        >
                          <header className="mb-5">
                            <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Company Profile</h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">How to describe the company and its context</p>
                          </header>

                          <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-neutral-900 dark:text-white">
                              <span className="mr-2 inline-flex items-center rounded-full bg-jobzai-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-jobzai-700 dark:bg-jobzai-900/40 dark:text-jobzai-200">
                                KEY
                              </span>
                              {interview?.preparation?.companyInfo?.split('.')[0] ||
                                `${application.companyName} is a leading company in its industry.`}
                            </p>

                            {interview?.preparation?.companyInfo ? (
                              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                {interview.preparation.companyInfo.split('.').slice(1, 3).join('.')}
                              </p>
                            ) : (
                              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                                No additional company information available yet. Run the job post analysis to generate richer company context.
                              </p>
                            )}

                            <div className="rounded-[12px] border border-jobzai-200/50 bg-jobzai-50/60 p-4 dark:border-jobzai-900/60 dark:bg-jobzai-900/10">
                              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50">
                                Focus points
                              </div>
                              <ul className="space-y-2.5 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                                <li className="flex gap-2.5">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-jobzai-500" />
                                  <span>Research their mission, values, and long-term vision.</span>
                                </li>
                                <li className="flex gap-2.5">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-jobzai-500" />
                                  <span>Review recent company achievements, projects, or announcements.</span>
                                </li>
                                <li className="flex gap-2.5">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-jobzai-500" />
                                  <span>Understand their market position, competitors, and key challenges.</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </motion.article>

                        {/* Position Details & Required Skills */}
                        <motion.article
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          whileHover={{ y: -2 }}
                          className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
                        >
                          <header className="mb-5">
                            <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Position Details</h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">What this role expects and how to position yourself</p>
                          </header>

                          <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-neutral-900 dark:text-white">
                              <span className="mr-2 inline-flex items-center rounded-full bg-jobzai-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-jobzai-700 dark:bg-jobzai-900/40 dark:text-jobzai-200">
                                KEY
                              </span>
                              {interview?.preparation?.positionDetails?.split('.')[0] ||
                                `The ${application.position} role involves key responsibilities in the organization.`}
                            </p>

                            {interview?.preparation?.positionDetails ? (
                              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                {interview.preparation.positionDetails.split('.').slice(1, 3).join('.')}
                              </p>
                            ) : (
                              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                                No detailed position information available yet. Run the job post analysis to get a more precise breakdown of responsibilities and expectations.
                              </p>
                            )}

                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50">
                                Required skills
                              </div>
                              {interview?.preparation?.requiredSkills &&
                                interview.preparation.requiredSkills.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {interview.preparation.requiredSkills.map((skill, index) => (
                                    <div
                                      key={index}
                                      className="inline-flex items-center rounded-[8px] border border-black/[0.04] bg-white/80 px-3 py-1.5 text-xs text-neutral-800 dark:border-white/5 dark:bg-white/5 dark:text-neutral-100"
                                    >
                                      <span className="mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-jobzai-500" />
                                      <span className="truncate">{skill}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  No skills information available yet. Once you run the analysis, key skills will appear here in a structured list.
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.article>
                      </div>

                      {/* SECTION 5: NEWS & UPDATES */}
                      {interview?.preparation && (
                        <motion.article
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          whileHover={{ y: -2 }}
                          className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
                        >
                          <header className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Company Updates</h2>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Recent news and announcements about the company</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isNewsLoading && (
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Loading…</span>
                                </div>
                              )}
                              {newsError && (
                                <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>
                              )}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  fetchCompanyNews();
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-black/[0.12] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:border-white/20 transition-colors"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Refresh
                              </motion.button>
                            </div>
                          </header>

                          <div className="space-y-3">
                            {newsItems.length === 0 && !isNewsLoading && !newsError && (
                              <div className="flex flex-col items-center justify-center py-8 text-sm text-neutral-500 dark:text-neutral-400">
                                <Newspaper className="mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                                <p>No company updates yet. Try refreshing or running the analysis again.</p>
                              </div>
                            )}

                            <AnimatePresence>
                              {(showAllNewsItems ? newsItems : newsItems.slice(0, 3)).map((news, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="rounded-[12px] border border-black/[0.04] bg-white/80 px-4 py-3.5 text-sm leading-relaxed hover:border-jobzai-200/50 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-jobzai-800/50 dark:hover:bg-white/10 transition-all"
                                >
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={[
                                        'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                                        news.sentiment === 'positive'
                                          ? 'bg-emerald-500'
                                          : news.sentiment === 'negative'
                                            ? 'bg-red-500'
                                            : 'bg-neutral-500',
                                      ].join(' ')}
                                    />
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                          {news.title}
                                        </h4>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        <span>{news.date}</span>
                                        {news.source && (
                                          <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1">
                                              <Newspaper className="h-3 w-3" />
                                              {news.source}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {news.summary && (
                                        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                                          {news.summary}
                                        </p>
                                      )}
                                      <div className="mt-2 flex items-center justify-between gap-3">
                                        <motion.button
                                          type="button"
                                          whileHover={{ scale: 1.03 }}
                                          whileTap={{ scale: 0.97 }}
                                          onClick={() => createNoteFromNews(news)}
                                          className="inline-flex items-center gap-1 rounded-full bg-jobzai-50 px-3 py-1.5 text-xs font-medium text-jobzai-700 hover:bg-jobzai-100 dark:bg-jobzai-900/30 dark:text-jobzai-200 dark:hover:bg-jobzai-800/60 transition-colors"
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          Talking points
                                        </motion.button>
                                        {news.url && (
                                          <a
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-black/[0.04] dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Read more
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>

                            {newsItems.length > 3 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="pt-2 text-center"
                              >
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setShowAllNewsItems(!showAllNewsItems)}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-medium text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-300 dark:hover:text-jobzai-200 transition-colors"
                                >
                                  {showAllNewsItems ? (
                                    <>
                                      <ChevronDown className="h-3 w-3 rotate-180" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      View all {newsItems.length} updates
                                      <ArrowRight className="h-3 w-3" />
                                    </>
                                  )}
                                </motion.button>
                              </motion.div>
                            )}
                          </div>
                        </motion.article>
                      )}
                    </motion.div>
                  )}

                  {tab === 'questions' && (
                    <motion.div
                      key="questions"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6 relative"
                    >
                      <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-jobzai-600" /></div>}>
                        <QuestionsTab
                          questionEntries={questionEntries}
                          filteredQuestions={filteredQuestions}
                          activeQuestionFilter={activeQuestionFilter}
                          isRegeneratingQuestions={isRegeneratingQuestions}
                          regeneratingProgress={regeneratingProgress}
                          regeneratingMessage={regeneratingMessage}
                          savedQuestionsState={savedQuestionsState}
                          collapsedQuestions={collapsedQuestions}
                          focusedQuestion={focusedQuestion}
                          application={application!}
                          setActiveQuestionFilter={setActiveQuestionFilter}
                          regenerateQuestions={regenerateQuestions}
                          handleToggleSuggestionVisibility={handleToggleSuggestionVisibility}
                          handleToggleSaveQuestion={handleToggleSaveQuestion}
                          handleCreateNoteFromQuestion={handleCreateNoteFromQuestion}
                          setFocusedQuestion={setFocusedQuestion}
                          onStartLiveSession={handleStartLiveSession}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                  {false && tab === 'questions_old' && (
                    <motion.div
                      key="questions_old"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6 relative"
                    >
                      {/* Loading Overlay - Bird animation for question regeneration */}
                      {isRegeneratingQuestions && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center px-6"
                          >
                            <div className="cvopt-walker mb-8" aria-label="Loading">
                              <div className="loader">
                                <svg className="legl" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20.69332" height="68.19944" viewBox="0,0,20.69332,68.19944">
                                  <g transform="translate(-201.44063,-235.75466)">
                                    <g strokeMiterlimit={10}>
                                      <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                                      <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                                      <path d="M218.11971,301.20087c-2.20708,1.73229 -4.41416,0 -4.41416,0l-1.43017,-1.1437c-1.42954,-1.40829 -3.04351,-2.54728 -4.56954,-3.87927c-0.95183,-0.8308 -2.29837,-1.49883 -2.7652,-2.55433c-0.42378,-0.95815 0.14432,-2.02654 0.29355,-3.03399c0.41251,-2.78499 1.82164,-5.43386 2.41472,-8.22683c1.25895,-4.44509 2.73863,-8.98683 3.15318,-13.54796c0.22615,-2.4883 -0.21672,-5.0155 -0.00278,-7.50605c0.30636,-3.56649 1.24602,-7.10406 1.59992,-10.6738c0.29105,-2.93579 -0.00785,-5.9806 -0.00785,-8.93046c0,0 0,-2.44982 3.12129,-2.44982c3.12129,0 3.12129,2.44982 3.12129,2.44982c0,3.06839 0.28868,6.22201 -0.00786,9.27779c-0.34637,3.56935 -1.30115,7.10906 -1.59992,10.6738c-0.2103,2.50918 0.22586,5.05326 -0.00278,7.56284c-0.43159,4.7371 -1.94029,9.46317 -3.24651,14.07835c-0.47439,2.23403 -1.29927,4.31705 -2.05805,6.47156c-0.18628,0.52896 -0.1402,1.0974 -0.327,1.62624c-0.09463,0.26791 -0.64731,0.47816 -0.50641,0.73323c0.19122,0.34617 0.86423,0.3445 1.2346,0.58502c1.88637,1.22503 3.50777,2.79494 5.03,4.28305l0.96971,0.73991c0,0 2.20708,1.73229 0,3.46457z" fill="none" stroke="#191e2e" strokeWidth={7} />
                                    </g>
                                  </g>
                                </svg>
                                <svg className="legr" version="1.1" xmlns="http://www.w3.org/2000/svg" width="41.02537" height="64.85502" viewBox="0,0,41.02537,64.85502">
                                  <g transform="translate(-241.54137,-218.44347)">
                                    <g strokeMiterlimit={10}>
                                      <path d="M279.06674,279.42662c-2.27967,1.98991 -6.08116,0.58804 -6.08116,0.58804l-2.47264,-0.92915c-2.58799,-1.18826 -5.31176,-2.08831 -7.99917,-3.18902c-1.67622,-0.68654 -3.82471,-1.16116 -4.93147,-2.13229c-1.00468,-0.88156 -0.69132,-2.00318 -0.92827,-3.00935c-0.65501,-2.78142 0.12275,-5.56236 -0.287,-8.37565c-0.2181,-4.51941 -0.17458,-9.16283 -1.60696,-13.68334c-0.78143,-2.46614 -2.50162,-4.88125 -3.30086,-7.34796c-1.14452,-3.53236 -1.40387,-7.12078 -2.48433,-10.66266c-0.88858,-2.91287 -2.63779,-5.85389 -3.93351,-8.74177c0,0 -1.07608,-2.39835 3.22395,-2.81415c4.30003,-0.41581 2.41605,1.98254 2.41605,1.98254c1.34779,3.00392 3.13072,6.05282 4.06444,9.0839c1.09065,3.54049 1.33011,7.13302 2.48433,10.66266c0.81245,2.48448 2.5308,4.917 3.31813,7.40431c1.48619,4.69506 1.48366,9.52281 1.71137,14.21503c0.32776,2.25028 0.10631,4.39942 0.00736,6.60975c-0.02429,0.54266 0.28888,1.09302 0.26382,1.63563c-0.01269,0.27488 -0.68173,0.55435 -0.37558,0.78529c0.41549,0.31342 1.34191,0.22213 1.95781,0.40826c3.13684,0.94799 6.06014,2.26892 8.81088,3.52298l1.66093,0.59519c0,0 6.76155,1.40187 4.48187,3.39177z" fill="none" stroke="#000000" strokeWidth={7} />
                                      <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                                      <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                                    </g>
                                  </g>
                                </svg>
                                <div className="bod">
                                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="144.10576" height="144.91623" viewBox="0,0,144.10576,144.91623">
                                    <g transform="translate(-164.41679,-112.94712)">
                                      <g strokeMiterlimit={10}>
                                        <path d="M166.9168,184.02633c0,-36.49454 35.0206,-66.07921 72.05288,-66.07921c37.03228,0 67.05288,29.58467 67.05288,66.07921c0,6.94489 -1.08716,13.63956 -3.10292,19.92772c-2.71464,8.46831 -7.1134,16.19939 -12.809,22.81158c-2.31017,2.68194 -7.54471,12.91599 -7.54471,12.91599c0,0 -5.46714,-1.18309 -8.44434,0.6266c-3.86867,2.35159 -10.95356,10.86714 -10.95356,10.86714c0,0 -6.96906,-3.20396 -9.87477,-2.58085c-2.64748,0.56773 -6.72538,5.77072 -6.72538,5.77072c0,0 -5.5023,-4.25969 -7.5982,-4.25969c-3.08622,0 -9.09924,3.48259 -9.09924,3.48259c0,0 -6.0782,-5.11244 -9.00348,-5.91884c-4.26461,-1.17561 -12.23343,0.75049 -12.23343,0.75049c0,0 -5.18164,-8.26065 -7.60688,-9.90388c-3.50443,-2.37445 -8.8271,-3.95414 -8.8271,-3.95414c0,0 -5.33472,-8.81718 -7.27019,-11.40895c-4.81099,-6.44239 -13.46422,-9.83437 -15.65729,-17.76175c-1.53558,-5.55073 -2.35527,-21.36472 -2.35527,-21.36472z" fill="#191e2e" stroke="#000000" strokeWidth={5} strokeLinecap="butt" />
                                        <path d="M167.94713,180c0,-37.03228 35.0206,-67.05288 72.05288,-67.05288c37.03228,0 67.05288,30.0206 67.05288,67.05288c0,7.04722 -1.08716,13.84053 -3.10292,20.22135c-2.71464,8.59309 -7.1134,16.43809 -12.809,23.14771c-2.31017,2.72146 -7.54471,13.1063 -7.54471,13.1063c0,0 -5.46714,-1.20052 -8.44434,0.63584c-3.86867,2.38624 -10.95356,11.02726 -10.95356,11.02726c0,0 -6.96906,-3.25117 -9.87477,-2.61888c-2.64748,0.5761 -6.72538,5.85575 -6.72538,5.85575c0,0 -5.5023,-4.32246 -7.5982,-4.32246c-3.08622,0 -9.09924,3.5339 -9.09924,3.5339c0,0 -6.0782,-5.18777 -9.00348,-6.00605c-4.26461,-1.19293 -12.23343,0.76155 -12.23343,0.76155c0,0 -5.18164,-8.38236 -7.60688,-10.04981c-3.50443,-2.40943 -8.8271,-4.0124 -8.8271,-4.0124c0,0 -5.33472,-8.9471 -7.27019,-11.57706c-4.81099,-6.53732 -13.46422,-9.97928 -15.65729,-18.02347c-1.53558,-5.63252 -2.35527,-21.67953 -2.35527,-21.67953z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                        <path d="M216.22445,188.06994c0,0 1.02834,11.73245 -3.62335,21.11235c-4.65169,9.3799 -13.06183,10.03776 -13.06183,10.03776c0,0 7.0703,-3.03121 10.89231,-10.7381c4.34839,-8.76831 5.79288,-20.41201 5.79288,-20.41201z" fill="none" stroke="#2f3a50" strokeWidth={3} strokeLinecap="round" />
                                      </g>
                                    </g>
                                  </svg>
                                  <svg className="head" version="1.1" xmlns="http://www.w3.org/2000/svg" width="115.68559" height="88.29441" viewBox="0,0,115.68559,88.29441">
                                    <g transform="translate(-191.87889,-75.62023)">
                                      <g strokeMiterlimit={10}>
                                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                        <path d="M195.12889,128.77752c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,0.60102 -9.22352,20.49284 -9.22352,20.49284l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="butt" />
                                        <path d="M195.31785,124.43649c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,1.03481 -0.08666,2.8866 -0.08666,2.8866c0,0 16.8538,15.99287 16.21847,17.23929c-0.66726,1.30905 -23.05667,-4.14265 -23.05667,-4.14265l-2.29866,4.5096l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                        <path d="M271.10348,122.46768l10.06374,-3.28166l24.06547,24.28424" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="round" />
                                        <path d="M306.56448,144.85764l-41.62024,-8.16845l2.44004,-7.87698" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                                        <path d="M276.02738,115.72434c-0.66448,-4.64715 2.56411,-8.95308 7.21127,-9.61756c4.64715,-0.66448 8.95309,2.56411 9.61757,7.21126c0.46467,3.24972 -1.94776,8.02206 -5.96624,9.09336c-2.11289,-1.73012 -5.08673,-5.03426 -5.08673,-5.03426c0,0 -4.12095,1.16329 -4.60481,1.54229c-0.16433,-0.04891 -0.62732,-0.38126 -0.72803,-0.61269c-0.30602,-0.70328 -0.36302,-2.02286 -0.44303,-2.58239z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                        <path d="M242.49281,125.6424c0,-4.69442 3.80558,-8.5 8.5,-8.5c4.69442,0 8.5,3.80558 8.5,8.5c0,4.69442 -3.80558,8.5 -8.5,8.5c-4.69442,0 -8.5,-3.80558 -8.5,-8.5z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                                      </g>
                                    </g>
                                  </svg>
                                </div>
                                <svg id="gnd" version="1.1" xmlns="http://www.w3.org/2000/svg" width={475} height={530} viewBox="0,0,163.40011,85.20095">
                                  <g transform="translate(-176.25,-207.64957)">
                                    <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeMiterlimit={10}>
                                      <path d="M295.5,273.1829c0,0 -57.38915,6.69521 -76.94095,-9.01465c-13.65063,-10.50609 15.70098,-20.69467 -2.5451,-19.94465c-30.31027,2.05753 -38.51396,-26.84135 -38.51396,-26.84135c0,0 6.50084,13.30023 18.93224,19.17888c9.53286,4.50796 26.23632,-1.02541 32.09529,4.95137c3.62417,3.69704 2.8012,6.33005 0.66517,8.49452c-3.79415,3.84467 -11.7312,6.21103 -6.24682,10.43645c22.01082,16.95812 72.55412,12.73944 72.55412,12.73944z" fill="#000000" />
                                      <path d="M338.92138,217.76285c0,0 -17.49626,12.55408 -45.36424,10.00353c-8.39872,-0.76867 -17.29557,-6.23066 -17.29557,-6.23066c0,0 3.06461,-2.23972 15.41857,0.72484c26.30467,6.31228 47.24124,-4.49771 47.24124,-4.49771z" fill="#000000" />
                                      <path d="M209.14443,223.00182l1.34223,15.4356l-10.0667,-15.4356" fill="none" />
                                      <path d="M198.20391,230.41806l12.95386,7.34824l6.71113,-12.08004" fill="none" />
                                      <path d="M211.19621,238.53825l8.5262,-6.09014" fill="none" />
                                      <path d="M317.57068,215.80173l5.27812,6.49615l0.40601,-13.39831" fill="none" />
                                      <path d="M323.66082,222.70389l6.09014,-9.33822" fill="none" />
                                    </g>
                                  </g>
                                </svg>
                              </div>
                            </div>
                            <div className="w-[min(60vw,520px)] h-2 rounded-full bg-white/20 dark:bg-white/15 overflow-hidden mb-4">
                              <div
                                className="h-full bg-gradient-to-r from-jobzai-500 via-jobzai-400 to-jobzai-600 transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, regeneratingProgress))}%` }}
                              />
                            </div>
                            <p className="text-base font-semibold text-white">
                              {regeneratingMessage}
                            </p>
                            <p className="mt-2 text-sm text-white/80">
                              This may take up to 2 minutes.
                            </p>
                          </motion.div>
                          <style>
                            {`
                            .cvopt-walker .loader {
                              position: relative;
                              width: 200px;
                              height: 200px;
                              transform: translate(10px, -20px) scale(0.75);
                            }
                            .cvopt-walker .loader svg {
                              position: absolute;
                              top: 0;
                              left: 0;
                            }
                            .cvopt-walker .head {
                              transform: translate(27px, -30px);
                              z-index: 3;
                              animation: bob-head 1s infinite ease-in;
                            }
                            .cvopt-walker .bod {
                              transform: translate(0px, 30px);
                              z-index: 3;
                              animation: bob-bod 1s infinite ease-in-out;
                            }
                            .cvopt-walker .legr {
                              transform: translate(75px, 135px);
                              z-index: 0;
                              animation: rstep-full 1s infinite ease-in;
                            }
                            .cvopt-walker .legr {
                              animation-delay: 0.45s;
                            }
                            .cvopt-walker .legl {
                              transform: translate(30px, 155px);
                              z-index: 3;
                              animation: lstep-full 1s infinite ease-in;
                            }
                            @keyframes bob-head {
                              0% { transform: translate(27px, -30px) rotate(3deg); }
                              5% { transform: translate(27px, -30px) rotate(3deg); }
                              25% { transform: translate(27px, -25px) rotate(0deg); }
                              50% { transform: translate(27px, -30px) rotate(-3deg); }
                              70% { transform: translate(27px, -25px) rotate(0deg); }
                              100% { transform: translate(27px, -30px) rotate(3deg); }
                            }
                            @keyframes bob-bod {
                              0% { transform: translate(0px, 30px) rotate(3deg); }
                              5% { transform: translate(0px, 30px) rotate(3deg); }
                              25% { transform: translate(0px, 35px) rotate(0deg); }
                              50% { transform: translate(0px, 30px) rotate(-3deg); }
                              70% { transform: translate(0px, 35px) rotate(0deg); }
                              100% { transform: translate(0px, 30px) rotate(3deg); }
                            }
                            @keyframes lstep-full {
                              0% { transform: translate(30px, 155px) rotate(-5deg); }
                              33% { transform: translate(62px, 140px) rotate(35deg); }
                              66% { transform: translate(55px, 155px) rotate(-25deg); }
                              100% { transform: translate(30px, 155px) rotate(-5deg); }
                            }
                            @keyframes rstep-full {
                              0% { transform: translate(75px, 135px) rotate(-5deg); }
                              33% { transform: translate(105px, 125px) rotate(35deg); }
                              66% { transform: translate(95px, 135px) rotate(-25deg); }
                              100% { transform: translate(75px, 135px) rotate(-5deg); }
                            }
                            .cvopt-walker #gnd {
                              transform: translate(-140px, 0) rotate(10deg);
                              z-index: -1;
                              filter: blur(0.5px) drop-shadow(1px 3px 5px #000000);
                              opacity: 0.25;
                              animation: scroll 5s infinite linear;
                            }
                            @keyframes scroll {
                              0% { transform: translate(50px, 25px); opacity: 0; }
                              33% { opacity: 0.25; }
                              66% { opacity: 0.25; }
                              100% { transform: translate(-100px, -50px); opacity: 0; }
                            }
                          `}
                          </style>
                        </div>
                      )}

                      <InterviewQuestionsHeader
                        totalCount={questionEntries.length}
                        filteredCount={filteredQuestions.length}
                        filters={QUESTION_FILTERS}
                        activeFilter={activeQuestionFilter}
                        onFilterChange={setActiveQuestionFilter}
                        onRegenerate={regenerateQuestions}
                        isRegenerating={isRegeneratingQuestions}
                        subtitle={application ? `Tailored questions for your ${application.position} interview` : undefined}
                      />

                      {!isRegeneratingQuestions && (
                        <div className="mt-8 space-y-5">
                          {questionEntries.length === 0 && (
                            <div className="rounded-[20px] border border-dashed border-black/10 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                              <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">No suggested questions yet</h3>
                              <p className="mt-2 text-sm text-neutral-500">
                                Analyze a job posting to let the AI craft premium interview questions for you.
                              </p>
                            </div>
                          )}

                          {questionEntries.length > 0 && filteredQuestions.length === 0 && (
                            <div className="rounded-[20px] border border-black/5 bg-white/80 px-6 py-10 text-center shadow-[0_16px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                              <MessageSquare className="mx-auto h-12 w-12 text-neutral-200 dark:text-neutral-600" />
                              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                                No {QUESTION_FILTERS.find(filter => filter.id === activeQuestionFilter)?.label?.toLowerCase() || 'selected'} questions found
                              </h3>
                              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
                                Try another filter or show all questions to continue practicing.
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveQuestionFilter('all')}
                                className="mt-4 inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                              >
                                Show all questions
                              </button>
                            </div>
                          )}

                          {filteredQuestions.length > 0 && (
                            <div className="space-y-5">
                              {filteredQuestions.map((entry, displayIndex) => (
                                <QuestionCard
                                  key={entry.id}
                                  index={displayIndex}
                                  question={entry.text}
                                  tags={entry.tags}
                                  suggestedApproach={entry.suggestedApproach}
                                  isSuggestionOpen={collapsedQuestions[entry.id] === false}
                                  isSaved={savedQuestionsState.includes(entry.rawValue)}
                                  onToggleSuggestion={() => handleToggleSuggestionVisibility(entry.id)}
                                  onToggleSave={() => handleToggleSaveQuestion(entry.rawValue)}
                                  onCreateNote={() => handleCreateNoteFromQuestion(entry.text, displayIndex + 1)}
                                  onFocus={() => setFocusedQuestion(entry)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-jobzai-600" /></div>}>
                        <SkillsTab
                          interview={interview!}
                          skillRatings={skillRatings}
                          skillCoach={skillCoach}
                          skillGaps={skillGaps}
                          application={application!}
                          handleRateSkill={handleRateSkill}
                          addStarStory={addStarStory}
                          updateStarField={updateStarField}
                          deleteStarStory={deleteStarStory}
                          exportStoryToNotes={handleStarExportClick}
                          practiceInChat={practiceInChat}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                  {false && tab === 'skills_old' && (
                    <motion.div
                      key="skills_old"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 border border-gray-200 dark:border-[#3d3c3e] shadow-sm">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Skills Assessment
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Rate your confidence with each required skill to identify areas for preparation.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {interview.preparation.requiredSkills?.map((skill, index) => {
                            const currentRating = skillRatings[skill] || 0;
                            const confidenceLabels = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-[#242325]/50 dark:to-[#2b2a2c] rounded-xl p-5 border border-gray-200 dark:border-[#3d3c3e] hover:border-jobzai-300 dark:hover:border-jobzai-700 transition-all duration-200 hover:shadow-md"
                              >
                                {/* Skill Text */}
                                <div className="mb-4">
                                  <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed pr-2">
                                    {skill}
                                  </p>
                                </div>

                                {/* Rating Section */}
                                <div className="flex items-center justify-between gap-4">
                                  {/* Rating Stars */}
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex gap-1.5">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                          key={rating}
                                          onClick={() => handleRateSkill(skill, rating)}
                                          className={`
                                          relative w-10 h-10 rounded-lg transition-all duration-200
                                          ${currentRating >= rating
                                              ? currentRating === rating
                                                ? 'bg-jobzai-600 dark:bg-jobzai-500 text-white shadow-md scale-105 ring-2 ring-jobzai-300 dark:ring-jobzai-700'
                                                : 'bg-jobzai-400 dark:bg-jobzai-600 text-white'
                                              : 'bg-gray-200 dark:bg-[#3d3c3e] text-gray-400 dark:text-gray-500 hover:bg-jobzai-100 dark:hover:bg-jobzai-900/30 hover:text-jobzai-600 dark:hover:text-jobzai-400'
                                            }
                                        `}
                                          aria-label={`Rate ${skill} ${rating} out of 5`}
                                          title={`${rating}/5 - ${confidenceLabels[rating - 1]}`}
                                        >
                                          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                                            {rating}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Confidence Label */}
                                  {currentRating > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-jobzai-50 dark:bg-jobzai-900/30 border border-jobzai-200 dark:border-jobzai-800"
                                    >
                                      <span className="text-xs font-semibold text-jobzai-700 dark:text-jobzai-300">
                                        {currentRating}/5
                                      </span>
                                      <span className="text-xs text-jobzai-600 dark:text-jobzai-400 hidden sm:inline">
                                        {confidenceLabels[currentRating - 1]}
                                      </span>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Progress Bar (subtle) */}
                                {currentRating > 0 && (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="mt-3 h-1 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden"
                                  >
                                    <div
                                      className="h-full bg-gradient-to-r from-jobzai-500 to-jobzai-600 rounded-full transition-all duration-300"
                                      style={{ width: `${(currentRating / 5) * 100}%` }}
                                    />
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}

                          {(!interview.preparation?.requiredSkills || interview.preparation.requiredSkills.length === 0) && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No skills to assess yet.</p>
                              <p className="text-xs mt-1">Analyze a job posting to see required skills.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 border border-gray-200 dark:border-[#3d3c3e] shadow-sm">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Skill Coach</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Focus on skills with the biggest gaps. Complete tasks and prepare STAR stories.
                          </p>
                        </div>
                        <div className="space-y-4">
                          {skillGaps.map(({ skill, rating, gap }, idx) => (
                            <motion.div
                              key={skill}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-[#242325]/50 dark:to-[#2b2a2c] rounded-xl p-5 border border-gray-200 dark:border-[#3d3c3e] hover:border-jobzai-300 dark:hover:border-jobzai-700 transition-all duration-200 hover:shadow-md"
                            >
                              {/* Header Section */}
                              <div className="mb-4">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <h4 className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed flex-1">
                                    {skill}
                                  </h4>
                                </div>

                                {/* Rating and Action Row */}
                                <div className="flex items-center justify-between gap-3 mt-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-jobzai-50 dark:bg-jobzai-900/30 border border-jobzai-200 dark:border-jobzai-800">
                                      <span className="text-xs font-semibold text-jobzai-700 dark:text-jobzai-300">
                                        {rating}/5
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                      <span className="text-xs text-jobzai-600 dark:text-jobzai-400">
                                        Gap {gap}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => practiceInChat(skill)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-jobzai-600 hover:bg-jobzai-700 dark:bg-jobzai-500 dark:hover:bg-jobzai-600 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Practise in Chat</span>
                                  </button>
                                </div>
                              </div>

                              {/* 30-minute plan */}
                              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-[#3d3c3e]">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className="w-4 h-4 text-jobzai-600 dark:text-jobzai-400" />
                                  <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">30‑minute plan</h5>
                                </div>
                                <div className="space-y-2.5">
                                  {(ensureDefaultTasks(skill)).map(t => (
                                    <label
                                      key={t.id}
                                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50 transition-colors cursor-pointer group/item"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={t.done}
                                        onChange={() => toggleMicroTask(skill, t.id)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-[#4a494b] text-jobzai-600 focus:ring-jobzai-500 focus:ring-2 cursor-pointer"
                                      />
                                      <span className={`text-sm text-gray-700 dark:text-gray-300 flex-1 ${t.done ? 'line-through text-gray-400 dark:text-gray-500' : ''
                                        }`}>
                                        {t.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* STAR stories */}
                              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-[#3d3c3e]">
                                <div className="flex items-center gap-2 mb-3">
                                  <Award className="w-4 h-4 text-jobzai-600 dark:text-jobzai-400" />
                                  <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">STAR stories</h5>
                                </div>
                                <div className="space-y-3">
                                  {(skillCoach?.starStories?.[skill] || []).map(story => (
                                    <div key={story.id} className="space-y-2.5 p-3 rounded-lg bg-gray-50 dark:bg-[#242325]/40 border border-gray-200 dark:border-[#3d3c3e]">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                        <textarea
                                          rows={3}
                                          value={story.situation}
                                          onChange={(e) => updateStarField(skill, story.id, 'situation', e.target.value)}
                                          placeholder="Situation (context, stakes, constraints)"
                                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#4a494b] dark:bg-[#2b2a2c] dark:text-white resize-y focus:ring-2 focus:ring-jobzai-500 focus:border-transparent"
                                        />
                                        <textarea
                                          rows={3}
                                          value={story.action}
                                          onChange={(e) => updateStarField(skill, story.id, 'action', e.target.value)}
                                          placeholder="Action (what you did, how, tools)"
                                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#4a494b] dark:bg-[#2b2a2c] dark:text-white resize-y focus:ring-2 focus:ring-jobzai-500 focus:border-transparent"
                                        />
                                        <textarea
                                          rows={3}
                                          value={story.result}
                                          onChange={(e) => updateStarField(skill, story.id, 'result', e.target.value)}
                                          placeholder="Result (impact, metrics, lessons)"
                                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#4a494b] dark:bg-[#2b2a2c] dark:text-white resize-y focus:ring-2 focus:ring-jobzai-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleStarExportClick(skill, story.id)}
                                          className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#4a494b] transition-colors font-medium"
                                        >
                                          Export to Notes
                                        </button>
                                        <button
                                          onClick={() => deleteStarStory(skill, story.id)}
                                          className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => addStarStory(skill)}
                                    className="w-full text-sm px-4 py-2.5 bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#4a494b] transition-colors font-medium border border-gray-200 dark:border-[#4a494b] border-dashed"
                                  >
                                    + Add story
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {skillGaps.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No priority gaps detected.</p>
                              <p className="text-xs mt-1">Rate your skills on the left to see improvement areas.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {tab === 'resources' && (
                    <motion.div
                      key="resources"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-jobzai-600" /></div>}>
                        <ResourcesTab
                          application={application!}
                          interview={interview}
                          resourcesData={resourcesData}
                          setResourcesData={setResourcesData}
                          saveResourcesData={saveResourcesData}
                          onGenerateQuestions={generateQuestionsToAsk}
                          onGeneratePitch={generateElevatorPitch}
                          isGeneratingQuestions={isGeneratingQuestions}
                          isGeneratingPitch={isGeneratingPitch}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                  {false && tab === 'resources_old' && (
                    <motion.div
                      key="resources_old"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                      <div className="md:col-span-3 bg-white dark:bg-[#2b2a2c] rounded-xl p-6 border border-gray-200 dark:border-[#3d3c3e] shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Preparation Tips</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { id: 'research', title: 'Research the Company', description: 'Look up their mission, values, recent news, and products/services.', icon: <Building className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> },
                            { id: 'star', title: 'Prepare Your STAR Stories', description: 'Create specific examples using the Situation, Task, Action, Result format.', icon: <MessageSquare className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> },
                            { id: 'practice', title: 'Practice Your Responses', description: 'Rehearse answers to common questions aloud or with a friend.', icon: <PlayCircle className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> },
                            { id: 'ask', title: 'Prepare Questions to Ask', description: 'Have thoughtful questions ready about the role, team, and company.', icon: <BookmarkPlus className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> },
                            { id: 'jd', title: 'Review Job Description', description: 'Align your talking points with the skills and qualifications listed.', icon: <FileText className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> },
                            { id: 'presentation', title: 'Plan Your Presentation', description: 'Prepare what to wear, test your tech for virtual interviews, plan your route.', icon: <Share2 className="w-5 h-5 text-jobzai-600 dark:text-jobzai-400" /> }
                          ].map((tip, index) => {
                            const checked = resourcesData?.reviewedTips?.includes(tip.id);
                            return (
                              <motion.div key={tip.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-5 rounded-xl shadow-sm border ${checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-[#242325]/50 border-gray-100 dark:border-[#3d3c3e]'}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start">
                                    <div className="mr-3 mt-0.5">{tip.icon}</div>
                                    <div>
                                      <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">{tip.title}</h4>
                                      <p className="text-gray-600 dark:text-gray-400 text-sm">{tip.description}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <input type="checkbox" checked={!!checked} onChange={async () => {
                                      const list = new Set(resourcesData?.reviewedTips || []);
                                      if (checked) list.delete(tip.id); else list.add(tip.id);
                                      const next = { ...(resourcesData || {}), reviewedTips: Array.from(list) } as Interview['resourcesData'];
                                      setResourcesData(next);
                                      await saveResourcesData(next);
                                    }} />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-3 bg-white dark:bg-[#2b2a2c] rounded-xl p-6 border border-gray-200 dark:border-[#3d3c3e] shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Helpful Resources</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {[
                            { id: 'glassdoor', title: 'Company Glassdoor Reviews', url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`, description: 'Check employee reviews and interview experiences' },
                            { id: 'linkedin', title: 'LinkedIn Company Page', url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, description: 'Research employees and company updates' },
                            { id: 'db', title: 'Interview Question Database', url: `https://www.glassdoor.com/Interview/index.htm`, description: 'Browse thousands of real interview questions' }
                          ].map((resource, index) => (
                            <motion.a key={resource.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start p-5 border border-gray-200 dark:border-[#3d3c3e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#242325]/50 transition-colors hover:shadow-sm"
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="mr-3 mt-0.5 text-jobzai-600 dark:text-jobzai-400">
                                <LinkIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 dark:text-white text-base mb-1">{resource.title}</div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{resource.description}</p>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                        <div className="mt-6 p-4 border-t border-gray-200 dark:border-[#3d3c3e]">
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Your resources</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            {(resourcesData?.savedLinks || []).map(link => (
                              <div key={link.id} className="relative p-4 border border-gray-200 dark:border-[#3d3c3e] rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-[#2b2a2c] group">
                                <button
                                  onClick={async () => {
                                    const updated = { ...(resourcesData || {}), savedLinks: (resourcesData?.savedLinks || []).filter(l => l.id !== link.id) } as Interview['resourcesData'];
                                    setResourcesData(updated);
                                    await saveResourcesData(updated);
                                  }}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-opacity p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-start gap-3 pr-8">
                                  <div className="mt-0.5 text-jobzai-600 dark:text-jobzai-400 flex-shrink-0"><LinkIcon className="w-4 h-4" /></div>
                                  <div className="flex-1 min-w-0">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-800 dark:text-white text-sm hover:text-jobzai-700 dark:hover:text-jobzai-300 block mb-1 truncate" title={link.title}>{link.title}</a>
                                    <div className="text-xs text-gray-500 truncate" title={link.url}>{shortenText(link.url, 40)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(!resourcesData?.savedLinks || resourcesData.savedLinks.length === 0) && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 col-span-full text-center py-4">No custom resources yet. Add one below.</div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} placeholder="Title" className="px-3 py-2 rounded-lg border dark:bg-[#2b2a2c] dark:border-[#3d3c3e]" />
                            <input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} placeholder="https://..." className="px-3 py-2 rounded-lg border dark:bg-[#2b2a2c] dark:border-[#3d3c3e]" />
                            <button onClick={async () => {
                              const t = newResourceTitle.trim();
                              const u = newResourceUrl.trim();
                              if (!t || !u) return;
                              const newLink = { id: uuidv4(), title: t, url: u };
                              const updated = { ...(resourcesData || {}), savedLinks: [...(resourcesData?.savedLinks || []), newLink] } as Interview['resourcesData'];
                              setResourcesData(updated);
                              setNewResourceTitle(''); setNewResourceUrl('');
                              await saveResourcesData(updated);
                            }} className="px-3 py-2 rounded-lg bg-jobzai-600 text-white hover:bg-jobzai-700">Add</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {false && tab === 'chat_old' && (
                    <motion.div
                      key="chat_old"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-200 dark:border-[#3d3c3e] flex flex-col h-[750px] sm:h-[800px] shadow-lg overflow-hidden backdrop-blur-sm"
                    >
                      {/* Compact Header - Apple style */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="px-5 py-3.5 border-b border-gray-200/60 dark:border-[#3d3c3e]/50 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-jobzai-500 to-jobzai-600 flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                            Interview Trainer
                          </h3>
                        </div>
                        {chatMessages.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span>Online</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Chat messages area avec scroll personnalisé */}
                      <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-gradient-to-b from-gray-50/30 via-white to-white dark:from-[#242325]/20 dark:via-[#242325]/10 dark:to-[#242325]/20 scrollbar-thin scrollbar-thumb-jobzai-200 scrollbar-track-transparent relative"
                      >
                        {/* Scroll to bottom button - appears when user scrolls up */}
                        <AnimatePresence>
                          {!isUserNearBottom && chatMessages.length > 2 && (
                            <motion.button
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              onClick={() => {
                                if (chatEndRef.current) {
                                  chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                  setIsUserNearBottom(true);
                                }
                              }}
                              className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 mx-auto px-4 py-2 rounded-full bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-xl border border-gray-200/60 dark:border-[#3d3c3e]/50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-jobzai-600 dark:hover:text-jobzai-400"
                            >
                              <ChevronDown className="w-4 h-4" />
                              <span>New messages</span>
                            </motion.button>
                          )}
                        </AnimatePresence>
                        <style>{`
                        .scrollbar-thin::-webkit-scrollbar {
                          width: 6px;
                        }
                        .scrollbar-thin::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .scrollbar-thin::-webkit-scrollbar-thumb {
                          background: rgba(196, 181, 253, 0.5);
                          border-radius: 10px;
                        }
                        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                          background: rgba(196, 181, 253, 0.8);
                        }
                      `}</style>

                        {chatMessages.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4"
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-jobzai-100 to-jobzai-200 dark:from-jobzai-900/40 dark:to-jobzai-800/40 flex items-center justify-center mb-5 shadow-lg"
                            >
                              <MessageSquare className="w-10 h-10 text-jobzai-500 dark:text-jobzai-400" />
                            </motion.div>
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-center max-w-md font-semibold mb-1.5 text-base text-gray-900 dark:text-white"
                            >
                              Start practicing with your AI trainer
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="text-center text-xs max-w-md mb-6 text-gray-500 dark:text-gray-400"
                            >
                              Get personalized feedback and practice answers
                            </motion.p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                              {(() => {
                                const suggestions = interview?.preparation?.suggestedQuestions && interview.preparation.suggestedQuestions.length > 0
                                  ? [
                                    "How should I introduce myself for this role?",
                                    `What are the most common questions for a ${application?.position || 'this role'}?`,
                                    "How can I highlight my relevant experience?",
                                    "Can you help me practice answering behavioral questions?"
                                  ]
                                  : [
                                    "How should I introduce myself?",
                                    "What are the most common questions for this role?",
                                    "How can I highlight my relevant experience?",
                                    "Can you help me practice answering questions?"
                                  ];

                                return suggestions.map((suggestion, i) => (
                                  <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    whileHover={{
                                      scale: 1.02,
                                      y: -2,
                                      transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setMessage(suggestion);
                                      // Auto-scroll to input after selecting
                                      setTimeout(() => {
                                        const input = document.querySelector('textarea[placeholder*="Ask a question"]') as HTMLTextAreaElement;
                                        input?.focus();
                                      }, 100);
                                    }}
                                    className="text-xs text-left p-3 border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg hover:border-jobzai-300/60 dark:hover:border-jobzai-700/50 hover:bg-jobzai-50/60 dark:hover:bg-jobzai-900/20 transition-all shadow-sm hover:shadow-md backdrop-blur-sm bg-white/50 dark:bg-[#2b2a2c]/50"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-jobzai-100/80 dark:bg-jobzai-900/30 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-3.5 h-3.5 text-jobzai-600 dark:text-jobzai-400" />
                                      </div>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-snug">{suggestion}</span>
                                    </div>
                                  </motion.button>
                                ));
                              })()}
                            </div>
                          </motion.div>
                        ) : (
                          chatMessages.map((msg, index) => {
                            // Handle the special thinking message - Elegant Apple-style indicator
                            if (msg.role === 'assistant' && msg.content === '__thinking__') {
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                  animate={{ opacity: 1, x: 0, scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                    duration: 0.4
                                  }}
                                  className="flex justify-start"
                                >
                                  <div className="flex items-start gap-3 max-w-[70%] sm:max-w-[65%] flex-row">
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-jobzai-500 via-jobzai-500 to-jobzai-600 shadow-md ring-1 ring-jobzai-200/50 dark:ring-jobzai-900/50"
                                    >
                                      <Bot className="w-4 h-4 text-white" />
                                    </motion.div>
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.1 }}
                                      className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 shadow-sm"
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Elegant thinking indicator - Apple style */}
                                        <div className="flex items-center gap-1">
                                          <motion.div
                                            className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-jobzai-400 to-jobzai-500"
                                            animate={{
                                              scale: [1, 1.2, 1],
                                              opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                              duration: 1.2,
                                              repeat: Infinity,
                                              ease: "easeInOut",
                                              delay: 0,
                                            }}
                                          />
                                          <motion.div
                                            className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-jobzai-400 to-jobzai-500"
                                            animate={{
                                              scale: [1, 1.2, 1],
                                              opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                              duration: 1.2,
                                              repeat: Infinity,
                                              ease: "easeInOut",
                                              delay: 0.3,
                                            }}
                                          />
                                          <motion.div
                                            className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-jobzai-400 to-jobzai-500"
                                            animate={{
                                              scale: [1, 1.2, 1],
                                              opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                              duration: 1.2,
                                              repeat: Infinity,
                                              ease: "easeInOut",
                                              delay: 0.6,
                                            }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-tight">
                                          Processing...
                                        </span>
                                      </div>
                                    </motion.div>
                                  </div>
                                </motion.div>
                              );
                            }

                            // Get display content - use typing animation for assistant messages only
                            let displayContent = msg.content;

                            // Format displayContent to handle thinking indicators
                            if (msg.role === 'assistant' && displayContent.includes('<think>')) {
                              displayContent = displayContent.replace(/<think>[\s\S]*<\/think>/g, '');
                            }

                            // Use typing animation ONLY for assistant messages
                            if (msg.role === 'assistant' && msg.content !== '__thinking__') {
                              const fullText = displayContent.replace(/<think>[\s\S]*<\/think>/g, '').trim();
                              // Use typed text if available and animation is in progress, otherwise show full text
                              if (typingMessages[index] !== undefined && typingMessages[index].length < fullText.length) {
                                displayContent = typingMessages[index];
                              } else {
                                displayContent = fullText;
                              }
                            }
                            // For user messages, always show full content immediately

                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                  transition: {
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    duration: 0.5
                                  }
                                }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`
                                flex items-start gap-3 max-w-[75%] sm:max-w-[70%] 
                                ${msg.role === 'user'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'}
                              `}>
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                                    className={`
                                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-1
                                    ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-jobzai-500 via-jobzai-600 to-jobzai-700 ring-jobzai-200/50 dark:ring-jobzai-900/30'
                                        : 'bg-gradient-to-br from-jobzai-500 via-jobzai-500 to-jobzai-600 ring-jobzai-200/50 dark:ring-jobzai-900/30'}
                                  `}
                                  >
                                    {msg.role === 'user'
                                      ? <User className="w-4 h-4 text-white" />
                                      : <Bot className="w-4 h-4 text-white" />}
                                  </motion.div>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.05 }}
                                    className={`
                                    px-4 py-3 rounded-xl shadow-sm backdrop-blur-sm
                                    ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-jobzai-600 to-jobzai-700 text-white rounded-tr-sm'
                                        : 'bg-white/90 dark:bg-[#2b2a2c]/90 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/60 dark:border-[#3d3c3e]/50'}
                                  `}
                                  >
                                    <p className="text-sm leading-6 whitespace-pre-wrap break-words">{displayContent}</p>

                                    {/* Typing cursor for assistant messages that are still typing */}
                                    {msg.role === 'assistant' &&
                                      msg.content !== '__thinking__' &&
                                      typingMessages[index] !== undefined &&
                                      (() => {
                                        const fullText = msg.content.replace(/<think>[\s\S]*<\/think>/g, '').trim();
                                        const typedText = typingMessages[index] || '';
                                        return typedText.length > 0 && typedText.length < fullText.length;
                                      })() && (
                                        <span className="inline-block w-0.5 h-4 bg-jobzai-500 dark:bg-jobzai-400 ml-1 animate-pulse" />
                                      )}

                                    <div className={`text-[10px] mt-2 flex items-center justify-end gap-1
                                    ${msg.role === 'user'
                                        ? 'text-jobzai-200/70'
                                        : 'text-gray-400 dark:text-gray-500'}
                                  `}>
                                      <ClockIcon className="w-3 h-3" />
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input area améliorée - Apple style */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="px-5 sm:px-6 py-4 border-t border-gray-200/60 dark:border-[#3d3c3e]/50 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl relative"
                      >
                        <div className="flex gap-3 items-end">
                          <div className="relative flex-1">
                            <motion.textarea
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                              placeholder="Ask a question or practice an answer..."
                              rows={1}
                              className="w-full p-4 pr-14 text-sm bg-gray-50/80 dark:bg-[#242325]/50 border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-xl focus:ring-2 focus:ring-jobzai-500/50 focus:border-jobzai-500/50 dark:text-white resize-none min-h-[52px] max-h-[140px] transition-all shadow-sm hover:shadow-md focus:shadow-lg leading-5"
                              style={{
                                height: 'auto',
                                overflow: 'hidden'
                              }}
                              disabled={isSending}
                              whileFocus={{ scale: 1.005 }}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={sendMessage}
                              disabled={!message.trim() || isSending}
                              className="absolute right-2.5 bottom-2.5 p-2.5 rounded-lg bg-gradient-to-br from-jobzai-600 to-jobzai-700 text-white hover:from-jobzai-700 hover:to-jobzai-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-md hover:shadow-lg"
                            >
                              {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Enter to send • Shift+Enter for new line</span>
                          </motion.p>
                          {chatMessages.length > 0 && (
                            <button
                              onClick={async () => {
                                if (currentUser && application && interview && applicationId) {
                                  try {
                                    await saveChatHistory([]);
                                    setChatMessages([]);
                                    setMessage('');
                                    notify.success('Chat cleared');
                                  } catch (error) {
                                    notify.error('Failed to clear chat');
                                  }
                                } else {
                                  setChatMessages([]);
                                  setMessage('');
                                }
                              }}
                              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Clear chat</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Interview Whiteboard - Miro-like board - Lazy loaded */}
            <LazySection minHeight="600px" rootMargin="50px">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 hover:shadow-md dark:bg-neutral-900/50 dark:ring-white/[0.05] mb-8"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <StickyNote className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                        Interview Notes
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Visual workspace for your ideas
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const whiteboardElement = document.querySelector('[data-whiteboard-toggle]') as HTMLElement;
                      if (whiteboardElement) {
                        whiteboardElement.click();
                      }
                    }}
                    className="group inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200/50 transition-all duration-200 hover:bg-gray-100 hover:ring-gray-300/50 dark:bg-white/[0.03] dark:text-gray-300 dark:ring-white/[0.05] dark:hover:bg-white/[0.06] dark:hover:ring-white/10"
                    title="Expand whiteboard"
                  >
                    <Maximize2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Expand</span>
                  </button>
                </div>

                {/* Whiteboard Content - Using tldraw */}
                <div className="h-[600px] bg-gray-50/50 dark:bg-neutral-950/30">
                  {applicationId && interviewId && (
                    <TldrawWhiteboard
                      ref={tldrawWhiteboardRef}
                      applicationId={applicationId}
                      interviewId={interviewId}
                      height={600}
                    />
                  )}
                </div>
              </motion.div>
            </LazySection>

            {/* Old sticky notes section - commented out for reference */}
            {false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${isNotesExpanded
                  ? 'fixed inset-4 z-50 bg-white dark:bg-[#2b2a2c] overflow-hidden'
                  : 'bg-white dark:bg-[#2b2a2c] rounded-xl p-6 border border-gray-200 dark:border-[#3d3c3e] shadow-sm mb-8'
                  }`}
              >
                {/* Header with title and buttons */}
                <div className={`flex items-center ${isNotesExpanded ? 'p-6 border-b border-gray-200 dark:border-[#3d3c3e] relative z-[60] bg-white dark:bg-[#2b2a2c]' : 'mb-6'}`}>
                  {/* Left: Title */}
                  <div className="flex-1 flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-amber-500" />
                      Interview Notes
                      {filteredNotes.length !== stickyNotes.length && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({filteredNotes.length}/{stickyNotes.length})
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  {/* Center: Collapse button (only when expanded) */}
                  {isNotesExpanded && (
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={() => setIsNotesExpanded(false)}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors bg-gray-50 dark:bg-[#3d3c3e]/50"
                        title="Collapse"
                      >
                        <Minimize2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Right: Other buttons */}
                  <div className="flex-1 flex items-center justify-end gap-2">
                    {!isNotesExpanded && (
                      <>
                        <select
                          value={filterColor || ''}
                          onChange={(e) => setFilterColor(e.target.value || null)}
                          className="px-3 py-2 border border-gray-300 dark:border-[#4a494b] rounded-lg bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-jobzai-500"
                        >
                          <option value="">All Colors</option>
                          <option value="#ffeb3b">Yellow</option>
                          <option value="#4fc3f7">Blue</option>
                          <option value="#81c784">Green</option>
                          <option value="#ff8a65">Orange</option>
                          <option value="#f48fb1">Pink</option>
                          <option value="#ba68c8">Purple</option>
                        </select>
                        {filterColor && (
                          <button
                            onClick={() => setFilterColor(null)}
                            className="px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                            title="Clear filter"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={createNewNote}
                          className="px-3 py-2 bg-gradient-to-r from-jobzai-500 to-jobzai-600 text-white rounded-lg hover:from-jobzai-600 hover:to-jobzai-700 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          New Note
                        </button>
                        <button
                          onClick={toggleNotesExpanded}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                          title="Expand"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isNotesExpanded ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative h-[calc(100%-80px)] overflow-hidden bg-gray-50 dark:bg-[#242325]/50 flex"
                    >
                      {/* Tools Menu - Left Side */}
                      <div className="relative z-20">
                        <div
                          className="tool-menu h-full bg-white dark:bg-[#2b2a2c] rounded-l-2xl shadow-lg border-r border-gray-200 dark:border-[#3d3c3e] flex flex-col items-center overflow-y-auto"
                          style={{ padding: '8px', gap: '4px' }}
                        >
                          {/* Close button */}
                          <button
                            onClick={() => setIsNotesExpanded(false)}
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4a494b] flex items-center justify-center transition-colors mb-1"
                          >
                            <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                          </button>

                          {/* Essential tools only - most used */}
                          <button
                            onClick={() => {
                              setSelectedTool('select');
                              setShowToolSubmenu(false);
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${selectedTool === 'select'
                              ? 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-600 dark:text-jobzai-400'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'
                              }`}
                            title="Select"
                          >
                            <MousePointer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTool('sticky');
                              setShowToolSubmenu(false);
                              createNewNote();
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${selectedTool === 'sticky'
                              ? 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-600 dark:text-jobzai-400'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'
                              }`}
                            title="New Sticky Note"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTool('pen');
                              setShowToolSubmenu(true);
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${selectedTool === 'pen'
                              ? 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-600 dark:text-jobzai-400'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'
                              }`}
                            title="Draw"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 19l7-7 3 3-7 7-3-3z" />
                              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                              <path d="M2 2l7.586 7.586" />
                              <circle cx="11" cy="11" r="2" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTool('text');
                              setShowToolSubmenu(false);
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${selectedTool === 'text'
                              ? 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-600 dark:text-jobzai-400'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'
                              }`}
                            title="Text"
                          >
                            <span className="text-sm font-bold">T</span>
                          </button>
                        </div>

                        {/* Submenu for pen tool */}
                        {showToolSubmenu && selectedTool === 'pen' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="tool-submenu absolute left-0 top-full mt-2 bg-white dark:bg-[#2b2a2c] rounded-lg shadow-lg border border-gray-200 dark:border-[#3d3c3e] p-2 min-w-[100px] z-50"
                          >
                            <div className="space-y-1.5">
                              {/* Color options */}
                              <div className="space-y-1">
                                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Colors</div>
                                {[
                                  { color: '#3b82f6', name: 'Blue' },
                                  { color: '#ef4444', name: 'Red' },
                                  { color: '#fbbf24', name: 'Yellow' },
                                  { color: '#ec4899', name: 'Pink' },
                                ].map((colorOption, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setDrawingColor(colorOption.color)}
                                    className={`w-full flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors ${drawingColor === colorOption.color ? 'bg-jobzai-50 dark:bg-jobzai-900/20' : ''
                                      }`}
                                  >
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colorOption.color }}></div>
                                    <span className="text-[10px] text-gray-700 dark:text-gray-300">{colorOption.name}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Stroke width */}
                              <div className="pt-1.5 border-t border-gray-200 dark:border-[#3d3c3e]">
                                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Size</div>
                                <div className="space-y-0.5">
                                  {[1, 2, 3].map((width) => (
                                    <button
                                      key={width}
                                      onClick={() => setDrawingStrokeWidth(width)}
                                      className={`w-full flex items-center gap-1.5 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3d3c3e] ${drawingStrokeWidth === width ? 'bg-jobzai-50 dark:bg-jobzai-900/20' : ''
                                        }`}
                                    >
                                      <div className="flex gap-0.5">
                                        {Array(width).fill(0).map((_, i) => (
                                          <div key={i} className="w-0.5 h-3 bg-gray-400 rounded"></div>
                                        ))}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Canvas area */}
                      <div
                        className={`relative flex-1 h-full overflow-hidden ${selectedTool === 'pen' ? 'cursor-crosshair' :
                          selectedTool === 'select' ? 'cursor-default' :
                            selectedTool === 'text' ? 'cursor-text' :
                              'cursor-crosshair'
                          }`}
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      >
                        {/* Visual grid background to show canvas area */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `
                          linear-gradient(to right, rgba(156, 163, 175, 0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(156, 163, 175, 0.1) 1px, transparent 1px)
                        `,
                            backgroundSize: '100px 100px'
                          }}
                        />

                        {/* Canvas info overlay */}
                        <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#2b2a2c]/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2.5 z-50 text-xs border border-gray-200 dark:border-[#3d3c3e]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <div className="text-gray-700 dark:text-gray-300 font-medium">
                                Canvas Active
                              </div>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-[11px]">
                              {CANVAS_MAX_X}×{CANVAS_MAX_Y}px
                            </div>
                            <div className="text-jobzai-600 dark:text-jobzai-400 text-[10px] font-medium">
                              {stickyNotes.length} note{stickyNotes.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {/* Canvas limit warning */}
                        <AnimatePresence>
                          {showCanvasLimitWarning && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-16 right-4 bg-amber-500/90 text-white backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 z-50 text-sm font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Canvas limit reached
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* SVG overlay for drawing */}
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ zIndex: 10 }}
                        >
                          {/* Render all shapes */}
                          {shapes.map((shape) => {
                            if (shape.type === 'pen' && shape.path) {
                              // Render path for pen drawings
                              return (
                                <path
                                  key={shape.id}
                                  d={shape.path}
                                  stroke={shape.color}
                                  strokeWidth={drawingStrokeWidth}
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={selectedShape === shape.id ? 'opacity-80' : ''}
                                />
                              );
                            }
                            if (shape.type === 'line' || shape.type === 'arrow') {
                              const dx = (shape.endX || 0) - shape.startX;
                              const dy = (shape.endY || 0) - shape.startY;
                              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                              return (
                                <g key={shape.id}>
                                  <line
                                    x1={shape.startX}
                                    y1={shape.startY}
                                    x2={shape.endX || shape.startX}
                                    y2={shape.endY || shape.startY}
                                    stroke={shape.color}
                                    strokeWidth={drawingStrokeWidth}
                                    strokeLinecap="round"
                                    className={selectedShape === shape.id ? 'opacity-80' : ''}
                                  />
                                  {shape.type === 'arrow' && (
                                    <polygon
                                      points={`${shape.endX || shape.startX},${shape.endY || shape.startY} ${(shape.endX || shape.startX) - 10},${(shape.endY || shape.startY) - 5} ${(shape.endX || shape.startX) - 10},${(shape.endY || shape.startY) + 5}`}
                                      fill={shape.color}
                                      transform={`rotate(${angle} ${shape.endX || shape.startX} ${shape.endY || shape.startY})`}
                                    />
                                  )}
                                </g>
                              );
                            }
                            if (shape.type === 'rectangle') {
                              return (
                                <rect
                                  key={shape.id}
                                  x={Math.min(shape.startX, shape.endX || shape.startX)}
                                  y={Math.min(shape.startY, shape.endY || shape.startY)}
                                  width={Math.abs((shape.endX || shape.startX) - shape.startX)}
                                  height={Math.abs((shape.endY || shape.startY) - shape.startY)}
                                  stroke={shape.color}
                                  strokeWidth={drawingStrokeWidth}
                                  fill="none"
                                  className={selectedShape === shape.id ? 'opacity-80' : ''}
                                />
                              );
                            }
                            if (shape.type === 'circle') {
                              const radius = Math.sqrt(
                                Math.pow((shape.endX || shape.startX) - shape.startX, 2) +
                                Math.pow((shape.endY || shape.startY) - shape.startY, 2)
                              );
                              return (
                                <circle
                                  key={shape.id}
                                  cx={shape.startX}
                                  cy={shape.startY}
                                  r={radius}
                                  stroke={shape.color}
                                  strokeWidth={drawingStrokeWidth}
                                  fill="none"
                                  className={selectedShape === shape.id ? 'opacity-80' : ''}
                                />
                              );
                            }
                            return null;
                          })}

                          {/* Render current drawing shape */}
                          {drawingShape && (
                            <>
                              {drawingShape.type === 'line' || drawingShape.type === 'arrow' ? (
                                <g>
                                  <line
                                    x1={drawingShape.startX}
                                    y1={drawingShape.startY}
                                    x2={drawingShape.endX || drawingShape.startX}
                                    y2={drawingShape.endY || drawingShape.startY}
                                    stroke={drawingShape.color}
                                    strokeWidth={drawingStrokeWidth}
                                    strokeLinecap="round"
                                  />
                                  {drawingShape.type === 'arrow' && drawingShape.endX && drawingShape.endY && (
                                    <polygon
                                      points={`${drawingShape.endX},${drawingShape.endY} ${drawingShape.endX - 10},${drawingShape.endY - 5} ${drawingShape.endX - 10},${drawingShape.endY + 5}`}
                                      fill={drawingShape.color}
                                    />
                                  )}
                                </g>
                              ) : drawingShape.type === 'rectangle' ? (
                                <rect
                                  x={Math.min(drawingShape.startX, drawingShape.endX || drawingShape.startX)}
                                  y={Math.min(drawingShape.startY, drawingShape.endY || drawingShape.startY)}
                                  width={Math.abs((drawingShape.endX || drawingShape.startX) - drawingShape.startX)}
                                  height={Math.abs((drawingShape.endY || drawingShape.startY) - drawingShape.startY)}
                                  stroke={drawingShape.color}
                                  strokeWidth={drawingStrokeWidth}
                                  fill="none"
                                />
                              ) : drawingShape.type === 'circle' ? (
                                <circle
                                  cx={drawingShape.startX}
                                  cy={drawingShape.startY}
                                  r={Math.sqrt(
                                    Math.pow((drawingShape.endX || drawingShape.startX) - drawingShape.startX, 2) +
                                    Math.pow((drawingShape.endY || drawingShape.startY) - drawingShape.startY, 2)
                                  )}
                                  stroke={drawingShape.color}
                                  strokeWidth={drawingStrokeWidth}
                                  fill="none"
                                />
                              ) : null}
                            </>
                          )}

                          {/* Render current pen path */}
                          {isDrawingPath && drawingPath && (() => {
                            // Use dynamic color based on current dark mode state for preview
                            const isDarkMode = document.documentElement.classList.contains('dark');
                            const isDefaultColor = drawingColor === '#ef4444' || drawingColor === '#ffffff';
                            const previewColor = isDefaultColor
                              ? (isDarkMode ? '#ffffff' : '#ef4444')
                              : drawingColor;
                            return (
                              <path
                                d={drawingPath}
                                stroke={previewColor}
                                strokeWidth={drawingStrokeWidth}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            );
                          })()}
                        </svg>

                        {/* Notes overlay */}
                        {filteredNotes.length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="mb-2">No notes found matching your filter.</p>
                              {filterColor && (
                                <button
                                  onClick={() => setFilterColor(null)}
                                  className="text-jobzai-600 dark:text-jobzai-400 hover:underline"
                                >
                                  Clear filter
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Xwrapper>
                            {filteredNotes.map((note) => {
                              const position = notePositions[note.id] || { x: 0, y: 0 };
                              return (
                                <div
                                  key={note.id}
                                  className={`absolute rounded-lg shadow-lg z-20 transition-all duration-200 ${
                                    isDraggingNote && draggedNoteId === note.id
                                      ? 'cursor-grabbing shadow-2xl scale-105 rotate-1'
                                      : 'hover:shadow-xl'
                                  } ${
                                    isResizing && resizingNoteId === note.id
                                      ? 'ring-2 ring-jobzai-400 ring-offset-2'
                                      : !isDraggingNote && 'hover:scale-[1.02]'
                                    }`}
                                  style={{
                                    backgroundColor: note.color,
                                    width: `${noteSizes[note.id]?.width || note.width || 250}px`,
                                    height: `${noteSizes[note.id]?.height || note.height || 200}px`,
                                    left: `${position.x}px`,
                                    top: `${position.y}px`,
                                    transition: isDraggingNote && draggedNoteId === note.id
                                      ? 'none'
                                      : (isResizing && resizingNoteId === note.id)
                                        ? 'width 0s, height 0s, transform 0.2s'
                                      : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                  onMouseDown={(e) => {
                                    // Don't interfere with drag-handle or resize zones
                                    // Let them handle their own events
                                    const target = e.target as HTMLElement;
                                    const isDragHandle = target.classList.contains('drag-handle') || 
                                                         target.closest('.drag-handle') !== null;
                                    const isResizeZone = target.classList.contains('resize-zone') || 
                                                         target.closest('.resize-zone') !== null;
                                    
                                    // If clicking on drag-handle or resize zone, let them handle it
                                    if (isDragHandle || isResizeZone) {
                                      return; // Don't interfere
                                    }
                                    
                                    // Only cancel drag if clicking on content/other areas
                                    // Cancel any pending drag if clicking elsewhere
                                    if (draggedNoteId === note.id) {
                                      setDraggedNoteId(null);
                                      setDragStartPos(null);
                                      setIsDraggingNote(false);
                                    }
                                    // Cancel potential drag ref if it exists
                                    if (potentialDragRef.current && potentialDragRef.current.noteId === note.id) {
                                      potentialDragRef.current = null;
                                      // Remove any event listeners that might have been added
                                      document.body.style.userSelect = '';
                                      document.body.style.cursor = '';
                                    }
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    openNote(note);
                                  }}
                                >
                                  {/* Drag handle - visible zone at the top for dragging */}
                                  <div
                                    className="drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing z-10 rounded-t-lg transition-all"
                                    style={{ 
                                      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%)',
                                      borderBottom: '1px dashed rgba(0, 0, 0, 0.1)',
                                      pointerEvents: 'auto'
                                    }}
                                    title="Drag from here to move"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      handleNoteDragStart(note.id, e);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  />
                                  {/* Calculate adaptive font sizes */}
                                  {useMemo(() => {
                                    const currentWidth = noteSizes[note.id]?.width || note.width || 250;
                                    const currentHeight = noteSizes[note.id]?.height || note.height || 200;
                                    // Calculate adaptive font size based on note dimensions - larger text
                                    const baseFontSize = Math.max(13, Math.min(28, currentWidth / 11));
                                    const titleFontSize = Math.max(15, Math.min(32, currentWidth / 9));
                                    const scaledPadding = Math.max(12, Math.min(24, currentWidth / 12));

                                    return (
                                      <div 
                                        className="h-full flex flex-col no-drag" 
                                        style={{ padding: `${scaledPadding}px`, pointerEvents: 'auto' }}
                                        onMouseDown={(e) => {
                                          // Prevent drag when clicking on content
                                          e.stopPropagation();
                                          if (draggedNoteId === note.id) {
                                            setDraggedNoteId(null);
                                            setDragStartPos(null);
                                          }
                                        }}
                                      >
                                        <div className="flex justify-between items-start mb-2 flex-shrink-0 no-drag">
                                          <h4
                                            className="font-medium text-gray-800 truncate flex-1 no-drag"
                                            style={{ fontSize: `${titleFontSize}px` }}
                                          >
                                            {note.title || 'Untitled Note'}
                                          </h4>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteNote(note.id);
                                            }}
                                            className="p-1 hover:bg-black/10 rounded-full flex-shrink-0 ml-2 no-drag"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <div
                                          className="note-content text-gray-700 flex-1 overflow-y-auto hover:bg-black/5 rounded p-1 -m-1 transition-colors no-drag"
                                          style={{ fontSize: `${baseFontSize}px`, lineHeight: '1.5' }}
                                          title="Double-click to edit"
                                        >
                                          {note.content}
                                        </div>
                                      </div>
                                    );
                                  }, [noteSizes[note.id]?.width, noteSizes[note.id]?.height, note.width, note.height, note.title, note.content, note.id, isDraggingNote, isResizing, selectedTool])}
                                  
                                  {/* Resize zones - corners */}
                                  {/* Top-left corner */}
                                  <div
                                    className="resize-zone absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'nw', e)}
                                  />
                                  {/* Top-right corner */}
                                  <div
                                    className="resize-zone absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'ne', e)}
                                  />
                                  {/* Bottom-left corner */}
                                  <div
                                    className="resize-zone absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'sw', e)}
                                  />
                                  {/* Bottom-right corner */}
                                  <div
                                    className="resize-zone absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'se', e)}
                                  />
                                  
                                  {/* Resize zones - edges */}
                                  {/* Top edge */}
                                  <div
                                    className="resize-zone absolute top-0 left-4 right-4 h-2 cursor-n-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'n', e)}
                                  />
                                  {/* Bottom edge */}
                                  <div
                                    className="resize-zone absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 's', e)}
                                  />
                                  {/* Left edge */}
                                  <div
                                    className="resize-zone absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'w', e)}
                                  />
                                  {/* Right edge */}
                                  <div
                                    className="resize-zone absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-30"
                                    onMouseDown={(e) => handleResizeStart(note.id, 'e', e)}
                                  />
                                  </div>
                              );
                            })}
                          </Xwrapper>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {filteredNotes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No notes found matching your filter.</p>
                          {filterColor && (
                            <button
                              onClick={() => setFilterColor(null)}
                              className="mt-2 text-jobzai-600 dark:text-jobzai-400 hover:underline"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredNotes.map(note => (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                              className="group relative"
                              style={{ height: '220px' }}
                            >
                              <div
                                className="absolute inset-0 rounded-xl p-4 flex flex-col shadow-md transition-all duration-300 cursor-pointer border border-transparent"
                                style={{ backgroundColor: note.color }}
                                onClick={() => openNote(note)}
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-800 truncate">
                                    {note.title || 'Untitled Note'}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNote(note.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-600 transition-opacity p-1 hover:bg-black/10 rounded-full"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="mt-2 flex-1 overflow-y-auto">
                                  <p className="text-sm text-gray-700">
                                    {note.content}
                                  </p>
                                </div>
                                <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                                  <CalendarDays className="w-3 h-3" />
                                  {new Date(note.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <FocusQuestionModal
            open={Boolean(focusedQuestion)}
            onClose={() => setFocusedQuestion(null)}
            question={
              focusedQuestion
                ? {
                  title: focusedQuestion.text,
                  tags: focusedQuestion.tags,
                  suggestedApproach: focusedQuestion.suggestedApproach ?? null,
                }
                : undefined
            }
          />

          {/* Improved note modal with modern design */}
          <AnimatePresence>
            {isNoteModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsNoteModalOpen(false);
                  }
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 300,
                    duration: 0.3
                  }}
                  className="relative bg-white dark:bg-[#2b2a2c] rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-200/50 dark:border-[#3d3c3e]/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Decorative gradient accent */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{ 
                      background: `linear-gradient(90deg, ${noteColor} 0%, ${noteColor}dd 100%)`,
                      opacity: 0.8
                    }}
                  />
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {activeNote ? 'Edit Note' : 'New Note'}
                    </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeNote ? 'Update your note details' : 'Create a new sticky note'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsNoteModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] p-2 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Give your note a title..."
                        className="w-full p-4 border-2 border-gray-200 dark:border-[#3d3c3e] rounded-xl focus:ring-2 focus:ring-jobzai-500 focus:border-jobzai-500 dark:bg-[#3d3c3e]/50 dark:text-white transition-all duration-200 placeholder:text-gray-400"
                        autoFocus
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write your note content here..."
                        rows={8}
                        className="w-full p-4 border-2 border-gray-200 dark:border-[#3d3c3e] rounded-xl focus:ring-2 focus:ring-jobzai-500 focus:border-jobzai-500 dark:bg-[#3d3c3e]/50 dark:text-white resize-none transition-all duration-200 placeholder:text-gray-400"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { color: '#ffeb3b', name: 'Yellow' },
                          { color: '#4fc3f7', name: 'Blue' },
                          { color: '#aed581', name: 'Green' },
                          { color: '#ff8a65', name: 'Orange' },
                          { color: '#f48fb1', name: 'Pink' },
                          { color: '#b39ddb', name: 'Purple' }
                        ].map(colorOption => (
                          <motion.button
                            key={colorOption.color}
                            onClick={() => setNoteColor(colorOption.color)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-10 h-10 rounded-xl transition-all duration-200 shadow-md ${
                              noteColor === colorOption.color
                                ? 'ring-3 ring-offset-2 ring-jobzai-500 scale-110 shadow-lg'
                                : 'hover:shadow-lg hover:scale-105'
                              }`}
                            style={{ backgroundColor: colorOption.color }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </motion.div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#3d3c3e]">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsNoteModalOpen(false)}
                        className="px-6 py-3 border-2 border-gray-300 dark:border-[#4a494b] rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-all duration-200 text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={saveNote}
                        className="px-6 py-3 bg-gradient-to-r from-jobzai-600 to-jobzai-700 text-white rounded-xl hover:from-jobzai-700 hover:to-jobzai-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Note
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>

      {/* STAR Export Choice Modal */}
      <AnimatePresence>
        {showStarExportModal && pendingStarExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowStarExportModal(false);
              setPendingStarExport(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3
              }}
              className="relative bg-white dark:bg-[#2b2a2c] rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-gray-200/50 dark:border-[#3d3c3e]/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Export STAR Story
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose where to create your STAR story
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowStarExportModal(false);
                    setPendingStarExport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] p-2 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes Panel Option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await exportStoryToNotes(pendingStarExport.skill, pendingStarExport.storyId);
                    setShowStarExportModal(false);
                    setPendingStarExport(null);
                  }}
                  className="p-6 rounded-xl border-2 border-gray-200 dark:border-[#3d3c3e] hover:border-jobzai-500 dark:hover:border-jobzai-500 bg-white dark:bg-[#2b2a2c] transition-all duration-200 text-left group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Notes Panel</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Rich text document in sidebar
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Whiteboard Option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await exportStoryToTldrawWhiteboard(pendingStarExport.skill, pendingStarExport.storyId);
                    setShowStarExportModal(false);
                    setPendingStarExport(null);
                  }}
                  className="p-6 rounded-xl border-2 border-gray-200 dark:border-[#3d3c3e] hover:border-jobzai-500 dark:hover:border-jobzai-500 bg-white dark:bg-[#2b2a2c] transition-all duration-200 text-left group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <LayoutDashboard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Whiteboard</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Advanced whiteboard with shapes
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LiveInterviewSession
        isOpen={isLiveSessionOpen}
        onClose={() => {
          setIsLiveSessionOpen(false);
          setHistorySessionData(null);
        }}
        questions={filteredQuestions}
        jobContext={{
          companyName: application?.companyName || '',
          position: application?.position || '',
          jobDescription: interview?.jobPostContent || '',
          requiredSkills: interview?.preparation?.requiredSkills || []
        }}
        onSessionComplete={handleSessionComplete}
        onGenerateQuestions={generateLiveSessionQuestions}
        companyName={application?.companyName}
        position={application?.position}
        previousSessions={liveSessionHistory}
        historySession={historySessionData || undefined}
      />
    </AuthLayout>
  );
}



