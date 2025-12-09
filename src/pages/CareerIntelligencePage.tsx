import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Image, Camera, X, Loader2 } from 'lucide-react';
import ProfileTagsCloud from '../components/career-intelligence/ProfileTagsCloud';
import InsightCard from '../components/career-intelligence/InsightCard';
import InsightDetailPanel from '../components/career-intelligence/InsightDetailPanel';
import { generateCareerInsights, CareerInsightsData } from '../services/careerIntelligence';
import { notify } from '@/lib/notify';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';

type InsightType = 'next-move' | 'skills' | 'action-plan' | 'market-position' | 'interview-readiness' | 'network-insights' | 'timeline';

export default function CareerIntelligencePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<CompleteUserData | null>(null);
  const [insights, setInsights] = useState<CareerInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightType | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Track if we've already tried to generate
  const hasTriedGenerating = useRef(false);

  // Load user data and saved insights
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load user data
        const data = await fetchCompleteUserData(currentUser.uid);
        setUserData(data);
        
        // Try to load saved insights from user's pagePreferences
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.careerInsights) {
              setInsights(userData.careerInsights.data as CareerInsightsData);
              setLastUpdated(userData.careerInsights.updatedAt?.toDate() || new Date());
              console.log('Loaded saved career insights from user doc');
            }
          }
        } catch (insightsError) {
          console.log('Could not load saved insights:', insightsError);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        notify.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  // Save insights to user document
  const saveInsightsToFirestore = async (insightsData: CareerInsightsData) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        careerInsights: {
          data: insightsData,
          updatedAt: new Date()
        }
      });
      console.log('Career insights saved successfully');
    } catch (error) {
      console.error('Error saving insights:', error);
    }
  };

  // Generate insights
  const handleGenerateInsights = async () => {
    if (!userData) return;
    
    setIsGenerating(true);
    try {
      const result = await generateCareerInsights(userData);
      setInsights(result);
      setLastUpdated(new Date());
      
      // Save to Firestore
      await saveInsightsToFirestore(result);
      
      notify.success('Insights generated and saved');
    } catch (error) {
      console.error('Error generating insights:', error);
      notify.error('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate only if no saved insights exist (and only once)
  useEffect(() => {
    if (userData && !insights && !isGenerating && !isLoading && !hasTriedGenerating.current) {
      hasTriedGenerating.current = true;
      handleGenerateInsights();
    }
  }, [userData, insights, isLoading, isGenerating]);

  const handleOpenInsight = (type: InsightType) => {
    setSelectedInsight(type);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Delay clearing the type so the closing animation can complete
    setTimeout(() => setSelectedInsight(null), 300);
  };

  // Get user headline
  const getUserHeadline = () => {
    if (!userData) return '';
    
    const position = userData.targetPosition || userData.currentPosition || userData.jobTitle;
    const location = userData.city && userData.country 
      ? `${userData.city}, ${userData.country}`
      : userData.location;
    
    if (position && location) {
      return `${position} in ${location}`;
    }
    return position || 'Building your career path';
  };

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

  // Load cover photo preference
  const loadCoverPhotoPreference = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const pagePreferences = userData.pagePreferences || {};
        const careerIntelligencePrefs = pagePreferences.careerIntelligence || {};
        
        if (careerIntelligencePrefs.coverPhoto) {
          setCoverPhoto(careerIntelligencePrefs.coverPhoto);
          const isDark = await detectCoverBrightness(careerIntelligencePrefs.coverPhoto);
          setIsCoverDark(isDark);
        } else {
          setIsCoverDark(null);
        }
      }
    } catch (error) {
      console.error('Error loading cover photo preference:', error);
    }
  };

  // Load cover on mount
  useEffect(() => {
    if (currentUser) {
      loadCoverPhotoPreference();
    }
  }, [currentUser]);

  // Handle cover photo update
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const fileName = `career_intelligence_cover_${timestamp}.jpg`;
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      // Delete old cover if exists
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

      // Save to Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentCareerIntelligencePrefs = currentPagePreferences.careerIntelligence || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          careerIntelligence: {
            ...currentCareerIntelligencePrefs,
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

  // Handle cover photo removal
  const handleRemoveCover = async () => {
    if (!currentUser || !coverPhoto) return;

    setIsUpdatingCover(true);
    try {
      // Delete from storage
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

      // Remove from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentCareerIntelligencePrefs = currentPagePreferences.careerIntelligence || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          careerIntelligence: {
            ...currentCareerIntelligencePrefs,
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

  // Handle cover file selection
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    e.target.value = '';
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

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Loading your career data...
            </p>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Cover Photo Section with all header elements - Full width edge to edge */}
        <div 
          className="relative group/cover flex-shrink-0 w-full"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${coverPhoto ? 'min-h-[180px] sm:min-h-[200px]' : 'min-h-[140px] sm:min-h-[160px]'}`}>
            {/* Cover Background */}
            {coverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  key={coverPhoto}
                  src={coverPhoto} 
                  alt="Career Intelligence cover" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-indigo-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                   style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
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
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
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

            {/* All Header Content - Positioned directly on cover */}
            <div className="relative z-10 px-4 sm:px-6 pt-6 pb-4 flex flex-col gap-3">
              {/* Title and Refresh Button Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
          >
                {/* Title left */}
              <div>
                  <h1 className={`text-2xl font-bold ${coverPhoto 
                    ? 'text-white drop-shadow-2xl'
                    : 'text-gray-900 dark:text-white'
                  }`}>Career Intelligence</h1>
                  <p className={`text-sm mt-0.5 ${coverPhoto 
                    ? 'text-white/90 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {getUserHeadline()}
                </p>
              </div>
              
                {/* Refresh Button right */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200
                    ${coverPhoto 
                      ? (isCoverDark 
                        ? 'text-white bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30'
                        : 'text-gray-900 dark:text-white bg-white/90 dark:bg-[#2b2a2c]/90 backdrop-blur-sm border border-gray-200 dark:border-[#3d3c3e] hover:bg-white dark:hover:bg-[#3d3c3e]')
                      : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : 'Refresh'}</span>
              </motion.button>
              </motion.div>

              {/* Profile Tags - On Cover */}
              {userData?.profileTags && userData.profileTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <ProfileTagsCloud tags={userData.profileTags} maxTags={10} onCover={!!coverPhoto} />
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
        <div className="px-6 lg:px-10 pt-6 pb-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col w-full">
          {/* Generating State */}
          <AnimatePresence>
            {isGenerating && !insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Analyzing your profile
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  We're generating personalized career insights based on your experience and goals.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Insight Cards - 3x3 Grid Layout */}
          {insights && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Row 1 - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Next Move Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
              <InsightCard
                id="next-move"
                title="Your Next Move"
                summary={insights.nextMove?.summary || 'Discover your best career opportunities'}
                metric={insights.nextMove?.opportunityCount ? `${insights.nextMove.opportunityCount} opportunities` : undefined}
                    onClick={() => handleOpenInsight('next-move')}
                isLoading={isGenerating}
                    data={insights.nextMove}
                  />
                </motion.div>

                {/* Skills Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
              <InsightCard
                id="skills"
                title="Skills to Master"
                summary={insights.skills?.summary || 'Key skills to boost your career'}
                metric={insights.skills?.criticalCount ? `${insights.skills.criticalCount} critical skills` : undefined}
                    onClick={() => handleOpenInsight('skills')}
                    isLoading={isGenerating}
                    data={insights.skills}
                  />
                </motion.div>

                {/* Market Position Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <InsightCard
                    id="market-position"
                    title="Market Position"
                    summary={insights.marketPosition?.summary || 'How you compare to other candidates'}
                    metric={insights.marketPosition?.marketFitScore ? `${insights.marketPosition.marketFitScore}% fit` : undefined}
                    onClick={() => handleOpenInsight('market-position')}
                    isLoading={isGenerating}
                    data={insights.marketPosition}
                  />
                </motion.div>
              </div>

              {/* Row 2 - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Interview Readiness Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <InsightCard
                    id="interview-readiness"
                    title="Interview Prep"
                    summary={insights.interviewReadiness?.summary || 'Get ready for your interviews'}
                    metric={insights.interviewReadiness?.readinessScore ? `${insights.interviewReadiness.readinessScore}% ready` : undefined}
                    onClick={() => handleOpenInsight('interview-readiness')}
                    isLoading={isGenerating}
                    data={insights.interviewReadiness}
                  />
                </motion.div>

                {/* Network Insights Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <InsightCard
                    id="network-insights"
                    title="Network Power"
                    summary={insights.networkInsights?.summary || 'Leverage your professional network'}
                    metric={insights.networkInsights?.connectionScore ? `${insights.networkInsights.connectionScore}% potential` : undefined}
                    onClick={() => handleOpenInsight('network-insights')}
                    isLoading={isGenerating}
                    data={insights.networkInsights}
                  />
                </motion.div>

                {/* Timeline Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <InsightCard
                    id="timeline"
                    title="Your Timeline"
                    summary={insights.timeline?.summary || 'Your path to your career goal'}
                    metric={insights.timeline?.estimatedTimeToGoal || undefined}
                    onClick={() => handleOpenInsight('timeline')}
                isLoading={isGenerating}
                    data={insights.timeline}
                  />
                </motion.div>
              </div>

              {/* Row 3 - Action Plan full width */}
              <div className="grid grid-cols-1 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="w-full"
                >
              <InsightCard
                id="action-plan"
                title="Your Action Plan"
                summary={insights.actionPlan?.summary || 'Actionable steps for this week'}
                metric={insights.actionPlan?.actionCount ? `${insights.actionPlan.actionCount} actions` : undefined}
                    onClick={() => handleOpenInsight('action-plan')}
                isLoading={isGenerating}
                    data={insights.actionPlan}
                    className="min-h-[200px]"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!insights && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                Generate personalized career insights based on your profile and experience.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateInsights}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white 
                  bg-indigo-500 hover:bg-indigo-600 rounded-lg
                  transition-colors duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </motion.button>
            </motion.div>
          )}

          {/* Footer */}
          {lastUpdated && insights && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-6 border-t border-gray-100 dark:border-[#3d3c3e]"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Insights saved · Last updated {(() => {
                  const now = new Date();
                  const isToday = lastUpdated.toDateString() === now.toDateString();
                  if (isToday) {
                    return `today at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  }
                  return lastUpdated.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                    ` at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                })()} · 
                <button 
                  onClick={() => navigate('/profile')}
                  className="ml-1 text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Update your profile
                </button>
                {' '}then click Refresh for better results
              </p>
            </motion.footer>
          )}
        </div>
      </div>

      {/* Cover Photo Cropper Modal */}
      <CoverPhotoCropper
        isOpen={isCoverCropperOpen}
        file={selectedCoverFile}
        onClose={() => {
          setIsCoverCropperOpen(false);
          setSelectedCoverFile(null);
        }}
        onCropped={handleCroppedCover}
      />

      {/* Cover Photo Gallery Modal */}
      <CoverPhotoGallery
        isOpen={isCoverGalleryOpen}
        onClose={() => setIsCoverGalleryOpen(false)}
        onDirectApply={handleDirectApplyCover}
        onRemove={handleRemoveCover}
        currentCover={coverPhoto || undefined}
      />

      {/* Insight Detail Panel */}
      <InsightDetailPanel
        type={selectedInsight}
        data={insights}
        open={isPanelOpen}
        onClose={handleClosePanel}
      />
    </AuthLayout>
  );
}


