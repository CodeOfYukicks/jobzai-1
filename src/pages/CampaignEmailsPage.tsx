import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2, Copy, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

interface EmailTemplate {
  id: number;
  subject: string;
  content: string;
  tone: 'Professional' | 'Casual' | 'Enthusiastic';
  rating?: number;
}

export default function CampaignEmailsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // This would come from GPT-4
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: 1,
      subject: "Experienced Software Developer Ready to Add Value to Your Team",
      content: "Dear [Hiring Manager],\n\nI hope this email finds you well. I came across the [Position] role at [Company] and I'm excited about the opportunity to contribute to your team.\n\nWith 5 years of experience in full-stack development and a proven track record of delivering scalable solutions, I believe I would be a valuable addition to your organization...",
      tone: 'Professional'
    },
    {
      id: 2,
      subject: "Passionate Developer Looking to Join Your Innovation Journey",
      content: "Hi [Hiring Manager],\n\nI'm reaching out because I'm really excited about the [Position] position at [Company]. Your work on [Recent Project/Achievement] caught my attention, and I'd love to be part of such an innovative team...",
      tone: 'Enthusiastic'
    },
    {
      id: 3,
      subject: "Let's Talk About How I Can Help [Company] Grow",
      content: "Hello [Hiring Manager],\n\nI noticed [Company] is looking for a [Position], and I think we might be a great match. I've been following your company's growth, and I'm particularly impressed by your approach to [Company Value/Project]...",
      tone: 'Casual'
    }
  ]);

  const handleRegenerateEmails = () => {
    setIsGenerating(true);
    // Simulate API call to GPT-4
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleRateTemplate = (templateId: number, isPositive: boolean) => {
    setEmailTemplates(templates =>
      templates.map(template =>
        template.id === templateId
          ? { ...template, rating: isPositive ? 1 : -1 }
          : template
      )
    );
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    setEditedContent(template.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedTemplate) {
      setEmailTemplates(templates =>
        templates.map(template =>
          template.id === selectedTemplate
            ? { ...template, content: editedContent }
            : template
        )
      );
      setIsEditing(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI-Generated Email Templates</h1>
              <p className="mt-1 text-sm text-gray-500">
                Choose and customize your preferred email template
              </p>
            </div>
            <button
              onClick={handleRegenerateEmails}
              disabled={isGenerating}
              className="btn-primary rounded-lg px-4 py-2 flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Regenerate Templates
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 gap-6">
            {emailTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-lg shadow-lg border-2 ${
                  selectedTemplate === template.id
                    ? 'border-[#bb3e38]'
                    : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.subject}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {template.tone}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRateTemplate(template.id, true)}
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        template.rating === 1 ? 'text-green-500' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRateTemplate(template.id, false)}
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        template.rating === -1 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsDown className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isEditing && selectedTemplate === template.id ? (
                  <div className="space-y-4">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={8}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#bb3e38] focus:border-[#bb3e38]"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="btn-primary rounded-lg px-4 py-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans">
                      {template.content}
                    </pre>
                    <div className="absolute top-0 right-0 space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(template.content);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setShowPreview(true);
                      }}
                      className="btn-primary rounded-lg px-6 py-2"
                    >
                      Use This Template
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Preview Modal */}
          {showPreview && selectedTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Preview & Confirm
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    This template will be used to generate personalized emails for each company in your campaign.
                    Variables like [Company], [Position], and [Hiring Manager] will be automatically replaced.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Test Variables
                    </label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <input
                        type="text"
                        placeholder="Company Name"
                        className="p-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        className="p-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Hiring Manager"
                        className="p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Handle template confirmation
                        setShowPreview(false);
                      }}
                      className="btn-primary rounded-lg px-6 py-2 flex items-center"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Confirm Template
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AuthLayout>
  );
}