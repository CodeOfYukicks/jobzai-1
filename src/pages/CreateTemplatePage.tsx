import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import TemplatePreview from '../components/TemplatePreview';
import MergeFieldSelector from '../components/MergeFieldSelector';
import { toast } from 'sonner';

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleMergeFieldSelect = (field: string) => {
    if (!contentRef.current) return;

    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const currentContent = template.content;
    
    // Insert merge field at cursor position
    const newContent = currentContent.substring(0, start) + field + currentContent.substring(end);
    setTemplate(prev => ({ ...prev, content: newContent }));

    // Reset cursor position after field insertion
    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = start + field.length;
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const templateData = {
        name: template.name,
        subject: template.subject,
        content: template.content,
        tags: template.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        liked: false,
        aiGenerated: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      await addDoc(templatesRef, templateData);

      toast.success('Template created successfully!');
      navigate('/email-templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/email-templates')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new email template with merge fields
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary rounded-lg px-4 py-2 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{isLoading ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Editor */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  placeholder="e.g., Professional Introduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={template.subject}
                  onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  placeholder="e.g., Application for (Job position) at (Company)"
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
                  value={template.content}
                  onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] font-mono"
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
                  value={template.tags}
                  onChange={(e) => setTemplate(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
                  placeholder="e.g., professional, introduction, follow-up"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <TemplatePreview content={template.content} />
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}