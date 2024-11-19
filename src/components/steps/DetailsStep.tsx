import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MERGE_FIELDS } from '../../lib/constants/mergeFields';

interface DetailsStepProps {
  options: {
    specificPoints: string;
  };
  onSelect: (updates: { specificPoints: string }) => void;
}

export function DetailsStep({ options, onSelect }: DetailsStepProps) {
  const [isMergeFieldsOpen, setIsMergeFieldsOpen] = useState(false);

  return (
    <div className="space-y-6 md:hidden"> {/* Mobile only */}
      {/* Merge Fields Accordion */}
      <div className="space-y-3">
        <button
          onClick={() => setIsMergeFieldsOpen(!isMergeFieldsOpen)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 
            dark:bg-gray-800/50 rounded-lg text-sm font-medium"
        >
          <span>Available merge fields</span>
          {isMergeFieldsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {isMergeFieldsOpen && (
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {Object.values(MERGE_FIELDS).map((field) => (
              <div 
                key={field.value}
                className="flex flex-col p-3 bg-white dark:bg-gray-800 
                  rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {field.label}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(field.value);
                      toast.success('Copied to clipboard!');
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 
                      hover:text-purple-700"
                  >
                    Copy
                  </button>
                </div>
                <code className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {field.value}
                </code>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Example: {field.example}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Context */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Context (Optional)
        </label>
        <textarea
          value={options.specificPoints}
          onChange={(e) => onSelect({ specificPoints: e.target.value })}
          placeholder="Add any specific points you'd like to include..."
          className="w-full p-4 rounded-lg border border-gray-200 
            dark:border-gray-700 bg-white dark:bg-gray-800
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-purple-500 focus:border-transparent
            text-sm resize-none"
          rows={5}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This information will help customize your email template.
        </p>
      </div>

      {/* Tips Section */}
      <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 
        bg-purple-50 dark:bg-purple-900/20 p-4">
        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
          Tips for better results
        </h4>
        <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
          <li>• Use merge fields to personalize your message</li>
          <li>• Keep additional context clear and concise</li>
          <li>• Focus on key points you want to highlight</li>
        </ul>
      </div>
    </div>
  );
} 