import { motion } from 'framer-motion';
import { Wand2, TestTube2, Sparkles, Check } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';
import MobileStepWrapper from './MobileStepWrapper';

interface MobileModeStepProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onNext?: () => void;
    onBack?: () => void;
}

type GenerationMode = 'template' | 'abtest' | 'auto';

export default function MobileModeStep({ data, onUpdate, onNext, onBack }: MobileModeStepProps) {
    const selectedMode = data.emailGenerationMode;

    const modes = [
        {
            id: 'template' as GenerationMode,
            icon: Wand2,
            title: 'Template Mode',
            description: 'Use a single AI-generated template with merge fields',
            recommended: true,
        },
        {
            id: 'abtest' as GenerationMode,
            icon: TestTube2,
            title: 'A/B Testing',
            description: 'Test multiple hooks, bodies, and CTAs to optimize performance',
        },
        {
            id: 'auto' as GenerationMode,
            icon: Sparkles,
            title: 'Fully Personalized',
            description: 'AI generates unique emails for each contact based on their profile',
        },
    ];

    const handleSelectMode = (mode: GenerationMode) => {
        onUpdate({ emailGenerationMode: mode });
    };

    return (
        <MobileStepWrapper
            title="Generation Mode"
            stepCurrent={3}
            stepTotal={6}
            onBack={onBack!}
            onNext={onNext!}
            canProceed={!!selectedMode}
            nextLabel="Next"
        >
            <div className="flex flex-col h-full">
                {/* Header Text */}
                <div className="mb-6">
                    <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed">
                        Choose how you want to create your outreach emails.
                    </p>
                </div>

                {/* Mode Cards */}
                <div className="space-y-4">
                    {modes.map((mode, index) => {
                        const Icon = mode.icon;
                        const isSelected = selectedMode === mode.id;

                        return (
                            <motion.button
                                key={mode.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleSelectMode(mode.id)}
                                className={`relative w-full text-left p-5 rounded-2xl border transition-all duration-200
                  ${isSelected
                                        ? 'bg-white dark:bg-[#1a1a1a] border-[#b7e219] ring-1 ring-[#b7e219] shadow-lg shadow-black/5'
                                        : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06] active:scale-[0.98]'
                                    }
                `}
                            >
                                {/* Recommended Badge */}
                                {mode.recommended && (
                                    <div className="absolute -top-2.5 right-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                      bg-[#b7e219] text-black shadow-sm">
                                            Recommended
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected
                                            ? 'bg-[#b7e219]/20 text-black dark:text-[#b7e219]'
                                            : 'bg-white dark:bg-white/[0.06] text-gray-400 dark:text-white/40'
                                        }
                  `}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`text-[16px] font-semibold
                        ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'}
                      `}>
                                                {mode.title}
                                            </h3>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-5 h-5 rounded-full bg-[#b7e219] flex items-center justify-center"
                                                >
                                                    <Check className="w-3 h-3 text-black" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <p className={`text-[13px] leading-relaxed
                      ${isSelected ? 'text-gray-600 dark:text-white/60' : 'text-gray-500 dark:text-white/40'}
                    `}>
                                            {mode.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </MobileStepWrapper>
    );
}
