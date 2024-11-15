import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Save } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import MergeFieldSelector from './MergeFieldSelector';
import TemplatePreview from './TemplatePreview';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  tags: string[];
}

interface TemplateEditModalProps {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave?: (templateId: string) => void;
  inCampaignFlow?: boolean;
}

export default function TemplateEditModal({ 
  template, 
  onClose, 
  onSave,
  inCampaignFlow = false 
}: TemplateEditModalProps) {
  const { currentUser } = useAuth();
  const [editedTemplate, setEditedTemplate] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    tags: template?.tags?.join(', ') || ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);

      const templateData = {
        name: editedTemplate.name,
        subject: editedTemplate.subject,
        content: editedTemplate.content,
        tags: editedTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updatedAt: serverTimestamp()
      };

      if (template) {
        // Update existing template
        const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', template.id);
        await updateDoc(templateRef, templateData);
        if (onSave) onSave(template.id);
      } else {
        // Create new template
        const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
        const docRef = await addDoc(templatesRef, {
          ...templateData,
          aiGenerated: false,
          liked: false,
          createdAt: serverTimestamp()
        });
        if (onSave) onSave(docRef.id);
      }

      toast.success(`Template ${template ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${template ? 'update' : 'create'} template`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={inCampaignFlow ? '' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-lg shadow-xl ${inCampaignFlow ? 'w-full' : 'max-w-4xl w-full max-h-[90vh]'} flex flex-col`}
      >
        {/* Mobile-friendly header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile-optimized content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Editor with improved mobile spacing */}
            <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${showPreview ? 'lg:border-r' : ''}`}>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                    placeholder="e.g., Professional Introduction"
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
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                    placeholder="e.g., Application for (Job position) at (Company)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2">
                    <MergeFieldSelector 
                      onSelectField={(field) => {
                        setEditedTemplate(prev => ({
                          ...prev,
                          content: prev.content + field
                        }));
                      }}
                    />
                  </div>
                  <textarea
                    value={editedTemplate.content}
                    onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] font-mono"
                    placeholder="Dear (First name),

I am writing to express my interest in the (Job position) position at (Company)..."
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
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                    placeholder="e.g., professional, introduction, follow-up"
                  />
                </div>
              </div>
            </div>

            {/* Preview Panel - Hidden on mobile by default */}
            {showPreview && (
              <div className="hidden lg:block flex-1 p-6 bg-gray-50 overflow-y-auto">
                <TemplatePreview content={editedTemplate.content} />
              </div>
            )}

            {/* Mobile Preview - Shown as expandable section */}
            {showPreview && (
              <div className="lg:hidden border-t bg-gray-50 p-4">
                <div className="mb-2 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <TemplatePreview content={editedTemplate.content} />
              </div>
            )}
          </div>
        </div>

        {/* Mobile-optimized footer */}
        <div className="flex justify-end items-center p-4 sm:p-6 border-t bg-gray-50">
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 text-gray-700 hover:text-gray-900 text-base font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none btn-primary rounded-lg px-6 py-3 text-base font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{isSaving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}