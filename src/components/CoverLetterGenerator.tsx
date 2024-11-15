import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import TemplateCustomizer from './TemplateCustomizer';

interface Template {
  id: number;
  content: string;
  tone: string;
}

interface FormData {
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
}

interface CoverLetterGeneratorProps {
  formData: FormData;
  onSelect: (content: string) => void;
}

export default function CoverLetterGenerator({ formData, onSelect }: CoverLetterGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [customizedContent, setCustomizedContent] = useState<string>('');

  const generateTemplates = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to GPT-4
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTemplates = [
        {
          id: 1,
          tone: 'Professional',
          content: `Dear Hiring Manager,

I am writing to express my strong interest in the ${formData.jobTitle} position at your company. With my background in ${formData.industry} and experience in ${formData.description}, I believe I would be a valuable addition to your team.

I am particularly drawn to this opportunity because it aligns perfectly with my career goals and expertise. My experience has equipped me with the skills necessary to excel in this role.

I would welcome the opportunity to discuss how my background and skills would be an asset to your organization.

Best regards,
[Your name]`
        },
        {
          id: 2,
          tone: 'Enthusiastic',
          content: `Hi there!

I'm incredibly excited about the ${formData.jobTitle} opportunity at your company! Your work in ${formData.industry} really resonates with me, and I'd love to bring my passion and expertise to your team.

${formData.description}

I'd be thrilled to discuss how my skills and enthusiasm could contribute to your continued success.

Best wishes,
[Your name]`
        },
        {
          id: 3,
          tone: 'Balanced',
          content: `Dear Hiring Manager,

I am writing to express my interest in the ${formData.jobTitle} position. Having worked in ${formData.industry}, I understand the unique challenges and opportunities in this field.

${formData.description}

I would appreciate the opportunity to discuss how my background aligns with your needs.

Kind regards,
[Your name]`
        }
      ];
      
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error generating templates:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setCustomizedContent(template.content);
    onSelect(template.content);
  };

  // Generate templates on mount
  useState(() => {
    generateTemplates();
  });

  return (
    <div className="space-y-6">
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6956A8] mx-auto mb-4" />
          <p className="text-gray-500">Generating personalized templates...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Choose Your Template</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select and customize the template that best matches your style
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-lg shadow border-2 transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-[#6956A8] ring-2 ring-[#6956A8]/20'
                    : 'border-gray-200 hover:border-[#6956A8]'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#6956A8]/10 text-[#6956A8]">
                    {template.tone}
                  </span>
                </div>

                <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans mb-4">
                  {template.content}
                </pre>

                <button
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full rounded-lg py-2 transition-colors ${
                    selectedTemplateId === template.id
                      ? 'bg-[#6956A8] text-white'
                      : 'btn-primary'
                  }`}
                >
                  {selectedTemplateId === template.id ? 'Selected' : 'Use This Template'}
                </button>
              </motion.div>
            ))}
          </div>

          {selectedTemplateId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <TemplateCustomizer
                content={customizedContent}
                onUpdate={(content) => {
                  setCustomizedContent(content);
                  onSelect(content);
                }}
              />
            </motion.div>
          )}

          <div className="flex justify-center">
            <button
              onClick={generateTemplates}
              disabled={isGenerating}
              className="text-[#6956A8] hover:text-[#6956A8]/80 flex items-center space-x-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Generate New Templates</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}