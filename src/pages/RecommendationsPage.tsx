import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { getClaudeRecommendation, generateEnhancedPrompt, RecommendationType } from '../services/claude';
import { useNavigate } from 'react-router-dom';
import { useRecommendations, getStateKey } from '../contexts/RecommendationsContext';
import { useRecommendationsLoading } from '../contexts/RecommendationsLoadingContext';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';
import { toast } from 'sonner';
import LoadingStartModal from '../components/recommendations/LoadingStartModal';

// Import new section components
import HeroSection from '../components/recommendations/HeroSection';
import ProfileCompletenessGate from '../components/recommendations/ProfileCompletenessGate';
import TargetCompaniesSection from '../components/recommendations/TargetCompaniesSection';
import CareerPathSection from '../components/recommendations/CareerPathSection';
import SkillsGapSection from '../components/recommendations/SkillsGapSection';
import JobStrategySection from '../components/recommendations/JobStrategySection';
import MarketInsightsSection from '../components/recommendations/MarketInsightsSection';
import ApplicationTimingSection from '../components/recommendations/ApplicationTimingSection';
import SalaryInsightsSection from '../components/recommendations/SalaryInsightsSection';

// Map recommendation types to user-friendly names
const RECOMMENDATION_NAMES: Record<RecommendationType, string> = {
  'target-companies': 'Target Companies',
  'career-path': 'Career Path',
  'skills-gap': 'Skills Gap',
  'market-insights': 'Market Insights',
  'application-timing': 'Application Timing',
  'salary-insights': 'Salary Insights',
  'job-strategy': 'Job Strategy'
};

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [completeUserData, setCompleteUserData] = useState<CompleteUserData | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(0);
  const { recommendations, setRecommendationLoading, setRecommendationError, setRecommendationData } = useRecommendations();
  const { loadingState, startLoading, updateProgress, stopLoading, setMinimized, closeStartModal } = useRecommendationsLoading();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const completedRecommendationsRef = useRef<Set<RecommendationType>>(new Set());

  // Generate recommendation
  const generateRecommendation = async (type: RecommendationType, showNotification = true) => {
    if (!completeUserData) {
      console.error('No user data available');
      return;
    }
    
    setRecommendationLoading(type, true);
    
    try {
      const prompt = generateEnhancedPrompt(type, completeUserData);
      const response = await getClaudeRecommendation(
        prompt, 
        type, 
        completeUserData.cvContent || null
      );
      
      if (response.error) {
        setRecommendationError(type, response.error);
        if (showNotification) {
          toast.error(`Failed to generate ${RECOMMENDATION_NAMES[type]}: ${response.error}`);
        }
      } else {
        setRecommendationData(type, response.data);
        
        // Show notification when a recommendation is completed (only if not already shown)
        if (showNotification && !completedRecommendationsRef.current.has(type)) {
          completedRecommendationsRef.current.add(type);
          toast.success(`${RECOMMENDATION_NAMES[type]} ready! ✨`, {
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error(`Error generating ${type} recommendation:`, error);
      setRecommendationError(type, 'Failed to generate recommendation. Please try again.');
      if (showNotification) {
        toast.error(`Failed to generate ${RECOMMENDATION_NAMES[type]}. Please try again.`);
      }
    } finally {
      setRecommendationLoading(type, false);
    }
  };

  // Refresh all recommendations
  const refreshAllRecommendations = async () => {
    if (!completeUserData) return;
    
    const allTypes: RecommendationType[] = [
      'target-companies',
      'career-path',
      'skills-gap',
      'market-insights',
      'application-timing',
      'salary-insights',
      'job-strategy'
    ];
    
    // Reset state
    completedRecommendationsRef.current.clear();
    startLoading(allTypes.length, "Refreshing your AI recommendations");
    
    const total = allTypes.length;
    let completed = 0;
    
    // Load recommendations sequentially to show progress
    for (const type of allTypes) {
      await generateRecommendation(type, true);
      completed++;
      const progress = Math.round((completed / total) * 100);
      updateProgress(completed, progress);
    }
    
    // Small delay to show 100% before closing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Close modal first, then stop loading
    closeStartModal();
    await new Promise(resolve => setTimeout(resolve, 300));
    stopLoading();
    
    // Show completion toast
    toast.success('All recommendations are ready! 🎉', {
      duration: 5000,
    });
  };

  // Fetch complete user data and auto-load recommendations
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCompleteUserData(currentUser.uid);
        setCompleteUserData(data);
        
        // Calculate profile completeness
        const completeness = calculateProfileCompleteness(data);
        console.log('Profile completeness calculated:', completeness);
        setProfileCompleteness(completeness);
        
        // Only auto-load recommendations if profile is at least 70% complete
        const MIN_PROFILE_COMPLETENESS = 70;
        
        if (completeness >= MIN_PROFILE_COMPLETENESS) {
          // Auto-load key recommendations in parallel
          const keyRecommendations: RecommendationType[] = [
            'target-companies',
            'career-path',
            'skills-gap',
            'job-strategy'
          ];
          
          // Filter to only load recommendations that don't already have data
          const recommendationsToLoad = keyRecommendations.filter(type => {
            const key = getStateKey(type);
            return !recommendations[key]?.data;
          });
          
          // Load recommendations sequentially to show progress
          if (recommendationsToLoad.length > 0) {
            // Reset state
            completedRecommendationsRef.current.clear();
            startLoading(recommendationsToLoad.length, "Generating your AI recommendations");
            
            const total = recommendationsToLoad.length;
            let completed = 0;
            
            for (const type of recommendationsToLoad) {
              await generateRecommendation(type, true);
              completed++;
              const progress = Math.round((completed / total) * 100);
              updateProgress(completed, progress);
            }
            
            // Small delay to show 100% before closing
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Close modal first, then stop loading
            closeStartModal();
            await new Promise(resolve => setTimeout(resolve, 300));
            stopLoading();
            
            // Show completion toast
            toast.success('All recommendations are ready! 🎉', {
              duration: 5000,
            });
          }
        } else {
          console.log(`Profile completeness (${completeness}%) is below minimum (${MIN_PROFILE_COMPLETENESS}%). Recommendations will not be auto-loaded.`);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  // Calculate profile completeness
  const calculateProfileCompleteness = (data: CompleteUserData | null) => {
    if (!data) return 0;
    
    const requiredFields = [
      { key: 'firstName', value: data.firstName },
      { key: 'lastName', value: data.lastName },
      { key: 'email', value: data.email },
      { key: 'gender', value: (data as any).gender },
      { key: 'location', value: data.location },
      { key: 'contractType', value: data.contractType },
      { key: 'willingToRelocate', value: data.willingToRelocate },
      { key: 'workPreference', value: data.workPreference },
      { key: 'travelPreference', value: data.travelPreference },
      { key: 'yearsOfExperience', value: data.yearsOfExperience },
      { key: 'currentPosition', value: data.currentPosition || data.jobTitle },
      { key: 'skills', value: data.skills },
      { key: 'tools', value: data.tools },
      { key: 'cvUrl', value: data.cvUrl },
      { key: 'linkedinUrl', value: data.linkedinUrl },
      { key: 'targetPosition', value: data.targetPosition },
      { key: 'targetSectors', value: data.targetSectors },
      { key: 'salaryExpectations', value: data.salaryExpectations },
      { key: 'workLifeBalance', value: data.workLifeBalance },
      { key: 'companyCulture', value: data.companyCulture },
      { key: 'preferredCompanySize', value: data.preferredCompanySize }
    ];

    let completedFields = 0;

    requiredFields.forEach(({ key, value }) => {
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === 'object' && value !== null) {
        if (Object.values(value).some(v => v !== '' && v !== null && v !== undefined)) completedFields++;
      } else if (key === 'willingToRelocate') {
        if (value === true || value === false) completedFields++;
      } else if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });

    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    return isNaN(percentage) ? 0 : percentage;
  };

  // Calculate quick stats
  const quickStats = {
    matchScore: recommendations.targetCompanies?.data?.companies?.[0]?.match || 'N/A',
    companiesFound: recommendations.targetCompanies?.data?.companies?.length || 0,
    skillsGap: recommendations.skillsGap?.data?.skills_gap?.critical_missing_skills?.length || 0,
    careerPaths: recommendations.careerPath?.data?.career_paths?.length || 0
  };

  // Show loading state while checking profile completeness
  if (isLoading || !completeUserData) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading your recommendations...</p>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // If profile is not complete enough, show only the gate (no hero section, no banner)
  if (profileCompleteness < 70) {
    return (
      <AuthLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfileCompletenessGate profileCompleteness={profileCompleteness} />
        </div>
      </AuthLayout>
    );
  }

  const isGenerating = loadingState.isGenerating;

  return (
    <AuthLayout>
      {/* Loading Modal - only on Recommendations page, stays visible during loading */}
      <LoadingStartModal
        isOpen={isGenerating && loadingState.showStartModal}
        onClose={closeStartModal}
        message="Your AI recommendations are being generated in the background. You can continue browsing using the menu on the left, we'll notify you when they're ready!"
      />
      
      {/* Blur overlay ONLY for page content - sidebar remains accessible */}
      <div className="relative">
        {isGenerating && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-xl" />
          </div>
        )}
        
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative ${isGenerating ? 'pointer-events-none select-none' : ''}`}>
        {/* Hero Section */}
        <HeroSection
          completeUserData={completeUserData}
          profileCompleteness={profileCompleteness}
          quickStats={quickStats}
          onRefresh={refreshAllRecommendations}
          isLoading={isLoading}
        />

        {/* Main Recommendations Sections */}
        <div className="space-y-16">
          {/* Target Companies Section - Full Width */}
          <TargetCompaniesSection
            data={recommendations.targetCompanies?.data}
            isLoading={recommendations.targetCompanies?.isLoading || false}
            error={recommendations.targetCompanies?.error || null}
            onRefresh={() => generateRecommendation('target-companies')}
          />

          {/* Career Path Section - Full Width */}
          <CareerPathSection
            data={recommendations.careerPath?.data}
            isLoading={recommendations.careerPath?.isLoading || false}
            error={recommendations.careerPath?.error || null}
            onRefresh={() => generateRecommendation('career-path')}
          />

          {/* Skills Gap Analysis Section - Full Width */}
          <SkillsGapSection
            data={recommendations.skillsGap?.data}
            isLoading={recommendations.skillsGap?.isLoading || false}
            error={recommendations.skillsGap?.error || null}
            onRefresh={() => generateRecommendation('skills-gap')}
          />

          {/* Job Search Strategy Section - Full Width */}
          <JobStrategySection
            data={recommendations.jobStrategy?.data}
            isLoading={recommendations.jobStrategy?.isLoading || false}
            error={recommendations.jobStrategy?.error || null}
            onRefresh={() => generateRecommendation('job-strategy')}
          />
          
          {/* Market Insights Section - Full Width */}
          <MarketInsightsSection
            data={recommendations.marketInsights?.data}
            isLoading={recommendations.marketInsights?.isLoading || false}
            error={recommendations.marketInsights?.error || null}
            onRefresh={() => generateRecommendation('market-insights')}
          />

          {/* Application Timing & Salary Insights - Two Columns (Sidebar Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApplicationTimingSection
              data={recommendations.applicationTiming?.data}
              isLoading={recommendations.applicationTiming?.isLoading || false}
              error={recommendations.applicationTiming?.error || null}
              onRefresh={() => generateRecommendation('application-timing')}
            />

            <SalaryInsightsSection
              data={recommendations.salaryInsights?.data}
              isLoading={recommendations.salaryInsights?.isLoading || false}
              error={recommendations.salaryInsights?.error || null}
              onRefresh={() => generateRecommendation('salary-insights')}
            />
          </div>
        </div>
        </div>
      </div>
    </AuthLayout>
  );
}
