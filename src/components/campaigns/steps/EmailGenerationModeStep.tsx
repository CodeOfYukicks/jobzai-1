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
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Choose Your Email Generation Mode
        </h3>
        <p className="text-[12px] text-gray-500 dark:text-white/60">
          Select how you want to create emails for your campaign
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 gap-3">
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
                relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200
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

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'bg-[#b7e219] text-gray-900'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`
                    text-[14px] font-semibold mb-0.5
                    ${isSelected
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-800 dark:text-gray-200'
                    }
                  `}>
                    {mode.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 dark:text-white/60 mb-2">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-1">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-500 dark:text-white/50">
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

