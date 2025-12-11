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
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Email Generation Mode
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-white/60">
          Select how you want to create emails for your campaign
        </p>
      </div>

      {/* Mode Cards - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                ${isSelected
                  ? 'border-[#b7e219] bg-gradient-to-br from-[#b7e219]/10 to-[#b7e219]/5 dark:from-[#b7e219]/15 dark:to-[#b7e219]/5 shadow-xl shadow-[#b7e219]/20'
                  : 'border-gray-200 dark:border-white/[0.08] hover:border-[#b7e219]/50 dark:hover:border-[#b7e219]/50 bg-white dark:bg-[#1a1a1a] hover:shadow-lg'
                }
              `}
            >
              {/* Recommended Badge */}
              {mode.recommended && !isSelected && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#b7e219] text-gray-900 shadow-md">
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
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#b7e219] flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-[#1a1a1a]"
                >
                  <Check className="w-4 h-4 text-gray-900" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                  ${isSelected
                    ? 'bg-[#b7e219] text-gray-900 shadow-lg'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                  }
                `}>
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

                  {/* Features */}
                  <ul className="space-y-2 text-left">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-white/50">
                        <div className={`
                          w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
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
          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
        >
          <p className="text-[11px] text-blue-800 dark:text-blue-300">
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
                <strong>Next step:</strong> Choose your outreach goal, then launch! AI will generate unique emails for each contact.
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* Auto Mode Goal Selector */}
      {selectedMode === 'auto' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="block text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
            Outreach Goal
          </label>
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-lg">
            <button
              type="button"
              onClick={() => onUpdate({ outreachGoal: 'job' })}
              className={`
                flex-1 px-4 py-2 rounded-md text-[12px] font-semibold transition-all duration-200
                ${data.outreachGoal === 'job'
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Job Search
            </button>
            
            <button
              type="button"
              onClick={() => onUpdate({ outreachGoal: 'internship' })}
              className={`
                flex-1 px-4 py-2 rounded-md text-[12px] font-semibold transition-all duration-200
                ${data.outreachGoal === 'internship'
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Internship
            </button>
            
            <button
              type="button"
              onClick={() => onUpdate({ outreachGoal: 'networking' })}
              className={`
                flex-1 px-4 py-2 rounded-md text-[12px] font-semibold transition-all duration-200
                ${data.outreachGoal === 'networking'
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Networking
            </button>
          </div>
        </motion.div>
      )}

      {/* Existing closing div */}
      {selectedMode && selectedMode !== 'auto' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
        >
          <p className="text-[11px] text-blue-800 dark:text-blue-300">
            {selectedMode === 'template' && (
              <>
                <strong>Next step:</strong> Choose your outreach goal and generate AI templates.
              </>
            )}
            {selectedMode === 'abtest' && (
              <>
                <strong>Next step:</strong> Choose your goal and create multiple variants to test.
              </>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}

