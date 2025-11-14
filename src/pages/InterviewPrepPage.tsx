import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { analyzeJobPost, JobPostAnalysisResult } from '../services/jobPostAnalyzer';
import { queryPerplexity } from '../lib/perplexity';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
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
  Info, PanelLeftClose, TrendingUp, Lightbulb, Target as TargetIcon
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import HeaderCard from '../components/interview/HeaderCard';
import AICard from '../components/interview/AICard';
import TabPills from '../components/interview/TabPills';
import MiniInfoCard from '../components/interview/MiniInfoCard';

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
  };
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

export default function InterviewPrepPage() {
  const { applicationId, interviewId } = useParams<{ applicationId: string, interviewId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'company-profile': true,
    'position-details': true,
    'culture-fit': true
  });
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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [notePositions, setNotePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [noteSizes, setNoteSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingNoteId, setResizingNoteId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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
  const [resourcesData, setResourcesData] = useState<Interview['resourcesData']>({ reviewedTips: [], savedLinks: [] });
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [activeQuestionFilter, setActiveQuestionFilter] = useState<'all' | 'technical' | 'behavioral' | 'company-specific' | 'role-specific'>('all');
  const [showAllChecklistItems, setShowAllChecklistItems] = useState(false);
  const [showAllNewsItems, setShowAllNewsItems] = useState(false);
  const [isJobSummaryOpen, setIsJobSummaryOpen] = useState(false);
  

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
        sentiment: (['positive','neutral','negative'].includes((it.sentiment||'').toLowerCase()) ? (it.sentiment||'').toLowerCase() : 'neutral') as 'positive'|'neutral'|'negative',
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
  const createNoteFromNews = (news: NewsItem) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    const content = `Talking Points for Interview:

${news.title}

${news.summary}

${news.source ? `Source: ${news.source}` : ''}
${news.url ? `Link: ${news.url}` : ''}

Key points to mention:
- ${news.title}
- ${news.summary.split('.')[0]}`;
    
    const newNoteId = uuidv4();
    const newNote: Note = {
      id: newNoteId,
      title: `Talking Points: ${news.title.substring(0, 30)}${news.title.length > 30 ? '...' : ''}`,
      content,
      color: '#4fc3f7',
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
    toast.success('Talking points note created');
  };

  // Filter notes by color
  const filteredNotes = useMemo(() => {
    if (!filterColor) return stickyNotes;
    return stickyNotes.filter(note => note.color === filterColor);
  }, [stickyNotes, filterColor]);
  
  // État pour suivre les questions sauvegardées et celles qui sont réduites/étendues
  const [savedQuestionsState, setSavedQuestionsState] = useState<string[]>([]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !applicationId || !interviewId) {
        toast.error('Missing required information');
        navigate('/applications');
        return;
      }

      try {
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);
        
        if (applicationSnapshot.exists()) {
          const appData = { id: applicationSnapshot.id, ...applicationSnapshot.data() } as JobApplication;
          setApplication(appData);
          
          const interviewData = appData.interviews?.find(interview => interview.id === interviewId);
          if (interviewData) {
            setInterview(interviewData);
            setJobUrl(interviewData.jobPostUrl || appData.url || '');
          } else {
            toast.error('Interview not found');
            navigate('/applications');
          }
        } else {
          toast.error('Application not found');
          navigate('/applications');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, applicationId, interviewId, navigate]);

  useEffect(() => {
    if (interview?.skillRatings) {
      setSkillRatings(interview.skillRatings);
    }
  }, [interview]);

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
    }
  }, [interview]);
  
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
      toast.error('Please enter a job post URL');
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
        toast.error(analysisResult.error);
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
        toast.error('No data was extracted from the job posting. Please try again or check the URL.');
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
        toast.error('Could not find interview to update');
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
      
      toast.success('Job post analyzed successfully! All sections have been updated.');
    } catch (error) {
      console.error('Error analyzing job post:', error);
      toast.error('Failed to analyze job post: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      toast.success(`Interview status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
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
        toast.error('Could not find interview to update');
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
      toast.success('Skill rating updated', { duration: 1500 });
    } catch (error) {
      console.error('Error updating skill rating:', error);
      toast.error('Failed to save skill rating');
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

  const sendMessage = async () => {
    if (!message.trim() || isSending || !currentUser || !application || !interview || !applicationId) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
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
      // Build context for the AI based on the job details
      const context = `
        You are a conversational AI interview coach helping the user prepare for their ${interview.type} interview at ${application.companyName} for the ${application.position} position.

        KEY CONTEXT:
        - Position: ${application.position}
        - Company: ${application.companyName}
        - Required Skills: ${interview.preparation?.requiredSkills?.join(', ') || "Not specified"}
        
        CONVERSATIONAL GUIDELINES:
        - Keep your responses short and concise (2-3 paragraphs max)
        - Start with a brief, casual response before diving into advice
        - Don't dump all information at once - let the conversation flow naturally
        - If the user says "hello" or similar, respond with a brief greeting and ask how you can help
        - Ask follow-up questions to guide the conversation
        - Avoid walls of text - use short paragraphs with one main point each
        
        USER'S CHAT HISTORY (for context only - don't reference this directly):
        ${chatMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}
      `;

      // Query Perplexity API with a single argument
      const response = await queryPerplexity(
        context + "\n\nUser message: " + message
      );

      // Check if the response contains an error
      let aiContent = response.text || "I'm sorry, I couldn't process your request. Please try again later.";
      // Remove <think> tags if present
      aiContent = aiContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      // Remove references like [1], [2], [3], etc.
      aiContent = aiContent.replace(/\[\d+\]/g, '');

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
        toast.error('Failed to save chat history');
      }
      toast.error('Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // Typing animation effect - ChatGPT style
  const prevMessagesLengthRef = useRef(chatMessages.length);
  const animatedMessagesRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);
  const typingIntervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const prevMessagesRef = useRef<ChatMessage[]>([]);
  
  useEffect(() => {
    const isNewMessage = chatMessages.length > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current;
    const previousLength = prevMessagesLengthRef.current;
    isInitialLoadRef.current = false;
    prevMessagesLengthRef.current = chatMessages.length;
    
    // Only process new messages (those added since last render)
    const newMessagesStartIndex = previousLength;
    
    // Check if messages actually changed (not just a re-render)
    const messagesChanged = chatMessages.length !== prevMessagesRef.current.length || 
      chatMessages.some((msg, idx) => {
        const prevMsg = prevMessagesRef.current[idx];
        return !prevMsg || msg.content !== prevMsg.content || msg.role !== prevMsg.role;
      });
    
    if (!messagesChanged && !wasInitialLoad) {
      prevMessagesRef.current = [...chatMessages];
      return; // No actual changes, skip processing
    }
    
    chatMessages.forEach((msg, index) => {
      // Only animate assistant messages that are new
      if (msg.role === 'assistant' && msg.content !== '__thinking__') {
        const fullText = msg.content.replace(/<think>[\s\S]*<\/think>/g, '').trim();
        
        // Check if this message is already fully typed
        if (typingMessages[index] === fullText) {
          return; // Already fully typed
        }
        
        // Only process if this is a new message (added since last render) or if it hasn't been processed yet
        const isNewlyAdded = index >= newMessagesStartIndex;
        
        // If not in typingMessages, handle it
        if (!typingMessages[index] && fullText.length > 0) {
          // Check if this is a new message (last message and we just added a message, not initial load)
          const isLastMessage = index === chatMessages.length - 1;
          
          if (isNewMessage && isLastMessage && !wasInitialLoad && isNewlyAdded && !animatedMessagesRef.current.has(index)) {
            // New message - animate typing
            animatedMessagesRef.current.add(index);
            setTypingMessages(prev => ({ ...prev, [index]: '' }));
            
            // Clear any existing interval for this index
            const existingInterval = typingIntervalsRef.current.get(index);
            if (existingInterval) {
              clearInterval(existingInterval);
            }
            
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
                clearInterval(typingInterval);
                typingIntervalsRef.current.delete(index);
              }
            }, 10); // Adjust speed here (lower = faster)
            
            typingIntervalsRef.current.set(index, typingInterval);
          } else if (!animatedMessagesRef.current.has(index) && (wasInitialLoad || isNewlyAdded)) {
            // Loaded message - show full text immediately
            animatedMessagesRef.current.add(index);
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
        toast.error('Failed to update notes');
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
        
        toast.success('Notes saved successfully');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
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
      
      toast.success(activeNote ? 'Note updated successfully' : 'Note created successfully');
      
      // Close the modal
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    try {
      // Filter out the deleted note
      const updatedNotes = stickyNotes.filter(note => note.id !== noteId);
      
      // Update the sticky notes state
      setStickyNotes(updatedNotes);
      
      // Use our helper function to update the interview
      updateInterviewNotes(updatedNotes);
      
      toast.success('Note deleted successfully');
      
      // If the note modal is open and this note is being edited, close it
      if (isNoteModalOpen && activeNote && activeNote.id === noteId) {
        setIsNoteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const regenerateQuestions = async () => {
    if (!currentUser || !application || !interview || !interview.jobPostUrl || !applicationId) {
      toast.error('No job post URL available for generating new questions');
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
      setRegeneratingMessage("Waiting for AI response...");
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const response = await queryPerplexity(prompt);
      
      if (response) {
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
        const contentFromAPI = response?.choices?.[0]?.message?.content || response?.text || '';
        if (!contentFromAPI) {
          toast.error('Empty response from Perplexity API');
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
            toast.error('Unexpected response format from Perplexity API');
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
                toast.error('Failed to parse questions from API response');
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

          const normalizeAnswers = (answers: any, questions: string[]): {question: string, answer: string}[] => {
            if (!answers) return [];
            if (!Array.isArray(answers)) return [];
            const result: {question: string, answer: string}[] = [];
            
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
          let combinedAnswers: {question: string, answer: string}[] = [];
          
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
              combinedAnswers.push(existingAnswer as {question: string, answer: string});
            }
            // Ne pas créer de réponse générique - on laissera l'affichage gérer le fallback
          });
          
          // S'assurer que chaque question a sa réponse correspondante
          // Améliorer le matching pour éviter les réponses génériques
          const finalAnswers: {question: string, answer: string}[] = [];
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
          const completeAnswers: {question: string, answer: string}[] = [];
          combinedQuestions.forEach((q, idx) => {
            let answer: {question: string, answer: string} | null = null;
            
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
            toast.error('Could not find interview to update');
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
          
          toast.success('New interview questions generated successfully!');
        } catch (parseError) {
          console.error('Error parsing questions JSON:', parseError);
          toast.error('Failed to parse questions from API response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
        }
      } else {
        toast.error('Failed to generate new questions');
      }
    } catch (error) {
      console.error('Error generating new questions:', error);
      toast.error('Failed to generate new questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRegeneratingQuestions(false);
      setRegeneratingProgress(0);
    }
  };

  const handleDragStart = (_e: DraggableEvent, _data: DraggableData) => {
    setIsDragging(true);
    setDragStartTime(Date.now());
  };

  const handleDragStop = (noteId: string, e: DraggableEvent, data: DraggableData) => {
    const dragDuration = Date.now() - dragStartTime;
    setIsDragging(false);
    
    // Si le drag a duré moins de 200ms, c'est considéré comme un clic
    if (dragDuration < 200) {
      return;
    }

    // Update position
    setNotePositions(prev => ({
      ...prev,
      [noteId]: { x: data.x, y: data.y }
    }));

    // Save positions to Firestore
    if (currentUser && application && interview && applicationId) {
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        const updatedNotes = stickyNotes.map(note => ({
          ...note,
          position: note.id === noteId ? { x: data.x, y: data.y } : notePositions[note.id]
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
          toast.error('Failed to save note positions');
        });
      }
    }
  };

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

    // Handle other tools
    setIsDrawingShape(true);
    const newShape: Shape = {
      id: uuidv4(),
      type: selectedTool,
      startX: x,
      startY: y,
      color: drawingColor
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

  const handleCanvasMouseUp = () => {
    // Handle pen tool (free drawing)
    if (isDrawingPath && selectedTool === 'pen' && pathPoints.length > 1) {
      const pathShape: Shape = {
        id: uuidv4(),
        type: 'pen',
        startX: pathPoints[0].x,
        startY: pathPoints[0].y,
        endX: pathPoints[pathPoints.length - 1].x,
        endY: pathPoints[pathPoints.length - 1].y,
        color: drawingColor,
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
  };

  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging || isResizing) return;
    
    const note = stickyNotes.find(note => note.id === noteId);
    if (note) {
      openNote(note);
    }
  };

  // Resize handlers
  const handleResizeStart = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizingNoteId(noteId);
    
    const size = noteSizes[noteId] || { width: 250, height: 200 };
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizingNoteId || !resizeStart) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const minWidth = 200;
    const minHeight = 150;
    const maxWidth = 600;
    const maxHeight = 500;
    
    const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
    const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
    
    setNoteSizes(prev => ({
      ...prev,
      [resizingNoteId]: { width: newWidth, height: newHeight }
    }));
  };

  const handleResizeEnd = () => {
    if (!isResizing || !resizingNoteId || !currentUser || !application || !interview || !applicationId) {
      setIsResizing(false);
      setResizingNoteId(null);
      setResizeStart(null);
      return;
    }
    
    // Save sizes to Firestore
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
      
      setInterview({
        ...interview,
        stickyNotes: updatedNotes
      });
    }
    
    setIsResizing(false);
    setResizingNoteId(null);
    setResizeStart(null);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizingNoteId, resizeStart, stickyNotes, noteSizes, currentUser, application, interview, applicationId]);

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

  // Add a toggle function for expanding/collapsing sections
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Calculate preparation progress
  const getProgressMilestones = () => {
    const requiredSkills = interview?.preparation?.requiredSkills || [];
    const skillsRated = Object.keys(skillRatings).length;
    const skillsComplete = requiredSkills.length > 0 ? skillsRated >= Math.min(Math.ceil(requiredSkills.length * 0.6), requiredSkills.length) : false;
    
    const milestones = [
      {
        id: 'analysis',
        label: 'Job Analysis',
        icon: <Search className="w-4 h-4" />,
        completed: !!interview?.preparation && !!interview?.preparation?.requiredSkills?.length,
        description: 'Analyze job posting',
        action: () => (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
      },
      {
        id: 'skills',
        label: 'Skills Assessment',
        icon: <Briefcase className="w-4 h-4" />,
        completed: skillsComplete,
        description: `Rate at least ${requiredSkills.length > 0 ? Math.ceil(requiredSkills.length * 0.6) : 3} skills (${skillsRated}/${requiredSkills.length || '?'})`,
        action: () => setTab('skills')
      },
      {
        id: 'questions',
        label: 'Questions Review',
        icon: <HelpCircle className="w-4 h-4" />,
        completed: interview?.preparation?.suggestedQuestions ? interview.preparation.suggestedQuestions.length > 0 && savedQuestionsState.length >= 2 : false,
        description: `Save at least 2 questions (${savedQuestionsState.length} saved)`,
        action: () => setTab('questions')
      },
      {
        id: 'resources',
        label: 'Resources',
        icon: <BookOpen className="w-4 h-4" />,
        completed: (resourcesData?.reviewedTips?.length || 0) >= 4 || (resourcesData?.savedLinks?.length || 0) >= 2,
        description: 'Review 4+ tips OR add 2+ resources',
        action: () => setTab('resources')
      },
      {
        id: 'practice',
        label: 'Practice Chat',
        icon: <MessageSquare className="w-4 h-4" />,
        completed: chatMessages.filter(m => m.role === 'user').length >= 3 && chatMessages.filter(m => m.role === 'assistant').length >= 2,
        description: 'Have 3+ exchanges with AI coach',
        action: () => setTab('chat')
      }
    ];
    return milestones;
  };

  useEffect(() => {
    const milestones = getProgressMilestones();
    const completed = milestones.filter(m => m.completed).length;
    const total = milestones.length;
    setPreparationProgress(Math.round((completed / total) * 100));
  }, [interview?.preparation, skillRatings, savedQuestionsState, resourcesData, chatMessages]);

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

  const addStarStory = async (skill: string) => {
    const stories = skillCoach?.starStories?.[skill] || [];
    const nextStories = [...stories, { id: uuidv4(), situation: '', action: '', result: '' }];
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

  const exportStoryToNotes = (skill: string, storyId: string) => {
    const story = (skillCoach?.starStories?.[skill] || []).find(s => s.id === storyId);
    if (!story) return;
    const content = `STAR for ${skill}\n\nSituation: ${story.situation}\nAction: ${story.action}\nResult: ${story.result}`;
    const newNoteId = uuidv4();
    const newNote: Note = {
      id: newNoteId,
      title: `${skill} - STAR story`,
      content,
      color: '#b39ddb',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { x: 50, y: 50 }
    };
    const updatedNotes = [...stickyNotes, newNote];
    setStickyNotes(updatedNotes);
    setNotePositions(prev => ({ ...prev, [newNoteId]: { x: 50, y: 50 } }));
    setNoteSizes(prev => ({ ...prev, [newNoteId]: { width: 250, height: 200 } }));
    updateInterviewNotes(updatedNotes);
    toast.success('STAR story exported to Notes');
  };

  const practiceInChat = (skill: string) => {
    const latestStory = (skillCoach?.starStories?.[skill] || [])[0];
    const basePrompt = `Help me practise a targeted question about ${skill} for ${application?.position} at ${application?.companyName}.`;
    const story = latestStory ? `\nHere is my STAR draft: Situation: ${latestStory.situation}. Action: ${latestStory.action}. Result: ${latestStory.result}. Please critique briefly and ask one follow-up.` : '';
    setTab('chat');
    setMessage(basePrompt + story);
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
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => {});
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
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => {});
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
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => {});
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
        updateDoc(applicationRef, { interviews: updatedInterviews, updatedAt: serverTimestamp() }).catch(() => {});
        setInterview({ ...interview, checklist: updated });
      }
    }
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!application || !interview) {
    return (
      <AuthLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Interview not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The interview you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Applications
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <MotionConfig transition={{ duration: 0.3 }}>
        <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 mb-6"
          >
            <HeaderCard
              companyName={application?.companyName || ''}
              position={application?.position || 'Interview Preparation'}
              location={application?.location}
              interviewType={interview?.type as any}
              status={interview?.status as any}
            />
          </motion.div>

          {/* Top: AI card + side countdown module aligned */}
          <div className="mb-8 flex flex-col md:flex-row gap-6 md:items-stretch">
            <div className="flex-1 min-w-0 flex">
              <AICard
                jobUrl={jobUrl}
                onJobUrlChange={setJobUrl}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyzeJobPost}
                className="w-full h-full"
              />
            </div>
            <div className="w-full md:w-[320px] shrink-0 flex">
              <MiniInfoCard
                date={interview?.date || null}
                time={interview?.time || null}
                type={interview?.type || null}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Loading Overlay - Bird animation for job post analysis */}
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
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, analyzingProgress))}%` }}
                  />
                </div>
                <p className="text-base font-semibold text-white">
                  {analyzingMessage}
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

          {/* Tab navigation */}
          <div className="mb-8">
            <TabPills
              items={[
                { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-4 h-4" /> },
                { id: 'skills', label: 'Skills', icon: <Briefcase className="w-4 h-4" /> },
                { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'chat', label: 'Practice', icon: <MessageSquare className="w-4 h-4" /> }
              ]}
              activeId={tab as any}
              onChange={(id) => setTab(id as any)}
            />
          </div>

          {/* Tab content */}
          <div className="mb-8 relative">
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-10 backdrop-blur-sm rounded-xl flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mb-4 mx-auto"
                  />
                </div>
              </motion.div>
            )}

            {!interview?.preparation ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center shadow-sm"
              >
                <div className="max-w-md mx-auto">
                  <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 
                    rounded-full flex items-center justify-center mb-5">
                    <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Get started with your preparation</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter a job posting URL above and click "Analyze" to get personalized interview preparation guidance.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg text-left mb-2">
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
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* SECTION 1: HERO - Status & Urgency */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl overflow-hidden
                          transition-all duration-500 ease-out
                          hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/20
                          border border-gray-100/50 dark:border-gray-700/50 shadow-sm
                        p-6"
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                        }}
                      >
                        {/* Subtle accent line - Apple style */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/60 to-indigo-500/40" />
                        
                      <div className="w-full">
                        {/* Progress & Next Actions Section */}
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center text-base">
                              <BarChart2 className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                            Preparation Progress
                          </h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{preparationProgress}%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {getProgressMilestones().filter(m => m.completed).length}/5 completed
                        </div>
                          </div>
                        </div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${preparationProgress}%` }}
                              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-full shadow-sm"
                            />
                        </div>
                          
                          {/* Next Actions (All 5 milestones) */}
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Next Actions</div>
                            {getProgressMilestones()
                              .map((milestone) => (
                                <motion.button
                              key={milestone.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                              onClick={milestone.action}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all duration-200 group ${
                                milestone.completed
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                      : 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-md text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform ${
                                  milestone.completed
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-purple-100 dark:bg-purple-900/30'
                                }`}>
                                      <div className="w-3.5 h-3.5">
                                  {milestone.icon}
                            </div>
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                      <div className={`font-medium text-xs text-gray-800 dark:text-gray-200 truncate ${
                                        milestone.completed ? 'text-green-700 dark:text-green-300' : ''
                                  }`}>
                                    {milestone.label}
                            </div>
                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                    {milestone.description}
                          </div>
                            </div>
                          </div>
                              {milestone.completed ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                              )}
                                </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                    </motion.div>

                    {/* SECTION 2: QUICK ACTIONS - Checklist */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                            <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preparation Checklist</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {checklist.filter(c => c.completed).length}/{checklist.length} tasks completed
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Add Task Input */}
                      <div className="flex items-center gap-2 mb-5">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add a new task..."
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 
                              dark:bg-gray-700/50 dark:text-white 
                              focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 
                              transition-all duration-200 placeholder:text-gray-400"
                            onKeyDown={(e) => { if (e.key === 'Enter') addChecklistItem(); }}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                            onClick={addChecklistItem}
                          className="px-4 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-xl 
                            hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
                          >
                            Add
                        </motion.button>
                        </div>
                      
                      {/* Checklist Items (Show max 5, with "View All" option) */}
                      <div className="space-y-2">
                        <AnimatePresence>
                          {(showAllChecklistItems ? checklist : checklist.slice(0, 5)).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`flex items-center p-3 rounded-xl border transition-all ${
                                item.priority 
                                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                                  : item.completed
                                  ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                            >
                                <button 
                                  onClick={() => toggleChecklistItem(item.id)}
                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all mr-3 ${
                                    item.completed 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500'
                                  }`}
                                >
                                  {item.completed && <Check className="w-3 h-3" />}
                                </button>
                                <input
                                  value={item.task}
                                  onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                className={`flex-1 bg-transparent outline-none text-sm ${
                                  item.completed 
                                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                                    : 'text-gray-800 dark:text-gray-200'
                                }`}
                              />
                              <div className="flex items-center gap-2 ml-2">
                              <button 
                                onClick={() => setTab(item.section)} 
                                  className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                    rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                Go
                              </button>
                                <button
                                  onClick={() => deleteChecklistItem(item.id)}
                                  className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 
                                    rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
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
                            className="text-center pt-2"
                          >
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowAllChecklistItems(!showAllChecklistItems)}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium 
                                flex items-center justify-center gap-1 mx-auto transition-colors"
                            >
                              {showAllChecklistItems ? (
                                <>
                                  <ChevronDown className="w-3 h-3 rotate-180" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  View all {checklist.length} tasks
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                        </div>
                    </motion.div>

                    {/* SECTION 3: KEY POINTS TO EMPHASIZE */}
                    <div className="w-full">
                      {/* Key Points to Emphasize (Full Width) */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                            <Flag className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Points to Emphasize</h3>
                    </div>

                        {interview?.preparation?.keyPoints && interview.preparation.keyPoints.length > 0 ? (
                          <div className="space-y-2.5">
                            {interview.preparation.keyPoints.slice(0, 5).map((point, index) => (
                              <motion.div 
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 + index * 0.05 }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 
                                  dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800"
                              >
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{point}</span>
                              </motion.div>
                            ))}
                            {interview.preparation.keyPoints.length > 5 && (
                              <div className="text-center pt-2">
                                <button className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                                  View all {interview.preparation.keyPoints.length} points →
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 text-center border border-dashed border-gray-200 dark:border-gray-700">
                            <Flag className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              No key points available yet. Run the job post analysis to generate key points.
                            </p>
                            <button
                              onClick={() => (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center justify-center mx-auto"
                            >
                              <ArrowUp className="w-3 h-3 mr-1.5" />
                              Analyze a Job Posting
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* SECTION 4: DEEP DIVE - Accordéons */}
                    <div className="space-y-4">
                      {/* Company Profile Accordion */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div 
                          className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                            border-b border-blue-100 dark:border-blue-800/30 flex justify-between items-center cursor-pointer
                            hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30
                            transition-all duration-200"
                          onClick={() => toggleSection('company-profile')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Company Profile</h3>
                            {interview?.preparation?.companyInfo && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                Available
                              </span>
                            )}
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections['company-profile'] ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        <AnimatePresence>
                        {expandedSections['company-profile'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="p-6">
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                              <p>
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded mr-2 font-medium">KEY</span>
                                {interview?.preparation?.companyInfo?.split('.')[0] || `${application.companyName} is a leading company in its industry.`}
                              </p>
                              
                              {interview?.preparation?.companyInfo ? (
                                    <p className="leading-relaxed">{interview.preparation.companyInfo.split('.').slice(1, 3).join('.')}</p>
                                  ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">No additional company information available. Run the job post analysis to generate company information.</p>
                                  )}
                                  
                                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-l-4 border-blue-500 dark:border-blue-700">
                                    <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Focus points:</div>
                                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-700 dark:text-gray-300">
                                  <li>Research their mission and values</li>
                                  <li>Review recent company achievements</li>
                                  <li>Understand their market position</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Position Details Accordion */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div 
                          className="px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 
                            border-b border-purple-100 dark:border-purple-800/30 flex justify-between items-center cursor-pointer
                            hover:bg-gradient-to-r hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30
                            transition-all duration-200"
                          onClick={() => toggleSection('position-details')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Position Details</h3>
                            {interview?.preparation?.positionDetails && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                Available
                              </span>
                            )}
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections['position-details'] ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        <AnimatePresence>
                        {expandedSections['position-details'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="p-6">
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                              <p>
                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded mr-2 font-medium">KEY</span>
                                {interview?.preparation?.positionDetails?.split('.')[0] || `The ${application.position} role involves key responsibilities in the organization.`}
                              </p>
                              
                              {interview?.preparation?.positionDetails ? (
                                    <p className="leading-relaxed">{interview.preparation.positionDetails.split('.').slice(1, 3).join('.')}</p>
                              ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">No detailed position information available. Run the job post analysis to generate position details.</p>
                              )}
                              
                                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-l-4 border-purple-500 dark:border-purple-700">
                                    <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Required skills:</div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {interview?.preparation?.requiredSkills ? (
                                    interview.preparation.requiredSkills.map((skill, index) => (
                                          <span 
                                        key={index} 
                                            className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-medium"
                                      >
                                        {skill}
                                          </span>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">No skills information available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    {/* SECTION 5: NEWS & UPDATES */}
                    {interview?.preparation && (
                            <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex justify-between items-center mb-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                              <Newspaper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Updates</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest news and announcements</p>
                        </div>
                    </div>
                          <div className="flex items-center gap-2">
                            {isNewsLoading && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading…
                              </div>
                            )}
                            {newsError && (
                              <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { fetchCompanyNews(); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 
                                text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3 inline mr-1" />
                              Refresh
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {newsItems.length === 0 && !isNewsLoading && !newsError && (
                            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                              <Newspaper className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                              No company updates yet.
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
                                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                  hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  news.sentiment === 'positive' ? 'bg-green-500' : 
                                  news.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></span>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 leading-snug">{news.title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <span>{news.date}</span>
                                    {news.source && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center">
                                          <Newspaper className="w-3 h-3 mr-1" />
                                          {news.source}
                                        </span>
                                      </>
                                    )}
                              </div>
                                </div>
                              </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 pl-5 mb-3 leading-relaxed line-clamp-2">{news.summary}</p>
                                <div className="flex items-center justify-between pl-5">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  onClick={() => createNoteFromNews(news)}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 
                                      font-medium flex items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1.5" />
                                    Talking points
                                  </motion.button>
                                {news.url && (
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                                        flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                      <ExternalLink className="w-3 h-3 mr-1.5" />
                                    Read more
                                  </a>
                                )}
                              </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {newsItems.length > 3 && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center pt-2"
                            >
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAllNewsItems(!showAllNewsItems)}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium 
                                  flex items-center justify-center gap-1 mx-auto transition-colors"
                              >
                                {showAllNewsItems ? (
                                  <>
                                    <ChevronDown className="w-3 h-3 rotate-180" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    View all {newsItems.length} updates
                                    <ArrowRight className="w-3 h-3" />
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
                {tab === 'questions' && (
                  <motion.div
                    key="questions"
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
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
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
                    
                    {/* Responsive header section */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                          <span>Interview Questions</span>
                          {interview.preparation?.suggestedQuestions && !isRegeneratingQuestions && (() => {
                            const allQuestions = interview.preparation.suggestedQuestions || [];
                            const validQuestions = allQuestions.filter(q => {
                              if (typeof q !== 'string') return false;
                              return !q.trim().match(/^["']?\w+["']?\s*:\s*[\[{]/);
                            });
                            
                            const filteredCount = activeQuestionFilter === 'all' 
                              ? validQuestions.length
                              : validQuestions.filter(question => {
                                  const cleaned = typeof question === 'string' 
                                    ? question.replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                               .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                                               .replace(/["']\s*,\s*$/g, '')
                                               .replace(/,\s*$/g, '')
                                               .replace(/["']?\s*\]\s*,?\s*$/g, '')
                                               .replace(/["']?\s*\}\s*,?\s*$/g, '')
                                               .replace(/^["']?/g, '')
                                               .replace(/["']?$/g, '')
                                               .trim()
                                    : '';
                                  
                                  if (!cleaned || cleaned.length < 10) return false;
                                  
                                  const tags = getQuestionTags(cleaned);
                                  return tags.includes(activeQuestionFilter);
                                }).length;
                            
                            return (
                              <span className="text-xs sm:text-sm font-normal bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                {filteredCount} {filteredCount === 1 ? 'question' : 'questions'}
                                {activeQuestionFilter !== 'all' && filteredCount < validQuestions.length && (
                                  <span className="text-purple-500 dark:text-purple-300"> / {validQuestions.length}</span>
                                )}
                              </span>
                            );
                          })()}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Personalized questions for your {application.position} interview
                        </p>
                      </div>
                      
                      {interview.preparation?.suggestedQuestions && interview.preparation.suggestedQuestions.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={regenerateQuestions}
                          disabled={isRegeneratingQuestions}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                        >
                          {isRegeneratingQuestions ? (
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span>{isRegeneratingQuestions ? "Generating..." : "Generate New Questions"}</span>
                        </motion.button>
                      )}
                    </div>
                    
                    {/* Question filters - responsive scrolling */}
                    <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                      {([
                        { id: 'all', label: 'All Questions' },
                        { id: 'technical', label: 'Technical' },
                        { id: 'behavioral', label: 'Behavioral' },
                        { id: 'company-specific', label: 'Company Specific' },
                        { id: 'role-specific', label: 'Role Specific' }
                      ] as const).map((filter) => {
                        const isActive = activeQuestionFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            onClick={() => setActiveQuestionFilter(filter.id as typeof activeQuestionFilter)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                              isActive
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-sm font-medium'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Add custom CSS for scrollbar styling */}
                    <style>{`
                      .scrollbar-none::-webkit-scrollbar {
                        display: none;
                      }
                      .scrollbar-none {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `}</style>
                    
                    {/* Questions with Mind Maps - Masqués pendant la régénération */}
                    {!isRegeneratingQuestions && interview.preparation?.suggestedQuestions
                      ?.filter(q => {
                        // Filtrer les éléments invalides comme "questions": [
                        if (typeof q !== 'string') return false;
                        return !q.trim().match(/^["']?\w+["']?\s*:\s*[\[{]/);
                      })
                      ?.filter(question => {
                        // Filter by active filter
                        if (activeQuestionFilter === 'all') return true;
                        
                        // Clean the question for tag detection
                        const cleaned = typeof question === 'string' 
                          ? question.replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                     .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                                     .replace(/["']\s*,\s*$/g, '')
                                     .replace(/,\s*$/g, '')
                                     .replace(/["']?\s*\]\s*,?\s*$/g, '')
                                     .replace(/["']?\s*\}\s*,?\s*$/g, '')
                                     .replace(/^["']?/g, '')
                                     .replace(/["']?$/g, '')
                                     .trim()
                          : '';
                        
                        if (!cleaned || cleaned.length < 10) return false;
                        
                        // Get tags for this question
                        const tags = getQuestionTags(cleaned);
                        
                        // Check if question matches the active filter
                        return tags.includes(activeQuestionFilter);
                      })
                      ?.map((question, index) => {
                        // Nettoyer la question pour vérifier qu'elle est valide
                        const cleaned = typeof question === 'string' 
                          ? question.replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                     .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                                     .replace(/["']\s*,\s*$/g, '')
                                     .replace(/,\s*$/g, '')
                                     .replace(/["']?\s*\]\s*,?\s*$/g, '')
                                     .replace(/["']?\s*\}\s*,?\s*$/g, '')
                                     .replace(/^["']?/g, '')
                                     .replace(/["']?$/g, '')
                                     .trim()
                          : '';
                        if (!cleaned || cleaned.length < 10 || cleaned === 'question' || cleaned === 'questions') {
                          return null;
                        }
                        return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow mb-6"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold flex-shrink-0 text-sm sm:text-base">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white leading-tight">
                          {(() => {
                            if (typeof question !== 'string') return 'Invalid question';
                            
                            // Filtrer les éléments invalides comme "questions": [
                            if (question.trim().match(/^["']?\w+["']?\s*:\s*[\[{]/)) {
                              return null; // Ne pas afficher ce type d'élément
                            }
                            
                            // Nettoyer les préfixes JSON et séparer question/answer si mélangés
                            let cleaned = question
                              .replace(/^["']?question["']?\s*:\s*["']?/i, '')
                              .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
                              .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                              // Enlever les séparateurs JSON au milieu comme ", "answer": "
                              .replace(/["']?\s*,\s*["']?answer["']?\s*:\s*["']?.*?$/gi, '')
                              .replace(/["']?\s*,\s*["']?question["']?\s*:\s*["']?.*?$/gi, '')
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
                            if (cleaned && cleaned !== 'question' && cleaned !== 'answer' && cleaned !== 'questions' && cleaned.length > 10) {
                              return cleaned;
                            }
                            return 'Invalid question';
                          })()}
                              </h3>
                              <button 
                                onClick={() => setCollapsedQuestions(prev => ({
                                  ...prev,
                                  [index]: !prev[index]
                                }))}
                                className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0 mt-0.5"
                                aria-label={collapsedQuestions[index] ? "Expand question" : "Collapse question"}
                              >
                                <ChevronDown 
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                                    collapsedQuestions[index] ? "" : "transform rotate-180"
                                  }`} 
                                />
                              </button>
                            </div>
                            
                            {/* Question Tags */}
                            {(() => {
                              const questionText = typeof question === 'string' 
                                ? question.replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                           .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                                           .replace(/["']\s*,\s*$/g, '')
                                           .replace(/,\s*$/g, '')
                                           .replace(/["']?\s*\]\s*,?\s*$/g, '')
                                           .replace(/["']?\s*\}\s*,?\s*$/g, '')
                                           .replace(/^["']?/g, '')
                                           .replace(/["']?$/g, '')
                                           .trim()
                                : '';
                              
                              if (!questionText || questionText.length < 10) return null;
                              
                              const tags = getQuestionTags(questionText);
                              if (tags.length === 0) return null;
                              
                              const tagLabels: Record<string, string> = {
                                'technical': 'Technical',
                                'behavioral': 'Behavioral',
                                'company-specific': 'Company Specific',
                                'role-specific': 'Role Specific'
                              };
                              
                              return (
                                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                                  {tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                                    >
                                      {tagLabels[tag]}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                            
                            {/* Contenu déroulant - caché lorsque la question est réduite */}
                            <AnimatePresence>
                              {!collapsedQuestions[index] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {/* Suggested Answer Approach - Only show if we have an answer */}
                                  {(() => {
                                        // Fonction pour nettoyer les chaînes
                                        const cleanAnswer = (str: string): string => {
                                          if (!str || typeof str !== 'string') return '';
                                          return str
                                            .trim()
                                            .replace(/^["']?answer["']?\s*:\s*["']?/i, '')
                                            .replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                            // Enlever les virgules à la fin
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
                                            // Enlever les crochets/parenthèses non fermés
                                            .replace(/^\[+\s*/, '')
                                            .replace(/^\{+\s*/, '')
                                            .replace(/^\(+\s*/, '')
                                            .replace(/\s*\[+$/, '')
                                            .replace(/\s*\{+$/, '')
                                            .replace(/\s*\(+$/, '')
                                            // Enlever les parenthèses non fermées (sans fermeture correspondante)
                                            .replace(/^\(([^)]*)$/, '$1') // Enlever parenthèse ouverte au début si pas de fermeture
                                            .replace(/^([^(]*)\)$/, '$1') // Enlever parenthèse fermée à la fin si pas d'ouverture
                                            .trim();
                                        };

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
                                        
                                        // Nettoyer la question pour le matching
                                        const cleanedQuestion = typeof question === 'string' ? normalizeForMatch(question) : '';
                                        let answerText = '';
                                        
                                        // Chercher d'abord par index direct (ordre correspondant)
                                        if (interview.preparation?.suggestedAnswers && interview.preparation.suggestedAnswers.length > index) {
                                          const answerByIndex = interview.preparation.suggestedAnswers[index];
                                          if (typeof answerByIndex === 'object' && 'answer' in answerByIndex) {
                                            const cleaned = cleanAnswer(String(answerByIndex.answer));
                                            if (cleaned && cleaned.length > 10) {
                                              // Vérifier que la réponse n'est pas trop générique
                                              const answerLower = cleaned.toLowerCase();
                                              // Ne filtrer que les réponses vraiment génériques (juste "use STAR method" sans contexte)
                                              const isTooGeneric = (answerLower.includes('structure your answer using the star method') && answerLower.length < 100) ||
                                                                 (answerLower === 'use the star method' || answerLower === 'use star method') ||
                                                                 (answerLower.includes('prepare a specific answer for this question') && answerLower.length < 150);
                                              
                                              if (!isTooGeneric) {
                                                answerText = cleaned;
                                              }
                                            }
                                          }
                                        }
                                        
                                        // Si pas trouvé par index, chercher par matching exact de la question
                                        if (!answerText && cleanedQuestion && interview.preparation?.suggestedAnswers) {
                                          let matchingAnswer = interview.preparation.suggestedAnswers.find((a: any) => {
                                            if (typeof a !== 'object' || !('question' in a) || !('answer' in a)) return false;
                                            const aQuestion = normalizeForMatch(String(a.question));
                                            return aQuestion === cleanedQuestion;
                                          });
                                          
                                          // Si pas trouvé, chercher une correspondance partielle avec similarité élevée (au moins 60%)
                                          if (!matchingAnswer) {
                                            matchingAnswer = interview.preparation.suggestedAnswers.find((a: any) => {
                                              if (typeof a !== 'object' || !('question' in a) || !('answer' in a)) return false;
                                              const aQuestion = normalizeForMatch(String(a.question));
                                              const similarity = Math.min(aQuestion.length, cleanedQuestion.length) / Math.max(aQuestion.length, cleanedQuestion.length);
                                              return (aQuestion.includes(cleanedQuestion) || cleanedQuestion.includes(aQuestion)) &&
                                                     similarity > 0.6;
                                            });
                                          }
                                          
                                          // Si une réponse correspondante est trouvée, l'utiliser
                                          if (matchingAnswer && typeof matchingAnswer === 'object' && 'answer' in matchingAnswer) {
                                            const cleaned = cleanAnswer(String(matchingAnswer.answer));
                                            if (cleaned && cleaned.length > 10) {
                                              // Vérifier que la réponse n'est pas trop générique
                                              const answerLower = cleaned.toLowerCase();
                                              // Ne filtrer que les réponses vraiment génériques
                                              const isTooGeneric = (answerLower.includes('structure your answer using the star method') && answerLower.length < 100) ||
                                                                 (answerLower === 'use the star method' || answerLower === 'use star method') ||
                                                                 (answerLower.includes('prepare a specific answer for this question') && answerLower.length < 150);
                                              
                                              if (!isTooGeneric) {
                                                answerText = cleaned;
                                              }
                                            }
                                          }
                                        }
                                        
                                        // Si on a une réponse, afficher la section
                                        if (answerText && answerText.length > 10) {
                                          return (
                                            <>
                                              <div className="mt-3 sm:mt-5 border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                                                <h4 className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-3 sm:mb-4">
                                                  Suggested Answer Approach
                                                </h4>
                                                
                                                {/* Answer Content - Primary focus on specific answer */}
                                                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 sm:p-6">
                                                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                                    {answerText}
                                                  </p>
                                                </div>
                                              </div>
                                            </>
                                          );
                                        }
                                        
                                        // Si pas de réponse, ne rien afficher
                                        return null;
                                      })()}
                                  
                                  {/* Interaction buttons - Mobile friendly */}
                                  <div className="flex justify-between items-center mt-3 sm:mt-4">
                                    <div className="flex gap-1.5 sm:gap-2">
                                      <button 
                                        onClick={() => {
                                          // Définir la question comme sauvegardée
                                          const savedQuestions: string[] = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
                                          if (!savedQuestions.includes(question)) {
                                            savedQuestions.push(question);
                                            localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
                                            setSavedQuestionsState(savedQuestions);
                                            toast.success('Question saved');
                                          } else {
                                            // Si la question est déjà sauvegardée, la retirer
                                            const updatedSavedQuestions = savedQuestions.filter(q => q !== question);
                                            localStorage.setItem('savedQuestions', JSON.stringify(updatedSavedQuestions));
                                            setSavedQuestionsState(updatedSavedQuestions);
                                            toast.info('Question removed from saved list');
                                          }
                                        }}
                                        className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1 transition-colors
                                          ${savedQuestionsState.includes(question) 
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/30 font-medium' 
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                          }`}
                                        aria-label={savedQuestionsState.includes(question) ? "Unsave question" : "Save question"}
                                      >
                                        <Bookmark className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${savedQuestionsState.includes(question) ? 'fill-current' : ''}`} />
                                        <span>{savedQuestionsState.includes(question) ? 'Saved' : 'Save'}</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          // Créer une nouvelle note avec la question
                                          const newNoteId = uuidv4();
                                          const newNote: Note = {
                                            id: newNoteId,
                                            title: `Interview Question ${index + 1}`,
                                            content: question,
                                            color: '#f48fb1', // Rose pour les questions d'entretien
                                            createdAt: Date.now(),
                                            updatedAt: Date.now(),
                                            position: { x: 50, y: 50 }
                                          };
                                          
                                          // Ajouter la note à la liste des notes
                                          const updatedNotes = [...stickyNotes, newNote];
                                          setStickyNotes(updatedNotes);
                                          
                                          // Positionner la note
                                          setNotePositions(prev => ({
                                            ...prev,
                                            [newNoteId]: { x: 50, y: 50 }
                                          }));
                                          
                                          // Initialiser la taille de la note
                                          setNoteSizes(prev => ({
                                            ...prev,
                                            [newNoteId]: { width: 250, height: 200 }
                                          }));
                                          
                                          // Mettre à jour l'entretien avec la nouvelle note
                                          updateInterviewNotes(updatedNotes);
                                          
                                          toast.success('Note created from question');
                                        }}
                                        className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-800 px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        aria-label="Create note from question"
                                      >
                                        <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span>Notes</span>
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                        );
                      })
                      .filter(Boolean)}
                    
                    {!isRegeneratingQuestions && (() => {
                      const allQuestions = interview.preparation?.suggestedQuestions || [];
                      const validQuestions = allQuestions.filter(q => {
                        if (typeof q !== 'string') return false;
                        return !q.trim().match(/^["']?\w+["']?\s*:\s*[\[{]/);
                      });
                      
                      const filteredQuestions = validQuestions.filter(question => {
                        if (activeQuestionFilter === 'all') return true;
                        
                        const cleaned = typeof question === 'string' 
                          ? question.replace(/^["']?question["']?\s*:\s*["']?/i, '')
                                     .replace(/^["']?questions["']?\s*:\s*["']?/i, '')
                                     .replace(/["']\s*,\s*$/g, '')
                                     .replace(/,\s*$/g, '')
                                     .replace(/["']?\s*\]\s*,?\s*$/g, '')
                                     .replace(/["']?\s*\}\s*,?\s*$/g, '')
                                     .replace(/^["']?/g, '')
                                     .replace(/["']?$/g, '')
                                     .trim()
                          : '';
                        
                        if (!cleaned || cleaned.length < 10) return false;
                        
                        const tags = getQuestionTags(cleaned);
                        return tags.includes(activeQuestionFilter);
                      });
                      
                      if (validQuestions.length === 0) {
                        return (
                          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">
                              No suggested questions available
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 px-4">
                              Analyze a job posting to get AI-generated interview questions
                            </p>
                          </div>
                        );
                      }
                      
                      if (filteredQuestions.length === 0 && activeQuestionFilter !== 'all') {
                        const filterLabels: Record<string, string> = {
                          'technical': 'Technical',
                          'behavioral': 'Behavioral',
                          'company-specific': 'Company Specific',
                          'role-specific': 'Role Specific'
                        };
                        
                        return (
                          <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">
                              No {filterLabels[activeQuestionFilter]} questions found
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 px-4">
                              Try selecting a different filter or click "All Questions" to see all available questions
                            </p>
                            <button
                              onClick={() => setActiveQuestionFilter('all')}
                              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              Show All Questions
                            </button>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </motion.div>
                )}
                
                {tab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                              className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md"
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
                                              ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-md scale-105 ring-2 ring-purple-300 dark:ring-purple-700'
                                              : 'bg-purple-400 dark:bg-purple-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
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
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                                  >
                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                      {currentRating}/5
                                    </span>
                                    <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline">
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
                                  className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
                                >
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
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
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                            className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md"
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
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                      {rating}/5
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                    <span className="text-xs text-purple-600 dark:text-purple-400">
                                      Gap {gap}
                                    </span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => practiceInChat(skill)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Practise in Chat</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* 30-minute plan */}
                            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">30‑minute plan</h5>
                              </div>
                              <div className="space-y-2.5">
                                {(ensureDefaultTasks(skill)).map(t => (
                                  <label
                                    key={t.id}
                                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group/item"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={t.done}
                                      onChange={() => toggleMicroTask(skill, t.id)}
                                      className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
                                    />
                                    <span className={`text-sm text-gray-700 dark:text-gray-300 flex-1 ${
                                      t.done ? 'line-through text-gray-400 dark:text-gray-500' : ''
                                    }`}>
                                      {t.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            {/* STAR stories */}
                            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-3">
                                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">STAR stories</h5>
                              </div>
                              <div className="space-y-3">
                                {(skillCoach?.starStories?.[skill] || []).map(story => (
                                  <div key={story.id} className="space-y-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                      <textarea
                                        rows={3}
                                        value={story.situation}
                                        onChange={(e) => updateStarField(skill, story.id, 'situation', e.target.value)}
                                        placeholder="Situation (context, stakes, constraints)"
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                      <textarea
                                        rows={3}
                                        value={story.action}
                                        onChange={(e) => updateStarField(skill, story.id, 'action', e.target.value)}
                                        placeholder="Action (what you did, how, tools)"
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                      <textarea
                                        rows={3}
                                        value={story.result}
                                        onChange={(e) => updateStarField(skill, story.id, 'result', e.target.value)}
                                        placeholder="Result (impact, metrics, lessons)"
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => exportStoryToNotes(skill, story.id)}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
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
                                  className="w-full text-sm px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium border border-gray-200 dark:border-gray-600 border-dashed"
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Preparation Tips</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { id: 'research', title: 'Research the Company', description: 'Look up their mission, values, recent news, and products/services.', icon: <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
                          { id: 'star', title: 'Prepare Your STAR Stories', description: 'Create specific examples using the Situation, Task, Action, Result format.', icon: <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
                          { id: 'practice', title: 'Practice Your Responses', description: 'Rehearse answers to common questions aloud or with a friend.', icon: <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
                          { id: 'ask', title: 'Prepare Questions to Ask', description: 'Have thoughtful questions ready about the role, team, and company.', icon: <BookmarkPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
                          { id: 'jd', title: 'Review Job Description', description: 'Align your talking points with the skills and qualifications listed.', icon: <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
                          { id: 'presentation', title: 'Plan Your Presentation', description: 'Prepare what to wear, test your tech for virtual interviews, plan your route.', icon: <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> }
                        ].map((tip, index) => {
                          const checked = resourcesData?.reviewedTips?.includes(tip.id);
                          return (
                            <motion.div key={tip.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                              className={`p-5 rounded-xl shadow-sm border ${checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'}`}
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
                                  <input type="checkbox" checked={!!checked} onChange={async ()=>{
                                    const list = new Set(resourcesData?.reviewedTips || []);
                                    if (checked) list.delete(tip.id); else list.add(tip.id);
                                    const next = { ...(resourcesData||{}), reviewedTips: Array.from(list) } as Interview['resourcesData'];
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
                    
                    <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Helpful Resources</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {[
                          { id:'glassdoor', title: 'Company Glassdoor Reviews', url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`, description: 'Check employee reviews and interview experiences' },
                          { id:'linkedin', title: 'LinkedIn Company Page', url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, description: 'Research employees and company updates' },
                          { id:'db', title: 'Interview Question Database', url: `https://www.glassdoor.com/Interview/index.htm`, description: 'Browse thousands of real interview questions' }
                        ].map((resource, index) => (
                            <motion.a key={resource.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                              className="flex items-start p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors hover:shadow-sm"
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                              <div className="mr-3 mt-0.5 text-purple-600 dark:text-purple-400">
                              <LinkIcon className="w-5 h-5" />
                            </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 dark:text-white text-base mb-1">{resource.title}</div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{resource.description}</p>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                      <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Your resources</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                          {(resourcesData?.savedLinks||[]).map(link => (
                            <div key={link.id} className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group">
                              <button 
                                onClick={async ()=>{
                                  const updated = { ...(resourcesData||{}), savedLinks: (resourcesData?.savedLinks||[]).filter(l => l.id !== link.id) } as Interview['resourcesData'];
                                  setResourcesData(updated);
                                  await saveResourcesData(updated);
                                }} 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-opacity p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="flex items-start gap-3 pr-8">
                                <div className="mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0"><LinkIcon className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0">
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-800 dark:text-white text-sm hover:text-purple-700 dark:hover:text-purple-300 block mb-1 truncate" title={link.title}>{link.title}</a>
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
                          <input value={newResourceTitle} onChange={(e)=>setNewResourceTitle(e.target.value)} placeholder="Title" className="px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                          <input value={newResourceUrl} onChange={(e)=>setNewResourceUrl(e.target.value)} placeholder="https://..." className="px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"/>
                          <button onClick={async ()=>{
                            const t = newResourceTitle.trim();
                            const u = newResourceUrl.trim();
                            if (!t || !u) return;
                            const newLink = { id: uuidv4(), title: t, url: u };
                            const updated = { ...(resourcesData||{}), savedLinks: [ ...(resourcesData?.savedLinks || []), newLink ] } as Interview['resourcesData'];
                            setResourcesData(updated);
                            setNewResourceTitle(''); setNewResourceUrl('');
                            await saveResourcesData(updated);
                          }} className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Add</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {tab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[750px] sm:h-[800px] shadow-lg overflow-hidden backdrop-blur-sm"
                  >
                    {/* Compact Header - Apple style */}
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="px-5 py-3.5 border-b border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
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
                      className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-gradient-to-b from-gray-50/30 via-white to-white dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/20 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent relative"
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
                            className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 mx-auto px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
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
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center mb-5 shadow-lg"
                          >
                            <MessageSquare className="w-10 h-10 text-purple-500 dark:text-purple-400" />
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
                                  className="text-xs text-left p-3 border border-gray-200/60 dark:border-gray-700/50 rounded-lg hover:border-purple-300/60 dark:hover:border-purple-700/50 hover:bg-purple-50/60 dark:hover:bg-purple-900/20 transition-all shadow-sm hover:shadow-md backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100/80 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                      <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
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
                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 shadow-md ring-1 ring-indigo-200/50 dark:ring-indigo-900/50"
                                  >
                                    <Bot className="w-4 h-4 text-white" />
                                  </motion.div>
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/50 shadow-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Elegant thinking indicator - Apple style */}
                                      <div className="flex items-center gap-1">
                                        <motion.div
                                          className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
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
                                          className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
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
                                          className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
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
                                      ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 ring-purple-200/50 dark:ring-purple-900/30'
                                      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 ring-indigo-200/50 dark:ring-indigo-900/30'}
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
                                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-sm'
                                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/60 dark:border-gray-700/50'}
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
                                    <span className="inline-block w-0.5 h-4 bg-purple-500 dark:bg-purple-400 ml-1 animate-pulse" />
                                  )}
                                  
                                  <div className={`text-[10px] mt-2 flex items-center justify-end gap-1
                                    ${msg.role === 'user'
                                      ? 'text-purple-200/70'
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
                      className="px-5 sm:px-6 py-4 border-t border-gray-200/60 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative"
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
                            className="w-full p-4 pr-14 text-sm bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 dark:text-white resize-none min-h-[52px] max-h-[140px] transition-all shadow-sm hover:shadow-md focus:shadow-lg leading-5"
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
                            className="absolute right-2.5 bottom-2.5 p-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-md hover:shadow-lg"
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
                                  toast.success('Chat cleared');
                                } catch (error) {
                                  toast.error('Failed to clear chat');
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

          {/* Improve the sticky notes design */}
          {/* Sticky Notes section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${
              isNotesExpanded 
                ? 'fixed inset-4 z-50 bg-white dark:bg-gray-800 overflow-hidden'
                : 'bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-8'
            }`}
          >
            {/* Header with title and buttons */}
            <div className={`flex justify-between items-center ${isNotesExpanded ? 'p-6 border-b border-gray-200 dark:border-gray-700' : 'mb-6'}`}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" />
                Interview Notes
                {filteredNotes.length !== stickyNotes.length && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({filteredNotes.length}/{stickyNotes.length})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={filterColor || ''}
                  onChange={(e) => setFilterColor(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={createNewNote}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </button>
                <button
                  onClick={toggleNotesExpanded}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isNotesExpanded ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isNotesExpanded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative h-[calc(100%-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900/50 flex"
                >
                  {/* Tools Menu - Left Side */}
                  <div className="relative z-20">
                    <div className="tool-menu h-full bg-white dark:bg-gray-800 rounded-l-2xl shadow-lg border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col items-center gap-2">
                      {/* Close button */}
                      <button
                        onClick={() => setIsNotesExpanded(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors mb-2"
                      >
                        <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      
                      {/* Tool buttons */}
                      <button
                        onClick={() => {
                          setSelectedTool('select');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'select'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Select"
                      >
                        <MousePointer className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('pen');
                          setShowToolSubmenu(true);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'pen'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Pen"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19l7-7 3 3-7 7-3-3z" />
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                          <path d="M2 2l7.586 7.586" />
                          <circle cx="11" cy="11" r="2" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('rectangle');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'rectangle'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Rectangle"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('circle');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'circle'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Circle"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('line');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'line'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Line"
                      >
                        <Minus className="w-5 h-5 rotate-45" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('arrow');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'arrow'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Arrow"
                      >
                        <ArrowUp className="w-5 h-5 rotate-45" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('sticky');
                          setShowToolSubmenu(false);
                          createNewNote();
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'sticky'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Sticky Note"
                      >
                        <StickyNote className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTool('text');
                          setShowToolSubmenu(false);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          selectedTool === 'text'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title="Text"
                      >
                        <span className="text-lg font-bold">T</span>
                      </button>
                    </div>
                    
                    {/* Submenu for pen tool */}
                    {showToolSubmenu && selectedTool === 'pen' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tool-submenu absolute left-full ml-2 top-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[120px]"
                      >
                        <div className="space-y-2">
                          {/* Color options */}
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Colors</div>
                            {[
                              { color: '#3b82f6', name: 'Blue' },
                              { color: '#ef4444', name: 'Red' },
                              { color: '#fbbf24', name: 'Yellow' },
                              { color: '#ec4899', name: 'Pink' },
                              { color: '#ef4444', name: 'Red Circle' },
                            ].map((colorOption, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (idx === 4) {
                                    // Red circle option
                                    setDrawingColor('#ef4444');
                                  } else {
                                    setDrawingColor(colorOption.color);
                                  }
                                }}
                                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  drawingColor === colorOption.color ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                }`}
                              >
                                {idx === 4 ? (
                                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-gray-300"></div>
                                ) : (
                                  <div className="w-4 h-4 rounded" style={{ backgroundColor: colorOption.color }}></div>
                                )}
                                <span className="text-xs text-gray-700 dark:text-gray-300">{colorOption.name}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Stroke width */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Thickness</div>
                            <div className="space-y-1">
                              {[1, 2, 3].map((width) => (
                                <button
                                  key={width}
                                  onClick={() => setDrawingStrokeWidth(width)}
                                  className={`w-full flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                    drawingStrokeWidth === width ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                  }`}
                                >
                                  <div className="flex gap-0.5">
                                    {Array(width).fill(0).map((_, i) => (
                                      <div key={i} className="w-1 h-4 bg-gray-400 rounded"></div>
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
                    className={`relative flex-1 h-full overflow-hidden ${
                      selectedTool === 'pen' ? 'cursor-crosshair' :
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
                      {isDrawingPath && drawingPath && (
                        <path
                          d={drawingPath}
                          stroke={drawingColor}
                          strokeWidth={drawingStrokeWidth}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
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
                              className="text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Xwrapper>
                        {filteredNotes.map((note) => (
                          <Draggable
                            key={note.id}
                            position={notePositions[note.id] || { x: 0, y: 0 }}
                            onStart={handleDragStart}
                            onStop={(e, data) => handleDragStop(note.id, e, data)}
                            bounds="parent"
                            disabled={selectedTool !== 'select'}
                          >
                          <div 
                            className="absolute rounded-lg shadow-lg cursor-move z-20"
                            style={{ 
                              backgroundColor: note.color,
                              width: `${noteSizes[note.id]?.width || note.width || 250}px`,
                              height: `${noteSizes[note.id]?.height || note.height || 200}px`
                            }}
                          >
                            <div className="p-4 h-full flex flex-col">
                              <div className="flex justify-between items-start mb-2 flex-shrink-0">
                                <h4 className="font-medium text-gray-800 truncate flex-1">
                                  {note.title || 'Untitled Note'}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNote(note.id);
                                  }}
                                  className="p-1 hover:bg-black/10 rounded-full flex-shrink-0 ml-2"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div 
                                className="text-sm text-gray-700 flex-1 overflow-y-auto"
                                onClick={(e) => {
                                  if (!isDragging && !isResizing && selectedTool === 'select') {
                                    handleNoteClick(note.id, e);
                                  }
                                }}
                              >
                                {note.content}
                              </div>
                              {/* Resize handle */}
                              <div
                                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-black/10 hover:bg-black/20 rounded-tl-lg transition-colors"
                                onMouseDown={(e) => handleResizeStart(note.id, e)}
                                style={{ cursor: isResizing && resizingNoteId === note.id ? 'se-resize' : 'se-resize' }}
                              >
                                <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-r-2 border-b-2 border-gray-600"></div>
                              </div>
                            </div>
                          </div>
                        </Draggable>
                        ))}
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
                          className="mt-2 text-purple-600 dark:text-purple-400 hover:underline"
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
        
        {/* Improve the note modal */}
        <AnimatePresence>
          {isNoteModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {activeNote ? 'Edit Note' : 'New Note'}
                  </h3>
                  <button
                    onClick={() => setIsNoteModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note title"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Content
                    </label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Note content"
                      rows={7}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        <button
                          key={colorOption.color}
                          onClick={() => setNoteColor(colorOption.color)}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            noteColor === colorOption.color 
                              ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' 
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsNoteModalOpen(false)}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNote}
                      className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Note
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </MotionConfig>
    </AuthLayout>
  );
} 