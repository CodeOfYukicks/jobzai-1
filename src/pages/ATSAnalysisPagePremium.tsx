import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../utils/logo';
import TailoredResumePanel from '../components/ats-premium/TailoredResumePanel';
import JobSummaryPanel from '../components/ats-premium/JobSummaryPanel';
import { analyzeOptimizedCV } from '../lib/optimizedCVAnalyzer';
import { analyzePremiumScore, type PremiumScoreAnalysis } from '../lib/premiumScoreAnalyzer';
import { createBackgroundTask, getActiveTaskForAnalysis, BackgroundTask } from '../services/backgroundTaskService';
import { startCVRewriteWorker } from '../services/cvRewriteWorker';
import { ExternalLink, Building2, MapPin, FileText, Wand2 } from 'lucide-react';

// Import tab components
import { OverviewTab, MatchDetailsTab, GapsActionsTab } from '../components/ats-premium/tabs';

// Types
import type { PremiumATSAnalysis, AdaptationLevel } from '../types/premiumATS';

// Tab type - extended for mobile sidebar access
type MainTab = 'overview' | 'match' | 'gaps' | 'summary' | 'cv';

// Helper function to get company initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Minimalist company logo
function CompanyLogoMinimal({ companyName }: { companyName: string }) {
  const companyDomain = getCompanyDomain(companyName);
  const initialLogo = companyDomain ? getClearbitUrl(companyDomain) : null;
  const [logoSrc, setLogoSrc] = useState<string | null>(initialLogo);
  const triedGoogle = useRef(false);

  function handleLogoError() {
    if (companyDomain && !triedGoogle.current) {
      triedGoogle.current = true;
      setLogoSrc(getGoogleFaviconUrl(companyDomain));
    } else {
      setLogoSrc(null);
    }
  }

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={`${companyName} logo`}
        onError={handleLogoError}
        className="h-12 w-12 object-contain"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {getInitials(companyName)}
      </span>
    </div>
  );
}

// Simplified Right Sidebar - Only Summary + Tailored CV
function RightSidebar({
  analysis,
  onGenerateCVRewrite,
  isGeneratingCV,
  navigate,
  optimizedScore,
  premiumAnalysis,
  cvRewrite,
  sidebarTab,
  setSidebarTab
}: {
  analysis: PremiumATSAnalysis;
  onGenerateCVRewrite: (level: AdaptationLevel) => void;
  isGeneratingCV: boolean;
  navigate: (path: string) => void;
  optimizedScore: { overall: number; skills: number; experience: number } | null;
  premiumAnalysis: PremiumScoreAnalysis | null;
  cvRewrite: any;
  sidebarTab: 'summary' | 'cv';
  setSidebarTab: (tab: 'summary' | 'cv') => void;
}) {
  return (
    <div className="hidden lg:block fixed right-0 top-12 bottom-0 w-[380px] bg-white dark:bg-[#2b2a2c] border-l border-gray-100 dark:border-[#3d3c3e] z-30">
      <div className="h-full flex flex-col">
        {/* Tab Headers - Minimal style */}
        <div className="flex border-b border-gray-100 dark:border-[#3d3c3e]">
          <button
            onClick={() => setSidebarTab('summary')}
            className={`flex-1 px-4 py-3.5 text-xs font-medium transition-all relative ${sidebarTab === 'summary'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Summary
            </div>
            {sidebarTab === 'summary' && (
              <motion.div
                layoutId="sidebarTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('cv')}
            className={`flex-1 px-4 py-3.5 text-xs font-medium transition-all relative ${sidebarTab === 'cv'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wand2 className="w-3.5 h-3.5" />
              Tailored CV
              {cvRewrite && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            {sidebarTab === 'cv' && (
              <motion.div
                layoutId="sidebarTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            {sidebarTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-y-auto p-5"
              >
                <JobSummaryPanel jobSummary={analysis.job_summary} compact />
              </motion.div>
            )}

            {sidebarTab === 'cv' && (
              <motion.div
                key="cv"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <TailoredResumePanel
                  analysis={analysis}
                  cvRewrite={cvRewrite}
                  isGenerating={isGeneratingCV}
                  onGenerate={onGenerateCVRewrite}
                  onViewFull={() => navigate(`/ats-analysis/${analysis.id}/cv-editor`)}
                  optimizedScore={optimizedScore || undefined}
                  premiumAnalysis={premiumAnalysis}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ATSAnalysisPagePremium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [analysis, setAnalysis] = useState<PremiumATSAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'cv'>('summary');
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvRewrite, setCvRewrite] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationStepLabel, setGenerationStepLabel] = useState('');
  const [optimizedScore, setOptimizedScore] = useState<{
    overall: number;
    skills: number;
    experience: number;
  } | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [premiumAnalysis, setPremiumAnalysis] = useState<PremiumScoreAnalysis | null>(null);
  const [activeBackgroundTask, setActiveBackgroundTask] = useState<BackgroundTask | null>(null);

  const hasCalculatedScoreRef = useRef(false);

  // Mobile swipe gesture handling for tab switching
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity (px/ms)
  const MOBILE_TABS = ['overview', 'match', 'gaps', 'summary', 'cv'] as const;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Only trigger swipe if horizontal movement is dominant and threshold is met
    if (
      Math.abs(deltaX) > SWIPE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && // Horizontal bias
      velocity > SWIPE_VELOCITY_THRESHOLD
    ) {
      const currentIndex = MOBILE_TABS.indexOf(mainTab as typeof MOBILE_TABS[number]);

      if (deltaX < 0 && currentIndex < MOBILE_TABS.length - 1) {
        // Swipe left → next tab
        setMainTab(MOBILE_TABS[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe right → previous tab
        setMainTab(MOBILE_TABS[currentIndex - 1]);
      }
    }

    touchStartRef.current = null;
  }, [mainTab]);

  // Fetch analysis from Firestore
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));

        if (analysisDoc.exists()) {
          const data = analysisDoc.data() as PremiumATSAnalysis;
          const cvRewriteData = data.cv_rewrite;
          const cvRewriteGeneratedAt = data.cv_rewrite_generated_at;

          let hasValidCV = false;
          if (cvRewriteData && cvRewriteGeneratedAt) {
            const hasInitialCV = cvRewriteData.initial_cv &&
              typeof cvRewriteData.initial_cv === 'string' &&
              cvRewriteData.initial_cv.trim().length > 50;

            const hasStructuredData = cvRewriteData.structured_data && (
              (cvRewriteData.structured_data.experiences && cvRewriteData.structured_data.experiences.length > 0) ||
              (cvRewriteData.structured_data.summary && cvRewriteData.structured_data.summary.trim().length > 0) ||
              (cvRewriteData.structured_data.personalInfo && Object.keys(cvRewriteData.structured_data.personalInfo).length > 0)
            );

            hasValidCV = hasInitialCV || hasStructuredData;
          }

          setAnalysis({ ...data, id: analysisDoc.id });
          setCvRewrite(hasValidCV ? cvRewriteData : null);
          setOptimizedScore(null);
          setIsCalculatingScore(false);
          setSidebarTab(hasValidCV ? 'cv' : 'summary');
        } else {
          notify.error('Analysis not found');
          navigate('/cv-analysis');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        notify.error('Failed to load analysis');
        navigate('/cv-analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, currentUser, navigate]);

  // Real-time listener for cv_rewrite changes
  useEffect(() => {
    if (!id || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'analyses', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (isGeneratingCV && data.cv_rewrite && data.cv_rewrite_generated_at) {
            setCvRewrite(data.cv_rewrite);
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);
            setGenerationProgress(0);
            setGenerationStep(0);
            setGenerationStepLabel('');
            setSidebarTab('cv');
          }
        }
      }
    );

    return () => unsubscribe();
  }, [id, currentUser?.uid, isGeneratingCV]);

  // Monitor background tasks
  useEffect(() => {
    if (!id || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'backgroundTasks', `cv_rewrite_${id}`),
      { includeMetadataChanges: false },
      async () => {
        const task = await getActiveTaskForAnalysis(currentUser.uid, id, 'cv_rewrite');

        if (task) {
          setActiveBackgroundTask(task);
          setIsGeneratingCV(true);
          setGenerationProgress(task.progress || 0);
          setGenerationStep(task.step || 0);
          setGenerationStepLabel(task.stepLabel || '');
          setSidebarTab('cv');
        } else {
          if (activeBackgroundTask && (activeBackgroundTask.status === 'pending' || activeBackgroundTask.status === 'in_progress')) {
            const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
            if (analysisDoc.exists()) {
              const data = analysisDoc.data();
              if (data.cv_rewrite && data.cv_rewrite_generated_at) {
                setCvRewrite(data.cv_rewrite);
                setSidebarTab('cv');
                notify.success('Optimized CV generated successfully!', { duration: 5000 });
              }
            }
          }
          setActiveBackgroundTask(null);
          setIsGeneratingCV(false);
          setGenerationProgress(0);
          setGenerationStep(0);
          setGenerationStepLabel('');
        }
      }
    );

    const checkActiveTask = async () => {
      const task = await getActiveTaskForAnalysis(currentUser.uid, id, 'cv_rewrite');
      if (task) {
        setActiveBackgroundTask(task);
        setIsGeneratingCV(true);
        setGenerationProgress(task.progress || 0);
        setGenerationStep(task.step || 0);
        setGenerationStepLabel(task.stepLabel || '');
        setSidebarTab('cv');
      }
    };
    checkActiveTask();

    return () => unsubscribe();
  }, [id, currentUser?.uid, activeBackgroundTask]);

  // Subscribe to active background task updates
  useEffect(() => {
    if (!activeBackgroundTask || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'backgroundTasks', activeBackgroundTask.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const task = docSnap.data() as BackgroundTask;

          if (task.status === 'completed') {
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);

            getDoc(doc(db, 'users', currentUser.uid, 'analyses', id!)).then((analysisDoc) => {
              if (analysisDoc.exists()) {
                const data = analysisDoc.data();
                if (data.cv_rewrite) {
                  setCvRewrite(data.cv_rewrite);
                  setSidebarTab('cv');
                }
              }
            });
          } else if (task.status === 'failed') {
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);
            notify.error(task.error || 'CV generation failed', { duration: 6000 });
          } else {
            setGenerationProgress(task.progress || 0);
            setGenerationStep(task.step || 0);
            setGenerationStepLabel(task.stepLabel || '');
          }
        }
      }
    );

    return () => unsubscribe();
  }, [activeBackgroundTask?.id, currentUser?.uid, id]);

  // Calculate optimized CV score
  useEffect(() => {
    const calculateScore = async () => {
      if (!cvRewrite || !analysis || !analysis.jobDescription) {
        if (optimizedScore !== null || premiumAnalysis !== null || isCalculatingScore) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
        }
        hasCalculatedScoreRef.current = false;
        return;
      }

      const hasContent = cvRewrite.initial_cv ||
        (cvRewrite.structured_data && Object.keys(cvRewrite.structured_data).length > 0);

      if (!hasContent) {
        if (optimizedScore !== null || premiumAnalysis !== null || isCalculatingScore) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
        }
        hasCalculatedScoreRef.current = false;
        return;
      }

      if (hasCalculatedScoreRef.current && optimizedScore !== null) {
        return;
      }

      setIsCalculatingScore(true);
      try {
        const optimizedCVText = cvRewrite.initial_cv ||
          (cvRewrite.structured_data ? JSON.stringify(cvRewrite.structured_data) : '');

        if (!optimizedCVText || optimizedCVText.trim().length === 0) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
          return;
        }

        const originalScore = {
          overall: analysis.match_scores.overall_score,
          skills: analysis.match_scores.skills_score,
          experience: analysis.match_scores.experience_score
        };

        const optimized = analyzeOptimizedCV(
          optimizedCVText,
          analysis.jobDescription,
          originalScore
        );

        const originalCVText = analysis.cvText || '';

        const premiumAnalysisResult = analyzePremiumScore(
          originalCVText,
          optimizedCVText,
          analysis.jobDescription,
          originalScore,
          {
            overall: optimized.overall,
            skills: optimized.skills,
            experience: optimized.experience,
            keywords: optimized.keywords,
            structure: optimized.structure,
            quality: optimized.quality
          }
        );

        Promise.resolve().then(() => {
          setOptimizedScore({
            overall: optimized.overall,
            skills: optimized.skills,
            experience: optimized.experience
          });
          setPremiumAnalysis(premiumAnalysisResult);
          setIsCalculatingScore(false);
          hasCalculatedScoreRef.current = true;
        });
      } catch (error) {
        console.error('Error calculating optimized score:', error);
        setOptimizedScore(null);
        setPremiumAnalysis(null);
        setIsCalculatingScore(false);
      }
    };

    calculateScore();
  }, [cvRewrite, analysis]);

  // Generate CV Rewrite
  const handleGenerateCVRewrite = async (adaptationLevel: AdaptationLevel = 'balanced') => {
    if (!analysis || !id || !currentUser) {
      notify.error('Analysis data not available');
      return;
    }

    if (!analysis.cvText) {
      notify.error('CV text is missing. Please run a new analysis.', { duration: 5000 });
      return;
    }

    if (!analysis.jobDescription) {
      notify.error('Job description is missing.', { duration: 5000 });
      return;
    }

    const existingTask = await getActiveTaskForAnalysis(currentUser.uid, id, 'cv_rewrite');
    if (existingTask) {
      notify.info('Generation already in progress', { duration: 3000 });
      setSidebarTab('cv');
      return;
    }

    const cvText = analysis.cvText || '';
    const matchScore = analysis.match_scores?.overall_score || 0;

    const enrichedStrengths = (analysis.top_strengths || []).map((s: any) => ({
      name: s.name || '',
      example_from_resume: s.example_from_resume || '',
      why_it_matters: s.why_it_matters || '',
    }));

    const enrichedGaps = (analysis.top_gaps || []).map((g: any) => ({
      name: g.name || '',
      severity: g.severity || 'Medium',
      how_to_fix: g.how_to_fix || '',
      why_it_matters: g.why_it_matters || '',
    }));

    const keywordsBreakdown = {
      missing: analysis.match_breakdown?.keywords?.missing || [],
      priority_missing: analysis.match_breakdown?.keywords?.priority_missing || [],
      found: analysis.match_breakdown?.keywords?.found || [],
    };

    const cvFixes = analysis.cv_fixes ? {
      high_impact_bullets_to_add: analysis.cv_fixes.high_impact_bullets_to_add || [],
      bullets_to_rewrite: analysis.cv_fixes.bullets_to_rewrite || [],
      keywords_to_insert: analysis.cv_fixes.keywords_to_insert || [],
      sections_to_reorder: analysis.cv_fixes.sections_to_reorder || [],
      estimated_score_gain: analysis.cv_fixes.estimated_score_gain || 0,
    } : undefined;

    const jobSummary = analysis.job_summary ? {
      hidden_expectations: analysis.job_summary.hidden_expectations || [],
      core_requirements: analysis.job_summary.core_requirements || [],
      mission: analysis.job_summary.mission || '',
    } : undefined;

    const positioning = analysis.action_plan_48h?.job_specific_positioning || '';

    const inputData = {
      cvText,
      jobDescription: analysis.jobDescription,
      atsAnalysis: {
        matchScore,
        strengths: enrichedStrengths,
        gaps: enrichedGaps,
        keywords: keywordsBreakdown,
        cvFixes,
        jobSummary,
        positioning,
      },
      jobTitle: analysis.jobTitle,
      company: analysis.company,
      adaptationLevel,
    };

    try {
      const taskId = await createBackgroundTask(currentUser.uid, 'cv_rewrite', {
        analysisId: id,
        jobTitle: analysis.jobTitle,
        company: analysis.company,
        adaptationLevel,
        inputData,
      });

      setIsGeneratingCV(true);
      setGenerationProgress(0);
      setGenerationStep(0);
      setGenerationStepLabel('Starting...');
      setSidebarTab('cv');

      startCVRewriteWorker(currentUser.uid, taskId, id, inputData);

    } catch (error: any) {
      console.error('Error starting CV Rewrite:', error);
      notify.error(error.message || 'Failed to start CV generation', { duration: 6000 });
      setIsGeneratingCV(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-[#3d3c3e] border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading analysis...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Not Found State
  if (!analysis) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Analysis Not Found
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The analysis you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/cv-analysis')}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Back to Analyses
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Get score category styling
  const getScoreStyle = (score: number) => {
    if (score >= 80) return {
      color: 'text-emerald-500',
      ring: 'stroke-emerald-500',
      bg: 'bg-emerald-500/10',
      label: 'Excellent Match'
    };
    if (score >= 60) return {
      color: 'text-blue-500',
      ring: 'stroke-blue-500',
      bg: 'bg-blue-500/10',
      label: 'Good Match'
    };
    if (score >= 40) return {
      color: 'text-amber-500',
      ring: 'stroke-amber-500',
      bg: 'bg-amber-500/10',
      label: 'Fair Match'
    };
    return {
      color: 'text-rose-500',
      ring: 'stroke-rose-500',
      bg: 'bg-rose-500/10',
      label: 'Low Match'
    };
  };

  const scoreStyle = getScoreStyle(analysis.match_scores.overall_score);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (analysis.match_scores.overall_score / 100) * circumference;

  return (
    <AuthLayout>
      {/* Right Sidebar */}
      <RightSidebar
        analysis={analysis}
        onGenerateCVRewrite={handleGenerateCVRewrite}
        isGeneratingCV={isGeneratingCV}
        cvRewrite={cvRewrite}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        navigate={navigate}
        optimizedScore={optimizedScore}
        premiumAnalysis={premiumAnalysis}
      />

      {/* Main Content */}
      <div className="min-h-screen lg:pr-[380px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* Header - Compact on mobile */}
          <header className="mb-4 sm:mb-8">
            <div className="flex items-start justify-between gap-3 sm:gap-6">
              {/* Left: Logo + Info */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Logo - smaller on mobile */}
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                  <CompanyLogoMinimal companyName={analysis.company} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight line-clamp-2 sm:line-clamp-none">
                    {analysis.jobTitle}
                  </h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                    <span className="truncate">{analysis.company}</span>
                    {/* Location - hidden on mobile */}
                    {analysis.location && (
                      <span className="hidden sm:flex items-center gap-1.5">
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{analysis.location}</span>
                      </span>
                    )}
                    {/* Job URL - hidden on mobile */}
                    {analysis.jobUrl && (
                      <span className="hidden sm:flex items-center gap-1.5">
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <a
                          href={analysis.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Job
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Score Card - Smaller on mobile */}
              <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
                {/* Circular Progress - 48px mobile, 80px desktop */}
                <div className="relative w-12 h-12 sm:w-20 sm:h-20">
                  <svg className="w-12 h-12 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      strokeWidth="6"
                      className="stroke-gray-200 dark:stroke-[#3d3c3e]"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className={scoreStyle.ring}
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        transition: 'stroke-dashoffset 0.5s ease-out'
                      }}
                    />
                  </svg>
                  {/* Score text in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-base sm:text-2xl font-bold tabular-nums ${scoreStyle.color}`}>
                      {analysis.match_scores.overall_score}
                    </span>
                  </div>
                </div>
                {/* Label - Vertical stack on mobile */}
                <div className="text-right hidden sm:block">
                  <div className={`text-sm font-semibold ${scoreStyle.color}`}>
                    {scoreStyle.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Match Score
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile-only: Score label below header */}
            <div className="sm:hidden mt-2 flex items-center justify-end gap-2">
              <span className={`text-xs font-semibold ${scoreStyle.color}`}>
                {scoreStyle.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                · Match Score
              </span>
            </div>
          </header>

          {/* Tabs Navigation - Scroll snap on mobile, larger touch targets */}
          <nav className="mb-4 sm:mb-8 -mx-4 sm:mx-0 border-b border-gray-200 dark:border-[#3d3c3e] overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
            <div className="flex gap-1 sm:gap-6 min-w-max px-4 sm:px-0">
              {/* Main analysis tabs - always visible */}
              {[
                { id: 'overview' as MainTab, label: 'Overview' },
                { id: 'match' as MainTab, label: 'Match Details' },
                { id: 'gaps' as MainTab, label: 'Gaps & Actions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`relative px-3 sm:px-0 py-3 sm:pb-3 text-sm font-medium transition-colors whitespace-nowrap snap-start ${mainTab === tab.id
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300'
                    }`}
                >
                  {tab.label}
                  {mainTab === tab.id && (
                    <motion.div
                      layoutId="mainTab"
                      className="absolute bottom-0 left-3 right-3 sm:left-0 sm:right-0 h-0.5 bg-gray-900 dark:bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}

              {/* Mobile-only sidebar tabs - hidden on desktop (lg) */}
              <div className="lg:hidden flex gap-1 sm:gap-6 items-center">
                <div className="w-px h-5 bg-gray-200 dark:bg-[#3d3c3e] mx-1" />
                {[
                  { id: 'summary' as MainTab, label: 'Summary' },
                  { id: 'cv' as MainTab, label: 'CV', hasIndicator: !!cvRewrite },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMainTab(tab.id)}
                    className={`relative px-3 sm:px-0 py-3 sm:pb-3 text-sm font-medium transition-colors whitespace-nowrap snap-start flex items-center gap-1.5 ${mainTab === tab.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300'
                      }`}
                  >
                    {tab.label}
                    {tab.hasIndicator && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    {mainTab === tab.id && (
                      <motion.div
                        layoutId="mainTab"
                        className="absolute bottom-0 left-3 right-3 sm:left-0 sm:right-0 h-0.5 bg-gray-900 dark:bg-white rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Tab Content - Swipeable on mobile */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mainTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {mainTab === 'overview' && <OverviewTab analysis={analysis} />}
              {mainTab === 'match' && <MatchDetailsTab analysis={analysis} />}
              {mainTab === 'gaps' && <GapsActionsTab analysis={analysis} />}

              {/* Mobile-only tab content for sidebar panels */}
              {mainTab === 'summary' && (
                <div className="lg:hidden">
                  <JobSummaryPanel jobSummary={analysis.job_summary} />
                </div>
              )}
              {mainTab === 'cv' && (
                <div className="lg:hidden">
                  <TailoredResumePanel
                    analysis={analysis}
                    cvRewrite={cvRewrite}
                    isGenerating={isGeneratingCV}
                    onGenerate={handleGenerateCVRewrite}
                    onViewFull={() => navigate(`/ats-analysis/${analysis.id}/cv-editor`)}
                    optimizedScore={optimizedScore || undefined}
                    premiumAnalysis={premiumAnalysis}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </AuthLayout>
  );
}
