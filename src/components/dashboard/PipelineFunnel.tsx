import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface FunnelStage {
  label: string;
  value: number;
  color: string; // hex color or tailwind bg class
  accentColor?: string; // for the progress bar
}

interface PipelineFunnelProps {
  title: string;
  stages: FunnelStage[];
  className?: string;
  variant?: 'horizontal' | 'compact';
}

export function PipelineFunnel({
  title,
  stages,
  className = '',
  variant = 'horizontal',
}: PipelineFunnelProps) {
  const total = stages.reduce((sum, stage) => sum + stage.value, 0);
  const maxValue = Math.max(...stages.map(s => s.value), 1);
  
  if (variant === 'compact') {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">{title}</h3>
        
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <motion.div 
              key={stage.label} 
              className="group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                  {stage.label}
                </span>
                <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stage.value}
                </span>
              </div>
              
              <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e]/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full rounded-full transition-colors duration-200"
                  style={{ backgroundColor: stage.accentColor || stage.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  
  // Horizontal variant - Premium card-based design
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">{title}</h3>
      
      {/* Stage cards */}
      <div className="flex items-stretch gap-2">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const percentage = total > 0 ? ((stage.value / total) * 100).toFixed(0) : '0';
          
          return (
            <div key={stage.label} className="flex items-center flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="flex-1 min-w-0 group"
              >
                {/* Card */}
                <div className="relative bg-gray-50 dark:bg-[#333234]/50 border border-gray-100 dark:border-[#3d3c3e]/60 rounded-xl p-4 hover:border-gray-300 dark:hover:border-[#4a494b] transition-all duration-200">
                  {/* Color accent bar at top */}
                  <div 
                    className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: stage.color }}
                  />
                  
                  {/* Content */}
                  <div className="pt-2">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[28px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                        {stage.value}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                        {percentage}%
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                      {stage.label}
                    </span>
                  </div>
                </div>
              </motion.div>
              
              {/* Connector arrow */}
              {!isLast && (
                <div className="flex-shrink-0 px-1">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Conversion rates row */}
      {stages.length > 1 && total > 0 && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-[#3d3c3e]/60">
          <div className="flex-1" /> {/* Spacer for first stage */}
          {stages.slice(1).map((stage, index) => {
            const prevValue = stages[index].value;
            const conversionRate = prevValue > 0 ? (stage.value / prevValue) * 100 : 0;
            
            return (
              <div 
                key={`conv-${stage.label}`} 
                className="flex-1 flex items-center justify-center"
              >
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-[#333234]/50 rounded-md">
                  <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                    {conversionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pre-configured funnel for job applications - Refined color palette
export function JobsPipelineFunnel({
  data,
  className = '',
}: {
  data: {
    wishlist: number;
    applied: number;
    interview: number;
    pending_decision: number;
    offer: number;
    rejected: number;
  };
  className?: string;
}) {
  const stages: FunnelStage[] = [
    { 
      label: 'Applied', 
      value: data.applied, 
      color: '#3b82f6', // blue-500
    },
    { 
      label: 'Interview', 
      value: data.interview, 
      color: '#f59e0b', // amber-500
    },
    { 
      label: 'Pending', 
      value: data.pending_decision, 
      color: '#8b5cf6', // violet-500
    },
    { 
      label: 'Offer', 
      value: data.offer, 
      color: '#10b981', // emerald-500
    },
  ];
  
  return (
    <PipelineFunnel
      title="Applications Pipeline"
      stages={stages}
      className={className}
    />
  );
}

// Pre-configured funnel for campaigns - Refined color palette
export function CampaignsPipelineFunnel({
  data,
  className = '',
}: {
  data: {
    pending: number;
    generated: number;
    sent: number;
    opened: number;
    replied: number;
  };
  className?: string;
}) {
  const stages: FunnelStage[] = [
    { 
      label: 'Sent', 
      value: data.sent, 
      color: '#6366f1', // indigo-500
    },
    { 
      label: 'Opened', 
      value: data.opened, 
      color: '#f59e0b', // amber-500
    },
    { 
      label: 'Replied', 
      value: data.replied, 
      color: '#10b981', // emerald-500
    },
  ];
  
  return (
    <PipelineFunnel
      title="Outreach Pipeline"
      stages={stages}
      className={className}
    />
  );
}

export default PipelineFunnel;
