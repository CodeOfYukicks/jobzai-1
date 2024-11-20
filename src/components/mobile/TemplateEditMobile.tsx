import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EmailTemplate } from '../../types';
import MergeFieldSelector from '../MergeFieldSelector';

const MERGE_FIELDS = [
  { 
    label: 'Salutation', 
    value: '{{salutation}}', 
    example: 'Mr/Ms',
    description: 'Formal title (Mr, Ms, Dr, etc.)'
  },
  { 
    label: 'First Name', 
    value: '{{firstName}}', 
    example: 'John' 
  },
  { 
    label: 'Last Name', 
    value: '{{lastName}}', 
    example: 'Doe' 
  },
  { 
    label: 'Company', 
    value: '{{company}}', 
    example: 'Acme Corp' 
  },
  { 
    label: 'Position', 
    value: '{{position}}', 
    example: 'Software Engineer' 
  }
];

interface TemplateEditMobileProps {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (templateId: string) => void;
}

export default function TemplateEditMobile({ template, onClose, onSave }: TemplateEditMobileProps) {
  const [editedTemplate, setEditedTemplate] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    tags: template?.tags?.join(', ') || ''
  });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleMergeFieldSelect = (field: string) => {
    if (!contentRef.current) return;

    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const currentContent = editedTemplate.content;
    
    const newContent = currentContent.substring(0, start) + field + currentContent.substring(end);
    setEditedTemplate(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = start + field.length;
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 bg-white dark:bg-[#0A0A1B] flex flex-col h-full w-full z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-medium">Template Studio</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create your perfect email</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={editedTemplate.name}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
              placeholder="e.g., Professional Introduction"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={editedTemplate.subject}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
              placeholder="Professional Contact Request"
            />
          </div>

          {/* Merge Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Available merge fields
              </label>
              <span className="text-xs text-gray-500">
                • Recipient's information
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MERGE_FIELDS.map(field => (
                <button
                  key={field.value}
                  onClick={() => handleMergeFieldSelect(field.value)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-left"
                >
                  <div className="text-sm font-mono text-purple-600 dark:text-purple-400">
                    {field.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    Example: {field.example}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              Content
            </label>
            <textarea
              ref={contentRef}
              value={editedTemplate.content}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 font-mono"
              placeholder="Dear {{firstName}},

I hope this message finds you well..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editedTemplate.tags}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
              placeholder="explore, en, detailed, ai-generated"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 grid grid-cols-2 gap-3 border-t dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-3 text-center border dark:border-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => template && onSave(template.id)}
          className="px-4 py-3 text-center bg-purple-600 text-white rounded-lg font-medium"
        >
          Save Changes
        </button>
      </div>
    </motion.div>
  );
} 