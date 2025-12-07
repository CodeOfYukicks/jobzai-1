import { getOpenAIInstance } from './openai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Merge field definitions for the email template
export const MERGE_FIELDS = {
  salutation: {
    key: '{{salutation}}',
    label: 'Salutation',
    description: 'Mr., Ms., Dr., etc.',
    example: 'Mr.'
  },
  firstName: {
    key: '{{firstName}}',
    label: 'First Name',
    description: "Contact's first name",
    example: 'John'
  },
  lastName: {
    key: '{{lastName}}',
    label: 'Last Name', 
    description: "Contact's last name",
    example: 'Smith'
  },
  company: {
    key: '{{company}}',
    label: 'Company',
    description: 'Target company name',
    example: 'Acme Corp'
  },
  position: {
    key: '{{position}}',
    label: 'Position',
    description: "Contact's job title",
    example: 'Engineering Manager'
  }
} as const;

export type MergeFieldKey = keyof typeof MERGE_FIELDS;

// Types
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  currentPosition?: string;
  yearsOfExperience?: string;
  skills?: string[];
  targetPosition?: string;
  targetSectors?: string[];
  motivation?: string;
  professionalHistory?: Array<{
    title: string;
    company: string;
    description?: string;
  }>;
  educationLevel?: string;
  languages?: string[];
}

export interface CampaignTargeting {
  jobRole: string;
  sector: string;
  location: string;
  companySize?: string;
  experienceLevel?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  mergeFieldsUsed: string[];
}

export type EmailTone = 'casual' | 'professional' | 'bold';

export interface GenerateEmailOptions {
  userId: string;
  targeting: CampaignTargeting;
  tone?: EmailTone;
  language?: 'en' | 'fr';
}

/**
 * Fetches user profile data from Firestore
 */
async function getUserProfile(userId: string): Promise<UserProfile> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return {};
}

/**
 * Builds the context string from user profile
 */
function buildUserContext(profile: UserProfile, targeting: CampaignTargeting): string {
  const parts: string[] = [];
  
  if (profile.firstName) {
    parts.push(`Sender's name: ${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`);
  }
  
  if (profile.currentPosition) {
    parts.push(`Current role: ${profile.currentPosition}`);
  }
  
  if (profile.yearsOfExperience) {
    parts.push(`Experience: ${profile.yearsOfExperience} years`);
  }
  
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Key skills: ${profile.skills.slice(0, 5).join(', ')}`);
  }
  
  if (targeting.jobRole) {
    parts.push(`Looking for: ${targeting.jobRole} positions`);
  }
  
  if (targeting.sector) {
    parts.push(`Target industry: ${targeting.sector}`);
  }
  
  if (targeting.location) {
    parts.push(`Preferred location: ${targeting.location}`);
  }
  
  if (profile.professionalHistory && profile.professionalHistory.length > 0) {
    const recentJob = profile.professionalHistory[0];
    parts.push(`Recent experience: ${recentJob.title} at ${recentJob.company}`);
  }
  
  if (profile.motivation) {
    parts.push(`Career motivation: ${profile.motivation}`);
  }
  
  return parts.join('\n');
}

/**
 * The master prompt for generating spontaneous application emails
 */
function getMasterPrompt(tone: EmailTone, language: 'en' | 'fr'): string {
  const toneInstructions = {
    casual: language === 'fr' 
      ? 'Ton décontracté et amical, comme un message LinkedIn entre professionnels qui se respectent.'
      : 'Casual and friendly tone, like a LinkedIn message between professionals who respect each other.',
    professional: language === 'fr'
      ? 'Ton professionnel mais chaleureux, pas corporate ou robotique.'
      : 'Professional but warm tone, not corporate or robotic.',
    bold: language === 'fr'
      ? 'Ton direct et confiant, qui va droit au but sans être arrogant.'
      : 'Direct and confident tone, straight to the point without being arrogant.'
  };

  if (language === 'fr') {
    return `Tu es un expert en rédaction d'emails de candidature spontanée qui obtiennent des réponses.

OBJECTIF: Écrire un email court et percutant pour demander un échange informel, PAS pour postuler directement.

RÈGLES CRITIQUES:
1. L'email doit sembler écrit par un HUMAIN, pas par une IA
2. Maximum 4-6 lignes de contenu (hors salutation/signature)
3. Phrases courtes et variées - mélange de longueurs
4. Utilise des contractions naturelles
5. JAMAIS de mots comme "passionné", "opportunité incroyable", "ravi de"
6. JAMAIS de phrases génériques type "j'ai été impressionné par votre travail"
7. Demande une DISCUSSION, pas un job

TON: ${toneInstructions[tone]}

STRUCTURE:
- Accroche: Une phrase spécifique montrant que tu connais l'entreprise (utilise {{company}})
- Contexte: Qui tu es en 1 phrase max
- Valeur: Ce que tu apportes, pas ce que tu veux
- Ask: Demande simple d'un échange de 15-20 min
- Signature: Juste le prénom

CHAMPS DE FUSION À UTILISER:
- {{salutation}} - Mr., Mme., etc.
- {{firstName}} - Prénom du contact
- {{lastName}} - Nom du contact  
- {{company}} - Nom de l'entreprise
- {{position}} - Poste du contact

EXEMPLE DE BON EMAIL:
"Salut {{firstName}},

J'ai vu ce que {{company}} fait sur [domaine spécifique] - impressionnant.

Je bosse dans [domaine] depuis [X ans] et votre approche sur [truc précis] m'a interpellé. Ce serait cool d'échanger si t'es dispo pour un call rapide.

Je m'adapte à ton planning.

[Prénom]"

IMPORTANT: Génère UNIQUEMENT l'email, pas d'explications.`;
  }

  return `You are an expert at writing spontaneous outreach emails that actually get replies.

GOAL: Write a short, punchy email asking for an informal chat, NOT applying for a job directly.

CRITICAL RULES:
1. The email must feel written by a HUMAN, not AI
2. Maximum 4-6 lines of content (excluding greeting/signature)
3. Short, varied sentences - mix of lengths
4. Use natural contractions (I'm, you're, it's)
5. NEVER use words like "passionate", "amazing opportunity", "excited to"
6. NEVER use generic phrases like "I was impressed by your work"
7. Ask for a CONVERSATION, not a job

TONE: ${toneInstructions[tone]}

STRUCTURE:
- Hook: One specific sentence showing you know the company (use {{company}})
- Context: Who you are in 1 sentence max
- Value: What you bring, not what you want
- Ask: Simple request for a 15-20 min chat
- Signature: First name only

MERGE FIELDS TO USE:
- {{salutation}} - Mr., Ms., etc.
- {{firstName}} - Contact's first name
- {{lastName}} - Contact's last name
- {{company}} - Company name
- {{position}} - Contact's job title

EXAMPLE OF A GOOD EMAIL:
"Hi {{firstName}},

Saw what {{company}} is doing with [specific area] - pretty cool stuff.

I've been in [field] for [X years] and your approach to [specific thing] caught my eye. Would be great to pick your brain if you're up for a quick call.

Happy to work around your schedule.

[First name]"

IMPORTANT: Generate ONLY the email, no explanations.`;
}

/**
 * Generates a spontaneous application email using AI
 */
export async function generateCampaignEmail(options: GenerateEmailOptions): Promise<GeneratedEmail> {
  const { userId, targeting, tone = 'casual', language = 'en' } = options;
  
  const openai = await getOpenAIInstance();
  const userProfile = await getUserProfile(userId);
  const userContext = buildUserContext(userProfile, targeting);
  const masterPrompt = getMasterPrompt(tone, language);

  const subjectPrompt = language === 'fr'
    ? `Génère aussi un objet d'email court (max 6 mots) qui donne envie d'ouvrir. Pas de majuscules partout, pas de "RE:", juste naturel.
       Exemples: "Question rapide", "Échange sur [domaine]?", "Dispo pour un call?"`
    : `Also generate a short email subject (max 6 words) that makes them want to open it. No all caps, no "RE:", just natural.
       Examples: "Quick question", "Chat about [field]?", "Got a minute?"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: masterPrompt
        },
        {
          role: "user",
          content: `${subjectPrompt}

SENDER CONTEXT:
${userContext}

Generate an email for this spontaneous outreach campaign. Make it feel genuine and human.

Format your response as:
SUBJECT: [subject line]
---
[email body]`
        }
      ],
      temperature: 0.85, // Higher for more natural variation
      max_tokens: 500
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the response
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
    const subject = subjectMatch 
      ? subjectMatch[1].trim() 
      : (language === 'fr' ? 'Échange rapide?' : 'Quick chat?');

    // Get body (everything after ---)
    const bodyMatch = content.split(/---+/);
    const body = bodyMatch.length > 1 
      ? bodyMatch[1].trim()
      : content.replace(/SUBJECT:.+/i, '').trim();

    // Replace sender's first name in signature
    const finalBody = body.replace(
      /\[(?:First name|Prénom|Name)\]/gi, 
      userProfile.firstName || 'Me'
    );

    // Detect which merge fields were used
    const mergeFieldsUsed = Object.keys(MERGE_FIELDS).filter(key => 
      finalBody.includes(MERGE_FIELDS[key as MergeFieldKey].key) || 
      subject.includes(MERGE_FIELDS[key as MergeFieldKey].key)
    );

    return {
      subject,
      body: finalBody,
      mergeFieldsUsed
    };
  } catch (error) {
    console.error('Error generating campaign email:', error);
    throw error;
  }
}

/**
 * Previews an email with sample merge field values
 */
export function previewEmail(body: string, subject: string): { body: string; subject: string } {
  let previewBody = body;
  let previewSubject = subject;

  Object.values(MERGE_FIELDS).forEach(field => {
    previewBody = previewBody.replace(new RegExp(escapeRegex(field.key), 'g'), field.example);
    previewSubject = previewSubject.replace(new RegExp(escapeRegex(field.key), 'g'), field.example);
  });

  return { body: previewBody, subject: previewSubject };
}

/**
 * Highlights merge fields in HTML for display
 */
export function highlightMergeFields(text: string): string {
  let highlighted = text;
  
  Object.values(MERGE_FIELDS).forEach(field => {
    highlighted = highlighted.replace(
      new RegExp(escapeRegex(field.key), 'g'),
      `<span class="merge-field">${field.key}</span>`
    );
  });

  return highlighted;
}

/**
 * Inserts a merge field at cursor position in a text
 */
export function insertMergeField(text: string, cursorPosition: number, fieldKey: MergeFieldKey): {
  newText: string;
  newCursorPosition: number;
} {
  const field = MERGE_FIELDS[fieldKey];
  const before = text.slice(0, cursorPosition);
  const after = text.slice(cursorPosition);
  
  return {
    newText: before + field.key + after,
    newCursorPosition: cursorPosition + field.key.length
  };
}

// Helper to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

