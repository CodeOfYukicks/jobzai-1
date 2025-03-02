import { getOpenAIInstance } from './openai';
import { MERGE_FIELDS } from './constants/mergeFields';
import { EMAIL_GOALS, type EmailGoal } from './constants/emailGoals';
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
      fr: `Rédigez un email TRÈS COURT et PROFESSIONNEL pour établir un premier contact professionnel.
      
      Structure obligatoire :
      1. Salutation personnalisée et formelle (utilisez salutationField et lastNameField)
      2. 2-3 lignes percutantes sur votre intérêt spécifique pour cette personne/entreprise (mentionnez companyField et positionField)
      3. Proposition précise d'un appel de 15-20 minutes avec dates/heures possibles
      4. Signature professionnelle
      
      Style :
      - Concis mais impactant
      - Direct avec une proposition de valeur claire
      - Professionnel mais engageant
      - Une phrase d'accroche mémorable
      - Utilisez firstNameField au moins une fois dans le corps pour un ton plus personnel`,

      en: `Write a VERY SHORT and PROFESSIONAL email to establish a first professional contact.
      
      Mandatory structure:
      1. Personalized and formal greeting (use salutationField and lastNameField)
      2. 2-3 impactful lines about your specific interest in this person/company (mention companyField and positionField)
      3. Precise proposal for a 15-20 minute call with possible dates/times
      4. Professional signature
      
      Style:
      - Concise but impactful
      - Direct with a clear value proposition
      - Professional yet engaging
      - A memorable opening line
      - Use firstNameField at least once in the body for a more personal tone`
    },
    medium: {
      fr: `Rédigez un email ÉQUILIBRÉ et EFFICACE pour établir un premier contact professionnel.
      
      Structure obligatoire :
      1. Salutation personnalisée et professionnelle (avec salutationField et lastNameField)
      2. Introduction montrant votre intérêt spécifique (1-2 lignes, référencez companyField)
      3. Votre parcours en lien avec cette personne/entreprise (2-3 lignes, mentionnez positionField)
      4. Proposition de valeur claire pour le destinataire (1-2 lignes)
      5. Call-to-action précis avec proposition de calendrier (utilisez firstNameField pour un ton cordial)
      6. Signature professionnelle
      
      Style :
      - Professionnel avec une touche personnelle
      - Précis et ciblé à cette personne/entreprise 
      - Équilibre entre concision et contexte
      - Ton confiant et authentique
      - Utilisez les champs de fusion de manière naturelle tout au long du texte`,

      en: `Write a BALANCED and EFFECTIVE email to establish a first professional contact.
      
      Mandatory structure:
      1. Personalized and professional greeting (with salutationField and lastNameField)
      2. Introduction showing your specific interest (1-2 lines, reference companyField)
      3. Your background relevant to this person/company (2-3 lines, mention positionField)
      4. Clear value proposition for the recipient (1-2 lines)
      5. Precise call-to-action with calendar proposal (use firstNameField for a cordial tone)
      6. Professional signature
      
      Style:
      - Professional with a personal touch
      - Precise and targeted to this person/company
      - Balance between conciseness and context
      - Confident and authentic tone
      - Use merge fields naturally throughout the text`
    },
    detailed: {
      fr: `Rédigez un email PROFESSIONNEL et STRATÉGIQUE pour établir un premier contact.
      
      Structure obligatoire :
      1. Salutation personnalisée et contextualisée (utilisant salutationField et lastNameField)
      2. Introduction qui établit une connexion spécifique (1-2 lignes, mentionnez companyField)
      3. Votre parcours et valeur ajoutée spécifique pour cette personne (3-4 lignes, référencez positionField)
      4. Proposition d'échange avec bénéfice mutuel clair (1-2 lignes, utilisez firstNameField pour personnaliser)
      5. Call-to-action précis avec proposition de dates (référencez companyField à nouveau)
      6. Signature professionnelle complète
      
      Style :
      - Professionnel mais chaleureux
      - Détaillé mais chaque mot doit apporter de la valeur
      - Focus sur les bénéfices mutuels
      - Une accroche mémorable et personnalisée
      - Intégrez tous les champs de fusion d'une manière qui semble naturelle`,

      en: `Write a PROFESSIONAL and STRATEGIC email to establish a first contact.
      
      Mandatory structure:
      1. Personalized and contextualized greeting (using salutationField and lastNameField)
      2. Introduction establishing a specific connection (1-2 lines, mention companyField)
      3. Your background and specific value add for this person (3-4 lines, reference positionField)
      4. Exchange proposal with clear mutual benefit (1-2 lines, use firstNameField to personalize)
      5. Precise call-to-action with proposed dates (reference companyField again)
      6. Complete professional signature
      
      Style:
      - Professional yet warm
      - Detailed but every word should add value
      - Focus on mutual benefits
      - A memorable and personalized opening hook
      - Integrate all merge fields in a way that feels natural`
    }
  },

  explore: {
    short: {
      fr: `Rédigez un email TRÈS COURT et PERCUTANT de candidature spontanée.
      
      Structure obligatoire :
      1. Salutation professionnelle et personnalisée (avec salutationField et lastNameField)
      2. Accroche impactante liée à l'entreprise ou au secteur (1 ligne, mentionnez companyField)
      3. Votre proposition de valeur unique et spécifique (1-2 lignes, référencez positionField)
      4. Call-to-action précis avec proposition d'un appel de 15 minutes (utilisez firstNameField pour personnaliser)
      5. Signature professionnelle
      
      Style :
      - Ultra concis mais démontrant votre recherche sur l'entreprise
      - Confiant sans être arrogant
      - Spécifique à cette entreprise (pas un email générique)
      - Ton enthousiaste mais professionnel`,

      en: `Write a VERY SHORT and IMPACTFUL spontaneous application email.
      
      Mandatory structure:
      1. Professional and personalized greeting (with salutationField and lastNameField)
      2. Impactful opening related to the company or industry (1 line, mention companyField)
      3. Your unique and specific value proposition (1-2 lines, reference positionField)
      4. Precise call-to-action with a 15-minute call proposal (use firstNameField to personalize)
      5. Professional signature
      
      Style:
      - Ultra concise but showing your research on the company
      - Confident without being arrogant
      - Specific to this company (not a generic email)
      - Enthusiastic yet professional tone`
    },
    medium: {
      fr: `Rédigez un email ÉQUILIBRÉ et CIBLÉ de candidature spontanée.
      
      Structure obligatoire :
      1. Salutation professionnelle et personnalisée (avec salutationField et lastNameField)
      2. Accroche spécifique sur l'entreprise (1-2 lignes, référencez companyField)
      3. Vos compétences clés alignées avec l'entreprise (2-3 lignes, mentionnez positionField)
      4. Proposition de valeur concrète (1-2 lignes, utilisez firstNameField pour créer une connexion)
      5. Call-to-action précis avec proposition d'appel (référencez companyField à nouveau)
      6. Signature professionnelle
      
      Style :
      - Professionnel et ciblé
      - Équilibre entre concision et information
      - Démontrer une recherche sur l'entreprise
      - Ton confiant et enthousiaste
      - Utilisez tous les champs de fusion de manière naturelle`,

      en: `Write a BALANCED and TARGETED spontaneous application email.
      
      Mandatory structure:
      1. Professional and personalized greeting (with salutationField and lastNameField)
      2. Specific opening about the company (1-2 lines, reference companyField)
      3. Your key skills aligned with the company (2-3 lines, mention positionField)
      4. Concrete value proposition (1-2 lines, use firstNameField to create connection)
      5. Precise call-to-action with call proposal (reference companyField again)
      6. Professional signature
      
      Style:
      - Professional and targeted
      - Balance between conciseness and information
      - Demonstrate research on the company
      - Confident and enthusiastic tone
      - Use all merge fields naturally`
    },
    detailed: {
      fr: `Rédigez un email STRATÉGIQUE et PERSONNALISÉ de candidature spontanée.
      
      Structure obligatoire :
      1. Salutation formelle et personnalisée (utilisez salutationField et lastNameField)
      2. Accroche démontrant votre connaissance de l'entreprise (1-2 lignes, mentionnez companyField)
      3. Votre parcours et compétences alignés spécifiquement avec les besoins de l'entreprise (3-4 lignes, référencez positionField)
      4. Proposition de valeur concrète pour l'entreprise (2-3 lignes, utilisez firstNameField pour personnaliser)
      5. Call-to-action précis avec proposition d'appel et disponibilités (référencez companyField à nouveau)
      6. Signature professionnelle complète
      
      Style :
      - Professionnel et recherché
      - Chaque paragraphe doit démontrer votre valeur spécifique
      - Ton enthousiaste mais mesuré
      - Démontrer une connaissance précise de l'entreprise
      - Éviter les formules génériques
      - Utilisez tous les champs de fusion d'une manière fluide et naturelle`,

      en: `Write a STRATEGIC and PERSONALIZED spontaneous application email.
      
      Mandatory structure:
      1. Formal and personalized greeting (use salutationField and lastNameField)
      2. Opening demonstrating your knowledge of the company (1-2 lines, mention companyField)
      3. Your background and skills specifically aligned with company needs (3-4 lines, reference positionField)
      4. Concrete value proposition for the company (2-3 lines, use firstNameField to personalize)
      5. Precise call-to-action with call proposal and availability (reference companyField again)
      6. Complete professional signature
      
      Style:
      - Professional and researched
      - Each paragraph should demonstrate your specific value
      - Enthusiastic but measured tone
      - Demonstrate precise knowledge of the company
      - Avoid generic phrases
      - Use all merge fields in a fluid and natural way`
    }
  },

  introduction: {
    short: {
      fr: `Rédigez un email TRÈS COURT et MÉMORABLE de présentation.
      
      Structure obligatoire :
      1. Salutation professionnelle et personnalisée (avec salutationField et lastNameField)
      2. Introduction impactante qui capte immédiatement l'attention (1 ligne, mentionnez companyField)
      3. Votre proposition de valeur unique et spécifique (1-2 lignes, référencez positionField)
      4. Call-to-action précis et facile à accepter (utilisez firstNameField pour personnaliser)
      5. Signature professionnelle
      
      Style :
      - Direct mais sophistiqué
      - Ultra concis mais chaque mot compte
      - Une accroche mémorable
      - Ton confiant mais pas arrogant
      - Intégrez naturellement tous les champs de fusion`,

      en: `Write a VERY SHORT and MEMORABLE introduction email.
      
      Mandatory structure:
      1. Professional and personalized greeting (with salutationField and lastNameField)
      2. Impactful introduction that immediately captures attention (1 line, mention companyField)
      3. Your unique and specific value proposition (1-2 lines, reference positionField)
      4. Precise and easy-to-accept call-to-action (use firstNameField to personalize)
      5. Professional signature
      
      Style:
      - Direct yet sophisticated
      - Ultra concise but every word counts
      - A memorable hook
      - Confident but not arrogant tone
      - Naturally integrate all merge fields`
    },
    medium: {
      fr: `Rédigez un email ÉQUILIBRÉ et ENGAGEANT de présentation.
      
      Structure obligatoire :
      1. Salutation professionnelle et personnalisée (utilisez salutationField et lastNameField)
      2. Introduction établissant une connexion spécifique (1-2 lignes, référencez companyField)
      3. Votre parcours en lien avec les intérêts du destinataire (2-3 lignes, mentionnez positionField)
      4. Proposition de valeur ou insight pertinent (1-2 lignes, utilisez firstNameField pour créer un lien)
      5. Call-to-action précis et attrayant (référencez companyField à nouveau)
      6. Signature professionnelle
      
      Style :
      - Professionnel avec une touche personnelle
      - Équilibre entre information et engagement
      - Un élément de storytelling personnel
      - Ton authentique et mémorable
      - Utilisez tous les champs de fusion de manière fluide et contextualisée`,

      en: `Write a BALANCED and ENGAGING introduction email.
      
      Mandatory structure:
      1. Professional and personalized greeting (use salutationField and lastNameField)
      2. Introduction establishing a specific connection (1-2 lines, reference companyField)
      3. Your background relevant to recipient's interests (2-3 lines, mention positionField)
      4. Value proposition or relevant insight (1-2 lines, use firstNameField to create connection)
      5. Precise and attractive call-to-action (reference companyField again)
      6. Professional signature
      
      Style:
      - Professional with a personal touch
      - Balance between information and engagement
      - An element of personal storytelling
      - Authentic and memorable tone
      - Use all merge fields in a fluid and contextualized manner`
    },
    detailed: {
      fr: `Rédigez un email de présentation PROFESSIONNEL et STRATÉGIQUE.
      
      Structure obligatoire :
      1. Salutation formelle et personnalisée (avec salutationField et lastNameField)
      2. Introduction qui établit un lien spécifique ou une connexion (2 lignes, mentionnez companyField)
      3. Présentation de votre parcours en lien direct avec les intérêts du destinataire (3-4 lignes, référencez positionField)
      4. Valeur ou insight que vous pouvez apporter au destinataire (2-3 lignes, utilisez firstNameField pour personnaliser)
      5. Proposition d'échange avec bénéfice mutuel clair (référencez companyField à nouveau)
      6. Call-to-action précis et facile à accepter
      7. Signature professionnelle complète
      
      Style :
      - Professionnel et soigné
      - Storytelling engageant
      - Démontrer une recherche approfondie sur le destinataire
      - Ton authentique et personnel
      - Éviter les formules toutes faites et les clichés
      - Utilisez tous les champs de fusion d'une manière naturelle et stratégique`,

      en: `Write a PROFESSIONAL and STRATEGIC introduction email.
      
      Mandatory structure:
      1. Formal and personalized greeting (with salutationField and lastNameField)
      2. Introduction establishing a specific link or connection (2 lines, mention companyField)
      3. Presentation of your background directly relevant to recipient's interests (3-4 lines, reference positionField)
      4. Value or insight you can bring to the recipient (2-3 lines, use firstNameField to personalize)
      5. Exchange proposal with clear mutual benefit (reference companyField again)
      6. Precise and easy-to-accept call-to-action
      7. Complete professional signature
      
      Style:
      - Professional and polished
      - Engaging storytelling
      - Demonstrate thorough research on the recipient
      - Authentic and personal tone
      - Avoid formulaic phrases and clichés
      - Use all merge fields in a natural and strategic manner`
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
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `${systemInstruction}\n${languageInstruction}
          
          You are a highly skilled professional with expertise in crafting exceptional business communication. Your emails are:
          1. Tailored to specific professional contexts
          2. Written with precise, concise and impactful language
          3. Structured for maximum effectiveness
          4. Always appropriate in tone and formality level
          
          IMPORTANT FORMAT:
          ${options.language === 'fr' 
            ? `1. Commencez par "Subject: [Objet clair et engageant]"
               Exemples d'objets :
               - "Échange de 15 minutes sur les opportunités chez companyField"
               - "Collaboration potentielle chez companyField"
               - "Proposition de valeur pour companyField"
               - "Intérêt pour rejoindre l'équipe de companyField"`
            : `1. Start with "Subject: [Clear, engaging subject]"
               Example subjects:
               - "Quick chat about collaboration at companyField"
               - "Let's connect about opportunities at companyField"
               - "15-min call to discuss value proposition at companyField"
               - "Interest in joining the team at companyField"`
          }
          
          2. Sautez une ligne
          3. Écrivez le contenu de l'email avec:
             - Une ouverture qui capte l'attention
             - Un corps qui offre de la valeur au destinataire
             - Une conclusion avec une call-to-action claire
          4. Terminez par une signature simple avec UNIQUEMENT le prénom fourni
          
          IMPORTANT MERGE FIELDS - USE ALL OF THESE NATURALLY THROUGHOUT THE EMAIL:
          - salutationField (Titre formel, ex: "Mr.", "Ms.", "Dr.")
          - firstNameField (Prénom du destinataire)
          - lastNameField (Nom de famille du destinataire)
          - companyField (Nom de l'entreprise)
          - positionField (Poste ou rôle professionnel)
          
          MERGE FIELD USAGE GUIDELINES:
          - ALWAYS use proper salutation with salutationField and lastNameField in the greeting
          - Use firstNameField in the body of the email for a more personal touch
          - Reference companyField at least twice in different contexts
          - Refer to positionField when discussing potential value or collaboration
          - Incorporate merge fields naturally - they should flow with the text
          - Do not overuse fields or place them artificially
          
          DO NOT use any other merge fields or variables.
          DO NOT use double curly braces {{}} format.
          Always use the format: wordField (example: firstNameField)
          
          WRITING GUIDELINES:
          - Be specific and concrete rather than generic
          - Avoid clichés and overused phrases
          - Use active voice and confident language
          - Maintain professional warmth appropriate to context
          - Respect cultural norms of professional communication
          - Ensure the email feels personalized, not mass-produced`
        },
        {
          role: "user",
          content: `${prompt}\n\n${userContext}\n\n${options.specificPoints ? `Additional context: ${options.specificPoints}` : ''}`
        }
      ],
      temperature: options.length === 'short' ? 0.6 : 0.7,
      max_tokens: options.length === 'short' ? 600 : 1000
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

    // Improved template naming convention
    // Get a meaningful descriptor from the subject or specific points
    const getDescriptor = () => {
      // Extract key words from subject or specific points to create a descriptor
      const sourceText = subject || options.specificPoints || '';
      // Extract 2-3 significant words (skip common words)
      const commonWords = ['a', 'an', 'the', 'at', 'in', 'on', 'for', 'to', 'with', 'about', 'and', 'or', 'de', 'la', 'le', 'les', 'du', 'des', 'un', 'une'];
      const words = sourceText
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word.toLowerCase()))
        .slice(0, 2)
        .join('-');
      
      return words || (options.language === 'fr' ? 'Personnalisé' : 'Custom');
    };

    // Generate appropriate length indicator
    const getLengthName = () => {
      if (options.language === 'fr') {
        return options.length === 'short' ? 'Court' : 
               options.length === 'medium' ? 'Moyen' : 'Détaillé';
      } else {
        return options.length === 'short' ? 'Short' : 
               options.length === 'medium' ? 'Medium' : 'Detailed';
      }
    };

    // Format date in a compact way (YYYYMMDD or similar)
    const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Create a template name that's more distinctive and informative
    const templateName = `${EMAIL_GOALS[options.goal].label} [${getLengthName()}] - ${getDescriptor()} (${options.language.toUpperCase()}_${formattedDate})`;
    
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
