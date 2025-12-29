import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Image, Camera, X, Loader2 } from 'lucide-react';
import HeroInsightCard from '../components/career-intelligence/HeroInsightCard';
import ActionPlanCard from '../components/career-intelligence/ActionPlanCard';
import DeepDiveSection from '../components/career-intelligence/DeepDiveSection';
import { generateCareerInsights, CareerInsightsData } from '../services/careerIntelligence';
import { notify } from '../lib/notify';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import MobileTopBar from '../components/mobile/MobileTopBar';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';

export default function CareerIntelligencePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<CompleteUserData | null>(null);
  const [insights, setInsights] = useState<CareerInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
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

        // Try to load saved insights and cover photo from user's pagePreferences
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.careerInsights) {
              setInsights(userData.careerInsights.data as CareerInsightsData);
              setLastUpdated(userData.careerInsights.updatedAt?.toDate() || new Date());
            }
            // Load cover photo
            const savedCover = userData.pagePreferences?.careerIntelligence?.coverPhoto;
            if (savedCover) {
              setCoverPhoto(savedCover);
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

  // Save insights to Firestore
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

  // Cover photo handlers
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
  };

  const handleCroppedCover = async (blob: Blob) => {
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
    await handleUpdateCover(blob);
  };

  const handleDirectApplyCover = async (blob: Blob) => {
    setIsCoverGalleryOpen(false);
    await handleUpdateCover(blob);
  };

  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const fileName = `career-intelligence-cover-${Date.now()}.jpg`;
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
      const currentCareerPrefs = currentPagePreferences.careerIntelligence || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          careerIntelligence: {
            ...currentCareerPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);
      notify.success('Cover updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

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
      const currentCareerPrefs = currentPagePreferences.careerIntelligence || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          careerIntelligence: {
            ...currentCareerPrefs,
            coverPhoto: null
          }
        }
      });

      setCoverPhoto(null);
      notify.success('Cover removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
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

  // Extract data for Hero Insight Card
  const getHeroData = () => {
    if (!insights?.nextMove) return null;

    return {
      headline: insights.nextMove.summary || 'Your career path is being analyzed...',
      leverage: insights.marketPosition?.strengths?.[0]?.description ||
        'Your experience and skills form a solid foundation for your next opportunity.',
      risk: insights.nextMove.alignmentAnalysis?.criticalIssues?.[0] ||
        insights.marketPosition?.weaknesses?.[0]?.description ||
        'Stay focused on your priorities to avoid spreading too thin.',
      opportunity: insights.nextMove.topCompanies?.[0]?.whyMatch ||
        'Targeted applications to companies aligned with your goals can accelerate your progress.',
      estimatedTimeToOutcome: insights.timeline?.estimatedTimeToGoal,
      confidenceScore: insights.timeline?.successProbability
    };
  };

  // Extract data for Action Plan Card
  const getActionPlanData = () => {
    if (!insights?.actionPlan) return null;

    // Map action to specific product feature
    const getCtaLink = (action: any): 'resume-lab' | 'job-board' | 'campaigns' => {
      const title = (action.title || '').toLowerCase();
      const desc = (action.description || '').toLowerCase();
      const combined = title + ' ' + desc;

      if (combined.includes('cv') || combined.includes('resume') || combined.includes('profile')) {
        return 'resume-lab';
      }
      if (combined.includes('campaign') || combined.includes('outreach') || combined.includes('reach out')) {
        return 'campaigns';
      }
      return 'job-board';
    };

    // Get specific CTA label based on product
    const getCtaLabel = (link: 'resume-lab' | 'job-board' | 'campaigns'): string => {
      switch (link) {
        case 'resume-lab': return 'Open Resume Lab';
        case 'campaigns': return 'Launch Campaign';
        case 'job-board': return 'Browse Jobs';
      }
    };

    return {
      introText: 'What will move the needle fastest',
      actions: (insights.actionPlan.weeklyActions || []).slice(0, 3).map(action => {
        const link = getCtaLink(action);
        return {
          id: action.id,
          title: action.title,
          description: action.description,
          timeEstimate: action.timeEstimate || '30 min',
          ctaLabel: getCtaLabel(link),
          ctaLink: link
        };
      })
    };
  };

  // Extract data for Deep Dives - FOCUSED ON PRODUCT FEATURES
  const getDeepDiveItems = () => {
    if (!insights) return [];

    return [
      {
        type: 'network' as const,
        title: 'Launch outreach campaign',
        preview: `Target hiring managers directly`,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cold outreach campaigns can 3x your response rate compared to job board applications alone.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-indigo-500">1.</span>
                <span>Go to <strong>Campaigns</strong> and select your target companies</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-indigo-500">2.</span>
                <span>Use AI to generate personalized outreach emails</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-indigo-500">3.</span>
                <span>Track responses and follow up automatically</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/campaigns-auto')}
              className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Open Campaigns →
            </button>
          </div>
        )
      },
      {
        type: 'interview' as const,
        title: 'Practice with Mock Interview',
        preview: `Readiness: ${insights.interviewReadiness?.readinessScore || '--'}%`,
        content: insights.interviewReadiness ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Practice answering role-specific questions with AI feedback before your real interviews.
            </p>
            {insights.interviewReadiness.topQuestions && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Questions to practice:</span>
                {insights.interviewReadiness.topQuestions.slice(0, 2).map((q, i) => (
                  <div key={i} className="p-2 rounded bg-gray-50 dark:bg-[#2a2a2b] text-sm text-gray-700 dark:text-gray-300">
                    "{q.question}"
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/mock-interview')}
              className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Start Mock Interview →
            </button>
          </div>
        ) : null
      },
      {
        type: 'timeline' as const,
        title: 'See full roadmap',
        preview: `Est. ${insights.timeline?.estimatedTimeToGoal || 'TBD'}`,
        content: insights.timeline ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {insights.timeline.summary}
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2b]">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">30-Day Focus</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{insights.timeline.thirtyDayPlan}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2b]">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">60-Day Goals</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{insights.timeline.sixtyDayPlan}</p>
              </div>
            </div>
          </div>
        ) : null
      }
    ];
  };

  const heroData = getHeroData();
  const actionPlanData = getActionPlanData();
  const deepDiveItems = getDeepDiveItems();

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
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
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-gray-50 dark:bg-[#1a1a1a] relative">
        {/* Subtle Grid Pattern Overlay - Light Mode */}
        <div className="absolute inset-0 pointer-events-none dark:hidden"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        {/* Subtle Grid Pattern Overlay - Dark Mode */}
        <div className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        {/* Mobile Top Bar */}
        <MobileTopBar
          title="Career Intelligence"
          subtitle={getUserHeadline()}
          rightAction={{
            icon: RefreshCw,
            onClick: handleGenerateInsights,
            ariaLabel: 'Refresh Insights'
          }}
        />

        {/* Hidden file input for cover upload */}
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileSelect}
        />

        {/* Cover Photo Section (Desktop only) */}
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
                  alt="Career Intelligence cover"
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-[#242325]/50 dark:via-[#2b2a2c]/30 dark:to-indigo-900/20 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
                <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
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
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
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

            {/* Header Content on Cover */}
            <div className="relative z-20 flex items-start justify-between px-6 lg:px-10 pt-6 pb-16 w-full">
              <div>
                <h1 className={`text-2xl font-bold ${coverPhoto ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>
                  Career Intelligence
                </h1>
                <p className={`text-sm mt-1 ${coverPhoto ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {getUserHeadline()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${coverPhoto
                    ? 'text-white bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30'
                    : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1b] border border-gray-200 dark:border-[#2a2a2b] hover:bg-gray-50 dark:hover:bg-[#222223]'
                  }`}
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Refresh'}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-8 flex flex-col w-full max-w-4xl mx-auto">

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

          {/* Insights Content */}
          {insights && (
            <div className="space-y-4">
              {/* 1. Hero Insight - Strategic Diagnosis */}
              {heroData && (
                <HeroInsightCard
                  headline={heroData.headline}
                  leverage={heroData.leverage}
                  risk={heroData.risk}
                  opportunity={heroData.opportunity}
                  estimatedTimeToOutcome={heroData.estimatedTimeToOutcome}
                  confidenceScore={heroData.confidenceScore}
                  isLoading={isGenerating}
                />
              )}

              {/* 2. Action Plan */}
              {actionPlanData && actionPlanData.actions.length > 0 && (
                <ActionPlanCard
                  introText={actionPlanData.introText}
                  actions={actionPlanData.actions}
                  isLoading={isGenerating}
                />
              )}

              {/* 3. Deep Dives - Optional Exploration */}
              {deepDiveItems.length > 0 && (
                <DeepDiveSection items={deepDiveItems} />
              )}
            </div>
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
              className="mt-12 pt-6 border-t border-gray-200 dark:border-[#2a2a2b]"
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
                })()}
              </p>
            </motion.footer>
          )}
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
          onSelectBlob={(blob: Blob) => {
            setSelectedCoverFile(blob);
            setIsCoverGalleryOpen(false);
            setIsCoverCropperOpen(true);
          }}
          onDirectApply={handleDirectApplyCover}
          onRemove={coverPhoto ? handleRemoveCover : undefined}
          currentCover={coverPhoto || undefined}
        />
      </div>
    </AuthLayout>
  );
}
