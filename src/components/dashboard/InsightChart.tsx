import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Donut Chart for distributions
interface DonutChartProps {
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
  className?: string;
}

const COLORS = ['#635BFF', '#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export function DonutChart({ title, data, className = '' }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[160px]">
          <p className="text-sm text-muted-foreground">No data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      
      <div className="flex items-center gap-4">
        <div className="w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Horizontal Bar Chart for top items
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
  valueLabel = 'count',
  showRate = false,
  maxItems = 5,
  className = '' 
}: HorizontalBarChartProps) {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);
  
  if (displayData.length === 0) {
    return (
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[120px]">
          <p className="text-sm text-muted-foreground">No data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      
      <div className="space-y-3">
        {displayData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium truncate max-w-[60%]">
                {item.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {item.value} {valueLabel}
                </span>
                {showRate && item.rate !== undefined && (
                  <span className={`font-medium tabular-nums ${
                    item.rate > 30 ? 'text-green-600 dark:text-green-400' : 
                    item.rate > 15 ? 'text-amber-600 dark:text-amber-400' : 
                    'text-muted-foreground'
                  }`}>
                    {item.rate.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full bg-jobzai-500 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Metric Card with rate
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
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-4 ${className}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
          </p>
          {rate !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {rate.toFixed(1)}% rate
            </p>
          )}
        </div>
        
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium
            ${isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          `}>
            {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Applications Table (mini version)
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

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    applied: { label: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    interview: { label: 'Interview', color: 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-700 dark:text-jobzai-400' },
    pending_decision: { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    offer: { label: 'Offer', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    wishlist: { label: 'Wishlist', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' },
  };
  
  return configs[status] || { label: status, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' };
};

export function ApplicationsTable({
  applications,
  maxItems = 10,
  className = '',
}: ApplicationsTableProps) {
  const displayedApps = applications.slice(0, maxItems);
  
  if (displayedApps.length === 0) {
    return (
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Applications</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No applications yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200/60 dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Applications</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/60 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Company</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Position</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {displayedApps.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              return (
                <tr key={app.id} className="border-b border-gray-200/60 dark:border-white/[0.06] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{app.companyName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{app.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
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

