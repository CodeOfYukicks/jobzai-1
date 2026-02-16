import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, MessageSquare, BarChart3, Radio } from 'lucide-react';
import { InterviewType } from './LiveSessionConfig';
import { useAuth } from '../../../contexts/AuthContext';

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
        title: 'Read Question',
        description: 'Question appears on screen',
        color: 'blue'
    },
    {
        icon: Mic,
        title: 'Record Answer',
        description: 'Speak naturally to answer',
        color: 'purple'
    },
    {
        icon: BarChart3,
        title: 'Get Feedback',
        description: 'AI analyzes your response',
        color: 'amber'
    },
];

export const LiveInterviewIntro: React.FC<LiveInterviewIntroProps> = ({
    onStart,
    onCancel,
    questionCount,
    interviewType,
}) => {
    const { userData } = useAuth();

    // Extract first name from userData
    const getFirstName = () => {
        if (!userData?.name) return 'there';
        const nameParts = userData.name.trim().split(/\s+/);
        return nameParts[0] || 'there';
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl w-full"
            >
                {/* Welcome Message */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-6 sm:mb-10"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Radio className="h-8 w-8 text-red-600 dark:text-red-400 animate-pulse" />
                    </div>

                    <h1 className="mb-1 sm:mb-2 text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Let's get started, {getFirstName()}
                    </h1>
                    <p className="text-base sm:text-xl text-neutral-600 dark:text-neutral-300">
                        You are about to start a <strong>{questionCount}-question</strong> {getInterviewTypeLabel(interviewType)} session.
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const colorClasses = {
                                blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                                purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
                                amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                            };

                            return (
                                <div
                                    key={step.title}
                                    className="flex flex-col items-center p-4 rounded-xl bg-white border border-neutral-200 dark:bg-white/5 dark:border-white/10"
                                >
                                    <div className={`p-3 rounded-lg mb-3 ${colorClasses[step.color as keyof typeof colorClasses]}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-row items-center justify-center gap-3"
                >
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-neutral-200 px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                        Back
                    </button>
                    <button
                        onClick={onStart}
                        className="group flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 sm:px-10 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        Start Session
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};
