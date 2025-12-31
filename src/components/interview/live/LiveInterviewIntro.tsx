import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, MessageSquare, BarChart3 } from 'lucide-react';
import { InterviewType } from './LiveSessionConfig';

interface LiveInterviewIntroProps {
    onStart: () => void;
    onCancel: () => void;
    questionCount: number;
    interviewType?: InterviewType;
}

const getInterviewTypeLabel = (type?: InterviewType): string => {
    switch (type) {
        case 'general':
            return 'General / HR';
        case 'technical':
            return 'Technical';
        case 'company-specific':
            return 'Company-specific';
        default:
            return 'Interview';
    }
};

const steps = [
    {
        icon: MessageSquare,
        title: 'Read',
        description: 'Question appears',
    },
    {
        icon: Mic,
        title: 'Speak',
        description: 'Record your answer',
    },
    {
        icon: BarChart3,
        title: 'Learn',
        description: 'Get AI feedback',
    },
];

export const LiveInterviewIntro: React.FC<LiveInterviewIntroProps> = ({
    onStart,
    onCancel,
    questionCount,
    interviewType,
}) => {
    return (
        <div className="flex h-full w-full flex-col bg-gradient-to-b from-neutral-50 to-white dark:from-[#1a1a1c] dark:to-[#1a1a1c]">
            {/* Main content - centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full max-w-sm sm:max-w-md text-center"
                >
                    {/* Elegant mic icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="mb-6 sm:mb-8 flex justify-center"
                    >
                        <div className="relative">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 blur-xl scale-150" />

                            {/* Main icon container */}
                            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25">
                                <Mic className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={1.5} />
                            </div>

                            {/* Subtle pulse animation */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-ping opacity-20" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mb-2 text-[22px] sm:text-[28px] font-semibold tracking-tight text-neutral-900 dark:text-white"
                    >
                        Practice Session
                    </motion.h1>

                    {/* Subtitle - interview type & count */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-[15px] text-neutral-500 dark:text-neutral-400"
                    >
                        {getInterviewTypeLabel(interviewType)} • {questionCount} questions
                    </motion.p>

                    {/* Steps - horizontal on mobile, compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="mt-8 sm:mt-10"
                    >
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.title}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + index * 0.08, duration: 0.3 }}
                                        className="flex flex-col items-center"
                                    >
                                        {/* Icon */}
                                        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/[0.06] mb-2">
                                            <step.icon className="h-5 w-5 sm:h-5 sm:w-5 text-neutral-600 dark:text-neutral-300" strokeWidth={1.5} />
                                        </div>
                                        {/* Title */}
                                        <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                                            {step.title}
                                        </span>
                                        {/* Description - hidden on mobile for cleaner look */}
                                        <span className="hidden sm:block text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                            {step.description}
                                        </span>
                                    </motion.div>

                                    {/* Connector line */}
                                    {index < steps.length - 1 && (
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 0 }}
                                            animate={{ scaleX: 1, opacity: 1 }}
                                            transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
                                            className="w-6 sm:w-10 h-[1px] bg-neutral-200 dark:bg-white/10 mb-6 sm:mb-8"
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom action area - fixed at bottom */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex-shrink-0 px-4 pb-6 sm:pb-8 pt-4"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
                <div className="max-w-sm mx-auto space-y-3">
                    {/* Primary CTA */}
                    <button
                        onClick={onStart}
                        className="group relative w-full overflow-hidden rounded-2xl bg-neutral-900 dark:bg-white px-6 py-4 text-[15px] font-semibold text-white dark:text-neutral-900 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Begin Interview
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="absolute inset-0 flex items-center justify-center gap-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            Begin Interview
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                    </button>

                    {/* Cancel link - minimal */}
                    <button
                        onClick={onCancel}
                        className="w-full py-2 text-[14px] font-medium text-neutral-400 dark:text-neutral-500 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
