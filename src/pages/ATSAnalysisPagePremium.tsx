import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { generateCVRewrite } from '../lib/cvRewriteService';
import CVGenerationModal from '../components/cv-generation/CVGenerationModal';
import CVScoreComparison from '../components/ats-premium/CVScoreComparison';
import { analyzeOptimizedCV } from '../lib/optimizedCVAnalyzer';
import {
  ExternalLink, Building2, MapPin, FileText, List,
  Target, TrendingUp, AlertCircle, Lightbulb, Activity, BookOpen,
  Zap, Sparkles, ChevronRight, Eye, Check, Loader2, Wand2
} from 'lucide-react';

// Import premium components
import JobSummaryPanel from '../components/ats-premium/JobSummaryPanel';
import MatchBreakdownPanel from '../components/ats-premium/MatchBreakdownPanel';
import StrengthCard from '../components/ats-premium/StrengthCard';
import GapCard from '../components/ats-premium/GapCard';
import CVFixesPanel from '../components/ats-premium/CVFixesPanel';
import ActionPlan48H from '../components/ats-premium/ActionPlan48H';
import LearningPathPanel from '../components/ats-premium/LearningPathPanel';
import OpportunityFitPanel from '../components/ats-premium/OpportunityFitPanel';

// Types
import type { PremiumATSAnalysis } from '../types/premiumATS';

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Section Header with subtle underline */}
        <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-800">
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
      </motion.div>
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
  cvRewrite,
  sidebarTab,
  setSidebarTab,
  navigate,
  optimizedScore,
  isCalculatingScore
}: { 
  analysis: PremiumATSAnalysis;
  activeSection: string;
  onNavigate: (section: string) => void;
  onGenerateCVRewrite: () => void;
  isGeneratingCV: boolean;
  cvRewrite: any;
  sidebarTab: 'summary' | 'navigation' | 'cv';
  setSidebarTab: (tab: 'summary' | 'navigation' | 'cv') => void;
  navigate: (path: string) => void;
  optimizedScore: { overall: number; skills: number; experience: number } | null;
  isCalculatingScore: boolean;
}) {
  // Auto-switch to CV tab when CV is generated (only when cvRewrite becomes available, not on tab changes)
  const prevCvRewriteRef = useRef<any>(null);
  useEffect(() => {
    // Only switch if cvRewrite just became available (was null, now has value)
    if (cvRewrite && !prevCvRewriteRef.current && sidebarTab !== 'cv') {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setSidebarTab('cv');
      }, 300);
      prevCvRewriteRef.current = cvRewrite;
      return () => clearTimeout(timer);
    } else if (cvRewrite) {
      // Update ref to track current cvRewrite
      prevCvRewriteRef.current = cvRewrite;
    }
  }, [cvRewrite, sidebarTab, setSidebarTab]);

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
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${
              sidebarTab === 'summary'
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
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${
              sidebarTab === 'navigation'
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
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${
              sidebarTab === 'cv'
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
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                        activeSection === section.id
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
                      <ChevronRight className={`w-4 h-4 transition-all ${
                        activeSection === section.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
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
                className="space-y-4"
              >
                {!cvRewrite ? (
                  // Not generated yet
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                        <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        Generate Tailored Resume
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        Create a tailored version of your resume optimized for this specific job position using AI.
                      </p>
                    </div>
                    
                    <button
                      onClick={onGenerateCVRewrite}
                      disabled={isGeneratingCV}
                      className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {isGeneratingCV ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                          <span className="relative z-10">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Generate Tailored Resume</span>
                        </>
                      )}
                    </button>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                        <span className="font-semibold">AI-Powered:</span> We'll analyze your resume and the job requirements to create an optimized version that maximizes your ATS score.
                      </p>
                    </div>
                  </div>
                ) : (
                  // CV Generated - with premium animation
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      duration: 0.5
                    }}
                    className="space-y-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2
                          }}
                          className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <div>
                          <h3 className="text-sm font-semibold text-green-900 dark:text-green-300">
                            Tailored Resume Generated
                          </h3>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            Ready to view and download
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="space-y-2"
                    >
                      <button
                        onClick={() => navigate(`/ats-analysis/${analysis.id}/cv-rewrite`)}
                        className="w-full px-4 py-3 bg-white dark:bg-[#26262B] border border-gray-200 dark:border-[#2A2A2E] hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all flex items-center justify-between group hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">View Full Resume</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      </button>
                    </motion.div>

                    {/* Score Comparison */}
                    {optimizedScore && analysis && (
                      <CVScoreComparison
                        original={{
                          overall: analysis.match_scores.overall_score,
                          skills: analysis.match_scores.skills_score,
                          experience: analysis.match_scores.experience_score
                        }}
                        optimized={optimizedScore}
                      />
                    )}

                    {/* Loading state for score calculation */}
                    {isCalculatingScore && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2E]"
                      >
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Calculating score...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {cvRewrite?.sections && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2E]"
                      >
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          Resume Sections
                        </p>
                        <div className="space-y-2">
                          {Object.keys(cvRewrite.sections).slice(0, 5).map((section, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + idx * 0.05, duration: 0.3 }}
                              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                            >
                              <Check className="w-3 h-3 text-green-500" />
                              <span className="capitalize">{section.replace('_', ' ')}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
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
          setAnalysis({ ...data, id: analysisDoc.id });
          // Check if CV rewrite exists and load it
          if (data.cv_rewrite) {
            console.log('✅ CV rewrite found in Firebase, loading...', data.cv_rewrite);
            setCvRewrite(data.cv_rewrite);
            // Automatically show CV tab if CV exists
            setSidebarTab('cv');
          } else {
            console.log('ℹ️ No CV rewrite found in Firebase');
            setCvRewrite(null);
          }
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
  useEffect(() => {
    const calculateScore = async () => {
      if (!cvRewrite || !analysis || !analysis.jobDescription) {
        setOptimizedScore(null);
        return;
      }

      setIsCalculatingScore(true);
      try {
        // Get CV text from rewrite (prefer initial_cv markdown)
        const cvText = cvRewrite.initial_cv || 
                      (cvRewrite.structured_data ? JSON.stringify(cvRewrite.structured_data) : '');
        
        if (!cvText) {
          setOptimizedScore(null);
          return;
        }

        // Calculate optimized score
        const optimized = analyzeOptimizedCV(
          cvText,
          analysis.jobDescription
        );

        setOptimizedScore({
          overall: optimized.overall,
          skills: optimized.skills,
          experience: optimized.experience
        });
      } catch (error) {
        console.error('Error calculating optimized score:', error);
        setOptimizedScore(null);
      } finally {
        setIsCalculatingScore(false);
      }
    };

    calculateScore();
  }, [cvRewrite, analysis]);

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ['overview', 'breakdown', 'strengths', 'gaps', 'cv-fixes', 'action-plan', 'learning', 'fit'];
      
      for (const sectionId of sectionIds) {
        const element = sectionsRef.current[sectionId];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 3) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
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
      
      // Extract data from analysis
      const cvText = analysis.cvText || '';
      const topStrengths = analysis.top_strengths?.map((s: any) => s.name) || [];
      const topGaps = analysis.top_gaps?.map((g: any) => g.name) || [];
      const missingKeywords = analysis.match_breakdown?.keywords?.missing || [];
      const matchScore = analysis.match_scores?.overall_score || 0;

      setGenerationStep(1);
      setGenerationProgress(30);

      // Step 2: Generating
      setGenerationStep(2);
      setGenerationProgress(50);

      const result = await generateCVRewrite({
        cvText,
        jobDescription: analysis.jobDescription,
        atsAnalysis: {
          strengths: topStrengths,
          gaps: topGaps,
          keywords: missingKeywords,
          matchScore
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
      {/* Premium CV Generation Modal */}
      <CVGenerationModal
        isOpen={isGeneratingCV}
        progress={generationProgress}
        currentStep={generationStep}
        totalSteps={5}
      />

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
        isCalculatingScore={isCalculatingScore}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
        {/* Premium Expansive Header - SaaS Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-pink-950/20" />
          
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1), transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(99, 102, 241, 0.1), transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.1), transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1), transparent 50%)',
              ]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <div className="relative px-6 sm:px-8 lg:px-12 pt-12 pb-8">
            <div className="max-w-7xl mx-auto lg:pr-96">
              {/* Top Row: Logo + Title + Overall Score */}
              <div className="flex items-start justify-between gap-6 mb-8">
                {/* Left: Logo + Title */}
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  {/* Company Logo - Larger */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900">
                      <img
                        src={`https://logo.clearbit.com/${analysis.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.com`}
                        alt={`${analysis.company} logo`}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/logo-placeholder.svg';
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Title and Info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <motion.h1
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight"
                    >
                      {analysis.jobTitle}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="flex flex-wrap items-center gap-4"
                    >
                      <span className="text-base text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium">
                        <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        {analysis.company}
                      </span>
                      {analysis.location && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">•</span>
                          <span className="text-base text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
                            className="flex items-center gap-2 text-base text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-semibold"
                          >
                            <ExternalLink className="w-5 h-5" />
                            View Job Posting
                          </a>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Right: Overall Match Score - HUGE & POP */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.4
                  }}
                  className="flex-shrink-0"
                >
                  <div className={`relative px-8 py-6 rounded-3xl shadow-2xl border-2 ${
                    analysis.match_scores.overall_score >= 80 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 dark:border-purple-400' 
                      : analysis.match_scores.overall_score >= 60
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-500 dark:border-blue-400'
                      : 'bg-gradient-to-br from-pink-600 to-rose-600 border-pink-500 dark:border-pink-400'
                  }`}>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                    
                    <div className="relative text-center">
                      <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
                        Match Score
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          delay: 0.6
                        }}
                        className={`text-7xl sm:text-8xl font-black text-white leading-none mb-2 ${
                          analysis.match_scores.overall_score >= 80 ? 'drop-shadow-2xl' : ''
                        }`}
                      >
                        {analysis.match_scores.overall_score}
                        <span className="text-4xl sm:text-5xl">%</span>
                      </motion.div>
                      <div className={`text-xs font-semibold text-white/90 uppercase tracking-wide ${
                        analysis.match_scores.overall_score >= 80 ? 'text-purple-100' :
                        analysis.match_scores.overall_score >= 60 ? 'text-blue-100' :
                        'text-pink-100'
                      }`}>
                        {analysis.match_scores.category}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stats Row - Premium Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {[
                  { 
                    label: 'Skills', 
                    value: `${analysis.match_scores.skills_score}%`, 
                    iconColor: analysis.match_scores.skills_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.skills_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                    valueColor: analysis.match_scores.skills_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.skills_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                    icon: <Zap className="w-5 h-5" />
                  },
                  { 
                    label: 'Experience', 
                    value: `${analysis.match_scores.experience_score}%`, 
                    iconColor: analysis.match_scores.experience_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.experience_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                    valueColor: analysis.match_scores.experience_score >= 80 ? 'text-purple-600 dark:text-purple-400' : analysis.match_scores.experience_score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400',
                    icon: <TrendingUp className="w-5 h-5" />
                  },
                  { 
                    label: 'Strengths', 
                    value: analysis.top_strengths.length, 
                    iconColor: 'text-green-600 dark:text-green-400',
                    valueColor: 'text-green-600 dark:text-green-400',
                    icon: <Check className="w-5 h-5" />
                  },
                  { 
                    label: 'Gaps', 
                    value: analysis.top_gaps.length, 
                    iconColor: 'text-red-600 dark:text-red-400',
                    valueColor: 'text-red-600 dark:text-red-400',
                    icon: <AlertCircle className="w-5 h-5" />
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={stat.iconColor}>
                        {stat.icon}
                      </div>
                      <div className={`text-2xl font-bold ${stat.valueColor}`}>
                        {stat.value}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - With right margin for fixed sidebar */}
        <div className="px-4 pb-8 lg:pr-[400px]">
          <div className="max-w-7xl mx-auto">
            <main className="space-y-12">
              {/* Overview - Executive Summary */}
              <motion.div
                ref={(el) => { sectionsRef.current['overview'] = el; }}
                className="scroll-mt-24"
              >
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Executive Summary
                    </h2>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis.executive_summary}
                  </p>
                </div>
              </motion.div>

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
                <div className="grid gap-6 lg:grid-cols-2">
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
                <div className="grid gap-6 lg:grid-cols-2">
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
