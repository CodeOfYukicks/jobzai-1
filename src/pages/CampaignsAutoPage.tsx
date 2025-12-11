import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Image, 
  Camera, 
  X, 
  Loader2, 
  ExternalLink, 
  Mail, 
  MessageSquare,
  MoreHorizontal,
  Eye,
  Reply,
  Linkedin,
  Sparkles,
  Users,
  Building2,
  MapPin,
  ChevronDown,
  Search,
  Zap,
  Trash2,
  Pencil,
  Check,
  Filter,
  Send,
  RefreshCw,
  Wand2,
  Play,
  CheckCircle2,
  User,
  Briefcase,
  ArrowUpDown,
  Copy,
  CheckCircle,
  Download,
  Activity,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  Minus,
  Square,
  BadgeCheck,
  FolderKanban
} from 'lucide-react';
import { notify } from '@/lib/notify';
import { getDoc, doc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import NewCampaignModal from '../components/campaigns/NewCampaignModal';
import { searchApolloContacts, type ApolloTargeting } from '../lib/apolloService';
import { CompanyLogo } from '../components/common/CompanyLogo';
import SelectBoardModal from '../components/boards/SelectBoardModal';
import { KanbanBoard } from '../types/job';

type RecipientStatus = 'pending' | 'email_generated' | 'email_ready' | 'sent' | 'opened' | 'replied';

interface CampaignRecipient {
  id: string;
  apolloId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string | null;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companySize: number | null;
  location: string | null;
  status: RecipientStatus;
  emailGenerated: boolean;
  emailSubject: string | null;
  emailContent: string | null;
  sentAt: any;
  openedAt: any;
  repliedAt: any;
  createdAt: any;
  gmailThreadId?: string;
  variantId?: string;
  variantConfig?: {
    hookIndex: number;
    bodyIndex: number;
    ctaIndex: number;
  };
}

interface Campaign {
  id: string;
  name?: string;
  status: 'pending' | 'contacts_fetched' | 'emails_generated' | 'ready_to_send' | 'sent';
  targeting: ApolloTargeting;
  gmail: {
    email: string;
    connected: boolean;
  };
  emailPreferences: {
    tone: string;
    length: string;
    keyPoints: string | null;
    language: string;
  };
  emailGenerationMode?: 'template' | 'abtest' | 'auto';
  template?: {
    subject: string;
    body: string;
  };
  abTestVariants?: {
    hooks: string[];
    bodies: string[];
    ctas: string[];
  };
  stats: {
    contactsFound: number;
    emailsGenerated: number;
    emailsSent: number;
    opened: number;
    replied: number;
    bounced: number;
  };
  createdAt: any;
  updatedAt: any;
}

const getStatusStyles = (status: RecipientStatus) => {
  switch (status) {
    case 'replied':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'opened':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
    case 'sent':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    case 'email_ready':
    case 'email_generated':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-[#3d3c3e] dark:text-gray-400';
  }
};

const getStatusLabel = (status: RecipientStatus) => {
  switch (status) {
    case 'replied':
      return 'Replied';
    case 'opened':
      return 'Opened';
    case 'sent':
      return 'Sent';
    case 'email_ready':
      return 'Ready';
    case 'email_generated':
      return 'Email Ready';
    case 'pending':
    default:
      return 'Pending';
  }
};

export default function CampaignsAutoPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSearchingApollo, setIsSearchingApollo] = useState(false);

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // New Campaign Modal state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Campaign dropdown
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  // Delete campaign modal
  const [deleteCampaignModal, setDeleteCampaignModal] = useState<{ show: boolean; campaign?: Campaign }>({ show: false });

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit campaign name state
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState('');

  // Email operation states
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isCheckingReplies, setIsCheckingReplies] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{ generated: number; total: number } | null>(null);
  const [sendProgress, setSendProgress] = useState<{ sent: number; remaining: number } | null>(null);

  // Email preview modal
  const [emailPreviewRecipient, setEmailPreviewRecipient] = useState<CampaignRecipient | null>(null);

  // Board selection states
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [selectedRecipientForBoard, setSelectedRecipientForBoard] = useState<CampaignRecipient | null>(null);
  const [isAddingToBoard, setIsAddingToBoard] = useState(false);
  const [openMenuRecipientId, setOpenMenuRecipientId] = useState<string | null>(null);
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Reply preview modal
  const [replyPreviewRecipient, setReplyPreviewRecipient] = useState<CampaignRecipient | null>(null);
  const [replyContent, setReplyContent] = useState<{ from: string; subject: string; body: string; date: string } | null>(null);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Selection state for premium multi-select
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column resize state (percentages) - adjusted for checkbox column
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 4,
    contact: 13,
    title: 15,
    company: 13,
    location: 13,
    email: 17,
    linkedin: 8,
    status: 9,
    actions: 8
  });
  const resizingColumnRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const tableRef = useRef<HTMLTableElement>(null);
  
  const handleResizeStart = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    resizingColumnRef.current = column;
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[column as keyof typeof columnWidths];
    const tableWidth = tableRef.current?.offsetWidth || 1000;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumnRef.current) return;
      const diff = e.clientX - startXRef.current;
      const diffPercent = (diff / tableWidth) * 100;
      const newWidth = Math.max(5, Math.min(40, startWidthRef.current + diffPercent));
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumnRef.current!]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      resizingColumnRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Load campaigns
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Subscribe to campaigns
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      const campaignsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      
      setCampaigns(campaignsData);
      
      // Auto-select first campaign if none selected
      if (!selectedCampaignId && campaignsData.length > 0) {
        setSelectedCampaignId(campaignsData[0].id);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading campaigns:', error);
      notify.error('Failed to load campaigns');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate, selectedCampaignId]);

  // Load recipients when campaign is selected
  useEffect(() => {
    if (!selectedCampaignId) {
      setRecipients([]);
      return;
    }

    setIsLoadingRecipients(true);

    const recipientsQuery = query(
      collection(db, 'campaigns', selectedCampaignId, 'recipients'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(recipientsQuery, (snapshot) => {
      const recipientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CampaignRecipient[];
      
      setRecipients(recipientsData);
      setIsLoadingRecipients(false);
    }, (error) => {
      console.error('Error loading recipients:', error);
      setIsLoadingRecipients(false);
    });

    return () => unsubscribe();
  }, [selectedCampaignId]);

  // Load campaign boards (outreach boards)
  useEffect(() => {
    const fetchBoards = async () => {
      if (!currentUser) {
        setBoards([]);
        return;
      }

      try {
        const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
        const boardsQuery = query(boardsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(boardsQuery);
        
        const allBoards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as KanbanBoard[];

        // Filter for campaign-type boards only
        const campaignBoards = allBoards.filter(board => 
          board.boardType === 'campaigns'
        );

        setBoards(campaignBoards);
      } catch (error) {
        console.error('Error fetching boards:', error);
        setBoards([]);
      }
    };

    fetchBoards();
  }, [currentUser]);
        
        // Load cover photo preference
  useEffect(() => {
    const loadCoverPhoto = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedCover = userData.pagePreferences?.campaignsAuto?.coverPhoto;
          if (savedCover) {
            setCoverPhoto(savedCover);
            const isDark = await detectCoverBrightness(savedCover);
            setIsCoverDark(isDark);
          }
        }
      } catch (error) {
        console.error('Error loading cover photo:', error);
      }
    };

    loadCoverPhoto();
  }, [currentUser]);

  // Function to detect if cover image is dark or light
  const detectCoverBrightness = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        try {
          const imageData = ctx.getImageData(0, 0, 50, 50);
          const data = imageData.data;
          let totalBrightness = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalBrightness += (r * 299 + g * 587 + b * 114) / 1000;
          }
          
          const avgBrightness = totalBrightness / (data.length / 4);
          resolve(avgBrightness < 128);
        } catch (e) {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  };

  // Handle cover file selection
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
  };

  // Handle cropped cover
  const handleCroppedCover = async (blob: Blob) => {
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
    await handleUpdateCover(blob);
  };

  // Handle gallery cover selection (direct apply)
  const handleDirectApplyCover = async (blob: Blob) => {
    setIsCoverGalleryOpen(false);
    await handleUpdateCover(blob);
  };

  // Update cover photo
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;
    
    setIsUpdatingCover(true);
    try {
      const fileName = `campaigns-auto-cover-${Date.now()}.jpg`;
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      // Delete old cover if exists
      if (coverPhoto) {
        try {
          const oldRef = ref(storage, coverPhoto);
          await deleteObject(oldRef);
        } catch (e) {
          // Ignore if old cover doesn't exist
        }
      }

      // Save to user preferences
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentPagePreferences = userDoc.exists() ? userDoc.data().pagePreferences || {} : {};
      const currentCampaignsAutoPrefs = currentPagePreferences.campaignsAuto || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          campaignsAuto: {
            ...currentCampaignsAutoPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);
      
      // Detect brightness of new cover
      const isDark = await detectCoverBrightness(coverUrl);
      setIsCoverDark(isDark);
      
      notify.success('Cover updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Remove cover photo
  const handleRemoveCover = async () => {
    if (!currentUser || !coverPhoto) return;
    
    setIsUpdatingCover(true);
    try {
      // Delete from storage
      try {
        const coverRef = ref(storage, coverPhoto);
        await deleteObject(coverRef);
      } catch (e) {
        // Ignore if doesn't exist
      }

      // Update user preferences
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentPagePreferences = userDoc.exists() ? userDoc.data().pagePreferences || {} : {};
      const currentCampaignsAutoPrefs = currentPagePreferences.campaignsAuto || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          campaignsAuto: {
            ...currentCampaignsAutoPrefs,
            coverPhoto: null
          }
        }
      });

      setCoverPhoto(null);
      setIsCoverDark(null);
      notify.success('Cover removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Search Apollo for contacts
  const handleSearchApollo = useCallback(async (campaignId: string, targeting: ApolloTargeting) => {
    setIsSearchingApollo(true);
    try {
      notify.info('Searching Apollo for contacts...');
      
      const result = await searchApolloContacts(campaignId, targeting, 100);
      
      if (result.success) {
        notify.success(`Found ${result.contactsFound} contacts!`);
        setSelectedCampaignId(campaignId);
      } else {
        notify.warning('No contacts found');
      }
    } catch (error: any) {
      console.error('Apollo search error:', error);
      notify.error(error.message || 'Failed to search Apollo');
    } finally {
      setIsSearchingApollo(false);
    }
  }, []);

  // Handle campaign created
  const handleCampaignCreated = useCallback(async (campaignId: string) => {
    setIsNewCampaignModalOpen(false);
    
    // Get the campaign data to trigger Apollo search
    try {
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (campaignDoc.exists()) {
        const campaignData = campaignDoc.data();
        await handleSearchApollo(campaignId, campaignData.targeting);
      }
    } catch (error) {
      console.error('Error fetching campaign for Apollo search:', error);
    }
  }, [handleSearchApollo]);

  // Handle campaign deletion
  const handleDeleteCampaign = useCallback(async () => {
    if (!deleteCampaignModal.campaign) return;
    
    try {
      const campaignId = deleteCampaignModal.campaign.id;
      
      // Delete all recipients in the campaign first
      const recipientsRef = collection(db, 'campaigns', campaignId, 'recipients');
      const recipientsSnapshot = await getDocs(recipientsRef);
      
      const deletePromises = recipientsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the campaign itself
      await deleteDoc(doc(db, 'campaigns', campaignId));
      
      // Clear selection if this was the selected campaign
      if (selectedCampaignId === campaignId) {
        setSelectedCampaignId(null);
        setRecipients([]);
      }
      
      setDeleteCampaignModal({ show: false });
      notify.success('Campaign deleted');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      notify.error('Failed to delete campaign');
    }
  }, [deleteCampaignModal.campaign, selectedCampaignId]);

  // Handle campaign name update
  const handleUpdateCampaignName = useCallback(async (campaignId: string, newName: string) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        name: newName.trim(),
        updatedAt: new Date()
      });
      setEditingCampaignId(null);
      notify.success('Campaign renamed');
    } catch (error) {
      console.error('Error updating campaign name:', error);
      notify.error('Failed to rename campaign');
    }
  }, []);

  // Get backend URL
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Handle generate emails for all recipients
  const handleGenerateEmails = useCallback(async () => {
    console.log('🔥 handleGenerateEmails called');
    console.log('selectedCampaignId:', selectedCampaignId);
    console.log('currentUser:', currentUser?.uid);
    
    if (!selectedCampaignId || !currentUser) {
      console.log('❌ Missing selectedCampaignId or currentUser');
      return;
    }
    
    setIsGeneratingEmails(true);
    setEmailProgress({ generated: 0, total: recipients.filter(r => !r.emailGenerated).length });
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      console.log('Token obtained:', token ? 'yes' : 'no');
      console.log('Making request to:', `${BACKEND_URL}/api/campaigns/${selectedCampaignId}/generate-emails`);
      
      const response = await fetch(`${BACKEND_URL}/api/campaigns/${selectedCampaignId}/generate-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tone: selectedCampaign?.emailPreferences?.tone || 'casual',
          language: selectedCampaign?.emailPreferences?.language || 'en'
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setEmailProgress({ generated: data.generated, total: data.total });
        notify.success(`Generated ${data.generated} emails!`);
      } else {
        notify.error(data.error || 'Failed to generate emails');
      }
    } catch (error) {
      console.error('❌ Error generating emails:', error);
      notify.error('Failed to generate emails');
    } finally {
      setIsGeneratingEmails(false);
      setEmailProgress(null);
    }
  }, [selectedCampaignId, currentUser, recipients, selectedCampaign, BACKEND_URL]);

  // Handle send emails in batch
  const handleSendEmails = useCallback(async () => {
    if (!selectedCampaignId || !currentUser) return;
    
    // Check if Gmail is connected
    if (!selectedCampaign?.gmail?.connected) {
      notify.error('Please connect Gmail first');
      return;
    }
    
    setIsSendingEmails(true);
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`${BACKEND_URL}/api/campaigns/${selectedCampaignId}/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ batchSize: 10 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSendProgress({ sent: data.sent, remaining: data.remaining });
        if (data.sent > 0) {
          notify.success(`Sent ${data.sent} emails!`);
        } else {
          notify.info(data.message || 'No emails to send');
        }
      } else {
        notify.error(data.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      notify.error('Failed to send emails');
    } finally {
      setIsSendingEmails(false);
      setSendProgress(null);
    }
  }, [selectedCampaignId, currentUser, selectedCampaign, BACKEND_URL]);

  // Handle view reply content
  const handleViewReply = useCallback(async (recipient: CampaignRecipient) => {
    if (!recipient.gmailThreadId || recipient.status !== 'replied') return;
    
    setReplyPreviewRecipient(recipient);
    setIsLoadingReply(true);
    setReplyContent(null);
    setReplyMessage('');
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${recipient.gmailThreadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.reply) {
        setReplyContent(data.reply);
      } else if (data.needsReconnect) {
        notify.error('Gmail token expired');
      } else {
        notify.error(data.message || 'Could not load reply');
      }
    } catch (error) {
      console.error('Error loading reply:', error);
      notify.error('Failed to load reply');
    } finally {
      setIsLoadingReply(false);
    }
  }, [BACKEND_URL]);

  // Handle send reply
  const handleSendReply = useCallback(async () => {
    if (!replyPreviewRecipient?.gmailThreadId || !replyMessage.trim()) return;
    
    setIsSendingReply(true);
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${replyPreviewRecipient.gmailThreadId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: replyMessage.trim()
        })
      });
      
      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to parse error response as JSON, fallback to status text
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON (e.g., HTML error page), use status text
          const text = await response.text();
          if (response.status === 404) {
            errorMessage = 'API endpoint not found. Please restart the server.';
          }
        }
        notify.error(errorMessage);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        notify.success('Reply sent!');
        setReplyMessage('');
        // Optionally close the modal or keep it open
        // setReplyPreviewRecipient(null);
        // setReplyContent(null);
      } else if (data.needsReconnect) {
        notify.error('Gmail token expired');
      } else {
        notify.error(data.error || 'Failed to send reply');
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      notify.error(error.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  }, [replyPreviewRecipient, replyMessage, BACKEND_URL]);

  // Handle check for replies
  const handleCheckReplies = useCallback(async () => {
    if (!selectedCampaignId || !currentUser) return;
    
    setIsCheckingReplies(true);
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`${BACKEND_URL}/api/campaigns/${selectedCampaignId}/check-replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.repliesFound > 0) {
          notify.success(`Found ${data.repliesFound} new replies!`);
        } else {
          notify.info('No new replies');
        }
      } else {
        notify.error(data.error || 'Failed to check replies');
      }
    } catch (error) {
      console.error('Error checking replies:', error);
      notify.error('Failed to check replies');
    } finally {
      setIsCheckingReplies(false);
    }
  }, [selectedCampaignId, currentUser, BACKEND_URL]);

  // Add contact to board
  const addContactToBoard = async (recipient: CampaignRecipient, boardId?: string) => {
    if (!currentUser || !recipient) return;

    try {
      setIsAddingToBoard(true);

      // Check if this contact already exists in user's applications
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const q = query(
        applicationsRef,
        where('contactEmail', '==', recipient.email),
        where('companyName', '==', recipient.company)
      );
      const existingApplications = await getDocs(q);

      if (!existingApplications.empty) {
        notify.warning('Contact already in board');
        setIsAddingToBoard(false);
        return;
      }

      // Build conversation history from campaign data
      const conversationHistory: any[] = [];
      
      // Add initial sent message if available
      if (recipient.emailContent && recipient.sentAt) {
        const sentAtDate = recipient.sentAt?.toDate 
          ? recipient.sentAt.toDate().toISOString() 
          : (recipient.sentAt instanceof Date 
              ? recipient.sentAt.toISOString() 
              : new Date().toISOString());
        
        conversationHistory.push({
          id: crypto.randomUUID(),
          type: 'sent',
          channel: 'email',
          subject: recipient.emailSubject || undefined,
          content: recipient.emailContent,
          sentAt: sentAtDate,
          status: recipient.status === 'replied' ? 'replied' : (recipient.status === 'opened' ? 'opened' : 'sent'),
        });
      }

      // If recipient has replied, fetch the reply from Gmail
      if (recipient.status === 'replied' && recipient.gmailThreadId) {
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          
          const response = await fetch(`${BACKEND_URL}/api/gmail/thread/${recipient.gmailThreadId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (data.success && data.reply) {
            const repliedAtDate = recipient.repliedAt?.toDate 
              ? recipient.repliedAt.toDate().toISOString() 
              : (recipient.repliedAt instanceof Date 
                  ? recipient.repliedAt.toISOString() 
                  : new Date().toISOString());
            
            conversationHistory.push({
              id: crypto.randomUUID(),
              type: 'received',
              channel: 'email',
              subject: data.reply.subject || undefined,
              content: data.reply.body,
              sentAt: repliedAtDate,
              status: 'replied',
            });
          }
        } catch (error) {
          console.error('Error fetching reply content:', error);
          // Continue without the reply content - user can see it later
        }
      }

      // Create application/contact entry
      const contactApplication = {
        companyName: recipient.company || '',
        position: recipient.title || '',
        location: recipient.location || '',
        status: recipient.status === 'replied' ? 'replied' : (recipient.status === 'sent' || recipient.status === 'opened' ? 'contacted' : 'targets'),
        appliedDate: new Date().toISOString().split('T')[0],
        contactName: recipient.fullName || '',
        contactEmail: recipient.email || '',
        contactRole: recipient.title || '',
        contactLinkedIn: recipient.linkedinUrl || '',
        outreachChannel: 'email' as const,
        lastContactedAt: recipient.sentAt?.toDate ? recipient.sentAt.toDate().toISOString() : new Date().toISOString(),
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
        gmailThreadId: recipient.gmailThreadId || undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        boardId: boardId,
        boardType: 'campaigns' as const,
      };

      const newAppDoc = await addDoc(applicationsRef, contactApplication);
      
      // Get board name for notification
      let targetBoardName = 'Default Board';
      if (boardId) {
        const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
        const boardDoc = await getDoc(doc(boardsRef, boardId));
        if (boardDoc.exists()) {
          targetBoardName = boardDoc.data().name || 'Board';
        }
      }
      
      // Create notification for card added
      await notify.cardAdded({
        contactName: recipient.fullName || recipient.email || 'Contact',
        companyName: recipient.company,
        boardName: targetBoardName,
        boardId: boardId || '',
        applicationId: newAppDoc.id,
        showToast: false, // Silent notification (only in notification center)
      });
      
      notify.success('Contact added to board');
      setShowBoardSelector(false);
      setSelectedRecipientForBoard(null);
      setOpenMenuRecipientId(null);
    } catch (error) {
      console.error('Error adding contact to board:', error);
      notify.error('Failed to add contact');
    } finally {
      setIsAddingToBoard(false);
    }
  };

  // Handle add to board click
  const handleAddToBoard = (recipient: CampaignRecipient) => {
    if (!currentUser) {
      notify.error('Please log in first');
      return;
    }

    setSelectedRecipientForBoard(recipient);

    // If user has multiple campaign boards, show selection modal
    if (boards.length > 1) {
      setShowBoardSelector(true);
      return;
    }

    // If user has exactly one board or no boards, add directly
    const targetBoardId = boards.length === 1 ? boards[0].id : undefined;
    addContactToBoard(recipient, targetBoardId);
  };

  // Handle board selection from modal
  const handleBoardSelected = async (boardId: string) => {
    if (selectedRecipientForBoard) {
      await addContactToBoard(selectedRecipientForBoard, boardId);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      menuRefs.current.forEach((menuRef, recipientId) => {
        if (menuRef && !menuRef.contains(event.target as Node)) {
          if (openMenuRecipientId === recipientId) {
            setOpenMenuRecipientId(null);
          }
        }
      });
    };

    if (openMenuRecipientId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuRecipientId]);

  // Filter recipients based on search query
  const filteredRecipients = searchQuery.trim() 
    ? recipients.filter(r => {
        const query = searchQuery.toLowerCase();
        return (
          r.fullName?.toLowerCase().includes(query) ||
          r.title?.toLowerCase().includes(query) ||
          r.company?.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query) ||
          r.location?.toLowerCase().includes(query)
        );
      })
    : recipients;

  // Stats for selected campaign (compute from recipients for real-time accuracy)
  const stats = {
    contactsFound: recipients.length,
    emailsGenerated: recipients.filter(r => r.emailGenerated).length,
    emailsSent: recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length,
    opened: recipients.filter(r => r.status === 'opened' || r.status === 'replied').length,
    replied: recipients.filter(r => r.status === 'replied').length
  };

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === filteredRecipients.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRecipients.map(r => r.id)));
    }
  }, [filteredRecipients, selectedRows.size]);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleCopyEmail = useCallback(async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      notify.copied('Email copied!');
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      notify.error('Failed to copy');
    }
  }, []);

  // Sort handler
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Sorted recipients
  const sortedRecipients = [...filteredRecipients].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aVal = '';
    let bVal = '';
    
    switch (sortColumn) {
      case 'contact':
        aVal = a.fullName || '';
        bVal = b.fullName || '';
        break;
      case 'title':
        aVal = a.title || '';
        bVal = b.title || '';
        break;
      case 'company':
        aVal = a.company || '';
        bVal = b.company || '';
        break;
      case 'location':
        aVal = a.location || '';
        bVal = b.location || '';
        break;
      case 'email':
        aVal = a.email || '';
        bVal = b.email || '';
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      default:
        return 0;
    }
    
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Clear selection when campaign changes
  useEffect(() => {
    setSelectedRows(new Set());
  }, [selectedCampaignId]);

  // Get status color for left border
  const getStatusBorderColor = (status: RecipientStatus) => {
    switch (status) {
      case 'replied':
        return 'border-l-emerald-500';
      case 'opened':
        return 'border-l-blue-500';
      case 'sent':
        return 'border-l-amber-500';
      case 'email_ready':
      case 'email_generated':
        return 'border-l-purple-500';
      case 'pending':
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  // Register page data with AI Assistant
  const campaignsSummary = useMemo(() => {
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    return {
      totalCampaigns: campaigns.length,
      selectedCampaign: selectedCampaign ? {
        name: selectedCampaign.name,
        status: selectedCampaign.status,
        stats: selectedCampaign.stats,
        targeting: {
          jobTitles: selectedCampaign.targeting?.jobTitles,
          locations: selectedCampaign.targeting?.locations,
          industries: selectedCampaign.targeting?.industries,
        },
      } : null,
      recipients: {
        total: recipients.length,
        byStatus: {
          pending: recipients.filter(r => r.status === 'pending').length,
          emailGenerated: recipients.filter(r => r.status === 'email_generated' || r.status === 'email_ready').length,
          sent: recipients.filter(r => r.status === 'sent').length,
          opened: recipients.filter(r => r.status === 'opened').length,
          replied: recipients.filter(r => r.status === 'replied').length,
        },
        sampleRecipients: recipients.slice(0, 5).map(r => ({
          name: r.fullName,
          title: r.title,
          company: r.company,
          status: r.status,
        })),
      },
    };
  }, [campaigns, selectedCampaignId, recipients]);

  useAssistantPageData('campaigns', campaignsSummary, campaigns.length > 0);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Loading campaigns...
            </p>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Cover Photo Section with all header elements */}
        <div 
          className="relative group/cover flex-shrink-0"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${coverPhoto ? 'h-auto min-h-[160px] sm:min-h-[180px]' : 'h-auto min-h-[120px] sm:min-h-[140px]'}`}>
            {/* Cover Background */}
            {coverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  key={coverPhoto}
                  src={coverPhoto} 
                  alt="Campaigns cover" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-[#242325]/50 dark:via-[#2b2a2c]/30 dark:to-purple-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                   style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                />
                <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
              </div>
            )}

            {/* Cover Controls */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <AnimatePresence>
                {(isHoveringCover || !coverPhoto) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 pointer-events-auto"
                  >
                    {!coverPhoto ? (
                      <button
                        onClick={() => setIsCoverGalleryOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                          bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#2b2a2c]
                          border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-sm transition-all duration-200
                          hover:shadow-md group"
                      >
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        <span>Add cover</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-[#242325]/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#2b2a2c] rounded-md transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Change cover
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />
                        
                        <button
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUpdatingCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#2b2a2c] rounded-md transition-colors"
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

            {/* Header Content */}
            <div className="relative z-10 px-4 sm:px-6 pt-6 pb-4 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <h1 className={`text-2xl font-bold ${coverPhoto 
                    ? 'text-white drop-shadow-2xl'
                    : 'text-gray-900 dark:text-white'
                  }`}>Campaigns</h1>
                  <p className={`text-sm mt-0.5 ${coverPhoto 
                    ? 'text-white/90 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Send autonomous applications to find interviews quickly
                  </p>
                </div>
                
                <motion.button
                  onClick={() => setIsNewCampaignModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200
                    ${coverPhoto 
                      ? (isCoverDark 
                        ? 'text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015]'
                        : 'text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015]')
                      : 'text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] dark:bg-[#b7e219] dark:hover:bg-[#a5cb17]'
                    }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>New Campaign</span>
                </motion.button>
              </motion.div>

              {/* Campaign Selector + Stats in Header */}
              {campaigns.length > 0 && (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Campaign Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        coverPhoto
                          ? 'bg-white/95 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black/60'
                          : 'bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.12]'
                      } rounded-xl transition-all duration-200 min-w-[200px]`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className={`text-[10px] uppercase tracking-wider ${
                          coverPhoto ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
                        }`}>Campaign</span>
                        <span className={`text-[13px] font-semibold truncate max-w-[160px] ${
                          coverPhoto ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {selectedCampaign 
                            ? (selectedCampaign.name || `Campaign ${campaigns.indexOf(selectedCampaign) + 1}`)
                            : 'Select Campaign'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${
                        coverPhoto ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                      } transition-transform duration-200 flex-shrink-0 ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isCampaignDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 mt-2 w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-xl dark:shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                          {campaigns.map((campaign, index) => (
                            <div
                              key={campaign.id}
                              className={`group flex items-center gap-2 px-4 py-3 transition-all duration-150
                                ${selectedCampaignId === campaign.id 
                                  ? 'bg-gray-50 dark:bg-white/[0.06]' 
                                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                                }`}
                            >
                              {editingCampaignId === campaign.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingCampaignName}
                                    onChange={(e) => setEditingCampaignName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateCampaignName(campaign.id, editingCampaignName);
                                      } else if (e.key === 'Escape') {
                                        setEditingCampaignId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="flex-1 px-2.5 py-1.5 text-sm bg-white dark:bg-white/[0.05] border border-gray-300 dark:border-white/[0.1] rounded-lg 
                                      focus:outline-none focus:border-gray-400 dark:focus:border-white/[0.2] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Campaign name..."
                                  />
                                  <button
                                    onClick={() => handleUpdateCampaignName(campaign.id, editingCampaignName)}
                                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCampaignId(null)}
                                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedCampaignId(campaign.id);
                                      setIsCampaignDropdownOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {campaign.name || `Campaign ${index + 1}`}
                                      </p>
                                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                        {campaign.targeting?.personTitles?.slice(0, 2).join(', ') || 'No targeting'}
                                        {(campaign.targeting?.personTitles?.length || 0) > 2 && ` +${campaign.targeting.personTitles.length - 2}`}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                        {campaign.stats?.contactsFound || 0}
                                      </p>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        contacts
                                      </p>
                                    </div>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCampaignId(campaign.id);
                                      setEditingCampaignName(campaign.name || `Campaign ${index + 1}`);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]
                                      opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                    title="Rename campaign"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteCampaignModal({ show: true, campaign });
                                      setIsCampaignDropdownOpen(false);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
                                      opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                    title="Delete campaign"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Compact Stats Cards - Aligned Right */}
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    {/* Contacts */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                      coverPhoto
                        ? 'bg-white/95 dark:bg-white/[0.12] backdrop-blur-md border border-white/30 dark:border-white/20'
                        : 'bg-white dark:bg-white/[0.08] border border-gray-200/60 dark:border-white/[0.12]'
                    } rounded-lg shadow-sm dark:shadow-none`}>
                      <Users className={`w-3.5 h-3.5 ${coverPhoto ? 'text-gray-600 dark:text-gray-300' : 'text-gray-600 dark:text-gray-300'}`} />
                      <span className={`text-base font-bold tabular-nums ${coverPhoto ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{stats.contactsFound}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${coverPhoto ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>Contacts</span>
                    </div>

                    {/* Generated */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                      coverPhoto
                        ? 'bg-purple-100/95 dark:bg-purple-500/25 backdrop-blur-md border border-purple-300/50 dark:border-purple-400/40'
                        : 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/[0.15] dark:to-indigo-500/[0.12] border border-purple-200/60 dark:border-purple-400/30'
                    } rounded-lg shadow-sm dark:shadow-none`}>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                      <span className="text-base font-bold text-purple-700 dark:text-purple-200 tabular-nums">{stats.emailsGenerated}</span>
                      <span className="text-[10px] text-purple-600/70 dark:text-purple-300/80 uppercase tracking-wider">Generated</span>
                    </div>

                    {/* Sent */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                      coverPhoto
                        ? 'bg-amber-100/95 dark:bg-amber-500/25 backdrop-blur-md border border-amber-300/50 dark:border-amber-400/40'
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/[0.15] dark:to-orange-500/[0.12] border border-amber-200/60 dark:border-amber-400/30'
                    } rounded-lg shadow-sm dark:shadow-none`}>
                      <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                      <span className="text-base font-bold text-amber-700 dark:text-amber-200 tabular-nums">{stats.emailsSent}</span>
                      <span className="text-[10px] text-amber-600/70 dark:text-amber-300/80 uppercase tracking-wider">Sent</span>
                    </div>

                    {/* Opened */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                      coverPhoto
                        ? 'bg-blue-100/95 dark:bg-blue-500/25 backdrop-blur-md border border-blue-300/50 dark:border-blue-400/40'
                        : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/[0.15] dark:to-cyan-500/[0.12] border border-blue-200/60 dark:border-blue-400/30'
                    } rounded-lg shadow-sm dark:shadow-none`}>
                      <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                      <span className="text-base font-bold text-blue-700 dark:text-blue-200 tabular-nums">{stats.opened}</span>
                      <span className="text-[10px] text-blue-600/70 dark:text-blue-300/80 uppercase tracking-wider">Opened</span>
                    </div>

                    {/* Replied */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${
                      coverPhoto
                        ? 'bg-emerald-100/95 dark:bg-emerald-500/25 backdrop-blur-md border border-emerald-300/50 dark:border-emerald-400/40'
                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/[0.15] dark:to-teal-500/[0.12] border border-emerald-200/60 dark:border-emerald-400/30'
                    } rounded-lg shadow-sm dark:shadow-none`}>
                      <Reply className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-200 tabular-nums">{stats.replied}</span>
                      <span className="text-[10px] text-emerald-600/70 dark:text-emerald-300/80 uppercase tracking-wider">Replied</span>
                    </div>
                  </div>
                </div>
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

        {/* Main Content */}
        <div className="px-0 pt-4 pb-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Search + Targeting Tags + Dev Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4 px-6"
          >
            {/* Search + Targeting Tags + Dev Buttons */}
            {selectedCampaign && (
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.04]">
                {/* Search Bar */}
                {recipients.length > 0 && (
                  <div className="relative w-64 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2 text-[13px] bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                        rounded-lg focus:outline-none focus:border-gray-300 dark:focus:border-white/[0.15] focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/[0.05]
                        text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Targeting Tags */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-0.5">
                  {selectedCampaign.targeting?.personTitles?.map(title => (
                    <span 
                      key={title} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                        text-gray-600 dark:text-gray-300 text-[11px] font-medium rounded-lg whitespace-nowrap hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Briefcase className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      {title}
                    </span>
                  ))}
                  {selectedCampaign.targeting?.personLocations?.map(loc => (
                    <span 
                      key={loc} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                        text-gray-600 dark:text-gray-300 text-[11px] font-medium rounded-lg whitespace-nowrap hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      {loc}
                    </span>
                  ))}
                  {selectedCampaign.targeting?.industries?.map(ind => (
                    <span 
                      key={ind} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                        text-gray-600 dark:text-gray-300 text-[11px] font-medium rounded-lg whitespace-nowrap hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Building2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      {ind}
                    </span>
                  ))}
                  {searchQuery && (
                    <span className="text-[11px] text-gray-500 whitespace-nowrap ml-auto">
                      {filteredRecipients.length}/{recipients.length} results
                    </span>
                  )}
                </div>

                {/* Dev Action Buttons (temporary) */}
                {recipients.length > 0 && (
                  <div className="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-gray-200 dark:border-white/[0.08]">
                    <button
                      onClick={handleGenerateEmails}
                      disabled={isGeneratingEmails || recipients.filter(r => !r.emailGenerated).length === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200
                        ${recipients.filter(r => !r.emailGenerated).length > 0
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30'
                          : 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isGeneratingEmails ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : recipients.filter(r => !r.emailGenerated).length === 0 ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      <span>
                        {isGeneratingEmails 
                          ? `${emailProgress ? `${emailProgress.generated}/${emailProgress.total}` : '...'}` 
                          : recipients.filter(r => !r.emailGenerated).length === 0
                            ? 'All Generated'
                            : `Generate (${recipients.filter(r => !r.emailGenerated).length})`
                        }
                      </span>
                    </button>

                    <button
                      onClick={handleSendEmails}
                      disabled={isSendingEmails || recipients.filter(r => r.status === 'email_generated').length === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200
                        ${recipients.filter(r => r.status === 'email_generated').length > 0
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isSendingEmails ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>
                        {isSendingEmails
                          ? `${sendProgress ? sendProgress.sent : '...'}`
                          : recipients.filter(r => r.status === 'email_generated').length > 0
                            ? `Send (${Math.min(10, recipients.filter(r => r.status === 'email_generated').length)})`
                            : 'No Ready'
                        }
                      </span>
                    </button>

                    <button
                      onClick={handleCheckReplies}
                      disabled={isCheckingReplies || recipients.filter(r => r.status === 'sent' || r.status === 'opened').length === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200
                        ${recipients.filter(r => r.status === 'sent' || r.status === 'opened').length > 0
                          ? 'bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.08]'
                          : 'bg-gray-100 dark:bg-white/[0.03] text-gray-400 dark:text-gray-600 cursor-not-allowed border border-transparent'
                        }`}
                    >
                      {isCheckingReplies ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>Check Replies</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Premium Data Table - Linear/Notion Style */}
          {(campaigns.length > 0 || recipients.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex-1 min-h-0 mx-6 border border-gray-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden flex flex-col 
              bg-white dark:bg-[#2b2a2c] shadow-lg dark:shadow-2xl dark:shadow-black/40 backdrop-blur-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
          >
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-300/50 dark:scrollbar-thumb-white/[0.12] 
              scrollbar-track-transparent hover:scrollbar-thumb-gray-400/70 dark:hover:scrollbar-thumb-white/[0.18] transition-colors">
              <table ref={tableRef} className="w-full border-collapse table-fixed">
                {/* Premium Header with Glassmorphism */}
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-gray-200/80 dark:border-white/[0.05] bg-gradient-to-b from-white via-white to-gray-50/50 
                    dark:from-[#2b2a2c] dark:via-[#2b2a2c] dark:to-[#2a2829] backdrop-blur-md">
                    {/* Checkbox Column Header */}
                    <th 
                      style={{ width: `${columnWidths.checkbox}%` }} 
                      className="px-3 py-3.5 bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        transition-colors duration-200"
                    >
                      <div className="flex items-center justify-center">
                        <button
                          onClick={handleSelectAll}
                          className={`w-4.5 h-4.5 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200 
                            ${selectedRows.size === filteredRecipients.length && filteredRecipients.length > 0
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-violet-500 shadow-sm shadow-violet-500/25'
                              : selectedRows.size > 0
                                ? 'bg-gradient-to-br from-violet-500/50 to-purple-600/50 border-violet-400'
                                : 'border-gray-300 dark:border-[#4a494b] hover:border-violet-400 dark:hover:border-violet-500'
                            }`}
                        >
                          {selectedRows.size === filteredRecipients.length && filteredRecipients.length > 0 ? (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          ) : selectedRows.size > 0 ? (
                            <Minus className="w-3 h-3 text-white" strokeWidth={3} />
                          ) : null}
                        </button>
                      </div>
                    </th>
                    
                    {/* Contact Header */}
                    <th 
                      style={{ width: `${columnWidths.contact}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('contact')}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'contact' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>
                          {sortColumn === 'contact' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'contact'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize 
                          bg-transparent hover:bg-violet-400/40 dark:hover:bg-violet-500/50 
                          active:bg-violet-500 dark:active:bg-violet-400 transition-all duration-200"
                      />
                    </th>
                    
                    {/* Title Header */}
                    <th 
                      style={{ width: `${columnWidths.title}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'title' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortColumn === 'title' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'title'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* Company Header */}
                    <th 
                      style={{ width: `${columnWidths.company}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('company')}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'company' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortColumn === 'company' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'company'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* Location Header */}
                    <th 
                      style={{ width: `${columnWidths.location}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'location' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortColumn === 'location' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'location'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* Email Header */}
                    <th 
                      style={{ width: `${columnWidths.email}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'email' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortColumn === 'email' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'email'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* LinkedIn Header */}
                    <th 
                      style={{ width: `${columnWidths.linkedin}%` }} 
                      className="relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">LinkedIn</span>
                      </div>
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'linkedin')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* Status Header */}
                    <th 
                      style={{ width: `${columnWidths.status}%` }} 
                      className="group relative px-4 py-3.5 text-left bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md border-r border-gray-200/50 dark:border-white/[0.03] 
                        cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.015] 
                        active:bg-gray-100/60 dark:active:bg-white/[0.025] transition-all duration-200"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                        <div className={`transition-all duration-200 ${sortColumn === 'status' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortColumn === 'status' && sortDirection === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
                          )}
                        </div>
                      </div>
                      <div 
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'status'); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 transition-colors"
                      />
                    </th>
                    
                    {/* Actions Header */}
                    <th 
                      style={{ width: `${columnWidths.actions}%` }} 
                      className="px-4 py-3.5 text-center bg-gradient-to-b from-white via-gray-50/50 to-gray-50/30 
                        dark:from-[#2b2a2c] dark:via-[#2a2829] dark:to-[#2a2829]
                        backdrop-blur-md transition-colors duration-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.03]">
                  {/* Loading State with Premium Skeleton */}
                  {isLoadingRecipients ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-3 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 rounded bg-gray-200/60 dark:bg-white/[0.06]" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200/60 to-gray-300/40 dark:from-white/[0.08] dark:to-white/[0.04]" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="h-3.5 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-32" />
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-gray-200/60 dark:bg-white/[0.06]" />
                            <div className="h-3.5 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-20" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="h-3.5 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-28" />
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="h-3.5 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-36" />
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="w-6 h-6 rounded bg-gray-200/60 dark:bg-white/[0.06]" />
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200/40 dark:border-white/[0.025]">
                          <div className="h-6 bg-gray-200/60 dark:bg-white/[0.06] rounded-full w-16" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-7 h-7 rounded bg-gray-200/60 dark:bg-white/[0.06]" />
                            <div className="w-7 h-7 rounded bg-gray-200/60 dark:bg-white/[0.06]" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : recipients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/[0.05] dark:to-white/[0.02] flex items-center justify-center mb-4 shadow-inner">
                            <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">No contacts yet</h3>
                          <p className="text-[13px] text-gray-500 dark:text-gray-500 max-w-xs">
                            {selectedCampaign ? 'No contacts found for this campaign. Try adjusting your targeting criteria.' : 'Select a campaign to view contacts.'}
                          </p>
                        </motion.div>
                      </td>
                    </tr>
                  ) : sortedRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-500/10 dark:to-purple-500/5 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-violet-500 dark:text-violet-400" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">No results found</h3>
                          <p className="text-[13px] text-gray-500 dark:text-gray-500 mb-3">
                            No contacts match "{searchQuery}"
                          </p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                          >
                            Clear search
                          </button>
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    sortedRecipients.map((recipient, index) => (
                      <motion.tr 
                        key={recipient.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.015 * Math.min(index, 20) }}
                        className={`group relative transition-all duration-200 ease-out
                          ${selectedRows.has(recipient.id) 
                            ? 'bg-violet-50/60 dark:bg-violet-500/[0.08] border-l-violet-500 dark:border-l-violet-400' 
                            : index % 2 === 0 
                              ? 'bg-white dark:bg-[#2b2a2c]' 
                              : 'bg-gray-50/40 dark:bg-[#2a2829]'
                          }
                          hover:bg-gray-50/90 dark:hover:bg-white/[0.02] 
                          hover:shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_1px_3px_-1px_rgba(0,0,0,0.4)]
                          active:bg-gray-100/80 dark:active:bg-white/[0.03]
                          border-l-[3px] ${selectedRows.has(recipient.id) ? '' : getStatusBorderColor(recipient.status)}`}
                      >
                        {/* Checkbox Cell */}
                        <td className="px-3 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleSelectRow(recipient.id)}
                              className={`w-4.5 h-4.5 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200 
                                ${selectedRows.has(recipient.id)
                                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-violet-500 shadow-sm shadow-violet-500/25 scale-105'
                                  : 'border-gray-300 dark:border-[#4a494b] hover:border-violet-400 dark:hover:border-violet-500 hover:scale-105'
                                }`}
                            >
                              {selectedRows.has(recipient.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </button>
                          </div>
                        </td>
                        
                        {/* Contact Cell with Avatar */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          <div className="flex items-center gap-3">
                            {/* Premium Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white
                                bg-gradient-to-br ${
                                  index % 5 === 0 ? 'from-violet-500 to-purple-600' :
                                  index % 5 === 1 ? 'from-blue-500 to-cyan-600' :
                                  index % 5 === 2 ? 'from-emerald-500 to-teal-600' :
                                  index % 5 === 3 ? 'from-amber-500 to-orange-600' :
                                  'from-rose-500 to-pink-600'
                                } shadow-sm`}
                              >
                                {recipient.firstName?.charAt(0)}{recipient.lastName?.charAt(0)}
                              </div>
                              {recipient.status === 'replied' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className="text-[13px] font-medium text-gray-900 dark:text-gray-50 truncate 
                              group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors cursor-default">
                              {recipient.fullName}
                            </span>
                          </div>
                        </td>
                        
                        {/* Title Cell */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate block">
                            {recipient.title || <span className="text-gray-300 dark:text-gray-600/60">—</span>}
                          </span>
                        </td>
                        
                        {/* Company Cell with Logo */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          <div className="flex items-center gap-2.5">
                            {recipient.company && (
                              <CompanyLogo companyName={recipient.company} size="sm" />
                            )}
                            <span className="text-[13px] font-medium text-gray-800 dark:text-gray-100 truncate">
                              {recipient.company || <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}
                            </span>
                          </div>
                        </td>
                        
                        {/* Location Cell */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          {recipient.location ? (
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">
                                {recipient.location}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[13px] text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        
                        {/* Email Cell with Copy */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          {recipient.email && !recipient.email.includes('not_unlocked') ? (
                            <div className="flex items-center gap-2 group/email">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                                <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">
                                  {recipient.email}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyEmail(recipient.email!)}
                                className={`p-1 rounded transition-all duration-200 opacity-0 group-hover/email:opacity-100
                                  ${copiedEmail === recipient.email 
                                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                                  }`}
                                title="Copy email"
                              >
                                {copiedEmail === recipient.email ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[13px] text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        
                        {/* LinkedIn Cell */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          {recipient.linkedinUrl ? (
                            <a
                              href={recipient.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                text-[#0A66C2] dark:text-[#71b7fb] 
                                hover:bg-[#0A66C2]/10 dark:hover:bg-[#71b7fb]/10 
                                hover:shadow-[0_0_0_4px_rgba(10,102,194,0.1)] dark:hover:shadow-[0_0_0_4px_rgba(113,183,251,0.1)]
                                transition-all duration-200"
                              title="View LinkedIn Profile"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-[13px] text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        
                        {/* Status Cell with Premium Badge */}
                        <td className="px-4 py-3 border-r border-gray-200/40 dark:border-white/[0.025] transition-colors duration-200">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                            ${recipient.status === 'replied' 
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20' 
                              : recipient.status === 'opened' 
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200/50 dark:ring-blue-500/20' 
                              : recipient.status === 'sent' 
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-500/20' 
                              : recipient.status === 'email_generated' || recipient.status === 'email_ready'
                              ? 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200/50 dark:ring-violet-500/20' 
                              : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-500 ring-1 ring-gray-200/50 dark:ring-white/[0.05]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              recipient.status === 'replied' ? 'bg-emerald-500 animate-pulse' :
                              recipient.status === 'opened' ? 'bg-blue-500' :
                              recipient.status === 'sent' ? 'bg-amber-500 animate-pulse' :
                              recipient.status === 'email_generated' || recipient.status === 'email_ready' ? 'bg-violet-500' :
                              'bg-gray-400 dark:bg-[#4a494b]'
                            }`} />
                            {getStatusLabel(recipient.status)}
                          </span>
                        </td>
                        
                        {/* Actions Cell */}
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEmailPreviewRecipient(recipient)}
                              disabled={!recipient.emailGenerated}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                recipient.emailGenerated 
                                  ? 'text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/80 dark:hover:bg-violet-500/15 hover:shadow-sm hover:scale-105 active:scale-95'
                                  : 'text-gray-200 dark:text-gray-700/50 cursor-not-allowed opacity-50'
                              }`}
                              title={recipient.emailGenerated ? "View email" : "Email not generated yet"}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewReply(recipient)}
                              disabled={recipient.status !== 'replied'}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                recipient.status === 'replied'
                                  ? 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/15 hover:shadow-sm hover:scale-105 active:scale-95'
                                  : 'text-gray-200 dark:text-gray-700/50 cursor-not-allowed opacity-50'
                              }`}
                              title={recipient.status === 'replied' ? "View reply" : "No reply yet"}
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <div className="relative" ref={(el) => {
                              if (el) menuRefs.current.set(recipient.id, el);
                            }}>
                              <button
                                onClick={() => setOpenMenuRecipientId(openMenuRecipientId === recipient.id ? null : recipient.id)}
                                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 
                                  hover:bg-gray-100/80 dark:hover:bg-white/[0.08] active:bg-gray-200/60 dark:active:bg-white/[0.12]
                                  transition-all duration-200 hover:scale-105 active:scale-95
                                  opacity-0 group-hover:opacity-100"
                                title="More options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {openMenuRecipientId === recipient.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#1a1a1a] 
                                    rounded-xl shadow-xl dark:shadow-2xl border border-gray-200/80 dark:border-white/[0.08] 
                                    py-1.5 backdrop-blur-sm"
                                >
                                  <button
                                    onClick={() => handleAddToBoard(recipient)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 
                                      hover:bg-gray-50 dark:hover:bg-white/[0.05] active:bg-gray-100 dark:active:bg-white/[0.08]
                                      transition-all duration-150"
                                  >
                                    <FolderKanban className="w-4 h-4" />
                                    <span>Add to Board</span>
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Premium Table Footer */}
            {sortedRecipients.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200/60 dark:border-white/[0.04] 
                bg-gradient-to-b from-gray-50/30 via-white to-white dark:from-[#2a2829] dark:via-[#2a2829] dark:to-[#2b2a2c]">
                <div className="text-[12px] text-gray-500 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{sortedRecipients.length}</span> of <span className="font-semibold text-gray-700 dark:text-gray-200">{recipients.length}</span> contacts
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 
                    hover:bg-gray-100/80 dark:hover:bg-white/[0.06] active:bg-gray-200/60 dark:active:bg-white/[0.08]
                    transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    disabled
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 px-2">Page 1 of 1</span>
                  <button className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 
                    hover:bg-gray-100/80 dark:hover:bg-white/[0.06] active:bg-gray-200/60 dark:active:bg-white/[0.08]
                    transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    disabled
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          )}
          
          {/* Floating Bulk Actions Bar */}
          <AnimatePresence>
            {selectedRows.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-white/95 rounded-xl shadow-2xl shadow-gray-900/20 dark:shadow-black/40 
                  border border-gray-800 dark:border-gray-200 backdrop-blur-xl"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
                >
                  {/* Selection count */}
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-700 dark:border-gray-300">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white">{selectedRows.size}</span>
                    </div>
                    <span className="text-[13px] font-medium text-gray-300 dark:text-gray-700">selected</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleGenerateEmails}
                      disabled={isGeneratingEmails}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium
                        text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 
                        hover:bg-violet-600 dark:hover:bg-violet-100 transition-colors"
                    >
                      <Wand2 className="w-4 h-4" />
                      Generate
                    </button>
                    <button 
                      onClick={handleSendEmails}
                      disabled={isSendingEmails}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium
                        text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 
                        hover:bg-emerald-600 dark:hover:bg-emerald-100 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium
                      text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 
                      hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                  
                  {/* Clear selection */}
                  <button 
                    onClick={() => setSelectedRows(new Set())}
                    className="ml-2 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 
                      hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State - Only show when NO campaigns AND NO recipients exist */}
          {campaigns.length === 0 && recipients.length === 0 && !isLoadingRecipients && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-[#2b2a2c] border-y border-gray-200 dark:border-[#3d3c3e]">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No campaigns yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                  Start a new campaign to automatically reach out to potential employers and find interview opportunities.
                </p>
              <button 
                onClick={() => setIsNewCampaignModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                  <Sparkles className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
              </div>
            )}

          {/* Apollo Search Loading Overlay */}
          <AnimatePresence>
            {isSearchingApollo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-[#2b2a2c] rounded-2xl p-8 shadow-2xl flex flex-col items-center"
                >
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full" />
                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <Search className="absolute inset-0 m-auto w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Searching Apollo
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Finding contacts matching your criteria...
                  </p>
          </motion.div>
          </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />

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

      {/* Delete Campaign Confirmation Modal */}
      {deleteCampaignModal.show && deleteCampaignModal.campaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Campaign</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeleteCampaignModal({ show: false })}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>Campaign {campaigns.indexOf(deleteCampaignModal.campaign) + 1}</strong>? 
              This will permanently delete all {deleteCampaignModal.campaign.stats?.contactsFound || 0} contacts and cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteCampaignModal({ show: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#3d3c3e] rounded-lg flex-1 sm:flex-initial"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg flex-1 sm:flex-initial"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reply Preview Modal */}
      <AnimatePresence>
        {replyPreviewRecipient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setReplyPreviewRecipient(null);
              setReplyContent(null);
              setReplyMessage('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3c3e] flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                    <Reply className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Reply from {replyPreviewRecipient.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {replyPreviewRecipient.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReplyPreviewRecipient(null);
                    setReplyContent(null);
                    setReplyMessage('');
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2a2c] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoadingReply ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading reply...</p>
                  </div>
                ) : replyContent ? (
                  <>
                    {/* Reply metadata */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {replyContent.from}
                      </span>
                      <span>•</span>
                      <span>{replyContent.date}</span>
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Subject
                      </label>
                      <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08]">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {replyContent.subject || 'Re: ' + (replyPreviewRecipient.emailSubject || 'No subject')}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Message
                      </label>
                      <div className="px-4 py-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {replyContent.body}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center mx-auto mb-4">
                      <Reply className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Could not load reply content
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Compose Section */}
              {replyContent && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-white/[0.02]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="w-full px-4 py-3 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                      rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400
                      text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                      resize-none transition-all duration-200"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3d3c3e] flex justify-end gap-3">
                <button
                  onClick={() => {
                    setReplyPreviewRecipient(null);
                    setReplyContent(null);
                    setReplyMessage('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2a2c] rounded-lg transition-colors"
                >
                  Close
                </button>
                {replyContent && (
                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyMessage.trim()}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2
                      ${replyMessage.trim() && !isSendingReply
                        ? 'text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
                        : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/[0.05] cursor-not-allowed'
                      }`}
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Preview Modal */}
      <AnimatePresence>
        {emailPreviewRecipient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setEmailPreviewRecipient(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3c3e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                    {emailPreviewRecipient.firstName?.charAt(0)}{emailPreviewRecipient.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Email to {emailPreviewRecipient.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {emailPreviewRecipient.title} at {emailPreviewRecipient.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEmailPreviewRecipient(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2a2c] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Email Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {emailPreviewRecipient.emailGenerated ? (
                  <>
                    {/* Subject */}
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Subject
                      </label>
                      <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08]">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {emailPreviewRecipient.emailSubject || 'No subject'}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Message
                      </label>
                      <div className="px-4 py-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08]">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {emailPreviewRecipient.emailContent || 'No content'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-6 flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyles(emailPreviewRecipient.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          emailPreviewRecipient.status === 'replied' ? 'bg-emerald-500' :
                          emailPreviewRecipient.status === 'opened' ? 'bg-blue-500' :
                          emailPreviewRecipient.status === 'sent' ? 'bg-amber-500' :
                          'bg-purple-500'
                        }`} />
                        {getStatusLabel(emailPreviewRecipient.status)}
                      </span>
                      {emailPreviewRecipient.sentAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Sent {new Date(emailPreviewRecipient.sentAt.toDate?.() || emailPreviewRecipient.sentAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Email not generated yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Click "Generate Emails" to create personalized emails
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3d3c3e] flex justify-end gap-3">
                <button
                  onClick={() => setEmailPreviewRecipient(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2a2c] rounded-lg transition-colors"
                >
                  Close
                </button>
                {emailPreviewRecipient.emailGenerated && emailPreviewRecipient.email && (
                  <a
                    href={`mailto:${emailPreviewRecipient.email}?subject=${encodeURIComponent(emailPreviewRecipient.emailSubject || '')}&body=${encodeURIComponent(emailPreviewRecipient.emailContent || '')}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Open in Mail
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board Selection Modal */}
      <SelectBoardModal
        isOpen={showBoardSelector}
        onClose={() => {
          setShowBoardSelector(false);
          setSelectedRecipientForBoard(null);
        }}
        onSelect={handleBoardSelected}
        boards={boards}
        jobTitle={selectedRecipientForBoard?.title || 'Contact'}
        companyName={selectedRecipientForBoard?.company || ''}
        isLoading={isAddingToBoard}
      />
    </AuthLayout>
  );
}


