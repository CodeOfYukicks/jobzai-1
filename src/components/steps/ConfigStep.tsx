import { Globe2 } from 'lucide-react';
import type { StepProps } from '../../types/template';

export function ConfigStep({ template, handleChange }: StepProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Template Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Template Name</label>
        <input
          value={template.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Professional Introduction"
          className="w-full px-3 py-2 rounded-lg 
            bg-[#0B1120] border border-gray-800
            text-gray-100 placeholder:text-gray-500
            focus:border-[#9333EA] focus:ring-1 focus:ring-[#9333EA]"
        />
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Globe2 className="w-4 h-4" />
          Language
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['en', 'fr'].map((lang) => (
            <button
              key={lang}
              onClick={() => handleChange('language', lang)}
              className={`p-4 rounded-xl border ${
                template.language === lang
                  ? 'bg-[#9333EA]/10 border-[#9333EA] text-white'
                  : 'bg-[#0B1120] border-gray-800 text-gray-300'
              }`}
            >
              {lang === 'en' ? 'English' : 'Français'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 