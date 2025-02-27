import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Save } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

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
    <div className={`${inCampaignFlow ? '' : 'fixed inset-0 bg-black/20 dark:bg-black/50 z-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        className={`
          bg-white dark:bg-[#0A0A1B] 
          text-gray-900 dark:text-white
          ${inCampaignFlow ? 'w-full h-[calc(100vh-180px)]' : 'h-full'}
          flex flex-col
          rounded-xl
          shadow-2xl
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800/50">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Template Studio
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create your perfect email</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="text-sm">Hide Preview</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Show Preview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800/50">
          <div className="flex items-center justify-between max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8D75E6] text-white">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Goal</span>
            </div>
            <div className="flex-1 h-[2px] mx-4 bg-[#8D75E6]/50" />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8D75E6] text-white">
                2
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Content</span>
            </div>
            <div className="flex-1 h-[2px] mx-4 bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full 
                border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                3
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500">Settings</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0A0A1B]">
          <div className="space-y-6 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                  border border-gray-200 dark:border-gray-700 
                  rounded-lg text-gray-900 dark:text-white 
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]"
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
        <div className="p-6 border-t border-gray-200 dark:border-gray-800/50 bg-white dark:bg-[#0A0A1B]">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-300 
                border border-gray-200 dark:border-gray-700 
                hover:bg-gray-100 dark:hover:bg-gray-800/50 
                rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#8D75E6] hover:bg-[#7B64D5] 
                text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
