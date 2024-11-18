import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, Loader2, Globe2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
    type GenerateOptions,
    type LanguageType,
    type ToneType,
    type UserInfo,
    generateEmailTemplate,
    type GeneratedTemplate
} from '../lib/emailTemplates';

interface GenerateTemplateModalProps {
  onClose: () => void;
  onTemplateCreated?: (templateId: string) => void;
  inCampaignFlow?: boolean;
}

export const MERGE_FIELDS = [
  { label: 'First name', value: '{{prenom}}' },
  { label: 'Last name', value: '{{nom}}' },
  { label: 'Company', value: '{{entreprise}}' },
  { label: 'Region', value: '{{region}}' }
];

type TonePrompts = Record<ToneType, Record<LanguageType, string>>;
type Language = {
  value: LanguageType;
  label: string;
};

export const LANGUAGES: Language[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Fran├ºais' }
];

export default function GenerateTemplateModal({ 
  onClose, 
  onTemplateCreated,
  inCampaignFlow = false 
}: GenerateTemplateModalProps) {
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [options, setOptions] = useState<GenerateOptions>({
    tone: 'professional',
    language: 'en',
    specificPoints: '',
    background: '',
  });

  const TONE_PROMPTS: TonePrompts = {
    professional: {
      en: `Write a short, professional email to someone about a job opportunity${userInfo?.contractType ? ` for a ${userInfo.contractType} position` : ''}. The email should feel personal and polite, introducing the sender, showing interest in the recipient's company, and mentioning that their CV is attached.

Use exactly these merge fields:
- {{prenom}} for first name
- {{nom}} for last name
- {{entreprise}} for company name
- {{region}} for city/region

Keep the tone formal and concise, like it was written by a real person.`,
      fr: `R├®dige un email court et professionnel pour contacter une personne au sujet d'une opportunit├® d'emploi${userInfo?.contractType ? ` pour un poste en ${userInfo.contractType}` : ''}. L'email doit para├«tre personnel et poli, introduire l'exp├®diteur, montrer son int├®r├¬t pour l'entreprise du destinataire, et pr├®ciser que son CV est joint.

Utilise exactement ces champs de fusion:
- {{prenom}} pour le pr├®nom
- {{nom}} pour le nom
- {{entreprise}} pour le nom de l'entreprise
- {{region}} pour la ville/r├®gion

Adopte un ton formel et concis, comme si l'email avait ├®t├® ├®crit par une vraie personne.`
    },
    friendly: {
      en: `Write a short, friendly email to someone about a job opportunity${userInfo?.contractType ? ` for a ${userInfo.contractType} position` : ''}. The email should feel warm and personal, introducing the sender, expressing interest in the recipient's company, and mentioning that their CV is attached.

Use exactly these merge fields:
- {{prenom}} for first name
- {{nom}} for last name
- {{entreprise}} for company name
- {{region}} for city/region
- {{entreprise}} for company name
- {{region}} for city/region

Keep the tone casual and approachable, like it was written by a person.`,
      fr: `R├®dige un email court et amical pour contacter une personne au sujet d'une opportunit├® d'emploi${userInfo?.contractType ? ` pour un poste en ${userInfo.contractType}` : ''}. L'email doit para├«tre chaleureux et personnel, introduire l'exp├®diteur, montrer son int├®r├¬t pour l'entreprise du destinataire, et pr├®ciser que son CV est joint.
Inclure les champs :
Pr├®nom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et ├®ventuellement Ville/R├®gion ({{region}}).
Adopte un ton d├®tendu et accessible, comme si l'email avait ├®t├® ├®crit par quelqu'un.`
    },
    enthusiastic: {
      en: `Write a short, enthusiastic email to someone about a job opportunity${userInfo?.contractType ? ` for a ${userInfo.contractType} position` : ''}. The email should feel personal and exciting, introducing the sender, showing their enthusiasm for the recipient's company, and mentioning that their CV is attached.
Include placeholders for:
Use exactly these merge fields:
- {{prenom}} for first name
- {{nom}} for last name
- {{entreprise}} for company name
- {{region}} for city/region

Keep the tone upbeat and genuine, as if written by a real person.`,
      fr: `R├®dige un email court et enthousiaste pour contacter une personne au sujet d'une opportunit├® d'emploi${userInfo?.contractType ? ` pour un poste en ${userInfo.contractType}` : ''}. L'email doit para├«tre personnel et engageant, introduire l'exp├®diteur, montrer son enthousiasme pour l'entreprise du destinataire, et pr├®ciser que son CV est joint.

Utilise exactement ces champs de fusion:
- {{prenom}} pour le pr├®nom
- {{nom}} pour le nom
- {{entreprise}} pour le nom de l'entreprise
- {{region}} pour la ville/r├®gion

Adopte un ton dynamique et sinc├¿re, comme si l'email avait ├®t├® ├®crit par une vraie personne.`
    }
  };

  useEffect(() => {
    async function loadUserInfo() {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            location: userData.location || '',
            gender: userData.gender || '',
            contractType: userData.contractType || '',
            motivation: userData.motivation || '',
            cvUrl: userData.cvUrl
          });
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    }

    loadUserInfo();
  }, [currentUser]);

  // Type-safe update functions
  const updateOption = <K extends keyof GenerateOptions>(
    key: K,
    value: GenerateOptions[K]
  ) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please log in to generate templates');
      return;
    }

    setIsGenerating(true);
    try {
      const userContext = `Context about the candidate (for AI context only, do not mention explicitly in the email):
- Name: ${userInfo?.firstName} ${userInfo?.lastName}
- Location: ${userInfo?.location}
- Looking for: ${userInfo?.motivation}
- Professional motivation: ${userInfo?.motivation}
${userInfo?.cvUrl ? '- Has attached CV' : ''}

`;

      const template: GeneratedTemplate = await generateEmailTemplate({
        ...options,
        userInfo,
        additionalContext: userContext
      });
      
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const docRef = await addDoc(templatesRef, {
        ...template,
        tone: options.tone,
        language: options.language,
        aiGenerated: true,
        liked: false,
        createdAt: serverTimestamp(),
      });

      toast.success('Template generated successfully');
      
      if (onTemplateCreated) {
        onTemplateCreated(docRef.id);
      }
      onClose();
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  // V├®rifier si l'utilisateur est connect├®
  if (!currentUser) {
    return (
      <div className="p-4 text-center">
        <p>Please log in to generate templates</p>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    );
  }

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

        <form onSubmit={handleGenerate} className="p-6 space-y-6">
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
                  onClick={() => updateOption('tone', tone as ToneType)}
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
                onChange={(e) => updateOption('language', e.target.value as LanguageType)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
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
              onChange={(e) => updateOption('specificPoints', e.target.value)}
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
              onChange={(e) => updateOption('background', e.target.value)}
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
              disabled={isGenerating || !userInfo}
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
