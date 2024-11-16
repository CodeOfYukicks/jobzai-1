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

// Mise à jour de l'interface UserInfo
export interface UserInfo {
    firstName: string;
    lastName: string;
    jobPreferences: string;
    location?: string;
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
        
        fr: `Rédige un email court et professionnel pour te présenter brièvement et demander un échange sur des opportunités potentielles dans leur entreprise. Adopte un ton poli et concis, et précise que ton CV est joint.

Inclure les champs :
Prénom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et éventuellement Ville/Région ({{region}}).

L'email doit être professionnel et naturel, comme écrit par une vraie personne.`
    },
    
    friendly: {
        en: `Write a short, friendly email to introduce yourself and request a quick chat about potential opportunities at their company. Keep the tone warm and approachable, and mention that your CV is attached.

Include placeholders for:
First name ({{prenom}}), Last name ({{nom}}), Company name ({{entreprise}}), and optional City/Region ({{region}}).

Ensure the email feels like it's written by a real person.`,
        
        fr: `Rédige un email court et amical pour te présenter brièvement et demander un échange rapide sur des opportunités potentielles dans leur entreprise. Adopte un ton chaleureux et accessible, et précise que ton CV est joint.

Inclure les champs :
Prénom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et éventuellement Ville/Région ({{region}}).

L'email doit sembler naturel et écrit par une vraie personne.`
    },
    
    enthusiastic: {
        en: `Write a short, enthusiastic email to introduce yourself and request a quick conversation about potential opportunities at their company. Keep the tone excited and genuine, and mention that your CV is attached.

Include placeholders for:
First name ({{prenom}}), Last name ({{nom}}), Company name ({{entreprise}}), and optional City/Region ({{region}}).

Make it sound like a real person wrote it.`,
        
        fr: `Rédige un email court et enthousiaste pour te présenter brièvement et demander un échange rapide sur des opportunités potentielles dans leur entreprise. Adopte un ton engageant et sincère, et précise que ton CV est joint.

Inclure les champs :
Prénom ({{prenom}}), Nom ({{nom}}), Nom de l'entreprise ({{entreprise}}), et éventuellement Ville/Région ({{region}}).

L'email doit paraître authentique et écrit par une vraie personne.`
    }
} as const;

// Main function
export async function generateEmailTemplate(options: GenerateOptions): Promise<GeneratedTemplate> {
    const openai = await getOpenAIInstance();
    
    try {
        const basePrompt = TONE_PROMPTS[options.tone][options.language];
        const userContext = options.language === 'fr' 
            ? `Contexte du candidat :
               - Profil professionnel : ${options.userInfo.jobPreferences}
               - Nom complet : ${options.userInfo.firstName} ${options.userInfo.lastName}
               ${options.userInfo.location ? `- Localisation : ${options.userInfo.location}` : ''}

               Utilise ces informations pour personnaliser l'email en :
               1. Adaptant le contenu au profil professionnel du candidat
               2. Gardant les variables {{prenom}}, {{nom}}, {{entreprise}}, {{region}} pour le destinataire
               3. Mentionnant les compétences pertinentes du profil
               4. Conservant le ton ${options.tone} demandé`
            : `Candidate context:
               - Professional profile: ${options.userInfo.jobPreferences}
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
            name: `${options.tone.charAt(0).toUpperCase() + options.tone.slice(1)} Template`,
            subject: 'Follow-up regarding position',
            content: content,
            tags: [options.tone, options.language, 'ai-generated']
        };
    } catch (error) {
        console.error('Error generating template:', error);
        throw error;
    }
}