import { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import ATSAnalysisPage from './ATSAnalysisPage';
import ATSAnalysisPagePremium from './ATSAnalysisPagePremium';
import { useAssistantPageData } from '../hooks/useAssistantPageData';

/**
 * Smart Router for ATS Analysis
 * Automatically detects if analysis is premium or legacy format
 * and routes to the appropriate page component
 */
export default function ATSAnalysisRouter() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [analysisType, setAnalysisType] = useState<'premium' | 'legacy' | 'loading' | 'error'>('loading');
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    const detectAnalysisType = async () => {
      if (!id || !currentUser) {
        setAnalysisType('error');
        return;
      }

      try {
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
        
        if (!analysisDoc.exists()) {
          console.error('Analysis not found:', id);
          setAnalysisType('error');
          return;
        }

        const data = analysisDoc.data();
        setAnalysisData(data); // Store for AI context
        
        // Detect if it's a premium analysis
        // Premium analyses have these fields: type='premium', match_scores, job_summary, etc.
        if (data.type === 'premium' || data.match_scores || data.job_summary) {
          console.log('✅ Detected PREMIUM analysis');
          setAnalysisType('premium');
        } else {
          console.log('✅ Detected LEGACY analysis');
          setAnalysisType('legacy');
        }
      } catch (error) {
        console.error('Error detecting analysis type:', error);
        setAnalysisType('error');
      }
    };

    detectAnalysisType();
  }, [id, currentUser]);

  // Register analysis detail context with AI Assistant
  const analysisDetailSummary = useMemo(() => {
    if (!analysisData || !id) return null;

    // Extract all matching and missing skills (not just top 5)
    const allMatchingSkills = analysisData.skillsMatch?.matching?.map((s: any) => s.name || s) || [];
    const allMissingSkills = analysisData.skillsMatch?.missing?.map((s: any) => s.name || s) || [];

    // Extract all recommendations with full details
    const allRecommendations = analysisData.recommendations?.map((r: any) => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      category: r.category,
      impact: r.impact,
    })) || [];

    // Premium analysis specific fields
    const premiumFields = analysisType === 'premium' ? {
      // Job summary from premium analysis
      jobSummary: analysisData.job_summary ? {
        company: analysisData.job_summary.company,
        title: analysisData.job_summary.title,
        location: analysisData.job_summary.location,
        type: analysisData.job_summary.type,
        experience: analysisData.job_summary.experience,
        description: analysisData.job_summary.description?.substring(0, 1000), // Limit description
        keyResponsibilities: analysisData.job_summary.key_responsibilities?.slice(0, 10) || [],
        requiredQualifications: analysisData.job_summary.required_qualifications?.slice(0, 10) || [],
        preferredQualifications: analysisData.job_summary.preferred_qualifications?.slice(0, 10) || [],
        benefits: analysisData.job_summary.benefits?.slice(0, 10) || [],
      } : null,
      // Premium match scores breakdown
      matchScores: analysisData.match_scores ? {
        overall: analysisData.match_scores.overall,
        skills: analysisData.match_scores.skills,
        experience: analysisData.match_scores.experience,
        education: analysisData.match_scores.education,
        keywords: analysisData.match_scores.keywords,
      } : null,
      // Category scores detailed
      categoryScoresDetailed: analysisData.category_scores || null,
      // Has CV rewrite
      hasCVRewrite: !!(analysisData.cv_rewrite || analysisData.cv_rewrite_generated_at),
    } : {};

    // ATS optimization details
    const atsOptimization = analysisData.atsOptimization || analysisData.ats_optimization ? {
      score: analysisData.atsOptimization?.score || analysisData.ats_optimization?.score,
      feedback: analysisData.atsOptimization?.feedback || analysisData.ats_optimization?.feedback || [],
      strengths: analysisData.atsOptimization?.strengths || analysisData.ats_optimization?.strengths || [],
      improvements: analysisData.atsOptimization?.improvements || analysisData.ats_optimization?.improvements || [],
    } : null;

    return {
      pagePath: `/ats-analysis/${id}`,
      viewMode: 'analysis-detail',
      analysisId: id,
      isPremiumAnalysis: analysisType === 'premium',
      company: analysisData.company || analysisData.job_company,
      jobTitle: analysisData.jobTitle || analysisData.job_title,
      matchScore: analysisData.matchScore || analysisData.match_scores?.overall,
      date: analysisData.date || analysisData.created_at,
      // Key insights for AI context
      keyFindings: analysisData.keyFindings || analysisData.key_findings || [],
      // Complete skills information
      skillsMatch: {
        matchingCount: allMatchingSkills.length,
        missingCount: allMissingSkills.length,
        allMatchingSkills, // All matching skills, not just top 5
        allMissingSkills, // All missing skills, not just top 5
        topMatching: allMatchingSkills.slice(0, 10), // Top 10 for quick reference
        topMissing: allMissingSkills.slice(0, 10), // Top 10 for quick reference
      },
      // Complete category scores
      categoryScores: analysisData.categoryScores || analysisData.category_scores,
      // Full executive summary
      executiveSummary: analysisData.executiveSummary || analysisData.executive_summary,
      // All recommendations with details
      recommendations: allRecommendations,
      topRecommendations: allRecommendations.slice(0, 5), // Top 5 for quick reference
      // ATS optimization details
      atsOptimization,
      atsScore: analysisData.atsOptimization?.score || analysisData.ats_score,
      // Premium analysis fields
      ...premiumFields,
      // Legacy fields
      weakAreas: analysisData.weakAreas || [],
      strengths: analysisData.strengths || [],
    };
  }, [analysisData, id, analysisType]);

  useAssistantPageData('analysisDetail', analysisDetailSummary, !!analysisData);

  // Loading state
  if (analysisType === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisType === 'error') {
    return <Navigate to="/cv-analysis" replace />;
  }

  // Route to appropriate component
  if (analysisType === 'premium') {
    return <ATSAnalysisPagePremium />;
  }

  return <ATSAnalysisPage />;
}

