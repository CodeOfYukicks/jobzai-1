import { ref, getStorage, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';
import { toast } from '@/contexts/ToastContext';

// Configuration pour les validations
const VALIDATION_CONFIG = {
  // Par défaut, la validation est activée
  disableValidation: false,
  // Niveau de log (0: aucun, 1: erreurs seulement, 2: tout)
  logLevel: 2,
  // Seuils minimums
  minCvKeywords: 2,
  minJobKeywords: 1
};

// Fonction pour désactiver la validation (utile pour les tests ou le développement)
export function setValidationOptions(options: Partial<typeof VALIDATION_CONFIG>) {
  Object.assign(VALIDATION_CONFIG, options);
  console.log('CV Analysis validation configuration updated:', VALIDATION_CONFIG);
}

export interface CVAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  lastAnalyzed: Date;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function fetchCVContent(cvUrl: string) {
  if (!cvUrl) {
    throw new Error('No CV URL provided');
  }

  try {
    console.log('Starting CV fetch process...', cvUrl);
    
    // Vérifier l'authentification
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    // Vérifier si l'URL est une référence Firebase Storage valide
    if (!cvUrl.startsWith('gs://') || cvUrl.startsWith('gs://mock-pdf-url')) {
      throw new Error('Invalid Firebase Storage URL or mock URL detected');
    }

    // Vérifier que l'URL a une structure correcte avec un chemin de fichier
    const gsParts = cvUrl.replace('gs://', '').split('/');
    if (gsParts.length < 2) {
      throw new Error('Firebase Storage reference must include a bucket and path');
    }

    // Créer une référence au fichier
    const cvRef = ref(storage, cvUrl);
    
    // Obtenir une URL signée avec une expiration courte
    const downloadURL = await getDownloadURL(cvRef);
    
    console.log('Got signed URL, attempting fetch...');

    // Faire la requête avec les bons headers
    const response = await fetch(downloadURL, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
      mode: 'cors',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log('CV fetched successfully:', {
      size: blob.size,
      type: blob.type
    });

    return blob;

  } catch (error: any) {
    console.error('CV fetch error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Gestion spécifique des erreurs
    if (error.code === 'storage/object-not-found') {
      toast.error('CV not found. Please upload your CV first');
      throw new Error('CV not found');
    }
    
    if (error.code === 'storage/unauthorized') {
      toast.error('Access denied. Please check your permissions');
      throw new Error('Unauthorized access');
    }

    toast.error('Failed to fetch CV. Please try again');
    throw new Error(`Failed to fetch CV: ${error.message}`);
  }
}

// Fonctions de validation pour détecter si le contenu est valide
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Fonction pour forcer l'acceptation d'un contenu (utile pour débugger)
export function forceAcceptContent(): ValidationResult {
  return {
    isValid: true,
    confidence: 'high'
  };
}

export function validateCVContent(content: string): ValidationResult {
  // Si la validation est désactivée, accepter tous les contenus
  if (VALIDATION_CONFIG.disableValidation) {
    console.log('CV validation skipped: validation disabled');
    return forceAcceptContent();
  }

  // Ajouter des logs pour le diagnostic
  if (VALIDATION_CONFIG.logLevel >= 2) {
    console.log('Validating CV content:', {
      contentLength: content?.length || 0,
      contentSample: content?.substring(0, 100) + '...' || 'empty'
    });
  }

  if (!content || content.trim().length < 50) {
    if (VALIDATION_CONFIG.logLevel >= 1) {
      console.log('CV validation failed: content too short');
    }
    return {
      isValid: false,
      errorMessage: 'The CV content is too short. Please provide a complete CV.',
      confidence: 'high'
    };
  }

  const contentLower = content.toLowerCase();

  // Vérifier si c'est un document fiscal ou autre chose qu'un CV
  // Mots-clés qui indiquent un document fiscal/d'imposition
  const taxDocumentKeywords = [
    'impôt', 'impot', 'imposition', 'fiscal', 'fiscale', 'déclaration',
    'revenu', 'revenus', 'taxe', 'taxes', 'prélèvement', 'prélevement',
    'formulaire', 'impots.gouv', 'direction générale des finances',
    'avis d\'imposition', 'numéro fiscal', 'numéro d\'accès'
  ];
  
  // Compter combien de mots-clés fiscaux sont présents
  const taxKeywordsFound = taxDocumentKeywords.filter(keyword => contentLower.includes(keyword));
  
  if (taxKeywordsFound.length >= 2) {
    console.log('Document appears to be a tax document:', taxKeywordsFound);
    return {
      isValid: false,
      errorMessage: 'Ce document semble être une fiche d\'imposition ou un document fiscal, et non un CV. Veuillez télécharger votre CV.',
      confidence: 'high'
    };
  }
  
  // Vérifier pour d'autres types de documents non-CV
  const otherDocumentTypes = [
    { type: 'facture', keywords: ['facture', 'invoice', 'total ttc', 'total ht', 'montant'] },
    { type: 'relevé bancaire', keywords: ['relevé bancaire', 'bank statement', 'solde', 'balance', 'crédit', 'débit'] },
    { type: 'contrat', keywords: ['contrat', 'contract', 'conditions générales', 'terms', 'conditions', 'clause'] },
    { type: 'bulletin de paie', keywords: ['bulletin de paie', 'bulletin de salaire', 'payslip', 'pay slip', 'salaire brut'] }
  ];
  
  for (const docType of otherDocumentTypes) {
    const keywordsFound = docType.keywords.filter(keyword => contentLower.includes(keyword));
    if (keywordsFound.length >= 2) {
      console.log(`Document appears to be a ${docType.type}:`, keywordsFound);
      return {
        isValid: false,
        errorMessage: `Ce document semble être un(e) ${docType.type}, et non un CV. Veuillez télécharger votre CV.`,
        confidence: 'high'
      };
    }
  }

  // Mots-clés attendus dans un CV - liste élargie
  const cvKeywords = [
    // Mots-clés généraux de CV
    'experience', 'expérience', 'education', 'formation', 'skills', 'compétences',
    'work', 'travail', 'position', 'poste', 'employment', 'emploi', 'career', 'carrière',
    'professional', 'professionnel', 'resume', 'cv', 'curriculum', 'vitae',
    'profile', 'profil', 'objective', 'objectif', 'summary', 'résumé',
    'qualification', 'certification', 'diplôme', 'degree',
    // Mots-clés supplémentaires
    'project', 'projet', 'achievement', 'réalisation', 'reference', 'référence',
    'language', 'langue', 'contact', 'email', 'phone', 'téléphone', 'address', 'adresse',
    'university', 'université', 'school', 'école', 'college', 'collège', 'bac', 
    'master', 'bachelor', 'licence', 'diplome', 'certification', 'cours',
    'linkedin', 'github', 'portfolio', 'site', 'web', 'technologie', 'technology',
    'software', 'logiciel', 'développement', 'development', 'programmation', 'programming',
    'manager', 'gérant', 'directeur', 'director', 'chef', 'head', 'lead', 'senior',
    'junior', 'stagiaire', 'intern', 'stage', 'internship'
  ];

  // Vérifier si au moins quelques mots-clés sont présents
  const keywordsFound = cvKeywords.filter(keyword => contentLower.includes(keyword));
  
  console.log('CV keywords found:', {
    count: keywordsFound.length,
    keywords: keywordsFound
  });
  
  // Utiliser le seuil configuré (maintenant 2 au lieu de 1)
  if (keywordsFound.length < VALIDATION_CONFIG.minCvKeywords) {
    if (VALIDATION_CONFIG.logLevel >= 1) {
      console.log('CV validation failed: not enough keywords');
    }
    return {
      isValid: false,
      errorMessage: 'This doesn\'t appear to be a CV. Please upload a proper resume.',
      confidence: 'medium'
    };
  }

  // Vérifier la structure générale de manière plus flexible
  const hasDatePatterns = /\b(19|20)\d{2}\b/.test(content) || /\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b/.test(content);
  const hasBulletPoints = content.includes('•') || content.includes('-') || content.includes('*') || content.includes(':');
  const hasEmailPattern = /\S+@\S+\.\S+/.test(content);
  
  // Vérifier des sections typiques de CV
  const hasExperienceSection = /\b(expérience|experience|emploi|employment)\b/i.test(contentLower);
  const hasEducationSection = /\b(education|formation|diplôme|studies|études)\b/i.test(contentLower);
  const hasSkillsSection = /\b(compétences|skills|technical|technique)\b/i.test(contentLower);
  
  const structuralFeatures = [hasDatePatterns, hasBulletPoints, hasEmailPattern, 
                            hasExperienceSection, hasEducationSection, hasSkillsSection];
  const structuralScore = structuralFeatures.filter(Boolean).length;
  
  console.log('CV structure check:', {
    hasDatePatterns,
    hasBulletPoints,
    hasEmailPattern,
    hasExperienceSection,
    hasEducationSection,
    hasSkillsSection,
    structuralScore
  });
  
  // Exiger au moins 3 caractéristiques structurelles
  if (structuralScore < 3) {
    console.log('CV validation failed: missing structure elements');
    return {
      isValid: false,
      errorMessage: 'This document is missing key CV elements like dates, contact info, or structured information.',
      confidence: 'low' // Réduire la confiance
    };
  }

  // Accepter le document comme étant un CV
  console.log('CV validation passed');
  return {
    isValid: true,
    confidence: 'medium'
  };
}

export function validateJobDescription(content: string): ValidationResult {
  // Si la validation est désactivée, accepter tous les contenus
  if (VALIDATION_CONFIG.disableValidation) {
    console.log('Job description validation skipped: validation disabled');
    return forceAcceptContent();
  }

  // Ajouter des logs pour le diagnostic
  if (VALIDATION_CONFIG.logLevel >= 2) {
    console.log('Validating job description content:', {
      contentLength: content?.length || 0,
      contentSample: content?.substring(0, 100) + '...' || 'empty'
    });
  }

  if (!content || content.trim().length < 30) {
    console.log('Job description validation failed: content too short');
    return {
      isValid: false,
      errorMessage: 'The job description is too short. Please provide a complete job description.',
      confidence: 'high'
    };
  }

  // Mots-clés attendus dans une description de poste - liste élargie
  const jobKeywords = [
    // Mots-clés principaux
    'responsibilities', 'responsabilités', 'requirements', 'exigences',
    'qualifications', 'experience', 'expérience', 'skills', 'compétences',
    'job', 'emploi', 'position', 'poste', 'role', 'rôle',
    'work', 'travail', 'salary', 'salaire', 'benefits', 'avantages',
    'company', 'entreprise', 'team', 'équipe', 'location', 'lieu',
    // Mots-clés supplémentaires
    'mission', 'tâches', 'tasks', 'function', 'fonction', 'duty', 'duties',
    'profile', 'profil', 'candidat', 'candidate', 'apply', 'postuler',
    'environment', 'environnement', 'opportunity', 'opportunité',
    'remote', 'télétravail', 'hybrid', 'hybride', 'office', 'bureau',
    'full-time', 'part-time', 'temps plein', 'temps partiel', 'cdi', 'cdd',
    'stage', 'internship', 'contract', 'contrat', 'permanent', 'temporary',
    'offer', 'offre', 'recherche', 'seeking', 'hiring', 'embauche',
    'nous cherchons', 'we are looking for', 'join', 'rejoindre'
  ];

  // Vérifier si au moins quelques mots-clés sont présents
  const contentLower = content.toLowerCase();
  const keywordsFound = jobKeywords.filter(keyword => contentLower.includes(keyword));
  
  console.log('Job description keywords found:', {
    count: keywordsFound.length,
    keywords: keywordsFound
  });
  
  // Utiliser le seuil configuré
  if (keywordsFound.length < VALIDATION_CONFIG.minJobKeywords) {
    if (VALIDATION_CONFIG.logLevel >= 1) {
      console.log('Job description validation failed: not enough keywords');
    }
    return {
      isValid: false,
      errorMessage: 'This doesn\'t appear to be a job description. Please provide a proper job posting.',
      confidence: 'low' // Réduire la confiance
    };
  }

  // Accepter le document comme étant une description de poste
  console.log('Job description validation passed');
  return {
    isValid: true,
    confidence: 'medium'
  };
}

export async function analyzeCVWithGPT(cvUrl: string, jobDetails: { 
  jobTitle: string; 
  company: string; 
  jobDescription: string; 
}) {
  try {
    console.log('Starting advanced CV analysis with GPT Vision...');
    const cvContent = await fetchCVContent(cvUrl);
    
    if (!cvContent) {
      throw new Error('No CV content available for analysis');
    }

    console.log('CV fetched successfully, preparing for GPT Vision analysis:', {
      size: cvContent.size,
      type: cvContent.type,
      jobTitle: jobDetails.jobTitle,
      company: jobDetails.company,
      jobDescriptionLength: jobDetails.jobDescription?.length || 0
    });

    // Convertir le blob en base64 pour l'API Vision
    const base64CV = await blobToBase64(cvContent);
    
    // Appel à l'API GPT Vision avec notre prompt expert
    const analysis = await callGptVisionApi(base64CV, jobDetails);
    
    console.log('GPT Vision analysis completed successfully');
    toast.success('CV analysis completed with advanced AI');
    
    return analysis;
  } catch (error: any) {
    console.error('Advanced CV analysis error:', error);
    toast.error('Failed to analyze CV: ' + (error.message || 'Unknown error'));
    throw error;
  }
}

// Fonction pour convertir un Blob en base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extraire juste la partie base64 après le préfixe data:...;base64,
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Fonction pour appeler l'API GPT Vision avec notre prompt expert
async function callGptVisionApi(base64Image: string, jobDetails: { 
  jobTitle: string; 
  company: string; 
  jobDescription: string; 
}) {
  // URL de l'API GPT Vision (à adapter selon votre configuration)
  const apiUrl = process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  
  // Construire le prompt expert pour l'analyse ATS
  const prompt = buildATSAnalysisPrompt(jobDetails);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1", // Updated to GPT-5.1 (Nov 2025)
        messages: [
          {
            role: "system",
            content: "You are an expert ATS (Applicant Tracking System) analyzer and career coach. Your task is to provide detailed, accurate and helpful analysis of how well a resume matches a specific job description."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.2 // Réduit pour des analyses plus cohérentes et précises
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GPT Vision API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Parser la réponse JSON de l'API
    const analysisText = data.choices[0].message.content;
    
    try {
      // Tenter d'extraire la partie JSON de la réponse
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                        analysisText.match(/{[\s\S]*}/);
                        
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
      const parsedAnalysis = JSON.parse(jsonStr);
      
      return {
        ...parsedAnalysis,
        // Ajouter des métadonnées
        date: new Date().toISOString(),
        id: `ats_${Date.now()}`
      };
    } catch (parseError) {
      console.error('Failed to parse GPT response as JSON:', parseError);
      throw new Error('Invalid analysis format received from AI. Please try again.');
    }
  } catch (error: unknown) {
    console.error('GPT Vision API call failed:', error);
    throw new Error(`Failed to analyze CV with GPT Vision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fonction pour construire le prompt expert pour l'analyse ATS
function buildATSAnalysisPrompt(jobDetails: { 
  jobTitle: string; 
  company: string; 
  jobDescription: string; 
}): string {
  return `
# ATS Resume Analysis Task

## Instructions
Analyze the provided resume PDF against the job description below. Provide a detailed, accurate and genuinely helpful analysis of how well the resume matches the job requirements.

## Job Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## Analysis Requirements
1. THOROUGHLY examine both the resume and job description
2. Provide an HONEST and PRECISE match analysis with NO artificial inflation of scores
3. Vary your scores meaningfully based on the actual match quality - don't default to generic mid-range scores
4. Identify SPECIFIC strengths and gaps, not generic advice

## Output Format
Return ONLY a JSON object with the following structure:

\`\`\`json
{
  "matchScore": <integer_between_0_and_100>,
  "keyFindings": [<array_of_5-7_specific_key_findings_as_strings>],
  "skillsMatch": {
    "matching": [{"name": <skill_name>, "relevance": <integer_0-100>}, ...],
    "missing": [{"name": <skill_name>, "relevance": <integer_0-100>}, ...],
    "alternative": [{"name": <skill_name>, "alternativeTo": <required_skill>}, ...]
  },
  "categoryScores": {
    "skills": <integer_between_0_and_100>,
    "experience": <integer_between_0_and_100>,
    "education": <integer_between_0_and_100>,
    "industryFit": <integer_between_0_and_100>
  },
  "executiveSummary": <string_summarizing_overall_match_quality>,
  "experienceAnalysis": [
    {"aspect": <aspect_name>, "analysis": <detailed_analysis>},
    ...
  ],
  "recommendations": [
    {
      "title": <recommendation_title>,
      "description": <detailed_recommendation>,
      "priority": <"high"|"medium"|"low">,
      "examples": <example_text_or_null>
    },
    ...
  ]
}
\`\`\`

## Important Guidelines
- Ensure scores are MEANINGFUL and DIFFERENTIATED, not clustered in the 70-80% range
- Assign lower scores (30-60%) when appropriate for poor matches
- Assign higher scores (80-95%) only for exceptionally strong matches
- NEVER automatically inflate scores - be honest and precise
- Include specific job-relevant KEYWORDS found/missing in the resume
- Provide detailed, actionable recommendations specific to this resume and job
- Give real examples and fixes in your recommendations
`;
}

// Fonction utilitaire pour tester la connexion
export async function testCVAnalysis(cvUrl: string) {
  try {
    console.log('Testing CV analysis system...');
    
    const result = await analyzeCVWithGPT(cvUrl, {
      jobTitle: "Test Position",
      company: "Test Company",
      jobDescription: "This is a test job description for API verification."
    });
    
    return {
      success: true,
      message: 'CV analysis system is working correctly',
      details: result
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}
