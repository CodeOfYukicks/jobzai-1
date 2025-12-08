import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Target, Zap, Sparkles, TrendingUp, MessageSquare, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
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
  icon: typeof Target;
  color: string;
  bgColor: string;
  borderColor: string;
}

const insightConfigs: Record<InsightType, InsightConfig> = {
  'next-move': {
    title: 'Your Next Move',
    icon: Target,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  'skills': {
    title: 'Skills to Master',
    icon: Zap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  'market-position': {
    title: 'Market Position',
    icon: TrendingUp,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  'interview-readiness': {
    title: 'Interview Readiness',
    icon: MessageSquare,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  'network-insights': {
    title: 'Network Insights',
    icon: Users,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  'timeline': {
    title: 'Your Timeline',
    icon: Clock,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  'action-plan': {
    title: 'Your Action Plan',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

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
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-400"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex h-full flex-col bg-white dark:bg-[#242325] shadow-2xl rounded-l-3xl border-l border-gray-200 dark:border-[#3d3c3e]"
                  >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#242325]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#3d3c3e] rounded-tl-3xl">
                      <div className="px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${config.bgColor}`}>
                              <Icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <div>
                              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                {config.title}
                              </Dialog.Title>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Personalized insights based on your profile
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                          >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-6 py-6">
                        {renderContent()}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white/80 dark:bg-[#242325]/80 backdrop-blur-lg border-t border-gray-200 dark:border-[#3d3c3e] px-6 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          AI-powered insights • Updated based on your latest profile
                        </p>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                            bg-gray-100 dark:bg-[#2b2a2c] hover:bg-gray-200 dark:hover:bg-[#3d3c3e] 
                            rounded-xl transition-colors duration-200"
                        >
                          Close
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
