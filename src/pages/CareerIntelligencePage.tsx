import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { fetchCompleteUserData, CompleteUserData } from '../lib/userDataFetcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import ProfileTagsCloud from '../components/career-intelligence/ProfileTagsCloud';
import SignalCard, { SignalStatus } from '../components/career-intelligence/SignalCard';
import RecommendationBottomSheet from '../components/career-intelligence/RecommendationBottomSheet';
import { generateCareerInsights, CareerInsightsData } from '../services/careerIntelligence';
import { notify } from '../lib/notify';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import MobileTopBar from '../components/mobile/MobileTopBar';

type InsightType = 'next-move' | 'skills' | 'action-plan' | 'market-position' | 'interview-readiness' | 'network-insights' | 'timeline';

export default function CareerIntelligencePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<CompleteUserData | null>(null);
  const [insights, setInsights] = useState<CareerInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightType | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track if we've already tried to generate
  const hasTriedGenerating = useRef(false);

  // Load user data and saved insights
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load user data
        const data = await fetchCompleteUserData(currentUser.uid);
        setUserData(data);

        // Try to load saved insights from user's pagePreferences
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.careerInsights) {
              setInsights(userData.careerInsights.data as CareerInsightsData);
              setLastUpdated(userData.careerInsights.updatedAt?.toDate() || new Date());
              console.log('Loaded saved career insights from user doc');
            }
          }
        } catch (insightsError) {
          console.log('Could not load saved insights:', insightsError);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        notify.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  // Save insights to Firestore
  const saveInsightsToFirestore = async (insightsData: CareerInsightsData) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        careerInsights: {
          data: insightsData,
          updatedAt: new Date()
        }
      });
      console.log('Career insights saved successfully');
    } catch (error) {
      console.error('Error saving insights:', error);
    }
  };

  // Generate insights
  const handleGenerateInsights = async () => {
    if (!userData) return;

    setIsGenerating(true);
    try {
      const result = await generateCareerInsights(userData);
      setInsights(result);
      setLastUpdated(new Date());

      // Save to Firestore
      await saveInsightsToFirestore(result);

      notify.success('Insights generated and saved');
    } catch (error) {
      console.error('Error generating insights:', error);
      notify.error('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate only if no saved insights exist (and only once)
  useEffect(() => {
    if (userData && !insights && !isGenerating && !isLoading && !hasTriedGenerating.current) {
      hasTriedGenerating.current = true;
      handleGenerateInsights();
    }
  }, [userData, insights, isLoading, isGenerating]);

  const handleOpenInsight = (type: InsightType) => {
    setSelectedInsight(type);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedInsight(null), 300);
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

  // Helper to get signal data
  const getSignalData = (type: InsightType) => {
    if (!insights) return null;

    switch (type) {
      case 'next-move':
        return {
          status: 'green' as SignalStatus,
          title: 'Next Move',
          insight: insights.nextMove?.summary || 'Explore new opportunities',
          cta: 'View Opportunities',
          details: {
            why: ['High demand for your skills', 'Salary potential increase', 'Market growth in your sector'],
            steps: ['Update your CV', 'Apply to 3 target companies', 'Network with recruiters']
          }
        };
      case 'skills':
        return {
          status: 'orange' as SignalStatus,
          title: 'Skills Gap',
          insight: insights.skills?.summary || 'Identify key skills to learn',
          cta: 'See Skills',
          details: {
            why: ['Missing critical keywords', 'Emerging tech trends', 'Competitive advantage'],
            steps: ['Take a course on X', 'Add Y to your project portfolio', 'Get certified in Z']
          }
        };
      case 'market-position':
        return {
          status: 'green' as SignalStatus,
          title: 'Market Fit',
          insight: insights.marketPosition?.summary || 'Strong profile for your role',
          cta: 'Check Position',
          details: {
            why: ['Top 10% of candidates', 'Strong experience match', 'Good location fit'],
            steps: ['Negotiate higher salary', 'Target senior roles', 'Mentor others']
          }
        };
      case 'interview-readiness':
        return {
          status: 'orange' as SignalStatus,
          title: 'Interview Prep',
          insight: insights.interviewReadiness?.summary || 'Brush up on technical questions',
          cta: 'Start Practice',
          details: {
            why: ['Rusty on algorithms', 'Behavioral questions need work', 'System design gaps'],
            steps: ['Practice mock interviews', 'Review STAR method', 'Solve LeetCode problems']
          }
        };
      case 'network-insights':
        return {
          status: 'green' as SignalStatus,
          title: 'Network',
          insight: insights.networkInsights?.summary || 'Good connections in your industry',
          cta: 'Expand Network',
          details: {
            why: ['Strong alumni network', 'Active on LinkedIn', 'Connected to key influencers'],
            steps: ['Reach out to 5 people', 'Attend industry events', 'Share your work']
          }
        };
      case 'timeline':
        return {
          status: 'green' as SignalStatus,
          title: 'Timeline',
          insight: insights.timeline?.summary || 'On track for your goals',
          cta: 'View Roadmap',
          details: {
            why: ['Consistent progress', 'Clear milestones met', 'Realistic deadlines'],
            steps: ['Set Q3 goals', 'Review progress monthly', 'Adjust plan as needed']
          }
        };
      case 'action-plan':
        return {
          status: 'red' as SignalStatus,
          title: 'Action Plan',
          insight: insights.actionPlan?.summary || 'Immediate actions required',
          cta: 'Take Action',
          details: {
            why: ['Urgent deadlines', 'Missed opportunities', 'Critical blockers'],
            steps: ['Complete profile', 'Apply to saved jobs', 'Reply to messages']
          }
        };
      default:
        return null;
    }
  };

  const currentSignal = selectedInsight ? getSignalData(selectedInsight) : null;

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-gray-50 dark:bg-[#1c1c1e]">
        {/* Mobile Top Bar */}
        <MobileTopBar
          title="Career Intelligence"
          subtitle={getUserHeadline()}
          rightAction={{
            icon: RefreshCw,
            onClick: handleGenerateInsights,
            ariaLabel: 'Refresh Insights'
          }}
        />

        {/* Desktop Header */}
        <div className="hidden md:block px-6 lg:px-10 pt-8 pb-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Intelligence</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getUserHeadline()}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Refresh'}</span>
            </motion.button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col w-full max-w-lg md:max-w-5xl mx-auto">

          {/* Profile Tags - Now in main content */}
          {userData?.profileTags && userData.profileTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <ProfileTagsCloud tags={userData.profileTags} maxTags={10} onCover={false} />
            </motion.div>
          )}

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

          {/* Signal Cards Stack */}
          {insights && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0"
            >
              {[
                'next-move',
                'skills',
                'market-position',
                'interview-readiness',
                'network-insights',
                'timeline',
                'action-plan'
              ].map((type, index) => {
                const signal = getSignalData(type as InsightType);
                if (!signal) return null;

                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + (index * 0.05) }}
                  >
                    <SignalCard
                      status={signal.status}
                      title={signal.title}
                      insight={signal.insight}
                      cta={signal.cta}
                      onClick={() => handleOpenInsight(type as InsightType)}
                    />
                  </motion.div>
                );
              })}
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
          {lastUpdated && insights && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-6 border-t border-gray-100 dark:border-[#3d3c3e]"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Insights saved · Last updated {(() => {
                  const now = new Date();
                  const isToday = lastUpdated.toDateString() === now.toDateString();
                  if (isToday) {
                    return `today at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  }
                  return lastUpdated.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                    ` at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                })()}
              </p>
            </motion.footer>
          )}
        </div>
      </div>

      {/* Recommendation Bottom Sheet */}
      {currentSignal && (
        <RecommendationBottomSheet
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          title={currentSignal.title}
          status={currentSignal.status}
          summary={currentSignal.insight}
          details={currentSignal.details}
          cta={currentSignal.cta}
          onCtaClick={() => {
            // Handle specific CTA actions if needed
            handleClosePanel();
          }}
        />
      )}
    </AuthLayout>
  );
}
