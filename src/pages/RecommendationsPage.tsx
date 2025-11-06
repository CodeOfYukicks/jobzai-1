import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, Clock, DollarSign, Lightbulb, Sparkles, Lock, FileText, 
  RefreshCw, TrendingUp, Target, BarChart3, MapPin, Briefcase,
  GraduationCap, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AIRecommendationCard from '../components/AIRecommendationCard';
import { getClaudeRecommendation, generateEnhancedPrompt, RecommendationType } from '../services/claude';
import { useNavigate } from 'react-router-dom';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';

type TabType = 'all' | 'companies' | 'career' | 'skills' | 'market' | 'strategy';

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [completeUserData, setCompleteUserData] = useState<CompleteUserData | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(0);
  const { recommendations, setRecommendationLoading, setRecommendationError, setRecommendationData } = useRecommendations();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const navigate = useNavigate();

  // Generate recommendation using ChatGPT
  const generateRecommendation = async (type: RecommendationType) => {
    if (!completeUserData) {
      console.error('No user data available');
      return;
    }
    
    // Set loading state
    setRecommendationLoading(type, true);
    
    try {
      // Generate the enhanced prompt with all user data
      const prompt = generateEnhancedPrompt(type, completeUserData);
      
      // Call the ChatGPT API to get the recommendation
      const response = await getClaudeRecommendation(
        prompt, 
        type, 
        completeUserData.cvContent || null
      );
      
      if (response.error) {
        setRecommendationError(type, response.error);
      } else {
        setRecommendationData(type, response.data);
      }
    } catch (error) {
      console.error(`Error generating ${type} recommendation:`, error);
      setRecommendationError(type, 'Failed to generate recommendation. Please try again.');
    }
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
        
        // Auto-load only the most important recommendation (Target Companies) if it doesn't exist
        // Other recommendations will be loaded on demand to avoid long loading times
        if (!recommendations.targetCompanies?.data && data.cvUrl) {
          // Only load if user has a CV
          setRecommendationLoading('target-companies', true);
          
          try {
            const prompt = generateEnhancedPrompt('target-companies', data);
            const response = await getClaudeRecommendation(
              prompt, 
              'target-companies', 
              data.cvContent || null
            );
            
            if (response.error) {
              setRecommendationError('target-companies', response.error);
            } else {
              setRecommendationData('target-companies', response.data);
            }
          } catch (error) {
            console.error('Error generating target-companies recommendation:', error);
            setRecommendationError('target-companies', 'Failed to generate recommendation. Please try again.');
          }
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

  // Calculate profile completeness - matching ProfessionalProfilePage logic
  const calculateProfileCompleteness = (data: CompleteUserData | null) => {
    if (!data) return 0;
    
    // Use the same fields as ProfessionalProfilePage
    const requiredFields = [
      // Personal Information
      { key: 'firstName', value: data.firstName },
      { key: 'lastName', value: data.lastName },
      { key: 'email', value: data.email },
      { key: 'gender', value: (data as any).gender },
      { key: 'location', value: data.location },
      { key: 'contractType', value: data.contractType },
      
      // Location & Mobility
      { key: 'willingToRelocate', value: data.willingToRelocate },
      { key: 'workPreference', value: data.workPreference },
      { key: 'travelPreference', value: data.travelPreference },
      
      // Experience & Expertise
      { key: 'yearsOfExperience', value: data.yearsOfExperience },
      { key: 'currentPosition', value: data.currentPosition || data.jobTitle },
      { key: 'skills', value: data.skills },
      { key: 'tools', value: data.tools },
      
      // Documents & Links
      { key: 'cvUrl', value: data.cvUrl },
      { key: 'linkedinUrl', value: data.linkedinUrl },
      
      // Professional Objectives
      { key: 'targetPosition', value: data.targetPosition },
      { key: 'targetSectors', value: data.targetSectors },
      { key: 'salaryExpectations', value: data.salaryExpectations },
      
      // Preferences & Priorities
      { key: 'workLifeBalance', value: data.workLifeBalance },
      { key: 'companyCulture', value: data.companyCulture },
      { key: 'preferredCompanySize', value: data.preferredCompanySize }
    ];

    let completedFields = 0;

    requiredFields.forEach(({ key, value }) => {
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === 'object' && value !== null) {
        // For objects like salaryExpectations
        if (Object.values(value).some(v => v !== '' && v !== null && v !== undefined)) completedFields++;
      } else if (key === 'willingToRelocate') {
        // willingToRelocate is a boolean, false is a valid value (means "not willing")
        if (value === true || value === false) completedFields++;
      } else if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });

    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    return isNaN(percentage) ? 0 : percentage;
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
    
    // Generate all recommendations in parallel
    await Promise.all(allTypes.map(async (type) => {
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
        } else {
          setRecommendationData(type, response.data);
        }
      } catch (error) {
        console.error(`Error generating ${type} recommendation:`, error);
        setRecommendationError(type, 'Failed to generate recommendation. Please try again.');
      }
    }));
  };

  // Check if user has premium access
  const hasPremiumAccess = completeUserData?.isPremium || completeUserData?.plan === 'premium' || completeUserData?.plan === 'standard';

  // Filter recommendations based on active tab
  const getFilteredRecommendations = () => {
    const allRecommendations = [
      {
        type: 'target-companies' as RecommendationType,
        title: 'Target Companies',
        description: 'Discover companies that match your profile',
        icon: Building,
        color: 'purple',
        data: recommendations.targetCompanies || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'companies' as TabType
      },
      {
        type: 'career-path' as RecommendationType,
        title: 'Career Path',
        description: 'Personalized career path recommendations',
        icon: TrendingUp,
        color: 'blue',
        data: recommendations.careerPath || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'career' as TabType
      },
      {
        type: 'skills-gap' as RecommendationType,
        title: 'Skills Gap Analysis',
        description: 'Identify skills to develop and strengthen',
        icon: GraduationCap,
        color: 'green',
        data: recommendations.skillsGap || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'skills' as TabType
      },
      {
        type: 'market-insights' as RecommendationType,
        title: 'Market Insights',
        description: 'Job market trends and opportunities',
        icon: BarChart3,
        color: 'orange',
        data: recommendations.marketInsights || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'market' as TabType
      },
      {
        type: 'application-timing' as RecommendationType,
        title: 'Application Timing',
        description: 'Optimize your application timing',
        icon: Clock,
        color: 'cyan',
        data: recommendations.applicationTiming || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'strategy' as TabType
      },
      {
        type: 'salary-insights' as RecommendationType,
        title: 'Salary Insights',
        description: 'Real-time compensation data',
        icon: DollarSign,
        color: 'emerald',
        data: recommendations.salaryInsights || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'strategy' as TabType
      },
      {
        type: 'job-strategy' as RecommendationType,
        title: 'Job Strategy',
        description: 'Optimize your applications and skills',
        icon: Lightbulb,
        color: 'amber',
        data: recommendations.jobStrategy || { isLoading: false, error: null, data: null, lastUpdated: null },
        tab: 'strategy' as TabType
      }
    ];

    if (activeTab === 'all') {
      return allRecommendations;
    }

    return allRecommendations.filter(rec => rec.tab === activeTab);
  };

  // Calculate quick stats
  const quickStats = {
    matchScore: recommendations.targetCompanies?.data?.companies?.[0]?.match || 'N/A',
    companiesFound: recommendations.targetCompanies?.data?.companies?.length || 0,
    skillsGap: recommendations.skillsGap?.data?.skills_gap?.critical_missing_skills?.length || 0,
    careerPaths: recommendations.careerPath?.data?.career_paths?.length || 0
  };

  // Don't block the page while loading - show content immediately
  // if (isLoading) {
  //   return (
  //     <AuthLayout>
  //       <div className="flex items-center justify-center min-h-screen">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
  //           <p className="mt-4 text-gray-500">Loading your recommendations...</p>
  //         </div>
  //       </div>
  //     </AuthLayout>
  //   );
  // }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                AI Recommendations
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Personalized insights to improve your job search success
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {completeUserData?.cvUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <FileText className="h-4 w-4 text-green-500" />
                <span>CV/Resume loaded</span>
              </div>
            )}
              
              <button
                onClick={refreshAllRecommendations}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh All</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Profile Completeness Alert */}
        {completeUserData && profileCompleteness < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Complete your profile for better recommendations
                </h3>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Your profile is {profileCompleteness}% complete. Add more information to get more accurate AI recommendations.
                </p>
                <div className="mt-2 w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-1.5">
                  <div 
                    className="bg-amber-500 dark:bg-amber-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${profileCompleteness}%` }}
                  ></div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/professional-profile')}
                className="ml-auto px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 
                  bg-amber-100 dark:bg-amber-900/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                Complete Profile
              </button>
        </div>
          </motion.div>
        )}

        {/* Quick Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.matchScore}</p>
                <p className="text-xs text-gray-500">Top Match</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.companiesFound}</p>
                <p className="text-xs text-gray-500">Companies</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.skillsGap}</p>
                <p className="text-xs text-gray-500">Skills Gap</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.careerPaths}</p>
                <p className="text-xs text-gray-500">Career Paths</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'all' as TabType, label: 'All', icon: Zap },
              { id: 'companies' as TabType, label: 'Companies', icon: Building },
              { id: 'career' as TabType, label: 'Career', icon: TrendingUp },
              { id: 'skills' as TabType, label: 'Skills', icon: GraduationCap },
              { id: 'market' as TabType, label: 'Market', icon: BarChart3 },
              { id: 'strategy' as TabType, label: 'Strategy', icon: Lightbulb }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {getFilteredRecommendations().map((rec, index) => (
            <motion.div
              key={rec.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
          <AIRecommendationCard
                type={rec.type}
                title={rec.title}
                description={rec.description}
                isLoading={rec.data.isLoading}
                error={rec.data.error || undefined}
                data={rec.data.data}
                lastUpdated={rec.data.lastUpdated}
                onAction={async () => {
                  if (!completeUserData) return;
                  setRecommendationLoading(rec.type, true);
                  try {
                    const prompt = generateEnhancedPrompt(rec.type, completeUserData);
                    const response = await getClaudeRecommendation(
                      prompt, 
                      rec.type, 
                      completeUserData.cvContent || null
                    );
                    if (response.error) {
                      setRecommendationError(rec.type, response.error);
                    } else {
                      setRecommendationData(rec.type, response.data);
                    }
                  } catch (error) {
                    console.error(`Error generating ${rec.type} recommendation:`, error);
                    setRecommendationError(rec.type, 'Failed to generate recommendation. Please try again.');
                  }
                }}
                actionLabel="Refresh"
                showActionButton={false}
              />
            </motion.div>
          ))}
        </div>

        {/* Premium Feature Lock Overlay */}
        {!hasPremiumAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 p-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 
              border border-purple-200 dark:border-purple-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Upgrade to Premium to unlock all AI recommendations
              </p>
              <button 
                onClick={() => navigate('/pricing')}
                className="ml-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 
                  text-white text-sm font-medium transition-colors duration-200"
              >
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How AI Recommendations Work
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                1. Profile Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Our AI analyzes your complete profile, CV, skills, experience, and preferences to understand your career goals.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mb-3">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                2. AI Processing
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Claude AI processes your data and generates personalized recommendations based on market trends and best practices.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mb-3">
                <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                3. Actionable Insights
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You receive tailored recommendations that you can immediately apply to improve your job search strategy.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
