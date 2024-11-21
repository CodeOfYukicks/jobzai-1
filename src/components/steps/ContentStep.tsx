import { StepProps } from '../../types/template';

const MERGE_FIELDS = [
  { field: '{{salutation}}', example: 'Mr/Ms', note: 'Formal title' },
  { field: '{{firstName}}', example: 'John' },
  { field: '{{lastName}}', example: 'Doe' },
  { field: '{{company}}', example: 'Acme Corp' },
  { field: '{{position}}', example: 'Software Engineer' }
];

interface ContentStepProps extends StepProps {
  insertMergeField: (field: string) => void;
}

export function ContentStep({ template, handleChange, insertMergeField }: ContentStepProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Merge Fields */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
          Available merge fields
        </label>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
          {MERGE_FIELDS.map(({ field, example, note }) => (
            <button
              key={field}
              onClick={() => insertMergeField(field)}
              className="flex-shrink-0 flex flex-col items-start p-3 rounded-lg 
                bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                hover:border-purple-500 transition-colors"
            >
              <span className="font-mono text-sm text-purple-600 dark:text-purple-500">{field}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Example: {example}</span>
              {note && <span className="text-xs text-purple-500/80 dark:text-purple-400/80 mt-1">{note}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Line */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Subject Line</label>
        <input
          id="template-subject"
          value={template.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="e.g., Follow-up: {{position}} opportunity"
          className="w-full px-3 py-2 rounded-lg 
            bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200">Content</label>
        <textarea
          id="template-content"
          value={template.content}
          onChange={(e) => handleChange('content', e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg 
            bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:border-purple-500 focus:ring-1 focus:ring-purple-500
            font-mono text-sm"
          placeholder={`Dear {{salutation}} {{lastName}},\n\nI hope this message finds you well...\n\nBest regards,\n[Your name]`}
        />
      </div>
    </div>
  );
} 