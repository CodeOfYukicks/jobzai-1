import { getOpenAIInstance } from './openai';
import { MERGE_FIELDS } from './constants/mergeFields';
import { EMAIL_GOALS, GOAL_PROMPTS, type EmailGoal } from './constants/emailGoals';
import { EmailLength, EMAIL_LENGTHS } from './constants/emailLength';

export type LanguageType = 'en' | 'fr';

// Types
interface UserProfile {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | '';
  contractType: 'full-time' | 'part-time' | 'contract' | 'internship' | '';
  motivation: string;
}

export type GenerateOptions = {
  goal: EmailGoal;
  language: 'en' | 'fr';
  length: EmailLength;
  specificPoints: string;
  userProfile: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | '';
    contractType: 'full-time' | 'part-time' | 'contract' | 'internship' | '';
    motivation: string;
  };
};

export interface GeneratedTemplate {
  name: string;
  subject: string;
  content: string;
  tags: string[];
}

// Fonction de validation des champs de fusion
export function validateMergeFields(content: string): { isValid: boolean; invalidFields: string[] } {
  const validFields = ['salutationField', 'firstNameField', 'lastNameField', 'companyField'];
  
  // Trouve tous les champs qui se terminent par "Field"
  const usedFields = content.match(/\w+Field/g) || [];
  
  // Vérifie si tous les champs utilisés sont valides
  const invalidFields = usedFields.filter(field => !validFields.includes(field));
  
  return {
    isValid: invalidFields.length === 0,
    invalidFields
  };
}

interface PromptTemplate {
  short: {
    fr: string;
    en: string;
  };
  detailed: {
    fr: string;
    en: string;
  };
}

const GOAL_PROMPTS: Record<EmailGoal, Record<EmailLength, Record<LanguageType, string>>> = {
  network: {
    short: {
      fr: `Rédigez un email TRÈS COURT pour établir un premier contact professionnel.
      
      Structure obligatoire :
      1. Salutation simple ("Bonjour firstNameField")
      2. 2-3 lignes de contenu maximum
      3. Proposition d'un appel de 15 minutes
      4. Signature simple
      
      Style :
      - Ultra concis et dynamique
      - Direct au but
      - Pas de formules complexes`,

      en: `Write a VERY SHORT email to establish a first professional contact.
      
      Mandatory structure:
      1. Simple greeting ("Hi firstNameField")
      2. 2-3 lines of content maximum
      3. Proposal for a 15-minute call
      4. Simple signature
      
      Style:
      - Ultra concise and dynamic
      - Straight to the point
      - No complex formalities`
    },
    detailed: {
      fr: `Rédigez un email professionnel pour établir un premier contact.
      
      Structure obligatoire :
      1. Salutation personnalisée
      2. Introduction et contexte (2-3 lignes)
      3. Votre valeur ajoutée (2-3 lignes)
      4. Proposition d'échange (1-2 lignes)
      5. Signature professionnelle
      
      Style :
      - Professionnel mais personnel
      - Détaillé mais pas verbeux
      - Maintenir l'engagement du lecteur`,

      en: `Write a professional email to establish a first contact.
      
      Mandatory structure:
      1. Personalized greeting
      2. Introduction and context (2-3 lines)
      3. Your value proposition (2-3 lines)
      4. Exchange proposal (1-2 lines)
      5. Professional signature
      
      Style:
      - Professional yet personal
      - Detailed but not verbose
      - Keep reader's engagement`
    }
  },

  explore: {
    short: {
      fr: `Rédigez un email TRÈS COURT de candidature spontanée.
      
      Structure obligatoire :
      1. Salutation directe
      2. Accroche impactante (1 ligne)
      3. Proposition d'échange de 15 minutes
      4. Signature simple
      
      Style :
      - Ultra concis et confiant
      - Direct sans être agressif
      - Call-to-action clair`,

      en: `Write a VERY SHORT spontaneous application email.
      
      Mandatory structure:
      1. Direct greeting
      2. Impactful opening (1 line)
      3. Proposal for a 15-minute exchange
      4. Simple signature
      
      Style:
      - Ultra concise and confident
      - Direct without being aggressive
      - Clear call-to-action`
    },
    detailed: {
      fr: `Rédigez un email de candidature spontanée.
      
      Structure obligatoire :
      1. Salutation personnalisée
      2. Accroche sur l'entreprise (1-2 lignes)
      3. Votre motivation et valeur ajoutée (2-3 lignes)
      4. Expérience pertinente (1-2 lignes)
      5. Proposition d'échange
      6. Signature professionnelle
      
      Style :
      - Professionnel et motivé
      - Structuré et fluide
      - Focus sur la valeur ajoutée`,

      en: `Write a spontaneous application email.
      
      Mandatory structure:
      1. Personalized greeting
      2. Company-focused opening (1-2 lines)
      3. Your motivation and value proposition (2-3 lines)
      4. Relevant experience (1-2 lines)
      5. Exchange proposal
      6. Professional signature
      
      Style:
      - Professional and motivated
      - Structured and fluid
      - Focus on value proposition`
    }
  },

  introduction: {
    short: {
      fr: `Rédigez un email TRÈS COURT de présentation.
      
      Structure obligatoire :
      1. Salutation simple
      2. Présentation impactante (1-2 lignes)
      3. Proposition d'appel de 15 minutes
      4. Signature simple
      
      Style :
      - Direct et mémorable
      - Ultra concis
      - Call-to-action clair`,

      en: `Write a VERY SHORT introduction email.
      
      Mandatory structure:
      1. Simple greeting
      2. Impactful introduction (1-2 lines)
      3. 15-minute call proposal
      4. Simple signature
      
      Style:
      - Direct and memorable
      - Ultra concise
      - Clear call-to-action`
    },
    detailed: {
      fr: `Rédigez un email de présentation.
      
      Structure obligatoire :
      1. Salutation personnalisée
      2. Contexte de la prise de contact (1-2 lignes)
      3. Votre parcours pertinent (2-3 lignes)
      4. Point commun ou intérêt spécifique (1-2 lignes)
      5. Proposition d'échange
      6. Signature professionnelle
      
      Style :
      - Personnel mais professionnel
      - Storytelling engageant
      - Focus sur les points communs`,

      en: `Write an introduction email.
      
      Mandatory structure:
      1. Personalized greeting
      2. Contact context (1-2 lines)
      3. Your relevant background (2-3 lines)
      4. Common ground or specific interest (1-2 lines)
      5. Exchange proposal
      6. Professional signature
      
      Style:
      - Personal yet professional
      - Engaging storytelling
      - Focus on common ground`
    }
  }
};

export async function generateEmailTemplate(options: GenerateOptions): Promise<GeneratedTemplate> {
  const openai = await getOpenAIInstance();
  
  try {
    // Vérifier que la longueur est valide
    if (!EMAIL_LENGTHS[options.length]) {
      throw new Error('Invalid email length specified');
    }

    const prompt = GOAL_PROMPTS[options.goal][options.length][options.language];
    const languageInstruction = options.language === 'fr' 
      ? "IMPORTANT: Répondez UNIQUEMENT en français."
      : "IMPORTANT: Reply ONLY in English.";

    // Instructions système adaptées selon la longueur
    const systemInstruction = options.language === 'fr'
      ? `Vous êtes un expert en emails de prise de contact professionnelle ${
          options.length === 'short' ? 'courts et percutants' : 'professionnels et engageants'
        }.`
      : `You are an expert in ${
          options.length === 'short' ? 'short, impactful' : 'professional, engaging'
        } professional networking emails.`;

    // Construction du contexte utilisateur avec focus sur la signature
    const userContext = options.language === 'fr'
      ? `Contexte du candidat :
         - Signature : ${options.userProfile.firstName}
         - Motivation : ${options.userProfile.motivation}
         - Type de contrat : ${options.userProfile.contractType}
         
         IMPORTANT : 
         - Signez uniquement avec "${options.userProfile.firstName}"
         - Créez un objet d'email clair et accrocheur qui mentionne le but de l'email`
      : `Candidate context:
         - Signature: ${options.userProfile.firstName}
         - Motivation: ${options.userProfile.motivation}
         - Contract type: ${options.userProfile.contractType}
         
         IMPORTANT:
         - Sign only with "${options.userProfile.firstName}"
         - Create a clear and engaging subject line that mentions the email's purpose`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `${systemInstruction}\n${languageInstruction}
          
          IMPORTANT FORMAT:
          ${options.language === 'fr' 
            ? `1. Commencez par "Subject: [Objet clair et engageant]"
               Exemples d'objets :
               - "Échange de 15 minutes sur les opportunités chez companyField"
               - "Collaboration potentielle chez companyField"
               - "Proposition de valeur pour companyField"`
            : `1. Start with "Subject: [Clear, engaging subject]"
               Example subjects:
               - "Quick chat about collaboration at companyField"
               - "Let's connect about opportunities at companyField"
               - "15-min call to discuss value proposition at companyField"`
          }
          
          2. Sautez une ligne
          3. Écrivez le contenu de l'email
          4. Terminez par une signature simple avec UNIQUEMENT le prénom fourni
          
          IMPORTANT MERGE FIELDS:
          - salutationField (Titre formel)
          - firstNameField (Prénom)
          - lastNameField (Nom)
          - companyField (Nom de l'entreprise)
          
          DO NOT use any other merge fields or variables.
          DO NOT use double curly braces {{}} format.
          Always use the format: wordField (example: firstNameField)`
        },
        {
          role: "user",
          content: `${prompt}\n\n${userContext}\n\n${options.specificPoints ? `Additional context: ${options.specificPoints}` : ''}`
        }
      ],
      temperature: options.length === 'short' ? 0.7 : 0.8
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Extraire le sujet et le contenu séparément avec support multilingue
    const subjectMatch = content.match(/^(?:Subject|Objet):\s*(.+)$/im);
    const subject = subjectMatch ? subjectMatch[1].trim() : 
      (options.language === 'fr' ? 'Prise de contact' : 'Professional Contact Request');

    // Nettoyer le contenu en retirant la ligne du sujet (format FR et EN)
    const cleanContent = content
      .replace(/^(?:Subject|Objet):.+$/im, '') // Retire la ligne du sujet dans les deux langues
      .replace(/^Objet:.+$/im, '') // S'assure de retirer aussi le format français
      .trim(); // Retire les espaces superflus

    // Génération du nom du template
    const lengthIndicator = options.language === 'fr' 
      ? (options.length === 'short' ? 'Court' : 'Détaillé')
      : (options.length === 'short' ? 'Short' : 'Detailed');
    
    const templateName = options.language === 'fr'
      ? `${EMAIL_GOALS[options.goal].label} - ${lengthIndicator} - ${new Date().toLocaleDateString('fr-FR')}`
      : `${EMAIL_GOALS[options.goal].label} - ${lengthIndicator} - ${new Date().toLocaleDateString('en-US')}`;

    return {
      name: templateName,
      subject: subject,
      content: cleanContent,
      tags: [options.goal, options.language, options.length, 'ai-generated']
    };
  } catch (error) {
    console.error('Error generating template:', error);
    throw error;
  }
}
