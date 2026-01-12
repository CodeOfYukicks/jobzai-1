import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FolderKanban,
  Info
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
import { ProfileAvatar, generateGenderedAvatarConfig } from '../components/profile/avatar';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { CREDIT_COSTS } from '../lib/planLimits';
import CreditConfirmModal from '../components/CreditConfirmModal';
import { FilterBottomSheet } from '../components/common/BottomSheet';
import MobileTopBar from '../components/mobile/MobileTopBar';
import CampaignSelectorSheet from '../components/campaigns/CampaignSelectorSheet';
import SwipeableRow from '../components/mobile/SwipeableRow';
import AddToBoardSheet from '../components/campaigns/AddToBoardSheet';
import MobileDeleteConfirm from '../components/mobile/MobileDeleteConfirm';
import { OnboardingSpotlight } from '../components/onboarding';

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
  // Demo mode properties
  isDemo?: boolean;
  companyInitialsLogo?: {
    initials: string;
    color: string;
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
  const [searchParams] = useSearchParams();

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
  // Mobile campaign selector
  const [isCampaignSelectorOpen, setIsCampaignSelectorOpen] = useState(false);

  // Delete campaign modal
  const [deleteCampaignModal, setDeleteCampaignModal] = useState<{ show: boolean; campaign?: Campaign }>({ show: false });

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Edit campaign name state
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState('');

  // Email operation states
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isCheckingReplies, setIsCheckingReplies] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{ initialPending: number; startTime: number } | null>(null);
  const [sendProgress, setSendProgress] = useState<{ sent: number; remaining: number } | null>(null);
  const [shouldAutoGenerateEmails, setShouldAutoGenerateEmails] = useState(false);

  // Email preview modal
  const [emailPreviewRecipient, setEmailPreviewRecipient] = useState<CampaignRecipient | null>(null);

  // Board selection states
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [selectedRecipientForBoard, setSelectedRecipientForBoard] = useState<CampaignRecipient | null>(null);
  const [isAddingToBoard, setIsAddingToBoard] = useState(false);
  const [showCreateBoardPrompt, setShowCreateBoardPrompt] = useState(false);
  const [openMenuRecipientId, setOpenMenuRecipientId] = useState<string | null>(null);
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Swipe interaction state
  const [isAddToBoardSheetOpen, setIsAddToBoardSheetOpen] = useState(false);
  const [swipeActionRecipient, setSwipeActionRecipient] = useState<CampaignRecipient | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmRecipient, setDeleteConfirmRecipient] = useState<CampaignRecipient | null>(null);
  const [isDeletingRecipient, setIsDeletingRecipient] = useState(false);
  const [swipeResetKey, setSwipeResetKey] = useState(0); // Used to reset swipe position when modal is cancelled

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

  // Plan limits
  const { canUseForFree, getUsageStats, checkAndUseFeature, userCredits, loading: planLoading } = usePlanLimits();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingCampaignCreation, setPendingCampaignCreation] = useState(false);
  const [shouldDeductCredits, setShouldDeductCredits] = useState(false);

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

      // Check if there's a campaign ID in URL params
      const campaignIdFromUrl = searchParams.get('id');
      if (campaignIdFromUrl && campaignsData.find(c => c.id === campaignIdFromUrl)) {
        setSelectedCampaignId(campaignIdFromUrl);
      } else if (!selectedCampaignId && campaignsData.length > 0) {
        // Auto-select first campaign if none selected and no URL param
        setSelectedCampaignId(campaignsData[0].id);
      }

      setIsLoading(false);
    }, (error) => {
      console.error('Error loading campaigns:', error);
      notify.error('Failed to load campaigns');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate, selectedCampaignId, searchParams]);

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

  // Ref to track if auto-generation has been triggered for current campaign
  const autoGenerateTriggeredRef = useRef(false);

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

  // Search for contacts
  const handleSearchApollo = useCallback(async (campaignId: string, targeting: ApolloTargeting) => {
    setIsSearchingApollo(true);

    // Pre-select the campaign so the listener starts loading recipients
    setSelectedCampaignId(campaignId);

    try {
      const result = await searchApolloContacts(campaignId, targeting, 100, targeting.expandTitles ?? true);

      if (result.success) {
        notify.success(`Found ${result.contactsFound} prospects!`);
        // Campaign already selected, recipients will load via onSnapshot listener
      } else {
        notify.warning('No contacts found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      notify.error(error.message || 'Failed to find contacts');
    } finally {
      setIsSearchingApollo(false);
    }
  }, []);

  // Handle campaign created
  const handleCampaignCreated = useCallback(async (campaignId: string) => {
    console.log('🎯 handleCampaignCreated called for campaign:', campaignId);
    setIsNewCampaignModalOpen(false);

    // Increment usage now that campaign is actually created
    const isFree = canUseForFree('campaignsCreated');
    if (isFree || shouldDeductCredits) {
      await checkAndUseFeature('campaign');
      setShouldDeductCredits(false);
    }

    // Get the campaign data to trigger search
    try {
      const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
      if (campaignDoc.exists()) {
        const campaignData = campaignDoc.data();
        console.log('🔍 Starting contact search...');
        await handleSearchApollo(campaignId, campaignData.targeting);
        console.log('✅ Search completed, setting shouldAutoGenerateEmails to true');
        // Flag to auto-generate emails once recipients are loaded
        setShouldAutoGenerateEmails(true);
      }
    } catch (error) {
      console.error('Error fetching campaign for search:', error);
    }
  }, [handleSearchApollo, canUseForFree, shouldDeductCredits, checkAndUseFeature]);

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

  // Handle new campaign button click with plan limits check
  const handleNewCampaignClick = useCallback(async (useCredits: boolean = false) => {
    const isFree = canUseForFree('campaignsCreated');

    if (!isFree && !useCredits) {
      // Show credit confirmation modal
      setShowCreditModal(true);
      setPendingCampaignCreation(true);
      return;
    }

    if (!isFree && useCredits) {
      // Check if user has enough credits (don't deduct yet)
      if (userCredits < CREDIT_COSTS.campaignPer100) {
        notify.error('Not enough credits');
        return;
      }
      // Mark that we need to deduct credits when campaign is actually created
      setShouldDeductCredits(true);
    }

    // Open the modal
    setIsNewCampaignModalOpen(true);
  }, [canUseForFree, userCredits]);

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

    const pendingCount = recipients.filter(r => !r.emailGenerated).length;
    setIsGeneratingEmails(true);
    setEmailProgress({ initialPending: pendingCount, startTime: Date.now() });

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

  // Auto-generate emails when a new campaign is created and recipients are loaded
  useEffect(() => {
    // Debug logs
    console.log('📊 Auto-generate useEffect triggered:', {
      shouldAutoGenerateEmails,
      isLoadingRecipients,
      recipientsLength: recipients.length,
      hasUngenerated: recipients.length > 0 ? recipients.some(r => !r.emailGenerated) : 'N/A',
      autoGenerateTriggeredRef: autoGenerateTriggeredRef.current,
      isGeneratingEmails
    });

    // Only trigger if:
    // 1. Flag is set (new campaign created)
    // 2. Recipients are loaded (not loading anymore)
    // 3. There are recipients without emails generated
    // 4. We haven't already triggered for this campaign
    // 5. Not already generating
    const hasUngeneratedEmails = recipients.length > 0 && recipients.some(r => !r.emailGenerated);

    if (
      shouldAutoGenerateEmails &&
      !isLoadingRecipients &&
      recipients.length > 0 &&
      hasUngeneratedEmails &&
      !autoGenerateTriggeredRef.current &&
      !isGeneratingEmails
    ) {
      console.log('✅ All conditions met! Triggering auto-generation...');
      autoGenerateTriggeredRef.current = true;
      setShouldAutoGenerateEmails(false);

      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        console.log('🚀 Auto-generating emails for new campaign...');
        handleGenerateEmails();
      }, 500);

      return () => clearTimeout(timer);
    }

    // Reset the ref when campaign changes
    if (!shouldAutoGenerateEmails) {
      autoGenerateTriggeredRef.current = false;
    }
  }, [shouldAutoGenerateEmails, isLoadingRecipients, recipients, isGeneratingEmails, handleGenerateEmails]);

  // Handle send all emails at once
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
        body: JSON.stringify({ batchSize: 100 }) // Send all at once (up to 100)
      });

      const data = await response.json();

      if (data.success) {
        setSendProgress({ sent: data.sent, remaining: data.remaining });
        if (data.sent > 0) {
          notify.success(`Sent ${data.sent} emails successfully!`);
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

  // Handle remove recipient from campaign
  const handleRemoveRecipient = useCallback(async (recipientId: string) => {
    if (!selectedCampaignId) return;

    try {
      await deleteDoc(doc(db, 'campaigns', selectedCampaignId, 'recipients', recipientId));
      notify.success('Recipient removed from campaign');
      setOpenMenuRecipientId(null);
    } catch (error) {
      console.error('Error removing recipient:', error);
      notify.error('Failed to remove recipient');
    }
  }, [selectedCampaignId]);

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

      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');

      // Only check for duplicates if we have email to compare
      // Uses single-field query to avoid needing a composite index
      if (recipient.email) {
        try {
          const q = query(
            applicationsRef,
            where('contactEmail', '==', recipient.email)
          );
          const existingApplications = await getDocs(q);

          // Check if any existing application matches this company
          const isDuplicate = existingApplications.docs.some(doc => {
            const data = doc.data();
            return data.companyName === recipient.company;
          });

          if (isDuplicate) {
            notify.warning('Contact already in board');
            setIsAddingToBoard(false);
            return;
          }
        } catch (duplicateCheckError) {
          // If duplicate check fails, proceed with adding (better UX than failing)
          console.warn('Duplicate check failed, proceeding:', duplicateCheckError);
        }
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

      // Create application/contact entry - Firebase doesn't accept undefined values
      const contactApplication: Record<string, any> = {
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
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        boardId: boardId || null,
        boardType: 'campaigns' as const,
      };

      // Only add gmailThreadId if it exists (Firebase doesn't accept undefined)
      if (recipient.gmailThreadId) {
        contactApplication.gmailThreadId = recipient.gmailThreadId;
      }

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

    // If no campaigns board exists, show prompt to create one
    if (boards.length === 0) {
      setShowCreateBoardPrompt(true);
      return;
    }

    setSelectedRecipientForBoard(recipient);

    // If user has multiple campaign boards, show selection modal
    if (boards.length > 1) {
      setShowBoardSelector(true);
      return;
    }

    // If user has exactly one board, add directly
    const targetBoardId = boards[0].id;
    addContactToBoard(recipient, targetBoardId);
  };

  // Handle board selection from modal
  const handleBoardSelected = async (boardId: string) => {
    if (selectedRecipientForBoard) {
      await addContactToBoard(selectedRecipientForBoard, boardId);
    } else if (swipeActionRecipient) {
      // Handle swipe action add
      await addContactToBoard(swipeActionRecipient, boardId);
      setSwipeActionRecipient(null);
      setIsAddToBoardSheetOpen(false);
    }
  };



  // Handle swipe delete
  const handleSwipeDelete = useCallback((recipient: CampaignRecipient) => {
    setDeleteConfirmRecipient(recipient);
    setShowDeleteConfirm(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecipient) return;

    setIsDeletingRecipient(true);
    try {
      await handleRemoveRecipient(deleteConfirmRecipient.id);
      setShowDeleteConfirm(false);
      setDeleteConfirmRecipient(null);
    } catch (error) {
      console.error('Error deleting recipient:', error);
    } finally {
      setIsDeletingRecipient(false);
    }
  };

  // Handle swipe add
  const handleSwipeAdd = useCallback((recipient: CampaignRecipient) => {
    // If no campaigns board exists, show prompt to create one
    if (boards.length === 0) {
      setShowCreateBoardPrompt(true);
      return;
    }
    setSwipeActionRecipient(recipient);
    setIsAddToBoardSheetOpen(true);
  }, [boards.length]);

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

  // Calculate stats
  const stats = useMemo(() => {
    if (!selectedCampaign) return { contacts: 0, generated: 0, sent: 0, opened: 0, replied: 0 };
    return {
      contacts: recipients.length,
      generated: recipients.filter(r => r.emailGenerated).length,
      sent: recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length,
      opened: recipients.filter(r => r.status === 'opened' || r.status === 'replied').length,
      replied: recipients.filter(r => r.status === 'replied').length
    };
  }, [selectedCampaign, recipients]);

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
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth">
        {/* Mobile Top Bar */}
        {/* Mobile Top Bar */}
        <MobileTopBar
          title={selectedCampaign?.name || "Campaigns"}
          subtitle={selectedCampaign ? `${recipients.length} contacts` : `${campaigns.length} campaigns`}
          onTitleClick={() => setIsCampaignSelectorOpen(true)}
          showChevron={true}
          rightAction={{
            icon: Plus,
            onClick: () => handleNewCampaignClick(),
            ariaLabel: 'New campaign'
          }}
        />

        <CampaignSelectorSheet
          isOpen={isCampaignSelectorOpen}
          onClose={() => setIsCampaignSelectorOpen(false)}
          campaigns={campaigns}
          activeCampaignId={selectedCampaignId}
          onSelect={(id) => setSelectedCampaignId(id)}
          onNewCampaign={() => handleNewCampaignClick()}
        />

        <AddToBoardSheet
          isOpen={isAddToBoardSheetOpen}
          onClose={() => {
            setIsAddToBoardSheetOpen(false);
            setSwipeActionRecipient(null);
          }}
          boards={boards}
          onSelectBoard={handleBoardSelected}
          onCreateBoard={() => {
            navigate('/job-board?createBoard=true&type=campaigns');
          }}
        />

        <MobileDeleteConfirm
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmRecipient(null);
            // Reset swipe position when modal is closed without deleting
            setSwipeResetKey(prev => prev + 1);
          }}
          onConfirm={handleConfirmDelete}
          application={deleteConfirmRecipient ? {
            id: deleteConfirmRecipient.id,
            companyName: deleteConfirmRecipient.company || 'Unknown Company',
            position: deleteConfirmRecipient.fullName || 'Unknown Contact',
            // Mock other required fields for the component
            status: 'applied',
            appliedDate: '',
            updatedAt: '',
            userId: ''
          } as any : null}
          isDeleting={isDeletingRecipient}
        />

        {/* Cover Photo Section with all header elements (Desktop only) */}
        <div
          className="relative group/cover flex-shrink-0 hidden md:block"
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
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-[#242325]/50 dark:via-[#2b2a2c]/30 dark:to-purple-900/20 pointer-events-none">
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

            {/* Mobile Header Overlay Controls - Absolute Bottom of Cover */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
              <div className="flex items-center gap-3">
                {/* Campaign Switcher */}
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsCampaignDropdownOpen(!isCampaignDropdownOpen); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-xl active:scale-[0.98] transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/20 ring-1 ring-white/10">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-white/60 font-medium">Campaign</span>
                        <span className="text-[13px] font-bold text-white truncate max-w-[140px] leading-tight">
                          {selectedCampaign?.name || 'Select Campaign'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isCampaignDropdownOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={(e) => { e.stopPropagation(); setIsCampaignDropdownOpen(false); }}
                          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
                        >
                          {campaigns.map((campaign, index) => (
                            <button
                              key={campaign.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampaignId(campaign.id);
                                setIsCampaignDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-3 border-b border-white/5 last:border-0 text-left transition-colors ${selectedCampaign?.id === campaign.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className={`text-sm font-semibold truncate ${selectedCampaign?.id === campaign.id ? 'text-violet-400' : 'text-gray-200'}`}>
                                  {campaign.name || `Campaign ${index + 1}`}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                                  {campaign.stats?.contactsFound || 0} contacts • {campaign.emailGenerationMode || 'Auto'}
                                </div>
                              </div>
                              {selectedCampaign?.id === campaign.id && <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                            </button>
                          ))}
                          <div className="p-2 bg-white/5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCampaignDropdownOpen(false);
                                handleNewCampaignClick();
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-violet-300 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg transition-colors border border-violet-500/20"
                            >
                              <Plus className="w-4 h-4" />
                              Create New Campaign
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* New Campaign Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleNewCampaignClick(); }}
                  className="flex-shrink-0 flex items-center justify-center w-[52px] h-[52px] bg-[#b7e219] rounded-xl shadow-lg border border-[#9fc015] active:bg-[#a5cb17] ring-1 ring-white/10"
                >
                  <Plus className="w-6 h-6 text-gray-900" />
                </motion.button>
              </div>
            </div>

            {/* Header Content - Hidden on Mobile */}
            <div className="hidden md:flex relative z-10 flex-col w-full">
              {/* Top Row: Zone A & Zone B */}
              <div className="flex items-center justify-between px-6 py-6">
                {/* Zone A: Identity */}
                <div className="flex items-center gap-4 min-w-0">
                  <h1 className={`text-xl font-semibold tracking-tight ${coverPhoto ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>
                    Campaigns
                  </h1>

                  <span className={`text-lg font-light ${coverPhoto ? 'text-white/40' : 'text-gray-300 dark:text-gray-700'}`}>/</span>

                  {/* Campaign Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                      className={`group flex items-center gap-2 px-2 py-1.5 -ml-2 rounded-lg transition-colors
                        ${coverPhoto
                          ? 'hover:bg-white/10 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white'
                        }`}
                    >
                      <span className="font-medium truncate max-w-[200px]">
                        {selectedCampaign?.name || 'Select Campaign'}
                      </span>
                      <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isCampaignDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <div className="max-h-[300px] overflow-y-auto py-1">
                            {campaigns.map((campaign) => (
                              <button
                                key={campaign.id}
                                onClick={() => {
                                  setSelectedCampaignId(campaign.id);
                                  setIsCampaignDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors
                                  ${selectedCampaignId === campaign.id ? 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                              >
                                <span className="truncate">{campaign.name}</span>
                                {selectedCampaignId === campaign.id && <Check className="w-4 h-4 text-gray-900 dark:text-white" />}
                              </button>
                            ))}
                          </div>
                          <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                            <button
                              onClick={() => {
                                setIsCampaignDropdownOpen(false);
                                handleNewCampaignClick();
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create New Campaign
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Optional Subtitle/Badge */}
                  {selectedCampaign?.emailGenerationMode && (
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded-full border
                      ${coverPhoto
                        ? 'bg-white/10 border-white/20 text-white/80'
                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {selectedCampaign.emailGenerationMode === 'abtest' ? 'A/B Test' :
                        selectedCampaign.emailGenerationMode === 'template' ? 'Template' : 'Auto'}
                    </span>
                  )}
                </div>

                {/* Zone B: Primary Action */}
                <div className="flex items-center gap-3">
                  {/* Info Icon for Credits */}
                  {!planLoading && (
                    <div className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 cursor-help transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                      <Info className={`w-5 h-5 ${coverPhoto ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`} />
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Campaign Credits</div>
                        {(() => {
                          const stats = getUsageStats('campaignsCreated');
                          if (!stats) return null;
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-900 dark:text-white">{stats.used} / {stats.limit}</span>
                                <span className="text-gray-500">{Math.round(stats.percentage)}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-900 dark:bg-white rounded-full" style={{ width: `${Math.min(100, stats.percentage)}%` }} />
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                200 credits per campaign
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleNewCampaignClick()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#b7e219] hover:bg-[#a5cb17] text-black text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>New Campaign</span>
                  </button>
                </div>
              </div>

              {/* Zone C: Metrics */}
              {selectedCampaign && (
                <div className="px-6 pb-6">
                  <div className={`inline-flex items-center px-6 py-2.5 rounded-full backdrop-blur-md shadow-sm border
                    ${coverPhoto
                      ? 'border-white/10 bg-black/40'
                      : 'border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-6 text-sm">
                      {/* Contacts */}
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${coverPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {stats.contacts}
                        </span>
                        <span className={`${coverPhoto ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>Contacts</span>
                      </div>

                      <span className={`text-[10px] ${coverPhoto ? 'text-white/20' : 'text-gray-300 dark:text-gray-700'}`}>•</span>

                      {/* Generated */}
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${coverPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {stats.generated}
                        </span>
                        <span className={`${coverPhoto ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>Generated</span>
                      </div>

                      <span className={`text-[10px] ${coverPhoto ? 'text-white/20' : 'text-gray-300 dark:text-gray-700'}`}>•</span>

                      {/* Sent */}
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${coverPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {stats.sent}
                        </span>
                        <span className={`${coverPhoto ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>Sent</span>
                      </div>

                      <span className={`text-[10px] ${coverPhoto ? 'text-white/20' : 'text-gray-300 dark:text-gray-700'}`}>•</span>

                      {/* Opened (Blue if > 0) */}
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${stats.opened > 0
                          ? 'text-blue-500 dark:text-blue-400'
                          : (coverPhoto ? 'text-white' : 'text-gray-900 dark:text-white')
                          }`}>
                          {stats.opened}
                        </span>
                        <span className={`${stats.opened > 0
                          ? 'text-blue-500/80 dark:text-blue-400/80'
                          : (coverPhoto ? 'text-white/60' : 'text-gray-500 dark:text-gray-400')
                          }`}>Opened</span>
                      </div>

                      <span className={`text-[10px] ${coverPhoto ? 'text-white/20' : 'text-gray-300 dark:text-gray-700'}`}>•</span>

                      {/* Replied (Green if > 0) */}
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${stats.replied > 0
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : (coverPhoto ? 'text-white' : 'text-gray-900 dark:text-white')
                          }`}>
                          {stats.replied}
                        </span>
                        <span className={`${stats.replied > 0
                          ? 'text-emerald-500/80 dark:text-emerald-400/80'
                          : (coverPhoto ? 'text-white/60' : 'text-gray-500 dark:text-gray-400')
                          }`}>Replied</span>
                      </div>
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
        <div className="flex-1 flex flex-col min-w-0 overflow-visible bg-white dark:bg-[#1a1a1a] px-0 pt-0 pb-6">
          {/* Mobile Header Controls (Campaign Switcher & New Campaign) - REMOVED/HIDDEN */}
          <div className="hidden">
            {/* Campaign Selector */}
            <div className="relative flex-1 min-w-0 z-30">
              <button
                onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-xl shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Campaign</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate w-full text-left">
                    {selectedCampaign?.name || 'Select Campaign'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCampaignDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsCampaignDropdownOpen(false)}
                      className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#1e1e20] rounded-xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] z-40 overflow-hidden max-h-[60vh] overflow-y-auto"
                    >
                      {campaigns.map((campaign, index) => (
                        <div
                          key={campaign.id}
                          className={`flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#3d3c3e] last:border-0 ${selectedCampaign?.id === campaign.id ? 'bg-violet-50 dark:bg-violet-500/10' : ''
                            }`}
                          onClick={() => {
                            setSelectedCampaignId(campaign.id);
                            setIsCampaignDropdownOpen(false);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${selectedCampaign?.id === campaign.id ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'
                              }`}>
                              {campaign.name || `Campaign ${index + 1}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-500">
                                {campaign.stats?.contactsFound || 0} contacts
                              </span>
                              {campaign.emailGenerationMode && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  {campaign.emailGenerationMode}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedCampaign?.id === campaign.id && (
                            <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          )}
                        </div>
                      ))}
                      <div className="p-2 bg-gray-50 dark:bg-[#252525]">
                        <button
                          onClick={() => {
                            setIsCampaignDropdownOpen(false);
                            handleNewCampaignClick();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create New Campaign
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* New Campaign Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNewCampaignClick()}
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 bg-[#b7e219] rounded-xl shadow-sm text-gray-900 border border-[#9fc015]"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Mobile Stats & Actions Bar - Premium Minimal Design */}
          <div className="md:hidden">
            {/* Unified Stats Container */}
            <div className="mx-4 mt-3 p-3 bg-[#1a1a1c] dark:bg-[#1a1a1c] rounded-2xl border border-white/[0.06]">
              {/* Stats Row */}
              <div className="flex items-center justify-between">
                {/* Stats Group */}
                <div className="flex items-center gap-1">
                  {/* Generated */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-white tabular-nums">{stats.generated}</span>
                  </div>
                  {/* Sent */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10">
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-white tabular-nums">{stats.sent}</span>
                  </div>
                  {/* Opened */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-white tabular-nums">{stats.opened}</span>
                  </div>
                  {/* Replied */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10">
                    <Reply className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white tabular-nums">{stats.replied}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGenerateEmails(); }}
                    disabled={isGeneratingEmails || recipients.filter(r => !r.emailGenerated).length === 0}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
                      ${recipients.filter(r => !r.emailGenerated).length > 0
                        ? 'text-purple-400 bg-purple-500/15 active:scale-95'
                        : 'text-gray-600 bg-white/[0.03] cursor-not-allowed opacity-40'
                      }`}
                  >
                    {isGeneratingEmails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSendEmails(); }}
                    disabled={isSendingEmails || recipients.filter(r => r.status === 'email_generated').length === 0}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
                      ${recipients.filter(r => r.status === 'email_generated').length > 0
                        ? 'text-emerald-400 bg-emerald-500/15 active:scale-95'
                        : 'text-gray-600 bg-white/[0.03] cursor-not-allowed opacity-40'
                      }`}
                  >
                    {isSendingEmails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
              </div>
              <button
                onClick={() => setIsFilterSheetOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-xl text-gray-400 active:bg-white/[0.08] transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Search + Targeting Tags + Dev Buttons - Desktop Only */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden md:block mb-4 px-6 mt-6"
          >
            {/* Search + Targeting Tags + Dev Buttons */}
            {selectedCampaign && (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1e1e20] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-sm">
                {/* Search Bar */}
                {recipients.length > 0 && (
                  <div className="relative w-64 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-1.5 text-xs bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
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
                          ? `${emailProgress ? `${emailProgress.initialPending - recipients.filter(r => !r.emailGenerated).length}/${emailProgress.initialPending}` : '...'}`
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
              className="flex-1 min-h-0 mx-0 md:mx-6 md:border md:border-gray-200/60 md:dark:border-white/[0.06] md:rounded-2xl overflow-hidden flex flex-col 
              bg-transparent md:bg-white md:dark:bg-[#2b2a2c] md:shadow-lg md:dark:shadow-2xl md:dark:shadow-black/40 backdrop-blur-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
            >
              {/* Mobile Contact List */}
              <div className="md:hidden flex-1 overflow-y-auto px-4 pb-24 safe-bottom divide-y divide-gray-100 dark:divide-white/[0.05]">
                {/* Empty State Mobile */}
                {sortedRecipients.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">No contacts found</div>
                )}
                {sortedRecipients.map((recipient) => (
                  <SwipeableRow
                    key={recipient.id}
                    onSwipeLeft={() => handleSwipeDelete(recipient)}
                    onSwipeRight={() => handleSwipeAdd(recipient)}
                    leftLabel="Remove"
                    rightLabel="Add to board"
                    leftActionColor="bg-red-500"
                    rightActionColor="bg-violet-500"
                    resetKey={swipeResetKey}
                  >
                    <div onClick={() => {
                      if (recipient.emailGenerated) setEmailPreviewRecipient(recipient);
                    }} className="py-4 bg-transparent active:opacity-70 transition-opacity px-4">
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <ProfileAvatar config={generateGenderedAvatarConfig(recipient.firstName, recipient.id)} size={40} className="rounded-full shadow-sm" />
                          {recipient.status === 'replied' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">{recipient.fullName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${getStatusStyles(recipient.status)}`}>
                              {getStatusLabel(recipient.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1">{recipient.title} {recipient.company && `@ ${recipient.company}`}</p>

                          <div className="flex items-center justify-end gap-2 mt-2">
                            {recipient.linkedinUrl && (
                              <a href={recipient.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {recipient.email && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEmail(recipient.email!);
                              }} className="p-1.5 text-gray-500 bg-gray-100 dark:bg-white/[0.05] rounded-lg">
                                {copiedEmail === recipient.email ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                ))}
              </div>

              <div className="hidden md:block flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-300/50 dark:scrollbar-thumb-white/[0.12] 
              scrollbar-track-transparent hover:scrollbar-thumb-gray-400/70 dark:hover:scrollbar-thumb-white/[0.18] transition-colors">
                <table ref={tableRef} className="w-full border-collapse table-fixed">
                  {/* Premium Header with Glassmorphism */}
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-gray-200/80 dark:border-white/[0.05] bg-gradient-to-b from-white via-white to-gray-50/50 
                    dark:from-[#2b2a2c] dark:via-[#2b2a2c] dark:to-[#2a2829] backdrop-blur-md">
                      {/* Contact Header */}
                      <th
                        style={{ width: `${columnWidths.contact}%` }}
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200 first:rounded-tl-2xl"
                        onClick={() => handleSort('contact')}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</span>
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
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200"
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
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200"
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
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200"
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
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200"
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
                        className="relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
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
                        className="group relative px-6 py-4 text-left bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02] 
                        transition-colors duration-200"
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
                        className="px-6 py-4 text-center bg-gray-50/50 dark:bg-[#1a1a1a]
                        border-b border-gray-100 dark:border-white/[0.05]
                        transition-colors duration-200 last:rounded-tr-2xl"
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
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-32" />
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                              <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-20" />
                            </div>
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-28" />
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-36" />
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                          </td>
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="h-6 bg-gray-100 dark:bg-white/[0.06] rounded-full w-16" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
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
                          bg-white dark:bg-[#1a1a1a]
                          hover:bg-gray-50 dark:hover:bg-white/[0.02] 
                          border-b border-gray-100 dark:border-white/[0.03]
                          ${getStatusBorderColor(recipient.status)}`}
                        >
                          {/* Contact Cell with Avatar */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="flex items-center gap-4">
                              {/* Premium Gendered Avatar */}
                              <div className="relative flex-shrink-0">
                                <ProfileAvatar
                                  config={generateGenderedAvatarConfig(recipient.firstName, recipient.id)}
                                  size={40}
                                  className="rounded-full shadow-sm ring-2 ring-white dark:ring-[#1a1a1a]"
                                />
                                {recipient.status === 'replied' && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <span className="text-[14px] font-semibold text-gray-900 dark:text-white truncate 
                              group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors cursor-default">
                                {recipient.fullName}
                              </span>
                            </div>
                          </td>

                          {/* Title Cell */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 truncate block">
                              {recipient.title || <span className="text-gray-300 dark:text-gray-600/60">—</span>}
                            </span>
                          </td>

                          {/* Company Cell with Logo */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                              {recipient.company && (
                                recipient.isDemo && recipient.companyInitialsLogo ? (
                                  <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: recipient.companyInitialsLogo.color }}
                                  >
                                    <span className="text-xs font-semibold text-white drop-shadow-sm">
                                      {recipient.companyInitialsLogo.initials}
                                    </span>
                                  </div>
                                ) : (
                                  <CompanyLogo companyName={recipient.company} size="sm" />
                                )
                              )}
                              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate">
                                {recipient.company || <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}
                              </span>
                            </div>
                          </td>

                          {/* Location Cell */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            {recipient.location ? (
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="text-[13px] text-gray-600 dark:text-gray-400 truncate">
                                  {recipient.location}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[13px] text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>

                          {/* Email Cell with Copy */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            {recipient.email && !recipient.email.includes('not_unlocked') ? (
                              <div className="flex items-center gap-2 group/email">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                                  <span className="text-[13px] text-gray-600 dark:text-gray-300 truncate">
                                    {recipient.email}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCopyEmail(recipient.email!)}
                                  className={`p-1.5 rounded-md transition-all duration-200 opacity-0 group-hover/email:opacity-100
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
                          <td className="px-6 py-4 transition-colors duration-200">
                            {recipient.linkedinUrl ? (
                              <a
                                href={recipient.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                text-[#0A66C2] dark:text-[#71b7fb] 
                                hover:bg-[#0A66C2]/10 dark:hover:bg-[#71b7fb]/10 
                                transition-all duration-200"
                                title="View LinkedIn Profile"
                              >
                                <Linkedin className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>

                          {/* Status Cell with Premium Badge */}
                          <td className="px-6 py-4 transition-colors duration-200">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                            ${recipient.status === 'replied'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20'
                                : recipient.status === 'opened'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-200/50 dark:ring-blue-500/20'
                                  : recipient.status === 'sent'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-500/20'
                                    : recipient.status === 'email_generated' || recipient.status === 'email_ready'
                                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 ring-1 ring-violet-200/50 dark:ring-violet-500/20'
                                      : 'bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-white/[0.05]'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${recipient.status === 'replied' ? 'bg-emerald-500 animate-pulse' :
                                recipient.status === 'opened' ? 'bg-blue-500' :
                                  recipient.status === 'sent' ? 'bg-amber-500 animate-pulse' :
                                    recipient.status === 'email_generated' || recipient.status === 'email_ready' ? 'bg-violet-500' :
                                      'bg-gray-400 dark:bg-[#4a494b]'
                                }`} />
                              {getStatusLabel(recipient.status)}
                            </span>
                          </td>

                          {/* Actions Cell */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEmailPreviewRecipient(recipient)}
                                disabled={!recipient.emailGenerated}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${recipient.emailGenerated
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
                                className={`p-1.5 rounded-lg transition-all duration-200 ${recipient.status === 'replied'
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
                                    <div className="h-px bg-gray-100 dark:bg-white/[0.06] my-1" />
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmRecipient(recipient);
                                        setShowDeleteConfirm(true);
                                        setOpenMenuRecipientId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 
                                      hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/15
                                      transition-all duration-150"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Remove</span>
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

              {/* Pagination/Footer - Hidden on Mobile */}
              {sortedRecipients.length > 0 && (
                <div className="hidden md:flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.05] bg-white dark:bg-[#1a1a1a]">
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

          {/* Empty State - Only show when NO campaigns AND NO recipients exist */}
          {campaigns.length === 0 && recipients.length === 0 && !isLoadingRecipients && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
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
                onClick={() => handleNewCampaignClick()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            </div>
          )}

          {/* Contact Search Loading Overlay - Minimalist */}
          <AnimatePresence>
            {isSearchingApollo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/95"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  {/* Simple elegant spinner */}
                  <div className="relative w-10 h-10 mb-5">
                    <div className="absolute inset-0 rounded-full border-2 border-white/[0.08]" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/60 animate-spin" />
                  </div>

                  <span className="text-[15px] font-medium text-white/90 mb-1">
                    Finding prospects
                  </span>
                  <span className="text-[13px] text-white/40">
                    This may take a moment...
                  </span>
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
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/[0.05]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Minimalist Header */}
              <div className="px-8 pt-8 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <ProfileAvatar
                      config={generateGenderedAvatarConfig(emailPreviewRecipient.firstName, emailPreviewRecipient.id)}
                      size={56}
                      className="rounded-full shadow-md ring-4 ring-white dark:ring-[#1a1a1a]"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-[#1a1a1a] flex items-center justify-center ${emailPreviewRecipient.status === 'replied' ? 'bg-emerald-500' :
                      emailPreviewRecipient.status === 'opened' ? 'bg-blue-500' :
                        emailPreviewRecipient.status === 'sent' ? 'bg-amber-500' :
                          'bg-purple-500'
                      }`}>
                      {emailPreviewRecipient.status === 'replied' ? <Reply className="w-2.5 h-2.5 text-white" /> :
                        emailPreviewRecipient.status === 'opened' ? <Eye className="w-2.5 h-2.5 text-white" /> :
                          emailPreviewRecipient.status === 'sent' ? <Send className="w-2.5 h-2.5 text-white" /> :
                            <Sparkles className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {emailPreviewRecipient.fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{emailPreviewRecipient.title}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>{emailPreviewRecipient.company}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEmailPreviewRecipient(null)}
                  className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Email Content */}
              <div className="px-8 pb-8 overflow-y-auto max-h-[55vh]">
                {emailPreviewRecipient.emailGenerated ? (
                  <div className="space-y-6">
                    {/* Subject - Clean & Bold */}
                    <div className="pt-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {emailPreviewRecipient.emailSubject || 'No subject'}
                      </h4>
                    </div>

                    {/* Body - Elegant Typography */}
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-normal">
                        {emailPreviewRecipient.emailContent || 'No content'}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Generated Email</span>
                      </div>

                      {emailPreviewRecipient.sentAt && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">•</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Sent {new Date(emailPreviewRecipient.sentAt.toDate?.() || emailPreviewRecipient.sentAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      No email generated yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                      Use the "Generate" button to create a personalized email for this contact.
                    </p>
                  </div>
                )}
              </div>

              {/* Minimalist Footer */}
              <div className="px-8 py-5 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.05] flex justify-end gap-3">
                <button
                  onClick={() => setEmailPreviewRecipient(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                >
                  Close
                </button>

                {emailPreviewRecipient.emailGenerated && emailPreviewRecipient.email && (
                  <a
                    href={`mailto:${emailPreviewRecipient.email}?subject=${encodeURIComponent(emailPreviewRecipient.emailSubject || '')}&body=${encodeURIComponent(emailPreviewRecipient.emailContent || '')}`}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
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

      {/* Create Outreach Board Prompt Modal */}
      <AnimatePresence>
        {showCreateBoardPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateBoardPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 dark:border-white/[0.08]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <button
                    onClick={() => setShowCreateBoardPrompt(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create an Outreach Board</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  To add contacts to a board, you need an <strong>Outreach Campaigns</strong> board. This is a dedicated space to track your conversations and follow-ups.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateBoardPrompt(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateBoardPrompt(false);
                      navigate('/applications?createBoard=campaigns');
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Board
                  </button>
                </div>
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
          setPendingCampaignCreation(false);
        }}
        onConfirm={() => {
          setShowCreditModal(false);
          if (pendingCampaignCreation) {
            handleNewCampaignClick(true);
            setPendingCampaignCreation(false);
          }
        }}
        featureName="Campaign"
        creditCost={CREDIT_COSTS.campaignPer100}
        userCredits={userCredits}
      />

      {/* Filter Bottom Sheet (Mobile) */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={() => setIsFilterSheetOpen(false)}
        onReset={() => {
          setSortColumn(null);
          setSortDirection('asc');
          setIsFilterSheetOpen(false);
        }}
        hasActiveFilters={sortColumn !== null}
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sort By</h4>
            <div className="space-y-2">
              {[
                { id: 'contact', label: 'Name' },
                { id: 'email', label: 'Email' },
                { id: 'status', label: 'Status' },
                { id: 'company', label: 'Company' },
                { id: 'title', label: 'Job Title' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (sortColumn === option.id) {
                      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortColumn(option.id);
                      setSortDirection('asc');
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${sortColumn === option.id
                    ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300'
                    : 'bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {sortColumn === option.id && (
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
                      {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterBottomSheet>

      {/* Onboarding Spotlight */}
      <OnboardingSpotlight
        pageKey="campaigns"
        icon={<Mail className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
        title="Reach companies directly"
        description="Create personalized cold outreach campaigns to target companies. AI generates tailored emails for each prospect to help you land spontaneous opportunities."
        position="center"
      />
    </AuthLayout>
  );
}


