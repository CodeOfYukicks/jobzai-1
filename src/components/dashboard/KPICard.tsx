import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change, positive or negative
  trendLabel?: string;
  icon?: ReactNode;
  iconColor?: string; // tailwind bg color class
  sparklineData?: Array<{ value: number }>;
  sparklineColor?: string; // hex color for sparkline
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  iconColor = 'bg-jobzai-100 dark:bg-jobzai-950/40',
  sparklineData,
  sparklineColor = '#635BFF',
  onClick,
  className = '',
}: KPICardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;
  const isNeutralTrend = trend === 0;
  
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5
        ${onClick ? 'cursor-pointer hover:border-jobzai-300 dark:hover:border-jobzai-700' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2.5 rounded-lg ${iconColor}`}>
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        
        {/* Trend Badge */}
        {hasTrend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${isPositiveTrend 
              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
              : isNegativeTrend 
                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' 
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegativeTrend ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {isPositiveTrend ? '+' : ''}{trend?.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trendLabel && (
            <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
          )}
        </div>
        
        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sparkline-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  fill={`url(#sparkline-${title.replace(/\s/g, '')})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default KPICard;

