import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Globe2, Tags, Target, InfoCircle } from 'lucide-react';
import AuthLayout from '../AuthLayout';
import { EMAIL_GOALS } from '../../lib/constants/emailGoals';
import type { Template } from '../../types/template';

interface Props {
  template: Template;
  handleChange: (field: string, value: string) => void;
  handleSave: () => void;
  insertMergeField: (field: string) => void;
}

export function DesktopCreateTemplate({ template, handleChange, handleSave, insertMergeField }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <AuthLayout>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-gray-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Create Template</h1>
              <div className="w-6" />
            </div>

            {/* Form */}
            <div className="space-y-8">
              {/* Template Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <input
                  value={template.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Professional Introduction"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200"
                />
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Line</label>
                <input
                  id="template-subject"
                  value={template.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="e.g., Follow-up: {{position}} opportunity"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  id="template-content"
                  value={template.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 font-mono text-sm"
                  placeholder={`Dear {{salutation}} {{lastName}},\n\nI hope this message finds you well...\n\nBest regards,\n[Your name]`}
                />
              </div>

              {/* Language & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <select
                    value={template.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <input
                    type="text"
                    value={template.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="e.g., professional, introduction"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200"
                  />
                </div>
              </div>

              {/* Generate Template Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="w-full py-3 px-4 bg-[#9333EA] hover:bg-[#9333EA]/90
                    text-white font-medium rounded-xl"
                >
                  Generate Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </div>
  );
} 