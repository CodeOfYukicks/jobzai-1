import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';
import { getQuickActionsForPage } from '../../hooks/usePageContext';
import { useLocation } from 'react-router-dom';

interface QuickAction {
  label: string;
  prompt: string;
  isDynamic?: boolean;
  priority?: number;
}

interface QuickActionsProps {
  onActionClick?: (prompt: string) => void;
}

// Generate dynamic actions based on page data
function generateDynamicActions(pathname: string, pageData: Record<string, any>): QuickAction[] {
  const dynamicActions: QuickAction[] = [];

  // Dashboard dynamic actions
  if (pathname === '/dashboard' && pageData.dashboardStats) {
    const stats = pageData.dashboardStats;
    
    if (stats.insights?.actionItems?.length > 0) {
      dynamicActions.push({
        label: stats.insights.priority.substring(0, 45) + (stats.insights.priority.length > 45 ? '...' : ''),
        prompt: `Help me with this: ${stats.insights.priority}`,
        isDynamic: true,
        priority: 1,
      });
    }
    
    if (stats.interviewStats?.nextInterview) {
      dynamicActions.push({
        label: `Prep for ${stats.interviewStats.nextInterview.company} interview`,
        prompt: `Help me prepare for my upcoming interview at ${stats.interviewStats.nextInterview.company}. The interview is on ${stats.interviewStats.nextInterview.date}`,
        isDynamic: true,
        priority: 2,
      });
    }
  }

  // Applications dynamic actions - Board-specific
  if (pathname === '/applications') {
    const board = pageData.currentBoard;
    const apps = pageData.applications;
    
    // Board-specific actions
    if (board && board.boardName && board.boardName !== 'All Boards Overview') {
      const boardName = board.boardName;
      const totalOnBoard = board.totalApplicationsOnBoard || 0;
      const statusCounts = board.applicationsByStatus || {};
      const recentApps = board.recentOnBoard || [];
      
      // Show board-specific summary action
      if (totalOnBoard > 0) {
        const interviewCount = statusCounts['interview'] || statusCounts['Interview'] || 0;
        const appliedCount = statusCounts['applied'] || statusCounts['Applied'] || 0;
        
        if (interviewCount > 0) {
          dynamicActions.push({
            label: `${interviewCount} interview${interviewCount > 1 ? 's' : ''} on "${boardName}"`,
            prompt: `I have ${interviewCount} application(s) in interview stage on my "${boardName}" board. Give me a summary and tips for each interview.`,
            isDynamic: true,
            priority: 1,
          });
        }
        
        // Board health check
        dynamicActions.push({
          label: `Analyze "${boardName}" board`,
          prompt: `Analyze my "${boardName}" board. I have ${totalOnBoard} applications total. Status breakdown: ${Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(', ')}. What should I focus on?`,
          isDynamic: true,
          priority: 2,
        });
        
        // Suggest action based on most recent application
        if (recentApps.length > 0) {
          const recent = recentApps[0];
          dynamicActions.push({
            label: `${recent.company}: what's next?`,
            prompt: `My ${recent.company} application for "${recent.position}" is in "${recent.status}" status on my "${boardName}" board. What should I do next?`,
            isDynamic: true,
            priority: 3,
          });
        }
      } else {
        // Empty board
        dynamicActions.push({
          label: `Get started with "${boardName}"`,
          prompt: `My "${boardName}" board is empty. Help me organize and add applications to this board effectively.`,
          isDynamic: true,
          priority: 1,
        });
      }
    } else if (board?.viewMode === 'boards') {
      // All boards overview mode
      dynamicActions.push({
        label: `Compare my ${board.totalBoards || 0} boards`,
        prompt: `I have ${board.totalBoards || 0} boards. Compare them and tell me which board needs more attention.`,
        isDynamic: true,
        priority: 1,
      });
    }
    
    // Fallback to general applications insights if no board context
    if (dynamicActions.length === 0 && apps) {
      // Suggest follow-up for stale applications
      if (apps.insights?.needsFollowUp?.length > 0) {
        const firstStale = apps.insights.needsFollowUp[0];
        dynamicActions.push({
          label: `Follow up on ${firstStale.company}`,
          prompt: `Help me write a follow-up email for my ${firstStale.company} application. It's been ${firstStale.daysSinceApplied} days since I applied.`,
          isDynamic: true,
          priority: 1,
        });
      }
      
      // Hot opportunities
      if (apps.insights?.hotOpportunities?.length > 0) {
        const hot = apps.insights.hotOpportunities[0];
        dynamicActions.push({
          label: `${hot.company}: ${hot.status} - what's next?`,
          prompt: `My ${hot.company} application is in "${hot.status}" status. What should I do next to maximize my chances?`,
          isDynamic: true,
          priority: 2,
        });
      }
      
      // Low response rate advice
      if (apps.insights?.responseRate < 20 && apps.total > 5) {
        dynamicActions.push({
          label: `Improve my ${apps.insights.responseRate}% response rate`,
          prompt: `My application response rate is only ${apps.insights.responseRate}%. Analyze my recent applications and suggest how I can improve.`,
          isDynamic: true,
          priority: 3,
        });
      }
    }
  }

  // Job Board dynamic actions
  if (pathname === '/jobs') {
    // Selected job analysis
    if (pageData.selectedJob) {
      const job = pageData.selectedJob;
      dynamicActions.push({
        label: `Is ${job.company} a good fit?`,
        prompt: `Analyze if this ${job.title} role at ${job.company} is a good fit for my profile. Consider the requirements: ${job.requiredSkills?.slice(0, 5).join(', ') || 'listed in the description'}`,
        isDynamic: true,
        priority: 1,
      });
      
      if (job.salaryRange) {
        dynamicActions.push({
          label: `Salary analysis: ${job.salaryRange}`,
          prompt: `Is the salary range "${job.salaryRange}" for this ${job.title} role at ${job.company} competitive? How should I negotiate?`,
          isDynamic: true,
          priority: 2,
        });
      }
    }
    
    // Job listings insights
    if (pageData.jobListings?.insights?.topMatchingJobs?.length > 0) {
      const topMatch = pageData.jobListings.insights.topMatchingJobs[0];
      dynamicActions.push({
        label: `Why ${topMatch.company} matches ${topMatch.matchScore}%`,
        prompt: `Explain why the ${topMatch.title} role at ${topMatch.company} is a ${topMatch.matchScore}% match for my profile. What skills am I missing?`,
        isDynamic: true,
        priority: 3,
      });
    }
  }

  // CV Analysis dynamic actions
  if (pathname.includes('/cv-analysis') && pageData.cvAnalysis) {
    const cv = pageData.cvAnalysis;
    
    if (cv.performance?.averageScore) {
      dynamicActions.push({
        label: `Improve my ${cv.performance.averageScore}% CV score`,
        prompt: `My CV has an average score of ${cv.performance.averageScore}%. What are the top 3 things I should change to improve it?`,
        isDynamic: true,
        priority: 1,
      });
    }
    
    if (cv.insights?.quickWins?.length > 0) {
      dynamicActions.push({
        label: cv.insights.quickWins[0].substring(0, 40) + '...',
        prompt: `Help me with this CV improvement: "${cv.insights.quickWins[0]}". Give me specific examples.`,
        isDynamic: true,
        priority: 2,
      });
    }
  }

  // Notes page dynamic actions
  if (pathname.includes('/notes') && pageData.currentNote) {
    const note = pageData.currentNote;
    
    if (note.content && note.wordCount > 50) {
      dynamicActions.push({
        label: `Summarize "${note.title.substring(0, 20)}..."`,
        prompt: `Summarize my note titled "${note.title}" in bullet points. Keep the key information.`,
        isDynamic: true,
        priority: 1,
      });
      
      dynamicActions.push({
        label: `Improve this note`,
        prompt: `Help me improve my note "${note.title}". Suggest better structure, clarity, and any missing points.`,
        isDynamic: true,
        priority: 2,
      });
    }
  }

  return dynamicActions.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const location = useLocation();
  const { setPendingMessage, pageData } = useAssistant();
  
  // Get static quick actions for current page
  const staticActions = getQuickActionsForPage(location.pathname);
  
  // Generate dynamic actions based on page data
  const dynamicActions = useMemo(() => {
    return generateDynamicActions(location.pathname, pageData);
  }, [location.pathname, pageData]);
  
  // Combine dynamic (prioritized) and static actions
  const quickActions = useMemo(() => {
    // Take up to 2 dynamic actions, then fill with static actions
    const dynamic = dynamicActions.slice(0, 2);
    const staticToShow = staticActions.slice(0, 3 - dynamic.length);
    return [...dynamic, ...staticToShow.map(a => ({ ...a, isDynamic: false }))];
  }, [dynamicActions, staticActions]);

  const handleActionClick = (prompt: string) => {
    if (onActionClick) {
      onActionClick(prompt);
      return;
    }

    // Set pending message - ChatInput will pick it up and send it
    setPendingMessage(prompt);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {quickActions.map((action, index) => (
        <motion.button
          key={`${action.label}-${index}`}
          variants={itemVariants}
          onClick={() => handleActionClick(action.prompt)}
          className={`w-full px-4 py-2.5 rounded-xl
            ${action.isDynamic 
              ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/60 dark:from-indigo-900/20 dark:to-purple-900/15 border-indigo-200/60 dark:border-indigo-500/20' 
              : 'bg-gray-50/60 dark:bg-white/[0.025] border-gray-200/60 dark:border-white/[0.05]'
            }
            border
            hover:bg-gray-100/70 dark:hover:bg-white/[0.045]
            hover:border-gray-300/60 dark:hover:border-white/[0.08]
            active:scale-[0.985]
            transition-all duration-200
            text-center flex items-center justify-center gap-2`}
        >
          {action.isDynamic && (
            <Zap className="h-3 w-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
          )}
          <span className={`text-[13px] font-medium ${action.isDynamic ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {action.label}
          </span>
        </motion.button>
      ))}

      {/* Add Command button */}
      <motion.button
        variants={itemVariants}
        className="w-full px-4 py-2.5 rounded-xl
          bg-transparent
          border border-dashed border-gray-200/50 dark:border-white/[0.06]
          hover:bg-gray-50/40 dark:hover:bg-white/[0.015]
          hover:border-gray-300/50 dark:hover:border-white/[0.08]
          active:scale-[0.985]
          transition-all duration-200
          flex items-center justify-center gap-1.5"
      >
        <Plus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">
          Add Command
        </span>
      </motion.button>
    </motion.div>
  );
}

