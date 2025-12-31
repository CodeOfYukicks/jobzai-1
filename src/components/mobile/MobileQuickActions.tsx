import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';
import { getQuickActionsForPage } from '../../hooks/usePageContext';
import { useLocation } from 'react-router-dom';

interface QuickAction {
    label: string;
    prompt: string;
    isDynamic?: boolean;
    priority?: number;
}

interface MobileQuickActionsProps {
    onActionClick?: (prompt: string) => void;
}

// Reusing the logic from the desktop component but adapted if needed
// For now we'll import the logic if we can export it, or duplicate it if it's not exported
// Since we can't easily modify the original file to export the helper function without potentially breaking things,
// we'll implement a simplified version here that covers the main mobile use cases.

function generateMobileDynamicActions(pathname: string, pageData: Record<string, any>): QuickAction[] {
    const dynamicActions: QuickAction[] = [];

    // Dashboard
    if (pathname === '/dashboard' && pageData.dashboardStats) {
        const stats = pageData.dashboardStats;
        if (stats.interviewStats?.nextInterview) {
            dynamicActions.push({
                label: `Prep for ${stats.interviewStats.nextInterview.company}`,
                prompt: `Help me prepare for my upcoming interview at ${stats.interviewStats.nextInterview.company}.`,
                isDynamic: true,
                priority: 1,
            });
        }
    }

    // Applications
    if (pathname === '/applications') {
        const board = pageData.currentBoard;
        if (board && board.totalApplicationsOnBoard > 0) {
            dynamicActions.push({
                label: `Analyze "${board.boardName}"`,
                prompt: `Analyze my "${board.boardName}" board and tell me what to focus on.`,
                isDynamic: true,
                priority: 1,
            });
        }
    }

    // Jobs
    if (pathname === '/jobs' && pageData.selectedJob) {
        const job = pageData.selectedJob;
        dynamicActions.push({
            label: `Analyze fit for ${job.company}`,
            prompt: `Analyze if this ${job.title} role at ${job.company} is a good fit for me.`,
            isDynamic: true,
            priority: 1,
        });
    }

    return dynamicActions;
}

export default function MobileQuickActions({ onActionClick }: MobileQuickActionsProps) {
    const location = useLocation();
    const { setPendingMessage, pageData } = useAssistant();

    // Get static quick actions for current page
    const staticActions = getQuickActionsForPage(location.pathname);

    // Generate dynamic actions
    const dynamicActions = useMemo(() => {
        return generateMobileDynamicActions(location.pathname, pageData);
    }, [location.pathname, pageData]);

    // Combine actions - limit to 4 total for mobile grid
    const quickActions = useMemo(() => {
        const dynamic = dynamicActions.slice(0, 2);
        const staticToShow = staticActions.slice(0, 4 - dynamic.length);
        return [...dynamic, ...staticToShow.map(a => ({ ...a, isDynamic: false }))];
    }, [dynamicActions, staticActions]);

    const handleActionClick = (prompt: string) => {
        if (onActionClick) {
            onActionClick(prompt);
            return;
        }
        setPendingMessage(prompt);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
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
            className="grid grid-cols-2 gap-2"
        >
            {quickActions.map((action, index) => (
                <motion.button
                    key={`${action.label}-${index}`}
                    variants={itemVariants}
                    onClick={() => handleActionClick(action.prompt)}
                    className={`
            relative overflow-hidden
            flex flex-col items-start justify-center p-3 h-[72px] rounded-2xl
            text-left transition-all active:scale-[0.98]
            ${action.isDynamic
                            ? 'bg-gradient-to-br from-[#635BFF]/10 to-[#8F89FF]/10 border border-[#635BFF]/20'
                            : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5'
                        }
          `}
                >
                    <div className="mb-1.5">
                        {action.isDynamic ? (
                            <Zap className="w-4 h-4 text-[#635BFF] dark:text-[#8F89FF]" fill="currentColor" fillOpacity={0.2} />
                        ) : (
                            <Sparkles className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                    <span className={`
            text-[13px] font-medium leading-tight line-clamp-2
            ${action.isDynamic
                            ? 'text-[#635BFF] dark:text-[#8F89FF]'
                            : 'text-gray-700 dark:text-gray-300'
                        }
          `}>
                        {action.label}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
}
