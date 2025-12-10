import { motion } from 'framer-motion';
import { Wand2, TestTube2, Sparkles, Check } from 'lucide-react';
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

const modes: ModeOption[] = [
  {
    id: 'template',
    icon: Wand2,
    title: 'AI Template',
    description: 'Configure preferences and generate customizable templates',
    features: [
      'Set tone, language, and key points',
      'AI generates 2-3 template options',
      'Edit and customize before sending',
      'Use merge fields for personalization'
    ],
    recommended: true,
  },
  {
    id: 'abtest',
    icon: TestTube2,
    title: 'A/B Testing',
    description: 'Configure preferences and test multiple variants',
    features: [
      'Set tone, language, and key points',
      'Create 3-5 different hooks',
      'Test 2-3 body variations',
      'Track which combinations perform best'
    ],
  },
  {
    id: 'auto',
    icon: Sparkles,
    title: 'Auto-Generate',
    description: 'AI creates unique emails automatically - launch directly',
    features: [
      'Fully personalized per contact',
      'No configuration needed',
      'AI analyzes each profile',
      'Fastest setup - 3 steps only'
    ],
  },
];

export default function EmailGenerationModeStep({ data, onUpdate }: EmailGenerationModeStepProps) {
  const selectedMode = data.emailGenerationMode;

  const handleSelectMode = (mode: GenerationMode) => {
    onUpdate({ emailGenerationMode: mode });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Your Email Generation Mode
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/60">
          Select how you want to create emails for your campaign
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 gap-4">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleSelectMode(mode.id)}
              className={`
                relative w-full text-left p-5 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-[#b7e219] bg-[#b7e219]/5 dark:bg-[#b7e219]/10 shadow-lg'
                  : 'border-gray-200 dark:border-white/[0.08] hover:border-[#b7e219]/50 dark:hover:border-[#b7e219]/50 bg-white dark:bg-[#1a1a1a]'
                }
              `}
            >
              {/* Recommended Badge */}
              {mode.recommended && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#b7e219] text-gray-900">
                    <Sparkles className="w-3 h-3" />
                    Recommended
                  </span>
                </div>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#b7e219] flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-gray-900" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'bg-[#b7e219] text-gray-900'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className={`
                    text-base font-semibold mb-1
                    ${isSelected
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-800 dark:text-gray-200'
                    }
                  `}>
                    {mode.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-white/60 mb-3">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-500 dark:text-white/50">
                        <div className={`
                          w-1 h-1 rounded-full mt-1.5 flex-shrink-0
                          ${isSelected ? 'bg-[#b7e219]' : 'bg-gray-400 dark:bg-white/30'}
                        `} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info Box */}
      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
        >
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {selectedMode === 'template' && (
              <>
                <strong>Next step:</strong> Configure your email preferences (tone, language) and generate AI templates.
              </>
            )}
            {selectedMode === 'abtest' && (
              <>
                <strong>Next step:</strong> Configure preferences and create multiple variants to test performance.
              </>
            )}
            {selectedMode === 'auto' && (
              <>
                <strong>Next step:</strong> Launch directly! AI will generate unique emails for each contact automatically.
              </>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}

