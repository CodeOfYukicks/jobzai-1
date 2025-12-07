import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Zap, Target, Briefcase,
  Globe, Check, Sparkles, Users, Mail
} from 'lucide-react';
import type { CampaignData, EmailTone, EmailLength } from '../NewCampaignModal';

interface EmailPreferencesStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

const TONE_OPTIONS: { value: EmailTone; label: string; icon: typeof Zap; description: string; example: string }[] = [
  { 
    value: 'casual', 
    label: 'Casual', 
    icon: MessageSquare,
    description: 'Friendly & approachable',
    example: '"Hey John, saw what Stripe is doing with..."'
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    icon: Briefcase,
    description: 'Warm but formal',
    example: '"Dear Mr. Smith, I noticed your team at..."'
  },
  { 
    value: 'bold', 
    label: 'Bold', 
    icon: Target,
    description: 'Direct & confident',
    example: '"John - your API launch caught my eye..."'
  }
];

const LENGTH_OPTIONS: { value: EmailLength; label: string; lines: string }[] = [
  { value: 'short', label: 'Short', lines: '3-4 lines' },
  { value: 'medium', label: 'Medium', lines: '5-7 lines' },
  { value: 'detailed', label: 'Detailed', lines: '8-10 lines' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en' as const, label: 'English', flag: '🇺🇸' },
  { value: 'fr' as const, label: 'Français', flag: '🇫🇷' }
];

export default function EmailPreferencesStep({ data, onUpdate }: EmailPreferencesStepProps) {
  const [showKeyPoints, setShowKeyPoints] = useState(!!data.keyPoints);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Email Preferences
        </h3>
        <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
          Set your style. AI will generate a unique email for each contact.
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl 
          bg-violet-50 dark:bg-violet-500/10 
          border border-violet-200 dark:border-violet-500/20"
      >
        <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium text-violet-900 dark:text-violet-200">
            Personalized for each contact
          </p>
          <p className="text-[12px] text-violet-700 dark:text-violet-300/70 mt-1">
            Once we find your contacts, AI will craft a unique email for each person using their name, 
            company, role, and recent company news. No templates, no merge fields.
          </p>
        </div>
      </motion.div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Tone
        </label>
        <div className="grid gap-3">
          {TONE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = data.emailTone === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate({ emailTone: option.value })}
                className={`relative p-4 rounded-xl border text-left transition-all duration-150
                  ${isSelected
                    ? 'bg-gray-100 dark:bg-white/[0.08] border-gray-300 dark:border-white/20'
                    : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isSelected 
                      ? 'bg-gray-900 dark:bg-white' 
                      : 'bg-gray-200 dark:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white dark:text-black' : 'text-gray-500 dark:text-white/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-[14px] font-medium ${
                        isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/70'
                      }`}>
                        {option.label}
                      </p>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                          <Check className="w-3 h-3 text-white dark:text-black" />
                        </div>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-white/40 mt-0.5">
                      {option.description}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mt-2 italic">
                      {option.example}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Length Selection */}
      <div className="space-y-3">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Length
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LENGTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ emailLength: option.value })}
              className={`p-3 rounded-lg border text-center transition-all duration-150
                ${data.emailLength === option.value
                  ? 'bg-gray-100 dark:bg-white/[0.08] border-gray-300 dark:border-white/20'
                  : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10'
                }`}
            >
              <p className={`text-[13px] font-medium ${
                data.emailLength === option.value ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white/60'
              }`}>
                {option.label}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
                {option.lines}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ language: option.value })}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-150
                ${data.language === option.value
                  ? 'bg-gray-100 dark:bg-white/[0.08] border-gray-300 dark:border-white/20'
                  : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10'
                }`}
            >
              <span className="text-lg">{option.flag}</span>
              <span className={`text-[13px] font-medium ${
                data.language === option.value ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white/60'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Key Points (Optional) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowKeyPoints(!showKeyPoints)}
          className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40 
            hover:text-gray-700 dark:hover:text-white/60 transition-colors"
        >
          <span>{showKeyPoints ? '−' : '+'}</span>
          <span>Add key points to mention (optional)</span>
        </button>
        
        {showKeyPoints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <textarea
              value={data.keyPoints || ''}
              onChange={(e) => onUpdate({ keyPoints: e.target.value })}
              placeholder="e.g., Mention my experience with React, focus on startups, reference their recent Series B..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] 
                border border-gray-200 dark:border-white/[0.08] rounded-lg
                text-[13px] text-gray-900 dark:text-white 
                placeholder:text-gray-400 dark:placeholder:text-white/30
                resize-none focus:outline-none focus:border-gray-300 dark:focus:border-white/20
                transition-all duration-150"
            />
            <p className="text-[11px] text-gray-400 dark:text-white/30">
              AI will incorporate these points naturally into each email
            </p>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/[0.06] flex items-center justify-center">
            <Mail className="w-4 h-4 text-gray-500 dark:text-white/40" />
          </div>
          <div>
            <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium">
              Email Style
            </p>
          </div>
        </div>
        <p className="text-[14px] text-gray-700 dark:text-white/70">
          <span className="text-gray-900 dark:text-white font-medium">
            {TONE_OPTIONS.find(t => t.value === data.emailTone)?.label}
          </span>
          {' '}&middot;{' '}
          <span className="text-gray-900 dark:text-white font-medium">
            {LENGTH_OPTIONS.find(l => l.value === data.emailLength)?.label}
          </span>
          {' '}&middot;{' '}
          <span className="text-gray-900 dark:text-white font-medium">
            {LANGUAGE_OPTIONS.find(l => l.value === data.language)?.label}
          </span>
        </p>
      </motion.div>
    </div>
  );
}

