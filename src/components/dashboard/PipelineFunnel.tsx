import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface FunnelStage {
  label: string;
  value: number;
  color: string; // tailwind bg class
  textColor?: string; // tailwind text class
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
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
        
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="w-20 text-xs font-medium text-foreground truncate">
                {stage.label}
              </div>
              
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${stage.color}`}
                />
              </div>
              
              <div className="w-12 text-right text-sm font-semibold text-foreground tabular-nums">
                {stage.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Horizontal variant
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const widthPercent = total > 0 ? (stage.value / total) * 100 : 100 / stages.length;
          
          return (
            <div key={stage.label} className="flex items-center" style={{ flex: Math.max(widthPercent, 15) }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={`
                  flex-1 py-3 px-3 rounded-lg
                  ${stage.color}
                  flex flex-col items-center justify-center
                  min-w-[60px]
                `}
              >
                <span className={`text-xl font-bold tabular-nums ${stage.textColor || 'text-white'}`}>
                  {stage.value}
                </span>
                <span className={`text-xs font-medium mt-0.5 ${stage.textColor || 'text-white/80'}`}>
                  {stage.label}
                </span>
              </motion.div>
              
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Conversion rates */}
      {stages.length > 1 && total > 0 && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          {stages.slice(1).map((stage, index) => {
            const prevValue = stages[index].value;
            const conversionRate = prevValue > 0 ? (stage.value / prevValue) * 100 : 0;
            
            return (
              <div 
                key={`conv-${stage.label}`} 
                className="flex-1 text-center"
                style={{ marginLeft: index === 0 ? '7.5%' : 0 }}
              >
                <span className="text-xs text-muted-foreground">
                  {conversionRate.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pre-configured funnel for job applications
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
      color: 'bg-blue-500',
    },
    { 
      label: 'Interview', 
      value: data.interview, 
      color: 'bg-jobzai-500',
    },
    { 
      label: 'Pending', 
      value: data.pending_decision, 
      color: 'bg-amber-500',
    },
    { 
      label: 'Offer', 
      value: data.offer, 
      color: 'bg-green-500',
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

// Pre-configured funnel for campaigns
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
      color: 'bg-blue-500',
    },
    { 
      label: 'Opened', 
      value: data.opened, 
      color: 'bg-amber-500',
    },
    { 
      label: 'Replied', 
      value: data.replied, 
      color: 'bg-green-500',
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

