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
  Newspaper, Users, PieChart, Award, Flag, Edit
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

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
  type: 'arrow' | 'line' | 'rectangle' | 'circle';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  color: string;
  label?: string;
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
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'arrow' | 'line' | 'rectangle' | 'circle'>('select');
  const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConnectionMenu, setShowConnectionMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [connectionMenuPosition, setConnectionMenuPosition] = useState({ x: 0, y: 0 });
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
    updateInterviewNotes(updatedNotes);
    toast.success('Talking points note created');
  };
  
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
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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
        interview.stickyNotes.forEach((note, index) => {
          // Only set position if it doesn't already exist in notePositions
          if (!positions[note.id]) {
            positions[note.id] = note.position || {
              x: (index % 3) * 300 + 50,
              y: Math.floor(index / 3) * 200 + 50
            };
          }
        });
        setNotePositions(positions);
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
    
    try {
      const analysisRaw = await analyzeJobPost(
        jobUrl,
        application.position,
        application.companyName,
        'perplexity' // Use Perplexity as default
      );
      const analysisResult = sanitizeForFirestore(analysisRaw);
      
      if (analysisResult.error) {
        toast.error(analysisResult.error);
        return;
      }
      
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
        preparation: analysisResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      };
      
      // Update Firestore - Make sure applicationId is not undefined
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setInterview({
        ...interview,
        preparation: analysisResult,
        jobPostUrl: jobUrl,
        lastAnalyzed: new Date().toISOString()
      });
      
      toast.success('Job post analyzed successfully with Perplexity AI');
    } catch (error) {
      console.error('Error analyzing job post:', error);
      toast.error('Failed to analyze job post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
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

  // Function to toggle message expansion
  const toggleMessageExpansion = (index: number) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const updateInterviewNotes = (updatedNotes: Note[]) => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
    
    if (interviewIndex !== -1) {
      const updatedInterviews = [...(application.interviews || [])];
      updatedInterviews[interviewIndex] = {
        ...interview,
        stickyNotes: updatedNotes
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
        stickyNotes: updatedNotes
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
    
    // Remonter en haut de la page pour voir le chargement
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      // Récupérer les questions sauvegardées du localStorage
      const savedQuestions: string[] = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
      
      // Call Perplexity to generate different questions
      const prompt = `
Based on this job posting for a ${application.position} position at ${application.companyName}: ${interview.jobPostUrl}

Please generate 5 different interview questions that might be asked during this interview. Make them varied - some behavioral, some technical, some about the company fit.
Return the questions in a JSON format like this:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ],
  "answers": [
    {"question": "Question 1", "answer": "Approach to answering this question"},
    {"question": "Question 2", "answer": "Approach to answering this question"},
    {"question": "Question 3", "answer": "Approach to answering this question"},
    {"question": "Question 4", "answer": "Approach to answering this question"},
    {"question": "Question 5", "answer": "Approach to answering this question"}
  ]
}
`;

      const response = await queryPerplexity(prompt);
      
      if (response) {
        // Extract the JSON from the response
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*?\}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        const newQuestionsData = JSON.parse(jsonString);
        
        // Combiner les questions sauvegardées avec les nouvelles questions
        let combinedQuestions: string[] = [...savedQuestions];
        let combinedAnswers: {question: string, answer: string}[] = [];
        
        // Ajouter les nouvelles questions qui ne sont pas déjà sauvegardées
        if (newQuestionsData.questions) {
          newQuestionsData.questions.forEach((question: string, idx: number) => {
            if (!savedQuestions.includes(question)) {
              combinedQuestions.push(question);
              
              // Ajouter la réponse correspondante si disponible
              if (newQuestionsData.answers && newQuestionsData.answers[idx]) {
                combinedAnswers.push(newQuestionsData.answers[idx]);
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
          } else {
            // Créer une réponse générique si aucune n'est trouvée
            combinedAnswers.push({
              question: savedQuestion,
              answer: "Structure your answer using the STAR method: Situation, Task, Action, Result."
            });
          }
        });
        
        // Create updated preparation object with required fields
        const updatedPreparation: JobPostAnalysisResult = {
          keyPoints: interview.preparation?.keyPoints || [],
          requiredSkills: interview.preparation?.requiredSkills || [],
          suggestedQuestions: combinedQuestions,
          suggestedAnswers: combinedAnswers,
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
        
        // Attendre un court instant pour que l'animation soit plus fluide
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success('New interview questions generated successfully!');
      } else {
        toast.error('Failed to generate new questions');
      }
    } catch (error) {
      console.error('Error generating new questions:', error);
      toast.error('Failed to generate new questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRegeneratingQuestions(false);
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

    setIsDrawingShape(true);
    const newShape: Shape = {
      id: uuidv4(),
      type: selectedTool,
      startX: x,
      startY: y,
      color: '#6b21a8'
    };

    setDrawingShape(newShape);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (isDragging) return;
    
    const note = stickyNotes.find(note => note.id === noteId);
    if (note) {
      openNote(note);
    }
  };

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
      stickyNotes.forEach((note, index) => {
        if (!notePositions[note.id]) {
          newPositions[note.id] = {
            x: (index % 3) * 300 + 50,
            y: Math.floor(index / 3) * 200 + 50
          };
        }
      });
      setNotePositions(newPositions);
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
            className="mb-6"
          >
            <div className="flex items-center justify-end mb-5 mr-1">
              {interview && (
                <div className="flex items-center px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(`${interview.date}T${interview.time || '00:00'}`).toLocaleDateString('fr-FR', {
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                  })} at {interview.time || '00:00'}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent mb-1">
                  Interview Preparation
                </h1>
                {application && (
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    {application.position} at {application.companyName}
                  </p>
                )}
              </div>
              
              {interview && (
                <div className="flex items-center">
                  <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full p-1 flex">
                    {(['scheduled', 'completed', 'cancelled'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateInterviewStatus(status)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                          interview.status === status
                            ? status === 'scheduled' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                              : status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {status === 'scheduled' && <Calendar className="w-3.5 h-3.5" />}
                        {status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                        {status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                        <span className="capitalize">{status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Job URL Input Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
          >
            <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Job Posting Analysis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter a job posting URL to generate personalized interview preparation
              </p>
            </div>
            
            <div className="p-6">
              <div className="relative">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://example.com/job-posting"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-32"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Link2 className="w-4 h-4" />
                </div>
                <button
                  onClick={handleAnalyzeJobPost}
                  disabled={isAnalyzing || !jobUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 
                    text-white rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm font-medium disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Loading overlay */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full border-4 border-purple-100 dark:border-gray-700 border-t-purple-500 dark:border-t-purple-400 animate-spin"></div>
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Search className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Analyzing Job Posting
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Our AI is analyzing the job requirements, company information, and preparing interview questions for you.
                    </p>
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 8 }}
                      className="h-1.5 bg-purple-500 rounded-full w-full max-w-xs"
                    ></motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      This may take a moment...
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab navigation */}
          <div className="mb-8">
            <div className="grid grid-cols-5 gap-2 md:gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              {[
                { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-4 h-4" /> },
                { id: 'skills', label: 'Skills', icon: <Briefcase className="w-4 h-4" /> },
                { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'chat', label: 'Practice', icon: <MessageSquare className="w-4 h-4" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as any)}
                  className={`
                    text-center py-3 rounded-md transition-all flex flex-col items-center
                    ${tab === item.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}
                  `}
                >
                  <div className={`mb-1 ${tab === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
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
                    {/* Interview Countdown & Progress Tracker */}
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const interviewDate = new Date(`${interview?.date}T${interview?.time || '09:00'}`);
                            const now = new Date();
                            const diffMs = interviewDate.getTime() - now.getTime();
                            const isPast = diffMs < 0;
                            
                            if (isPast) {
                              return (
                                <>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Interview passé</div>
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">Terminé</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {interview?.type ? `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}` : 'Interview'} • {new Date(interview?.date || '').toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}
                                  </div>
                                </>
                              );
                            } else {
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                              const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              return (
                                <>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Interview dans</div>
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {diffDays} jours {diffHours} heures
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {interview?.type ? `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}` : 'Interview'} • {new Date(interview?.date || '').toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}
                                  </div>
                                </>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <BarChart2 className="w-4 h-4 mr-2 text-purple-600" />
                            Preparation Progress
                          </h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{preparationProgress}%</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {getProgressMilestones().filter(m => m.completed).length}/5 completed
                            </div>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500" 
                            style={{width: `${preparationProgress}%`}}
                          ></div>
                        </div>
                        <div className="space-y-2">
                          {getProgressMilestones().map((milestone) => (
                            <button
                              key={milestone.id}
                              onClick={milestone.action}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                milestone.completed
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${
                                  milestone.completed
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                  {milestone.icon}
                                </div>
                                <div className="text-left">
                                  <div className={`font-medium text-sm ${
                                    milestone.completed
                                      ? 'text-green-700 dark:text-green-300'
                                      : 'text-gray-800 dark:text-gray-200'
                                  }`}>
                                    {milestone.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {milestone.description}
                                  </div>
                                </div>
                              </div>
                              {milestone.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preparation Checklist and Interview Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Interactive Preparation Checklist */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <CheckSquare className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                          Preparation Checklist
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add a new task"
                            className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyDown={(e) => { if (e.key === 'Enter') addChecklistItem(); }}
                          />
                          <button
                            onClick={addChecklistItem}
                            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-3">
                          {checklist.map((item) => (
                            <div key={item.id} className={`flex items-center p-3 rounded-lg ${
                              item.priority ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800' : ''
                            }`}>
                              <div className="mr-3">
                                <button 
                                  onClick={() => toggleChecklistItem(item.id)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                    item.completed 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}
                                >
                                  {item.completed && <Check className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="flex-1">
                                <input
                                  value={item.task}
                                  onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                  className={`w-full bg-transparent outline-none text-sm ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setTab(item.section)} 
                                  className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  Go
                                </button>
                                <button
                                  onClick={() => deleteChecklistItem(item.id)}
                                  className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Interview Details */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                          Interview Details
                        </h3>
                        
                        <div className="space-y-5">
                          <div className="flex items-start">
                            <div className="mr-3 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</h4>
                              <p className="text-gray-900 dark:text-white font-medium">{application.companyName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="mr-3 flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</h4>
                              <p className="text-gray-900 dark:text-white font-medium">{application.position}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="mr-3 flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Type</h4>
                              <p className="text-gray-900 dark:text-white font-medium capitalize">{interview?.type || 'Unknown'} Interview</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="mr-3 flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</h4>
                              <p className="text-gray-900 dark:text-white font-medium">{interview?.location || application.location || 'Remote/Virtual'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company & Position Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Company Profile */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                          className="px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('company-profile')}
                        >
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Company Profile</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections['company-profile'] ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        {expandedSections['company-profile'] && (
                          <div className="p-5">
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                              <p>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded mr-1">KEY</span>
                                {interview?.preparation?.companyInfo?.split('.')[0] || `${application.companyName} is a leading company in its industry.`}
                              </p>
                              
                              {interview?.preparation?.companyInfo ? (
                                <p>{interview.preparation.companyInfo.split('.').slice(1, 3).join('.')}</p>
                              ) : (
                                <p>No additional company information available. Run the job post analysis to generate company information.</p>
                              )}
                              
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 border-l-4 border-blue-500 dark:border-blue-700">
                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">Focus points:</div>
                                <ul className="list-disc pl-4 text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                  <li>Research their mission and values</li>
                                  <li>Review recent company achievements</li>
                                  <li>Understand their market position</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Position Details */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                          className="px-5 py-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('position-details')}
                        >
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                            <h3 className="font-medium text-gray-900 dark:text-white">Position Details</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections['position-details'] ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        {expandedSections['position-details'] && (
                          <div className="p-5">
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                              <p>
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded mr-1">KEY</span>
                                {interview?.preparation?.positionDetails?.split('.')[0] || `The ${application.position} role involves key responsibilities in the organization.`}
                              </p>
                              
                              {interview?.preparation?.positionDetails ? (
                                <p>{interview.preparation.positionDetails.split('.').slice(1, 3).join('.')}</p>
                              ) : (
                                <p>No detailed position information available. Run the job post analysis to generate position details.</p>
                              )}
                              
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 border-l-4 border-purple-500 dark:border-purple-700">
                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">Required skills:</div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {interview?.preparation?.requiredSkills ? (
                                    interview.preparation.requiredSkills.map((skill, index) => (
                                      <div 
                                        key={index} 
                                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full"
                                      >
                                        {skill}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">No skills information available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Key Points to Emphasize */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-center mb-5">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg mr-3">
                          <Flag className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Key Points to Emphasize
                        </h3>
                      </div>
                      
                      {interview?.preparation?.keyPoints && interview.preparation.keyPoints.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {interview.preparation.keyPoints.map((point, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + index * 0.05 }}
                              className="flex items-start py-3 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                            >
                              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 text-center">
                          <p className="text-gray-500 dark:text-gray-400 mb-3">
                            No key points available yet. Run the job post analysis to generate key points to emphasize in your interview.
                          </p>
                          <button
                            onClick={() => (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-center mx-auto"
                          >
                            <ArrowUp className="w-4 h-4 mr-1.5" />
                            Analyze a Job Posting
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Company News & Updates */}
                    {interview?.preparation && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Newspaper className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Company Updates
                          </h3>
                          <div className="flex items-center gap-2">
                            {isNewsLoading && <div className="text-xs text-gray-500 dark:text-gray-400">Loading…</div>}
                            {newsError && <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>}
                            <button
                              onClick={() => { fetchCompanyNews(); }}
                              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Refresh
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {newsItems.length === 0 && !isNewsLoading && !newsError && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">No company updates yet.</div>
                          )}
                          {newsItems.map((news, i) => (
                            <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                              <div className="flex items-start mb-1.5">
                                <span className={`w-2 h-2 rounded-full mr-2 mt-1.5 flex-shrink-0 ${
                                  news.sentiment === 'positive' ? 'bg-green-500' : 
                                  news.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{news.title}</h4>
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
                              <p className="text-sm text-gray-600 dark:text-gray-300 pl-4 mb-3">{news.summary}</p>
                              <div className="flex items-center justify-between pl-4">
                                <button
                                  onClick={() => createNoteFromNews(news)}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded transition-colors"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Talking point ideas
                                </button>
                                {news.url && (
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Read more
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
                    {/* Loading overlay pour la section questions uniquement */}
                    {isRegeneratingQuestions && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-md"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl flex flex-col items-center max-w-md">
                          <div className="relative mb-4">
                            <div className="w-16 h-16 border-4 border-purple-100 dark:border-gray-700 border-t-purple-500 dark:border-t-purple-400 rounded-full animate-spin"></div>
                            <motion.div
                              initial={{ rotate: 0 }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <RefreshCw className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                            </motion.div>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Generating New Questions
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
                            Our AI is creating personalized interview questions based on the job description and your profile.
                          </p>
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8 }}
                            className="h-1.5 bg-purple-500 rounded-full w-full max-w-xs"
                          ></motion.div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Responsive header section */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                          <span>Interview Questions</span>
                          {interview.preparation?.suggestedQuestions && !isRegeneratingQuestions && (
                            <span className="text-xs sm:text-sm font-normal bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                              {interview.preparation.suggestedQuestions.length} questions
                            </span>
                          )}
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
                      <button className="px-2.5 sm:px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs whitespace-nowrap shadow-sm flex-shrink-0">
                        All Questions
                      </button>
                      <button className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] sm:text-xs whitespace-nowrap transition-colors flex-shrink-0">
                        Technical
                      </button>
                      <button className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] sm:text-xs whitespace-nowrap transition-colors flex-shrink-0">
                        Behavioral
                      </button>
                      <button className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] sm:text-xs whitespace-nowrap transition-colors flex-shrink-0">
                        Company Specific
                      </button>
                      <button className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] sm:text-xs whitespace-nowrap transition-colors flex-shrink-0">
                        Role Specific
                      </button>
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
                    {!isRegeneratingQuestions && interview.preparation?.suggestedQuestions?.map((question, index) => (
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
                          {question}
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
                            
                            {/* Contenu déroulant - caché lorsque la question est réduite */}
                            <AnimatePresence>
                              {!collapsedQuestions[index] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {/* Mind Map for suggested answer - Optimized for mobile */}
                                  <div className="mt-3 sm:mt-5 border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                                    <h4 className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-3 sm:mb-4">
                            Suggested Answer Approach
                          </h4>
                                    
                                    {/* Mind Map Visualization - Simplified for mobile */}
                                    <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 sm:p-6 pb-3 sm:pb-4 relative min-h-[150px] sm:min-h-[180px]">
                                      {/* Central Node - Adapté au type de question */}
                                      <div className="absolute w-24 sm:w-28 h-8 sm:h-9 bg-purple-600 text-white rounded-md flex items-center justify-center text-[10px] sm:text-xs font-medium left-1/2 top-4 sm:top-6 transform -translate-x-1/2 z-10 shadow-sm">
                                        {question.toLowerCase().includes('tell me about') || question.toLowerCase().includes('describe a time') ? 'STAR Method' : 
                                         question.toLowerCase().includes('how would you') ? 'Strategy' :
                                         question.toLowerCase().includes('what is') || question.toLowerCase().includes('define') ? 'Knowledge' : 
                                         question.toLowerCase().includes('why') ? 'Reasoning' : 'Approach'}
                                      </div>
                                
                                {/* First level nodes - Responsive layout for mobile */}
                                <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-10 gap-y-3 sm:gap-y-4 mt-14 sm:mt-16 mb-2 sm:mb-3 pt-1 sm:pt-2">
                                  {/* Structure adaptative basée sur le type de question */}
                                  {(() => {
                                    // Questions comportementales (STAR)
                                    if (question.toLowerCase().includes('tell me about') || 
                                        question.toLowerCase().includes('describe a time') || 
                                        question.toLowerCase().includes('example of') ||
                                        question.toLowerCase().includes('experience with')) {
                                      return (
                                        <>
                                          <div className="relative pt-6 sm:pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="25" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="25" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-20 sm:w-28 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-1.5 sm:p-2 rounded text-[10px] sm:text-xs text-center shadow-sm">
                                              Situation
                                              <div className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 text-gray-600 dark:text-gray-400">Set the context</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-6 sm:pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="25" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="25" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-20 sm:w-28 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-1.5 sm:p-2 rounded text-[10px] sm:text-xs text-center shadow-sm">
                                              Action
                                              <div className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 text-gray-600 dark:text-gray-400">What you did</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-6 sm:pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="25" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="25" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-20 sm:w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-1.5 sm:p-2 rounded text-[10px] sm:text-xs text-center shadow-sm">
                                              Results
                                              <div className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 text-gray-600 dark:text-gray-400">Measurable impact</div>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    // Questions techniques / définitions
                                    else if (question.toLowerCase().includes('what is') || 
                                             question.toLowerCase().includes('define') || 
                                             question.toLowerCase().includes('explain')) {
                                      return (
                                        <>
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded text-xs text-center shadow-sm">
                                              Definition
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Core concept</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded text-xs text-center shadow-sm">
                                              Examples
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Practical cases</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-2 rounded text-xs text-center shadow-sm">
                                              Application
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">In this role</div>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    // Questions "Comment" / approche
                                    else if (question.toLowerCase().includes('how would you') || 
                                             question.toLowerCase().includes('how do you') ||
                                             question.toLowerCase().includes('approach') ||
                                             question.toLowerCase().includes('strategy')) {
                                      return (
                                        <>
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded text-xs text-center shadow-sm">
                                              Analysis
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Assess situation</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded text-xs text-center shadow-sm">
                                              Methodology
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Step by step</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-2 rounded text-xs text-center shadow-sm">
                                              Evaluation
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Measure success</div>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    // Questions "Pourquoi" / motivations
                                    else if (question.toLowerCase().includes('why') ||
                                             question.toLowerCase().includes('reason') ||
                                             question.toLowerCase().includes('motivat')) {
                                      return (
                                        <>
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded text-xs text-center shadow-sm">
                                              Personal
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Your motivation</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded text-xs text-center shadow-sm">
                                              Professional
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Career alignment</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-2 rounded text-xs text-center shadow-sm">
                                              Contribution
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Value you bring</div>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    // Default pour les autres types de questions
                                    else {
                                      return (
                                        <>
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded text-xs text-center shadow-sm">
                                              Context
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Background</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded text-xs text-center shadow-sm">
                                              Key Points
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Main arguments</div>
                                            </div>
                                          </div>
                                          
                                          <div className="relative pt-8">
                                            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2" width="2" height="30" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="1" y1="0" x2="1" y2="30" stroke="#9061F9" strokeWidth="2" />
                                            </svg>
                                            <div className="w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-2 rounded text-xs text-center shadow-sm">
                                              Conclusion
                                              <div className="text-[10px] mt-1 text-gray-600 dark:text-gray-400">Takeaway</div>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    }
                                  })()}
                                </div>
                                
                                {/* Answer content and examples - Streamlined for mobile */}
                                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 max-h-[120px] sm:max-h-none overflow-y-auto">
                            {interview.preparation?.suggestedAnswers && 
                             interview.preparation.suggestedAnswers[index] && 
                             typeof interview.preparation.suggestedAnswers[index] === 'object' && 
                             'answer' in interview.preparation.suggestedAnswers[index]
                              ? (interview.preparation.suggestedAnswers[index] as { answer: string }).answer
                              : "Structure your answer using the STAR method: Situation, Task, Action, Result. Focus on highlighting relevant experience and skills from your background that match the job requirements."}
                                </div>
                                
                                {/* Key examples - Responsive grid for mobile */}
                                <div className="flex flex-col sm:flex-row flex-wrap justify-between gap-2 mt-3 sm:mt-4">
                                  <div className="w-full text-[10px] sm:text-xs p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded border-l-2 border-blue-500 dark:border-blue-700">
                                    <span className="font-medium">Example opener:</span> "In my role at [Previous Company], I..."
                                  </div>
                                  <div className="w-full text-[10px] sm:text-xs p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded border-l-2 border-green-500 dark:border-green-700">
                                    <span className="font-medium">Key point:</span> "This resulted in [measurable outcome]..."
                                  </div>
                                </div>
                              </div>
                              
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
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {(!isRegeneratingQuestions && (!interview.preparation?.suggestedQuestions || interview.preparation.suggestedQuestions.length === 0)) && (
                      <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">
                          No suggested questions available
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 px-4">
                          Analyze a job posting to get AI-generated interview questions
                        </p>
                      </div>
                    )}
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
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Skill Coach</h3>
                      <div className="space-y-5">
                        {skillGaps.map(({ skill, rating, gap }, idx) => (
                          <div key={skill} className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-1">{skill}</h4>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Rating {rating}/5 • Gap {gap}</div>
                              </div>
                              <button onClick={() => practiceInChat(skill)} className="text-xs px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700">Practise in Chat</button>
                            </div>
                            <div className="mt-3">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">30‑minute plan</div>
                              <div className="space-y-2">
                                {(ensureDefaultTasks(skill)).map(t => (
                                  <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input type="checkbox" checked={t.done} onChange={() => toggleMicroTask(skill, t.id)} className="rounded" />
                                    <span className={`${t.done ? 'line-through text-gray-500' : ''}`}>{t.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">STAR stories</div>
                              <div className="space-y-3">
                                {(skillCoach?.starStories?.[skill] || []).map(story => (
                                  <div key={story.id} className="space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <textarea rows={3} value={story.situation} onChange={(e)=>updateStarField(skill, story.id, 'situation', e.target.value)} placeholder="Situation (context, stakes, constraints)" className="px-2 py-2 text-sm rounded border dark:bg-gray-800 dark:border-gray-700 resize-y" />
                                      <textarea rows={3} value={story.action} onChange={(e)=>updateStarField(skill, story.id, 'action', e.target.value)} placeholder="Action (what you did, how, tools)" className="px-2 py-2 text-sm rounded border dark:bg-gray-800 dark:border-gray-700 resize-y" />
                                      <textarea rows={3} value={story.result} onChange={(e)=>updateStarField(skill, story.id, 'result', e.target.value)} placeholder="Result (impact, metrics, lessons)" className="px-2 py-2 text-sm rounded border dark:bg-gray-800 dark:border-gray-700 resize-y" />
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={()=>exportStoryToNotes(skill, story.id)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Export to Notes</button>
                                      <button onClick={()=>deleteStarStory(skill, story.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">Delete</button>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={()=>addStarStory(skill)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Add story</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {skillGaps.length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No priority gaps detected. Rate your skills on the right.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
                        Skills Assessment
                      </h3>
                      
                      <div className="space-y-5">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          Rate your confidence with each required skill to identify areas for preparation.
                        </p>
                        
                        {interview.preparation.requiredSkills?.map((skill, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-gray-700 dark:text-gray-300">{skill}</p>
                              <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => handleRateSkill(skill, rating)}
                                    className={`w-7 h-7 rounded-full transition-colors ${
                                      (skillRatings[skill] === rating)
                                        ? 'bg-purple-500 dark:bg-purple-600 transform scale-110'
                                        : (skillRatings[skill] && skillRatings[skill] >= rating) 
                                          ? 'bg-purple-300 dark:bg-purple-700'
                                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                    }`}
                                    aria-label={`Rate ${skill} ${rating} out of 5`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
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
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[600px] shadow-md overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-800 dark:to-purple-900/20">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Interview Trainer Chat
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Practice for your interview by chatting with our AI assistant. Ask questions about the job, request interview tips, or practice answering questions.
                      </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-900/20">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                          </div>
                          <p className="text-center max-w-md font-medium mb-3 text-lg text-gray-700 dark:text-gray-200">
                            Start a conversation with your AI interview trainer
                          </p>
                          <p className="text-center text-sm max-w-md mb-8 text-gray-500 dark:text-gray-400">
                            Ask about the position, company culture, or try practicing some interview questions
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {[
                              "How should I introduce myself?",
                              "What are the most common questions for this role?",
                              "How can I highlight my relevant experience?",
                              "Ask me about my strengths and weaknesses"
                            ].map((suggestion, i) => (
                              <motion.button
                                key={i}
                                initial={{ opacity: 0.8, y: 5 }}
                                whileHover={{ 
                                  opacity: 1, 
                                  y: 0,
                                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                                  transition: { duration: 0.2 }
                                }}
                                onClick={() => {
                                  setMessage(suggestion);
                                }}
                                className="text-sm text-left p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-sm"
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 text-purple-500 dark:text-purple-400">
                                    <MessageSquare className="w-4 h-4" />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => {
                          // Handle the special thinking message
                          if (msg.role === 'assistant' && msg.content === '__thinking__') {
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start mb-4"
                              >
                                <div className="flex items-start gap-3 max-w-[85%] flex-row">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md">
                                    <Bot className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="p-4 rounded-2xl shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700">
                                    <span className="flex items-center gap-2 text-sm">
                                      <span>AI is thinking...</span>
                                      <span className="inline-block">
                                        <span className="dot-typing">
                                          <span className="dot"></span>
                                          <span className="dot"></span>
                                          <span className="dot"></span>
                                        </span>
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                <style>{`
                                  .dot-typing {
                                    display: inline-flex;
                                    gap: 2px;
                                  }
                                  .dot {
                                    width: 6px;
                                    height: 6px;
                                    background: #6366f1;
                                    border-radius: 50%;
                                    display: inline-block;
                                    animation: dot-typing 1s infinite linear alternate;
                                  }
                                  .dot:nth-child(2) { animation-delay: 0.2s; }
                                  .dot:nth-child(3) { animation-delay: 0.4s; }
                                  @keyframes dot-typing {
                                    0% { opacity: 0.2; transform: translateY(0); }
                                    50% { opacity: 1; transform: translateY(-3px); }
                                    100% { opacity: 0.2; transform: translateY(0); }
                                  }
                                `}</style>
                              </motion.div>
                            );
                          }
                          // Process assistant messages to make them more concise
                          let displayContent = msg.content;
                          let isLongMessage = false;
                          let isTruncated = false;
                          if (msg.role === 'assistant' && msg.content.length > 250) {
                            isLongMessage = true;
                            if (!expandedMessages[index]) {
                              // Get the first paragraph or 250 characters
                              const firstParagraphMatch = msg.content.match(/^.+?(?:\n\n|\n|$)/);
                              displayContent = firstParagraphMatch ? 
                                firstParagraphMatch[0].slice(0, 250) : 
                                msg.content.slice(0, 250);
                              if (displayContent.length < msg.content.length) {
                                displayContent += '...';
                                isTruncated = true;
                              }
                            }
                          }
                          
                          // Format displayContent to handle thinking indicators
                          if (msg.role === 'assistant' && displayContent.includes('<think>')) {
                            displayContent = displayContent.replace(/<think>[\s\S]*<\/think>/g, '');
                          }
                          
                          
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { 
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                  delay: index * 0.1,
                                  duration: 0.4 
                                } 
                              }}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                            >
                              <div className={`
                                flex items-start gap-3 max-w-[85%] 
                                ${msg.role === 'user' 
                                  ? 'flex-row-reverse' 
                                  : 'flex-row'}
                              `}>
                                <div className={`
                                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                  ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-md'
                                    : 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md'}
                                `}>
                                  {msg.role === 'user' 
                                    ? <User className="w-5 h-5 text-white" /> 
                                    : <Bot className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`
                                  p-4 rounded-2xl shadow-sm
                                  ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}
                                `}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                                  
                                  {isLongMessage && isTruncated && (
                                    <button
                                      onClick={() => toggleMessageExpansion(index)}
                                      className={`text-xs mt-2 font-medium hover:underline inline-flex items-center
                                        ${msg.role === 'user'
                                          ? 'text-purple-100'
                                          : 'text-purple-500 dark:text-purple-400'}
                                      `}
                                    >
                                      {expandedMessages[index] ? (
                                        <>
                                          <ChevronDown className="w-3 h-3 mr-1" />
                                          Show less
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-3 h-3 mr-1 transform rotate-180" />
                                          Show more
                                        </>
                                      )}
                                    </button>
                                  )}
                                  
                                  <div className={`text-xs mt-1 flex items-center justify-end
                                    ${msg.role === 'user'
                                      ? 'text-purple-200'
                                      : 'text-gray-400'}
                                  `}>
                                    <ClockIcon className="w-3 h-3 mr-1 inline" />
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="flex gap-3 items-end">
                        <div className="relative flex-1">
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="Type your message..."
                            rows={1}
                            className="w-full p-4 pr-12 text-sm bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white resize-none min-h-[50px] max-h-[120px] transition-all"
                            style={{ 
                              height: 'auto',
                              overflow: 'hidden'
                            }}
                            disabled={isSending}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendMessage}
                            disabled={!message.trim() || isSending}
                            className="absolute right-3 bottom-2 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {isSending ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 mt-1 flex items-center">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Press Enter to send. Shift+Enter for a new line.
                      </p>
                    </div>
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
              </h3>
              <div className="flex items-center gap-2">
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
                  className="relative h-[calc(100%-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900/50"
                >
                  {/* Canvas area */}
                  <div 
                    className="relative h-full p-4"
                    ref={canvasRef}
                  >
                    <Xwrapper>
                      {stickyNotes.map((note) => (
                        <Draggable
                          key={note.id}
                          position={notePositions[note.id] || { x: 0, y: 0 }}
                          onStart={handleDragStart}
                          onStop={(e, data) => handleDragStop(note.id, e, data)}
                          bounds="parent"
                        >
                          <div 
                            className="absolute w-[250px] h-[200px] rounded-lg shadow-lg cursor-move"
                            style={{ backgroundColor: note.color }}
                          >
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-800 truncate flex-1">
                                  {note.title || 'Untitled Note'}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNote(note.id);
                                  }}
                                  className="p-1 hover:bg-black/10 rounded-full"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div 
                                className="text-sm text-gray-700 max-h-[150px] overflow-y-auto"
                                onClick={(e) => {
                                  if (!isDragging) {
                                    handleNoteClick(note.id, e);
                                  }
                                }}
                              >
                                {note.content}
                              </div>
                            </div>
                          </div>
                        </Draggable>
                      ))}
                    </Xwrapper>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stickyNotes.map(note => (
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