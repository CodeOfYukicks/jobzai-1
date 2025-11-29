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
  // Additional professional profile information
  currentPosition?: string;
  yearsOfExperience?: string;
  skills?: string[];
  targetPosition?: string;
  targetSectors?: string[];
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
    // Additional professional profile information
    currentPosition?: string;
    yearsOfExperience?: string;
    skills?: string[];
    targetPosition?: string;
    targetSectors?: string[];
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
      fr: `Rédigez un email TRÈS COURT et naturel (3-4 lignes maximum) pour établir une connexion professionnelle.
      
      Points clés à intégrer:
      - Salutation brève (utilisez salutationField et lastNameField)
      - Mention concise de votre intérêt pour companyField
      - Proposition d'échange simple en 1 ligne maximum
      - Signature avec votre prénom uniquement
      
      Style:
      - Extrêmement concis mais humain
      - Chaque mot doit apporter de la valeur
      - Priorisez l'essentiel pour tenir en 3-4 lignes au TOTAL
      - Évitez les formules banales pour économiser l'espace`,

      en: `Write a VERY SHORT and natural email (3-4 lines maximum) to establish a professional connection.
      
      Key points to include:
      - Brief greeting (use salutationField and lastNameField)
      - Concise mention of your interest in companyField
      - Simple exchange proposal in 1 line maximum
      - Signature with your first name only
      
      Style:
      - Extremely concise yet human
      - Every word must add value
      - Prioritize essentials to fit within 3-4 lines TOTAL
      - Avoid generic phrases to save space`
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
      fr: `Rédigez un email TRÈS COURT et authentique (3-4 lignes maximum) pour explorer des opportunités professionnelles.
      
      Éléments à inclure:
      - Salutation concise (avec salutationField et lastNameField)
      - Mention ultra-brève montrant votre intérêt pour companyField
      - Valeur ajoutée en 1-2 phrases maximum
      - Proposition d'échange en une seule ligne
      - Signature simple
      
      Style recherché:
      - Extrêmement concis mais authentique
      - Maximum 3-4 lignes au TOTAL, greetings/signature inclus
      - Chaque mot doit être essentiel
      - Naturel et précis sans détails superflus`,

      en: `Write a VERY SHORT and authentic email (3-4 lines maximum) to explore professional opportunities.
      
      Elements to include:
      - Concise greeting (with salutationField and lastNameField)
      - Ultra-brief mention showing your interest in companyField
      - Added value in 1-2 sentences maximum
      - Exchange proposal in a single line
      - Simple signature
      
      Desired style:
      - Extremely concise yet authentic
      - Maximum 3-4 lines TOTAL, including greeting/signature
      - Every word must be essential
      - Natural and precise without superfluous details`
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
      fr: `Rédigez un email TRÈS COURT et personnel (3-4 lignes maximum) pour vous présenter professionnellement.
      
      Éléments à inclure dans ces 3-4 lignes:
      - Salutation concise (avec salutationField et lastNameField)
      - Introduction brève mais mémorable
      - Mention rapide de votre intérêt pour companyField
      - Suggestion d'échange en une phrase
      - Signature simple
      
      Ton et style:
      - Ultra-concis mais chaleureux
      - Maximum 3-4 lignes au TOTAL
      - Chaque mot doit être indispensable
      - Simple mais efficace`,

      en: `Write a VERY SHORT and personal email (3-4 lines maximum) to introduce yourself professionally.
      
      Elements to include within these 3-4 lines:
      - Concise greeting (with salutationField and lastNameField)
      - Brief but memorable introduction
      - Quick mention of your interest in companyField
      - Exchange suggestion in one sentence
      - Simple signature
      
      Tone and style:
      - Ultra-concise yet warm
      - Maximum 3-4 lines TOTAL
      - Every word must be indispensable
      - Simple but effective`
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

    // Instructions système adaptées selon la longueur avec limites spécifiques
    const getLengthInstruction = (length: EmailLength, language: LanguageType) => {
      if (language === 'fr') {
        if (length === 'short') return 'très courts (3-4 lignes, max 250 caractères)';
        if (length === 'medium') return 'équilibrés (5-7 lignes, max 400 caractères)';
        return 'détaillés mais concis (8-12 lignes, max 800 caractères)';
      } else {
        if (length === 'short') return 'very short (3-4 lines, max 250 characters)';
        if (length === 'medium') return 'balanced (5-7 lines, max 400 characters)';
        return 'detailed yet concise (8-12 lines, max 800 characters)';
      }
    };

    const systemInstruction = options.language === 'fr'
      ? `Vous êtes un expert en emails de prise de contact professionnelle ${getLengthInstruction(options.length, options.language)}.`
      : `You are an expert in ${getLengthInstruction(options.length, options.language)} professional networking emails.`;

    // Gather professional information
    const skillsList = options.userProfile.skills && options.userProfile.skills.length > 0 
      ? options.userProfile.skills.slice(0, 3).join(', ') 
      : '';
      
    const targetSectorsList = options.userProfile.targetSectors && options.userProfile.targetSectors.length > 0 
      ? options.userProfile.targetSectors.slice(0, 2).join(', ') 
      : '';

    // Construction du contexte utilisateur étendu avec données professionnelles
    const userContext = options.language === 'fr'
      ? `Contexte du candidat :
         - Signature : ${options.userProfile.firstName}
         - Motivation : ${options.userProfile.motivation}
         - Type de contrat : ${options.userProfile.contractType}
         ${options.userProfile.currentPosition ? `- Poste actuel : ${options.userProfile.currentPosition}` : ''}
         ${options.userProfile.yearsOfExperience ? `- Années d'expérience : ${options.userProfile.yearsOfExperience}` : ''}
         ${skillsList ? `- Compétences clés : ${skillsList}` : ''}
         ${options.userProfile.targetPosition ? `- Poste recherché : ${options.userProfile.targetPosition}` : ''}
         ${targetSectorsList ? `- Secteurs ciblés : ${targetSectorsList}` : ''}
         
         IMPORTANT : 
         - Signez uniquement avec "${options.userProfile.firstName}"
         - Créez un objet d'email clair et accrocheur qui mentionne le but de l'email
         - Respectez STRICTEMENT la longueur demandée: ${options.length === 'short' ? '3-4 lignes' : options.length === 'medium' ? '5-7 lignes' : '8-12 lignes'}`
      : `Candidate context:
         - Signature: ${options.userProfile.firstName}
         - Motivation: ${options.userProfile.motivation}
         - Contract type: ${options.userProfile.contractType}
         ${options.userProfile.currentPosition ? `- Current position: ${options.userProfile.currentPosition}` : ''}
         ${options.userProfile.yearsOfExperience ? `- Years of experience: ${options.userProfile.yearsOfExperience}` : ''}
         ${skillsList ? `- Key skills: ${skillsList}` : ''}
         ${options.userProfile.targetPosition ? `- Target position: ${options.userProfile.targetPosition}` : ''}
         ${targetSectorsList ? `- Target sectors: ${targetSectorsList}` : ''}
         
         IMPORTANT:
         - Sign only with "${options.userProfile.firstName}"
         - Create a clear and engaging subject line that mentions the email's purpose
         - STRICTLY respect the requested length: ${options.length === 'short' ? '3-4 lines' : options.length === 'medium' ? '5-7 lines' : '8-12 lines'}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1", // Updated from gpt-4o (Nov 2025)
      messages: [
        {
          role: "system",
          content: `${systemInstruction}\n${languageInstruction}
          
          You are a highly skilled professional who writes authentic, human-sounding emails that get responses. Your writing style:
          1. Sounds like a message from a real person - conversational, warm, and genuine
          2. Includes subtle imperfections to feel authentic (occasional informality, conversational asides)
          3. Avoids robotic structure or template-like phrasing that makes AI content obvious
          4. Balances professionalism with approachability and humanity
          
          PROFILE CONTEXT UTILIZATION GUIDELINES:
          - Use professional background information to establish credibility naturally
          - For NETWORKING emails: Reference 1-2 relevant skills or experience that create a genuine connection point
          - For OPPORTUNITY emails: Subtly mention target position/sectors to show authentic interest and research
          - For INTRODUCTION emails: Incorporate background that explains "why them specifically"
          - IMPORTANT: Incorporate professional details ONLY if they create a compelling reason for the recipient to respond
          - Never list qualifications - weave relevant background organically into the message
          - Goal is authentic human connection, not credential presentation
          
          HUMAN WRITING PATTERNS:
          - People vary sentence structures, occasionally use fragments, and don't optimize every line
          - Real people communicate with a conversational flow that conveys personality
          - Use occasional contractions, simple transitions, and natural pauses
          - Sometimes include micro-details that show genuine interest/knowledge
          - When very brief (short emails), focus on one clear ask or point
          - Avoid the perfectly balanced paragraphs that AI often creates
          - Sound like a specific person, not a generic professional
          
          LENGTH REQUIREMENTS - STRICT:
          ${options.length === 'short' 
            ? '- VERY SHORT: 3-4 lines total (excluding greeting/signature)'
            : options.length === 'medium'
              ? '- MEDIUM: 5-7 lines total (excluding greeting/signature)'
              : '- DETAILED: 8-12 lines total (excluding greeting/signature)'
          }
          - A line is approximately 60-80 characters
          - Do not exceed the maximum number of lines under any circumstances
          - Content must fit within a quick glance on mobile
          
          IMPORTANT FORMAT:
          ${options.language === 'fr' 
            ? `1. Commencez par "Subject: [Objet d'email qui paraît naturel et efficace]"
               Exemples d'objets :
               - "Échange rapide sur companyField?"
               - "Question sur votre équipe chez companyField"
               - "Intérêt pour companyField - [mention brève du contexte]"
               - "Connexion professionnelle - [point commun spécifique]"`
            : `1. Start with "Subject: [Natural, effective subject line]"
               Example subjects:
               - "Quick thought about companyField"
               - "Question about your team at companyField" 
               - "Interest in companyField - [brief context mention]"
               - "Professional connection - [specific common ground]"`
          }
          
          2. Sautez une ligne
          3. Écrivez le contenu de l'email avec:
             - Une ouverture authentique qui crée une connexion personnelle
             - Un corps qui évite les phrases toutes faites et montre de l'intérêt spécifique
             - Une conclusion avec une demande claire et facile à satisfaire
          4. Terminez par une signature simple avec UNIQUEMENT le prénom fourni
          
          IMPORTANT MERGE FIELDS - USE THESE NATURALLY:
          - salutationField (Titre formel, ex: "Mr.", "Ms.", "Dr.")
          - firstNameField (Prénom du destinataire)
          - lastNameField (Nom de famille du destinataire)
          - companyField (Nom de l'entreprise)
          - positionField (Poste ou rôle professionnel)
          
          MERGE FIELD USAGE GUIDELINES:
          - Use merge fields only where they naturally fit in human writing
          - The greeting should feel natural for professional correspondence
          - Occasionally use firstNameField in the body if it feels conversational
          - Reference companyField in a way showing genuine interest/research
          - Don't force fields if they don't fit naturally in your message
          
          IMPORTANT - NATURAL COMPANY REFERENCES:
          Instead of awkward phrasing like "companyField's pioneering work", use more natural forms:
          - "what you're doing at companyField"
          - "the work being done at companyField"
          - "your team at companyField"
          - "companyField's approach to [industry topic]"
          - Just "companyField" when that flows naturally
          
          The goal is to reference the company as a real person would, not with an obvious template pattern. 
          Think about how you'd naturally mention a company name in conversation.

          DO NOT use any other merge fields or variables.
          DO NOT use double curly braces {{}} format.
          Always use the format: wordField (example: firstNameField)
          
          KEYS TO EFFECTIVE EMAILS THAT GET RESPONSES:
          - Provide a clear, specific reason for connecting (beyond just networking)
          - Show you've done your research on them/their company
          - Include a VERY simple call-to-action that's easy to respond to
          - Demonstrate value or relevance to THEIR interests
          - Keep short emails focused on ONE clear point or question
          - For detailed emails, still maintain clarity of purpose
          - Sound like someone they would WANT to talk to
          
          AUTHENTIC OPENINGS:
          Instead of clichés like "I recently came across your work", try more authentic openings:
          - "I've been following what companyField is doing in [specific area]"
          - "After reading about your approach to [topic], I wanted to reach out"
          - "Your recent work on [specific project] caught my attention"
          - "I noticed companyField is focusing on [specific initiative]"
          - "A colleague mentioned your expertise in [specific area]"
          
          Always be specific about WHY you're reaching out. Vague statements like "pioneering work" or 
          "impressive achievements" sound like templates. Reference something concrete that shows 
          genuine interest or connection.
          
          GENUINE CONNECTIONS:
          - Mention a specific project, article, presentation, or initiative that interested you
          - Reference a real connection point (event, mutual contact, shared interest)
          - Explain why you're contacting THIS specific person/company
          - Be precise about why you're reaching out NOW (timing adds authenticity)
          - Make your interest feel genuinely researched, not generic`
        },
        {
          role: "user",
          content: `${prompt}\n\n${userContext}\n\n${options.specificPoints ? `Additional context: ${options.specificPoints}` : ''}`
        }
      ],
      temperature: options.length === 'short' ? 0.75 : 0.85,
      max_tokens: options.length === 'short' ? 350 : options.length === 'medium' ? 600 : 1000
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

/**
 * Rewrites text using AI with the specified tone while preserving merge fields
 */
export async function rewriteTextWithAI(options: {
  text: string;
  tone: string;
  language?: string;
}): Promise<string> {
  try {
    // First, identify and extract merge fields
    const mergeFieldRegex = /\w+Field/g;
    const mergeFields: string[] = [];
    const mergeFieldsMap = new Map<string, string>();
    
    // Create a placeholder version of the text with merge fields replaced by unique placeholders
    let placeholderText = options.text;
    let counter = 0;
    
    // Extract all merge fields
    const foundMergeFields = options.text.match(mergeFieldRegex) || [];
    foundMergeFields.forEach(field => {
      if (!mergeFields.includes(field)) {
        mergeFields.push(field);
        const placeholder = `__MERGE_FIELD_${counter++}__`;
        mergeFieldsMap.set(placeholder, field);
        placeholderText = placeholderText.replace(new RegExp(field, 'g'), placeholder);
      }
    });
    
    // Now process with OpenAI using the placeholder text
    const openai = await getOpenAIInstance();
    
    // Default to English if no language is specified
    const language = options.language || 'en';
    
    // Create language-specific instruction
    let languageInstruction = '';
    if (language === 'fr') {
      languageInstruction = 'Répondez en français.';
    } else if (language === 'es') {
      languageInstruction = 'Responda en español.';
    } else if (language === 'de') {
      languageInstruction = 'Antworten Sie auf Deutsch.';
    }
    
    const mergeFieldsInstructions = mergeFields.length > 0 
      ? `IMPORTANT: This text contains special placeholders that must remain intact in your rewriting. 
         These placeholders are: ${Array.from(mergeFieldsMap.values()).join(', ')}. 
         I've temporarily replaced them with the following tokens which you MUST keep in the rewritten text: 
         ${Array.from(mergeFieldsMap.keys()).join(', ')}.`
      : '';
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1", // Updated from gpt-4o (Nov 2025)
      messages: [
        {
          role: "system",
          content: `You are a professional writer who helps rephrase text to match specific tones while maintaining the original meaning. ${languageInstruction}
          
          ${mergeFieldsInstructions}
          
          Ensure your rewritten text:
          1. Maintains exactly the same meaning as the original
          2. Uses a ${options.tone} tone throughout
          3. Preserves all placeholders exactly as they appear in the original text
          4. Keeps approximately the same length as the original text
          5. Fits naturally into a professional email context`
        },
        {
          role: "user",
          content: `Rewrite the following text in a ${options.tone} tone, being careful to preserve all special placeholders:\n\n${placeholderText}`
        }
      ],
      temperature: 0.7
    });
    
    let response = completion.choices[0]?.message?.content || '';
    if (!response) throw new Error('No response from AI');
    
    // Replace placeholders back with original merge fields
    mergeFieldsMap.forEach((originalField, placeholder) => {
      response = response.replace(new RegExp(placeholder, 'g'), originalField);
    });
    
    return response.trim();
  } catch (error) {
    console.error('Error rewriting text with AI:', error);
    throw error;
  }
}
