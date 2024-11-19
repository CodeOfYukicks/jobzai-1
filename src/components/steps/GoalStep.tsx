import { type EmailGoal, EMAIL_GOALS } from '../../lib/constants/emailGoals';

interface GoalStepProps {
  options: { goal: EmailGoal; language: LanguageType };
  onSelect: (goal: EmailGoal) => void;
}

export function GoalStep({ options, onSelect }: GoalStepProps) {
  return (
    <div className="space-y-4">
      {Object.entries(EMAIL_GOALS).map(([key, goal]) => (
        <button
          key={key}
          onClick={() => onSelect(key as EmailGoal)}
          className={`w-full p-4 rounded-lg border transition-all
            ${options.goal === key
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 text-left">
              <div className="font-medium mb-1">{goal.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {goal.examples[options.language]}
              </div>
            </div>
            <div className={`mt-1 w-2 h-2 rounded-full ${
              options.goal === key 
                ? 'bg-purple-500' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          </div>
        </button>
      ))}
    </div>
  );
} 