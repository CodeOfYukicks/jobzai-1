import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity,
  Calendar,
  Calendar as CalIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Download,
  Edit2,
  ExternalLink,
  FileIcon,
  FileText,
  LayoutGrid,
  LineChart,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PieChart,
  Plus,
  PlusCircle,
  Search,
  Send,
  Trash2,
  TrendingUp,
  Target,
  User,
  Users,
  X,
  Sparkles,
  Loader2,
  Link,
  Info,
  Briefcase,
  Building,
  Filter,
  XCircle,
  Image,
  Camera,
  Settings,
  FolderKanban,
} from 'lucide-react';
import { notify } from '@/lib/notify';
import AuthLayout from '../components/AuthLayout';
import PageHeader from '../components/PageHeader';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { extractJobInfo, DetailedJobInfo } from '../lib/jobExtractor';
import DatePicker from '../components/ui/DatePicker';
import { JobApplication, Interview, StatusChange, AutomationSettings, defaultAutomationSettings, KanbanBoard, BOARD_COLORS, BOARD_TYPE_COLUMNS, JOB_COLUMN_LABELS, CAMPAIGN_COLUMN_LABELS, BoardType, RelationshipGoal, WarmthLevel, OutreachChannel, RELATIONSHIP_GOAL_LABELS, WARMTH_LEVEL_LABELS, OUTREACH_CHANNEL_CONFIG, MEETING_TYPE_LABELS, MeetingType } from '../types/job';
import { ApplicationList } from '../components/application/ApplicationList';
import { JobDetailPanel } from '../components/job-detail-panel';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import AutomationSettingsModal from '../components/application/AutomationSettingsModal';
import { checkAndApplyAutomations, isApplicationInactive, getInactiveDays } from '../lib/automationEngine';
import { BoardSettingsModal, BoardsOverview, MoveToBoardModal, DeleteBoardModal } from '../components/boards';
import { RelationshipGoalSelector } from '../components/outreach';
import { WarmthIndicator } from '../components/outreach';
import { useAssistantPageData, summarizeApplications } from '../hooks/useAssistantPageData';

export default function JobApplicationsPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{ show: boolean; application?: JobApplication }>({ show: false });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; application?: JobApplication }>({ show: false });
  const [newApplicationModal, setNewApplicationModal] = useState(false);
  const [eventType, setEventType] = useState<'application' | 'interview' | null>(null);
  const [formData, setFormData] = useState<Partial<JobApplication> & {
    interviewType?: 'technical' | 'hr' | 'manager' | 'final' | 'other';
    interviewTime?: string;
    interviewDate?: string;
  }>({
    companyName: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: new Date().toISOString().split('T')[0],
    description: '',
    fullJobDescription: '',
    notes: '',
    interviewType: 'technical',
    interviewTime: '09:00',
    interviewDate: new Date().toISOString().split('T')[0],
  });
  const [lookupApplications, setLookupApplications] = useState<JobApplication[]>([]);
  const [lookupSearchQuery, setLookupSearchQuery] = useState('');
  const [lookupSelectedApplication, setLookupSelectedApplication] = useState<JobApplication | null>(null);
  const [showLookupDropdown, setShowLookupDropdown] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [timelineModal, setTimelineModal] = useState(false);
  const [view, setView] = useState<'kanban' | 'analytics' | 'boards'>('boards');
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [showAddInterviewForm, setShowAddInterviewForm] = useState(false);
  const [newInterview, setNewInterview] = useState<Partial<Interview>>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'technical',
    status: 'scheduled',
    location: '',
    notes: ''
  });

  // Filter states
  // Temporal filters
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '3m' | '6m' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string } | null>(null);
  const [updateDateFilter, setUpdateDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [upcomingInterviewsDays, setUpcomingInterviewsDays] = useState<number | null>(null);

  // Interview filters
  const [interviewTypes, setInterviewTypes] = useState<string[]>([]);
  const [interviewStatus, setInterviewStatus] = useState<string[]>([]);
  const [hasInterviews, setHasInterviews] = useState<'all' | 'with' | 'without' | 'upcoming'>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'appliedDate' | 'updatedAt' | 'companyName' | 'position' | 'interviewCount' | 'lastContactedAt' | 'contactName' | 'meetingCount'>('appliedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Track manual order per status (Map<status, string[]> where array contains application IDs in order)
  const [manualOrder, setManualOrder] = useState<Map<string, string[]>>(new Map());
  // Refs for scrollable column containers to enable auto-scroll during drag
  const columnScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Company filters
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Filter UI state
  const [openFilterModal, setOpenFilterModal] = useState<string | null>(null);

  // New Application Form State
  const [showFullForm, setShowFullForm] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1); // For campaign wizard: 1 = Contact, 2 = Strategy

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null); // null = pas encore détecté, true = sombre, false = claire
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Move to interview prompt modal states
  const [showMoveToInterviewPrompt, setShowMoveToInterviewPrompt] = useState(false);
  const [pendingMoveApplication, setPendingMoveApplication] = useState<JobApplication | null>(null);

  // Automation settings states
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(defaultAutomationSettings);
  const [showAutomationSettingsModal, setShowAutomationSettingsModal] = useState(false);
  const automationIntervalRef = useRef<number | null>(null);

  // Multi-board states
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [showBoardSettingsModal, setShowBoardSettingsModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [showDeleteBoardModal, setShowDeleteBoardModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<KanbanBoard | null>(null);
  const [showMoveToBoardModal, setShowMoveToBoardModal] = useState(false);
  const [applicationToMove, setApplicationToMove] = useState<JobApplication | null>(null);

  // Get effective cover photo (board cover takes priority when in a board)
  const currentBoard = boards.find(b => b.id === currentBoardId);
  
  // Get current board type (defaults to 'jobs')
  const currentBoardType: BoardType = currentBoard?.boardType || 'jobs';
  
  const effectiveCoverPhoto = view !== 'boards' && currentBoard?.coverPhoto 
    ? currentBoard.coverPhoto 
    : coverPhoto;

  // Handle file select for cover
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    // Reset input
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  // Handle cropped cover
  const handleCroppedCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
  };

  // Handle direct cover apply from gallery (no cropper)
  const handleDirectApplyCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
  };

  useEffect(() => {
    if (!currentUser) return;

    const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
    const q = query(applicationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const applicationsData: JobApplication[] = [];
      snapshot.forEach((doc) => {
        applicationsData.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      setApplications(applicationsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync selectedApplication with applications updates (for real-time updates like cvAnalysisId)
  useEffect(() => {
    if (selectedApplication && applications.length > 0) {
      const updatedApp = applications.find(a => a.id === selectedApplication.id);
      if (updatedApp && (
        updatedApp.cvAnalysisId !== selectedApplication.cvAnalysisId ||
        updatedApp.updatedAt !== selectedApplication.updatedAt
      )) {
        setSelectedApplication(updatedApp);
      }
    }
  }, [applications]);

  // Load automation settings from Firestore
  useEffect(() => {
    const loadAutomationSettings = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.automationSettings) {
            setAutomationSettings(userData.automationSettings as AutomationSettings);
          }
        }
      } catch (error) {
        console.error('Error loading automation settings:', error);
      }
    };

    loadAutomationSettings();
  }, [currentUser]);

  // Note: Gmail reply checking is now handled globally in useGmailReplyChecker hook (App.tsx)
  // This runs in the background on all pages, not just JobApplicationsPage

  // Load boards from Firestore and create default if needed
  useEffect(() => {
    if (!currentUser) return;

    let isCreatingBoard = false;
    const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
    const q = query(boardsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const boardsData: KanbanBoard[] = [];
      snapshot.forEach((docSnap) => {
        boardsData.push({ id: docSnap.id, ...docSnap.data() } as KanbanBoard);
      });

      console.log('[Boards] Loaded boards:', boardsData.length);
      setBoards(boardsData);

      // Create default board if none exists (prevent duplicate creation)
      if (boardsData.length === 0 && !isCreatingBoard) {
        isCreatingBoard = true;
        console.log('[Boards] No boards found, creating default board...');
        try {
          const defaultBoard = {
            name: 'My Applications',
            description: 'Default board for job applications',
            icon: '📋',
            color: BOARD_COLORS[0],
            isDefault: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          const docRef = await addDoc(boardsRef, defaultBoard);
          console.log('[Boards] Default board created with ID:', docRef.id);
          // The snapshot listener will pick up the new board automatically
        } catch (error) {
          console.error('[Boards] Error creating default board:', error);
          isCreatingBoard = false;
        }
      }
    }, (error) => {
      console.error('[Boards] Error listening to boards:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Board management functions
  const handleCreateBoard = async (boardData: Partial<KanbanBoard>) => {
    if (!currentUser) return;

    try {
      // Filter out undefined values (Firebase doesn't accept undefined)
      const cleanBoardData = Object.fromEntries(
        Object.entries(boardData).filter(([_, v]) => v !== undefined)
      );
      
      const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
      await addDoc(boardsRef, {
        ...cleanBoardData,
        isDefault: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      notify.success('Board created successfully!');
    } catch (error) {
      console.error('Error creating board:', error);
      notify.error('Failed to create board');
      throw error;
    }
  };

  const handleUpdateBoard = async (boardData: Partial<KanbanBoard>) => {
    if (!currentUser || !editingBoard) return;

    try {
      // Filter out undefined values (Firebase doesn't accept undefined)
      const cleanBoardData = Object.fromEntries(
        Object.entries(boardData).filter(([_, v]) => v !== undefined)
      );
      
      const boardRef = doc(db, 'users', currentUser.uid, 'boards', editingBoard.id);
      await updateDoc(boardRef, {
        ...cleanBoardData,
        updatedAt: serverTimestamp(),
      });
      notify.success('Board updated successfully!');
    } catch (error) {
      console.error('Error updating board:', error);
      notify.error('Failed to update board');
      throw error;
    }
  };

  const handleDeleteBoard = async (targetBoardId?: string) => {
    if (!currentUser || !boardToDelete || boardToDelete.isDefault) return;

    try {
      // Get the board type (default to 'jobs' for backwards compatibility)
      const deletedBoardType = boardToDelete.boardType || 'jobs';
      
      // Get applications in this board
      const boardApplications = applications.filter(app => app.boardId === boardToDelete.id);
      
      if (targetBoardId) {
        // Transfer applications to the specified board
        const targetBoard = boards.find(b => b.id === targetBoardId);
        if (targetBoard) {
          for (const app of boardApplications) {
            const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', app.id);
            await updateDoc(appRef, {
              boardId: targetBoard.id,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } else {
        // Delete all applications in this board
        for (const app of boardApplications) {
          const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', app.id);
          await deleteDoc(appRef);
        }
      }

      // Delete the board
      const boardRef = doc(db, 'users', currentUser.uid, 'boards', boardToDelete.id);
      await deleteDoc(boardRef);

      // Switch to default board if we were on the deleted one
      if (currentBoardId === boardToDelete.id) {
        const defaultBoard = boards.find(b => b.isDefault && (b.boardType || 'jobs') === deletedBoardType);
        setCurrentBoardId(defaultBoard?.id || null);
      }

      const message = targetBoardId 
        ? 'Board deleted and applications transferred!' 
        : 'Board and applications deleted!';
      notify.success(message);
    } catch (error) {
      console.error('Error deleting board:', error);
      notify.error('Failed to delete board');
      throw error;
    }
  };

  const handleDuplicateBoard = async (board: KanbanBoard) => {
    if (!currentUser) return;

    try {
      const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
      await addDoc(boardsRef, {
        name: `${board.name} (Copy)`,
        description: board.description,
        icon: board.icon,
        color: board.color,
        customColumns: board.customColumns,
        isDefault: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      notify.success('Board duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating board:', error);
      notify.error('Failed to duplicate board');
    }
  };

  const handleMoveApplicationToBoard = async (targetBoardId: string) => {
    if (!currentUser || !applicationToMove) return;

    try {
      const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationToMove.id);
      await updateDoc(appRef, {
        boardId: targetBoardId,
        updatedAt: serverTimestamp(),
      });
      
      const targetBoard = boards.find(b => b.id === targetBoardId);
      notify.success(`Moved to ${targetBoard?.name || 'board'}`);
      setShowMoveToBoardModal(false);
      setApplicationToMove(null);
    } catch (error) {
      console.error('Error moving application:', error);
      notify.error('Failed to move application');
      throw error;
    }
  };

  // Save automation settings to Firestore
  const handleSaveAutomationSettings = async (settings: AutomationSettings) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        automationSettings: settings,
      });
      setAutomationSettings(settings);
      notify.success('Automation settings saved');
    } catch (error) {
      console.error('Error saving automation settings:', error);
      notify.error('Failed to save automation settings');
      throw error;
    }
  };

  // Apply automations
  const applyAutomations = useCallback(async () => {
    if (!currentUser || applications.length === 0) return;

    try {
      const updates = checkAndApplyAutomations(applications, automationSettings);
      
      if (updates.length === 0) return;

      // Apply updates to Firestore
      for (const update of updates) {
        const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', update.applicationId);
        const app = applications.find((a) => a.id === update.applicationId);
        if (!app) continue;

        const statusHistory = app.statusHistory || [{
          status: app.status,
          date: app.appliedDate,
          notes: 'Initial application',
        }];

        const newStatusChange: StatusChange = {
          status: update.newStatus,
          date: new Date().toISOString().split('T')[0],
          notes: update.reason,
        };

        statusHistory.push(newStatusChange);

        await updateDoc(appRef, {
          status: update.newStatus,
          statusHistory,
          updatedAt: serverTimestamp(),
        });

        // Show toast for each update
        notify.info(`${app.companyName} - ${app.position}: ${update.reason}`, {
          duration: 4000,
        });
      }

      if (updates.length > 0) {
        notify.success(`${updates.length} automation${updates.length > 1 ? 's' : ''} applied`);
      }
    } catch (error) {
      console.error('Error applying automations:', error);
      notify.error('Failed to apply automations');
    }
  }, [currentUser, applications, automationSettings]);

  // Run automations on mount and periodically
  useEffect(() => {
    if (!currentUser || applications.length === 0) return;

    let mounted = true;

    // Run after a short delay to avoid running on every render
    const timeoutId = setTimeout(() => {
      if (mounted) {
        applyAutomations();
      }
    }, 2000);

    // Run every hour
    automationIntervalRef.current = window.setInterval(() => {
      if (mounted) {
        applyAutomations();
      }
    }, 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (automationIntervalRef.current) {
        clearInterval(automationIntervalRef.current);
      }
    };
    // Only run when automationSettings change, not on every application change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, automationSettings]);

  // Handle highlight and board parameters from URL to open application modal
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    const boardId = searchParams.get('board');
    
    if (highlightId && applications.length > 0 && boards.length > 0 && !isLoading) {
      const app = applications.find(a => a.id === highlightId);
      if (app && (!selectedApplication || selectedApplication.id !== highlightId)) {
        // If a board is specified, switch to that board first
        if (boardId) {
          const targetBoard = boards.find(b => b.id === boardId);
          if (targetBoard) {
            setCurrentBoardId(boardId);
            setView('kanban');
          }
        } else if (app.boardId) {
          // If no board in URL but app has a boardId, switch to that board
          const targetBoard = boards.find(b => b.id === app.boardId);
          if (targetBoard) {
            setCurrentBoardId(app.boardId);
            setView('kanban');
          }
        }
        
        // Open the application modal
        setSelectedApplication(app);
        setTimelineModal(true);
        
        // Remove params from URL after opening
        searchParams.delete('highlight');
        searchParams.delete('board');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, applications, boards, isLoading, selectedApplication, setSearchParams]);

  // Charger les candidatures existantes quand on sélectionne "interview" dans le modal
  useEffect(() => {
    if (eventType === 'interview' && currentUser) {
      const fetchApplications = async () => {
        try {
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));
          const apps: JobApplication[] = [];
          applicationsSnapshot.forEach((doc) => {
            apps.push({ id: doc.id, ...doc.data() } as JobApplication);
          });
          setLookupApplications(apps);
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      };
      fetchApplications();
    }
  }, [eventType, currentUser]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.application-search-container')) {
        setShowLookupDropdown(false);
      }
    };

    if (showLookupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showLookupDropdown]);

  // Function to detect if cover image is dark or light
  const detectCoverBrightness = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(true); // Default to dark if canvas fails
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Sample pixels from the image (sample every 10th pixel for performance)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let totalBrightness = 0;
          let sampleCount = 0;
          
          for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel (RGBA = 4 bytes)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Calculate luminance using relative luminance formula
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += luminance;
            sampleCount++;
          }
          
          const averageBrightness = totalBrightness / sampleCount;
          // If average brightness is less than 0.5, consider it dark
          resolve(averageBrightness < 0.5);
        } catch (error) {
          console.error('Error detecting cover brightness:', error);
          resolve(true); // Default to dark on error
        }
      };
      
      img.onerror = () => {
        resolve(true); // Default to dark on error
      };
      
      img.src = imageUrl;
    });
  };

  // Load page preferences (cover photo) and detect brightness
  useEffect(() => {
    if (!currentUser) return;

    const loadPagePreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const pagePreferences = userData.pagePreferences || {};
          const applicationsPrefs = pagePreferences.applications || {};
          if (applicationsPrefs.coverPhoto) {
            setCoverPhoto(applicationsPrefs.coverPhoto);
            // Detect brightness
            const isDark = await detectCoverBrightness(applicationsPrefs.coverPhoto);
            setIsCoverDark(isDark);
          } else {
            setIsCoverDark(null);
          }
        }
      } catch (error) {
        console.error('Error loading page preferences:', error);
      }
    };

    loadPagePreferences();
  }, [currentUser]);

  const fireConfetti = () => {
    // Ultra Premium Side Cannons Confetti
    // Sophisticated dual-origin celebration effect
    
    const defaults = {
      zIndex: 1500,
      ticks: 300,
      gravity: 0.8,
      decay: 0.94,
      shapes: ['circle', 'square'] as confetti.Shape[],
    };

    // Premium color palettes
    const goldColors = ['#FFD700', '#FFC107', '#FFDF00', '#F5DEB3'];
    const roseGoldColors = ['#E8B4B8', '#ECC5C0', '#DBA39A', '#F4C2C2'];
    const champagneColors = ['#F7E7CE', '#FAD6A5', '#FFE4B5', '#FFDAB9'];
    const accentColors = ['#9333EA', '#6366F1', '#A855F7', '#818CF8'];

    // Fire from a specific side with angle
    const fireFromSide = (
      side: 'left' | 'right',
      particleCount: number,
      colors: string[],
      velocity: number,
      spread: number,
      scalar: number,
      drift: number
    ) => {
      const angle = side === 'left' ? 60 : 120;
      const origin = side === 'left' ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
      
      confetti({
        ...defaults,
        particleCount,
        colors,
        startVelocity: velocity,
        spread,
        angle,
        origin,
        scalar,
        drift: side === 'left' ? drift : -drift,
      });
    };

    // Wave 1: Initial high-velocity burst (0ms)
    // Sharp, fast particles that shoot across
    fireFromSide('left', 50, [...goldColors, ...accentColors], 70, 55, 1.0, 1.2);
    fireFromSide('right', 50, [...goldColors, ...accentColors], 70, 55, 1.0, 1.2);

    // Wave 2: Secondary medium burst (150ms)
    // More particles, fuller spread
    setTimeout(() => {
      fireFromSide('left', 80, [...champagneColors, ...roseGoldColors], 55, 70, 1.2, 0.8);
      fireFromSide('right', 80, [...champagneColors, ...roseGoldColors], 55, 70, 1.2, 0.8);
    }, 150);

    // Wave 3: Final floaty burst (300ms)
    // Larger, slower particles that linger elegantly
    setTimeout(() => {
      fireFromSide('left', 60, [...goldColors, ...champagneColors], 40, 85, 1.4, 0.5);
      fireFromSide('right', 60, [...goldColors, ...champagneColors], 40, 85, 1.4, 0.5);
    }, 300);

    // Wave 4: Trailing sparkle burst (450ms)
    // Small accent particles for a finishing touch
    setTimeout(() => {
      fireFromSide('left', 40, [...roseGoldColors, ...accentColors], 35, 90, 0.8, 0.3);
      fireFromSide('right', 40, [...roseGoldColors, ...accentColors], 35, 90, 0.8, 0.3);
    }, 450);
  };

  // Handle cover photo update - context aware (board or global page)
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const isInBoard = view !== 'boards' && currentBoardId;
      const fileName = isInBoard 
        ? `board_cover_${currentBoardId}_${timestamp}.jpg`
        : `applications_cover_${timestamp}.jpg`;
      const storagePath = isInBoard
        ? `board-covers/${currentUser.uid}/${fileName}`
        : `cover-photos/${currentUser.uid}/${fileName}`;
      const coverRef = ref(storage, storagePath);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      // Delete old cover if exists
      const oldCover = isInBoard ? currentBoard?.coverPhoto : coverPhoto;
      if (oldCover) {
        try {
          const urlParts = oldCover.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const oldCoverRef = ref(storage, decodedPath);
            await deleteObject(oldCoverRef);
          }
        } catch (e) {
          console.warn('Could not delete old cover photo from storage', e);
        }
      }

      if (isInBoard && currentBoardId) {
        // Update board cover in Firestore
        const boardRef = doc(db, 'users', currentUser.uid, 'boards', currentBoardId);
        await updateDoc(boardRef, {
          coverPhoto: coverUrl,
          updatedAt: serverTimestamp(),
        });
        notify.success('Board cover updated');
      } else {
        // Update global page cover in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentApplicationsPrefs = currentPagePreferences.applications || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          applications: {
            ...currentApplicationsPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);
        notify.success('Cover updated');
      }
      
      // Detect brightness of new cover
      const isDark = await detectCoverBrightness(coverUrl);
      setIsCoverDark(isDark);
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Handle cover photo removal - context aware (board or global page)
  const handleRemoveCover = async () => {
    if (!currentUser) return;

    const isInBoard = view !== 'boards' && currentBoardId;
    const targetCover = isInBoard ? currentBoard?.coverPhoto : coverPhoto;
    
    if (!targetCover) return;

    setIsUpdatingCover(true);
    try {
      // Delete from storage
      try {
        const urlParts = targetCover.split('/o/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split('?')[0];
          const decodedPath = decodeURIComponent(pathPart);
          const coverRef = ref(storage, decodedPath);
          await deleteObject(coverRef);
        }
      } catch (e) {
        console.warn('Could not delete cover photo from storage', e);
      }

      if (isInBoard && currentBoardId) {
        // Remove board cover from Firestore
        const boardRef = doc(db, 'users', currentUser.uid, 'boards', currentBoardId);
        await updateDoc(boardRef, {
          coverPhoto: null,
          updatedAt: serverTimestamp(),
        });
        notify.success('Board cover removed');
      } else {
        // Remove global page cover from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentApplicationsPrefs = currentPagePreferences.applications || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          applications: {
            ...currentApplicationsPrefs,
            coverPhoto: null
          }
        }
      });

      setCoverPhoto(null);
      notify.success('Cover removed');
      }
      
      setIsCoverDark(null);
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Fonction pour extraire les informations depuis l'URL avec AI
  const handleExtractJobInfo = async () => {
    if (!formData.url || !formData.url.trim()) {
      notify.error('Please enter a job URL first');
      return;
    }

    setIsAnalyzingJob(true);
    notify.info('Analyzing job posting...', { duration: 2000 });

    try {
      const jobUrl = formData.url.trim();

      // Use shared extraction utility with detailed mode
      const extractedData = await extractJobInfo(jobUrl, { detailed: true }) as DetailedJobInfo;

      console.log('Successfully extracted data:', extractedData);

      // Format the summary for description - structured format with 3 bullet points
      let formattedDescription = extractedData.summary;
      if (formattedDescription) {
        // Ensure proper formatting (unescape JSON escapes)
        formattedDescription = formattedDescription
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .trim();

        // Ensure bullets are properly formatted (• or -)
        if (!formattedDescription.includes('•') && !formattedDescription.includes('-')) {
          const lines = formattedDescription.split('\n').filter((line: string) => line.trim().length > 0);
          if (lines.length > 0) {
            formattedDescription = lines.map((line: string) => {
              const trimmed = line.trim();
              if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                return `• ${trimmed}`;
              }
              return trimmed;
            }).join('\n');
          }
        }

        // Add visual separation if description already exists
        if (formData.description && formData.description.trim()) {
          formattedDescription = `${formData.description}\n\n---\n\n${formattedDescription}`;
        }
      }

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        companyName: extractedData.companyName || prev.companyName,
        position: extractedData.position || prev.position,
        location: extractedData.location || prev.location,
        description: formattedDescription || prev.description || '',
        fullJobDescription: extractedData.fullJobDescription || prev.fullJobDescription || '',
        jobInsights: extractedData.jobInsights || prev.jobInsights,
        jobTags: extractedData.jobTags || prev.jobTags
      }));

      setShowFullForm(true);
      notify.success('Job information extracted successfully!');
    } catch (error) {
      console.error('Error extracting job info:', error);
      notify.error(`Failed to extract job information: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill in the fields manually.`);
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!currentUser) {
      notify.error('You must be logged in');
      return;
    }

    if (!eventType) {
      notify.error('Please select an event type first');
      return;
    }

    try {
      if (eventType === 'application') {
        // Determine default status based on board type
        const defaultStatus = currentBoardType === 'campaigns' ? 'targets' : 'applied';
        
        // For campaigns, use contactRole as position if position is empty
        const effectivePosition = currentBoardType === 'campaigns' 
          ? (formData.position || formData.contactRole || 'Outreach')
          : formData.position;
        
        // For campaigns, location is optional
        const effectiveLocation = currentBoardType === 'campaigns'
          ? (formData.location || '')
          : formData.location;

        // Formatage des données avant envoi
        const newApplication: any = {
          companyName: formData.companyName,
          position: effectivePosition,
          location: effectiveLocation,
          status: defaultStatus,
          appliedDate: formData.appliedDate,
          url: formData.url || '',
          description: formData.description || '',  // AI-powered summary (3 bullet points)
          fullJobDescription: formData.fullJobDescription || '',  // Complete job description from posting
          notes: formData.notes || '',              // User's personal notes
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Ajout de valeurs par défaut pour les champs optionnels
          contactName: formData.contactName || '',
          contactEmail: formData.contactEmail || '',
          contactPhone: formData.contactPhone || '',
          salary: formData.salary || '',
          // Initialize arrays for new features
          generatedEmails: [],
          stickyNotes: [],
          // Initialize jobInsights if extracted by AI
          ...(formData.jobInsights && { jobInsights: formData.jobInsights }),
          // Initialize jobTags if extracted by AI
          ...(formData.jobTags && { jobTags: formData.jobTags }),
          // Campaign-specific fields
          ...(currentBoardType === 'campaigns' && {
            contactRole: formData.contactRole || '',
            contactLinkedIn: formData.contactLinkedIn || '',
            outreachChannel: formData.outreachChannel || 'email',
            messageSent: formData.messageSent || '',
            relationshipGoal: formData.relationshipGoal || 'networking',
            warmthLevel: formData.warmthLevel || 'cold',
            lastContactedAt: formData.appliedDate || new Date().toISOString().split('T')[0],
            conversationHistory: [],
            meetings: [],
          }),
          // Associate with current board
          ...(currentBoardId && { boardId: currentBoardId }),
        };

        // Vérification des champs requis - different for jobs vs campaigns
        if (currentBoardType === 'campaigns') {
          if (!newApplication.companyName || !newApplication.contactName || !newApplication.appliedDate) {
            notify.error('Please fill in Company Name, Contact Name and Contact Date');
            return;
          }
        } else {
          if (!newApplication.companyName || !newApplication.position || !newApplication.location || !newApplication.appliedDate) {
            notify.error('Please fill in all required fields');
            return;
          }
        }

        // Création du document dans Firestore
        const docRef = await addDoc(
          collection(db, 'users', currentUser.uid, 'jobApplications'),
          newApplication
        );

        // Si la création réussit, on ferme le modal et réinitialise le formulaire
        setNewApplicationModal(false);
        setEventType(null);
        setLookupSelectedApplication(null);
        setLinkedApplicationId(null);
        setLookupSearchQuery('');
        setShowLookupDropdown(false);
        setFormData({
          companyName: '',
          position: '',
          location: '',
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0],
          url: '',
          description: '',
          fullJobDescription: '',
          notes: '',
          interviewType: 'technical',
          interviewTime: '09:00',
          interviewDate: new Date().toISOString().split('T')[0],
        });

        notify.success('Application created successfully');
      } else {
        // Pour un entretien, vérifier si une candidature existe déjà
        let existingApplication: any = null;
        let applicationId: string;

        // Si un ID de candidature est fourni (lié depuis le modal), l'utiliser directement
        if (linkedApplicationId) {
          applicationId = linkedApplicationId;
          const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
          const applicationDoc = await getDoc(applicationRef);
          if (applicationDoc.exists()) {
            existingApplication = { id: applicationDoc.id, ...applicationDoc.data() };
          }
        } else {
          // Sinon, chercher par nom d'entreprise et poste
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));

          applicationsSnapshot.forEach(doc => {
            const app = doc.data() as any;
            if (
              app.companyName?.toLowerCase() === formData.companyName?.toLowerCase() &&
              app.position?.toLowerCase() === formData.position?.toLowerCase()
            ) {
              existingApplication = { id: doc.id, ...app };
            }
          });

          if (existingApplication) {
            applicationId = existingApplication.id;
          } else {
            // Créer une nouvelle candidature
            const applicationData = {
              companyName: formData.companyName,
              position: formData.position,
              location: formData.location || '',
              status: 'interview',
              appliedDate: formData.interviewDate || new Date().toISOString().split('T')[0],
              notes: formData.notes || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              statusHistory: [{
                status: 'applied',
                date: formData.interviewDate || new Date().toISOString().split('T')[0],
                notes: 'Application created from job applications page'
              }, {
                status: 'interview',
                date: formData.interviewDate || new Date().toISOString().split('T')[0],
                notes: 'Interview scheduled from job applications page'
              }]
            };

            const docRef = await addDoc(
              collection(db, 'users', currentUser.uid, 'jobApplications'),
              applicationData
            );

            applicationId = docRef.id;
          }
        }

        // Vérification des champs requis pour l'interview
        if (!formData.companyName || !formData.position || !formData.interviewDate) {
          notify.error('Please fill in all required fields');
          return;
        }

        // Ajouter l'entretien
        const interviewData = {
          id: crypto.randomUUID(),
          date: formData.interviewDate,
          time: formData.interviewTime || '09:00',
          type: formData.interviewType || 'technical',
          status: 'scheduled',
          location: formData.location || '',
          notes: formData.notes || '',
          contactName: formData.contactName || '',
          contactEmail: formData.contactEmail || ''
        };

        // Check if we should prompt user to move to interview column
        const currentStatus = existingApplication?.status || 'applied';
        const shouldPromptMove = (currentStatus === 'wishlist' || currentStatus === 'applied' || currentStatus === 'pending_decision');

        // Mise à jour de la candidature avec le nouvel entretien (don't change status yet if prompting)
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        if (shouldPromptMove && existingApplication) {
          // Just add interview, keep current status
          await updateDoc(applicationRef, {
            interviews: existingApplication.interviews ? [...existingApplication.interviews, interviewData] : [interviewData],
            updatedAt: serverTimestamp()
          });

          // Fetch updated application to show in modal
          const updatedDoc = await getDoc(applicationRef);
          if (updatedDoc.exists()) {
            const updatedApp = { id: updatedDoc.id, ...updatedDoc.data() } as JobApplication;
            setPendingMoveApplication(updatedApp);
            setShowMoveToInterviewPrompt(true);
          }
        } else {
          // New application or status already interview - update status immediately
          await updateDoc(applicationRef, {
            interviews: existingApplication?.interviews ? [...existingApplication.interviews, interviewData] : [interviewData],
            status: 'interview',
            updatedAt: serverTimestamp(),
            statusHistory: existingApplication?.statusHistory ?
              [...existingApplication.statusHistory, {
                status: 'interview',
                date: formData.interviewDate,
                notes: 'Interview added from job applications page'
              }] :
              [{
                status: 'applied',
                date: formData.interviewDate || new Date().toISOString().split('T')[0],
                notes: 'Application created from job applications page'
              }, {
                status: 'interview',
                date: formData.interviewDate,
                notes: 'Interview scheduled from job applications page'
              }]
          });
          notify.success('Interview added successfully');
        }

        // Si la création réussit, on ferme le modal et réinitialise le formulaire
        setNewApplicationModal(false);
        setEventType(null);
        setLookupSelectedApplication(null);
        setLinkedApplicationId(null);
        setLookupSearchQuery('');
        setShowLookupDropdown(false);
        setFormData({
          companyName: '',
          position: '',
          location: '',
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0],
          url: '',
          description: '',
          fullJobDescription: '',
          notes: '',
          interviewType: 'technical',
          interviewTime: '09:00',
          interviewDate: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error creating application/interview:', error);
      notify.error('Failed to create: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateApplication = async () => {
    if (!currentUser || !editModal.application) return;

    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', editModal.application.id);

      await updateDoc(applicationRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      setEditModal({ show: false });
      notify.success('Application updated successfully');
    } catch (error) {
      console.error('Error updating application:', error);
      notify.error('Failed to update application');
    }
  };

  const handleDeleteApplication = async () => {
    if (!currentUser || !deleteModal.application) return;

    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', deleteModal.application.id);

      // Optimistically update the UI first
      setApplications(prevApplications =>
        prevApplications.filter(app => app.id !== deleteModal.application?.id)
      );

      // Then delete from Firestore
      await deleteDoc(applicationRef);

      // Close the modal
      setDeleteModal({ show: false });

      // Show success toast
      notify.success('Application deleted successfully');

      // Close timeline modal if it's open for the deleted application
      if (timelineModal && selectedApplication?.id === deleteModal.application.id) {
        setTimelineModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      notify.error('Failed to delete application');

      // If there was an error, revert the optimistic update
      // by refreshing the applications from Firestore
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const q = query(applicationsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const applicationsData: JobApplication[] = [];
        snapshot.forEach((doc) => {
          applicationsData.push({ id: doc.id, ...doc.data() } as JobApplication);
        });
        setApplications(applicationsData);
      });

      // Cleanup the temporary listener
      setTimeout(() => unsubscribe(), 2000);
    }
  };

  // Fonction pour ajouter un interview directement depuis la modal Timeline
  const handleAddInterview = async () => {
    if (!currentUser || !selectedApplication) return;

    try {
      // Valider les champs requis
      if (!newInterview.date || !newInterview.time) {
        notify.error('Please fill in date and time');
        return;
      }

      // Créer le nouvel interview
      const interview: Interview = {
        id: crypto.randomUUID(),
        date: newInterview.date!,
        time: newInterview.time!,
        type: newInterview.type || 'technical',
        status: newInterview.status || 'scheduled',
        location: newInterview.location || '',
        notes: newInterview.notes || ''
      };

      // Mettre à jour l'application avec le nouvel interview
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
      const updatedInterviews = [...(selectedApplication.interviews || []), interview];

      // Check if we should prompt user to move to interview column
      const shouldPromptMove = (selectedApplication.status === 'wishlist' || selectedApplication.status === 'applied' || selectedApplication.status === 'pending_decision') && interview.status === 'scheduled';

      // Update interviews without changing status yet (let user decide via modal)
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });

      // Mettre à jour l'état local (keep current status for now)
      const updatedApplication = {
        ...selectedApplication,
        interviews: updatedInterviews,
        status: selectedApplication.status // Keep current status
      };
      setSelectedApplication(updatedApplication);

      // Mettre à jour la liste des applications
      setApplications(prev => prev.map(app =>
        app.id === selectedApplication.id ? updatedApplication : app
      ));

      // Réinitialiser le formulaire
      setNewInterview({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'technical',
        status: 'scheduled',
        location: '',
        notes: ''
      });
      setShowAddInterviewForm(false);

      // Show prompt modal if status is wishlist or applied
      if (shouldPromptMove) {
        setPendingMoveApplication(updatedApplication);
        setShowMoveToInterviewPrompt(true);
      } else {
        notify.success('Interview added successfully!');
      }
    } catch (error) {
      console.error('Error adding interview:', error);
      notify.error('Failed to add interview');
    }
  };

  // Handle moving application to interview column
  const handleMoveToInterview = async () => {
    if (!currentUser || !pendingMoveApplication) return;

    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', pendingMoveApplication.id);
      
      // Add status history entry
      const statusHistory = pendingMoveApplication.statusHistory || [{
        status: pendingMoveApplication.status,
        date: pendingMoveApplication.appliedDate,
        notes: 'Initial application'
      }];
      statusHistory.push({
        status: 'interview',
        date: new Date().toISOString().split('T')[0],
        notes: 'Moved to interview column after scheduling interview'
      });

      // Update status to interview
      await updateDoc(applicationRef, {
        status: 'interview',
        statusHistory,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const updatedApplication = {
        ...pendingMoveApplication,
        status: 'interview' as const,
        statusHistory
      };

      setApplications(prev => prev.map(app =>
        app.id === pendingMoveApplication.id ? updatedApplication : app
      ));

      // Update selected application if it's the same one
      if (selectedApplication?.id === pendingMoveApplication.id) {
        setSelectedApplication(updatedApplication);
      }

      // Close modal and show success
      setShowMoveToInterviewPrompt(false);
      setPendingMoveApplication(null);
      notify.success('Application moved to Interview column');
    } catch (error) {
      console.error('Error moving application to interview:', error);
      notify.error('Failed to move application');
    }
  };

  // Get applications for current board only (for filters)
  const currentBoardApplications = useMemo(() => {
    if (!currentBoardId || view === 'boards') {
      return applications;
    }
    const defaultBoard = boards.find(b => b.isDefault);
    return applications.filter(app => {
      if (!app.boardId) {
        return defaultBoard?.id === currentBoardId;
      }
      return app.boardId === currentBoardId;
    });
  }, [applications, currentBoardId, boards, view]);

  // Get unique companies for company filter (only from current board)
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(currentBoardApplications.map(app => app.companyName))).sort();
  }, [currentBoardApplications]);

  // Main filter function that combines all filters
  const applyFilters = (apps: JobApplication[]): JobApplication[] => {
    let filtered = [...apps];

    // Board filter - filter by current board
    if (currentBoardId && view !== 'boards') {
      const defaultBoard = boards.find(b => b.isDefault);
      filtered = filtered.filter(app => {
        // Applications without boardId belong to the default board
        if (!app.boardId) {
          return defaultBoard?.id === currentBoardId;
        }
        return app.boardId === currentBoardId;
      });
    }

    // Text search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(app =>
        (app.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.contactName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Company filter
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(app => selectedCompanies.includes(app.companyName));
    }

    // Date filter (applied date for jobs, lastContactedAt for campaigns)
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'custom':
          if (customDateRange) {
            filtered = filtered.filter(app => {
              const dateField = currentBoardType === 'campaigns' 
                ? (app.lastContactedAt || app.appliedDate) 
                : app.appliedDate;
              const appDate = new Date(dateField);
              const startDate = new Date(customDateRange.start);
              const endDate = new Date(customDateRange.end);
              return appDate >= startDate && appDate <= endDate;
            });
            break;
          }
          break;
      }

      if (dateFilter !== 'custom' || !customDateRange) {
        filtered = filtered.filter(app => {
          const dateField = currentBoardType === 'campaigns' 
            ? (app.lastContactedAt || app.appliedDate) 
            : app.appliedDate;
          const appDate = new Date(dateField);
          return appDate >= filterDate;
        });
      }
    }

    // Update date filter
    if (updateDateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (updateDateFilter) {
        case '24h':
          filterDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter(app => {
        const updatedAt = app.updatedAt ? new Date(app.updatedAt) : new Date(app.createdAt);
        return updatedAt >= filterDate;
      });
    }

    // Interview/Meeting filters (interviews for jobs, meetings for campaigns)
    if (hasInterviews !== 'all') {
      if (currentBoardType === 'campaigns') {
        // For campaigns, use meetings
        if (hasInterviews === 'with') {
          filtered = filtered.filter(app => app.meetings && app.meetings.length > 0);
        } else if (hasInterviews === 'without') {
          filtered = filtered.filter(app => !app.meetings || app.meetings.length === 0);
        } else if (hasInterviews === 'upcoming') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          filtered = filtered.filter(app => {
            if (!app.meetings || app.meetings.length === 0) return false;
            return app.meetings.some(meeting => {
              const meetingDate = new Date(meeting.date);
              meetingDate.setHours(0, 0, 0, 0);
              return meetingDate >= today && meeting.status === 'scheduled';
            });
          });
        }
      } else {
        // For jobs, use interviews
      if (hasInterviews === 'with') {
        filtered = filtered.filter(app => app.interviews && app.interviews.length > 0);
      } else if (hasInterviews === 'without') {
        filtered = filtered.filter(app => !app.interviews || app.interviews.length === 0);
      } else if (hasInterviews === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(app => {
          if (!app.interviews || app.interviews.length === 0) return false;
          return app.interviews.some(interview => {
            const interviewDate = new Date(interview.date);
            interviewDate.setHours(0, 0, 0, 0);
            return interviewDate >= today && interview.status === 'scheduled';
          });
        });
        }
      }
    }

    // Interview/Meeting type filter
    if (interviewTypes.length > 0) {
      if (currentBoardType === 'campaigns') {
        filtered = filtered.filter(app => {
          if (!app.meetings || app.meetings.length === 0) return false;
          return app.meetings.some(meeting => interviewTypes.includes(meeting.type));
        });
      } else {
      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => interviewTypes.includes(interview.type));
      });
      }
    }

    // Interview/Meeting status filter
    if (interviewStatus.length > 0) {
      if (currentBoardType === 'campaigns') {
        filtered = filtered.filter(app => {
          if (!app.meetings || app.meetings.length === 0) return false;
          return app.meetings.some(meeting => interviewStatus.includes(meeting.status));
        });
      } else {
      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => interviewStatus.includes(interview.status));
      });
      }
    }

    // Upcoming interviews/meetings days filter
    if (upcomingInterviewsDays !== null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + upcomingInterviewsDays);

      if (currentBoardType === 'campaigns') {
        filtered = filtered.filter(app => {
          if (!app.meetings || app.meetings.length === 0) return false;
          return app.meetings.some(meeting => {
            const meetingDate = new Date(meeting.date);
            meetingDate.setHours(0, 0, 0, 0);
            return meetingDate >= today && meetingDate <= futureDate && meeting.status === 'scheduled';
          });
        });
      } else {
      filtered = filtered.filter(app => {
        if (!app.interviews || app.interviews.length === 0) return false;
        return app.interviews.some(interview => {
          const interviewDate = new Date(interview.date);
          interviewDate.setHours(0, 0, 0, 0);
          return interviewDate >= today && interviewDate <= futureDate && interview.status === 'scheduled';
        });
      });
      }
    }

    // Group by status to apply manual order per status
    const groupedByStatus = new Map<string, JobApplication[]>();
    filtered.forEach(app => {
      const status = app.status;
      if (!groupedByStatus.has(status)) {
        groupedByStatus.set(status, []);
      }
      groupedByStatus.get(status)!.push(app);
    });

    // Apply manual order and sorting per status group
    const result: JobApplication[] = [];
    groupedByStatus.forEach((statusApps, status) => {
      // Check if there's a manual order for this status
      const manualOrderForStatus = manualOrder.get(status);
      
      if (manualOrderForStatus && manualOrderForStatus.length > 0) {
        // Use manual order: create a map for quick lookup
        const appMap = new Map(statusApps.map(app => [app.id, app]));
        const orderedApps: JobApplication[] = [];
        
        // First, add apps in manual order
        manualOrderForStatus.forEach(id => {
          const app = appMap.get(id);
          if (app) {
            orderedApps.push(app);
            appMap.delete(id);
          }
        });
        
        // Then add any remaining apps (new apps not in manual order) and sort them
        const remainingApps = Array.from(appMap.values());
        remainingApps.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'appliedDate':
              comparison = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
              break;
            case 'lastContactedAt':
              const aLastContact = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : new Date(a.appliedDate).getTime();
              const bLastContact = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : new Date(b.appliedDate).getTime();
              comparison = aLastContact - bLastContact;
              break;
            case 'updatedAt':
              const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
              const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
              comparison = aUpdated - bUpdated;
              break;
            case 'companyName':
              comparison = a.companyName.localeCompare(b.companyName);
              break;
            case 'position':
              comparison = a.position.localeCompare(b.position);
              break;
            case 'contactName':
              const aContact = (a.contactName || '').localeCompare(b.contactName || '');
              comparison = aContact;
              break;
            case 'interviewCount':
              const aCount = a.interviews?.length || 0;
              const bCount = b.interviews?.length || 0;
              comparison = aCount - bCount;
              break;
            case 'meetingCount':
              const aMeetingCount = a.meetings?.length || 0;
              const bMeetingCount = b.meetings?.length || 0;
              comparison = aMeetingCount - bMeetingCount;
              break;
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        result.push(...orderedApps, ...remainingApps);
      } else {
        // No manual order: apply normal sorting
        statusApps.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'appliedDate':
              comparison = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
              break;
            case 'lastContactedAt':
              const aLastContact = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : new Date(a.appliedDate).getTime();
              const bLastContact = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : new Date(b.appliedDate).getTime();
              comparison = aLastContact - bLastContact;
              break;
            case 'updatedAt':
              const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
              const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
              comparison = aUpdated - bUpdated;
              break;
            case 'companyName':
              comparison = a.companyName.localeCompare(b.companyName);
              break;
            case 'position':
              comparison = a.position.localeCompare(b.position);
              break;
            case 'contactName':
              const aContact = (a.contactName || '').localeCompare(b.contactName || '');
              comparison = aContact;
              break;
            case 'interviewCount':
              const aCount = a.interviews?.length || 0;
              const bCount = b.interviews?.length || 0;
              comparison = aCount - bCount;
              break;
            case 'meetingCount':
              const aMeetingCount = a.meetings?.length || 0;
              const bMeetingCount = b.meetings?.length || 0;
              comparison = aMeetingCount - bMeetingCount;
              break;
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        result.push(...statusApps);
      }
    });

    return result;
  };

  const filteredApplications = applyFilters(applications);

  // Register page data with AI Assistant - Enhanced with actionable insights
  const applicationsSummary = useMemo(() => {
    // Filter applications by current board if a board is selected
    // NOTE: Applications without boardId belong to the default board!
    const defaultBoard = boards.find(b => b.isDefault);
    const relevantApplications = currentBoard 
      ? applications.filter(app => {
          if (!app.boardId) {
            // Applications without boardId belong to the default board
            return currentBoard.isDefault || defaultBoard?.id === currentBoard.id;
          }
          return app.boardId === currentBoard.id;
        })
      : applications;
    
    const byStatus: Record<string, number> = {};
    const byCompany: Record<string, number> = {};
    const now = new Date();
    
    relevantApplications.forEach(app => {
      const status = app.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      const company = app.companyName || 'Unknown';
      byCompany[company] = (byCompany[company] || 0) + 1;
    });

    // Calculate days since application for each app
    const getAppAge = (app: JobApplication) => {
      const appDate = new Date(app.appliedDate || app.createdAt || now);
      return Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Find stale applications (7+ days, still in applied/pending status)
    const staleApplications = relevantApplications
      .filter(app => {
        const age = getAppAge(app);
        return age >= 7 && ['applied', 'pending', 'submitted'].includes(app.status || '');
      })
      .sort((a, b) => getAppAge(b) - getAppAge(a))
      .slice(0, 5)
      .map(app => ({
        company: app.companyName,
        position: app.position,
        daysSinceApplied: getAppAge(app),
        appliedDate: app.appliedDate,
      }));

    // Hot opportunities (interviewing, offer stages)
    const hotOpportunities = relevantApplications
      .filter(app => ['interviewing', 'interview', 'offer', 'offered', 'final_round'].includes(app.status || ''))
      .map(app => ({
        company: app.companyName,
        position: app.position,
        status: app.status,
        nextInterview: app.interviews?.find(i => i.status === 'scheduled')?.date,
      }));

    // Applications needing follow-up (10-14 days old, no response)
    const needsFollowUp = relevantApplications
      .filter(app => {
        const age = getAppAge(app);
        return age >= 10 && age <= 21 && ['applied', 'pending', 'submitted'].includes(app.status || '');
      })
      .slice(0, 3)
      .map(app => ({
        company: app.companyName,
        position: app.position,
        daysSinceApplied: getAppAge(app),
        suggestion: `Send a follow-up email to ${app.companyName}`,
      }));

    // Recent wins (offers, interviews in last 7 days)
    const recentWins = relevantApplications
      .filter(app => {
        const age = getAppAge(app);
        return age <= 7 && ['interviewing', 'interview', 'offer', 'offered'].includes(app.status || '');
      })
      .map(app => ({
        company: app.companyName,
        status: app.status,
        type: app.status?.includes('offer') ? 'offer' : 'interview',
      }));

    return {
      // ===== IMPORTANT: USE THESE NUMBERS FOR TOTAL COUNTS =====
      TOTAL_APPLICATIONS: relevantApplications.length, // <-- USE THIS NUMBER!
      total: relevantApplications.length,
      byStatus, // <-- USE THIS FOR STATUS BREAKDOWN!
      // ===== Actionable insights =====
      insights: {
        staleApplicationsCount: staleApplications.length,
        staleApplications: staleApplications,
        hotOpportunitiesCount: hotOpportunities.length,
        hotOpportunities: hotOpportunities,
        needsFollowUp: needsFollowUp,
        recentWins: recentWins,
        responseRate: relevantApplications.length > 0 
          ? Math.round((relevantApplications.filter(a => !['applied', 'pending', 'submitted', 'rejected'].includes(a.status || '')).length / relevantApplications.length) * 100)
          : 0,
      },
      // ===== WARNING: This is just a SAMPLE preview (10 items max), NOT the total! =====
      _samplePreview_DO_NOT_COUNT: relevantApplications
        .sort((a, b) => new Date(b.appliedDate || b.createdAt || 0).getTime() - new Date(a.appliedDate || a.createdAt || 0).getTime())
        .slice(0, 10)
        .map(app => ({
          company: app.companyName,
          position: app.position,
          status: app.status,
          appliedDate: app.appliedDate,
          daysSinceApplied: getAppAge(app),
          hasInterviews: (app.interviews?.length || 0) > 0,
        })),
      interviewsScheduled: relevantApplications.filter(app => 
        app.interviews?.some(i => i.status === 'scheduled')
      ).length,
      // Include board context for clarity
      boardContext: currentBoard ? {
        boardName: currentBoard.name,
        boardId: currentBoard.id,
      } : null,
    };
  }, [applications, currentBoard, boards]);

  // Register with AI Assistant
  useAssistantPageData('applications', applicationsSummary, applications.length > 0);

  // Also register selected application details if one is selected
  const selectedAppSummary = useMemo(() => {
    if (!selectedApplication) return null;
    return {
      company: selectedApplication.companyName,
      position: selectedApplication.position,
      status: selectedApplication.status,
      appliedDate: selectedApplication.appliedDate,
      location: selectedApplication.location,
      description: selectedApplication.description,
      notes: selectedApplication.notes,
      interviews: selectedApplication.interviews?.map(i => ({
        type: i.type,
        date: i.date,
        time: i.time,
        status: i.status,
      })),
      contactName: selectedApplication.contactName,
      contactEmail: selectedApplication.contactEmail,
    };
  }, [selectedApplication]);

  useAssistantPageData('selectedApplication', selectedAppSummary, !!selectedApplication);

  // Register current board context with AI Assistant
  const boardContextSummary = useMemo(() => {
    if (!currentBoard) {
      return {
        boardName: 'All Boards Overview',
        viewMode: view,
        totalBoards: boards.length,
        boardsList: boards.map(b => ({ id: b.id, name: b.name, type: b.boardType || 'jobs', isDefault: b.isDefault })),
      };
    }
    
    // Get applications for this specific board
    // NOTE: Applications without boardId belong to the default board!
    const defaultBoard = boards.find(b => b.isDefault);
    const boardApplications = applications.filter(app => {
      if (!app.boardId) {
        // Applications without boardId belong to the default board
        return currentBoard.isDefault || defaultBoard?.id === currentBoard.id;
      }
      return app.boardId === currentBoard.id;
    });
    const statusCounts: Record<string, number> = {};
    boardApplications.forEach(app => {
      const status = app.status || 'applied';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      // ===== IMPORTANT: USE THESE NUMBERS FOR TOTAL COUNTS =====
      TOTAL_APPLICATIONS: boardApplications.length, // <-- USE THIS NUMBER!
      totalApplicationsOnBoard: boardApplications.length,
      applicationsByStatus: statusCounts, // <-- USE THIS FOR STATUS BREAKDOWN!
      // ===== Board Info =====
      boardName: currentBoard.name,
      boardId: currentBoard.id,
      boardType: currentBoard.boardType || 'jobs',
      boardDescription: currentBoard.description || null,
      isDefaultBoard: currentBoard.isDefault || false,
      viewMode: view, // 'kanban' | 'analytics' | 'boards'
      columns: currentBoard.columns?.map(c => ({ title: c.title, count: boardApplications.filter(a => a.status === c.id).length })) || [],
      // ===== WARNING: This is just a SAMPLE preview, NOT the total! =====
      _samplePreview_DO_NOT_COUNT: boardApplications.slice(0, 5).map(a => ({ company: a.companyName, position: a.position, status: a.status })),
    };
  }, [currentBoard, boards, applications, view]);

  useAssistantPageData('currentBoard', boardContextSummary, true);

  // Track mouse position during drag for auto-scroll
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-scroll handler for drag and drop
  const handleDragUpdate = (update: any) => {
    const { destination } = update;
    
    if (!destination) {
      // Clear any ongoing scroll when not over a droppable
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const droppableId = destination.droppableId;
    const scrollContainer = columnScrollRefs.current.get(droppableId);
    
    if (!scrollContainer || !mousePositionRef.current) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const mouseY = mousePositionRef.current.y;
    
    const distanceFromTop = mouseY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - mouseY;
    
    // Auto-scroll threshold (in pixels)
    const scrollThreshold = 80;
    const scrollSpeed = 10;

    // Clear any existing scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Scroll up if mouse is near top edge
    if (distanceFromTop < scrollThreshold && scrollContainer.scrollTop > 0) {
      autoScrollIntervalRef.current = window.setInterval(() => {
        if (scrollContainer.scrollTop > 0) {
          scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - scrollSpeed);
        } else {
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
        }
      }, 16); // ~60fps
    }
    // Scroll down if mouse is near bottom edge
    else if (distanceFromBottom < scrollThreshold) {
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (scrollContainer.scrollTop < maxScroll) {
        autoScrollIntervalRef.current = window.setInterval(() => {
          const currentMaxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          if (scrollContainer.scrollTop < currentMaxScroll) {
            scrollContainer.scrollTop = Math.min(currentMaxScroll, scrollContainer.scrollTop + scrollSpeed);
          } else {
            if (autoScrollIntervalRef.current) {
              clearInterval(autoScrollIntervalRef.current);
              autoScrollIntervalRef.current = null;
            }
          }
        }, 16); // ~60fps
      }
    }
  };

  // Track mouse position during drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Cleanup scroll interval on drag end
  const handleDragStart = () => {
    // Clear any existing scroll interval when starting a new drag
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDragEnd = async (result: any) => {
    // Clear scroll interval when drag ends
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    if (!result.destination || !currentUser) return;

    const { source, destination, draggableId } = result;

    // Handle same-column reordering (moving up/down within a column)
    if (source.droppableId === destination.droppableId) {
      // If dropped at the same position, no change needed
      if (source.index === destination.index) return;

      try {
        const status = source.droppableId as 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'pending_decision' | 'archived';
        
        // Get filtered applications with the same status (these are what's displayed in the column)
        const statusApplications = filteredApplications.filter(app => app.status === status);
        
        // Reorder the status applications array based on drag indices
        const reorderedStatusApps = Array.from(statusApplications);
        const [removed] = reorderedStatusApps.splice(source.index, 1);
        reorderedStatusApps.splice(destination.index, 0, removed);
        
        // Store the manual order for this status (array of IDs in order)
        const newManualOrder = new Map(manualOrder);
        newManualOrder.set(status, reorderedStatusApps.map(app => app.id));
        setManualOrder(newManualOrder);
        
        // Note: Order persistence to Firestore can be added later if needed
        // For now, the order is maintained in memory during the session
      } catch (error) {
        console.error('Error reordering application:', error);
        notify.error('Failed to reorder application');
      }
      return;
    }

    // Handle cross-column movement (changing status)
    const newStatus = destination.droppableId as 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'pending_decision' | 'archived';
    const oldStatus = source.droppableId as 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'pending_decision' | 'archived';

    try {
      // Get the application we're updating
      const app = applications.find(a => a.id === draggableId);
      if (!app) return;

      // Get filtered applications for the destination column (before status change)
      // The card we're moving isn't in this list yet since it still has the old status
      const destinationStatusApps = filteredApplications.filter(app => app.status === newStatus);
      
      // Create a new array with the moved card ID inserted at the destination position
      const reorderedDestinationIds = destinationStatusApps.map(app => app.id);
      // Insert the card ID at the destination index
      reorderedDestinationIds.splice(destination.index, 0, draggableId);
      
      // Store the manual order for the destination column
      const newManualOrder = new Map(manualOrder);
      newManualOrder.set(newStatus, reorderedDestinationIds);
      
      // Also update the source column order if it had manual order
      if (oldStatus !== newStatus) {
        const sourceStatusApps = filteredApplications.filter(app => app.status === oldStatus);
        const reorderedSourceApps = sourceStatusApps.filter(a => a.id !== draggableId);
        if (reorderedSourceApps.length > 0) {
          newManualOrder.set(oldStatus, reorderedSourceApps.map(app => app.id));
        } else {
          // Remove manual order for source column if it's now empty
          newManualOrder.delete(oldStatus);
        }
      }
      
      setManualOrder(newManualOrder);

      // Create a new status history entry
      const newStatusChange: StatusChange = {
        status: newStatus,
        date: new Date().toISOString().split('T')[0],
      };

      // Update history - make sure it exists first
      const statusHistory = app.statusHistory || [{
        status: app.status,
        date: app.appliedDate,
        notes: 'Initial application'
      }];

      // Add new status change to history
      statusHistory.push(newStatusChange);

      // Mise à jour optimiste de l'UI
      setApplications(prev => prev.map(app =>
        app.id === draggableId ? {
          ...app,
          status: newStatus,
          statusHistory
        } : app
      ));

      // Mise à jour dans Firestore
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', draggableId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory
      });

      // Lancer les confettis si déplacé vers "offer" ou "opportunity"
      if (newStatus === 'offer' || (newStatus as string) === 'opportunity') {
        fireConfetti();
      }

      // Create persistent notification for important status changes
      const importantStatuses = ['offer', 'interviewing', 'rejected', 'opportunity'];
      if (importantStatuses.includes(newStatus)) {
        notify.statusChange({
          companyName: app.companyName,
          position: app.position,
          previousStatus: oldStatus,
          newStatus: newStatus,
          applicationId: app.id,
          showToast: false, // Already showing micro-feedback
        });
      }

      notify.success(`Application moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      notify.error('Failed to update application status');
      // Retour à l'état précédent en cas d'erreur
      setApplications(prev => [...prev]);
    }
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateFilter !== 'all') count++;
    if (updateDateFilter !== 'all') count++;
    if (upcomingInterviewsDays !== null) count++;
    if (interviewTypes.length > 0) count++;
    if (interviewStatus.length > 0) count++;
    if (hasInterviews !== 'all') count++;
    if (selectedCompanies.length > 0) count++;
    if ((currentBoardType === 'campaigns' ? sortBy !== 'lastContactedAt' : sortBy !== 'appliedDate') || sortOrder !== 'desc') count++;
    return count;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setDateFilter('all');
    setCustomDateRange(null);
    setUpdateDateFilter('all');
    setUpcomingInterviewsDays(null);
    setInterviewTypes([]);
    setInterviewStatus([]);
    setHasInterviews('all');
    setSelectedCompanies([]);
    setCompanySearchQuery('');
    setSortBy(currentBoardType === 'campaigns' ? 'lastContactedAt' : 'appliedDate');
    setSortOrder('desc');
  };

  // Reset sort when board type changes
  useEffect(() => {
    setSortBy(currentBoardType === 'campaigns' ? 'lastContactedAt' : 'appliedDate');
    setSortOrder('desc');
  }, [currentBoardType]);
  
  // Get column order based on board type
  const columnOrder = [...BOARD_TYPE_COLUMNS[currentBoardType]];

  // Applications filtered by current board only (for analytics - without search/status filters)
  const boardApplications = useMemo(() => {
    if (!currentBoardId || view === 'boards') {
      return applications;
    }
    const defaultBoard = boards.find(b => b.isDefault);
    return applications.filter(app => {
      if (!app.boardId) {
        return defaultBoard?.id === currentBoardId;
      }
      return app.boardId === currentBoardId;
    });
  }, [applications, currentBoardId, boards, view]);
  
  // Get column labels based on board type
  const columnLabels = currentBoardType === 'jobs' ? JOB_COLUMN_LABELS : CAMPAIGN_COLUMN_LABELS;

  // Map statuses between board types for display compatibility
  const getEffectiveStatus = (appStatus: string): string => {
    if (currentBoardType === 'campaigns') {
      // Map jobs statuses to campaigns equivalents
      const jobsToCampaigns: Record<string, string> = {
        'applied': 'targets',
        'wishlist': 'targets',
        'interview': 'meeting',
        'offer': 'opportunity',
        'rejected': 'no_response',
        'archived': 'closed',
        'pending_decision': 'follow_up',
      };
      return jobsToCampaigns[appStatus] || appStatus;
    } else {
      // Map campaigns statuses to jobs equivalents
      const campaignsToJobs: Record<string, string> = {
        'targets': 'applied',
        'contacted': 'applied',
        'follow_up': 'interview',
        'replied': 'interview',
        'meeting': 'interview',
        'opportunity': 'offer',
        'no_response': 'rejected',
        'closed': 'archived',
      };
      return campaignsToJobs[appStatus] || appStatus;
    }
  };

  // Build applicationsByStatus dynamically based on board type
  const applicationsByStatus: Record<string, JobApplication[]> = {};
  columnOrder.forEach(status => {
    applicationsByStatus[status] = filteredApplications.filter(app => getEffectiveStatus(app.status) === status);
  });

  // Analytics helper functions - now filtered by current board
  const getMonthlyApplicationData = () => {
    // For jobs: applied, interviews, pending, offers, rejected
    // For campaigns: targets, contacted, follow_up, replied, meeting, opportunity
    const monthData: { [key: string]: Record<string, number> } = {};

    boardApplications.forEach(app => {
      const date = new Date(app.appliedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthData[monthKey]) {
        if (currentBoardType === 'jobs') {
        monthData[monthKey] = { applied: 0, interviews: 0, pending: 0, offers: 0, rejected: 0 };
        } else {
          monthData[monthKey] = { targets: 0, contacted: 0, follow_up: 0, replied: 0, meeting: 0, opportunity: 0 };
        }
      }

      // Count applications by current status
      if (currentBoardType === 'jobs') {
      if (app.status === 'applied') monthData[monthKey].applied++;
      else if (app.status === 'interview') monthData[monthKey].interviews++;
      else if (app.status === 'pending_decision') monthData[monthKey].pending++;
      else if (app.status === 'offer') monthData[monthKey].offers++;
      else if (app.status === 'rejected') monthData[monthKey].rejected++;
      } else {
        if (app.status === 'targets') monthData[monthKey].targets++;
        else if (app.status === 'contacted') monthData[monthKey].contacted++;
        else if (app.status === 'follow_up') monthData[monthKey].follow_up++;
        else if (app.status === 'replied') monthData[monthKey].replied++;
        else if (app.status === 'meeting') monthData[monthKey].meeting++;
        else if (app.status === 'opportunity') monthData[monthKey].opportunity++;
      }
    });

    // Sort by month
    return Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // Last 6 months
  };

  const getApplicationSourceData = () => {
    // In a real app, you would track the source of each application
    // Here we'll simulate some sample data based on board applications
    return [
      { source: 'LinkedIn', count: Math.floor(boardApplications.length * 0.4) },
      { source: 'Company Website', count: Math.floor(boardApplications.length * 0.3) },
      { source: 'Referral', count: Math.floor(boardApplications.length * 0.15) },
      { source: 'Job Board', count: Math.floor(boardApplications.length * 0.1) },
      { source: 'Other', count: boardApplications.length - Math.floor(boardApplications.length * 0.95) }
    ].filter(item => item.count > 0);
  };

  const getResponseRateData = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const total = boardApplications.length;
    
    // For jobs: responses = not applied, interviews, offers
    // For campaigns: responses = replied, meetings, opportunities
    if (currentBoardType === 'jobs') {
      const responses = boardApplications.filter(app => app.status !== 'applied' && app.status !== 'wishlist').length;
      const interviews = boardApplications.filter(app => app.status === 'interview' || app.status === 'offer' ||
      (app.interviews && app.interviews.length > 0)).length;
      const offers = boardApplications.filter(app => app.status === 'offer').length;

    // Calculate rates for current month
      const currentMonthApps = boardApplications.filter(app => {
      const appDate = new Date(app.appliedDate);
      return appDate >= oneMonthAgo;
    });
    const currentMonthTotal = currentMonthApps.length;
      const currentMonthResponses = currentMonthApps.filter(app => app.status !== 'applied' && app.status !== 'wishlist').length;
    const currentMonthInterviews = currentMonthApps.filter(app => app.status === 'interview' || app.status === 'offer' ||
      (app.interviews && app.interviews.length > 0)).length;
    const currentMonthOffers = currentMonthApps.filter(app => app.status === 'offer').length;

    // Calculate rates for previous month
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      const previousMonthApps = boardApplications.filter(app => {
      const appDate = new Date(app.appliedDate);
      return appDate >= twoMonthsAgo && appDate < oneMonthAgo;
    });
    const previousMonthTotal = previousMonthApps.length;
      const previousMonthResponses = previousMonthApps.filter(app => app.status !== 'applied' && app.status !== 'wishlist').length;
    const previousMonthInterviews = previousMonthApps.filter(app => app.status === 'interview' || app.status === 'offer' ||
      (app.interviews && app.interviews.length > 0)).length;
    const previousMonthOffers = previousMonthApps.filter(app => app.status === 'offer').length;

    const currentResponseRate = currentMonthTotal > 0 ? (currentMonthResponses / currentMonthTotal) * 100 : 0;
    const previousResponseRate = previousMonthTotal > 0 ? (previousMonthResponses / previousMonthTotal) * 100 : 0;
    const currentInterviewRate = currentMonthTotal > 0 ? (currentMonthInterviews / currentMonthTotal) * 100 : 0;
    const previousInterviewRate = previousMonthTotal > 0 ? (previousMonthInterviews / previousMonthTotal) * 100 : 0;
    const currentOfferRate = currentMonthTotal > 0 ? (currentMonthOffers / currentMonthTotal) * 100 : 0;
    const previousOfferRate = previousMonthTotal > 0 ? (previousMonthOffers / previousMonthTotal) * 100 : 0;

    return {
      responseRate: total ? (responses / total) * 100 : 0,
      interviewRate: total ? (interviews / total) * 100 : 0,
      offerRate: total ? (offers / total) * 100 : 0,
      responseRateTrend: currentResponseRate - previousResponseRate,
      interviewRateTrend: currentInterviewRate - previousInterviewRate,
      offerRateTrend: currentOfferRate - previousOfferRate,
    };
    } else {
      // Campaign metrics
      const contacted = boardApplications.filter(app => app.status !== 'targets').length;
      const replied = boardApplications.filter(app => ['replied', 'meeting', 'opportunity', 'closed'].includes(app.status)).length;
      const meetings = boardApplications.filter(app => ['meeting', 'opportunity'].includes(app.status)).length;
      const opportunities = boardApplications.filter(app => app.status === 'opportunity').length;

      // Calculate rates for current month
      const currentMonthApps = boardApplications.filter(app => {
        const appDate = new Date(app.appliedDate);
        return appDate >= oneMonthAgo;
      });
      const currentMonthTotal = currentMonthApps.length;
      const currentMonthContacted = currentMonthApps.filter(app => app.status !== 'targets').length;
      const currentMonthReplied = currentMonthApps.filter(app => ['replied', 'meeting', 'opportunity', 'closed'].includes(app.status)).length;
      const currentMonthMeetings = currentMonthApps.filter(app => ['meeting', 'opportunity'].includes(app.status)).length;

      // Calculate rates for previous month
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      const previousMonthApps = boardApplications.filter(app => {
        const appDate = new Date(app.appliedDate);
        return appDate >= twoMonthsAgo && appDate < oneMonthAgo;
      });
      const previousMonthTotal = previousMonthApps.length;
      const previousMonthContacted = previousMonthApps.filter(app => app.status !== 'targets').length;
      const previousMonthReplied = previousMonthApps.filter(app => ['replied', 'meeting', 'opportunity', 'closed'].includes(app.status)).length;
      const previousMonthMeetings = previousMonthApps.filter(app => ['meeting', 'opportunity'].includes(app.status)).length;

      const currentContactRate = currentMonthTotal > 0 ? (currentMonthContacted / currentMonthTotal) * 100 : 0;
      const previousContactRate = previousMonthTotal > 0 ? (previousMonthContacted / previousMonthTotal) * 100 : 0;
      const currentReplyRate = currentMonthContacted > 0 ? (currentMonthReplied / currentMonthContacted) * 100 : 0;
      const previousReplyRate = previousMonthContacted > 0 ? (previousMonthReplied / previousMonthContacted) * 100 : 0;
      const currentMeetingRate = currentMonthContacted > 0 ? (currentMonthMeetings / currentMonthContacted) * 100 : 0;
      const previousMeetingRate = previousMonthContacted > 0 ? (previousMonthMeetings / previousMonthContacted) * 100 : 0;

      return {
        // Reuse field names but with campaign metrics
        responseRate: contacted > 0 ? (replied / contacted) * 100 : 0, // Reply rate
        interviewRate: contacted > 0 ? (meetings / contacted) * 100 : 0, // Meeting rate  
        offerRate: contacted > 0 ? (opportunities / contacted) * 100 : 0, // Opportunity rate
        responseRateTrend: currentReplyRate - previousReplyRate,
        interviewRateTrend: currentMeetingRate - previousMeetingRate,
        offerRateTrend: 0,
      };
    }
  };

  const getAverageTimeData = () => {
    if (currentBoardType === 'jobs') {
    let totalApplicationToInterview = 0;
    let totalInterviewToOffer = 0;
    let applicationsWithInterviews = 0;
    let interviewsWithOffers = 0;

      boardApplications.forEach(app => {
      if (app.statusHistory && app.statusHistory.length > 1) {
        const appliedEntry = app.statusHistory.find(h => h.status === 'applied');
        const interviewEntry = app.statusHistory.find(h => h.status === 'interview');
        const offerEntry = app.statusHistory.find(h => h.status === 'offer');

        if (appliedEntry && interviewEntry) {
          const appliedDate = new Date(appliedEntry.date);
          const interviewDate = new Date(interviewEntry.date);
          const daysDiff = Math.round((interviewDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff >= 0) {
            totalApplicationToInterview += daysDiff;
            applicationsWithInterviews++;
          }
        }

        if (interviewEntry && offerEntry) {
          const interviewDate = new Date(interviewEntry.date);
          const offerDate = new Date(offerEntry.date);
          const daysDiff = Math.round((offerDate.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff >= 0) {
            totalInterviewToOffer += daysDiff;
            interviewsWithOffers++;
          }
        }
      }
    });

    return {
      avgDaysToInterview: applicationsWithInterviews ? Math.round(totalApplicationToInterview / applicationsWithInterviews) : 0,
      avgDaysToOffer: interviewsWithOffers ? Math.round(totalInterviewToOffer / interviewsWithOffers) : 0
    };
    } else {
      // Campaign: time to reply, time to meeting
      let totalContactedToReply = 0;
      let totalReplyToMeeting = 0;
      let contactsWithReplies = 0;
      let repliesWithMeetings = 0;

      boardApplications.forEach(app => {
        if (app.statusHistory && app.statusHistory.length > 1) {
          const contactedEntry = app.statusHistory.find(h => h.status === 'contacted');
          const repliedEntry = app.statusHistory.find(h => h.status === 'replied');
          const meetingEntry = app.statusHistory.find(h => h.status === 'meeting');

          if (contactedEntry && repliedEntry) {
            const contactedDate = new Date(contactedEntry.date);
            const repliedDate = new Date(repliedEntry.date);
            const daysDiff = Math.round((repliedDate.getTime() - contactedDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff >= 0) {
              totalContactedToReply += daysDiff;
              contactsWithReplies++;
            }
          }

          if (repliedEntry && meetingEntry) {
            const repliedDate = new Date(repliedEntry.date);
            const meetingDate = new Date(meetingEntry.date);
            const daysDiff = Math.round((meetingDate.getTime() - repliedDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff >= 0) {
              totalReplyToMeeting += daysDiff;
              repliesWithMeetings++;
            }
          }
        }
      });

      return {
        avgDaysToInterview: contactsWithReplies ? Math.round(totalContactedToReply / contactsWithReplies) : 0, // Avg days to reply
        avgDaysToOffer: repliesWithMeetings ? Math.round(totalReplyToMeeting / repliesWithMeetings) : 0 // Avg days to meeting
      };
    }
  };

  // New Analytics Functions - Tag-based analysis (filtered by board)

  // Distribution by industry
  const getIndustryDistribution = () => {
    const industryCounts: { [key: string]: { count: number; positive: number; success: number } } = {};
    
    // For jobs: positive = interviews, success = offers
    // For campaigns: positive = replied, success = opportunities
    boardApplications.forEach(app => {
      if (app.jobTags?.industry && app.jobTags.industry.length > 0) {
        app.jobTags.industry.forEach(industry => {
          if (!industryCounts[industry]) {
            industryCounts[industry] = { count: 0, positive: 0, success: 0 };
          }
          industryCounts[industry].count++;
          
          if (currentBoardType === 'jobs') {
          if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
              industryCounts[industry].positive++;
          }
          if (app.status === 'offer') {
              industryCounts[industry].success++;
            }
          } else {
            if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
              industryCounts[industry].positive++;
            }
            if (app.status === 'opportunity') {
              industryCounts[industry].success++;
            }
          }
        });
      }
    });

    return Object.entries(industryCounts)
      .map(([industry, data]) => ({
        industry,
        count: data.count,
        interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Distribution by technologies
  const getTechnologyDistribution = () => {
    const techCounts: { [key: string]: { count: number; positive: number; success: number } } = {};
    
    boardApplications.forEach(app => {
      if (app.jobTags?.technologies && app.jobTags.technologies.length > 0) {
        app.jobTags.technologies.forEach(tech => {
          if (!techCounts[tech]) {
            techCounts[tech] = { count: 0, positive: 0, success: 0 };
          }
          techCounts[tech].count++;
          
          if (currentBoardType === 'jobs') {
          if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
              techCounts[tech].positive++;
          }
          if (app.status === 'offer') {
              techCounts[tech].success++;
            }
          } else {
            if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
              techCounts[tech].positive++;
            }
            if (app.status === 'opportunity') {
              techCounts[tech].success++;
            }
          }
        });
      }
    });

    return Object.entries(techCounts)
      .map(([tech, data]) => ({
        tech,
        count: data.count,
        interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  };

  // Distribution by seniority
  const getSeniorityDistribution = () => {
    const seniorityCounts: { [key: string]: { count: number; positive: number; success: number } } = {};
    
    boardApplications.forEach(app => {
      const seniority = app.jobTags?.seniority || 'Not specified';
      if (!seniorityCounts[seniority]) {
        seniorityCounts[seniority] = { count: 0, positive: 0, success: 0 };
      }
      seniorityCounts[seniority].count++;
      
      if (currentBoardType === 'jobs') {
      if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
          seniorityCounts[seniority].positive++;
      }
      if (app.status === 'offer') {
          seniorityCounts[seniority].success++;
        }
      } else {
        if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
          seniorityCounts[seniority].positive++;
        }
        if (app.status === 'opportunity') {
          seniorityCounts[seniority].success++;
        }
      }
    });

    return Object.entries(seniorityCounts)
      .map(([seniority, data]) => ({
        seniority,
        count: data.count,
        percentage: boardApplications.length > 0 ? (data.count / boardApplications.length) * 100 : 0,
        interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Location insights
  const getLocationInsights = () => {
    const locationCounts: { [key: string]: { count: number; positive: number; success: number; type: string } } = {};
    
    boardApplications.forEach(app => {
      let locationKey = 'Not specified';
      let locationType = 'Not specified';
      
      if (app.jobTags?.location) {
        const loc = app.jobTags.location;
        if (loc.remote && loc.hybrid) {
          locationKey = 'Hybrid';
          locationType = 'Hybrid';
        } else if (loc.remote) {
          locationKey = 'Remote';
          locationType = 'Remote';
        } else if (loc.city && loc.country) {
          locationKey = `${loc.city}, ${loc.country}`;
          locationType = 'On-site';
        } else if (loc.city) {
          locationKey = loc.city;
          locationType = 'On-site';
        } else if (loc.country) {
          locationKey = loc.country;
          locationType = 'On-site';
        } else {
          locationKey = app.location || 'Not specified';
          locationType = 'On-site';
        }
      } else {
        locationKey = app.location || 'Not specified';
        locationType = 'On-site';
      }

      if (!locationCounts[locationKey]) {
        locationCounts[locationKey] = { count: 0, positive: 0, success: 0, type: locationType };
      }
      locationCounts[locationKey].count++;
      
      if (currentBoardType === 'jobs') {
      if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
          locationCounts[locationKey].positive++;
      }
      if (app.status === 'offer') {
          locationCounts[locationKey].success++;
        }
      } else {
        if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
          locationCounts[locationKey].positive++;
        }
        if (app.status === 'opportunity') {
          locationCounts[locationKey].success++;
        }
      }
    });

    // Group by type (Remote, Hybrid, On-site)
    const typeGroups: { [key: string]: { count: number; positive: number; success: number } } = {};
    Object.values(locationCounts).forEach(data => {
      const type = data.type;
      if (!typeGroups[type]) {
        typeGroups[type] = { count: 0, positive: 0, success: 0 };
      }
      typeGroups[type].count += data.count;
      typeGroups[type].positive += data.positive;
      typeGroups[type].success += data.success;
    });

    return {
      byLocation: Object.entries(locationCounts)
        .map(([location, data]) => ({
          location,
          count: data.count,
          type: data.type,
          interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
          offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byType: Object.entries(typeGroups)
        .map(([type, data]) => ({
          type,
          count: data.count,
          interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
          offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  };

  // Employment type distribution
  const getEmploymentTypeDistribution = () => {
    const typeCounts: { [key: string]: { count: number; positive: number; success: number } } = {};
    
    boardApplications.forEach(app => {
      const types = app.jobTags?.employmentType || [];
      if (types.length === 0) {
        const defaultType = 'Not specified';
        if (!typeCounts[defaultType]) {
          typeCounts[defaultType] = { count: 0, positive: 0, success: 0 };
        }
        typeCounts[defaultType].count++;
        
        if (currentBoardType === 'jobs') {
        if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
            typeCounts[defaultType].positive++;
        }
        if (app.status === 'offer') {
            typeCounts[defaultType].success++;
          }
        } else {
          if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
            typeCounts[defaultType].positive++;
          }
          if (app.status === 'opportunity') {
            typeCounts[defaultType].success++;
          }
        }
      } else {
        types.forEach(type => {
          if (!typeCounts[type]) {
            typeCounts[type] = { count: 0, positive: 0, success: 0 };
          }
          typeCounts[type].count++;
          
          if (currentBoardType === 'jobs') {
          if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
              typeCounts[type].positive++;
          }
          if (app.status === 'offer') {
              typeCounts[type].success++;
            }
          } else {
            if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
              typeCounts[type].positive++;
            }
            if (app.status === 'opportunity') {
              typeCounts[type].success++;
            }
          }
        });
      }
    });

    return Object.entries(typeCounts)
      .map(([type, data]) => ({
        type,
        count: data.count,
        interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Company size distribution
  const getCompanySizeDistribution = () => {
    const sizeCounts: { [key: string]: { count: number; positive: number; success: number } } = {};
    
    boardApplications.forEach(app => {
      const size = app.jobTags?.companySize || 'Not specified';
      if (!sizeCounts[size]) {
        sizeCounts[size] = { count: 0, positive: 0, success: 0 };
      }
      sizeCounts[size].count++;
      
      if (currentBoardType === 'jobs') {
        if (app.status === 'interview' || app.status === 'offer' || (app.interviews && app.interviews.length > 0)) {
          sizeCounts[size].positive++;
        }
        if (app.status === 'offer') {
          sizeCounts[size].success++;
        }
      } else {
        if (['replied', 'meeting', 'opportunity'].includes(app.status)) {
          sizeCounts[size].positive++;
        }
        if (app.status === 'opportunity') {
          sizeCounts[size].success++;
        }
      }
    });

    return Object.entries(sizeCounts)
      .map(([size, data]) => ({
        size,
        count: data.count,
        percentage: boardApplications.length > 0 ? (data.count / boardApplications.length) * 100 : 0,
        interviewRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        offerRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Success patterns analysis
  const getSuccessPatterns = () => {
    const patterns = {
      topIndustries: getIndustryDistribution().slice(0, 3),
      topTechnologies: getTechnologyDistribution().slice(0, 5),
      bestSeniority: getSeniorityDistribution()
        .filter(s => s.count >= 2) // At least 2 applications
        .sort((a, b) => b.interviewRate - a.interviewRate)
        .slice(0, 1)[0],
      bestLocationType: getLocationInsights().byType
        .sort((a, b) => b.interviewRate - a.interviewRate)
        .slice(0, 1)[0],
      bestCompanySize: getCompanySizeDistribution()
        .filter(s => s.count >= 2)
        .sort((a, b) => b.interviewRate - a.interviewRate)
        .slice(0, 1)[0],
    };

    return patterns;
  };

  // Helper function to generate .ics file for calendar integration
  const generateICSFile = (interview: Interview, company: string, position: string) => {
    // Create a timestamp in the format: YYYYMMDDTHHmmssZ
    const formatDate = (dateStr: string, timeStr: string) => {
      const date = new Date(`${dateStr}T${timeStr}`);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatDate(interview.date, interview.time || '09:00');

    // Calculate end time (default to 1 hour later)
    const endDate = new Date(`${interview.date}T${interview.time || '09:00'}`);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = formatDate(interview.date, endDate.toTimeString().split(' ')[0].substring(0, 5));

    // Create the .ics content
    const icsContent =
      `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview with ${company}
DTSTART:${startTime}
DTEND:${endTime}
DESCRIPTION:Interview for ${position} position.${interview.notes ? '\\n\\n' + interview.notes : ''}
LOCATION:${interview.location || 'Remote/TBD'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  // Helper function to download the .ics file
  const downloadICS = (interview: Interview, company: string, position: string) => {
    const icsContent = generateICSFile(interview, company, position);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${company}-${interview.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Animations customisées pour les composants draggables
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    dragging: {
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      zIndex: 50,
      background: "var(--card-dragging-bg)",
      borderColor: "var(--card-dragging-border)",
    }
  };

  // Variables CSS pour les propriétés adaptatives en clair/sombre
  const cssVariables = `
    :root {
      --card-dragging-bg: white;
      --card-dragging-border: #635BFF;
    }
    
    .dark {
      --card-dragging-bg: #1f2937;
      --card-dragging-border: #635BFF;
    }

    /* Animation effet de brillance pendant le drag */
    @keyframes pulse-border {
      0% { box-shadow: 0 0 0 0 rgba(99, 91, 255, 0.7); }
      70% { box-shadow: 0 0 0 4px rgba(99, 91, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(99, 91, 255, 0); }
    }
    
    .dragging {
      animation: pulse-border 2s infinite;
    }

    /* Animation pour le dropzone hover */
    .droppable-hover {
      background-color: rgba(99, 91, 255, 0.05);
      transition: background-color 0.2s ease;
    }

    /* Styles pour le drag and drop */
    .dragging-card {
      z-index: 9999 !important;
      opacity: 1 !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      background: var(--card-dragging-bg) !important;
      border-color: var(--card-dragging-border) !important;
      border-width: 2px !important;
      transform-origin: center center !important;
    }

    /* Styles pour les actions de la carte */
    .card-actions {
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .card-container:hover .card-actions,
    .card-actions:hover {
      opacity: 1;
    }

    /* Animation hover des cartes */
    .card-container {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card-container:hover:not(.dragging-card) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
    }
  `;

  return (
    <AuthLayout>
      {/* CSS Variables pour les animations */}
      <style>{cssVariables}</style>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Cover Photo Section with all header elements */}
        <div 
          className="relative group/cover flex-shrink-0"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area - Height adjusted to contain all header elements */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${effectiveCoverPhoto ? 'h-auto min-h-[200px] sm:min-h-[220px]' : 'h-auto min-h-[150px] sm:min-h-[170px]'}`}>
            {/* Cover Background */}
            {effectiveCoverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  key={effectiveCoverPhoto}
                  src={effectiveCoverPhoto} 
                  alt="Applications cover" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                   style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
              </div>
            )}

            {/* Cover Controls - Visible on hover - Context-aware (modifies board cover when in a board, or global cover when in boards view) */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <AnimatePresence>
                {(isHoveringCover || !effectiveCoverPhoto) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 pointer-events-auto"
                  >
                    {!effectiveCoverPhoto ? (
                      <button
                        onClick={() => setIsCoverGalleryOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                          bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#3d3c3e]
                          border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-sm transition-all duration-200
                          hover:shadow-md group"
                      >
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        <span>Add {view !== 'boards' && currentBoardId ? 'board' : ''} cover</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-[#242325]/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                        {/* Indicator showing which cover is being edited */}
                        {view !== 'boards' && currentBoardId && (
                          <span className="px-2 py-1 text-[10px] font-semibold text-[#635BFF] bg-[#635BFF]/10 rounded-md mr-1">
                            Board Cover
                          </span>
                        )}
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Change
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />
                        
                        <button
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUpdatingCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          {isUpdatingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />
                        
                        <button
                          onClick={handleRemoveCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 
                            hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          title="Remove cover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Header Content - Premium Restructured Layout */}
            <div className="relative z-10 px-4 sm:px-6 pt-4 pb-4">
              {/* Main Header Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
              >
                {/* Left Section: Title & Board Info */}
                <div className="flex items-center gap-4">
                  {/* Board Icon/Avatar */}
                  {view !== 'boards' && currentBoardId && (() => {
                    const currentBoard = boards.find(b => b.id === currentBoardId);
                    return (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                        style={{ backgroundColor: currentBoard?.color || '#635BFF' }}
                      >
                        <span className="text-white">{currentBoard?.icon || '📋'}</span>
                      </div>
                    );
                  })()}
                  
            <div>
                    <div className="flex items-center gap-3">
                  <h1 className={`text-2xl font-bold ${effectiveCoverPhoto 
                    ? 'text-white drop-shadow-2xl'
                    : 'text-gray-900 dark:text-white'
                      }`}>
                        {view === 'boards' 
                          ? 'My Boards' 
                          : (() => {
                              const currentBoard = boards.find(b => b.id === currentBoardId);
                              return currentBoard?.name || 'Applications';
                            })()
                        }
                      </h1>
                      
                      {/* Board Navigation Badge - only when inside a board */}
                      {view !== 'boards' && currentBoardId && (
                        <button
                          onClick={() => {
                            setView('boards');
                            setCurrentBoardId(null);
                          }}
                          className={`group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200
                            ${effectiveCoverPhoto 
                              ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                              : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-600 dark:text-gray-300 hover:bg-[#635BFF]/10 hover:text-[#635BFF]'
                            }`}
                        >
                          <LayoutGrid className="w-3 h-3" />
                          <span>All Boards</span>
                        </button>
                      )}
                    </div>
                    
                  <p className={`text-sm mt-0.5 ${effectiveCoverPhoto 
                      ? 'text-white/80 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
                      {view === 'boards' 
                        ? `${boards.length} board${boards.length !== 1 ? 's' : ''} • ${applications.length} total applications`
                        : `${filteredApplications.length} applications in this board`
                      }
              </p>
                  </div>
            </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-3">
                  {view === 'boards' ? (
                    /* New Board button when in boards overview */
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setEditingBoard(null);
                        setShowBoardSettingsModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] hover:shadow-md border border-[#9fc015] transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Board</span>
                    </motion.button>
                  ) : (
                    /* Actions when inside a board */
                    <>
                      {/* View Toggle Pills */}
                      <div className={`p-1 rounded-xl flex ${effectiveCoverPhoto ? 'bg-black/20 backdrop-blur-sm' : 'bg-gray-100 dark:bg-[#2b2a2c]'}`}>
                        <button
                          onClick={() => setView('kanban')}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'kanban'
                            ? 'bg-white dark:bg-[#3d3c3e] text-[#635BFF] dark:text-[#a5a0ff] shadow-sm'
                            : effectiveCoverPhoto 
                              ? 'text-white/80 hover:text-white'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                        >
                          <FolderKanban className="w-4 h-4" />
                          <span>Kanban</span>
                        </button>
                        <button
                          onClick={() => setView('analytics')}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'analytics'
                            ? 'bg-white dark:bg-[#3d3c3e] text-[#635BFF] dark:text-[#a5a0ff] shadow-sm'
                            : effectiveCoverPhoto 
                              ? 'text-white/80 hover:text-white'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                        >
                          <LineChart className="w-4 h-4" />
                          <span>Analytics</span>
                        </button>
                      </div>

                      {/* Add Application Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // For campaigns, skip selection and go directly to outreach form
                  setEventType(currentBoardType === 'campaigns' ? 'application' : null);
                  setWizardStep(1);
                  setLookupSelectedApplication(null);
                  setLinkedApplicationId(null);
                  setLookupSearchQuery('');
                  setShowLookupDropdown(false);
                  setNewApplicationModal(true);
                }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] hover:shadow-md border border-[#9fc015] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>{currentBoardType === 'campaigns' ? 'Add Contact' : 'Add Application'}</span>
              </motion.button>

              {/* Settings Button */}
              <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                onClick={() => setShowAutomationSettingsModal(true)}
                        className={`relative p-2.5 rounded-xl transition-all duration-200
                  ${effectiveCoverPhoto 
                            ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                            : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3c3e]'
                  }`}
                title="Automation Settings"
              >
                        <Settings className="w-5 h-5" />
                {Object.values(automationSettings).some((s: any) => (s as { enabled?: boolean }).enabled) && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#635BFF] rounded-full border-2 border-white dark:border-[#242325]" />
                )}
              </motion.button>
                    </>
                  )}
            </div>
              </motion.div>

              {/* Stats Row - Only show when inside a board (Kanban view) */}
              {view === 'kanban' && currentBoardId && (
            <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-2 mt-4"
                >
              {(() => {
                    const stats = currentBoardType === 'campaigns' 
                      ? [
                          { label: 'Targets', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'targets').length, color: '#6B7280', bg: 'bg-gray-500/10' },
                          { label: 'Contacted', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'contacted').length, color: '#3B82F6', bg: 'bg-blue-500/10' },
                          { label: 'Replied', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'replied').length, color: '#8B5CF6', bg: 'bg-purple-500/10' },
                          { label: 'Meeting', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'meeting').length, color: '#F59E0B', bg: 'bg-amber-500/10' },
                          { label: 'Opportunity', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'opportunity').length, color: '#10B981', bg: 'bg-emerald-500/10' }
                        ]
                      : [
                          { label: 'Applied', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'applied').length, color: '#3B82F6', bg: 'bg-blue-500/10' },
                          { label: 'Interview', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'interview').length, color: '#8B5CF6', bg: 'bg-purple-500/10' },
                          { label: 'Pending', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'pending_decision').length, color: '#F59E0B', bg: 'bg-amber-500/10' },
                          { label: 'Offer', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'offer').length, color: '#10B981', bg: 'bg-emerald-500/10' },
                          { label: 'Rejected', count: filteredApplications.filter(a => getEffectiveStatus(a.status) === 'rejected').length, color: '#EF4444', bg: 'bg-red-500/10' }
                        ];
                    return stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${effectiveCoverPhoto ? 'bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-sm shadow-lg' : 'bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]'}`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stat.color }}
                        />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{stat.count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
                </motion.div>
              ));
              })()}
        </motion.div>
              )}

              {/* Search and Filters Row - Only show for kanban view */}
        {view === 'kanban' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-6"
                >
            {/* Search bar + Filters en une ligne */}
            <div className="flex items-center gap-3">
              {/* Search bar plus compact */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by company or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              {/* Filters en ligne */}
              <div className="flex items-center gap-2">
                {/* Date Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'date' ? null : 'date')}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          dateFilter !== 'all' || customDateRange
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                  {dateFilter !== 'all' || customDateRange ? (
                          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold bg-purple-600 dark:bg-purple-500 text-white">
                      1
                    </span>
                  ) : null}
                </button>

                {/* Interview Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'interview' ? null : 'interview')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hasInterviews !== 'all' || interviewTypes.length > 0 || interviewStatus.length > 0 || upcomingInterviewsDays !== null
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{currentBoardType === 'campaigns' ? 'Meetings' : 'Interviews'}</span>
                  {hasInterviews !== 'all' || interviewTypes.length > 0 || interviewStatus.length > 0 || upcomingInterviewsDays !== null ? (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold bg-purple-600 dark:bg-purple-500 text-white">
                      {[hasInterviews !== 'all' ? 1 : 0, interviewTypes.length, interviewStatus.length, upcomingInterviewsDays !== null ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  ) : null}
                </button>

                {/* Company Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'company' ? null : 'company')}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCompanies.length > 0
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Company</span>
                  {selectedCompanies.length > 0 ? (
                          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold bg-purple-600 dark:bg-purple-500 text-white">
                      {selectedCompanies.length}
                    </span>
                  ) : null}
                </button>

                {/* Sort Filter */}
                <button
                  onClick={() => setOpenFilterModal(openFilterModal === 'sort' ? null : 'sort')}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          (currentBoardType === 'campaigns' ? sortBy !== 'lastContactedAt' : sortBy !== 'appliedDate') || sortOrder !== 'desc'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Sort</span>
                  {(currentBoardType === 'campaigns' ? sortBy !== 'lastContactedAt' : sortBy !== 'appliedDate') || sortOrder !== 'desc' ? (
                          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold bg-purple-600 dark:bg-purple-500 text-white">
                      1
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Clear filters button */}
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              )}

              {/* Results count */}
                    <div className={`text-sm whitespace-nowrap ${
                      coverPhoto 
                        ? (isCoverDark ? 'text-white/90' : 'text-gray-700 dark:text-white/90')
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                {filteredApplications.length} {filteredApplications.length === 1 ? 'result' : 'results'}
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 text-purple-600 dark:text-purple-400">
                    ({getActiveFilterCount()} {getActiveFilterCount() === 1 ? 'filter' : 'filters'})
                  </span>
                )}
              </div>
            </div>

            {/* Active filter badges */}
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {dateFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Date: {dateFilter === 'custom' && customDateRange
                      ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
                      : dateFilter === '7d' ? 'Last 7 days'
                        : dateFilter === '30d' ? 'Last 30 days'
                          : dateFilter === '3m' ? 'Last 3 months'
                            : dateFilter === '6m' ? 'Last 6 months'
                              : 'All'}
                    <button
                      onClick={() => {
                        setDateFilter('all');
                        setCustomDateRange(null);
                      }}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCompanies.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Companies: {selectedCompanies.length}
                    <button
                      onClick={() => setSelectedCompanies([])}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {hasInterviews !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {currentBoardType === 'campaigns' ? 'Meetings' : 'Interviews'}: {hasInterviews === 'with' ? 'With' : hasInterviews === 'without' ? 'Without' : 'Upcoming'}
                    <button
                      onClick={() => setHasInterviews('all')}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {((currentBoardType === 'campaigns' ? sortBy !== 'lastContactedAt' : sortBy !== 'appliedDate') || sortOrder !== 'desc') && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Sort: {sortBy === 'appliedDate' ? 'Applied Date' : 
                      sortBy === 'lastContactedAt' ? 'Last Contacted' :
                      sortBy === 'updatedAt' ? 'Updated' : 
                      sortBy === 'companyName' ? 'Company' : 
                      sortBy === 'position' ? 'Position' : 
                      sortBy === 'contactName' ? 'Contact Name' :
                      sortBy === 'interviewCount' ? 'Interviews' :
                      sortBy === 'meetingCount' ? 'Meetings' : 'Other'} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
                    <button
                      onClick={() => {
                        setSortBy(currentBoardType === 'campaigns' ? 'lastContactedAt' : 'appliedDate');
                        setSortOrder('desc');
                      }}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={coverFileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileSelect}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 pt-6 pb-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Main content area - switch between kanban, boards, and analytics */}
        <AnimatePresence mode="wait">
          {view === 'boards' ? (
            <motion.div
              key="boards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <BoardsOverview
                boards={boards}
                applications={applications}
                onSelectBoard={(boardId) => {
                  setCurrentBoardId(boardId);
                  setView('kanban');
                }}
                onCreateBoard={() => {
                  setEditingBoard(null);
                  setShowBoardSettingsModal(true);
                }}
                onEditBoard={(board) => {
                  setEditingBoard(board);
                  setShowBoardSettingsModal(true);
                }}
                onDeleteBoard={(board) => {
                  setBoardToDelete(board);
                  setShowDeleteBoardModal(true);
                }}
                onDuplicateBoard={handleDuplicateBoard}
              />
            </motion.div>
          ) : view === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Kanban Board - Optimisé pleine hauteur */}
              <DragDropContext 
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
                onDragEnd={handleDragEnd}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex-1 overflow-x-auto min-h-0"
                >
                  <div className="flex gap-0 h-full min-w-min">
                    {/* Exclude 'archived' from visible columns - only show main workflow columns */}
                    {columnOrder.filter(col => col !== 'archived').map((status, columnIndex) => {
                      const visibleColumns = columnOrder.filter(col => col !== 'archived');
                      const statusCount = filteredApplications.filter(a => getEffectiveStatus(a.status) === status).length;
                      const isLastColumn = columnIndex === visibleColumns.length - 1;
                      // Use same color for all columns (like job applications board)
                      const columnColor = undefined;

                      return (
                        <div key={status} className="flex items-stretch h-full">
                          <Droppable droppableId={status}>
                            {(provided, snapshot) => (
                              <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 * columnIndex }}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 min-w-[280px] max-w-[340px] h-full flex flex-col bg-transparent p-3 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-gray-100/50 dark:bg-[#3d3c3e]/30 rounded-xl' : ''}`}
                              >
                              <div className="mb-2 sm:mb-3 text-center">
                                <div className="mb-2">
                                  <h3 
                                    className="font-semibold text-gray-900 dark:text-white uppercase text-xs sm:text-sm mb-1"
                                    style={columnColor ? { color: columnColor } : undefined}
                                  >
                                    {columnLabels[status] || status.replace('_', ' ').toUpperCase()}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {statusCount} {statusCount === 1 ? (currentBoardType === 'jobs' ? 'job' : 'contact') : (currentBoardType === 'jobs' ? 'jobs' : 'contacts')}
                                  </span>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setEventType('application');
                                    setWizardStep(1);
                                    setLookupSelectedApplication(null);
                                    setLinkedApplicationId(null);
                                    setLookupSearchQuery('');
                                    setShowLookupDropdown(false);
                                    setFormData({
                                      companyName: '',
                                      position: '',
                                      location: '',
                                      status: status as JobApplication['status'],
                                      appliedDate: new Date().toISOString().split('T')[0],
                                      url: '',
                                      description: '',
                                      fullJobDescription: '',
                                      notes: '',
                                      interviewType: 'technical',
                                      interviewTime: '09:00',
                                      interviewDate: new Date().toISOString().split('T')[0],
                                    });
                                    setNewApplicationModal(true);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#2b2a2c] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-900 dark:text-white transition-all duration-200 border border-gray-200 dark:border-[#3d3c3e] shadow-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Add</span>
                                </motion.button>
                              </div>

                              <div 
                                ref={(el) => {
                                  if (el) {
                                    columnScrollRefs.current.set(status, el);
                                  } else {
                                    columnScrollRefs.current.delete(status);
                                  }
                                }}
                                className="flex-1 overflow-y-auto space-y-2 sm:space-y-3"
                              >
                                <ApplicationList
                                  applications={filteredApplications.filter(a => getEffectiveStatus(a.status) === status)}
                                  onCardClick={(app) => {
                                    setSelectedApplication(app);
                                    setTimelineModal(true);
                                  }}
                                  getIsInactive={(app) => {
                                    try {
                                      return isApplicationInactive(app, automationSettings.inactiveReminder);
                                    } catch (error) {
                                      console.error('Error checking inactive status:', error);
                                      return false;
                                    }
                                  }}
                                  getInactiveDays={(app) => {
                                    try {
                                      return getInactiveDays(app);
                                    } catch (error) {
                                      console.error('Error getting inactive days:', error);
                                      return 0;
                                    }
                                  }}
                                  onCardDelete={(app) => {
                                    setDeleteModal({ show: true, application: app });
                                  }}
                                  showMoveToBoard={boards.length > 1}
                                  onMoveToBoard={(app) => {
                                    setApplicationToMove(app);
                                    setShowMoveToBoardModal(true);
                                  }}
                                  boardType={currentBoardType}
                                />
                                {provided.placeholder}
                              </div>
                            </motion.div>
                          )}
                        </Droppable>
                        
                        {/* Séparateur vertical droit entre les colonnes */}
                        {!isLastColumn && (
                          <div className="w-[2px] bg-gray-300 dark:bg-[#4a494b] mx-4 flex-shrink-0 rounded-full" />
                        )}
                      </div>
                      );
                    })}
                  </div>
                </motion.div>
              </DragDropContext>
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Analytics Dashboard */}
              {applications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="relative overflow-hidden bg-gradient-to-br from-white via-white to-violet-50/50 dark:from-[#2b2a2c] dark:via-[#2b2a2c] dark:to-violet-950/20 rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-12"
                >
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    
                    {/* Gradient orbs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    {/* Floating shapes */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-20 right-20 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200/30 dark:border-violet-800/30 rotate-12"
                    />
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute bottom-20 left-20 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/30 dark:border-blue-800/30 -rotate-6"
                    />
                  </div>
                  
                  <div className="relative max-w-md mx-auto text-center">
                    {/* Premium icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                      className="relative inline-flex mb-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl blur-xl opacity-30" />
                      <div className="relative p-5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-xl shadow-violet-500/25">
                        <LineChart className="w-10 h-10 text-white" />
                      </div>
                    </motion.div>
                    
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                    >
                      Your analytics await
                    </motion.h3>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed"
                    >
                      Start tracking your {currentBoardType === 'campaigns' ? 'networking contacts' : 'job applications'} to unlock powerful insights, track your progress, and optimize your strategy.
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="flex flex-col sm:flex-row items-center justify-center gap-3"
                    >
                  <button
                    onClick={() => {
                      setEventType(currentBoardType === 'campaigns' ? 'application' : null);
                      setWizardStep(1);
                      setLookupSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setLookupSearchQuery('');
                      setShowLookupDropdown(false);
                      setNewApplicationModal(true);
                    }}
                        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{currentBoardType === 'campaigns' ? 'Add Your First Contact' : 'Add Your First Application'}</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                    </motion.div>
                    
                    {/* Feature hints */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500"
                    >
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Track trends</span>
                </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#4a494b]" />
                      <div className="flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Visual insights</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#4a494b]" />
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>Find patterns</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Section 1: Premium Hero Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {(() => {
                      const rateData = getResponseRateData();
                      
                      // Color configurations for each metric
                      const getColorConfig = (rate: number, type: 'response' | 'interview' | 'offer') => {
                        const baseColors = {
                          response: { 
                            gradient: 'from-violet-500 to-purple-600',
                            bg: 'bg-violet-500',
                            text: 'text-violet-600 dark:text-violet-400',
                            ring: 'ring-violet-500/20',
                            glow: 'shadow-violet-500/20'
                          },
                          interview: { 
                            gradient: 'from-blue-500 to-indigo-600',
                            bg: 'bg-blue-500',
                            text: 'text-blue-600 dark:text-blue-400',
                            ring: 'ring-blue-500/20',
                            glow: 'shadow-blue-500/20'
                          },
                          offer: { 
                            gradient: 'from-emerald-500 to-teal-600',
                            bg: 'bg-emerald-500',
                            text: 'text-emerald-600 dark:text-emerald-400',
                            ring: 'ring-emerald-500/20',
                            glow: 'shadow-emerald-500/20'
                          }
                        };
                        return baseColors[type];
                      };

                      const getPerformanceLevel = (rate: number) => {
                        if (rate >= 30) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' };
                        if (rate >= 15) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' };
                        if (rate >= 5) return { label: 'Average', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' };
                        return { label: 'Needs Work', color: 'text-gray-500 dark:text-gray-400', dotColor: 'bg-gray-400' };
                      };
                      
                      // Circular progress component
                      const CircularProgress = ({ value, color, size = 72 }: { value: number; color: string; size?: number }) => {
                        const strokeWidth = 4;
                        const radius = (size - strokeWidth) / 2;
                        const circumference = radius * 2 * Math.PI;
                        const offset = circumference - (value / 100) * circumference;
                        
                        return (
                          <svg width={size} height={size} className="transform -rotate-90">
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke="currentColor"
                              strokeWidth={strokeWidth}
                              fill="none"
                              className="text-gray-100 dark:text-[#3d3c3e]"
                            />
                            <motion.circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke="url(#gradient)"
                              strokeWidth={strokeWidth}
                              fill="none"
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: offset }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              style={{
                                strokeDasharray: circumference,
                              }}
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" className={color.includes('violet') ? 'text-violet-500' : color.includes('blue') ? 'text-blue-500' : 'text-emerald-500'} style={{ stopColor: 'currentColor' }} />
                                <stop offset="100%" className={color.includes('violet') ? 'text-purple-600' : color.includes('blue') ? 'text-indigo-600' : 'text-teal-600'} style={{ stopColor: 'currentColor' }} />
                              </linearGradient>
                            </defs>
                          </svg>
                        );
                      };

                      // Mini sparkline component
                      const TrendSparkline = ({ trend, positive }: { trend: number; positive: boolean }) => {
                        const points = positive 
                          ? "0,20 10,18 20,15 30,12 40,8 50,5"
                          : "0,5 10,8 20,12 30,15 40,18 50,20";
                        return (
                          <svg width="50" height="24" viewBox="0 0 50 24" className="opacity-60">
                            <polyline
                              points={points}
                              fill="none"
                              stroke={positive ? '#10b981' : '#ef4444'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        );
                      };
                      
                      // Different metrics for jobs vs campaigns
                      const metrics = currentBoardType === 'jobs' ? [
                        {
                          label: 'Response Rate',
                          value: rateData.responseRate,
                          desc: 'Applications with responses',
                          trend: rateData.responseRateTrend,
                          type: 'response' as const,
                          icon: MessageSquare
                        },
                        {
                          label: 'Interview Rate',
                          value: rateData.interviewRate,
                          desc: 'Led to interviews',
                          trend: rateData.interviewRateTrend,
                          type: 'interview' as const,
                          icon: Users
                        },
                        {
                          label: 'Offer Rate',
                          value: rateData.offerRate,
                          desc: 'Resulted in offers',
                          trend: rateData.offerRateTrend,
                          type: 'offer' as const,
                          icon: Check
                        }
                      ] : [
                        {
                          label: 'Reply Rate',
                          value: rateData.responseRate,
                          desc: 'Contacts that replied',
                          trend: rateData.responseRateTrend,
                          type: 'response' as const,
                          icon: MessageSquare
                        },
                        {
                          label: 'Meeting Rate',
                          value: rateData.interviewRate,
                          desc: 'Led to meetings',
                          trend: rateData.interviewRateTrend,
                          type: 'interview' as const,
                          icon: Users
                        },
                        {
                          label: 'Opportunity Rate',
                          value: rateData.offerRate,
                          desc: 'Became opportunities',
                          trend: rateData.offerRateTrend,
                          type: 'offer' as const,
                          icon: Check
                        }
                      ];
                      
                      return metrics.map((metric, i) => {
                        const colorConfig = getColorConfig(metric.value, metric.type);
                        const performance = getPerformanceLevel(metric.value);
                        const IconComponent = metric.icon;
                        
                        return (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.23, 1, 0.32, 1] }}
                            className="group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500 hover:-translate-y-1"
                          >
                            {/* Subtle gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-white to-gray-50/50 dark:from-[#3d3c3e]/50 dark:via-[#2b2a2c] dark:to-[#3d3c3e]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            {/* Accent stripe */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorConfig.gradient} opacity-80`} />
                            
                            <div className="relative">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    {metric.label}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${performance.dotColor}`} />
                                    <span className={`text-xs font-medium ${performance.color}`}>
                                      {performance.label}
                                </span>
                              </div>
                            </div>
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorConfig.gradient} shadow-lg ${colorConfig.glow}`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                            </div>
                          </div>
                              
                              {/* Main metric with circular progress */}
                              <div className="flex items-center gap-5">
                                <div className="relative">
                                  <CircularProgress value={metric.value} color={colorConfig.gradient} />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                      {metric.value.toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
                                    {metric.value.toFixed(0)}%
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {metric.desc}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Trend indicator */}
                              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-[#3d3c3e]/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                            {metric.trend !== 0 ? (
                              <>
                                      <TrendSparkline trend={metric.trend} positive={metric.trend > 0} />
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className={`w-3.5 h-3.5 ${metric.trend > 0 ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} />
                                        <span className={`text-sm font-semibold tabular-nums ${metric.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                          {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                                </span>
                                      </div>
                              </>
                            ) : (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">No change</span>
                            )}
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">vs last month</span>
                              </div>
                          </div>
                        </motion.div>
                        );
                      });
                    })()}
                  </div>

                  {/* Section 2: Premium Bento Grid - Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Top Industries - Span 7 columns */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-7 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      {/* Subtle pattern background */}
                      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                              <Briefcase className="w-4 h-4 text-white" />
                      </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Industries</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{getIndustryDistribution().length} tracked</p>
                            </div>
                          </div>
                        </div>
                        
                      {getIndustryDistribution().length > 0 ? (
                          <div className="space-y-4">
                          {getIndustryDistribution().slice(0, 5).map((item, i) => {
                            const maxCount = getIndustryDistribution()[0]?.count || 1;
                            const widthPercentage = (item.count / maxCount) * 100;
                            return (
                                <motion.div 
                                  key={item.industry}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.4 + 0.08 * i }}
                                  className="group/item"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover/item:text-violet-600 dark:group-hover/item:text-violet-400 transition-colors">
                                      {item.industry}
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                                        {item.count} {currentBoardType === 'jobs' ? 'apps' : 'contacts'}
                                      </span>
                                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
                                        {item.interviewRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                  <div className="relative h-2 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercentage}%` }}
                                      transition={{ duration: 0.6, delay: 0.5 + 0.08 * i, ease: [0.23, 1, 0.32, 1] }}
                                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                  />
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000" />
                                </div>
                                </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                          <div className="text-center py-10">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center mx-auto mb-3">
                              <Briefcase className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No industry data yet</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add {currentBoardType === 'jobs' ? 'jobs' : 'contacts'} with AI extraction</p>
                        </div>
                      )}
                      </div>
                    </motion.div>

                    {/* Top Technologies - Span 5 columns */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-5 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                              <Code className="w-4 h-4 text-white" />
                      </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Technologies</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{getTechnologyDistribution().length} skills</p>
                            </div>
                          </div>
                        </div>
                        
                      {getTechnologyDistribution().length > 0 ? (
                          <div className="space-y-5">
                            {/* Tag Cloud - Refined */}
                            <div className="flex flex-wrap gap-2">
                              {getTechnologyDistribution().slice(0, 8).map((item, i) => {
                              const maxCount = getTechnologyDistribution()[0]?.count || 1;
                                const intensity = Math.max(0.4, item.count / maxCount);
                              return (
                                <motion.span
                                  key={item.tech}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.5 + 0.05 * i }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 hover:scale-105 cursor-default dark:border-[#3d3c3e]"
                                    style={{
                                      backgroundColor: `rgba(59, 130, 246, ${intensity * 0.15})`,
                                      borderColor: `rgba(59, 130, 246, ${intensity * 0.3})`,
                                      color: intensity > 0.6 ? '#2563eb' : '#6b7280',
                                    }}
                                >
                                  {item.tech}
                                    <span className="ml-1.5 opacity-60">{item.count}</span>
                                </motion.span>
                              );
                            })}
                          </div>
                            
                            {/* Mini bar chart */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#3d3c3e]">
                              {getTechnologyDistribution().slice(0, 3).map((item, i) => {
                              const maxCount = getTechnologyDistribution()[0]?.count || 1;
                              const widthPercentage = (item.count / maxCount) * 100;
                              return (
                                  <div key={item.tech} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 w-20 truncate">{item.tech}</span>
                                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${widthPercentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.6 + 0.1 * i }}
                                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                    />
                                  </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-6 text-right">{item.count}</span>
                                </div>
                              );
                            })}
                          </div>
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center mx-auto mb-3">
                              <Code className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No technology data yet</p>
                        </div>
                      )}
                      </div>
                    </motion.div>

                    {/* Seniority Distribution - Span 6 columns */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-6 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                              <Users className="w-4 h-4 text-white" />
                      </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Seniority Levels</h3>
                          </div>
                        </div>
                        
                      {getSeniorityDistribution().length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                          {getSeniorityDistribution().map((item, i) => {
                            const total = getSeniorityDistribution().reduce((sum, s) => sum + s.count, 0);
                            const percentage = total > 0 ? (item.count / total) * 100 : 0;
                              const colors = ['from-cyan-500 to-blue-500', 'from-blue-500 to-indigo-500', 'from-indigo-500 to-violet-500', 'from-violet-500 to-purple-500'];
                            return (
                                <motion.div 
                                  key={item.seniority}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.4, delay: 0.6 + 0.08 * i }}
                                  className="p-4 rounded-xl bg-gray-50/80 dark:bg-[#3d3c3e]/30 border border-gray-100 dark:border-[#3d3c3e]/50 hover:border-gray-200 dark:hover:border-[#4a494b] transition-all duration-300"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.seniority}</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{percentage.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 dark:bg-[#4a494b] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.6, delay: 0.7 + 0.08 * i }}
                                      className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full`}
                                  />
                                </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.count} total</span>
                                    <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{item.interviewRate.toFixed(0)}% success</span>
                              </div>
                                </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No seniority data available</p>
                        </div>
                      )}
                      </div>
                    </motion.div>

                    {/* Employment Type - Span 6 columns */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-6 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                              <Briefcase className="w-4 h-4 text-white" />
                      </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Employment Types</h3>
                          </div>
                        </div>
                        
                      {getEmploymentTypeDistribution().length > 0 ? (
                        <div className="space-y-3">
                          {getEmploymentTypeDistribution().map((item, i) => {
                            const maxCount = getEmploymentTypeDistribution()[0]?.count || 1;
                            const widthPercentage = (item.count / maxCount) * 100;
                            return (
                                <motion.div 
                                  key={item.type}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.7 + 0.08 * i }}
                                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/80 dark:bg-[#3d3c3e]/30 border border-gray-100 dark:border-[#3d3c3e]/50 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-300 group/item"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{item.count}</span>
                                  </div>
                                    <div className="h-1.5 bg-gray-200 dark:bg-[#4a494b] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.8 + 0.08 * i }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                  />
                                </div>
                              </div>
                                  <div className="text-right">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Success</span>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{item.interviewRate.toFixed(0)}%</p>
                                  </div>
                                </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No employment type data available</p>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Section 3: Premium Location & Success Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Location Insights - Span 8 columns */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-8 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      {/* Decorative gradient */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                            <MapPin className="w-4 h-4 text-white" />
                    </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Location Insights</h3>
                        </div>
                        
                    {(() => {
                      const locationData = getLocationInsights();
                      return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Work Arrangement - Visual cards */}
                          <div>
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Work Arrangement</h4>
                            <div className="space-y-3">
                                  {locationData.byType.map((item, i) => {
                                    const icons: Record<string, any> = {
                                      'Remote': '🏠',
                                      'Hybrid': '🔀',
                                      'On-site': '🏢',
                                      'Flexible': '✨'
                                    };
                                    return (
                                      <motion.div 
                                        key={item.type}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.8 + 0.1 * i }}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-[#3d3c3e]/50 dark:to-[#3d3c3e]/30 border border-gray-100 dark:border-[#3d3c3e]/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-300"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-lg">{icons[item.type] || '📍'}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                                  </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{item.count}</span>
                                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                                            {item.interviewRate.toFixed(0)}%
                                    </span>
                                  </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                            </div>
                              
                              {/* Top Locations - Ranked list */}
                          <div>
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Top Locations</h4>
                            <div className="space-y-2">
                              {locationData.byLocation.slice(0, 5).map((item, i) => (
                                    <motion.div 
                                      key={item.location}
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: 0.8 + 0.1 * i }}
                                      className="flex items-center gap-3"
                                    >
                                      <span className="text-xs font-bold text-gray-300 dark:text-gray-500 w-4 tabular-nums">
                                        {i + 1}
                                      </span>
                                      <div className="flex-1 flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#3d3c3e]/50">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.location}</span>
                                  <div className="flex items-center gap-3">
                                          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{item.count}</span>
                                          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tabular-nums">
                                      {item.interviewRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                    </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                      </div>
                  </motion.div>

                    {/* Success Patterns - Span 4 columns */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-4 group relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/30 dark:via-[#2b2a2c] dark:to-indigo-950/30 rounded-2xl border border-violet-200/60 dark:border-violet-800/30 p-6"
                    >
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full" />
                      
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Sweet Spots</h3>
                        </div>
                        
                    {(() => {
                      const patterns = getSuccessPatterns();
                          const rateLabel = currentBoardType === 'jobs' ? 'success' : 'reply';
                          
                          const insights = [
                            patterns.bestSeniority && {
                              label: 'Best Level',
                              value: patterns.bestSeniority.seniority,
                              rate: patterns.bestSeniority.interviewRate,
                              icon: Target,
                              color: 'from-emerald-500 to-teal-500'
                            },
                            patterns.bestLocationType && {
                              label: 'Best Arrangement',
                              value: patterns.bestLocationType.type,
                              rate: patterns.bestLocationType.interviewRate,
                              icon: MapPin,
                              color: 'from-blue-500 to-indigo-500'
                            },
                            patterns.topIndustries[0] && {
                              label: 'Top Industry',
                              value: patterns.topIndustries[0].industry,
                              rate: patterns.topIndustries[0].interviewRate,
                              icon: TrendingUp,
                              color: 'from-violet-500 to-purple-500'
                            }
                          ].filter(Boolean);
                          
                          return (
                            <div className="space-y-4">
                              {insights.map((insight: any, i) => {
                                const IconComp = insight.icon;
                                return (
                                  <motion.div
                                    key={insight.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.9 + 0.1 * i }}
                                    className="p-4 rounded-xl bg-white/70 dark:bg-[#3d3c3e]/50 backdrop-blur-sm border border-white dark:border-[#3d3c3e]/50 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{insight.label}</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                          {insight.value}
                                        </p>
                                </div>
                                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${insight.color} text-white text-xs font-bold shadow-sm`}>
                                        {insight.rate.toFixed(0)}%
                            </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                              
                              {/* Top Technologies mini section */}
                              {patterns.topTechnologies.length > 0 && (
                                <div className="pt-4 border-t border-violet-200/50 dark:border-violet-800/30">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Hot Technologies</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {patterns.topTechnologies.slice(0, 5).map((tech) => (
                                <span
                                  key={tech.tech}
                                        className="px-2 py-1 text-xs font-medium rounded-md bg-white dark:bg-[#3d3c3e]/80 border border-gray-200 dark:border-[#4a494b] text-gray-700 dark:text-gray-300"
                                >
                                  {tech.tech}
                                </span>
                              ))}
                            </div>
                            </div>
                              )}
                            </div>
                          );
                        })()}
                          </div>
                        </motion.div>
                  </div>

                  {/* Section 5: Premium Timeline & Time Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Timeline Chart - Span 8 columns */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-8 group relative overflow-hidden bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-[#3d3c3e]/50 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500"
                    >
                      {/* Grid pattern background */}
                      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {currentBoardType === 'jobs' ? 'Applications' : 'Outreach'} Over Time
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Last 6 months activity</p>
                            </div>
                    </div>

                          {/* Legend - Horizontal pills */}
                          <div className="hidden md:flex items-center gap-2 flex-wrap">
                            {(currentBoardType === 'jobs' ? [
                              { label: 'Applied', color: 'bg-blue-500' },
                              { label: 'Interview', color: 'bg-violet-500' },
                              { label: 'Offer', color: 'bg-emerald-500' }
                            ] : [
                              { label: 'Contacted', color: 'bg-blue-500' },
                              { label: 'Replied', color: 'bg-cyan-500' },
                              { label: 'Meeting', color: 'bg-violet-500' }
                            ]).map(item => (
                              <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Premium Chart Area */}
                        <div className="relative h-52">
                          {/* Y-axis labels */}
                          <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-right pr-2">
                            <span className="text-[10px] text-gray-400 tabular-nums">max</span>
                            <span className="text-[10px] text-gray-400 tabular-nums">0</span>
                          </div>
                          
                          {/* Chart grid and bars */}
                          <div className="ml-10 h-full flex items-end justify-between gap-2 relative">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                              {[0, 1, 2, 3].map(i => (
                                <div key={i} className="border-b border-gray-100 dark:border-[#4a494b]/50 border-dashed" />
                              ))}
                            </div>
                            
                      {getMonthlyApplicationData().map(([month, data], i) => {
                        const total = currentBoardType === 'jobs' 
                          ? (data.applied || 0) + (data.interviews || 0) + (data.pending || 0) + (data.offers || 0) + (data.rejected || 0)
                          : (data.targets || 0) + (data.contacted || 0) + (data.follow_up || 0) + (data.replied || 0) + (data.meeting || 0) + (data.opportunity || 0);
                              
                              const allTotals = getMonthlyApplicationData().map(([_, d]) => 
                                currentBoardType === 'jobs' 
                                  ? (d.applied || 0) + (d.interviews || 0) + (d.pending || 0) + (d.offers || 0) + (d.rejected || 0)
                                  : (d.targets || 0) + (d.contacted || 0) + (d.follow_up || 0) + (d.replied || 0) + (d.meeting || 0) + (d.opportunity || 0)
                              );
                              const maxTotal = Math.max(...allTotals, 1);
                              const heightPercent = (total / maxTotal) * 100;
                              
                        const segments = currentBoardType === 'jobs' ? [
                                { type: 'rejected', count: data.rejected || 0, color: 'from-rose-400 to-rose-500' },
                                { type: 'offers', count: data.offers || 0, color: 'from-emerald-400 to-emerald-500' },
                                { type: 'pending', count: data.pending || 0, color: 'from-amber-400 to-amber-500' },
                                { type: 'interviews', count: data.interviews || 0, color: 'from-violet-400 to-violet-500' },
                                { type: 'applied', count: data.applied || 0, color: 'from-blue-400 to-blue-500' }
                              ] : [
                                { type: 'opportunity', count: data.opportunity || 0, color: 'from-emerald-400 to-emerald-500' },
                                { type: 'meeting', count: data.meeting || 0, color: 'from-violet-400 to-violet-500' },
                                { type: 'replied', count: data.replied || 0, color: 'from-cyan-400 to-cyan-500' },
                                { type: 'follow_up', count: data.follow_up || 0, color: 'from-amber-400 to-amber-500' },
                                { type: 'contacted', count: data.contacted || 0, color: 'from-blue-400 to-blue-500' },
                                { type: 'targets', count: data.targets || 0, color: 'from-gray-300 to-gray-400' }
                        ];

                        return (
                                <div key={month} className="flex-1 flex flex-col items-center gap-2 group/bar relative">
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    <div className="bg-gray-900 dark:bg-[#3d3c3e] text-white dark:text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                                      <span className="font-semibold">{total}</span> total
                                    </div>
                                  </div>
                                  
                                  {/* Bar container */}
                                  <div className="w-full max-w-12 h-36 flex flex-col-reverse items-center relative rounded-t-lg overflow-hidden bg-gray-50 dark:bg-[#3d3c3e]/50">
                              {segments.map((segment, j) => {
                                      const segmentHeight = total > 0 ? (segment.count / total) * heightPercent : 0;
                                      return segment.count > 0 ? (
                                  <motion.div
                                    key={segment.type}
                                    initial={{ height: 0 }}
                                          animate={{ height: `${segmentHeight}%` }}
                                          transition={{ duration: 0.6, delay: 1.0 + 0.05 * j + 0.08 * i, ease: [0.23, 1, 0.32, 1] }}
                                          className={`w-full bg-gradient-to-t ${segment.color}`}
                                        />
                                      ) : null;
                              })}
                            </div>
                                  
                                  {/* Month label */}
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {new Date(month).toLocaleDateString(undefined, { month: 'short' })}
                                  </span>
                          </div>
                        );
                      })}
                          </div>
                    </div>

                        {/* Mobile legend */}
                        <div className="flex md:hidden justify-center mt-4 gap-3 flex-wrap">
                      {(currentBoardType === 'jobs' ? [
                        { label: 'Applied', color: 'bg-blue-500' },
                            { label: 'Interview', color: 'bg-violet-500' },
                        { label: 'Pending', color: 'bg-amber-500' },
                            { label: 'Offer', color: 'bg-emerald-500' },
                            { label: 'Rejected', color: 'bg-rose-500' }
                      ] : [
                        { label: 'Targets', color: 'bg-gray-400' },
                        { label: 'Contacted', color: 'bg-blue-500' },
                        { label: 'Follow-up', color: 'bg-amber-500' },
                        { label: 'Replied', color: 'bg-cyan-500' },
                            { label: 'Meeting', color: 'bg-violet-500' },
                            { label: 'Opportunity', color: 'bg-emerald-500' }
                      ]).map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${item.color}`} />
                              <span className="text-xs text-gray-500">{item.label}</span>
                        </div>
                      ))}
                        </div>
                    </div>
                  </motion.div>

                    {/* Time Metrics - Span 4 columns */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-4 flex flex-col gap-4"
                    >
                    {(currentBoardType === 'jobs' ? [
                      {
                          label: 'Days to Interview',
                          sublabel: 'Average response time',
                        value: getAverageTimeData().avgDaysToInterview,
                          icon: Clock,
                          color: 'from-blue-500 to-cyan-500',
                          bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
                          borderColor: 'border-blue-200/60 dark:border-blue-800/40'
                      },
                      {
                          label: 'Days to Offer',
                          sublabel: 'Full pipeline duration',
                        value: getAverageTimeData().avgDaysToOffer,
                          icon: CheckCircle,
                          color: 'from-emerald-500 to-teal-500',
                          bgColor: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
                          borderColor: 'border-emerald-200/60 dark:border-emerald-800/40'
                      }
                    ] : [
                      {
                          label: 'Days to Reply',
                          sublabel: 'Average response time',
                        value: getAverageTimeData().avgDaysToInterview,
                          icon: Clock,
                          color: 'from-blue-500 to-cyan-500',
                          bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
                          borderColor: 'border-blue-200/60 dark:border-blue-800/40'
                      },
                      {
                          label: 'Days to Meeting',
                          sublabel: 'Full pipeline duration',
                        value: getAverageTimeData().avgDaysToOffer,
                          icon: CheckCircle,
                          color: 'from-emerald-500 to-teal-500',
                          bgColor: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
                          borderColor: 'border-emerald-200/60 dark:border-emerald-800/40'
                      }
                      ]).map((metric, i) => {
                        const IconComp = metric.icon;
                        return (
                      <motion.div
                        key={metric.label}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 1.1 + 0.1 * i }}
                            className={`flex-1 relative overflow-hidden bg-gradient-to-br ${metric.bgColor} rounded-2xl border ${metric.borderColor} p-5 hover:shadow-lg transition-all duration-300`}
                          >
                            {/* Decorative circle */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/50 dark:from-[#3d3c3e]/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                            
                            <div className="relative flex items-start justify-between">
                          <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  {metric.label}
                                </p>
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {metric.value}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
                            </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{metric.sublabel}</p>
                              </div>
                              <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                                <IconComp className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Filter Modals */}
        <AnimatePresence>
          {/* Date Filter Modal */}
          {openFilterModal === 'date' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Date</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      {currentBoardType === 'campaigns' ? 'Last Contacted Date' : 'Applied Date'}
                    </label>
                    <div className="space-y-2">
                      {['all', '7d', '30d', '3m', '6m', 'custom'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="dateFilter"
                            value={option}
                            checked={dateFilter === option}
                            onChange={(e) => {
                              setDateFilter(e.target.value as any);
                              if (option !== 'custom') {
                                setCustomDateRange(null);
                              }
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? 'All dates' :
                              option === '7d' ? 'Last 7 days' :
                                option === '30d' ? 'Last 30 days' :
                                  option === '3m' ? 'Last 3 months' :
                                    option === '6m' ? 'Last 6 months' :
                                      'Custom range'}
                          </span>
                        </label>
                      ))}
                    </div>
                    {dateFilter === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Start Date</label>
                          <input
                            type="date"
                            value={customDateRange?.start || ''}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev || { start: '', end: '' }, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#3d3c3e] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">End Date</label>
                          <input
                            type="date"
                            value={customDateRange?.end || ''}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev || { start: '', end: '' }, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#3d3c3e] text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Last Updated</label>
                    <div className="space-y-2">
                      {['all', '24h', '7d', '30d'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="updateDateFilter"
                            value={option}
                            checked={updateDateFilter === option}
                            onChange={(e) => setUpdateDateFilter(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? 'All time' :
                              option === '24h' ? 'Last 24 hours' :
                                option === '7d' ? 'Last 7 days' :
                                  'Last 30 days'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setCustomDateRange(null);
                      setUpdateDateFilter('all');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Interview Filter Modal */}
          {openFilterModal === 'interview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filter by {currentBoardType === 'campaigns' ? 'Meetings' : 'Interviews'}
                  </h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                      {currentBoardType === 'campaigns' ? 'Meeting Presence' : 'Interview Presence'}
                    </label>
                    <div className="space-y-2">
                      {['all', 'with', 'without', 'upcoming'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="hasInterviews"
                            value={option}
                            checked={hasInterviews === option}
                            onChange={(e) => setHasInterviews(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option === 'all' ? `All ${currentBoardType === 'campaigns' ? 'contacts' : 'applications'}` :
                              option === 'with' ? `With ${currentBoardType === 'campaigns' ? 'meetings' : 'interviews'}` :
                              option === 'without' ? `Without ${currentBoardType === 'campaigns' ? 'meetings' : 'interviews'}` :
                                `Upcoming ${currentBoardType === 'campaigns' ? 'meetings' : 'interviews'} only`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                      {currentBoardType === 'campaigns' ? 'Meeting Types' : 'Interview Types'}
                    </label>
                    <div className="space-y-2">
                      {(currentBoardType === 'campaigns' 
                        ? (['coffee_chat', 'call', 'video_call', 'in_person', 'other'] as MeetingType[])
                        : ['technical', 'hr', 'manager', 'final', 'other']
                      ).map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInterviewTypes([...interviewTypes, type]);
                              } else {
                                setInterviewTypes(interviewTypes.filter(t => t !== type));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {currentBoardType === 'campaigns' && type in MEETING_TYPE_LABELS
                              ? MEETING_TYPE_LABELS[type as MeetingType]
                              : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                      {currentBoardType === 'campaigns' ? 'Meeting Status' : 'Interview Status'}
                    </label>
                    <div className="space-y-2">
                      {(currentBoardType === 'campaigns' 
                        ? ['scheduled', 'completed', 'cancelled', 'rescheduled']
                        : ['scheduled', 'completed', 'cancelled']
                      ).map((status) => (
                        <label key={status} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInterviewStatus([...interviewStatus, status]);
                              } else {
                                setInterviewStatus(interviewStatus.filter(s => s !== status));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                      Upcoming {currentBoardType === 'campaigns' ? 'Meetings' : 'Interviews'}
                    </label>
                    <div className="space-y-2">
                      {[null, 7, 14, 30].map((days) => (
                        <label key={days || 'all'} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="upcomingInterviewsDays"
                            checked={upcomingInterviewsDays === days}
                            onChange={() => setUpcomingInterviewsDays(days)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {days === null ? 'All upcoming' : `Within next ${days} days`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setHasInterviews('all');
                      setInterviewTypes([]);
                      setInterviewStatus([]);
                      setUpcomingInterviewsDays(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Company Filter Modal */}
          {openFilterModal === 'company' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Company</h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#3d3c3e] text-sm"
                  />
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="space-y-2">
                    {uniqueCompanies
                      .filter(company => company.toLowerCase().includes(companySearchQuery.toLowerCase()))
                      .map((company) => {
                        const count = currentBoardApplications.filter(app => app.companyName === company).length;
                        return (
                          <label key={company} className="flex items-center justify-between gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] rounded-lg">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedCompanies.includes(company)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCompanies([...selectedCompanies, company]);
                                  } else {
                                    setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{company}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {count} {count === 1 ? (currentBoardType === 'campaigns' ? 'contact' : 'application') : (currentBoardType === 'campaigns' ? 'contacts' : 'applications')}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {selectedCompanies.length > 0 && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Selected:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompanies.map((company) => (
                        <span
                          key={company}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        >
                          {company}
                          <button
                            onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c !== company))}
                            className="hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedCompanies([]);
                      setCompanySearchQuery('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Sort Filter Modal */}
          {openFilterModal === 'sort' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFilterModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sort {currentBoardType === 'campaigns' ? 'Contacts' : 'Applications'}
                  </h3>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Sort By</label>
                    <div className="space-y-2">
                      {(currentBoardType === 'campaigns' ? [
                        { value: 'lastContactedAt', label: 'Last Contacted Date' },
                        { value: 'updatedAt', label: 'Last Updated' },
                        { value: 'companyName', label: 'Company Name' },
                        { value: 'contactName', label: 'Contact Name' },
                        { value: 'meetingCount', label: 'Number of Meetings' }
                      ] : [
                        { value: 'appliedDate', label: 'Applied Date' },
                        { value: 'updatedAt', label: 'Last Updated' },
                        { value: 'companyName', label: 'Company Name' },
                        { value: 'position', label: 'Position' },
                        { value: 'interviewCount', label: 'Number of Interviews' }
                      ]).map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Order</label>
                    <div className="space-y-2">
                      {['asc', 'desc'].map((order) => (
                        <label key={order} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sortOrder"
                            value={order}
                            checked={sortOrder === order}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {order === 'asc' ? 'Ascending (A-Z, Oldest first)' : 'Descending (Z-A, Newest first)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSortBy(currentBoardType === 'campaigns' ? 'lastContactedAt' : 'appliedDate');
                      setSortOrder('desc');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setOpenFilterModal(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing modals */}
        <AnimatePresence>
          {newApplicationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEventType(null);
                setLookupSelectedApplication(null);
                setLinkedApplicationId(null);
                setLookupSearchQuery('');
                setShowLookupDropdown(false);
                setFormData({
                  companyName: '',
                  position: '',
                  location: '',
                  status: 'applied',
                  appliedDate: new Date().toISOString().split('T')[0],
                  url: '',
                  description: '',
                  fullJobDescription: '',
                  notes: '',
                  interviewType: 'technical',
                  interviewTime: '09:00',
                  interviewDate: new Date().toISOString().split('T')[0],
                });
                setNewApplicationModal(false);
                setShowFullForm(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#3d3c3e] flex items-center justify-between bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl z-10 sticky top-0">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                      {eventType ? (eventType === 'application' 
                        ? (currentBoardType === 'campaigns' ? 'New Outreach' : 'New Application') 
                        : 'Schedule Interview') : 'Add to Tracker'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {eventType ? (eventType === 'application' 
                        ? (currentBoardType === 'campaigns' ? 'Track a new outreach contact' : 'Track a new job opportunity') 
                        : 'Add an upcoming interview') : 'Select an event type'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEventType(null);
                      setLookupSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setLookupSearchQuery('');
                      setShowLookupDropdown(false);
                      setFormData({
                        companyName: '',
                        position: '',
                        location: '',
                        status: 'applied',
                        appliedDate: new Date().toISOString().split('T')[0],
                        url: '',
                        description: '',
                        notes: ''
                      });
                      setNewApplicationModal(false);
                      setShowFullForm(false);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateApplication(); }} className="space-y-6">
                    {/* Selection Cards - Only for Jobs board, Campaigns go directly to form */}
                    {!eventType && currentBoardType !== 'campaigns' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEventType('application');
                            setShowFullForm(false);
                            setWizardStep(1);
                          }}
                          className="group relative p-6 rounded-2xl border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] hover:bg-white dark:hover:bg-[#3d3c3e] hover:shadow-lg hover:border-transparent transition-all text-left"
                        >
                          <div className="flex flex-col items-start gap-4">
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-6 h-6 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                Job Application
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Track a new job application
                              </p>
                            </div>
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEventType('interview');
                            setShowFullForm(true);
                          }}
                          className="group relative p-6 rounded-2xl border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] hover:bg-white dark:hover:bg-[#3d3c3e] hover:shadow-lg hover:border-transparent transition-all text-left"
                        >
                          <div className="flex flex-col items-start gap-4">
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                              <CalIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                Interview
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Schedule an interview
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Form Content */}
                    {eventType && (
                      <>
                        {/* Switcher - Only for Jobs board (Campaigns go directly to outreach) */}
                        {currentBoardType !== 'campaigns' && (
                        <div className="relative p-1 bg-gray-100 dark:bg-[#2b2a2c] rounded-xl">
                          <div className="flex items-center relative">
                            {/* Sliding pill indicator */}
                            <motion.div
                              className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-[#3d3c3e] shadow-sm"
                              initial={false}
                              animate={{
                                left: eventType === 'application' ? '4px' : 'calc(50% + 2px)',
                                right: eventType === 'interview' ? '4px' : 'calc(50% + 2px)',
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              }}
                            />
                            
                              {/* Application button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEventType('application');
                                setLookupSelectedApplication(null);
                                setLinkedApplicationId(null);
                                setLookupSearchQuery('');
                                setShowLookupDropdown(false);
                                setShowFullForm(false);
                                  setWizardStep(1);
                              }}
                              className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                            >
                                <Briefcase className={`w-4 h-4 transition-colors duration-150 ${
                                  eventType === 'application' 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`} />
                              <span className={eventType === 'application' 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400'
                              }>
                                  Application
                              </span>
                            </button>
                            
                              {/* Interview button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEventType('interview');
                                setShowFullForm(true);
                              }}
                              className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                            >
                              <CalIcon className={`w-4 h-4 transition-colors duration-150 ${
                                eventType === 'interview' 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`} />
                              <span className={eventType === 'interview' 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400'
                              }>
                                  Interview
                              </span>
                            </button>
                          </div>
                        </div>
                        )}

                        {/* Job URL (Application only - Jobs board) */}
                        {eventType === 'application' && currentBoardType === 'jobs' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                                Job Posting URL
                              </label>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Powered
                              </span>
                            </div>
                            <div className="relative flex items-center group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl opacity-30 blur-sm group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                              <div className="relative flex items-center w-full bg-white dark:bg-[#242325] rounded-xl">
                                <input
                                  type="url"
                                  value={formData.url || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                  className="w-full pl-4 pr-24 py-3 bg-transparent border-0 focus:ring-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                  placeholder="https://linkedin.com/jobs/..."
                                  autoFocus
                                />
                                <div className="absolute right-1.5">
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleExtractJobInfo}
                                    disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white text-xs font-medium shadow-sm border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#303030] disabled:opacity-50 transition-all"
                                  >
                                    {isAnalyzingJob ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3 text-purple-500" />
                                    )}
                                    {isAnalyzingJob ? 'Analyzing...' : 'Auto-Fill'}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Campaigns: Wizard-based Outreach Form */}
                        {eventType === 'application' && currentBoardType === 'campaigns' && (
                          <div className="space-y-6">
                            {/* Wizard Step Indicator */}
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => setWizardStep(1)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                  wizardStep === 1
                                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25'
                                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  wizardStep === 1 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                                }`}>
                                  1
                                </div>
                                <span className="font-medium text-sm">Contact</span>
                              </button>
                              
                              <div className="w-8 h-0.5 bg-gray-200 dark:bg-[#3d3c3e]" />
                              
                              <button
                                type="button"
                                onClick={() => formData.contactName && formData.companyName && setWizardStep(2)}
                                disabled={!formData.contactName || !formData.companyName}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                  wizardStep === 2
                                    ? 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white shadow-lg shadow-[#EC4899]/25'
                                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b] disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  wizardStep === 2 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                                }`}>
                                  2
                                </div>
                                <span className="font-medium text-sm">Strategy</span>
                              </button>
                            </div>

                            {/* Contact Preview Card */}
                            {(formData.contactName || formData.companyName) && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/5 to-[#EC4899]/5 border border-[#8B5CF6]/20 dark:border-[#8B5CF6]/10"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                                    {(formData.contactName || 'N').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                                      {formData.contactName || 'Contact Name'}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                      {formData.contactRole || 'Role'} @ {formData.companyName || 'Company'}
                                    </p>
                                  </div>
                                  {formData.warmthLevel && (
                                    <WarmthIndicator level={formData.warmthLevel as WarmthLevel} size="md" />
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* Step 1: Contact Information */}
                            <AnimatePresence mode="wait">
                              {wizardStep === 1 && (
                                <motion.div
                                  key="step1"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-2 gap-4">
                            <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Contact Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                        value={formData.contactName || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                        placeholder="John Doe"
                                autoFocus
                              />
                            </div>
                            <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Role/Title <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                        value={formData.contactRole || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                        placeholder="Head of Engineering"
                              />
                            </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                      Company <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.companyName || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                      className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                      placeholder="Google, Spotify..."
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Email
                                      </label>
                                      <input
                                        type="email"
                                        value={formData.contactEmail || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                        placeholder="john@company.com"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        LinkedIn
                                      </label>
                                      <input
                                        type="url"
                                        value={formData.contactLinkedIn || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactLinkedIn: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                        placeholder="linkedin.com/in/johndoe"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Step 2: Outreach Strategy */}
                              {wizardStep === 2 && (
                                <motion.div
                                  key="step2"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-5"
                                >
                                  {/* Relationship Goal */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                      Relationship Goal
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                      {[
                                        { value: 'networking', label: 'Networking', icon: '🤝', color: 'from-blue-500 to-indigo-500' },
                                        { value: 'prospecting', label: 'Prospecting', icon: '🎯', color: 'from-purple-500 to-pink-500' },
                                        { value: 'referral', label: 'Referral', icon: '⭐', color: 'from-amber-500 to-orange-500' },
                                      ].map((goal) => (
                                        <motion.button
                                          key={goal.value}
                                          type="button"
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => setFormData(prev => ({ ...prev, relationshipGoal: goal.value as RelationshipGoal }))}
                                          className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                            formData.relationshipGoal === goal.value
                                              ? `bg-gradient-to-br ${goal.color} border-transparent text-white shadow-lg`
                                              : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                          }`}
                                        >
                                          <span className="text-2xl block mb-1">{goal.icon}</span>
                                          <span className="text-xs font-bold">{goal.label}</span>
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Warmth Level */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                      Relationship Warmth
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                      {[
                                        { value: 'cold', label: 'Cold', icon: '❄️', color: 'from-slate-400 to-slate-500' },
                                        { value: 'warm', label: 'Warm', icon: '🌤️', color: 'from-amber-400 to-orange-500' },
                                        { value: 'hot', label: 'Hot', icon: '🔥', color: 'from-red-500 to-rose-600' },
                                      ].map((warmth) => (
                                        <motion.button
                                          key={warmth.value}
                                          type="button"
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => setFormData(prev => ({ ...prev, warmthLevel: warmth.value as WarmthLevel }))}
                                          className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                            formData.warmthLevel === warmth.value
                                              ? `bg-gradient-to-br ${warmth.color} border-transparent text-white shadow-lg`
                                              : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                          }`}
                                        >
                                          <span className="text-2xl block mb-1">{warmth.icon}</span>
                                          <span className="text-xs font-bold">{warmth.label}</span>
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Outreach Channel */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                      Outreach Channel
                                    </label>
                                    <div className="grid grid-cols-6 gap-2">
                                      {[
                                        { value: 'email', icon: '✉️' },
                                        { value: 'linkedin', icon: '💼' },
                                        { value: 'referral', icon: '🤝' },
                                        { value: 'event', icon: '🎤' },
                                        { value: 'cold_call', icon: '📞' },
                                        { value: 'other', icon: '📋' },
                                      ].map((channel) => (
                                        <button
                                          key={channel.value}
                                          type="button"
                                          onClick={() => setFormData(prev => ({ ...prev, outreachChannel: channel.value as OutreachChannel }))}
                                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                                            formData.outreachChannel === channel.value
                                              ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-sm'
                                              : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                          }`}
                                        >
                                          <span className="text-xl">{channel.icon}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Contact Date */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                      Contact Date <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                      value={formData.appliedDate || ''}
                                      onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                                      placeholder="Select date"
                                      required
                                      className="w-full"
                                    />
                                  </div>

                                  {/* Initial Message */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                      Initial Message (optional)
                                    </label>
                                    <textarea
                                      value={formData.messageSent || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, messageSent: e.target.value }))}
                                      rows={3}
                                      className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all resize-none"
                                      placeholder="Draft or summary of your outreach message..."
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Interview Link Search - Premium Design */}
                        {eventType === 'interview' && (
                          <div className="space-y-3">
                            <div className="text-center">
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                Link to Application
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Search and select an existing application
                              </p>
                            </div>
                            
                            <div className="relative">
                              <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-lg opacity-20 blur-sm group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative flex items-center w-full bg-white dark:bg-[#242325] rounded-lg border border-gray-200 dark:border-[#3d3c3e]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={lookupSearchQuery}
                                  onChange={(e) => {
                                    setLookupSearchQuery(e.target.value);
                                    setShowLookupDropdown(true);
                                  }}
                                  onFocus={() => setShowLookupDropdown(true)}
                                  className="w-full pl-10 pr-10 py-2.5 bg-transparent border-0 focus:ring-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                  placeholder="Search by company or position..."
                                />
                                {lookupSelectedApplication && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLookupSelectedApplication(null);
                                      setLinkedApplicationId(null);
                                      setLookupSearchQuery('');
                                      setFormData(prev => ({
                                        ...prev,
                                        companyName: '',
                                        position: '',
                                        location: '',
                                      }));
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                )}
                                </div>
                              </div>
                              
                              {/* Dropdown with Company Logos */}
                              <AnimatePresence>
                                {showLookupDropdown && lookupSearchQuery && !lookupSelectedApplication && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-2xl max-h-[140px] overflow-y-auto backdrop-blur-xl"
                                >
                                  {lookupApplications
                                    .filter(app =>
                                      app.companyName.toLowerCase().includes(lookupSearchQuery.toLowerCase()) ||
                                      app.position.toLowerCase().includes(lookupSearchQuery.toLowerCase())
                                    )
                                    .slice(0, 3)
                                    .map((app) => {
                                      // Generate color based on company name
                                      const getCompanyColor = (name: string) => {
                                        const colors = [
                                          'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 
                                          'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                                          'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
                                        ];
                                        const index = name.charCodeAt(0) % colors.length;
                                        return colors[index];
                                      };
                                      
                                      return (
                                        <button
                                          key={app.id}
                                          type="button"
                                          onClick={() => {
                                            setLookupSelectedApplication(app);
                                            setLinkedApplicationId(app.id);
                                            setLookupSearchQuery(`${app.companyName} - ${app.position}`);
                                            setFormData(prev => ({
                                              ...prev,
                                              companyName: app.companyName,
                                              position: app.position,
                                              location: app.location || prev.location,
                                            }));
                                            setShowLookupDropdown(false);
                                          }}
                                          className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 transition-all border-b border-gray-100 dark:border-[#3d3c3e] last:border-b-0 flex items-center gap-2"
                                        >
                                          {/* Company Logo/Avatar */}
                                          <div className={`flex-shrink-0 w-7 h-7 rounded-md ${getCompanyColor(app.companyName)} flex items-center justify-center shadow-sm`}>
                                            <span className="text-white font-semibold text-[11px]">
                                              {app.companyName.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          
                                          {/* Company Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-[11px] text-gray-900 dark:text-white truncate leading-tight">
                                              {app.companyName}
                                            </div>
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5">
                                              {app.position}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  {lookupApplications.filter(app =>
                                    app.companyName.toLowerCase().includes(lookupSearchQuery.toLowerCase()) ||
                                    app.position.toLowerCase().includes(lookupSearchQuery.toLowerCase())
                                  ).length === 0 && (
                                    <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                      No applications found
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              </AnimatePresence>
                            </div>

                            {/* Selected Application Badges */}
                            {lookupSelectedApplication && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30"
                              >
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-md border border-purple-200 dark:border-purple-700">
                                  <Building className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {lookupSelectedApplication.companyName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-md border border-indigo-200 dark:border-indigo-700">
                                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {lookupSelectedApplication.position}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        <AnimatePresence>
                          {((eventType === 'application' && showFullForm && currentBoardType !== 'campaigns') || (eventType === 'interview' && lookupSelectedApplication !== null)) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-6 overflow-hidden"
                            >
                              {/* Main Fields - Jobs Board */}
                              {eventType === 'application' && (
                                <div className="grid grid-cols-1 gap-5">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.companyName || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#242325] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Google, Spotify..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Position <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.position || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#242325] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Senior Frontend Engineer"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={formData.location || ''}
                                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#242325] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                      placeholder="e.g. Remote, Paris..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Date & Time Grid - For Jobs only (Campaigns use wizard) */}
                              <div className={eventType === 'application' && currentBoardType !== 'campaigns' ? '' : eventType === 'interview' ? 'grid grid-cols-2 gap-5' : 'hidden'}>
                                {eventType === 'application' && currentBoardType !== 'campaigns' ? (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                      Applied Date <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                      value={formData.appliedDate || ''}
                                      onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                                      placeholder="Select date"
                                      required
                                      className="w-full"
                                      buttonClassName="!bg-gray-50 dark:!bg-[#1A1A1A] !border-transparent focus:!bg-white dark:focus:!bg-[#1A1A1A] !rounded-xl !text-sm !text-gray-900 dark:!text-white !py-3 focus:!ring-2 focus:!ring-purple-500/20 focus:!border-purple-500 !shadow-none"
                                    />
                                  </div>
                                ) : eventType === 'interview' ? (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Interview Date <span className="text-red-500">*</span>
                                      </label>
                                      <DatePicker
                                        value={formData.interviewDate || ''}
                                        onChange={(value) => setFormData(prev => ({ ...prev, interviewDate: value }))}
                                        placeholder="Select date"
                                        required
                                        className="w-full"
                                        buttonClassName="!bg-white dark:!bg-[#1A1A1A] !border !border-gray-200 dark:!border-gray-800 hover:!border-purple-400 dark:hover:!border-purple-600 !rounded-xl !text-sm !text-gray-900 dark:!text-white !py-3.5 !px-4 focus:!ring-2 focus:!ring-purple-500/30 focus:!border-purple-500 !shadow-sm hover:!shadow-md !transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Interview Time
                                      </label>
                                      <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="time"
                                          value={formData.interviewTime}
                                          onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                                          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                                        />
                                      </div>
                                    </div>
                                  </>
                                ) : null}
                              </div>

                              {/* Interview specific extras */}
                              {eventType === 'interview' && (
                                <div className="space-y-6">
                                  {/* Interview Type - Visual Cards */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 text-center">
                                      Interview Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {[
                                        { value: 'technical', label: 'Technical', icon: Code },
                                        { value: 'hr', label: 'HR', icon: Users },
                                        { value: 'manager', label: 'Manager', icon: Briefcase },
                                        { value: 'final', label: 'Final', icon: CheckCircle },
                                        { value: 'other', label: 'Other', icon: MoreHorizontal },
                                      ].map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = formData.interviewType === type.value;
                                        return (
                                          <motion.button
                                            key={type.value}
                                            type="button"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData(prev => ({ ...prev, interviewType: type.value as any }))}
                                            className={`relative p-4 rounded-xl border-2 transition-all ${
                                              isSelected
                                                ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20'
                                                : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                                            }`}
                                          >
                                            <div className="flex flex-col items-center gap-2">
                                              <div className={`p-2 rounded-lg transition-colors ${
                                                isSelected
                                                  ? 'bg-purple-100 dark:bg-purple-900/50'
                                                  : 'bg-gray-100 dark:bg-[#2b2a2c]'
                                              }`}>
                                                <Icon className={`w-5 h-5 ${
                                                  isSelected
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`} />
                                              </div>
                                              <span className={`text-sm font-medium ${
                                                isSelected
                                                  ? 'text-purple-900 dark:text-purple-200'
                                                  : 'text-gray-700 dark:text-gray-300'
                                              }`}>
                                                {type.label}
                                              </span>
                                            </div>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2"
                                              >
                                                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Contact Field */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                      Interviewer Name
                                    </label>
                                    <div className="relative">
                                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={formData.contactName || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                                        placeholder="e.g., John Doe, Hiring Manager"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Notes only for Applications */}
                              {eventType === 'application' && (
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Notes
                                  </label>
                                  <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#242325] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                                    placeholder="Add any additional details..."
                                    rows={3}
                                  />
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Manual Entry Link for Application */}
                        {!showFullForm && eventType === 'application' && (
                           <motion.div 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="flex justify-center pt-2"
                           >
                            <button
                              type="button"
                              onClick={() => setShowFullForm(true)}
                              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border-b border-gray-300 dark:border-[#3d3c3e] hover:border-gray-900 dark:hover:border-white pb-0.5"
                            >
                              Enter details manually without URL
                            </button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] flex justify-between items-center z-10">
                  {/* Left side */}
                  <div>
                    {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="px-5 py-2.5 text-sm font-medium text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEventType(null);
                      setNewApplicationModal(false);
                      setShowFullForm(false);
                        setWizardStep(1);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                    
                    {/* Campaigns Wizard: Next button on step 1 */}
                    {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 1 && (
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        disabled={!formData.contactName || !formData.companyName}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#8B5CF6]/25 flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Campaigns Wizard: Add Contact on step 2 */}
                    {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 2 && (
                      <button
                        type="button"
                        onClick={handleCreateApplication}
                        disabled={!formData.companyName || !formData.contactName || !formData.appliedDate}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#EC4899]/25 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Contact
                      </button>
                    )}

                    {/* Jobs board or Interview */}
                    {(eventType === 'interview' || (eventType === 'application' && currentBoardType !== 'campaigns')) && (
                  <button
                    type="button"
                    onClick={handleCreateApplication}
                    disabled={
                      !eventType || 
                      (eventType === 'application' && currentBoardType !== 'campaigns' && (!formData.companyName || !formData.position || !formData.location || !formData.appliedDate)) ||
                      (eventType === 'interview' && (!linkedApplicationId || !formData.interviewDate))
                    }
                    className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2"
                  >
                    {eventType === 'application' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Application
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                            {currentBoardType === 'campaigns' ? 'Schedule Meeting' : 'Add Interview'}
                      </>
                    )}
                  </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal d'édition */}
        {editModal.show && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-xl rounded-t-2xl max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Drag handle for mobile */}
              <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-12 h-1 bg-gray-300 dark:bg-[#4a494b] rounded-full"></div>
              </div>

              {/* Header fixe */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-[#3d3c3e]">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Edit Application</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditModal({ show: false });
                      setShowAddInterviewForm(false);
                      setNewInterview({
                        date: new Date().toISOString().split('T')[0],
                        time: '09:00',
                        type: 'technical',
                        status: 'scheduled',
                        location: '',
                        notes: ''
                      });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4">
                {/* Champs principaux */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Applied Date *</label>
                    <input
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Job URL</label>
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 text-base sm:p-2 sm:text-sm rounded-lg border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Section des entretiens avec le même design élégant */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold">Interviews</h4>
                    {!showAddInterviewForm && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddInterviewForm(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Interview
                      </motion.button>
                    )}
                  </div>

                  {/* Formulaire d'ajout d'interview */}
                  <AnimatePresence>
                    {showAddInterviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300">New Interview</h5>
                            <button
                              onClick={() => {
                                setShowAddInterviewForm(false);
                                setNewInterview({
                                  date: new Date().toISOString().split('T')[0],
                                  time: '09:00',
                                  type: 'technical',
                                  status: 'scheduled',
                                  location: '',
                                  notes: ''
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              aria-label="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                                <input
                                  type="date"
                                  value={newInterview.date}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time *</label>
                                <input
                                  type="time"
                                  value={newInterview.time}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                  value={newInterview.type}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value as Interview['type'] }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="technical">Technical</option>
                                  <option value="hr">HR</option>
                                  <option value="manager">Manager</option>
                                  <option value="final">Final</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                  value={newInterview.status}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, status: e.target.value as Interview['status'] }))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                              <input
                                type="text"
                                value={newInterview.location || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Zoom, Office, Remote"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                              <textarea
                                value={newInterview.notes || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes or preparation tips..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#4a494b] rounded-lg dark:bg-[#2b2a2c] focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4a494b] rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (!newInterview.date || !newInterview.time) {
                                    notify.error('Please fill in date and time');
                                    return;
                                  }
                                  const interview: Interview = {
                                    id: crypto.randomUUID(),
                                    date: newInterview.date!,
                                    time: newInterview.time!,
                                    type: newInterview.type || 'technical',
                                    status: newInterview.status || 'scheduled',
                                    location: newInterview.location || '',
                                    notes: newInterview.notes || ''
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    interviews: [...(prev.interviews || []), interview]
                                  }));
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                  notify.success('Interview added!');
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                              >
                                Add Interview
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Liste des interviews existants avec le même design élégant */}
                  {formData.interviews && formData.interviews.length > 0 ? (
                    <div className="space-y-4">
                      {formData.interviews.map((interview, index) => (
                        <div
                          key={interview.id}
                          className={`p-4 rounded-lg border ${interview.status === 'completed'
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50'
                              : interview.status === 'cancelled'
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'
                                : 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0 flex-wrap">
                              <select
                                value={interview.type}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = {
                                    ...interview,
                                    type: e.target.value as 'technical' | 'hr' | 'manager' | 'final' | 'other'
                                  };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] capitalize"
                              >
                                <option value="technical">Technical</option>
                                <option value="hr">HR</option>
                                <option value="manager">Manager</option>
                                <option value="final">Final</option>
                                <option value="other">Other</option>
                              </select>
                              <select
                                value={interview.status}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = {
                                    ...interview,
                                    status: e.target.value as 'scheduled' | 'completed' | 'cancelled'
                                  };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className={`text-xs px-2 py-1 rounded-full border ${interview.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-800'
                                    : interview.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-800'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                                  }`}
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{interview.date} {interview.time}</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const newInterviews = formData.interviews?.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                aria-label="Remove interview"
                              >
                                <X className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="date"
                                  value={interview.date}
                                  onChange={(e) => {
                                    const newInterviews = [...(formData.interviews || [])];
                                    newInterviews[index] = { ...interview, date: e.target.value };
                                    setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                  }}
                                  className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]/50 focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="time"
                                  value={interview.time}
                                  onChange={(e) => {
                                    const newInterviews = [...(formData.interviews || [])];
                                    newInterviews[index] = { ...interview, time: e.target.value };
                                    setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                  }}
                                  className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]/50 focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <input
                                type="text"
                                placeholder="Location (e.g. Zoom, Office, Remote)"
                                value={interview.location || ''}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, location: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]/50 focus:ring-1 focus:ring-purple-500"
                              />
                            </div>

                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-1.5 flex-shrink-0" />
                              <textarea
                                placeholder="Notes & Feedback..."
                                value={interview.notes || ''}
                                onChange={(e) => {
                                  const newInterviews = [...(formData.interviews || [])];
                                  newInterviews[index] = { ...interview, notes: e.target.value };
                                  setFormData(prev => ({ ...prev, interviews: newInterviews }));
                                }}
                                className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-[#3d3c3e] dark:bg-[#2b2a2c]/50 min-h-[60px] resize-y focus:ring-1 focus:ring-purple-500"
                                rows={2}
                              />
                            </div>
                          </div>

                          {interview.status === 'scheduled' && editModal.application && (
                            <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-[#3d3c3e]">
                              <button
                                onClick={() => downloadICS(interview, editModal.application!.companyName, editModal.application!.position)}
                                className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 py-2 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Add to Calendar
                              </button>

                              <a
                                href={`/interview-prep/${editModal.application.id}/${interview.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 py-2 px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Prepare
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-[#242325]/30 rounded-lg border border-dashed border-gray-300 dark:border-[#3d3c3e]">
                      <Calendar className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No interviews scheduled yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Add Interview" to schedule one</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer fixe avec les boutons */}
              <div className="p-4 border-t border-gray-200 dark:border-[#3d3c3e] sticky bottom-0 bg-white dark:bg-[#2b2a2c] shadow-md">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditModal({ show: false });
                      setShowAddInterviewForm(false);
                      setNewInterview({
                        date: new Date().toISOString().split('T')[0],
                        time: '09:00',
                        type: 'technical',
                        status: 'scheduled',
                        location: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#3d3c3e] rounded-lg flex-1 sm:flex-initial"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplication}
                    className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 flex-1 sm:flex-initial"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Job Detail Panel - Premium slide-over */}
        <JobDetailPanel
          job={selectedApplication}
          open={timelineModal}
          boardType={currentBoardType}
          onClose={() => {
            setTimelineModal(false);
            setShowAddInterviewForm(false);
            setSelectedApplication(null);
            setNewInterview({
              date: new Date().toISOString().split('T')[0],
              time: '09:00',
              type: 'technical',
              status: 'scheduled',
              location: '',
              notes: ''
            });
            // Remove highlight from URL if present
            if (searchParams.get('highlight')) {
              searchParams.delete('highlight');
              setSearchParams(searchParams, { replace: true });
            }
          }}
          onUpdate={async (updates) => {
            if (!currentUser || !selectedApplication) return;

            try {
              const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
              await updateDoc(applicationRef, {
                ...updates,
                updatedAt: serverTimestamp()
              });

              // Create the updated application object
              const updatedApplication = {
                ...selectedApplication,
                ...updates,
                updatedAt: new Date().toISOString()
              };

              // Check if interviews were added and status is wishlist, applied, or pending_decision
              const interviewsAdded = updates.interviews && updates.interviews.length > (selectedApplication.interviews?.length || 0);
              const shouldPromptMove = interviewsAdded && 
                (selectedApplication.status === 'wishlist' || selectedApplication.status === 'applied' || selectedApplication.status === 'pending_decision') &&
                !updates.status; // Status wasn't changed in this update

              // Update local state
              setApplications(prev =>
                prev.map(app =>
                  app.id === selectedApplication.id
                    ? updatedApplication
                    : app
                )
              );

              // Update selected application to reflect changes immediately
              setSelectedApplication(updatedApplication);

              // Show modal prompt if needed
              if (shouldPromptMove) {
                setPendingMoveApplication(updatedApplication);
                setShowMoveToInterviewPrompt(true);
              } else {
                // Don't show toast for every update (only for user-initiated saves)
                if (!updates.interviews) {
                  notify.success('Application updated successfully');
                } else if (!shouldPromptMove) {
                  notify.success('Interview scheduled successfully!');
                }
              }
            } catch (error) {
              console.error('Error updating application:', error);
              notify.error('Failed to update application');
            }
          }}
          onDelete={async () => {
            if (!currentUser || !selectedApplication) return;

            try {
              const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', selectedApplication.id);
              await deleteDoc(applicationRef);

              setApplications(prev => prev.filter(app => app.id !== selectedApplication.id));
              notify.success('Application deleted successfully');
              setTimelineModal(false);
              setSelectedApplication(null);
            } catch (error) {
              console.error('Error deleting application:', error);
              notify.error('Failed to delete application');
            }
          }}
        />

        {/* Old Timeline Modal - Keeping temporarily as backup */}
        {false && timelineModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setTimelineModal(false);
              setShowAddInterviewForm(false);
              setNewInterview({
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                type: 'technical',
                status: 'scheduled',
                location: '',
                notes: ''
              });
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "100%" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: "100%" }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="group relative bg-white dark:bg-[#242325]/80 backdrop-blur-xl w-full sm:rounded-2xl rounded-t-2xl max-w-lg max-h-[90vh] flex flex-col overflow-hidden
                transition-all duration-500 ease-out
                hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30
                border border-gray-200/60 dark:border-[#3d3c3e]/50"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Subtle accent line - Apple style */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/60 to-indigo-500/40" />

              {/* Drag handle for mobile */}
              <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-12 h-1 bg-gray-300/60 dark:bg-[#4a494b]/60 rounded-full"></div>
              </div>

              {/* Header with title and close/edit buttons - Apple style */}
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200/60 dark:border-[#3d3c3e]/50 sticky top-0 bg-white dark:bg-[#242325]/80 backdrop-blur-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Application Timeline</h2>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFormData(selectedApplication);
                        setTimelineModal(false);
                        setEditModal({ show: true, application: selectedApplication });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 
                        hover:bg-purple-50/60 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Edit application"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTimelineModal(false);
                        setDeleteModal({ show: true, application: selectedApplication });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                        hover:bg-red-50/60 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTimelineModal(false);
                        setShowAddInterviewForm(false);
                        setNewInterview({
                          date: new Date().toISOString().split('T')[0],
                          time: '09:00',
                          type: 'technical',
                          status: 'scheduled',
                          location: '',
                          notes: ''
                        });
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                        hover:bg-gray-100/60 dark:hover:bg-[#3d3c3e]/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content with overflow */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5">
                {/* Application details - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">{selectedApplication.companyName}</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-medium text-base mb-4">{selectedApplication.position}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-[#2b2a2c]/50 backdrop-blur-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span>{selectedApplication.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-[#2b2a2c]/50 backdrop-blur-sm">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span>Applied on {new Date(selectedApplication.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {selectedApplication.url && (
                    <div className="mb-4">
                      <a
                        href={selectedApplication.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 
                          hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 
                          rounded-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Job Posting</span>
                      </a>
                    </div>
                  )}

                  {selectedApplication.notes && (
                    <div className="mt-4 p-4 bg-gray-50/80 dark:bg-[#2b2a2c]/30 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#3d3c3e]/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wide">
                        <FileIcon className="w-3.5 h-3.5" />
                        <span>Notes</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{selectedApplication.notes}</p>
                    </div>
                  )}
                </motion.div>

                {/* Status History - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span>Status History</span>
                  </h4>
                  <div className="relative pl-6 border-l-2 border-gray-200/50 dark:border-[#3d3c3e]/50 space-y-4">
                    {selectedApplication.statusHistory?.slice().reverse().map((status, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                        className="relative"
                      >
                        {/* Status dot - Apple style - positioned on top of the card */}
                        <div className={`absolute -left-[17px] top-0 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm border-2 z-10 shadow-sm ${status.status === 'applied' ? 'bg-blue-50/60 text-blue-600 border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30' :
                            status.status === 'interview' ? 'bg-purple-50/60 text-purple-600 border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30' :
                              status.status === 'offer' ? 'bg-green-50/60 text-green-600 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30' :
                                status.status === 'pending_decision' ? 'bg-amber-50/60 text-amber-600 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30' :
                                  status.status === 'archived' ? 'bg-gray-50/60 text-gray-600 border-gray-200/50 dark:bg-[#242325]/30 dark:text-gray-400 dark:border-[#3d3c3e]/30' :
                                    'bg-red-50/60 text-red-600 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30'
                          }`}>
                          <span className="text-xs font-semibold capitalize">{status.status.slice(0, 1)}</span>
                        </div>

                        {/* Status details - Apple style */}
                        <div className="bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-[#3d3c3e]/50 pl-4 py-3 px-4 transition-all duration-200 hover:bg-white dark:hover:bg-[#3d3c3e]/50 relative z-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className={`font-medium text-sm capitalize ${status.status === 'applied' ? 'text-blue-600 dark:text-blue-400' :
                                status.status === 'interview' ? 'text-purple-600 dark:text-purple-400' :
                                  status.status === 'offer' ? 'text-green-600 dark:text-green-400' :
                                    status.status === 'pending_decision' ? 'text-amber-600 dark:text-amber-400' :
                                      status.status === 'archived' ? 'text-gray-600 dark:text-gray-400' :
                                        'text-red-600 dark:text-red-400'
                              }`}>
                              {status.status === 'pending_decision' ? 'Pending Decision' : status.status}
                            </p>
                            <time className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {new Date(status.date).toLocaleDateString()}
                            </time>
                          </div>
                          {status.notes && (
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {status.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Interviews Section - Apple style */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span>Interviews</span>
                    </h4>
                    {!showAddInterviewForm && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddInterviewForm(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 
                          bg-purple-50/60 dark:bg-purple-900/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 
                          rounded-lg border border-purple-200/50 dark:border-purple-800/30 transition-all duration-200 backdrop-blur-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Interview</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Formulaire d'ajout d'interview - Apple style */}
                  <AnimatePresence>
                    {showAddInterviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/20 dark:to-indigo-900/20 
                      border border-purple-200/60 dark:border-purple-800/30 rounded-xl p-4 shadow-sm backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300 tracking-tight">New Interview</h5>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setShowAddInterviewForm(false);
                                setNewInterview({
                                  date: new Date().toISOString().split('T')[0],
                                  time: '09:00',
                                  type: 'technical',
                                  status: 'scheduled',
                                  location: '',
                                  notes: ''
                                });
                              }}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                                hover:bg-gray-100/60 dark:hover:bg-[#3d3c3e]/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                              aria-label="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Date *</label>
                                <input
                                  type="date"
                                  value={newInterview.date}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                                bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Time *</label>
                                <input
                                  type="time"
                                  value={newInterview.time}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                                bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Type</label>
                                <select
                                  value={newInterview.type}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value as Interview['type'] }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                                bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                >
                                  <option value="technical">Technical</option>
                                  <option value="hr">HR</option>
                                  <option value="manager">Manager</option>
                                  <option value="final">Final</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Status</label>
                                <select
                                  value={newInterview.status}
                                  onChange={(e) => setNewInterview(prev => ({ ...prev, status: e.target.value as Interview['status'] }))}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                                bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Location</label>
                              <input
                                type="text"
                                value={newInterview.location || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Zoom, Office, Remote"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                                bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Notes</label>
                              <textarea
                                value={newInterview.notes || ''}
                                onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes or preparation tips..."
                                rows={2}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-lg 
                              bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm 
                              focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                              transition-all duration-200 resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowAddInterviewForm(false);
                                  setNewInterview({
                                    date: new Date().toISOString().split('T')[0],
                                    time: '09:00',
                                    type: 'technical',
                                    status: 'scheduled',
                                    location: '',
                                    notes: ''
                                  });
                                }}
                                className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 
                              bg-gray-100/90 dark:bg-[#3d3c3e]/50 hover:bg-gray-200 dark:hover:bg-[#4a494b]/60 
                              rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-200/60 dark:border-[#3d3c3e]/50"
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddInterview}
                                className="flex-1 px-3 py-2.5 text-xs font-medium text-white 
                                  bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                                  rounded-lg transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                              >
                                Add Interview
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Liste des interviews existants - Apple style */}
                  {selectedApplication.interviews && selectedApplication.interviews.length > 0 ? (
                    <div className="space-y-3">
                      {selectedApplication.interviews.map((interview, index) => (
                        <motion.div
                          key={interview.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
                          className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-md ${interview.status === 'completed'
                              ? 'bg-green-50/90 dark:bg-green-900/20 border-green-200/60 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/30'
                              : interview.status === 'cancelled'
                                ? 'bg-red-50/90 dark:bg-red-900/20 border-red-200/60 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'bg-purple-50/90 dark:bg-purple-900/20 border-purple-200/60 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium text-sm text-gray-900 dark:text-white">{interview.type} Interview</span>
                              <span className={`px-2.5 py-1 text-[10px] font-medium rounded-full backdrop-blur-sm border ${interview.status === 'completed'
                                  ? 'bg-green-100/60 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30'
                                  : interview.status === 'cancelled'
                                    ? 'bg-red-100/60 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30'
                                    : 'bg-purple-100/60 text-purple-700 border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30'
                                }`}>
                                {interview.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{interview.date} {interview.time}</span>
                          </div>

                          {interview.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <div className="p-1 rounded-lg bg-white/80 dark:bg-[#2b2a2c]/50 backdrop-blur-sm">
                                <MapPin className="w-3 h-3" />
                              </div>
                              <span>{interview.location}</span>
                            </div>
                          )}

                          {interview.notes && (
                            <div className="mb-3 p-3 bg-white/90 dark:bg-[#2b2a2c]/30 backdrop-blur-sm rounded-lg border border-gray-200/60 dark:border-[#3d3c3e]/50">
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{interview.notes}</p>
                            </div>
                          )}

                          {interview.status === 'scheduled' && (
                            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-[#3d3c3e]/50">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => downloadICS(interview, selectedApplication.companyName, selectedApplication.position)}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 
                                  py-2.5 px-3 hover:bg-purple-50/60 dark:hover:bg-purple-900/30 rounded-lg 
                                  border border-purple-200/50 dark:border-purple-800/30 backdrop-blur-sm transition-all duration-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Add to Calendar
                              </motion.button>

                              <a
                                href={`/interview-prep/${selectedApplication.id}/${interview.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white 
                                  py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 
                                  rounded-lg transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Prepare for Interview
                              </a>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50/80 dark:bg-[#242325]/30 backdrop-blur-sm rounded-xl border border-dashed border-gray-200/60 dark:border-[#3d3c3e]/50">
                      <Calendar className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No interviews scheduled yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Add Interview" to schedule one</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Footer with Close button - Apple style */}
              <div className="px-5 sm:px-6 py-4 border-t border-gray-200/60 dark:border-[#3d3c3e]/50 flex justify-end sticky bottom-0 
            bg-white dark:bg-[#242325]/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setTimelineModal(false);
                    setShowAddInterviewForm(false);
                    setNewInterview({
                      date: new Date().toISOString().split('T')[0],
                      time: '09:00',
                      type: 'technical',
                      status: 'scheduled',
                      location: '',
                      notes: ''
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white 
                    bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                    rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30 
                    hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-900/40 backdrop-blur-sm"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Move to Interview Prompt Modal - Premium Minimalist */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showMoveToInterviewPrompt && pendingMoveApplication && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setShowMoveToInterviewPrompt(false);
                  setPendingMoveApplication(null);
                }}
                className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
                style={{ zIndex: 200 }}
              >
              <motion.div
                initial={{ scale: 0.96, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 10, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white dark:bg-[#242325] rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-[#3d3c3e]/50 overflow-hidden pointer-events-auto"
                style={{ zIndex: 201 }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50 pointer-events-none" />
                
                {/* Content */}
                <div className="relative px-8 py-8 z-10 pointer-events-auto">
                  {/* Icon - Minimalist */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF]/10 to-[#7c75ff]/10 dark:from-[#635BFF]/20 dark:to-[#7c75ff]/20 rounded-2xl blur-xl" />
                      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#635BFF]/5 to-[#7c75ff]/5 dark:from-[#635BFF]/10 dark:to-[#7c75ff]/10 border border-[#635BFF]/10 dark:border-[#635BFF]/20">
                        <Calendar className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Title - Refined typography */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2 tracking-tight">
                    Move to Interview column?
                  </h3>

                  {/* Message - Minimalist */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
                    You've scheduled an interview. Would you like to move this application to the Interview column?
                  </p>

                  {/* Application Info - Ultra minimalist */}
                  <div className="mb-8 pb-6 border-b border-gray-100 dark:border-[#3d3c3e]">
                    <div className="text-center space-y-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {pendingMoveApplication.companyName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {pendingMoveApplication.position}
                      </div>
                    </div>
                  </div>

                  {/* Buttons - Premium design */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setShowMoveToInterviewPrompt(false);
                        setPendingMoveApplication(null);
                      }}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#2b2a2c]/50 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-xl transition-all duration-200 border border-gray-200/50 dark:border-[#3d3c3e]/50"
                    >
                      {pendingMoveApplication.status === 'wishlist' ? 'Keep in Wishlist' : 
                       pendingMoveApplication.status === 'pending_decision' ? 'Keep in Pending Decision' : 
                       'Keep in Applied'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleMoveToInterview}
                      className="relative flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#635BFF] to-[#7c75ff] hover:from-[#7c75ff] hover:to-[#8b85ff] rounded-xl transition-all duration-300 shadow-lg shadow-[#635BFF]/25 dark:shadow-[#635BFF]/20 overflow-hidden group"
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                      <span className="relative z-10">Move</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && deleteModal.application && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-semibold">Delete Application</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModal({ show: false })}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete your application for <strong>{deleteModal.application.position}</strong> at <strong>{deleteModal.application.companyName}</strong>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#3d3c3e] rounded-lg flex-1 sm:flex-initial"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApplication}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg flex-1 sm:flex-initial"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Style for hiding scrollbar */}
        <style>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Floating action button to view all scheduled interviews */}
        <button
          onClick={() => {
            // Redirect to upcoming interviews page
            window.location.href = '/upcoming-interviews';
          }}
          className="fixed bottom-20 right-6 z-10 bg-[#635BFF] hover:bg-[#7c75ff] dark:bg-[#a5a0ff] text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="View all scheduled interviews"
        >
          <Calendar className="w-6 h-6" />
          <span className="sr-only">View all scheduled interviews</span>
        </button>

        {/* Cover Photo Modals */}
        <CoverPhotoCropper
          isOpen={isCoverCropperOpen}
          file={selectedCoverFile}
          onClose={() => {
            setIsCoverCropperOpen(false);
            setSelectedCoverFile(null);
          }}
          onCropped={handleCroppedCover}
          exportWidth={1584}
          exportHeight={396}
        />
        
        <CoverPhotoGallery
          isOpen={isCoverGalleryOpen}
          onClose={() => setIsCoverGalleryOpen(false)}
          onDirectApply={handleDirectApplyCover}
          onRemove={coverPhoto ? handleRemoveCover : undefined}
          currentCover={coverPhoto || undefined}
        />

        {/* Automation Settings Modal */}
        <AutomationSettingsModal
          isOpen={showAutomationSettingsModal}
          onClose={() => setShowAutomationSettingsModal(false)}
          settings={automationSettings}
          onSave={handleSaveAutomationSettings}
          applications={applications}
        />

        {/* Board Settings Modal */}
        <BoardSettingsModal
          isOpen={showBoardSettingsModal}
          onClose={() => {
            setShowBoardSettingsModal(false);
            setEditingBoard(null);
          }}
          onSave={editingBoard ? handleUpdateBoard : handleCreateBoard}
          board={editingBoard}
          mode={editingBoard ? 'edit' : 'create'}
        />

        {/* Delete Board Modal */}
        <DeleteBoardModal
          isOpen={showDeleteBoardModal}
          onClose={() => {
            setShowDeleteBoardModal(false);
            setBoardToDelete(null);
          }}
          onDelete={handleDeleteBoard}
          board={boardToDelete}
          boards={boards}
        />

        {/* Move to Board Modal */}
        <MoveToBoardModal
          isOpen={showMoveToBoardModal}
          onClose={() => {
            setShowMoveToBoardModal(false);
            setApplicationToMove(null);
          }}
          onMove={handleMoveApplicationToBoard}
          boards={boards}
          currentBoardId={applicationToMove?.boardId || (boards.find(b => b.isDefault)?.id || null)}
          applicationName={applicationToMove ? `${applicationToMove.companyName} - ${applicationToMove.position}` : ''}
        />
      </div>
    </AuthLayout>
  );
} 