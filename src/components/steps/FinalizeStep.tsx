import { Target, Tags } from 'lucide-react';
import { StepProps } from '../../types/template';

const EMAIL_GOALS = [
  'Build Connection',
  'Explore Opportunities',
  'Make Introduction'
] as const;

export function FinalizeStep({ template, handleChange }: StepProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Email Goal */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Target className="w-4 h-4" />
          Email Goal
        </label>
        <div className="space-y-2">
          {EMAIL_GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => handleChange('goal', goal.toLowerCase())}
              className={`w-full p-4 rounded-xl border ${
                template.goal === goal.toLowerCase()
                  ? 'bg-[#9333EA]/10 border-[#9333EA] text-white'
                  : 'bg-[#0B1120] border-gray-800 text-gray-300'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Tags className="w-4 h-4" />
          Tags (optional)
        </label>
        <input
          value={template.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="e.g., professional, introduction, job-application"
          className="w-full px-3 py-2 rounded-lg 
            bg-[#0B1120] border border-gray-800
            text-gray-100 placeholder:text-gray-500
            focus:border-[#9333EA] focus:ring-1 focus:ring-[#9333EA]"
        />
        <p className="text-xs text-gray-400">
          Separate tags with commas
        </p>
      </div>
    </div>
  );
} 