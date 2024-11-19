import { Zap, FileText, Globe2 } from 'lucide-react';
import { EMAIL_LENGTHS, type EmailLength } from '../../lib/constants/emailLength';
import type { LanguageType } from '../../lib/emailTemplates';

interface StyleStepProps {
  options: {
    length: EmailLength;
    language: LanguageType;
  };
  onSelect: (updates: { length?: EmailLength; language?: LanguageType }) => void;
}

export function StyleStep({ options, onSelect }: StyleStepProps) {
  return (
    <div className="space-y-6 md:hidden"> {/* Mobile only */}
      {/* Length Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Length
        </label>
        {Object.entries(EMAIL_LENGTHS).map(([key, length]) => (
          <button
            key={key}
            onClick={() => onSelect({ length: key as EmailLength })}
            className={`w-full p-4 rounded-lg border transition-all flex items-center gap-3
              ${options.length === key
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
              }
            `}
          >
            {length.icon === 'Zap' ? (
              <Zap className="h-5 w-5 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 flex-shrink-0" />
            )}
            <div className="flex-1 text-left">
              <div className="font-medium">{length.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {length.description[options.language]}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Language Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Globe2 className="h-4 w-4" />
          Language
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect({ language: 'en' })}
            className={`p-4 rounded-lg border transition-all
              ${options.language === 'en'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
              }
            `}
          >
            <div className="font-medium">English</div>
          </button>
          <button
            onClick={() => onSelect({ language: 'fr' })}
            className={`p-4 rounded-lg border transition-all
              ${options.language === 'fr'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
              }
            `}
          >
            <div className="font-medium">Français</div>
          </button>
        </div>
      </div>
    </div>
  );
} 