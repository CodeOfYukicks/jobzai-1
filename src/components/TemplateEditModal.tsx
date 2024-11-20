import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Save } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import MergeFieldSelector from './MergeFieldSelector';
import TemplatePreview from './TemplatePreview';
import TemplateEditMobile from './mobile/TemplateEditMobile';

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
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return <TemplateEditMobile template={template} onClose={onClose} onSave={onSave} />;
  }

  return (
    <div className={`${inCampaignFlow ? '' : 'fixed inset-0 bg-black bg-opacity-50 z-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        className={`
          bg-[#0A0A1B] text-white
          ${inCampaignFlow ? 'w-full' : 'h-full md:h-auto md:max-h-[90vh] md:rounded-lg md:max-w-4xl md:m-auto md:my-4'}
          flex flex-col
          ${!inCampaignFlow && 'md:relative fixed inset-0'}
        `}
      >
        {/* Header mobile-first */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-medium">Template Studio</h2>
              <p className="text-sm text-gray-400">Create your perfect email</p>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-400 hover:text-gray-300"
            >
              {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <div className="flex items-center space-x-4 w-full">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-sm">1</span>
              <span className="text-sm">Goal</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-800"></div>
            <div className="flex items-center space-x-2 opacity-50">
              <span className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-sm">2</span>
              <span className="text-sm">Content</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-800"></div>
            <div className="flex items-center space-x-2 opacity-50">
              <span className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-sm">3</span>
              <span className="text-sm">Settings</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Template Name</label>
              <input
                type="text"
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="px-4 py-3 text-center border border-gray-700 rounded-lg text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-3 text-center bg-purple-600 rounded-lg text-white font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
