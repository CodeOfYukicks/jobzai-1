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
      skillsMatch: analysisData.skillsMatch ? {
        matchingCount: analysisData.skillsMatch.matching?.length || 0,
        missingCount: analysisData.skillsMatch.missing?.length || 0,
        topMatching: analysisData.skillsMatch.matching?.slice(0, 5).map((s: any) => s.name || s),
        topMissing: analysisData.skillsMatch.missing?.slice(0, 5).map((s: any) => s.name || s),
      } : null,
      categoryScores: analysisData.categoryScores || analysisData.category_scores,
      executiveSummary: analysisData.executiveSummary?.substring(0, 500) || analysisData.executive_summary?.substring(0, 500),
      recommendations: analysisData.recommendations?.slice(0, 3).map((r: any) => ({
        title: r.title,
        priority: r.priority,
      })),
      atsScore: analysisData.atsOptimization?.score || analysisData.ats_score,
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

