import { motion } from 'framer-motion';
import { Target, Zap, Sparkles, TrendingUp, MessageSquare, Users, Clock, ArrowRight } from 'lucide-react';

type InsightType = 'next-move' | 'skills' | 'action-plan' | 'market-position' | 'interview-readiness' | 'network-insights' | 'timeline';

interface BentoInsightCardProps {
  id: InsightType;
  title: string;
  summary: string;
  metric?: string;
  metricLabel?: string;
  onClick: () => void;
  isLoading?: boolean;
  data?: any;
  className?: string;
}

// Card configurations with accent colors
const cardConfigs: Record<InsightType, {
  icon: typeof Target;
  category: string;
  accentBg: string;
  accentText: string;
}> = {
  'next-move': {
    icon: Target,
    category: 'OPPORTUNITIES',
    accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
  'skills': {
    icon: Zap,
    category: 'DEVELOPMENT',
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  'market-position': {
    icon: TrendingUp,
    category: 'ANALYTICS',
    accentBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    accentText: 'text-violet-600 dark:text-violet-400',
  },
  'interview-readiness': {
    icon: MessageSquare,
    category: 'PREPARATION',
    accentBg: 'bg-pink-500/10 dark:bg-pink-500/15',
    accentText: 'text-pink-600 dark:text-pink-400',
  },
  'network-insights': {
    icon: Users,
    category: 'NETWORKING',
    accentBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    accentText: 'text-cyan-600 dark:text-cyan-400',
  },
  'timeline': {
    icon: Clock,
    category: 'ROADMAP',
    accentBg: 'bg-teal-500/10 dark:bg-teal-500/15',
    accentText: 'text-teal-600 dark:text-teal-400',
  },
  'action-plan': {
    icon: Sparkles,
    category: 'THIS WEEK',
    accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
};

// Extract key metric from data
const getMetricFromData = (id: InsightType, data?: any): { value: string; label: string } | null => {
  if (!data) return null;
  
  switch (id) {
    case 'next-move':
      return data.opportunityCount 
        ? { value: `${data.opportunityCount}`, label: 'opportunities found' }
        : null;
    case 'skills':
      return data.criticalCount 
        ? { value: `${data.criticalCount}`, label: 'skills to develop' }
        : null;
    case 'market-position':
      return data.marketFitScore 
        ? { value: `${data.marketFitScore}%`, label: 'market fit' }
        : null;
    case 'interview-readiness':
      return data.readinessScore 
        ? { value: `${data.readinessScore}%`, label: 'ready' }
        : null;
    case 'network-insights':
      return data.connectionScore 
        ? { value: `${data.connectionScore}%`, label: 'network strength' }
        : null;
    case 'timeline':
      return data.estimatedTimeToGoal 
        ? { value: data.estimatedTimeToGoal, label: 'to goal' }
        : null;
    case 'action-plan':
      return data.actionCount 
        ? { value: `${data.actionCount}`, label: 'actions this week' }
        : null;
    default:
      return null;
  }
};

export default function BentoInsightCard({
  id,
  title,
  summary,
  metric,
  metricLabel,
  onClick,
  isLoading,
  data,
  className = ''
}: BentoInsightCardProps) {
  const config = cardConfigs[id];
  const Icon = config.icon;
  const extractedMetric = getMetricFromData(id, data);
  const displayMetric = metric || extractedMetric?.value;
  const displayLabel = metricLabel || extractedMetric?.label;

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        group relative w-full h-full text-left
        bg-white dark:bg-[#2b2a2c]
        rounded-2xl
        overflow-hidden
        border border-gray-100 dark:border-[#3d3c3e]
        hover:border-gray-200 dark:hover:border-[#4d4c4e]
        shadow-sm hover:shadow-lg 
        shadow-black/[0.02] hover:shadow-black/[0.04]
        dark:shadow-black/[0.1] dark:hover:shadow-black/[0.2]
        transition-all duration-300 ease-out
        disabled:opacity-70 disabled:cursor-wait
        min-h-[220px]
        ${className}
      `}
    >
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-5">
        {/* Header: Icon badge + Category */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-9 h-9 rounded-xl ${config.accentBg} flex items-center justify-center`}>
            <Icon className={`w-[18px] h-[18px] ${config.accentText}`} />
          </div>
          <span className={`text-[10px] font-semibold tracking-[0.12em] uppercase ${config.accentText}`}>
          {config.category}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 leading-snug">
          {title}
        </h3>
        
        {/* Summary */}
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 pr-2">
          {summary}
        </p>
        
        {/* Metric Display */}
        {displayMetric && (
          <div className="mt-auto pt-4">
            <div className="flex items-baseline gap-1.5">
              <span 
                className={`text-3xl font-bold tracking-tight ${config.accentText}`}
                style={{ fontFeatureSettings: '"tnum"' }}
              >
              {displayMetric}
              </span>
              {displayLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {displayLabel}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Hover CTA */}
        <div className={`
          absolute bottom-5 right-5
          flex items-center gap-1.5
          text-gray-400 dark:text-gray-500
          group-hover:text-gray-600 dark:group-hover:text-gray-300
          opacity-0 group-hover:opacity-100
          transform translate-x-2 group-hover:translate-x-0
          transition-all duration-300 ease-out
        `}>
          <span className="text-xs font-medium">Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-[#2b2a2c]/70 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-[#3d3c3e] border-t-gray-400 dark:border-t-gray-300 animate-spin" />
        </div>
      )}
    </motion.button>
  );
}
