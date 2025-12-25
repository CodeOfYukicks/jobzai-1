import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Code, Building2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export type InterviewType = 'general' | 'technical' | 'company-specific';
export type QuestionCount = 5 | 8 | 10;

interface LiveSessionConfigProps {
    onStart: (type: InterviewType, count: QuestionCount) => void;
    onCancel: () => void;
    companyName?: string;
    position?: string;
}

const INTERVIEW_TYPES = [
    {
        id: 'general' as InterviewType,
        label: 'General / HR',
        description: 'Motivations, personality, culture fit',
        icon: Users,
        color: 'blue'
    },
    {
        id: 'technical' as InterviewType,
        label: 'Technical',
        description: 'Based on the job → Salesforce Admin / Dev / SE',
        icon: Code,
        color: 'purple'
    },
    {
        id: 'company-specific' as InterviewType,
        label: 'Company-specific',
        description: 'Instacart, Google, Salesforce… Role-specific',
        icon: Building2,
        color: 'amber'
    }
];

const QUESTION_COUNTS: QuestionCount[] = [5, 8, 10];

export const LiveSessionConfig: React.FC<LiveSessionConfigProps> = ({
    onStart,
    onCancel,
    companyName,
    position
}) => {
    const { userData } = useAuth();
    const [selectedType, setSelectedType] = useState<InterviewType>('general');
    const [selectedCount, setSelectedCount] = useState<QuestionCount>(5);

    // Extract first name from userData
    const getFirstName = () => {
        if (!userData?.name) return 'there';
        const nameParts = userData.name.trim().split(/\s+/);
        return nameParts[0] || 'there';
    };

    const handleStart = () => {
        onStart(selectedType, selectedCount);
    };

    const selectedTypeData = INTERVIEW_TYPES.find(t => t.id === selectedType);

    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl w-full"
            >
                {/* Welcome Message - No icon, compact */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-6 sm:mb-10"
                >
                    <h1 className="mb-1 sm:mb-2 text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Hello {getFirstName()},
                    </h1>
                    <p className="text-base sm:text-xl text-neutral-600 dark:text-neutral-300">
                        ready for your interview?
                    </p>
                </motion.div>

                {/* Interview Type Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-6 sm:mb-8"
                >
                    <h2 className="mb-3 sm:mb-4 text-sm sm:text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                        Choose interview type
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                        {INTERVIEW_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedType === type.id;
                            const colorClasses = {
                                blue: isSelected
                                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-500/20 dark:border-blue-400'
                                    : 'bg-white border-neutral-200 dark:bg-white/5 dark:border-white/10',
                                purple: isSelected
                                    ? 'bg-purple-50 border-purple-500 dark:bg-purple-500/20 dark:border-purple-400'
                                    : 'bg-white border-neutral-200 dark:bg-white/5 dark:border-white/10',
                                amber: isSelected
                                    ? 'bg-amber-50 border-amber-500 dark:bg-amber-500/20 dark:border-amber-400'
                                    : 'bg-white border-neutral-200 dark:bg-white/5 dark:border-white/10'
                            };
                            const iconColorClasses = {
                                blue: isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500',
                                purple: isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 dark:text-neutral-500',
                                amber: isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500'
                            };

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`group relative rounded-xl border-2 p-3 sm:p-5 text-left transition-all active:scale-[0.98] sm:hover:scale-105 ${colorClasses[type.color as keyof typeof colorClasses]}`}
                                >
                                    <div className="mb-1.5 sm:mb-3 flex items-center gap-2 sm:gap-3">
                                        <div className={`rounded-lg p-1.5 sm:p-2 ${isSelected ? 'bg-white/50 dark:bg-white/10' : 'bg-neutral-100 dark:bg-white/5'}`}>
                                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColorClasses[type.color as keyof typeof iconColorClasses]}`} />
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="h-2 w-2 rounded-full bg-current"
                                                style={{ color: `var(--color-${type.color})` }}
                                            />
                                        )}
                                    </div>
                                    <h3 className={`text-sm sm:text-base mb-0.5 sm:mb-1 font-semibold ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                        {type.label}
                                    </h3>
                                    <p className={`text-xs sm:text-sm ${isSelected ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-500'} line-clamp-1 sm:line-clamp-none`}>
                                        {type.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Question Count Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mb-6 sm:mb-10"
                >
                    <h2 className="mb-3 sm:mb-4 text-sm sm:text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                        Number of questions
                    </h2>
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {QUESTION_COUNTS.map((count) => {
                            const isSelected = selectedCount === count;
                            return (
                                <button
                                    key={count}
                                    onClick={() => setSelectedCount(count)}
                                    className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${isSelected
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-white/5 dark:text-neutral-400 dark:ring-white/10 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {count}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-row items-center justify-center gap-3"
                >
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-neutral-200 px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        className="group flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        Start Session
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

