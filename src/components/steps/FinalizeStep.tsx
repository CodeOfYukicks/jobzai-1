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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
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
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-900 dark:text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
          <Tags className="w-4 h-4" />
          Tags (optional)
        </label>
        <input
          value={template.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="e.g., professional, introduction, job-application"
          className="w-full px-3 py-2 rounded-lg 
            bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-900 dark:text-gray-400">
          Separate tags with commas
        </p>
      </div>
    </div>
  );
} 