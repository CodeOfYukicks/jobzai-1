import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change, positive or negative
  trendLabel?: string;
  icon?: ReactNode;
  iconColor?: string; // kept for backwards compatibility, but ignored
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
  sparklineData,
  sparklineColor = '#9ca3af',
  onClick,
  className = '',
}: KPICardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;
  
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.995 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden group
        bg-white dark:bg-[#2b2a2c]
        border border-gray-200/60 dark:border-[#3d3c3e]/60
        rounded-2xl p-6
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300 ease-out
        hover:border-gray-300 dark:hover:border-[#4a494b]
        hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]
        dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-transparent dark:from-white/[0.03]" />
      </div>

      {/* Header - Title with icon */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-gray-400 dark:text-gray-500 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.5]">
              {icon}
            </span>
          )}
          <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
            {title}
          </span>
        </div>
        
        {/* Trend - Simple text, no pill */}
        {hasTrend && (
          <div className={`flex items-center gap-0.5 text-[12px] font-medium
            ${isPositiveTrend 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : isNegativeTrend 
                ? 'text-rose-500 dark:text-rose-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {isPositiveTrend ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : isNegativeTrend ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            <span>
              {isPositiveTrend ? '+' : ''}{trend?.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Value - Hero element */}
      <div className="relative flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[32px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-none tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trendLabel && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{trendLabel}</p>
          )}
        </div>
        
        {/* Sparkline - Refined */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sparkline-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={1.5}
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
