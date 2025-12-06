import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Mail } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import MergeFieldSelector from './MergeFieldSelector';
import TemplatePreview from './TemplatePreview';
import { EmailTemplate } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import EditTemplateMobile from './mobile/TemplateEditMobile';

// Définition des merge fields directement dans le composant
const MERGE_FIELDS = [
  { 
    label: 'Salutation', 
    value: 'salutationField', 
    example: 'Mr/Ms',
    description: 'Formal title (Mr, Ms, Dr, etc.)'
  },
  { 
    label: 'First Name', 
    value: 'firstNameField', 
    example: 'John' 
  },
  { 
    label: 'Last Name', 
    value: 'lastNameField', 
    example: 'Doe' 
  },
  { 
    label: 'Company', 
    value: 'companyField', 
    example: 'Acme Corp' 
  },
];

interface UpdateTemplateData {
  name: string;
  subject: string;
  content: string;
  tags: string[];
  updatedAt: Date;
  [key: string]: string | string[] | Date;
}

interface EditTemplateModalProps {
  template: EmailTemplate;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditTemplateModal({ template, onClose, onUpdate }: EditTemplateModalProps) {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const [editedTemplate, setEditedTemplate] = useState({
    name: template.name,
    subject: template.subject,
    content: template.content,
    tags: template.tags.join(', ')
  });
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to edit templates');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: UpdateTemplateData = {
        name: editedTemplate.name,
        subject: editedTemplate.subject,
        content: editedTemplate.content,
        tags: editedTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updatedAt: new Date()
      };

      const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', template.id);
      await updateDoc(templateRef, updateData);

      toast.success('Template updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isMobile) {
    return (
      <EditTemplateMobile 
        template={template}
        onClose={onClose}
        onSave={handleSubmit}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-[#0B1120] rounded-xl shadow-xl w-full max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Template Name
            </label>
            <input
              type="text"
              value={editedTemplate.name}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-gray-600 
                rounded-lg text-gray-900 dark:text-white
                focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject Line
            </label>
            <input
              type="text"
              value={editedTemplate.subject}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full p-2.5 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-gray-600 
                rounded-lg text-gray-900 dark:text-white
                focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
            />
          </div>

          {/* Merge Fields Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available merge fields
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  • Recipient's information that will be automatically replaced
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MERGE_FIELDS.map(({ label, value, example }) => (
                <button
                  key={value}
                  onClick={() => handleMergeFieldSelect(value)}
                  className="group flex flex-col items-start p-2 rounded 
                    bg-white dark:bg-gray-900/50 
                    border border-gray-200 dark:border-gray-700
                    hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10
                    transition-all duration-150 text-left"
                >
                  <span className="text-sm font-mono text-purple-600 dark:text-purple-400 
                    group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    {value}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-600 
                    dark:group-hover:text-gray-400">
                    Example: {example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            <textarea
              ref={contentRef}
              value={editedTemplate.content}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
              rows={12}
              className="w-full p-3 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-gray-600 
                rounded-lg text-gray-900 dark:text-white font-mono text-sm
                focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
              placeholder="Dear {{firstName}},

I hope this message finds you well..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editedTemplate.tags}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full p-2.5 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-gray-600 
                rounded-lg text-gray-900 dark:text-white
                focus:ring-2 focus:ring-[#9333EA]/20 focus:border-[#9333EA]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-[#9333EA] text-white rounded-lg hover:bg-purple-700"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
