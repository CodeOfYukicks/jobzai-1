import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  Briefcase, 
  Zap,
  CreditCard,
  Target,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  MailOpen,
  MessageSquare,
  ArrowRight,
  Award,
  Image,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { notify } from '@/lib/notify';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import { useDashboardData, PeriodFilter } from '../hooks/useDashboardData';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import {
  DashboardFilters,
  KPICard,
  JobsPipelineFunnel,
  CampaignsPipelineFunnel,
  ActivityFeed,
  InterviewList,
  DonutChart,
  HorizontalBarChart,
  MetricCard,
  ApplicationsTable,
  CampaignsList,
  RecentReplies,
} from '../components/dashboard';

type TabType = 'overview' | 'applications' | 'campaigns';

const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label,
  count,
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  count?: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-lg
        transition-all duration-200 ${
        active
          ? 'bg-gray-100 dark:bg-[#3d3c3e]/50 text-gray-900 dark:text-gray-100'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40'
      }`}
    >
      <Icon className={`h-4 w-4 stroke-[1.5] ${active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums
          ${active 
            ? 'bg-gray-200 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300' 
            : 'bg-gray-100 dark:bg-[#333234]/50 text-gray-500 dark:text-gray-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');
  const [boardFilter, setBoardFilter] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    stats,
    boards,
    campaigns,
    isLoading,
    isRefreshing,
    lastRefresh,
    refresh,
  } = useDashboardData(periodFilter, boardFilter, campaignFilter);
  
  // Register data with AI Assistant
  const dashboardSummary = useMemo(() => ({
      credits: stats.credits,
    applications: {
      total: stats.totalApplications,
      active: stats.activeApplications,
      interviews: stats.interviewCount,
      offers: stats.offerCount,
      responseRate: stats.responseRate,
      interviewRate: stats.interviewRate,
    },
    campaigns: {
      total: stats.totalCampaigns,
      contacts: stats.totalContacts,
      emailsSent: stats.emailsSent,
      openRate: stats.openRate,
      replyRate: stats.replyRate,
    },
    upcomingInterviews: stats.upcomingInterviews.slice(0, 3).map(i => ({
      company: i.companyName,
      date: i.date,
      type: i.type,
    })),
    filters: {
      period: periodFilter,
      board: boardFilter,
      campaign: campaignFilter,
    },
  }), [stats, periodFilter, boardFilter, campaignFilter]);

  useAssistantPageData('dashboardStats', dashboardSummary, !isLoading);

  // Load page preferences (cover photo) and detect brightness
  useEffect(() => {
    if (!currentUser) return;

    const loadPagePreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const pagePreferences = userData.pagePreferences || {};
          const dashboardPrefs = pagePreferences.dashboard || {};
          if (dashboardPrefs.coverPhoto) {
            setCoverPhoto(dashboardPrefs.coverPhoto);
            const isDark = await detectCoverBrightness(dashboardPrefs.coverPhoto);
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

  // Handle file select for cover
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
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

  // Handle direct cover apply from gallery
  const handleDirectApplyCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
  };

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
            resolve(true);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let totalBrightness = 0;
          let sampleCount = 0;
          
          for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += luminance;
            sampleCount++;
          }
          
          const averageBrightness = totalBrightness / sampleCount;
          resolve(averageBrightness < 0.5);
        } catch (error) {
          console.error('Error detecting cover brightness:', error);
          resolve(true);
        }
      };
      
      img.onerror = () => {
        resolve(true);
      };
      
      img.src = imageUrl;
    });
  };

  // Handle cover photo update
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const fileName = `dashboard_cover_${timestamp}.jpg`;
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      if (coverPhoto) {
        try {
          const urlParts = coverPhoto.split('/o/');
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

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentDashboardPrefs = currentPagePreferences.dashboard || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          dashboard: {
            ...currentDashboardPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);
      
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

  // Handle cover photo removal
  const handleRemoveCover = async () => {
    if (!currentUser || !coverPhoto) return;

    setIsUpdatingCover(true);
    try {
      try {
        const urlParts = coverPhoto.split('/o/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split('?')[0];
          const decodedPath = decodeURIComponent(pathPart);
          const coverRef = ref(storage, decodedPath);
          await deleteObject(coverRef);
        }
      } catch (e) {
        console.warn('Could not delete cover photo from storage', e);
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentDashboardPrefs = currentPagePreferences.dashboard || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          dashboard: {
            ...currentDashboardPrefs,
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

  // Prepare campaign summaries for the list
  const campaignSummaries = useMemo(() => {
    let filteredCampaigns = campaigns;
    if (campaignFilter && campaignFilter !== 'all') {
      filteredCampaigns = campaigns.filter(c => c.id === campaignFilter);
    }
    
    return filteredCampaigns.map(c => ({
      id: c.id,
      name: c.name || `Campaign ${campaigns.indexOf(c) + 1}`,
      contactsFound: c.stats?.contactsFound || 0,
      emailsSent: c.stats?.emailsSent || 0,
      opened: c.stats?.opened || 0,
      replied: c.stats?.replied || 0,
    }));
  }, [campaigns, campaignFilter]);

  // Sparkline data for credits
  const creditsSparkline = useMemo(() => {
    return stats.creditsHistory.map(h => ({ value: h.value }));
  }, [stats.creditsHistory]);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-jobzai-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Cover Photo Section with all header elements */}
        <div 
          className="relative group/cover flex-shrink-0"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${coverPhoto ? 'h-auto min-h-[200px] sm:min-h-[220px]' : 'h-auto min-h-[150px] sm:min-h-[170px]'}`}>
            {/* Cover Background */}
            {coverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  key={coverPhoto}
                  src={coverPhoto} 
                  alt="Dashboard cover" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                   style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                />
                <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
              </div>
            )}

            {/* Cover Controls - Visible on hover - Centered */}
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
                          bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#3d3c3e]
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
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Change cover
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

            {/* Header Content - Positioned on cover */}
            <div className="relative z-10 px-4 sm:px-6 pt-4 pb-4 flex flex-col gap-3">
              {/* Title */}
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
                  }`}>Dashboard</h1>
                  <p className={`text-sm mt-0.5 ${coverPhoto 
                    ? 'text-white/90 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
            Track your job search progress and campaign performance
          </p>
                </div>
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Filters and Tabs Container */}
          <div className="pt-6 pb-4">
        {/* Filters Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
          <DashboardFilters
            periodFilter={periodFilter}
            onPeriodChange={setPeriodFilter}
            boardFilter={boardFilter}
            onBoardChange={setBoardFilter}
            boards={boards}
            campaignFilter={campaignFilter}
            onCampaignChange={setCampaignFilter}
            campaigns={campaigns}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastRefresh={lastRefresh}
          />
            </motion.div>

        {/* Tab Navigation */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="border-b border-border"
            >
          <div className="flex gap-1 -mb-px">
            <TabButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
              icon={LayoutGrid} 
              label="Overview" 
            />
            <TabButton 
              active={activeTab === 'applications'} 
              onClick={() => setActiveTab('applications')} 
              icon={Briefcase} 
              label="Job Applications" 
              count={stats.totalApplications}
            />
            <TabButton 
              active={activeTab === 'campaigns'} 
              onClick={() => setActiveTab('campaigns')} 
              icon={Zap} 
              label="Campaigns"
              count={stats.totalCampaigns}
            />
          </div>
            </motion.div>
        </div>

          {/* Tab Content */}
          <div className="pt-6 pb-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* ================== OVERVIEW TAB ================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Hero KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Credits"
                    value={stats.credits}
                    icon={<CreditCard />}
                    sparklineData={creditsSparkline}
                    sparklineColor="#9ca3af"
                  />
                  <KPICard
                    title="Active Applications"
                    value={stats.activeApplications}
                    trend={stats.applicationsTrend}
                    icon={<Briefcase />}
                  />
                  <KPICard
                    title="Outreach Contacts"
                    value={stats.totalContacts}
                    trend={stats.contactsTrend}
                    icon={<Users />}
                  />
                  <KPICard
                    title="Upcoming Interviews"
                    value={stats.upcomingInterviews.length}
                    subtitle={stats.upcomingInterviews.length > 0 
                      ? `Next: ${stats.upcomingInterviews[0]?.companyName}` 
                      : undefined
                    }
                    icon={<Calendar />}
                  />
                </div>

                {/* Dual Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <JobsPipelineFunnel data={stats.applicationsPipeline} />
                  <CampaignsPipelineFunnel data={stats.campaignsPipeline} />
                          </div>

                {/* Actions & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upcoming Interviews */}
                  <InterviewList 
                    interviews={stats.upcomingInterviews} 
                    maxItems={3}
                  />
                  
                  {/* Quick Actions - Premium minimal style */}
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b]">
                    <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Quick Actions</h3>
                    <div className="space-y-1">
                      <Link
                        to="/applications"
                        className="flex items-center justify-between p-3 -mx-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Track Application</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" />
                      </Link>
                      
                      <Link
                        to="/campaigns-auto"
                        className="flex items-center justify-between p-3 -mx-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">New Campaign</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" />
                      </Link>
                      
                      <Link
                        to="/cv-optimizer"
                        className="flex items-center justify-between p-3 -mx-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Optimize CV</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" />
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <ActivityFeed 
                    activities={stats.recentActivity} 
                    maxItems={5}
                  />
                            </div>
                          </div>
                        )}

            {/* ================== JOB APPLICATIONS TAB ================== */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                {/* Empty State when no applications match filters */}
                {stats.totalApplications === 0 && (
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-10 text-center">
                    <Briefcase className="w-8 h-8 text-gray-300 dark:text-gray-600 stroke-[1.5] mx-auto mb-4" />
                    <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Applications Found
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-md mx-auto leading-relaxed">
                      {boardFilter && boardFilter !== 'all' 
                        ? `No applications found for the selected board in this time period. Try changing the filters.`
                        : `No applications found for this time period. Try selecting "All time".`
                      }
                    </p>
                    {(boardFilter && boardFilter !== 'all') && (
                      <button
                        onClick={() => setBoardFilter(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 rounded-lg text-[13px] font-medium transition-colors"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                )}
                
                {/* KPIs Row */}
                {stats.totalApplications > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <MetricCard
                        label="Total Applications"
                        value={stats.totalApplications}
                        trend={stats.applicationsTrend}
                      />
                      <MetricCard
                        label="Response Rate"
                        value={`${stats.responseRate.toFixed(1)}%`}
                        trend={stats.responseRateTrend}
                      />
                      <MetricCard
                        label="Interview Rate"
                        value={`${stats.interviewRate.toFixed(1)}%`}
                        trend={stats.interviewRateTrend}
                      />
                      <MetricCard
                        label="Offer Rate"
                        value={`${stats.offerRate.toFixed(1)}%`}
                      />
                      <MetricCard
                        label="Avg. Days to Interview"
                        value={stats.avgDaysToInterview}
                        suffix="days"
                      />
                    </div>

                    {/* Pipeline */}
                    <JobsPipelineFunnel data={stats.applicationsPipeline} />

                {/* Interviews & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InterviewList 
                    interviews={stats.upcomingInterviews} 
                    maxItems={5}
                  />
                  
                  <DonutChart
                    title="Location Distribution"
                    data={stats.locationDistribution.map(l => ({
                      name: l.type,
                      value: l.count,
                    }))}
                  />
                      </div>
                      
                {/* Industry & Tech Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HorizontalBarChart
                    title="Top Industries"
                    data={stats.topIndustries.map(i => ({
                      name: i.industry,
                      value: i.count,
                      rate: i.successRate,
                    }))}
                    showRate
                    valueLabel=""
                  />
                  
                  <HorizontalBarChart
                    title="Top Technologies"
                    data={stats.topTechnologies.map(t => ({
                      name: t.tech,
                      value: t.count,
                      rate: t.successRate,
                    }))}
                    showRate
                    valueLabel=""
                    maxItems={8}
                  />
                        </div>
                        
                {/* Company Size Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HorizontalBarChart
                    title="Company Size"
                    data={stats.companySizeDistribution.map(s => ({
                      name: s.size,
                      value: s.count,
                      rate: s.successRate,
                    }))}
                    showRate
                    valueLabel=""
                  />
                  
                  {/* Success Insights - Premium minimal style */}
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b]">
                    <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Success Insights</h3>
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                            {stats.offerCount} Offers
                          </p>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400">
                            {stats.offerRate.toFixed(1)}% success rate
                          </p>
                        </div>
                      </div>
                
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                            {stats.interviewCount} Interviews
                          </p>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400">
                            Avg. {stats.avgDaysToInterview} days from application
                          </p>
                        </div>
                      </div>
                              
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                            {stats.responseRate.toFixed(0)}% Response Rate
                          </p>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400">
                            {stats.totalApplications - stats.applicationsByStatus.applied - stats.applicationsByStatus.wishlist} responses received
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  
                    {/* Recent Applications Table */}
                    <ApplicationsTable 
                      applications={stats.recentApplications}
                      maxItems={10}
                    />
                  </>
                )}
              </div>
            )}
            
            {/* ================== CAMPAIGNS TAB ================== */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                {/* KPIs Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <MetricCard
                    label="Total Contacts"
                    value={stats.totalContacts}
                    trend={stats.contactsTrend}
                  />
                  <MetricCard
                    label="Emails Sent"
                    value={stats.emailsSent}
                  />
                  <MetricCard
                    label="Open Rate"
                    value={`${stats.openRate.toFixed(1)}%`}
                  />
                  <MetricCard
                    label="Reply Rate"
                    value={`${stats.replyRate.toFixed(1)}%`}
                    trend={stats.replyRateTrend}
                  />
                  <MetricCard
                    label="Replies"
                    value={stats.emailsReplied}
                  />
                </div>

                {/* Pipeline */}
                <CampaignsPipelineFunnel data={stats.campaignsPipeline} />

                {/* Campaigns List & Recent Replies */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CampaignsList 
                    campaigns={campaignSummaries}
                    maxItems={5}
                  />
                  
                  <RecentReplies 
                    replies={stats.recentReplies}
                    maxItems={5}
                  />
                    </div>
                    
                {/* Email Performance Stats - Premium minimal style */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] group">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sent</span>
                    </div>
                    <p className="text-[32px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none mb-3">{stats.emailsSent}</p>
                    <div className="h-1 bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-500 group-hover:bg-gray-500 dark:group-hover:bg-gray-400"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] group">
                    <div className="flex items-center gap-2 mb-4">
                      <MailOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Opened</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-[32px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none">{stats.emailsOpened}</p>
                      <span className="text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">{stats.openRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-500 group-hover:bg-gray-500 dark:group-hover:bg-gray-400"
                        style={{ width: `${stats.openRate}%` }}
                      />
                    </div>
                  </div>
                    
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] group">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Replied</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-[32px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none">{stats.emailsReplied}</p>
                      <span className="text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">{stats.replyRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 group-hover:bg-emerald-400"
                        style={{ width: `${stats.replyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Empty State for No Campaigns */}
                {stats.totalCampaigns === 0 && (
                  <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-10 text-center">
                    <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 stroke-[1.5] mx-auto mb-4" />
                    <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Campaigns Yet
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-md mx-auto leading-relaxed">
                      Start your first outreach campaign to reach potential employers and track your email performance.
                    </p>
                    <Link 
                      to="/campaigns-auto"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 rounded-lg text-[13px] font-medium transition-colors"
                    >
                      <Zap className="w-4 h-4 stroke-[1.5]" />
                      Create Campaign
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
          </div>
        </div>

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
      </div>
    </AuthLayout>
  );
}
