import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, UserPlus, Check } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';

interface MobileGoalScreenProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onNext: () => void;
}

export default function MobileGoalScreen({ data, onUpdate, onNext }: MobileGoalScreenProps) {
    const GOALS = [
        {
            id: 'job',
            label: 'Job Search',
            description: 'Find full-time opportunities',
            icon: Briefcase,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50 text-blue-600',
            darkColor: 'dark:bg-blue-500/20 dark:text-blue-400'
        },
        {
            id: 'internship',
            label: 'Internship',
            description: 'Secure learning positions',
            icon: GraduationCap,
            color: 'bg-violet-500',
            lightColor: 'bg-violet-50 text-violet-600',
            darkColor: 'dark:bg-violet-500/20 dark:text-violet-400'
        },
        {
            id: 'networking',
            label: 'Networking',
            description: 'Build professional connections',
            icon: UserPlus,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50 text-emerald-600',
            darkColor: 'dark:bg-emerald-500/20 dark:text-emerald-400'
        }
    ] as const;

    const handleSelect = (goalId: 'job' | 'internship' | 'networking') => {
        onUpdate({ outreachGoal: goalId });
        // Auto-advance after a short delay for visual feedback
        setTimeout(() => {
            onNext();
        }, 350);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                    What's your goal?
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed">
                    We'll tailor every email to match your objective.
                </p>
            </div>

            <div className="flex-1 space-y-3">
                {GOALS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = data.outreachGoal === goal.id;

                    return (
                        <motion.button
                            key={goal.id}
                            onClick={() => handleSelect(goal.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`
                relative w-full text-left p-4 rounded-2xl border transition-all duration-200
                ${isSelected
                                    ? 'bg-white dark:bg-[#2b2a2c] border-[#b7e219] ring-1 ring-[#b7e219] shadow-sm'
                                    : 'bg-white dark:bg-[#2b2a2c] border-gray-100 dark:border-white/[0.06] shadow-sm'
                                }
              `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                  p-3 rounded-xl flex-shrink-0 transition-colors
                  ${isSelected ? 'bg-[#b7e219]/20 text-black dark:text-white' : `${goal.lightColor} ${goal.darkColor}`}
                `}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div className="flex-1 pt-0.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-[17px] font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'}`}>
                                            {goal.label}
                                        </h3>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="bg-[#b7e219] rounded-full p-1"
                                            >
                                                <Check className="w-3 h-3 text-black" strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <p className="text-[13px] text-gray-500 dark:text-white/40 mt-1">
                                        {goal.description}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
