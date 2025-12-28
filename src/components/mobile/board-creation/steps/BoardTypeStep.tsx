import { motion } from 'framer-motion';
import { Briefcase, Send, ArrowRight, Check } from 'lucide-react';
import { BoardType, JOB_COLUMN_LABELS, CAMPAIGN_COLUMN_LABELS } from '../../../../types/job';

interface BoardTypeStepProps {
    selectedType: BoardType;
    onSelect: (type: BoardType) => void;
    onNext: () => void;
}

export default function BoardTypeStep({ selectedType, onSelect, onNext }: BoardTypeStepProps) {
    const types: { id: BoardType; title: string; subtitle: string; icon: any; color: string; labels: Record<string, string> }[] = [
        {
            id: 'jobs',
            title: 'Job Applications',
            subtitle: 'Track applications to job postings with a traditional workflow',
            icon: Briefcase,
            color: '#635BFF',
            labels: JOB_COLUMN_LABELS
        },
        {
            id: 'campaigns',
            title: 'Outreach Campaigns',
            subtitle: 'Manage spontaneous applications and outreach campaigns',
            icon: Send,
            color: '#8B5CF6',
            labels: CAMPAIGN_COLUMN_LABELS
        }
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Board Type</h2>
                    <p className="text-gray-500 dark:text-gray-400">Select the type of board you want to create to get started.</p>
                </div>

                {types.map((type) => (
                    <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            onSelect(type.id);
                            // Optional: auto-advance or let user click Next
                            // onNext(); 
                        }}
                        className={`relative w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${selectedType === type.id
                                ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                                : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c]'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${selectedType === type.id ? 'bg-[#635BFF] text-white' : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <type.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`text-lg font-semibold ${selectedType === type.id ? 'text-[#635BFF]' : 'text-gray-900 dark:text-white'}`}>
                                        {type.title}
                                    </h3>
                                    {selectedType === type.id && (
                                        <div className="w-6 h-6 rounded-full bg-[#635BFF] flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                                    {type.subtitle}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.values(type.labels).slice(0, 3).map((label) => (
                                        <span
                                            key={label}
                                            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3d3c3e] text-[10px] font-medium text-gray-500 dark:text-gray-400"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3d3c3e] text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                        +2 more
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Sticky Bottom CTA */}
            <div className="p-4 bg-white dark:bg-[#1a191b] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
                <button
                    onClick={onNext}
                    className="w-full py-3.5 px-4 bg-[#635BFF] hover:bg-[#534be0] active:bg-[#4640c0] text-white rounded-xl font-semibold text-base shadow-lg shadow-[#635BFF]/20 transition-all flex items-center justify-center gap-2"
                >
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
