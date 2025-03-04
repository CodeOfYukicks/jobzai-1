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
  MousePointer, Square, Circle, Minus
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
      
      // Initialize sticky notes
      if (interview.stickyNotes && interview.stickyNotes.length > 0) {
        setStickyNotes(interview.stickyNotes);
        
        // Initialize note positions
        const positions: Record<string, { x: number; y: number }> = {};
        interview.stickyNotes.forEach((note, index) => {
          positions[note.id] = note.position || {
            x: (index % 3) * 300 + 50,
            y: Math.floor(index / 3) * 200 + 50
          };
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

  const handleAnalyzeJobPost = async () => {
    if (!currentUser || !application || !interview || !applicationId) return;
    
    if (!jobUrl) {
      toast.error('Please enter a job post URL');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const analysisResult = await analyzeJobPost(
        jobUrl,
        application.position,
        application.companyName,
        'perplexity' // Use Perplexity as default
      );
      
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
    
    const updatedMessages = [...chatMessages, userMessage];
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
      
      console.log('Sending message to Perplexity API');
      
      // Query Perplexity API with a single argument
      const response = await queryPerplexity(
        context + "\n\nUser message: " + message
      );
      
      console.log('Response received from Perplexity API:', response);
      
      // Check if the response contains an error
      if (response.error) {
        console.error('Error in Perplexity response:', response.errorMessage);
        
        // Add error message to chat
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: response.text || "I'm sorry, I couldn't process your request. Please try again later.",
          timestamp: Date.now()
        };
        
        const newMessages = [...updatedMessages, errorMessage];
        setChatMessages(newMessages);
        
        // Save error message to chat history
        await saveChatHistory(newMessages);
        return;
      }
      
      if (!response.text) {
        throw new Error("Response from AI is empty or invalid");
      }
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setChatMessages(newMessages);
      
      // Save chat history to Firestore
      await saveChatHistory(newMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat so user knows what happened
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. This might be due to network issues or browser settings blocking requests. Please try again later.",
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, errorMessage];
      setChatMessages(newMessages);
      
      // Try to save the error message to chat history
      try {
        await saveChatHistory(newMessages);
      } catch (saveError) {
        console.error('Error saving chat history:', saveError);
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
        setInterview({
          ...interview,
          notes: notes
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
        const newNote: Note = {
          id: uuidv4(),
          title: noteTitle,
          content: noteContent,
          color: noteColor,
          createdAt: timestamp,
          updatedAt: timestamp,
          position: { x: 50, y: 50 }
        };
        updatedNotes = [...stickyNotes, newNote];
      }
      
      setStickyNotes(updatedNotes);
      
      // Save to Firestore
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = {
          ...interview,
          stickyNotes: updatedNotes
        };
        
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });
        
        // Update local interview state
        setInterview({
          ...interview,
          stickyNotes: updatedNotes
        });
        
        toast.success(activeNote ? 'Note updated successfully' : 'Note created successfully');
      }
      
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
      setStickyNotes(updatedNotes);
      
      // Save to Firestore
      const interviewIndex = application.interviews?.findIndex(i => i.id === interview.id) ?? -1;
      
      if (interviewIndex !== -1) {
        const updatedInterviews = [...(application.interviews || [])];
        updatedInterviews[interviewIndex] = {
          ...interview,
          stickyNotes: updatedNotes
        };
        
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });
        
        // Update local interview state
        setInterview({
          ...interview,
          stickyNotes: updatedNotes
        });
        
        toast.success('Note deleted successfully');
      }
      
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
    
    toast.info('Generating new interview questions...');
    setIsRegeneratingQuestions(true);
    
    try {
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
        
        // Create updated preparation object with required fields
        const updatedPreparation: JobPostAnalysisResult = {
          keyPoints: interview.preparation?.keyPoints || [],
          requiredSkills: interview.preparation?.requiredSkills || [],
          suggestedQuestions: newQuestionsData.questions || [],
          suggestedAnswers: newQuestionsData.answers || [],
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
            Back to Applications
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <MotionConfig transition={{ duration: 0.3 }}>
        <div className="max-w-6xl mx-auto pb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Link 
                to="/applications" 
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 group transition-colors"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Applications</span>
              </Link>
              {interview && (
                <span className="text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 py-1 px-3 rounded-full flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {new Date(interview.date).toLocaleDateString()} at {interview.time}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Interview Preparation
                </h1>
                {application && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {application.position} at {application.companyName}
                  </p>
                )}
              </div>
              
              {interview && (
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex">
                    {(['scheduled', 'completed', 'cancelled'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateInterviewStatus(status)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                          interview.status === status
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
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
            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800/50 dark:to-purple-900/20 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Analyze Job Posting</h2>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Paste job posting URL here"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter a URL to a job posting to get personalized interview preparation materials
                </p>
              </div>
              <button
                onClick={handleAnalyzeJobPost}
                disabled={isAnalyzing || !jobUrl}
                className="whitespace-nowrap px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-purple-400 disabled:to-purple-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow disabled:cursor-not-allowed transform hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze Job Post</span>
                  </>
                )}
              </button>
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

          {/* Replace the tabs with a more modern design */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
                {['overview', 'questions', 'skills', 'resources', 'chat'].map((tabName) => (
                  <button
                    key={tabName}
                    onClick={() => setTab(tabName as any)}
                    className={`
                      whitespace-nowrap px-4 py-3 font-medium text-sm border-b-2 transition-colors hover:text-purple-700 dark:hover:text-purple-400
                      ${tab === tabName
                        ? 'border-purple-500 text-purple-700 dark:text-purple-400 dark:border-purple-400'
                        : 'border-transparent text-gray-600 dark:text-gray-300'}
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      {tabName === 'overview' && <LayoutDashboard className="w-4 h-4" />}
                      {tabName === 'questions' && <HelpCircle className="w-4 h-4" />}
                      {tabName === 'skills' && <Briefcase className="w-4 h-4" />}
                      {tabName === 'resources' && <BookOpen className="w-4 h-4" />}
                      {tabName === 'chat' && <MessageSquare className="w-4 h-4" />}
                      <span className="capitalize">{tabName === 'chat' ? 'Interview Trainer' : tabName}</span>
                    </span>
                  </button>
                ))}
              </div>
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
                <div className="mx-auto w-20 h-20 text-gray-300 dark:text-gray-700 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No analysis available</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-lg mx-auto">
                  Enter a job posting URL above and click "Analyze Job Post" to get personalized interview preparation.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                  Our AI will analyze the job post and provide key insights, likely interview questions, and preparation tips tailored to this position.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {tab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {/* Company overview card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        <Building className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Company Overview
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {interview.preparation.companyInfo || 'No company information available.'}
                      </p>
                    </motion.div>
                    
                    {/* Position details card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        <Briefcase className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Position Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {interview.preparation.positionDetails || 'No position details available.'}
                      </p>
                    </motion.div>
                    
                    {/* Culture fit card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        <MessageSquare className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Cultural Fit
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {interview.preparation.cultureFit || 'No culture information available.'}
                      </p>
                    </motion.div>
                    
                    {/* Key points card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Key Points to Emphasize
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {interview.preparation.keyPoints?.map((point, index) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex items-start text-gray-600 dark:text-gray-300"
                          >
                            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
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
                      <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 border-3 border-t-purple-500 border-purple-200 rounded-full animate-spin"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generating new questions...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Interview Questions
                      </h3>
                      {interview.preparation?.suggestedQuestions && interview.preparation.suggestedQuestions.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={regenerateQuestions}
                          disabled={isRegeneratingQuestions}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRegeneratingQuestions ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          <span>Generate New Questions</span>
                        </motion.button>
                      )}
                    </div>
                    
                    {interview.preparation?.suggestedQuestions?.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                          Question {index + 1}
                        </h3>
                        <p className="mb-5 text-gray-700 dark:text-gray-200">
                          {question}
                        </p>
                        
                        <div className="pl-5 border-l-2 border-purple-200 dark:border-purple-900">
                          <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                            Suggested Answer Approach
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {interview.preparation?.suggestedAnswers && 
                             interview.preparation.suggestedAnswers[index] && 
                             typeof interview.preparation.suggestedAnswers[index] === 'object' && 
                             'answer' in interview.preparation.suggestedAnswers[index]
                              ? (interview.preparation.suggestedAnswers[index] as { answer: string }).answer
                              : "Structure your answer using the STAR method: Situation, Task, Action, Result. Focus on highlighting relevant experience and skills from your background that match the job requirements."}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {(!interview.preparation?.suggestedQuestions || interview.preparation.suggestedQuestions.length === 0) && (
                      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                          No suggested questions available
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
                        Required Skills & Qualifications
                      </h3>
                      
                      <div className="space-y-4">
                        {interview.preparation.requiredSkills?.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start"
                          >
                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-md mr-3 flex-shrink-0">
                              <Check className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300">
                                {skill}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        
                        {(!interview.preparation.requiredSkills || interview.preparation.requiredSkills.length === 0) && (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No skills information available
                          </p>
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
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
                        Preparation Tips
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          {
                            title: 'Research the Company',
                            description: 'Look up their mission, values, recent news, and products/services.',
                            icon: <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          },
                          {
                            title: 'Prepare Your STAR Stories',
                            description: 'Create specific examples using the Situation, Task, Action, Result format.',
                            icon: <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          },
                          {
                            title: 'Practice Your Responses',
                            description: 'Rehearse answers to common questions out loud or with a friend.',
                            icon: <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          },
                          {
                            title: 'Prepare Questions to Ask',
                            description: 'Have thoughtful questions ready about the role, team, and company.',
                            icon: <BookmarkPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          },
                          {
                            title: 'Review Job Description',
                            description: 'Align your talking points with the skills and qualifications listed.',
                            icon: <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          },
                          {
                            title: 'Plan Your Presentation',
                            description: 'Prepare what to wear, test your tech for virtual interviews, plan your route.',
                            icon: <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          }
                        ].map((tip, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
                          >
                            <div className="flex items-start">
                              <div className="mr-3 mt-0.5">
                                {tip.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800 dark:text-white text-base mb-2">
                                  {tip.title}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {tip.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
                        Helpful Resources
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          {
                            title: 'Company Glassdoor Reviews',
                            url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`,
                            description: 'Check employee reviews and interview experiences'
                          },
                          {
                            title: 'LinkedIn Company Page',
                            url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`,
                            description: 'Research employees and company updates'
                          },
                          {
                            title: 'Interview Question Database',
                            url: `https://www.glassdoor.com/Interview/index.htm`,
                            description: 'Browse thousands of real interview questions'
                          }
                        ].map((resource, index) => (
                          <motion.a
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors hover:shadow-sm group"
                          >
                            <div className="mr-3 mt-0.5 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                              <LinkIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                {resource.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {resource.description}
                              </p>
                            </div>
                          </motion.a>
                        ))}
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
                          // Process assistant messages to make them more concise
                          let displayContent = msg.content;
                          let isLongMessage = false;
                          
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
                                  
                                  {isLongMessage && (
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
                            className="absolute w-[250px] rounded-lg shadow-lg cursor-move"
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
                                className="text-sm text-gray-700 line-clamp-3"
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
                      style={{ height: '200px' }}
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
                        <div className="mt-2 flex-1 overflow-hidden">
                          <p className="text-sm text-gray-700 line-clamp-6">
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