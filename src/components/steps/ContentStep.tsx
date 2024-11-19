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
        <label className="text-sm font-medium text-gray-200">
          Available merge fields
        </label>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
          {MERGE_FIELDS.map(({ field, example, note }) => (
            <button
              key={field}
              onClick={() => insertMergeField(field)}
              className="flex-shrink-0 flex flex-col items-start p-3 rounded-lg 
                bg-[#0B1120] border border-gray-800
                hover:border-[#9333EA] transition-colors"
            >
              <span className="font-mono text-sm text-[#9333EA]">{field}</span>
              <span className="text-xs text-gray-400">Example: {example}</span>
              {note && <span className="text-xs text-[#9333EA]/80 mt-1">{note}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Line */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Subject Line</label>
        <input
          id="template-subject"
          value={template.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="e.g., Follow-up: {{position}} opportunity"
          className="w-full px-3 py-2 rounded-lg 
            bg-[#0B1120] border border-gray-800
            text-gray-100 placeholder:text-gray-500
            focus:border-[#9333EA] focus:ring-1 focus:ring-[#9333EA]"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Content</label>
        <textarea
          id="template-content"
          value={template.content}
          onChange={(e) => handleChange('content', e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg 
            bg-[#0B1120] border border-gray-800
            text-gray-100 placeholder:text-gray-500
            focus:border-[#9333EA] focus:ring-1 focus:ring-[#9333EA]
            font-mono text-sm"
          placeholder={`Dear {{salutation}} {{lastName}},\n\nI hope this message finds you well...\n\nBest regards,\n[Your name]`}
        />
      </div>
    </div>
  );
} 