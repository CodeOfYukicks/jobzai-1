import { Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Target, Zap, Sparkles, TrendingUp, MessageSquare, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { notionistsNeutral } from '@dicebear/collection';
import NextMoveInsight from './NextMoveInsight';
import SkillsInsight from './SkillsInsight';
import ActionPlanInsight from './ActionPlanInsight';
import MarketPositionInsight from './MarketPositionInsight';
import InterviewReadinessInsight from './InterviewReadinessInsight';
import NetworkInsightsInsight from './NetworkInsightsInsight';
import TimelineRoadmapInsight from './TimelineRoadmapInsight';

type InsightType = 'next-move' | 'skills' | 'action-plan' | 'market-position' | 'interview-readiness' | 'network-insights' | 'timeline';

interface InsightConfig {
  title: string;
  subtitle: string;
  icon: typeof Target;
  avatarSeed: string;
  accentText: string;
  accentBg: string;
}

const insightConfigs: Record<InsightType, InsightConfig> = {
  'next-move': {
    title: 'Your Next Move',
    subtitle: 'Career opportunities analysis',
    icon: Target,
    avatarSeed: 'career-scout-navigator',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
  },
  'skills': {
    title: 'Skills to Master',
    subtitle: 'Skill gap analysis',
    icon: Zap,
    avatarSeed: 'skill-mentor-guide',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  'market-position': {
    title: 'Market Position',
    subtitle: 'Competitive analysis',
    icon: TrendingUp,
    avatarSeed: 'market-analyst-pro',
    accentText: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-500/10 dark:bg-violet-500/15',
  },
  'interview-readiness': {
    title: 'Interview Prep',
    subtitle: 'Readiness assessment',
    icon: MessageSquare,
    avatarSeed: 'interview-coach-expert',
    accentText: 'text-pink-600 dark:text-pink-400',
    accentBg: 'bg-pink-500/10 dark:bg-pink-500/15',
  },
  'network-insights': {
    title: 'Network Power',
    subtitle: 'Networking strategy',
    icon: Users,
    avatarSeed: 'network-guru-master',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    accentBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
  },
  'timeline': {
    title: 'Your Timeline',
    subtitle: 'Career roadmap',
    icon: Clock,
    avatarSeed: 'timeline-planner-sage',
    accentText: 'text-teal-600 dark:text-teal-400',
    accentBg: 'bg-teal-500/10 dark:bg-teal-500/15',
  },
  'action-plan': {
    title: 'Action Plan',
    subtitle: 'Weekly priorities',
    icon: Sparkles,
    avatarSeed: 'action-strategist-wizard',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
};

// Generate DiceBear avatar
function useAdvisorAvatar(seed: string, size: number = 40) {
  return useMemo(() => {
    try {
      const avatar = createAvatar(notionistsNeutral, {
        seed,
        size,
        backgroundColor: ['transparent'],
      });
      return avatar.toDataUri();
    } catch (error) {
      console.error('[InsightPanel] Error generating avatar:', error);
      return null;
    }
  }, [seed, size]);
}

interface InsightDetailPanelProps {
  type: InsightType | null;
  data: any;
  open: boolean;
  onClose: () => void;
}

export default function InsightDetailPanel({ type, data, open, onClose }: InsightDetailPanelProps) {
  if (!type) return null;

  const config = insightConfigs[type];
  const Icon = config.icon;
  const avatarUri = useAdvisorAvatar(config.avatarSeed, 44);
  const miniAvatarUri = useAdvisorAvatar(config.avatarSeed, 24);

  const renderContent = () => {
    switch (type) {
      case 'next-move':
        return <NextMoveInsight data={data?.nextMove} />;
      case 'skills':
        return <SkillsInsight data={data?.skills} />;
      case 'action-plan':
        return <ActionPlanInsight data={data?.actionPlan} />;
      case 'market-position':
        return <MarketPositionInsight data={data?.marketPosition} />;
      case 'interview-readiness':
        return <InterviewReadinessInsight data={data?.interviewReadiness} />;
      case 'network-insights':
        return <NetworkInsightsInsight data={data?.networkInsights} />;
      case 'timeline':
        return <TimelineRoadmapInsight data={data?.timeline} />;
      default:
        return null;
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-400"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex h-full flex-col bg-white dark:bg-[#2b2a2c] shadow-2xl dark:shadow-black/40 rounded-l-2xl border-l border-gray-100 dark:border-[#3d3c3e]"
                  >
                    {/* Header - Career Advisor Style */}
                    <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-[#242325]/90 backdrop-blur-xl border-b border-gray-100 dark:border-[#3d3c3e] rounded-tl-2xl">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* DiceBear Avatar */}
                            <div className={`relative w-11 h-11 rounded-xl ${config.accentBg} flex items-center justify-center overflow-hidden`}>
                              {avatarUri ? (
                                <img 
                                  src={avatarUri} 
                                  alt="Career Advisor" 
                                  className="w-10 h-10 object-contain"
                                />
                              ) : (
                                <Icon className={`w-5 h-5 ${config.accentText}`} />
                              )}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                                  {config.title}
                                </Dialog.Title>
                                <span className={`text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded ${config.accentBg} ${config.accentText}`}>
                                  AI
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {config.subtitle}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors duration-200 group"
                          >
                            <X className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-6 py-5">
                        {renderContent()}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50/90 dark:bg-[#242325]/90 backdrop-blur-xl border-t border-gray-100 dark:border-[#3d3c3e] px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Mini Avatar */}
                          {miniAvatarUri && (
                            <div className="w-6 h-6 rounded-md overflow-hidden bg-gray-100 dark:bg-[#3d3c3e]">
                              <img 
                                src={miniAvatarUri} 
                                alt="" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            AI-powered insights based on your profile
                          </p>
                        </div>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 
                            bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4d4c4e] 
                            rounded-lg transition-colors duration-200"
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
