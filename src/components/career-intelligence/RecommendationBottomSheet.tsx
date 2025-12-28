import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronUp, ArrowRight } from 'lucide-react';
import { SignalStatus } from './SignalCard';

interface RecommendationBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    status: SignalStatus;
    summary: string;
    details: {
        why: string[];
        steps: string[];
    };
    cta: string;
    onCtaClick?: () => void;
}

const statusConfig = {
    green: {
        bg: 'bg-emerald-500',
        lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-100 dark:border-emerald-900/30'
    },
    orange: {
        bg: 'bg-amber-500',
        lightBg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-100 dark:border-amber-900/30'
    },
    red: {
        bg: 'bg-rose-500',
        lightBg: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-100 dark:border-rose-900/30'
    }
};

export default function RecommendationBottomSheet({
    isOpen,
    onClose,
    title,
    status,
    summary,
    details,
    cta,
    onCtaClick
}: RecommendationBottomSheetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const config = statusConfig[status];

    // Reset expanded state when opening
    useEffect(() => {
        if (isOpen) {
            setIsExpanded(false);
            y.set(0);
        }
    }, [isOpen, y]);

    // Handle drag end
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        const velocityThreshold = 500;

        if (isExpanded) {
            // If expanded, swipe down to collapse or close
            if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
                setIsExpanded(false);
            }
        } else {
            // If collapsed, swipe up to expand
            if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
                setIsExpanded(true);
            }
            // Or swipe down to close
            else if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
                onClose();
            }
        }
    };

    const variants = {
        collapsed: {
            height: '45vh',
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        expanded: {
            height: '85vh',
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        closed: {
            y: '100%',
            transition: { type: 'spring', damping: 30, stiffness: 400 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial="closed"
                        animate={isExpanded ? "expanded" : "collapsed"}
                        exit="closed"
                        variants={variants}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className={`
              fixed bottom-0 left-0 right-0 z-[101]
              bg-white dark:bg-[#1c1c1e]
              rounded-t-[32px] shadow-2xl
              overflow-hidden flex flex-col
            `}
                    >
                        {/* Drag Handle Area */}
                        <div className="pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none bg-white dark:bg-[#1c1c1e] z-10">
                            <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 overflow-y-auto px-6 pb-safe">
                            {/* Header / Summary Section */}
                            <div className="pb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`
                    text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                    ${config.lightBg} ${config.text}
                  `}>
                                        {status === 'green' ? 'On Track' : status === 'orange' ? 'Focus Area' : 'Action Required'}
                                    </span>
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                    {title}
                                </h2>

                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {summary}
                                </p>

                                {/* CTA Button (Always visible in collapsed) */}
                                {!isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-8"
                                    >
                                        <button
                                            onClick={() => setIsExpanded(true)}
                                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform"
                                        >
                                            View Details <ChevronUp className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Detailed Content (Revealed on expand) */}
                            <motion.div
                                animate={{ opacity: isExpanded ? 1 : 0 }}
                                className={`space-y-8 ${!isExpanded ? 'pointer-events-none' : ''}`}
                            >
                                {/* Why Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                        Why this matters
                                    </h3>
                                    <ul className="space-y-3">
                                        {details.why.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.bg}`} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action Steps */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                        Recommended Actions
                                    </h3>
                                    <div className="space-y-3">
                                        {details.steps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#2c2c2e] border border-gray-100 dark:border-transparent"
                                            >
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-[#3a3a3c] text-gray-900 dark:text-white text-xs font-bold flex items-center justify-center shadow-sm border border-gray-100 dark:border-transparent">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-[15px] text-gray-700 dark:text-gray-200 leading-snug pt-0.5">
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Action */}
                                <div className="pt-4 pb-8">
                                    <button
                                        onClick={onCtaClick}
                                        className={`
                      w-full flex items-center justify-center gap-2 py-4 rounded-xl 
                      font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform
                      ${config.bg} text-white
                    `}
                                    >
                                        {cta} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
