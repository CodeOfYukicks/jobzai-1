import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import ProfileTagsCloud from '../components/career-intelligence/ProfileTagsCloud';
import InsightCard from '../components/career-intelligence/InsightCard';
import NextMoveInsight from '../components/career-intelligence/NextMoveInsight';
import SkillsInsight from '../components/career-intelligence/SkillsInsight';
import ActionPlanInsight from '../components/career-intelligence/ActionPlanInsight';
import { generateCareerInsights, CareerInsightsData } from '../services/careerIntelligence';
import { toast } from '@/contexts/ToastContext';

export default function CareerIntelligencePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<CompleteUserData | null>(null);
  const [insights, setInsights] = useState<CareerInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load user data
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCompleteUserData(currentUser.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  // Generate insights
  const handleGenerateInsights = async () => {
    if (!userData) return;
    
    setIsGenerating(true);
    try {
      const result = await generateCareerInsights(userData);
      setInsights(result);
      setLastUpdated(new Date());
      toast.success('Insights generated successfully');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on first load with data
  useEffect(() => {
    if (userData && !insights && !isGenerating) {
      handleGenerateInsights();
    }
  }, [userData]);

  const handleCardToggle = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Get user headline
  const getUserHeadline = () => {
    if (!userData) return '';
    
    const position = userData.targetPosition || userData.currentPosition || userData.jobTitle;
    const location = userData.city && userData.country 
      ? `${userData.city}, ${userData.country}`
      : userData.location;
    
    if (position && location) {
      return `${position} in ${location}`;
    }
    return position || 'Building your career path';
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0B] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Loading your career data...
            </p>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0B]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-12"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                  Career Intelligence
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-400">
                  {getUserHeadline()}
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 
                  bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Refresh'}
              </motion.button>
            </div>

            {/* Profile Tags */}
            {userData?.profileTags && userData.profileTags.length > 0 && (
              <ProfileTagsCloud tags={userData.profileTags} />
            )}
          </motion.header>

          {/* Generating State */}
          <AnimatePresence>
            {isGenerating && !insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Analyzing your profile
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  We're generating personalized career insights based on your experience and goals.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Insight Cards */}
          {insights && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              {/* Card 1: Your Next Move */}
              <InsightCard
                id="next-move"
                title="Your Next Move"
                summary={insights.nextMove?.summary || 'Discover your best career opportunities'}
                metric={insights.nextMove?.opportunityCount ? `${insights.nextMove.opportunityCount} opportunities` : undefined}
                isExpanded={expandedCard === 'next-move'}
                onToggle={() => handleCardToggle('next-move')}
                isLoading={isGenerating}
              >
                <NextMoveInsight data={insights.nextMove} />
              </InsightCard>

              {/* Card 2: Skills to Master */}
              <InsightCard
                id="skills"
                title="Skills to Master"
                summary={insights.skills?.summary || 'Key skills to boost your career'}
                metric={insights.skills?.criticalCount ? `${insights.skills.criticalCount} critical skills` : undefined}
                isExpanded={expandedCard === 'skills'}
                onToggle={() => handleCardToggle('skills')}
                isLoading={isGenerating}
              >
                <SkillsInsight data={insights.skills} />
              </InsightCard>

              {/* Card 3: Your Action Plan */}
              <InsightCard
                id="action-plan"
                title="Your Action Plan"
                summary={insights.actionPlan?.summary || 'Actionable steps for this week'}
                metric={insights.actionPlan?.actionCount ? `${insights.actionPlan.actionCount} actions` : undefined}
                isExpanded={expandedCard === 'action-plan'}
                onToggle={() => handleCardToggle('action-plan')}
                isLoading={isGenerating}
              >
                <ActionPlanInsight data={insights.actionPlan} />
              </InsightCard>
            </motion.div>
          )}

          {/* Empty State */}
          {!insights && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                Generate personalized career insights based on your profile and experience.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateInsights}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white 
                  bg-indigo-500 hover:bg-indigo-600 rounded-lg
                  transition-colors duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </motion.button>
            </motion.div>
          )}

          {/* Footer */}
          {lastUpdated && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Last updated {lastUpdated.toLocaleTimeString()} · 
                <button 
                  onClick={() => navigate('/profile')}
                  className="ml-1 text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Update your profile
                </button>
                {' '}for better recommendations
              </p>
            </motion.footer>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}


