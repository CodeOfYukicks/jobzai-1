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

// Card configurations with accent colors for icons/badges
const cardConfigs: Record<InsightType, {
  icon: typeof Target;
  category: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  pattern: 'dots' | 'lines' | 'circles' | 'grid' | 'waves';
}> = {
  'next-move': {
    icon: Target,
    category: 'OPPORTUNITIES',
    accentColor: '#6366F1',
    accentBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    pattern: 'dots',
  },
  'skills': {
    icon: Zap,
    category: 'DEVELOPMENT',
    accentColor: '#10B981',
    accentBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    pattern: 'lines',
  },
  'market-position': {
    icon: TrendingUp,
    category: 'ANALYTICS',
    accentColor: '#8B5CF6',
    accentBg: 'bg-violet-50 dark:bg-violet-500/10',
    accentText: 'text-violet-600 dark:text-violet-400',
    pattern: 'circles',
  },
  'interview-readiness': {
    icon: MessageSquare,
    category: 'PREPARATION',
    accentColor: '#EC4899',
    accentBg: 'bg-pink-50 dark:bg-pink-500/10',
    accentText: 'text-pink-600 dark:text-pink-400',
    pattern: 'grid',
  },
  'network-insights': {
    icon: Users,
    category: 'NETWORKING',
    accentColor: '#06B6D4',
    accentBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    pattern: 'waves',
  },
  'timeline': {
    icon: Clock,
    category: 'ROADMAP',
    accentColor: '#14B8A6',
    accentBg: 'bg-teal-50 dark:bg-teal-500/10',
    accentText: 'text-teal-600 dark:text-teal-400',
    pattern: 'dots',
  },
  'action-plan': {
    icon: Sparkles,
    category: 'THIS WEEK',
    accentColor: '#F59E0B',
    accentBg: 'bg-amber-50 dark:bg-amber-500/10',
    accentText: 'text-amber-600 dark:text-amber-400',
    pattern: 'lines',
  },
};

// SVG Pattern backgrounds
const PatternBackground = ({ pattern, color }: { pattern: string; color: string }) => {
  const opacity = 0.06;
  
  switch (pattern) {
    case 'dots':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`dots-${color}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill={color} fillOpacity={opacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${color})`} />
        </svg>
      );
    case 'lines':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`lines-${color}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20h40M20 0v40" stroke={color} strokeWidth="1" strokeOpacity={opacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#lines-${color})`} />
        </svg>
      );
    case 'circles':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`circles-${color}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#circles-${color})`} />
        </svg>
      );
    case 'grid':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`grid-${color}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity={opacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${color})`} />
        </svg>
      );
    case 'waves':
      return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`waves-${color}`} x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q20 0 40 10 T80 10" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity={opacity} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#waves-${color})`} />
        </svg>
      );
    default:
      return null;
  }
};

// Decorative illustrations for each card type
const CardIllustration = ({ type, color }: { type: InsightType; color: string }) => {
  const opacity = 0.12;
  
  switch (type) {
    case 'next-move':
      return (
        <svg className="absolute bottom-0 right-0 w-48 h-48 opacity-20" viewBox="0 0 200 200" fill="none">
          <circle cx="150" cy="150" r="80" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <circle cx="150" cy="150" r="60" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <circle cx="150" cy="150" r="40" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <circle cx="150" cy="150" r="20" fill={color} fillOpacity={opacity} />
          <path d="M90 90 L150 150" stroke={color} strokeWidth="3" strokeOpacity={opacity * 2} />
          <polygon points="150,150 135,155 140,140" fill={color} fillOpacity={opacity * 2} />
        </svg>
      );
    case 'skills':
      return (
        <svg className="absolute bottom-0 right-0 w-56 h-56 opacity-15" viewBox="0 0 200 200" fill="none">
          <path d="M100 20 L180 160 L20 160 Z" stroke={color} strokeWidth="2" fill="none" strokeOpacity={opacity} />
          <path d="M100 50 L160 145 L40 145 Z" stroke={color} strokeWidth="2" fill="none" strokeOpacity={opacity} />
          <circle cx="100" cy="120" r="15" fill={color} fillOpacity={opacity} />
          <path d="M85 100 L100 120 L115 100" stroke={color} strokeWidth="3" fill="none" strokeOpacity={opacity * 2} />
        </svg>
      );
    case 'market-position':
      return (
        <svg className="absolute bottom-0 right-0 w-52 h-52 opacity-15" viewBox="0 0 200 200" fill="none">
          <path d="M20 180 L60 120 L100 140 L140 80 L180 40" stroke={color} strokeWidth="3" fill="none" strokeOpacity={opacity * 2} />
          <circle cx="60" cy="120" r="6" fill={color} fillOpacity={opacity * 2} />
          <circle cx="100" cy="140" r="6" fill={color} fillOpacity={opacity * 2} />
          <circle cx="140" cy="80" r="6" fill={color} fillOpacity={opacity * 2} />
          <circle cx="180" cy="40" r="8" fill={color} fillOpacity={opacity * 2} />
          <path d="M170 50 L180 40 L175 55" stroke={color} strokeWidth="2" fill="none" strokeOpacity={opacity * 2} />
        </svg>
      );
    case 'interview-readiness':
      return (
        <svg className="absolute bottom-0 right-0 w-48 h-48 opacity-15" viewBox="0 0 200 200" fill="none">
          <rect x="40" y="60" width="120" height="100" rx="10" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <circle cx="70" cy="100" r="15" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <line x1="95" y1="95" x2="140" y2="95" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <line x1="95" y1="110" x2="130" y2="110" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <path d="M60 140 Q100 170 140 140" stroke={color} strokeWidth="2" fill="none" strokeOpacity={opacity * 2} />
        </svg>
      );
    case 'network-insights':
      return (
        <svg className="absolute bottom-0 right-0 w-52 h-52 opacity-15" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="20" fill={color} fillOpacity={opacity} />
          <circle cx="50" cy="60" r="12" fill={color} fillOpacity={opacity} />
          <circle cx="150" cy="60" r="12" fill={color} fillOpacity={opacity} />
          <circle cx="50" cy="140" r="12" fill={color} fillOpacity={opacity} />
          <circle cx="150" cy="140" r="12" fill={color} fillOpacity={opacity} />
          <line x1="100" y1="100" x2="50" y2="60" stroke={color} strokeWidth="2" strokeOpacity={opacity * 2} />
          <line x1="100" y1="100" x2="150" y2="60" stroke={color} strokeWidth="2" strokeOpacity={opacity * 2} />
          <line x1="100" y1="100" x2="50" y2="140" stroke={color} strokeWidth="2" strokeOpacity={opacity * 2} />
          <line x1="100" y1="100" x2="150" y2="140" stroke={color} strokeWidth="2" strokeOpacity={opacity * 2} />
        </svg>
      );
    case 'timeline':
      return (
        <svg className="absolute bottom-0 right-0 w-52 h-52 opacity-15" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="70" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <circle cx="100" cy="100" r="5" fill={color} fillOpacity={opacity * 2} />
          <line x1="100" y1="100" x2="100" y2="50" stroke={color} strokeWidth="3" strokeOpacity={opacity * 2} />
          <line x1="100" y1="100" x2="140" y2="120" stroke={color} strokeWidth="2" strokeOpacity={opacity * 2} />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <line
              key={i}
              x1={100 + 60 * Math.cos((angle * Math.PI) / 180)}
              y1={100 + 60 * Math.sin((angle * Math.PI) / 180)}
              x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
              stroke={color}
              strokeWidth="2"
              strokeOpacity={opacity}
            />
          ))}
        </svg>
      );
    case 'action-plan':
      return (
        <svg className="absolute bottom-0 right-0 w-64 h-48 opacity-15" viewBox="0 0 260 200" fill="none">
          <rect x="20" y="40" width="180" height="140" rx="8" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          <line x1="20" y1="70" x2="200" y2="70" stroke={color} strokeWidth="2" strokeOpacity={opacity} />
          {[90, 115, 140, 165].map((y, i) => (
            <g key={i}>
              <rect x="35" y={y} width="12" height="12" rx="2" stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 2} />
              {i < 2 && <path d={`M38 ${y + 6} L41 ${y + 9} L47 ${y + 3}`} stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 3} />}
              <line x1="55" y1={y + 6} x2={140 - i * 15} y2={y + 6} stroke={color} strokeWidth="2" strokeOpacity={opacity} />
            </g>
          ))}
        </svg>
      );
    default:
      return null;
  }
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
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        group relative w-full h-full text-left
        bg-white dark:bg-[#2b2a2c]
        rounded-2xl p-6 md:p-8
        overflow-hidden
        border border-gray-200/60 dark:border-[#3d3c3e]/50
        shadow-sm hover:shadow-xl
        transition-all duration-300
        disabled:opacity-70 disabled:cursor-wait
        min-h-[280px]
        ${className}
      `}
    >
      {/* Pattern Background */}
      <PatternBackground pattern={config.pattern} color={config.accentColor} />
      
      {/* Decorative Illustration */}
      <CardIllustration type={id} color={config.accentColor} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Category Label */}
        <div className={`text-xs font-semibold tracking-wider mb-2 ${config.accentText}`}>
          {config.category}
        </div>
        
        {/* Title */}
        <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900 dark:text-white leading-tight">
          {title}
        </h3>
        
        {/* Summary */}
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-[85%] line-clamp-2">
          {summary}
        </p>
        
        {/* Metric Display */}
        {displayMetric && (
          <div className="mt-auto">
            <div className={`text-4xl md:text-5xl font-bold ${config.accentText} leading-none mb-1`}>
              {displayMetric}
            </div>
            {displayLabel && (
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {displayLabel}
              </div>
            )}
          </div>
        )}
        
        {/* Hover CTA */}
        <div className={`
          absolute bottom-6 right-6
          flex items-center gap-2
          text-gray-500 dark:text-gray-400
          opacity-0 group-hover:opacity-100
          transform translate-x-4 group-hover:translate-x-0
          transition-all duration-300
        `}>
          <span className="text-sm font-medium">Explore</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#2b2a2c]/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
        </div>
      )}
    </motion.button>
  );
}

