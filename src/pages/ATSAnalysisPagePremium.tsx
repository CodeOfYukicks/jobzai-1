import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../utils/logo';
import TailoredResumePanel from '../components/ats-premium/TailoredResumePanel';
import { analyzeOptimizedCV } from '../lib/optimizedCVAnalyzer';
import { analyzePremiumScore, type PremiumScoreAnalysis } from '../lib/premiumScoreAnalyzer';
// Background task system for persistent CV generation
import { createBackgroundTask, getActiveTaskForAnalysis, BackgroundTask } from '../services/backgroundTaskService';
import { startCVRewriteWorker } from '../services/cvRewriteWorker';
import {
  ExternalLink, Building2, MapPin, FileText, List,
  Target, TrendingUp, AlertCircle, Lightbulb, Activity, BookOpen,
  Zap, ChevronRight, Check, Wand2
} from 'lucide-react';

// Import premium components
import JobSummaryPanel from '../components/ats-premium/JobSummaryPanel';
import MatchBreakdownPanel from '../components/ats-premium/MatchBreakdownPanel';
import StrengthCard from '../components/ats-premium/StrengthCard';
import GapCard from '../components/ats-premium/GapCard';
import CVFixesPanel from '../components/ats-premium/CVFixesPanel';
import SuggestedAdditionsPanel from '../components/ats-premium/SuggestedAdditionsPanel';
import ActionPlan48H from '../components/ats-premium/ActionPlan48H';
import LearningPathPanel from '../components/ats-premium/LearningPathPanel';
import OpportunityFitPanel from '../components/ats-premium/OpportunityFitPanel';
import ScoreCalculationPanel from '../components/ats-premium/ScoreCalculationPanel';

// Types
import type { PremiumATSAnalysis, AdaptationLevel } from '../types/premiumATS';

// Helper function to get company initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Logo component without box (like InterviewPrepPage)
function CompanyLogoWithoutBox({ companyName }: { companyName: string }) {
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

  return (
    <>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${companyName} logo`}
          onError={handleLogoError}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      ) : (
        <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
            {getInitials(companyName)}
          </span>
        </div>
      )}
    </>
  );
}

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white dark:bg-[#242325] rounded-xl border border-gray-200/60 dark:border-[#3d3c3e]/60 shadow-sm hover:shadow-md transition-all duration-300 p-8 space-y-6">
        {/* Section Header with subtle separator */}
        <div className="space-y-3 pb-6 border-b border-gray-200/60 dark:border-[#3d3c3e]/60">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Section Content */}
        <div>
          {children}
        </div>
      </div>
    </section>
  );
}

// Full-height Right Sidebar Panel - Notion Style Design
function RightSidebarPanel({
  analysis,
  activeSection,
  onNavigate,
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
  activeSection: string;
  onNavigate: (section: string) => void;
  onGenerateCVRewrite: (level: AdaptationLevel) => void;
  isGeneratingCV: boolean;
  navigate: (path: string) => void;
  optimizedScore: { overall: number; skills: number; experience: number } | null;
  premiumAnalysis: PremiumScoreAnalysis | null;
  cvRewrite: any;
  sidebarTab: 'summary' | 'navigation' | 'cv';
  setSidebarTab: (tab: 'summary' | 'navigation' | 'cv') => void;
}) {
  const sections = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
    { id: 'breakdown', label: 'Match Breakdown', icon: <Activity className="w-4 h-4" /> },
    { id: 'strengths', label: 'Top Strengths', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'gaps', label: 'Gaps to Address', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'cv-fixes', label: 'CV Optimization', icon: <Zap className="w-4 h-4" /> },
    { id: 'action-plan', label: '48H Action Plan', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning Path', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'fit', label: 'Opportunity Fit', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="hidden lg:block fixed right-0 top-12 bottom-0 w-96 bg-white dark:bg-[#333234] border-l border-gray-200 dark:border-[#3d3c3e] z-30">
      <div className="h-full flex flex-col">
        {/* Notion Style Tab Headers */}
        <div className="relative flex border-b border-gray-100 dark:border-[#3d3c3e] flex-shrink-0">
          <button
            onClick={() => setSidebarTab('summary')}
            className={`relative flex-1 px-4 py-4 text-xs font-medium transition-all ${sidebarTab === 'summary'
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
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('navigation')}
            className={`relative flex-1 px-4 py-4 text-xs font-medium transition-all ${sidebarTab === 'navigation'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <List className="w-3.5 h-3.5" />
              Navigate
            </div>
            {sidebarTab === 'navigation' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('cv')}
            className={`relative flex-1 px-4 py-4 text-xs font-medium transition-all ${sidebarTab === 'cv'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wand2 className="w-3.5 h-3.5" />
              Tailored Resume
              {cvRewrite && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </div>
            {sidebarTab === 'cv' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content - Scrollable with custom scrollbar */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <AnimatePresence mode="wait">
            {sidebarTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <JobSummaryPanel jobSummary={analysis.job_summary} compact />
              </motion.div>
            )}

            {sidebarTab === 'navigation' && (
              <motion.div
                key="navigation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <nav className="space-y-0.5">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${activeSection === section.id
                        ? 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-900 dark:text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors ${activeSection === section.id ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {section.icon}
                        </span>
                        <span className="text-sm">{section.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${activeSection === section.id ? 'opacity-70' : 'opacity-0 group-hover:opacity-40'
                        }`} />
                    </button>
                  ))}
                </nav>
              </motion.div>
            )}

            {sidebarTab === 'cv' && (
              <motion.div
                key="cv"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
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

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.4);
        }
      `}</style>
    </div>
  );
}

export default function ATSAnalysisPagePremium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [analysis, setAnalysis] = useState<PremiumATSAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvRewrite, setCvRewrite] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationStepLabel, setGenerationStepLabel] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'navigation' | 'cv'>('summary');
  const [optimizedScore, setOptimizedScore] = useState<{
    overall: number;
    skills: number;
    experience: number;
  } | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [premiumAnalysis, setPremiumAnalysis] = useState<PremiumScoreAnalysis | null>(null);
  const [activeBackgroundTask, setActiveBackgroundTask] = useState<BackgroundTask | null>(null);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

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

          // Check if CV rewrite exists and was generated manually by user
          // CRITICAL: Only load CV if cv_rewrite_generated_at exists (manual generation)
          const cvRewriteData = data.cv_rewrite;
          const cvRewriteGeneratedAt = data.cv_rewrite_generated_at;

          // CV is only valid if:
          // 1. cv_rewrite exists
          // 2. cv_rewrite_generated_at exists (proves it was generated manually, not automatically)
          // 3. Has actual content
          let hasValidCV = false;

          if (cvRewriteData && cvRewriteGeneratedAt) {
            // Check if it has initial_cv with actual content
            const hasInitialCV = cvRewriteData.initial_cv &&
              typeof cvRewriteData.initial_cv === 'string' &&
              cvRewriteData.initial_cv.trim().length > 50; // At least 50 chars

            // Check if it has structured_data with actual content
            const hasStructuredData = cvRewriteData.structured_data && (
              (cvRewriteData.structured_data.experiences && cvRewriteData.structured_data.experiences.length > 0) ||
              (cvRewriteData.structured_data.summary && cvRewriteData.structured_data.summary.trim().length > 0) ||
              (cvRewriteData.structured_data.personalInfo && Object.keys(cvRewriteData.structured_data.personalInfo).length > 0)
            );

            hasValidCV = hasInitialCV || hasStructuredData;

            if (!hasValidCV) {
              console.log('⚠️ CV rewrite exists but is invalid/empty:', {
                hasInitialCV,
                hasStructuredData,
                initial_cv_length: cvRewriteData.initial_cv?.length || 0,
                structured_data_keys: cvRewriteData.structured_data ? Object.keys(cvRewriteData.structured_data) : []
              });
            } else {
              console.log('✅ Valid CV rewrite found (manually generated):', {
                generatedAt: cvRewriteGeneratedAt,
                hasContent: true
              });
            }
          } else {
            if (cvRewriteData && !cvRewriteGeneratedAt) {
              console.log('⚠️ CV rewrite exists but cv_rewrite_generated_at is missing - ignoring (likely auto-generated during analysis)');
            } else if (!cvRewriteData) {
              console.log('ℹ️ No CV rewrite found for this analysis');
            }
          }

          // BATCH ALL STATE UPDATES TOGETHER to prevent multiple re-renders
          // This prevents the blinking issue by updating everything at once
          setAnalysis({ ...data, id: analysisDoc.id });
          setCvRewrite(hasValidCV ? cvRewriteData : null);
          setOptimizedScore(null); // Will be calculated by the score effect
          setIsCalculatingScore(false);
          setSidebarTab(hasValidCV ? 'cv' : 'summary'); // Set tab once based on CV existence
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

  // Real-time listener for cv_rewrite changes on the analysis document
  // This ensures the UI updates automatically when CV generation completes
  useEffect(() => {
    if (!id || !currentUser?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'analyses', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if cv_rewrite was just generated (while we were generating)
          if (isGeneratingCV && data.cv_rewrite && data.cv_rewrite_generated_at) {
            console.log('🎉 CV rewrite detected via real-time listener!');
            setCvRewrite(data.cv_rewrite);
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);
            setGenerationProgress(0);
            setGenerationStep(0);
            setGenerationStepLabel('');
            setSidebarTab('cv');
          }
        }
      },
      (error) => {
        console.error('Error listening to analysis document:', error);
      }
    );

    return () => unsubscribe();
  }, [id, currentUser?.uid, isGeneratingCV]);

  // Monitor background tasks for this analysis
  useEffect(() => {
    if (!id || !currentUser?.uid) return;

    // Subscribe to background tasks collection for this analysis
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'backgroundTasks', `cv_rewrite_${id}`),
      { includeMetadataChanges: false },
      async (docSnap) => {
        // Also check for any active task with matching analysisId
        const task = await getActiveTaskForAnalysis(currentUser.uid, id, 'cv_rewrite');
        
        if (task) {
          setActiveBackgroundTask(task);
          setIsGeneratingCV(true);
          setGenerationProgress(task.progress || 0);
          setGenerationStep(task.step || 0);
          setGenerationStepLabel(task.stepLabel || '');
          setSidebarTab('cv');
        } else {
          // Check if task just completed - reload the CV rewrite
          if (activeBackgroundTask && (activeBackgroundTask.status === 'pending' || activeBackgroundTask.status === 'in_progress')) {
            // Task was active and now it's gone - reload analysis to get the new CV
            console.log('🔄 Background task completed, reloading CV rewrite...');
            const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
            if (analysisDoc.exists()) {
              const data = analysisDoc.data();
              if (data.cv_rewrite && data.cv_rewrite_generated_at) {
                setCvRewrite(data.cv_rewrite);
                setSidebarTab('cv');
                notify.success('🎉 Optimized CV generated successfully!', { duration: 5000 });
              }
            }
          }
          setActiveBackgroundTask(null);
          setIsGeneratingCV(false);
          setGenerationProgress(0);
          setGenerationStep(0);
          setGenerationStepLabel('');
        }
      },
      (error) => {
        console.error('Error monitoring background task:', error);
      }
    );

    // Also check on mount if there's an active task
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
            // Task completed - reload CV rewrite from analysis
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);
            
            // Reload the analysis to get the new CV
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
            // Task failed
            setIsGeneratingCV(false);
            setActiveBackgroundTask(null);
            notify.error(task.error || 'La génération du CV a échoué', { duration: 6000 });
          } else {
            // Update progress
            setGenerationProgress(task.progress || 0);
            setGenerationStep(task.step || 0);
            setGenerationStepLabel(task.stepLabel || '');
          }
        }
      }
    );

    return () => unsubscribe();
  }, [activeBackgroundTask?.id, currentUser?.uid, id]);

  // Calculate optimized CV score when CV rewrite is available
  // Use a ref to prevent calculation on initial mount when score might already exist
  const hasCalculatedScoreRef = useRef(false);

  useEffect(() => {
    const calculateScore = async () => {
      // Only calculate if cvRewrite exists and has valid content
      if (!cvRewrite || !analysis || !analysis.jobDescription) {
        // Don't update states if already null (prevents unnecessary re-renders)
        if (optimizedScore !== null || premiumAnalysis !== null || isCalculatingScore) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
        }
        hasCalculatedScoreRef.current = false;
        return;
      }

      // Validate that cvRewrite has actual content
      const hasContent = cvRewrite.initial_cv ||
        (cvRewrite.structured_data && Object.keys(cvRewrite.structured_data).length > 0);

      if (!hasContent) {
        console.log('⚠️ CV rewrite exists but has no valid content');
        if (optimizedScore !== null || premiumAnalysis !== null || isCalculatingScore) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
        }
        hasCalculatedScoreRef.current = false;
        return;
      }

      // Skip if already calculated for this CV (prevents re-calculation on re-renders)
      if (hasCalculatedScoreRef.current && optimizedScore !== null) {
        return;
      }

      setIsCalculatingScore(true);
      try {
        // Get CV text from rewrite (prefer initial_cv markdown)
        const optimizedCVText = cvRewrite.initial_cv ||
          (cvRewrite.structured_data ? JSON.stringify(cvRewrite.structured_data) : '');

        if (!optimizedCVText || optimizedCVText.trim().length === 0) {
          setOptimizedScore(null);
          setPremiumAnalysis(null);
          setIsCalculatingScore(false);
          return;
        }

        // Original scores from the analysis
        const originalScore = {
          overall: analysis.match_scores.overall_score,
          skills: analysis.match_scores.skills_score,
          experience: analysis.match_scores.experience_score
        };

        // Calculate optimized score with guarantee of improvement
        const optimized = analyzeOptimizedCV(
          optimizedCVText,
          analysis.jobDescription,
          originalScore
        );

        // Get original CV text (if available)
        const originalCVText = analysis.cvText || '';

        // Calculate premium analysis
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

        // BATCH STATE UPDATES: Use a micro-task to batch all state updates together
        // This prevents multiple re-renders and reduces blinking
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

  // Scroll spy for active section - Throttled to prevent excessive re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastActiveSection = activeSection;

    const handleScroll = () => {
      // Throttle scroll events to reduce re-renders and improve performance
      if (timeoutId !== null) {
        return; // Skip if already scheduled
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;

        const sectionIds = ['overview', 'breakdown', 'strengths', 'gaps', 'cv-fixes', 'action-plan', 'learning', 'fit'];

        for (const sectionId of sectionIds) {
          const element = sectionsRef.current[sectionId];
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && rect.top < window.innerHeight / 3) {
              // Only update if section actually changed to prevent unnecessary re-renders
              if (lastActiveSection !== sectionId) {
                lastActiveSection = sectionId;
                setActiveSection(sectionId);
              }
              break;
            }
          }
        }
      }, 100); // Throttle to 100ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [analysis]);

  // Navigate to section
  const handleNavigate = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Generate CV Rewrite with AI - Now uses background tasks for persistence
  const handleGenerateCVRewrite = async (adaptationLevel: AdaptationLevel = 'balanced') => {
    if (!analysis || !id || !currentUser) {
      notify.error('Analysis data not available');
      return;
    }

    if (!analysis.cvText) {
      notify.error('CV text is missing. Please run a new analysis to enable CV Rewrite.', {
        duration: 5000
      });
      return;
    }

    if (!analysis.jobDescription) {
      notify.error('Job description is missing. Please run a new analysis with job details.', {
        duration: 5000
      });
      return;
    }

    // Check if there's already an active task for this analysis
    const existingTask = await getActiveTaskForAnalysis(currentUser.uid, id, 'cv_rewrite');
    if (existingTask) {
      notify.info('Une génération est déjà en cours pour cette analyse', {
        duration: 3000
      });
      setSidebarTab('cv');
      return;
    }

    console.log(`🎚️ Starting CV Rewrite with adaptation level: ${adaptationLevel}`);

    // Extract FULL enriched data from analysis for ultra-quality rewriting
    const cvText = analysis.cvText || '';
    const matchScore = analysis.match_scores?.overall_score || 0;
    
    // Enriched strengths with full context
    const enrichedStrengths = (analysis.top_strengths || []).map((s: any) => ({
      name: s.name || '',
      example_from_resume: s.example_from_resume || '',
      why_it_matters: s.why_it_matters || '',
    }));
    
    // Enriched gaps with severity and resolution strategies
    const enrichedGaps = (analysis.top_gaps || []).map((g: any) => ({
      name: g.name || '',
      severity: g.severity || 'Medium',
      how_to_fix: g.how_to_fix || '',
      why_it_matters: g.why_it_matters || '',
    }));
    
    // Full keywords breakdown
    const keywordsBreakdown = {
      missing: analysis.match_breakdown?.keywords?.missing || [],
      priority_missing: analysis.match_breakdown?.keywords?.priority_missing || [],
      found: analysis.match_breakdown?.keywords?.found || [],
    };
    
    // Pre-analyzed CV fixes
    const cvFixes = analysis.cv_fixes ? {
      high_impact_bullets_to_add: analysis.cv_fixes.high_impact_bullets_to_add || [],
      bullets_to_rewrite: analysis.cv_fixes.bullets_to_rewrite || [],
      keywords_to_insert: analysis.cv_fixes.keywords_to_insert || [],
      sections_to_reorder: analysis.cv_fixes.sections_to_reorder || [],
      estimated_score_gain: analysis.cv_fixes.estimated_score_gain || 0,
    } : undefined;
    
    // Job summary insights
    const jobSummary = analysis.job_summary ? {
      hidden_expectations: analysis.job_summary.hidden_expectations || [],
      core_requirements: analysis.job_summary.core_requirements || [],
      mission: analysis.job_summary.mission || '',
    } : undefined;
    
    // Strategic positioning
    const positioning = analysis.action_plan_48h?.job_specific_positioning || '';

    // Input data for the background task
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
      // Create background task
      const taskId = await createBackgroundTask(currentUser.uid, 'cv_rewrite', {
        analysisId: id,
        jobTitle: analysis.jobTitle,
        company: analysis.company,
        adaptationLevel,
        inputData,
      });

      // Set local state to show progress immediately
      setIsGeneratingCV(true);
      setGenerationProgress(0);
      setGenerationStep(0);
      setGenerationStepLabel('Démarrage...');
      setSidebarTab('cv');

      // Start the worker (runs in background, continues even if user leaves page)
      startCVRewriteWorker(currentUser.uid, taskId, id, inputData);

    } catch (error: any) {
      console.error('❌ Error starting CV Rewrite:', error);

      let errorMessage = 'Failed to start CV generation';
      if (error.message) {
        errorMessage = error.message;
      }

      notify.error(errorMessage, { duration: 6000 });
      setIsGeneratingCV(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-[#3d3c3e]"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Loading your analysis...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Not Found State
  if (!analysis) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center max-w-md text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analysis Not Found
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              The analysis you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/cv-analysis')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Analyses
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Full-height Right Sidebar */}
      <RightSidebarPanel
        analysis={analysis}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onGenerateCVRewrite={handleGenerateCVRewrite}
        isGeneratingCV={isGeneratingCV}
        cvRewrite={cvRewrite}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        navigate={navigate}
        optimizedScore={optimizedScore}
        premiumAnalysis={premiumAnalysis}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col pt-6 pb-6">
        {/* Simplified Header - Minimalist Design */}
        <div className="mb-6 flex-shrink-0 px-4 lg:px-6">
          <div className="w-full lg:pr-96">
            {/* Top Row: Logo + Title + Overall Score */}
            <div className="flex items-start justify-between gap-8 mb-6">
              {/* Left: Logo + Title */}
              <div className="flex items-start gap-6 flex-1 min-w-0 pt-2">
                {/* Company Logo - Large without box */}
                <div className="flex-shrink-0 relative group">
                  <div className="h-20 w-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <CompanyLogoWithoutBox companyName={analysis.company} />
                  </div>
                </div>

                {/* Title and Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                    {analysis.jobTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-base">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Building2 className="w-5 h-5" />
                      {analysis.company}
                    </span>
                    {analysis.location && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <MapPin className="w-5 h-5" />
                          {analysis.location}
                        </span>
                      </>
                    )}
                    {analysis.jobUrl && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <a
                          href={analysis.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                          View Job Posting
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Overall Match Score - Styled Card */}
              <div className="flex-shrink-0">
                <div className={`bg-white dark:bg-[#242325] rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 px-8 py-6 ${
                  analysis.match_scores.overall_score >= 80 
                    ? 'border-[#635BFF]/20 dark:border-[#635BFF]/30' 
                    : analysis.match_scores.overall_score >= 60 
                      ? 'border-blue-200/60 dark:border-blue-800/40' 
                      : 'border-pink-200/60 dark:border-pink-800/40'
                }`}>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Match Score
                    </div>
                    <div className={`text-5xl font-black leading-none mb-3 ${
                      analysis.match_scores.overall_score >= 80 
                        ? 'text-[#635BFF] dark:text-[#a5a0ff]' 
                        : analysis.match_scores.overall_score >= 60 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-pink-600 dark:text-pink-400'
                    }`}>
                      {analysis.match_scores.overall_score}
                      <span className="text-3xl">%</span>
                    </div>
                    <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block border ${
                      analysis.match_scores.overall_score >= 80 
                        ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10 text-[#635BFF] dark:text-[#a5a0ff] border-[#635BFF]/20 dark:border-[#635BFF]/30' 
                        : analysis.match_scores.overall_score >= 60 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40' 
                          : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200/60 dark:border-pink-800/40'
                    }`}>
                      {analysis.match_scores.category}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - With right margin for fixed sidebar */}
        <div className="flex-1 min-h-0 px-4 lg:px-6">
          <div className="w-full lg:pr-96">
            <main className="space-y-6">
              {/* Overview - Executive Summary */}
              <div
                ref={(el) => { sectionsRef.current['overview'] = el; }}
                className="scroll-mt-24"
              >
                <div className="bg-white dark:bg-[#242325] rounded-xl border border-gray-200/60 dark:border-[#3d3c3e]/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Header with subtle gradient background */}
                  <div className="bg-gradient-to-br from-[#635BFF]/5 to-[#7c75ff]/5 dark:from-[#635BFF]/10 dark:to-[#7c75ff]/10 p-8 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#7c75ff] flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Executive Summary
                      </h2>
                    </div>
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">
                      {analysis.executive_summary}
                    </p>
                  </div>

                  {/* Scoring Rationale - How This Score Was Calculated */}
                  <div className="p-8 pt-6">
                    <ScoreCalculationPanel
                      matchScores={analysis.match_scores}
                      scoringRationale={analysis.scoring_rationale}
                      hideScores={true}
                    />
                  </div>
                </div>
              </div>

              {/* Match Breakdown */}
              <div ref={(el) => { sectionsRef.current['breakdown'] = el; }}>
                <Section
                  id="breakdown"
                  title="Match Breakdown"
                  description="Detailed analysis of how your profile aligns with each category"
                >
                  <MatchBreakdownPanel
                    matchBreakdown={analysis.match_breakdown}
                    matchScores={analysis.match_scores}
                  />
                </Section>
              </div>

              {/* Top Strengths */}
              <div ref={(el) => { sectionsRef.current['strengths'] = el; }}>
                <Section
                  id="strengths"
                  title="Top Strengths"
                  description="Your strongest assets for this role with evidence from your resume"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    {analysis.top_strengths.map((strength, index) => (
                      <StrengthCard key={index} strength={strength} index={index} />
                    ))}
                  </div>
                </Section>
              </div>

              {/* Top Gaps */}
              <div ref={(el) => { sectionsRef.current['gaps'] = el; }}>
                <Section
                  id="gaps"
                  title="Gaps to Address"
                  description="Areas where your profile doesn't fully match requirements, with actionable fixes"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    {analysis.top_gaps.map((gap, index) => (
                      <GapCard key={index} gap={gap} index={index} />
                    ))}
                  </div>
                </Section>
              </div>

              {/* CV Fixes */}
              <div ref={(el) => { sectionsRef.current['cv-fixes'] = el; }}>
                <Section
                  id="cv-fixes"
                  title="CV Optimization"
                  description={`Make these changes to potentially gain +${analysis.cv_fixes.estimated_score_gain} points`}
                >
                  <CVFixesPanel cvFixes={analysis.cv_fixes} />
                </Section>
              </div>

              {/* Suggested Additions - Only show if CV has been generated and has suggestions */}
              {cvRewrite?.suggested_additions && cvRewrite.suggested_additions.items?.length > 0 && (
                <div ref={(el) => { sectionsRef.current['suggested-additions'] = el; }}>
                  <Section
                    id="suggested-additions"
                    title="Suggested Additions"
                    description="AI-recommended bullet points that couldn't be automatically integrated into your experiences"
                  >
                    <SuggestedAdditionsPanel 
                      suggestions={cvRewrite.suggested_additions}
                      onAddToExperience={(suggestion) => {
                        // Navigate to CV editor with suggestion context
                        navigate(`/ats-analysis/${analysis.id}/cv-editor`, {
                          state: { 
                            highlightExperience: suggestion.target_experience_id,
                            suggestedBullet: suggestion.bullet 
                          }
                        });
                      }}
                    />
                  </Section>
                </div>
              )}

              {/* 48H Action Plan */}
              <div ref={(el) => { sectionsRef.current['action-plan'] = el; }}>
                <Section
                  id="action-plan"
                  title="48-Hour Action Plan"
                  description="Immediate steps to maximize your chances of landing an interview"
                >
                  <ActionPlan48H actionPlan={analysis.action_plan_48h} />
                </Section>
              </div>

              {/* Learning Path */}
              <div ref={(el) => { sectionsRef.current['learning'] = el; }}>
                <Section
                  id="learning"
                  title="Learning Path"
                  description="Curated resources to close skill gaps and strengthen your candidacy"
                >
                  <LearningPathPanel learningPath={analysis.learning_path} />
                </Section>
              </div>

              {/* Opportunity Fit */}
              <div ref={(el) => { sectionsRef.current['fit'] = el; }}>
                <Section
                  id="fit"
                  title="Opportunity Fit"
                  description="Balanced perspective on why you'll succeed and potential challenges"
                >
                  <OpportunityFitPanel opportunityFit={analysis.opportunity_fit} />
                </Section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
