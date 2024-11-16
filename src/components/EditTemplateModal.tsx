import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import MergeFieldSelector from './MergeFieldSelector';
import TemplatePreview from './TemplatePreview';
import { EmailTemplate } from '../types';

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
  const { currentUser } = useAuth();
  const [editedTemplate, setEditedTemplate] = useState({
    name: template.name,
    subject: template.subject,
    content: template.content,
    tags: template.tags.join(', ')
  });
  const [showPreview, setShowPreview] = useState(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Template</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-5 w-5 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Show Preview
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Editor */}
            <div className={`flex-1 p-6 overflow-y-auto ${showPreview ? 'border-r' : ''}`}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.subject}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="mb-4">
                    <MergeFieldSelector onSelectField={handleMergeFieldSelect} />
                  </div>
                  <textarea
                    ref={contentRef}
                    value={editedTemplate.content}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.tags}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                <TemplatePreview content={editedTemplate.content} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t bg-gray-50">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="btn-primary rounded-lg px-6 py-2 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}