import { useState, useEffect, useRef, useCallback } from 'react';
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
  Filter
} from 'lucide-react';
import { toast } from '@/contexts/ToastContext';
import { getDoc, doc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import NewCampaignModal from '../components/campaigns/NewCampaignModal';
import { searchApolloContacts, type ApolloTargeting } from '../lib/apolloService';
import { CompanyLogo } from '../components/common/CompanyLogo';

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
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
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

  // Column resize state (percentages)
  const [columnWidths, setColumnWidths] = useState({
    contact: 14,
    title: 16,
    company: 14,
    location: 14,
    email: 18,
    linkedin: 9,
    status: 8,
    actions: 7
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
      toast.error('Failed to load campaigns');
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
      
      toast.success('Cover updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      toast.error('Failed to update cover');
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
      toast.success('Cover removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Search Apollo for contacts
  const handleSearchApollo = useCallback(async (campaignId: string, targeting: ApolloTargeting) => {
    setIsSearchingApollo(true);
    try {
      toast.info('Searching Apollo for contacts...');
      
      const result = await searchApolloContacts(campaignId, targeting, 100);
      
      if (result.success) {
        toast.success(`Found ${result.contactsFound} contacts! (${result.totalAvailable} available)`);
        setSelectedCampaignId(campaignId);
      } else {
        toast.error('No contacts found. Try adjusting your targeting.');
      }
    } catch (error: any) {
      console.error('Apollo search error:', error);
      toast.error(error.message || 'Failed to search Apollo');
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
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
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
      toast.success('Campaign renamed');
    } catch (error) {
      console.error('Error updating campaign name:', error);
      toast.error('Failed to rename campaign');
    }
  }, []);

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

  // Stats for selected campaign
  const stats = selectedCampaign?.stats || {
    contactsFound: recipients.length,
    emailsSent: recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length,
    replied: recipients.filter(r => r.status === 'replied').length
  };

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
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-gray-700/20">
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
                          bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800
                          border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200
                          hover:shadow-md group"
                      >
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        <span>Add cover</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Change cover
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                        
                        <button
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUpdatingCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                          {isUpdatingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                        
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
            <div className="relative z-10 px-4 sm:px-6 pt-6 pb-3 flex flex-col gap-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
              >
                <div>
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
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200
                    ${coverPhoto 
                      ? (isCoverDark 
                        ? 'text-white bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30'
                        : 'text-gray-900 dark:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800')
                      : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>New Campaign</span>
                </motion.button>
              </motion.div>
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
        <div className="px-0 pt-6 pb-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Campaign Selector & Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center justify-between gap-6 mb-5 px-6"
          >
            {/* Campaign Dropdown */}
            {campaigns.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-lg 
                    hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-200"
                >
                  <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100 truncate max-w-[220px]">
                    {selectedCampaign 
                      ? (selectedCampaign.name || `Campaign ${campaigns.indexOf(selectedCampaign) + 1}`)
                      : 'Select Campaign'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
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
            )}

            {/* Stats - Premium minimal style */}
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{stats.contactsFound}</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">contacts</span>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/[0.06]" />
              <div className="flex flex-col items-end">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{stats.emailsSent}</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">sent</span>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/[0.06]" />
              <div className="flex flex-col items-end">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{stats.replied}</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">replied</span>
              </div>
            </div>
          </motion.div>

          {/* Search & Targeting Row */}
          {selectedCampaign && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-5 px-6"
            >
              {/* Search Bar */}
              {recipients.length > 0 && (
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 text-[13px] bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] 
                      rounded-lg focus:outline-none focus:border-gray-300 dark:focus:border-white/[0.15] focus:bg-white dark:focus:bg-white/[0.05]
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
              
              {/* Separator */}
              {recipients.length > 0 && (
                <div className="w-px h-6 bg-gray-200 dark:bg-white/[0.06]" />
              )}
              
              {/* Premium Tags */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
                {selectedCampaign.targeting?.personTitles?.map(title => (
                  <span 
                    key={title} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                      text-gray-600 dark:text-gray-300 text-[12px] rounded-md whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <Search className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    {title}
                  </span>
                ))}
                {selectedCampaign.targeting?.personLocations?.map(loc => (
                  <span 
                    key={loc} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                      text-gray-600 dark:text-gray-300 text-[12px] rounded-md whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    {loc}
                  </span>
                ))}
                {selectedCampaign.targeting?.industries?.map(ind => (
                  <span 
                    key={ind} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                      text-gray-600 dark:text-gray-300 text-[12px] rounded-md whitespace-nowrap hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <Building2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    {ind}
                  </span>
                ))}
              </div>
              
              {/* Search results count */}
              {searchQuery && (
                <span className="text-[12px] text-gray-500 whitespace-nowrap">
                  {filteredRecipients.length}/{recipients.length}
                </span>
              )}
            </motion.div>
          )}

          {/* Premium Spreadsheet Table - Notion/Google Sheets Style */}
          {(campaigns.length > 0 || recipients.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex-1 min-h-0 bg-white dark:bg-white/[0.02] mx-6 border border-gray-200 dark:border-white/[0.06] rounded-lg overflow-hidden flex flex-col backdrop-blur-sm"
          >
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table ref={tableRef} className="w-full border-collapse table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                    <th style={{ width: `${columnWidths.contact}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Contact
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'contact')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.title}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Title
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'title')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.company}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Company
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'company')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.location}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Location
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'location')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.email}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Email
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'email')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.linkedin}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      LinkedIn
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'linkedin')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.status}%` }} className="relative px-3 py-2.5 text-left text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/[0.04]">
                      Status
                      <div 
                        onMouseDown={(e) => handleResizeStart(e, 'status')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors"
                      />
                    </th>
                    <th style={{ width: `${columnWidths.actions}%` }} className="px-3 py-2.5 text-center text-[13px] font-medium text-gray-500 dark:text-gray-500 bg-[#fafafa] dark:bg-white/[0.03]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRecipients ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">Loading contacts...</p>
                        </div>
                      </td>
                    </tr>
                  ) : recipients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            {selectedCampaign ? 'No contacts found. Try adjusting your targeting.' : 'Select or create a campaign to see contacts.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            No contacts match "{searchQuery}"
                          </p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Clear search
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((recipient, index) => (
                    <motion.tr 
                        key={recipient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.01 * Math.min(index, 15) }}
                        className="group hover:bg-[#f7f7f5] dark:hover:bg-white/[0.02] transition-colors duration-100
                          border-b border-gray-100 dark:border-white/[0.04]"
                      >
                        {/* Name */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          <span className="text-[13px] text-gray-900 dark:text-gray-200 truncate block">
                            {recipient.fullName}
                          </span>
                        </td>
                        
                        {/* Title */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          <span className="text-[13px] text-gray-600 dark:text-gray-400 truncate block">
                            {recipient.title || '—'}
                          </span>
                        </td>
                        
                        {/* Company */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          <div className="flex items-center gap-2">
                            {recipient.company && (
                              <CompanyLogo companyName={recipient.company} size="sm" />
                            )}
                            <span className="text-[13px] text-gray-900 dark:text-gray-200 truncate">
                              {recipient.company || '—'}
                            </span>
                          </div>
                        </td>
                      
                        {/* Location */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="text-[13px] text-gray-600 dark:text-gray-400 truncate">
                              {recipient.location || '—'}
                            </span>
                          </div>
                        </td>
                      
                        {/* Email */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          {recipient.email && !recipient.email.includes('not_unlocked') ? (
                            <a 
                              href={`mailto:${recipient.email}`}
                              className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 dark:text-gray-400 
                                hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="truncate">{recipient.email}</span>
                            </a>
                          ) : (
                            <span className="text-[13px] text-gray-400 dark:text-gray-600">—</span>
                          )}
                        </td>
                      
                        {/* LinkedIn */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
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
                            <span className="text-[13px] text-gray-400 dark:text-gray-600">—</span>
                          )}
                        </td>
                      
                        {/* Status */}
                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-white/[0.04]">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              recipient.status === 'replied' ? 'bg-emerald-500' :
                              recipient.status === 'opened' ? 'bg-blue-500' :
                              recipient.status === 'sent' ? 'bg-amber-500' :
                              'bg-gray-400 dark:bg-gray-600'
                            }`} />
                            <span className={`${
                              recipient.status === 'replied' ? 'text-emerald-700 dark:text-emerald-400' :
                              recipient.status === 'opened' ? 'text-blue-700 dark:text-blue-400' :
                              recipient.status === 'sent' ? 'text-amber-700 dark:text-amber-400' :
                              'text-gray-500 dark:text-gray-500'
                            }`}>
                            {getStatusLabel(recipient.status)}
                            </span>
                        </span>
                      </td>
                      
                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                                hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                              title="View email"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                                hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                                hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                    </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
          )}

          {/* Empty State - Only show when NO campaigns AND NO recipients exist */}
          {campaigns.length === 0 && recipients.length === 0 && !isLoadingRecipients && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center"
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Campaign</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeleteCampaignModal({ show: false })}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex-1 sm:flex-initial"
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
    </AuthLayout>
  );
}

