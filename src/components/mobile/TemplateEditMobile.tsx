import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Sparkles, Tag as TagIcon } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import MergeFieldSelector from '../MergeFieldSelector';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  tags: string[];
  liked: boolean;
  aiGenerated: boolean;
  createdAt: any;
  updatedAt: any;
}

interface TemplateEditMobileProps {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave?: (templateId: string) => void;
}

export default function TemplateEditMobile({ 
  template, 
  onClose, 
  onSave 
}: TemplateEditMobileProps) {
  const { currentUser } = useAuth();
  const [editedTemplate, setEditedTemplate] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    tags: template?.tags?.join(', ') || ''
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
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-purple-600 to-indigo-600
            text-white font-medium text-sm
            hover:opacity-90 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
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
              focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder="e.g., Professional Introduction"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={editedTemplate.subject}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
              border border-gray-200 dark:border-gray-700 
              rounded-lg text-gray-900 dark:text-white 
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder="e.g., Application for (Job position) at (Company)"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            <div className="flex items-center text-xs text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              <span>Add merge fields</span>
            </div>
          </div>
          
          <div className="mb-4 overflow-x-auto pb-2">
            <MergeFieldSelector 
              onSelectField={handleMergeFieldSelect}
            />
          </div>
          
          <textarea
            ref={contentRef}
            value={editedTemplate.content}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
            rows={10}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
              border border-gray-200 dark:border-gray-700 
              rounded-lg text-gray-900 dark:text-white 
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
              font-mono text-sm"
            placeholder="Dear (First name),

I am writing to express my interest in the (Job position) position at (Company)..."
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (comma-separated)
            </label>
          </div>
          <input
            type="text"
            value={editedTemplate.tags}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
              border border-gray-200 dark:border-gray-700 
              rounded-lg text-gray-900 dark:text-white 
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder="e.g., professional, introduction, follow-up"
          />
        </div>
      </div>
    </motion.div>
  );
} 