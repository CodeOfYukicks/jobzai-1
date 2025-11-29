import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { generateCVRewrite } from '../lib/cvRewriteService';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../utils/logo';
import TailoredResumePanel from '../components/ats-premium/TailoredResumePanel';
import { analyzeOptimizedCV } from '../lib/optimizedCVAnalyzer';
import { analyzePremiumScore, type PremiumScoreAnalysis } from '../lib/premiumScoreAnalyzer';
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

// Types
import type { PremiumATSAnalysis } from '../types/premiumATS';

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
        <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-6">
        {/* Section Header with subtle separator */}
        <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
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

// Full-height Right Sidebar Panel - Ultra Sleek Design
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
  onGenerateCVRewrite: () => void;
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
    <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-[#1E1F22] border-l border-gray-200 dark:border-[#2A2A2E] shadow-2xl z-30">
      <div className="h-full flex flex-col">
        {/* Sleek Tab Headers with gradient indicator */}
        <div className="relative flex border-b border-gray-200 dark:border-[#2A2A2E] flex-shrink-0">
          <button
            onClick={() => setSidebarTab('summary')}
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${sidebarTab === 'summary'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Summary
            </div>
            {sidebarTab === 'summary' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('navigation')}
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${sidebarTab === 'navigation'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <List className="w-3.5 h-3.5" />
              Navigate
            </div>
            {sidebarTab === 'navigation' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('cv')}
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${sidebarTab === 'cv'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wand2 className="w-3.5 h-3.5" />
              Tailored Resume
              {cvRewrite && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </div>
            {sidebarTab === 'cv' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content - Scrollable with custom scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {sidebarTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <JobSummaryPanel jobSummary={analysis.job_summary} compact />
              </motion.div>
            )}

            {sidebarTab === 'navigation' && (
              <motion.div
                key="navigation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <motion.button
                      key={section.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onNavigate(section.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all group ${activeSection === section.id
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#26262B] hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors ${activeSection === section.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                          {section.icon}
                        </span>
                        <span className="text-sm">{section.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${activeSection === section.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                        }`} />
                    </motion.button>
                  ))}
                </nav>
              </motion.div>
            )}

            {sidebarTab === 'cv' && (
              <motion.div
                key="cv"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
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
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'navigation' | 'cv'>('summary');
  const [optimizedScore, setOptimizedScore] = useState<{
    overall: number;
    skills: number;
    experience: number;
  } | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [premiumAnalysis, setPremiumAnalysis] = useState<PremiumScoreAnalysis | null>(null);

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
          toast.error('Analysis not found');
          navigate('/cv-analysis');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis');
        navigate('/cv-analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, currentUser, navigate]);

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

  // Generate CV Rewrite with AI
  const handleGenerateCVRewrite = async () => {
    if (!analysis || !id || !currentUser) {
      toast.error('Analysis data not available');
      return;
    }

    if (!analysis.cvText) {
      toast.error('CV text is missing. Please run a new analysis to enable CV Rewrite.', {
        duration: 5000
      });
      return;
    }

    if (!analysis.jobDescription) {
      toast.error('Job description is missing. Please run a new analysis with job details.', {
        duration: 5000
      });
      return;
    }

    setIsGeneratingCV(true);
    setGenerationProgress(0);
    setGenerationStep(0);

    // Auto-switch to CV tab to show inline progress
    setSidebarTab('cv');

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 5 + 2;
        const newProgress = Math.min(prev + increment, 90);

        // Update step based on progress
        setGenerationStep(() => {
          if (newProgress < 25) return 0;
          if (newProgress < 50) return 1;
          if (newProgress < 75) return 2;
          if (newProgress < 90) return 3;
          return 4;
        });

        return newProgress;
      });
    }, 500);

    try {
      // Step 1: Analyzing
      setGenerationStep(0);
      setGenerationProgress(10);

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

      setGenerationStep(1);
      setGenerationProgress(30);

      // Step 2: Generating with FULL enriched data
      setGenerationStep(2);
      setGenerationProgress(50);

      const result = await generateCVRewrite({
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
      });

      setGenerationStep(3);
      setGenerationProgress(75);

      // Step 3: Saving to Firebase
      await updateDoc(doc(db, 'users', currentUser.uid, 'analyses', id), {
        cv_rewrite: result,
        cv_rewrite_generated_at: new Date().toISOString()
      });

      setGenerationStep(4);
      setGenerationProgress(100);

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update state immediately - this will trigger UI update
      setCvRewrite(result);

      // Switch to CV tab to show the result
      setSidebarTab('cv');

      // Clear progress interval
      clearInterval(progressInterval);

      toast.success('🎉 Tailored resume generated successfully!', {
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error generating CV Rewrite:', error);

      clearInterval(progressInterval);

      let errorMessage = 'Failed to generate CV';
      if (error.message?.includes('API key')) {
        errorMessage = 'OpenAI API key is missing. Please configure your environment.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsGeneratingCV(false);
      setGenerationProgress(0);
      setGenerationStep(0);
    }
  };

  // Loading State
  if (loading) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
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
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
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
                <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-lg px-8 py-6 ${
                  analysis.match_scores.overall_score >= 80 
                    ? 'border-purple-200 dark:border-purple-800/50' 
                    : analysis.match_scores.overall_score >= 60 
                      ? 'border-blue-200 dark:border-blue-800/50' 
                      : 'border-pink-200 dark:border-pink-800/50'
                }`}>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Match Score
                    </div>
                    <div className={`text-5xl font-black leading-none mb-2 ${
                      analysis.match_scores.overall_score >= 80 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : analysis.match_scores.overall_score >= 60 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-pink-600 dark:text-pink-400'
                    }`}>
                      {analysis.match_scores.overall_score}
                      <span className="text-3xl">%</span>
                    </div>
                    <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                      analysis.match_scores.overall_score >= 80 
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                        : analysis.match_scores.overall_score >= 60 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                          : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                    }`}>
                      {analysis.match_scores.category}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row - Minimalist Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Skills',
                  value: `${analysis.match_scores.skills_score}%`,
                  iconColor: analysis.match_scores.skills_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.skills_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                  valueColor: analysis.match_scores.skills_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.skills_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                  icon: <Zap className="w-4 h-4" />
                },
                {
                  label: 'Experience',
                  value: `${analysis.match_scores.experience_score}%`,
                  iconColor: analysis.match_scores.experience_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.experience_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                  valueColor: analysis.match_scores.experience_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.experience_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                  icon: <TrendingUp className="w-4 h-4" />
                },
                {
                  label: 'Strengths',
                  value: analysis.top_strengths.length,
                  iconColor: 'text-green-600 dark:text-green-400',
                  valueColor: 'text-green-600 dark:text-green-400',
                  icon: <Check className="w-4 h-4" />
                },
                {
                  label: 'Gaps',
                  value: analysis.top_gaps.length,
                  iconColor: 'text-red-600 dark:text-red-400',
                  valueColor: 'text-red-600 dark:text-red-400',
                  icon: <AlertCircle className="w-4 h-4" />
                }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={stat.iconColor}>
                      {stat.icon}
                    </div>
                    <div className={`text-xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
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
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Executive Summary
                    </h2>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis.executive_summary}
                  </p>

                  {/* Scoring Rationale - How This Score Was Calculated */}
                  {analysis.scoring_rationale && (
                    <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            How This Score Was Calculated
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {analysis.scoring_rationale}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
