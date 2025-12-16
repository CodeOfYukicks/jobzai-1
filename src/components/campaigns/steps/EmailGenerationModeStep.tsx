import { motion } from 'framer-motion';
import { Wand2, TestTube2, Sparkles } from 'lucide-react';
import { CampaignData } from '../NewCampaignModal';

interface EmailGenerationModeStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

type GenerationMode = 'template' | 'abtest' | 'auto';

interface ModeOption {
  id: GenerationMode;
  icon: typeof Wand2;
  title: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export default function EmailGenerationModeStep({ data, onUpdate }: EmailGenerationModeStepProps) {
  const selectedMode = data.emailGenerationMode;

  const modes: ModeOption[] = [
    {
      id: 'template',
      icon: Wand2,
      title: 'Template Mode',
      description: 'Use a single AI-generated template with merge fields',
      features: [
        'Best for consistent messaging'
      ],
      recommended: true,
    },
    {
      id: 'abtest',
      icon: TestTube2,
      title: 'A/B Testing',
      description: 'Test multiple hooks, bodies, and CTAs',
      features: [
        'Optimize performance'
      ],
    },
    {
      id: 'auto',
      icon: Sparkles,
      title: 'Fully Personalized',
      description: 'AI generates unique emails for each contact',
      features: [
        'Maximum personalization'
      ],
    },
  ];

  const handleSelectMode = (mode: GenerationMode) => {
    onUpdate({ emailGenerationMode: mode });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Email Generation Mode
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-white/60">
          Choose how emails will be created
        </p>
      </div>

      {/* Mode Cards - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <div key={mode.id} className="flex flex-col">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleSelectMode(mode.id)}
                className={`
                  relative w-full text-left p-5 transition-all duration-200
                  hover:scale-[1.01] active:scale-[0.99]
                  ${isSelected
                    ? 'border-l-[3px] border-l-[#b7e219] border-y border-r border-y-transparent border-r-transparent bg-white dark:bg-[#1f1f1f] shadow-xl shadow-black/[0.08] dark:shadow-black/30 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl'
                    : 'border border-gray-200/80 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md rounded-xl'
                  }
                `}
              >
                {/* Recommended Badge */}
                {mode.recommended && !isSelected && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-white/70 border border-gray-200/80 dark:border-white/[0.08]">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                )}

                {/* Selected Dot Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#b7e219] shadow-sm"
                  />
                )}

                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon - Always neutral gray */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full">
                    <h4 className={`
                      text-[15px] font-bold mb-2
                      ${isSelected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-800 dark:text-gray-200'
                      }
                    `}>
                      {mode.title}
                    </h4>
                    <p className="text-[12px] text-gray-600 dark:text-white/60 mb-4 leading-relaxed min-h-[40px]">
                      {mode.description}
                    </p>

                    {/* Features - Always neutral bullets */}
                    <ul className="space-y-2 text-left">
                      {mode.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-white/50">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-400 dark:bg-white/30" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
