import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Refined color palette - more sophisticated
const COLORS = ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'];
const COLORS_DARK = ['#f9fafb', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563'];

// Donut Chart for distributions - Premium redesign
interface DonutChartProps {
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
  className?: string;
}

export function DonutChart({ title, data, className = '' }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">{title}</h3>
        <div className="flex items-center justify-center h-[160px]">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">{title}</h3>
      
      <div className="flex items-center gap-6">
        <div className="w-[100px] h-[100px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]}
                    className="dark:hidden"
                  />
                ))}
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-dark-${index}`} 
                    fill={entry.color || COLORS_DARK[index % COLORS_DARK.length]}
                    className="hidden dark:block"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{total}</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2.5">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-125" 
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <span className="text-[13px] text-gray-600 dark:text-gray-300">{item.name}</span>
              </div>
              <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Horizontal Bar Chart - Premium redesign
interface HorizontalBarChartProps {
  title: string;
  data: Array<{ name: string; value: number; rate?: number }>;
  valueLabel?: string;
  showRate?: boolean;
  maxItems?: number;
  className?: string;
}

export function HorizontalBarChart({ 
  title, 
  data, 
  valueLabel = '',
  showRate = false,
  maxItems = 5,
  className = '' 
}: HorizontalBarChartProps) {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);
  
  if (displayData.length === 0) {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">{title}</h3>
        <div className="flex items-center justify-center h-[120px]">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">{title}</h3>
      
      <div className="space-y-4">
        {displayData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-gray-700 dark:text-gray-200 font-medium truncate max-w-[55%]">
                {item.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums">
                  {item.value}{valueLabel ? ` ${valueLabel}` : ''}
                </span>
                {showRate && item.rate !== undefined && (
                  <span className={`text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded ${
                    item.rate > 30 
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' 
                      : item.rate > 15 
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' 
                        : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10'
                  }`}>
                    {item.rate.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="h-full bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors duration-200"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Metric Card - Premium editorial style
interface MetricCardProps {
  label: string;
  value: number | string;
  rate?: number;
  trend?: number;
  suffix?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  rate,
  trend,
  suffix = '',
  className = '',
}: MetricCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;
  
  return (
    <div className={`
      bg-white dark:bg-[#161618] 
      border border-gray-100 dark:border-[#3d3c3e]/60 
      rounded-2xl p-5
      transition-all duration-300
      hover:border-gray-300 dark:hover:border-[#4a494b]
      group
      ${className}
    `}>
      {/* Label - uppercase editorial style */}
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </p>
      
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          {/* Value - Hero typography */}
          <p className="text-[26px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && (
              <span className="text-[14px] font-normal text-gray-400 dark:text-gray-500 ml-1">{suffix}</span>
            )}
          </p>
          
          {/* Rate sub-label */}
          {rate !== undefined && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
              {rate.toFixed(1)}% rate
            </p>
          )}
        </div>
        
        {/* Trend - Minimal style */}
        {trend !== undefined && trend !== 0 && (
          <div className={`
            flex items-center gap-0.5 text-[11px] font-medium
            ${isPositiveTrend 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-rose-500 dark:text-rose-400'
            }
          `}>
            {isPositiveTrend ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : isNegativeTrend ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            <span>{isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Applications Table - Premium minimal design
interface ApplicationsTableProps {
  applications: Array<{
    id: string;
    companyName: string;
    position: string;
    status: string;
    appliedDate: string;
  }>;
  maxItems?: number;
  className?: string;
}

const getStatusStyle = (status: string) => {
  const configs: Record<string, { label: string; dot: string; text: string }> = {
    applied: { label: 'Applied', dot: 'bg-blue-500', text: 'text-gray-600 dark:text-gray-300' },
    interview: { label: 'Interview', dot: 'bg-amber-500', text: 'text-gray-600 dark:text-gray-300' },
    pending_decision: { label: 'Pending', dot: 'bg-yellow-500', text: 'text-gray-600 dark:text-gray-300' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', text: 'text-gray-600 dark:text-gray-300' },
    rejected: { label: 'Rejected', dot: 'bg-gray-400', text: 'text-gray-400 dark:text-gray-500' },
    wishlist: { label: 'Wishlist', dot: 'bg-gray-300 dark:bg-gray-600', text: 'text-gray-500 dark:text-gray-400' },
  };
  
  return configs[status] || { label: status, dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-300' };
};

export function ApplicationsTable({
  applications,
  maxItems = 10,
  className = '',
}: ApplicationsTableProps) {
  const displayedApps = applications.slice(0, maxItems);
  
  if (displayedApps.length === 0) {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Recent Applications</h3>
        <div className="flex items-center justify-center py-12">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No applications yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3d3c3e]/60">
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Recent Applications</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#3d3c3e]/60">
              <th className="text-left text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
              <th className="text-left text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-3">Position</th>
              <th className="text-left text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {displayedApps.map((app) => {
              const statusStyle = getStatusStyle(app.status);
              return (
                <tr 
                  key={app.id} 
                  className="border-b border-gray-50 dark:border-[#333234]/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#333234]/40 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{app.companyName}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[13px] text-gray-500 dark:text-gray-400">{app.position}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className={`text-[12px] font-medium ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[12px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {new Date(app.appliedDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default { DonutChart, HorizontalBarChart, MetricCard, ApplicationsTable };
