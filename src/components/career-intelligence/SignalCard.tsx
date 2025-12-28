import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export type SignalStatus = 'green' | 'orange' | 'red';

interface SignalCardProps {
    status: SignalStatus;
    title: string;
    insight: string;
    cta: string;
    onClick: () => void;
    className?: string;
}

const statusConfig = {
    green: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500',
        border: 'border-emerald-100 dark:border-emerald-900/30',
        lightBg: 'bg-emerald-50 dark:bg-emerald-900/10'
    },
    orange: {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-500',
        border: 'border-amber-100 dark:border-amber-900/30',
        lightBg: 'bg-amber-50 dark:bg-amber-900/10'
    },
    red: {
        icon: AlertCircle,
        color: 'text-rose-500',
        bg: 'bg-rose-500',
        border: 'border-rose-100 dark:border-rose-900/30',
        lightBg: 'bg-rose-50 dark:bg-rose-900/10'
    }
};

export default function SignalCard({
    status,
    title,
    insight,
    cta,
    onClick,
    className = ''
}: SignalCardProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`
        w-full text-left relative overflow-hidden
        bg-white dark:bg-[#2b2a2c]
        rounded-2xl p-5
        border border-gray-100 dark:border-[#3d3c3e]
        shadow-sm hover:shadow-md transition-all duration-200
        group
        ${className}
      `}
        >
            {/* Status Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg}`} />

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
          mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${config.lightBg} ${config.color}
        `}>
                    <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {title}
                        </h3>
                        <span className={`
              text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full
              ${config.lightBg} ${config.color}
            `}>
                            {status === 'green' ? 'On Track' : status === 'orange' ? 'Focus' : 'Action'}
                        </span>
                    </div>

                    <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-snug mb-3">
                        {insight}
                    </p>

                    <div className="flex items-center justify-end">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
                            {cta} <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
}
