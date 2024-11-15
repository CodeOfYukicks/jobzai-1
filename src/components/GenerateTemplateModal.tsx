import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, Loader2, Globe2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateEmailTemplate } from '../lib/emailTemplates';
import { toast } from 'sonner';

interface GenerateTemplateModalProps {
  onClose: () => void;
  onTemplateCreated?: (templateId: string) => void;
  inCampaignFlow?: boolean;
}

interface GenerateOptions {
  tone: 'professional' | 'friendly' | 'enthusiastic';
  specificPoints: string;
  background: string;
  language: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
];

export default function GenerateTemplateModal({ 
  onClose, 
  onTemplateCreated,
  inCampaignFlow = false 
}: GenerateTemplateModalProps) {
  const [options, setOptions] = useState<GenerateOptions>({
    tone: 'professional',
    specificPoints: '',
    background: '',
    language: 'en'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsGenerating(true);

      // Generate template using OpenAI
      const template = await generateEmailTemplate(options);

      // Save to Firestore
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const docRef = await addDoc(templatesRef, {
        ...template,
        tone: options.tone,
        language: options.language,
        aiGenerated: true,
        liked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Template generated successfully!');
      
      if (onTemplateCreated) {
        onTemplateCreated(docRef.id);
      }
      onClose();
    } catch (error) {
      console.error('Error generating template:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to generate template');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={inCampaignFlow ? '' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-lg shadow-xl ${inCampaignFlow ? 'w-full' : 'max-w-2xl w-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Generate Template with AI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tone
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['professional', 'friendly', 'enthusiastic'].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setOptions(prev => ({ ...prev, tone: tone as any }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    options.tone === tone
                      ? 'border-[#8D75E6] bg-[#8D75E6]/5'
                      : 'border-gray-200 hover:border-[#8D75E6]/50'
                  }`}
                >
                  <div className="font-medium text-gray-900 capitalize">{tone}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {tone === 'professional' && 'Formal and business-oriented'}
                    {tone === 'friendly' && 'Warm and approachable'}
                    {tone === 'enthusiastic' && 'Energetic and passionate'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Language
            </label>
            <div className="relative">
              <Globe2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={options.language}
                onChange={(e) => setOptions(prev => ({ ...prev, language: e.target.value }))}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Points to Mention (Optional)
            </label>
            <textarea
              value={options.specificPoints}
              onChange={(e) => setOptions(prev => ({ ...prev, specificPoints: e.target.value }))}
              placeholder="E.g., Mutual connections, shared interests, or specific aspects of their profile that caught your attention"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
            />
          </div>

          {/* Background/Shared Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background & Shared Interests
            </label>
            <textarea
              value={options.background}
              onChange={(e) => setOptions(prev => ({ ...prev, background: e.target.value }))}
              placeholder="E.g., Similar industry experience, educational background, or professional interests"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="btn-primary rounded-lg px-6 py-2 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  <span>Generate Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}