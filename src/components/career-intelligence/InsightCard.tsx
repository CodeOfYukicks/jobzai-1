import { motion } from 'framer-motion';
import { Target, Zap, Sparkles, ChevronRight, Building2, CheckCircle2, TrendingUp, MessageSquare, Users, Clock } from 'lucide-react';

type InsightType = 'next-move' | 'skills' | 'action-plan' | 'market-position' | 'interview-readiness' | 'network-insights' | 'timeline';

interface InsightCardProps {
  id: InsightType;
  title: string;
  summary: string;
  metric?: string;
  onClick: () => void;
  isLoading?: boolean;
  data?: any;
  className?: string;
}

// Card configurations with colors
const cardConfigs: Record<InsightType, {
  icon: typeof Target;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
}> = {
  'next-move': {
    icon: Target,
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    accentColor: 'border-indigo-200 dark:border-indigo-500/20',
  },
  'skills': {
    icon: Zap,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    accentColor: 'border-emerald-200 dark:border-emerald-500/20',
  },
  'market-position': {
    icon: TrendingUp,
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/10',
    badgeText: 'text-violet-700 dark:text-violet-400',
    accentColor: 'border-violet-200 dark:border-violet-500/20',
  },
  'interview-readiness': {
    icon: MessageSquare,
    iconBg: 'bg-pink-50 dark:bg-pink-500/10',
    iconColor: 'text-pink-600 dark:text-pink-400',
    badgeBg: 'bg-pink-50 dark:bg-pink-500/10',
    badgeText: 'text-pink-700 dark:text-pink-400',
    accentColor: 'border-pink-200 dark:border-pink-500/20',
  },
  'network-insights': {
    icon: Users,
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    badgeText: 'text-cyan-700 dark:text-cyan-400',
    accentColor: 'border-cyan-200 dark:border-cyan-500/20',
  },
  'timeline': {
    icon: Clock,
    iconBg: 'bg-teal-50 dark:bg-teal-500/10',
    iconColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-500/10',
    badgeText: 'text-teal-700 dark:text-teal-400',
    accentColor: 'border-teal-200 dark:border-teal-500/20',
  },
  'action-plan': {
    icon: Sparkles,
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
    badgeText: 'text-amber-700 dark:text-amber-400',
    accentColor: 'border-amber-200 dark:border-amber-500/20',
  },
};

// Mini preview components
const NextMovePreview = ({ data }: { data?: any }) => {
  const companies = data?.topCompanies?.slice(0, 2) || [];
  
  if (companies.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {companies.map((company: any, index: number) => (
        <div 
          key={index}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
        >
          <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium truncate flex-1 text-gray-700 dark:text-gray-300">{company.name}</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{company.matchScore}%</span>
        </div>
      ))}
    </div>
  );
};

const SkillsPreview = ({ data }: { data?: any }) => {
  const skills = data?.criticalSkills?.slice(0, 2) || [];
  
  if (skills.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {skills.map((skill: any, index: number) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{skill.name}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{skill.currentLevel}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${skill.currentLevel}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ActionPlanPreview = ({ data }: { data?: any }) => {
  const actions = data?.weeklyActions?.slice(0, 2) || [];
  
  if (actions.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {actions.map((action: any, index: number) => (
        <div 
          key={index}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{action.title}</span>
        </div>
      ))}
    </div>
  );
};

const MarketPositionPreview = ({ data }: { data?: any }) => {
  const strengths = data?.strengths?.slice(0, 2) || [];
  
  if (strengths.length === 0 && !data?.marketFitScore) return null;
  
  return (
    <div className="space-y-2">
      {data?.marketFitScore && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-violet-500 dark:bg-violet-400 rounded-full"
              style={{ width: `${data.marketFitScore}%` }}
            />
          </div>
          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{data.marketFitScore}%</span>
        </div>
      )}
      {strengths.map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{s.title}</span>
        </div>
      ))}
    </div>
  );
};

const InterviewReadinessPreview = ({ data }: { data?: any }) => {
  const questions = data?.topQuestions?.slice(0, 1) || [];
  
  if (questions.length === 0 && !data?.readinessScore) return null;
  
  return (
    <div className="space-y-2">
      {data?.readinessScore && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 dark:bg-pink-400 rounded-full"
              style={{ width: `${data.readinessScore}%` }}
            />
          </div>
          <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{data.readinessScore}%</span>
        </div>
      )}
      {questions.map((q: any, i: number) => (
        <div key={i} className="flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{q.question}</span>
        </div>
      ))}
    </div>
  );
};

const NetworkInsightsPreview = ({ data }: { data?: any }) => {
  const referrals = data?.potentialReferrals?.slice(0, 2) || [];
  
  if (referrals.length === 0 && !data?.connectionScore) return null;
  
  return (
    <div className="space-y-2">
      {data?.connectionScore && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full"
              style={{ width: `${data.connectionScore}%` }}
            />
          </div>
          <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{data.connectionScore}%</span>
        </div>
      )}
      {referrals.map((r: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{r.type}</span>
        </div>
      ))}
    </div>
  );
};

const TimelinePreview = ({ data }: { data?: any }) => {
  const milestones = data?.milestones?.slice(0, 2) || [];
  
  if (milestones.length === 0 && !data?.estimatedTimeToGoal) return null;
  
  return (
    <div className="space-y-2">
      {data?.estimatedTimeToGoal && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Goal in:</span>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{data.estimatedTimeToGoal}</span>
        </div>
      )}
      {milestones.map((m: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{m.title}</span>
        </div>
      ))}
    </div>
  );
};

export default function InsightCard({
  id,
  title,
  summary,
  metric,
  onClick,
  isLoading,
  data,
  className = ''
}: InsightCardProps) {
  const config = cardConfigs[id];
  const Icon = config.icon;

  const renderPreview = () => {
    switch (id) {
      case 'next-move':
        return <NextMovePreview data={data} />;
      case 'skills':
        return <SkillsPreview data={data} />;
      case 'action-plan':
        return <ActionPlanPreview data={data} />;
      case 'market-position':
        return <MarketPositionPreview data={data} />;
      case 'interview-readiness':
        return <InterviewReadinessPreview data={data} />;
      case 'network-insights':
        return <NetworkInsightsPreview data={data} />;
      case 'timeline':
        return <TimelinePreview data={data} />;
      default:
        return null;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        group relative w-full h-full text-left
        bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm
        rounded-2xl p-6
        border border-gray-200/60 dark:border-gray-700/50
        hover:border-gray-300/80 dark:hover:border-gray-600/60
        shadow-sm hover:shadow-lg
        transition-all duration-200
        disabled:opacity-70 disabled:cursor-wait
        flex flex-col
        min-h-[320px]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className={`p-3 rounded-xl ${config.iconBg}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        
            {metric && (
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${config.badgeBg} ${config.badgeText}`}>
                {metric}
              </span>
            )}
          </div>

      {/* Title & Summary */}
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {summary}
          </p>
        </div>
        
      {/* Preview content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {renderPreview()}
      </div>

      {/* Footer - View more */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-gray-700/50 flex-shrink-0">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Click to explore
        </span>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          <span className="text-xs font-medium">View details</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
            </div>
    </motion.button>
  );
}
