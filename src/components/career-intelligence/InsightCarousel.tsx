import { useState, useRef } from 'react';
import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap } from 'lucide-react';

interface InsightData {
    headline: string;
    detail?: string;
}

interface InsightCarouselProps {
    leverage: InsightData;
    risk: InsightData;
    opportunity: InsightData;
    isLoading?: boolean;
}

type InsightType = 'leverage' | 'risk' | 'opportunity';

const insightConfig: Record<InsightType, {
    icon: typeof TrendingUp;
    label: string;
    gradient: string;
    iconBg: string;
    iconColor: string;
}> = {
    leverage: {
        icon: TrendingUp,
        label: 'Leverage',
        gradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    risk: {
        icon: AlertTriangle,
        label: 'Risk',
        gradient: 'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400'
    },
    opportunity: {
        icon: Zap,
        label: 'Opportunity',
        gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400'
    }
};

function InsightCard({
    type,
    data,
    isActive
}: {
    type: InsightType;
    data: InsightData;
    isActive: boolean;
}) {
    const config = insightConfig[type];
    const Icon = config.icon;

    return (
        <motion.div
            className={`flex-shrink-0 w-[calc(100vw-56px)] max-w-[320px] snap-center`}
            animate={{
                scale: isActive ? 1 : 0.95,
                opacity: isActive ? 1 : 0.7
            }}
            transition={{ duration: 0.2 }}
        >
            <div className={`p-5 rounded-2xl bg-gradient-to-br ${config.gradient} border border-white/60 dark:border-white/5`}>
                {/* Icon + Label */}
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {config.label}
                    </span>
                </div>

                {/* Headline — Bold, 1 line max */}
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                    {data.headline}
                </p>

                {/* Detail — Supporting micro-line */}
                {data.detail && (
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-1">
                        {data.detail}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default function InsightCarousel({
    leverage,
    risk,
    opportunity,
    isLoading = false
}: InsightCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    const insights: { type: InsightType; data: InsightData }[] = [
        { type: 'leverage', data: leverage },
        { type: 'risk', data: risk },
        { type: 'opportunity', data: opportunity }
    ];

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 50;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (offset < -threshold || velocity < -500) {
            // Swiped left
            setActiveIndex(prev => Math.min(prev + 1, insights.length - 1));
        } else if (offset > threshold || velocity > 500) {
            // Swiped right
            setActiveIndex(prev => Math.max(prev - 1, 0));
        }
    };

    if (isLoading) {
        return (
            <div className="px-5 py-4">
                <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-[calc(100vw-56px)] max-w-[320px] h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="py-4">
            {/* Carousel Container */}
            <motion.div
                ref={containerRef}
                className="flex gap-3 px-5 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{
                    left: -(insights.length - 1) * 280,
                    right: 0
                }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={{ x: -activeIndex * 290 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ x }}
            >
                {insights.map((insight, index) => (
                    <InsightCard
                        key={insight.type}
                        type={insight.type}
                        data={insight.data}
                        isActive={index === activeIndex}
                    />
                ))}
            </motion.div>

            {/* Dot Indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
                {insights.map((_, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${index === activeIndex
                            ? 'bg-gray-900 dark:bg-white'
                            : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        animate={{ scale: index === activeIndex ? 1.2 : 1 }}
                        transition={{ duration: 0.15 }}
                    />
                ))}
            </div>
        </div>
    );
}
