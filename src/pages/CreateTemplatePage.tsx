import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Save, Tag, Mail, Type, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';

const MERGE_FIELDS = [
  { id: 'firstName', label: 'First name', value: '{{prenom}}' },
  { id: 'lastName', label: 'Last name', value: '{{nom}}' },
  { id: 'company', label: 'Company', value: '{{entreprise}}' },
  { id: 'position', label: 'Position', value: '{{position}}' },
  { id: 'region', label: 'Region', value: '{{region}}' }
];

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    tags: ''
  });

  const handleMergeFieldInsert = (field: typeof MERGE_FIELDS[0]) => {
    const textArea = document.getElementById('content') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const newContent = 
        template.content.substring(0, start) + 
        field.value + 
        template.content.substring(end);
      
      setTemplate({ ...template, content: newContent });
      
      // Reset cursor position after field insertion
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(start + field.value.length, start + field.value.length);
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error('Please sign in to save templates');
      return;
    }

    if (!template.name || !template.subject || !template.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const templateRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      await addDoc(templateRef, {
        ...template,
        tags: template.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Template saved successfully');
      navigate('/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Create Template</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="e.g., Professional Introduction"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D75E6] focus:border-transparent"
                  />
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="e.g., Application for {position}"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D75E6] focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="relative">
                    <textarea
                      id="content"
                      value={template.content}
                      onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8D75E6] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Merge Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merge Fields
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MERGE_FIELDS.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => handleMergeFieldInsert(field)}
                        className="inline-flex items-center px-3 py-1.5 bg-[#8D75E6]/10 text-[#8D75E6] rounded-lg hover:bg-[#8D75E6]/20 text-sm"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={template.tags}
                    onChange={(e) => setTemplate({ ...template, tags: e.target.value })}
                    placeholder="e.g., professional, introduction (comma-separated)"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D75E6] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Preview content */}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
