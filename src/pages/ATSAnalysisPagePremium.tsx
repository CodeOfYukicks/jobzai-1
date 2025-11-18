import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { generateCVRewrite } from '../lib/cvRewriteService';

// Import premium components
import HeroPremium from '../components/ats-premium/HeroPremium';
import NavigationSidebar, { DEFAULT_SECTIONS } from '../components/ats-premium/NavigationSidebar';
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
      <div className="space-y-6">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
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

export default function ATSAnalysisPagePremium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [analysis, setAnalysis] = useState<PremiumATSAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});
  const sidebarRef = useRef<HTMLElement>(null);

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

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.entries(sectionsRef.current);
      
      for (const [id, element] of sections) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigate to section (forces sidebar to show by scrolling near top)
  const handleNavigate = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      // Smooth scroll - if scrolling to top sections, sidebar will auto-show via hook
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  // Generate CV Rewrite with AI - ULTIMATE QUALITY
  const handleGenerateCVRewrite = async () => {
    if (!analysis || !id || !currentUser) {
      toast.error('Analysis data not available');
      return;
    }

    // Check if we have the necessary data
    if (!analysis.cvText && !analysis.extractedText) {
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
    const toastId = toast.loading('🤖 Generating your optimized CV with AI... This may take up to 60 seconds.', {
      duration: Infinity
    });

    try {
      console.log('🎯 Starting CV Rewrite generation...');

      // Extract data from analysis
      const cvText = analysis.cvText || analysis.extractedText || '';
      const topStrengths = analysis.analysis?.top_strengths?.map((s: any) => s.name) || [];
      const topGaps = analysis.analysis?.top_gaps?.map((g: any) => g.name) || [];
      const missingKeywords = analysis.analysis?.match_breakdown?.keywords?.missing || [];
      const matchScore = analysis.analysis?.match_scores?.overall_score || 0;

      console.log('📊 Analysis data extracted:', {
        cvTextLength: cvText.length,
        strengthsCount: topStrengths.length,
        gapsCount: topGaps.length,
        keywordsCount: missingKeywords.length,
        matchScore
      });

      // Generate the CV with the ULTIMATE prompt
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

      console.log('✅ CV Rewrite generated successfully!');

      // Save to Firestore
      await updateDoc(doc(db, 'users', currentUser.uid, 'analyses', id), {
        cv_rewrite: result,
        cv_rewrite_generated_at: new Date().toISOString()
      });

      console.log('💾 CV Rewrite saved to Firestore');

      toast.success('🎉 CV generated successfully! Redirecting...', { id: toastId });

      // Navigate to CV Rewrite page after a short delay
      setTimeout(() => {
        navigate(`/ats-analysis/${id}/cv-rewrite`);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error generating CV Rewrite:', error);
      
      let errorMessage = 'Failed to generate CV';
      if (error.message?.includes('API key')) {
        errorMessage = 'OpenAI API key is missing. Please configure your environment.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: toastId, duration: 6000 });
    } finally {
      setIsGeneratingCV(false);
    }
  };

  // Prepare navigation sections with counts
  const navSections = DEFAULT_SECTIONS.map(section => ({
    ...section,
    count: section.id === 'strengths' ? analysis?.top_strengths.length :
           section.id === 'gaps' ? analysis?.top_gaps.length :
           section.id === 'learning' ? analysis?.learning_path.resources.length :
           undefined,
  }));

  // Loading State
  if (loading) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Loading your premium analysis...
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Analysis Not Found
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The analysis you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/cv-analysis')}
              className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
        {/* Hero Section */}
        <HeroPremium analysis={analysis} />

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6">
          {/* Horizontal Navigation Menu - Sticky */}
          <NavigationSidebar
            sections={navSections}
            activeSection={activeSection}
            onNavigate={handleNavigate}
            isVisible={true}
            sidebarRef={sidebarRef}
            analysisId={id}
            onGenerateCVRewrite={handleGenerateCVRewrite}
            isGeneratingCV={isGeneratingCV}
            horizontal={true}
          />
          
          <main className="space-y-16 pb-16">
            {/* Overview - Executive Summary */}
            <div
              ref={(el) => { sectionsRef.current['overview'] = el; }}
              className="scroll-mt-32"
            >
              <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                  Analysis Overview
                </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {analysis.match_scores.overall_score}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overall Score</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {analysis.top_strengths.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Top Strengths</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                        {analysis.top_gaps.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gaps to Address</p>
                    </div>
                  </div>
                </div>
              </div>

            {/* Job Summary */}
            <div ref={(el) => { sectionsRef.current['job-summary'] = el; }}>
              <Section
                id="job-summary"
                title="Job Summary"
                description="AI-powered breakdown of what this role really requires"
              >
                <JobSummaryPanel jobSummary={analysis.job_summary} />
              </Section>
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
    </AuthLayout>
  );
}

