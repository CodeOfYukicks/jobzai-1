import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, DollarSign, Lightbulb, Sparkles, Lock, FileText, RefreshCw } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AIRecommendationCard from '../components/AIRecommendationCard';
import { UserData } from '../types';
import { getClaudeRecommendation, generatePrompt } from '../services/claude';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - Ignoring type checking for these imports
import Lottie from "lottie-react";
// @ts-ignore
import Header from '../components/Header';
// @ts-ignore
import loadingAnimation from "../assets/loading.json";
import { useRecommendations, RecommendationType, getStateKey } from '../contexts/RecommendationsContext';

// Interface for recommendation state
interface RecommendationState {
  targetCompanies: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: any;
  };
  applicationTiming: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: any;
  };
  salaryInsights: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: any;
  };
  jobStrategy: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: any;
  };
}

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(0);
  const { recommendations, setRecommendationLoading, setRecommendationError, setRecommendationData } = useRecommendations();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data from Firebase
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        
        // Calculate profile completeness
        const completeness = calculateProfileCompleteness(data);
        setProfileCompleteness(completeness);
      } else {
        console.log('No user data found');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  // Calculate profile completeness
  const calculateProfileCompleteness = (data: UserData) => {
    const fields = [
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.location,
      data.jobTitle,
      data.industry,
      data.yearsOfExperience,
      data.skills,
      data.education,
      data.cvUrl
    ];
    
    const filledFields = fields.filter(field => {
      if (Array.isArray(field)) {
        return field.length > 0;
      }
      return field !== undefined && field !== null && field !== '';
    }).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  // Add the safelyFormatTimestamp function
  const safelyFormatTimestamp = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    
    try {
      // Handle Firestore timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
      }
      
      // Handle string timestamp
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toISOString();
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      
      // Handle number (milliseconds since epoch)
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toISOString();
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
    }
    
    return undefined;
  };

  // Function to generate proper prompts based on recommendation type
  const getPromptForType = (type: RecommendationType, userData: any): string => {
    const basePrompt = `Generate personalized career recommendations for a user with the following profile:
    - Name: ${userData.firstName} ${userData.lastName}
    - Job Title: ${userData.jobTitle || 'Not specified'}
    - Industry: ${userData.industry || 'Not specified'}
    - Years of Experience: ${userData.yearsOfExperience || 'Not specified'}
    - Skills: ${userData.skills?.join(', ') || 'Not specified'}
    - Education: ${userData.education?.join(', ') || 'Not specified'}
    - Location: ${userData.location || 'Not specified'}
    - CV/Resume: ${userData.cvUrl ? 'Provided' : 'Not provided'}`;
    
    switch (type) {
      case 'target-companies':
        return `${basePrompt}
        
        Please provide a list of 5-7 companies that would be a good match for this user's profile. For each company, include:
        - Company name
        - Match percentage (how well the user's profile matches the company)
        - Growth potential (high, medium, low)
        - Company size
        - Industry
        - Location
        - Suitable roles for the user
        - Why this company is a good match
        
        Also provide a brief summary of why these companies were selected.
        
        Format the response as a JSON object with a "companies" array and a "summary" field.`;
        
      case 'application-timing':
        return `${basePrompt}
        
        Please provide recommendations on the optimal timing for job applications based on this user's profile. Include:
        - Best days of the week to apply
        - Best times of day to apply
        - Best months to apply
        - Best quarter to apply
        - How quickly to apply after a job is posted
        - When to follow up after applying
        - 5-7 specific insights about application timing relevant to this user's profile
        - A brief explanation of why these recommendations were made
        
        Format the response as a JSON object with a "timing" object containing these fields.`;
        
      case 'salary-insights':
        return `${basePrompt}
        
        Please provide salary insights for this user based on their profile. Include:
        - Salary range
        - Average salary
        - Entry-level salary
        - Mid-level salary
        - Senior-level salary
        - Expected salary growth
        - 4-5 negotiation tips
        - 5 important benefits to consider
        - Brief market context
        
        Format the response as a JSON object with a "salary" object containing these fields.`;
        
      case 'job-strategy':
        return `${basePrompt}
        
        Please provide a comprehensive job search strategy for this user based on their profile. Include:
        - 5 skills to highlight (skill name and reason)
        - 3 skills to develop (skill name, reason, and a resource to learn it)
        - ATS optimization tips (score and 3 resume tips)
        - Networking strategy (overall strategy, 3 target groups with names and values, and 2 relevant events)
        - Application strategy (approach and 3 optimization tips)
        
        Format the response as a JSON object with a "strategy" object containing these fields.`;
        
      default:
        return basePrompt;
    }
  };

  // Generate recommendation using Claude
  const generateRecommendation = async (type: RecommendationType) => {
    if (!userData) {
      console.error('No user data available');
      return;
    }
    
    // Set loading state
    setRecommendationLoading(type, true);
    
    try {
      // Generate the prompt based on the recommendation type
      const prompt = getPromptForType(type, userData);
      
      // Call the Claude API to get the recommendation
      const response = await getClaudeRecommendation(prompt, type);
      
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

  // Check if user has premium access
  const hasPremiumAccess = userData?.isPremium || userData?.plan === 'premium' || userData?.plan === 'standard';

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
            
            {userData?.cvUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <FileText className="h-4 w-4 text-green-500" />
                <span>CV/Resume loaded</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile Completeness Alert - if profile is incomplete */}
        {profileCompleteness < 80 && (
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
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Complete your profile for better recommendations
                </h3>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Your profile is {profileCompleteness}% complete. Add more information to get more accurate AI recommendations.
                </p>
                <div className="mt-2 w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-1.5">
                  <div 
                    className="bg-amber-500 dark:bg-amber-500 h-1.5 rounded-full" 
                    style={{ width: `${profileCompleteness}%` }}
                  ></div>
                </div>
              </div>
              <button className="ml-auto px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 
                bg-amber-100 dark:bg-amber-900/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                Complete Profile
              </button>
        </div>
          </motion.div>
        )}

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Target Companies Card */}
          <AIRecommendationCard
            type="target-companies"
            title="Target Companies"
            description="Discover companies that match your profile"
            isLoading={recommendations.targetCompanies.isLoading}
            error={recommendations.targetCompanies.error || undefined}
            data={recommendations.targetCompanies.data}
            lastUpdated={recommendations.targetCompanies.lastUpdated}
            onAction={() => generateRecommendation('target-companies')}
            actionLabel={recommendations.targetCompanies.data ? "Refresh Matches" : "Generate Matches"}
          />

          {/* Application Timing Card */}
          <AIRecommendationCard
            type="application-timing"
            title="Application Timing"
            description="Optimize your application timing for maximum success"
            isLoading={recommendations.applicationTiming.isLoading}
            error={recommendations.applicationTiming.error || undefined}
            data={recommendations.applicationTiming.data}
            lastUpdated={recommendations.applicationTiming.lastUpdated}
            onAction={() => generateRecommendation('application-timing')}
            actionLabel={recommendations.applicationTiming.data ? "Refresh Insights" : "Generate Insights"}
          />

          {/* Salary Insights Card */}
          <AIRecommendationCard
            type="salary-insights"
            title="Salary Insights"
            description="Real-time compensation data for your target roles"
            isLoading={recommendations.salaryInsights.isLoading}
            error={recommendations.salaryInsights.error || undefined}
            data={recommendations.salaryInsights.data}
            lastUpdated={recommendations.salaryInsights.lastUpdated}
            onAction={() => generateRecommendation('salary-insights')}
            actionLabel={recommendations.salaryInsights.data ? "Refresh Details" : "Generate Details"}
          />

          {/* Job Strategy Card */}
          <AIRecommendationCard
            type="job-strategy"
            title="Job Strategy"
            description="Optimize your applications and highlight key skills"
            isLoading={recommendations.jobStrategy.isLoading}
            error={recommendations.jobStrategy.error || undefined}
            data={recommendations.jobStrategy.data}
            lastUpdated={recommendations.jobStrategy.lastUpdated}
            onAction={() => generateRecommendation('job-strategy')}
            actionLabel={recommendations.jobStrategy.data ? "Refresh Strategy" : "Generate Strategy"}
          />
        </div>

        {/* Premium Feature Lock Overlay - if needed */}
        {!hasPremiumAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 p-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 
              border border-purple-200 dark:border-purple-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Upgrade to Premium to unlock all AI recommendations
              </p>
              <button className="ml-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 
                text-white text-sm font-medium transition-colors duration-200">
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
                Our AI analyzes your profile information and CV to understand your skills, experience, and preferences.
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
