import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, DollarSign, Key, AlertCircle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import RecommendationCard from '../components/RecommendationCard';
import CVAnalysisCard from '../components/CVAnalysisCard';
import { analyzeCVWithGPT, CVAnalysis } from '../lib/cvAnalysis';
import { UserData } from '../types';

interface GPTRecommendation {
  type: 'target-companies' | 'application-timing' | 'salary-insights' | 'keyword-optimization';
  prompt: string;
  userData: any;
  result?: any;
}

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    targetCompanies: any | null;
    applicationTiming: any | null;
    salaryInsights: any | null;
    keywordOptimization: any | null;
  }>({
    targetCompanies: null,
    applicationTiming: null,
    salaryInsights: null,
    keywordOptimization: null,
  });

  const [loading, setLoading] = useState<{
    targetCompanies: boolean;
    applicationTiming: boolean;
    salaryInsights: boolean;
    keywordOptimization: boolean;
  }>({
    targetCompanies: false,
    applicationTiming: false,
    salaryInsights: false,
    keywordOptimization: false,
  });

  // Fonction pour charger les recommandations
  const loadRecommendation = async (type: GPTRecommendation['type']) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      // À implémenter avec vos prompts
    } catch (error) {
      console.error(`Error loading ${type} recommendation:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          setUserData(data);

          // If user has a CV, analyze it
          if (data.cvUrl) {
            try {
              setIsAnalyzing(true);
              setAnalysisError(null);
              const analysis = await analyzeCVWithGPT(data.cvUrl, data);
              setCvAnalysis(analysis);
            } catch (error) {
              console.error('Error analyzing CV:', error);
              setAnalysisError('Failed to analyze CV. Please try again later.');
            } finally {
              setIsAnalyzing(false);
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const hasPremiumAccess = userData?.plan === 'standard' || userData?.plan === 'premium';

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                AI Recommendations
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Personalized insights to improve your job search success
              </p>
            </div>
          </div>

          {/* CV Analysis Status */}
          {analysisError ? (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{analysisError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-auto text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                <p className="text-sm text-purple-600 dark:text-purple-400">Analyzing your CV...</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Target Companies Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700
            hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Target Companies
                  </h3>
                  <p className="text-sm text-gray-500">
                    Discover companies that match your profile
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">150+</p>
                <p className="text-xs text-gray-500">Matched Companies</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">85%</p>
                <p className="text-xs text-gray-500">Culture Fit</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">High</p>
                <p className="text-xs text-gray-500">Growth Potential</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Personalized company matches
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Culture fit assessment
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Growth opportunity analysis
              </li>
            </ul>

            <button className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 
              text-white font-medium transition-colors duration-200">
              View Matches
            </button>
          </div>

          {/* Application Timing Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700
            hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Application Timing
                  </h3>
                  <p className="text-sm text-gray-500">
                    Optimize your application timing for maximum success
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Tue</p>
                <p className="text-xs text-gray-500">Best Day</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">10am</p>
                <p className="text-xs text-gray-500">Peak Time</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Q2</p>
                <p className="text-xs text-gray-500">Best Quarter</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Peak hiring season insights
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Industry-specific timing
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Success rate patterns
              </li>
            </ul>

            <button className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 
              text-white font-medium transition-colors duration-200">
              View Insights
            </button>
          </div>

          {/* Salary Insights Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700
            hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Salary Insights
                  </h3>
                  <p className="text-sm text-gray-500">
                    Real-time compensation data for your target roles
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">€45-75k</p>
                <p className="text-xs text-gray-500">Salary Range</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">€60k</p>
                <p className="text-xs text-gray-500">Market Average</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">+8%</p>
                <p className="text-xs text-gray-500">YoY Growth</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Role-based salary ranges
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Benefits benchmarking
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Industry comparisons
              </li>
            </ul>

            <button className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 
              text-white font-medium transition-colors duration-200">
              View Details
            </button>
          </div>

          {/* Keyword Optimization Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700
            hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Keyword Optimization
                  </h3>
                  <p className="text-sm text-gray-500">
                    Optimize your applications for ATS systems
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">12</p>
                <p className="text-xs text-gray-500">Missing Keywords</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">82%</p>
                <p className="text-xs text-gray-500">ATS Score</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">3</p>
                <p className="text-xs text-gray-500">Skills Gap</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Industry-specific terms
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                ATS-friendly suggestions
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Skills gap analysis
              </li>
            </ul>

            <button className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 
              text-white font-medium transition-colors duration-200">
              Optimize Now
            </button>
          </div>
        </div>

        {/* Premium Feature Lock Overlay - if needed */}
        {!userData?.isPremium && (
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 
            border border-purple-200 dark:border-purple-800 rounded-xl">
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
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
