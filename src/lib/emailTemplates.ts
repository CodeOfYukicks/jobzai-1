import { getOpenAIInstance } from './openai';

// Base types
export type ToneType = 'professional' | 'friendly' | 'enthusiastic';
export type LanguageType = 'en' | 'fr';

// Interfaces
export interface MergeField {
    label: string;
    value: string;
}

export interface GeneratedTemplate {
    name: string;
    subject: string;
    content: string;
    tags: string[];
}

// Mettre ├á jour l'interface UserInfo
export interface UserInfo {
    firstName: string;
    lastName: string;
    location: string;
    gender: 'male' | 'female' | '';
    contractType: 'full-time' | 'part-time' | 'contract' | 'internship' | '';
    motivation: string;
    cvUrl?: string;
}

export interface GenerateOptions {
    tone: ToneType;
    specificPoints: string;
    background: string;
    language: LanguageType;
    userInfo: UserInfo;
}

// Constants
export const MERGE_FIELDS: readonly MergeField[] = [
    { label: 'First name', value: '{{prenom}}' },
    { label: 'Last name', value: '{{nom}}' },
    { label: 'Company', value: '{{entreprise}}' },
    { label: 'Region', value: '{{region}}' }
] as const;

export const TONE_PROMPTS: Record<ToneType, Record<LanguageType, string>> = {
    professional: {
        en: `Write a short, professional email to introduce yourself and request an initial exchange about potential opportunities at their company. Keep the tone polite and concise, and mention that your CV is attached.

Include placeholders for:
First name ({{prenom}}), Last name ({{nom}}), Company name ({{entreprise}}), and optional City/Region ({{region}}).

Ensure the email feels professional and written by a real person.`,
        
        fr: `R├®dige un email court et professionnel pour te pr├®senter bri├¿vement et demander un ├®change sur des opportunit├®s potentielles dans leur entreprise. Adopte un ton poli et concis, et pr├®cise que ton CV est joint.

Inclure les champs :
Pr├®nom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et ├®ventuellement Ville/R├®gion ({{region}}).

L'email doit ├¬tre professionnel et naturel, comme ├®crit par une vraie personne.`
    },
    
    friendly: {
        en: `Write a short, friendly email to introduce yourself and request a quick chat about potential opportunities at their company. Keep the tone warm and approachable, and mention that your CV is attached.

Include placeholders for:
First name ({{prenom}}), Last name ({{nom}}), Company name ({{entreprise}}), and optional City/Region ({{region}}).

Ensure the email feels like it's written by a real person.`,
        
        fr: `R├®dige un email court et amical pour te pr├®senter bri├¿vement et demander un ├®change rapide sur des opportunit├®s potentielles dans leur entreprise. Adopte un ton chaleureux et accessible, et pr├®cise que ton CV est joint.

Inclure les champs :
Pr├®nom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et ├®ventuellement Ville/R├®gion ({{region}}).

L'email doit sembler naturel et ├®crit par une vraie personne.`
    },
    
    enthusiastic: {
        en: `Write a short, enthusiastic email to introduce yourself and request a quick conversation about potential opportunities at their company. Keep the tone excited and genuine, and mention that your CV is attached.

Include placeholders for:
First name ({{prenom}}), Last name ({{nom}}), Company name ({{entreprise}}), and optional City/Region ({{region}}).

Make it sound like a real person wrote it.`,
        
        fr: `R├®dige un email court et enthousiaste pour te pr├®senter bri├¿vement et demander un ├®change rapide sur des opportunit├®s potentielles dans leur entreprise. Adopte un ton engageant et sinc├¿re, et pr├®cise que ton CV est joint.

Inclure les champs :
Pr├®nom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et ├®ventuellement Ville/R├®gion ({{region}}).

L'email doit para├«tre authentique et ├®crit par une vraie personne.`
    }
} as const;

// Ajoutez ces types en haut du fichier
type EmailType = 'Follow-up' | 'Thank You' | 'Status Check' | 'Introduction' | 'Application';
type BusinessContext = 'Interview' | 'Meeting' | 'Position' | 'Project' | 'Application';

const EMAIL_TYPES: EmailType[] = [
  'Follow-up',
  'Thank You',
  'Status Check',
  'Introduction',
  'Application'
];

const BUSINESS_CONTEXTS: BusinessContext[] = [
  'Interview',
  'Meeting',
  'Position',
  'Project',
  'Application'
];

// Fonction utilitaire pour g├®n├®rer un nom de template
function generateTemplateName(tone: ToneType, language: LanguageType): string {
  const emailType = EMAIL_TYPES[Math.floor(Math.random() * EMAIL_TYPES.length)];
  const context = BUSINESS_CONTEXTS[Math.floor(Math.random() * BUSINESS_CONTEXTS.length)];
  
  if (language === 'fr') {
    const toneMap: Record<ToneType, string> = {
      professional: 'Professionnel',
      friendly: 'Amical',
      enthusiastic: 'Enthousiaste'
    };
    const emailTypeMap: Record<EmailType, string> = {
      'Follow-up': 'Suivi',
      'Thank You': 'Remerciement',
      'Status Check': 'Point de situation',
      'Introduction': 'Introduction',
      'Application': 'Candidature'
    };
    return `${toneMap[tone]} - ${emailTypeMap[emailType]} - ${context}`;
  }
  
  return `${tone.charAt(0).toUpperCase() + tone.slice(1)} ${emailType} ${context} Template`;
}

// Main function
export async function generateEmailTemplate(options: GenerateOptions): Promise<GeneratedTemplate> {
    const openai = await getOpenAIInstance();
    
    try {
        const basePrompt = TONE_PROMPTS[options.tone][options.language];
        const userContext = options.language === 'fr' 
            ? `Contexte du candidat :
               - Profil professionnel : ${options.userInfo.motivation}
               - Nom complet : ${options.userInfo.firstName} ${options.userInfo.lastName}
               ${options.userInfo.location ? `- Localisation : ${options.userInfo.location}` : ''}

               Utilise ces informations pour personnaliser l'email en :
               1. Adaptant le contenu au profil professionnel du candidat
               2. Gardant les variables {{prenom}}, {{nom}}, {{entreprise}}, {{region}} pour le destinataire
               3. Mentionnant les comp├®tences pertinentes du profil
               4. Conservant le ton ${options.tone} demand├®`
            : `Candidate context:
               - Professional profile: ${options.userInfo.motivation}
               - Full name: ${options.userInfo.firstName} ${options.userInfo.lastName}
               ${options.userInfo.location ? `- Location: ${options.userInfo.location}` : ''}

               Use this information to personalize the email by:
               1. Adapting the content to the candidate's professional profile
               2. Keeping the variables {{prenom}}, {{nom}}, {{entreprise}}, {{region}} for the recipient
               3. Mentioning relevant skills from the profile
               4. Maintaining the requested ${options.tone} tone`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a professional email template generator specialized in job applications."
                },
                {
                    role: "user",
                    content: `${basePrompt}\n\n${userContext}\n\n${options.specificPoints ? `Additional points: ${options.specificPoints}` : ''}`
                }
            ],
            temperature: 0.7
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content generated');
        }

        return {
            name: generateTemplateName(options.tone, options.language),
            subject: content.match(/Subject: (.*)/)?.[1] || 'Follow-up regarding position',
            content: content.replace(/Subject: .*\n/, '').trim(),
            tags: [options.tone, options.language, 'ai-generated']
        };
    } catch (error) {
        console.error('Error generating template:', error);
        throw error;
    }
}
