import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Briefcase, Building, Target, 
  ChevronRight, X, Sparkles, Brain,
  CheckCircle, AlertCircle, Trophy, Lightbulb, Upload, Check,
  Flame as FireIcon, AlertTriangle, 
  Info as InformationCircleIcon, Code as CodeBracketIcon,
  BarChart as ChartBarIcon, Trash2, ChevronUp, ChevronDown, Calendar,
  Building2, CalendarDays as CalendarIcon, AlignLeft, Info,
  SearchCheck, LineChart, TrendingUp, TrendingDown, Activity, Palette, UserRound,
  Search, Filter, LayoutGrid, List, ArrowUpDown, Link2, Wand2, Loader2,
  Eye, Zap, MoreHorizontal, Copy
} from 'lucide-react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc, setDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, getStorage, uploadBytes } from 'firebase/storage';
import { toast } from 'sonner';
import { db, storage, auth } from '../lib/firebase';
import PrivateRoute from '../components/PrivateRoute';
import * as pdfjsLib from 'pdfjs-dist';
import { pdfjs } from 'react-pdf';
import { v4 } from 'uuid';
import { 
  PuzzlePieceIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  DocumentPlusIcon,
  PlusIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';
import { validateCVContent, validateJobDescription, setValidationOptions, analyzeCVWithGPT } from '../lib/cvAnalysis';
// Import Claude Analysis functions (legacy, kept for backward compatibility)
import { analyzeCVWithClaude, fileToBase64 } from '../lib/claudeAnalysis';
// Import GPT-4o Vision Analysis functions (new optimized approach)
import { pdfToImages } from '../lib/pdfToImages';
import { analyzeCVWithGPT4Vision } from '../lib/gpt4VisionAnalysis';
// Add this import
import CVSelectionModal from '../components/CVSelectionModal';
// Import Perplexity for job extraction
import { queryPerplexityForJobExtraction } from '../lib/perplexity';

// Configurer le worker correctement pour utiliser le fichier local depuis public
// Cela évite les problèmes CORS et 404 depuis les CDN externes
if (typeof window !== 'undefined') {
  // Use worker from public folder (copied from node_modules)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

console.log('PDF.js version:', pdfjsLib.version);

interface ATSAnalysis {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  matchScore: number;
  userId: string;
  keyFindings: string[];
  skillsMatch: {
    matching: { name: string; relevance: number; location?: string }[];
    missing: { name: string; relevance: number }[];
    alternative: { name: string; alternativeTo: string; explanation?: string }[];
  };
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    industryFit: number;
  };
  executiveSummary: string;
  experienceAnalysis: { aspect: string; analysis: string }[];
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    examples?: string;
  }[];
  marketPositioning?: {
    competitiveAdvantages: string[];
    competitiveDisadvantages: string[];
    industryTrends: string;
  };
  atsOptimization?: {
    score: number;
    formatting: string;
    keywordOptimization: string;
    improvements: string[];
    keywordDensity?: {
      criticalKeywords: { keyword: string; found: boolean; frequency: number; optimalFrequency: number }[];
      overallDensity: number;
      recommendations: string[];
    };
    sectionCompleteness?: {
      sections: { name: string; present: boolean; quality: number; recommendations?: string }[];
      overallScore: number;
    };
    readability?: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
  };
  jobSummary?: string; // AI-generated job summary
  resumeQuality?: {
    actionVerbs: { count: number; examples: string[]; recommendations: string[] };
    quantification: { score: number; achievementsWithNumbers: number; totalAchievements: number; recommendations: string[] };
    achievements: { quantified: number; unquantified: number; examples: string[] };
    careerProgression: { score: number; analysis: string; recommendations: string[] };
    contactInfo: { complete: boolean; missing: string[]; recommendations: string[] };
    resumeLength: { pages: number; words: number; optimal: boolean; recommendations: string[] };
  };
  applicationStrategy?: {
    coverLetterFocus: string;
    interviewPreparation: string;
    portfolioSuggestions: string;
    networkingTips?: string[];
    followUpStrategy?: string;
  };
  interviewProbability?: {
    atsPass: number;
    recruiterScreening: number;
    overall: number;
    factors: { positive: string[]; negative: string[] };
  };
  criticalRequirementsAnalysis?: {
    criticalMustHave: {
      requirement: string;
      category: 'skill' | 'experience' | 'education' | 'certification' | 'domain';
      found: boolean;
      location?: string;
      impact: 'deal-breaker';
      scorePenalty: number;
    }[];
    highlyImportant: {
      requirement: string;
      category: 'skill' | 'experience' | 'education' | 'certification' | 'domain';
      found: boolean;
      location?: string;
      impact: 'strong';
      scorePenalty: number;
    }[];
    niceToHave: {
      requirement: string;
      category: 'skill' | 'experience' | 'education' | 'certification' | 'domain';
      found: boolean;
      location?: string;
      impact: 'minor';
      scorePenalty: number;
    }[];
    summary: {
      criticalMet: number;
      criticalTotal: number;
      highlyImportantMet: number;
      highlyImportantTotal: number;
      niceToHaveMet: number;
      niceToHaveTotal: number;
    };
  };
  gapAnalysis?: {
    criticalGaps: {
      requirement: string;
      category: 'skill' | 'experience' | 'education' | 'certification' | 'domain';
      impact: string;
      scoreImpact: number;
      priority: 'critical' | 'high' | 'medium';
      recommendations: string[];
      alternatives?: string[];
    }[];
    importantGaps: {
      requirement: string;
      category: 'skill' | 'experience' | 'education' | 'certification' | 'domain';
      impact: string;
      scoreImpact: number;
      priority: 'high' | 'medium' | 'low';
      recommendations: string[];
    }[];
    overallImpact: {
      totalScorePenalty: number;
      criticalGapsCount: number;
      importantGapsCount: number;
      estimatedInterviewProbability: number;
    };
  };
}

interface CVOption {
  id: string;
  name: string;
  url: string;
}

interface AnalysisRequest {
  cvContent: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}

// Extraire des mots-clés d'un texte
const extractKeywords = (text: string): string[] => {
  // Liste de mots-clés techniques courants à rechercher - expanded list
  const technicalKeywords = [
    "javascript", "typescript", "react", "angular", "vue", "node", "express", 
    "python", "django", "flask", "java", "spring", "mongodb", "sql", "nosql", 
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "agile", 
    "scrum", "rest", "api", "graphql", "redux", "jest", "testing", "responsive", 
    "mobile", "web", "frontend", "backend", "fullstack", "design", "ui", "ux",
    "product", "management", "analytics", "data", "machine learning", "ai",
    "php", "laravel", "symfony", "c#", ".net", "ruby", "rails", "go", "scala",
    "terraform", "devops", "seo", "marketing", "content", "project management",
    // Add French equivalents and variations
    "javascript", "typescript", "react.js", "react native", "angularjs", "vue.js", "node.js", "expressjs",
    "python", "django", "flask", "java", "spring boot", "mongodb", "mysql", "postgresql", "sql server", "nosql",
    "amazon web services", "microsoft azure", "google cloud platform", "docker", "kubernetes", "git", "agile",
    "scrum", "rest api", "restful api", "graphql", "redux", "jest", "mocha", "chai", "testing", "responsive design",
    "mobile development", "web development", "front-end", "back-end", "full-stack", "ui design", "ux design",
    "product manager", "product owner", "analytics", "data science", "machine learning", "intelligence artificielle",
    "php", "laravel", "symfony", "c#", ".net core", "ruby", "ruby on rails", "golang", "scala",
    "terraform", "devops", "seo", "marketing", "content management", "project management", "gestion de projet",
    // Plural forms
    "apis", "applications", "frameworks", "libraries", "databases", "services",
    // Tools and technologies
    "npm", "yarn", "webpack", "babel", "eslint", "prettier", "sass", "less", "css", "html", "html5", "css3",
    "jquery", "bootstrap", "tailwind", "material ui", "chakra ui", "nextjs", "gatsby", "nuxt",
    "redux-saga", "redux-thunk", "mobx", "context api", "hooks", "graphql", "apollo", "relay",
    "enzyme", "cypress", "selenium", "puppeteer", "jasmine", "karma", "webpack", "parcel", "rollup",
    "storybook", "figma", "sketch", "adobe xd", "photoshop", "illustrator", "invision", "zeplin",
    "jira", "confluence", "trello", "asana", "notion", "basecamp", "slack", "teams", "github", "gitlab", "bitbucket"
  ];
  
  // Ajouter des mots clés génériques importants
  const generalKeywords = [
    "experience", "gestion", "lead", "team", "équipe", "communication",
    "problem solving", "performance", "résultats", "client", "budget",
    "stratégie", "innovation", "développement", "international", "analyse",
    "résolution de problèmes", "gestion de projet", "leadership", "communication", "travail d'équipe",
    "coordination", "planification", "organisation", "autonomie", "responsable", "chef d'équipe",
    "chef de projet", "directeur", "développeur", "ingénieur", "analyste", "consultant",
    "amélioration continue", "méthodologie", "processus", "optimisation", "supervision",
    "formation", "recrutement", "évaluation", "reporting", "présentation", "négociation",
    "veille technologique", "recherche", "prototypage", "conception", "architecture",
    "design patterns", "user stories", "backlog", "sprint", "planning", "review", "retrospective",
    "monitoring", "troubleshooting", "debugging", "maintenance", "support"
  ];
  
  // Combiner les deux listes
  const allKeywords = [...technicalKeywords, ...generalKeywords];
  
  // Filtrer les mots-clés présents dans le texte avec une approche plus flexible
  const foundKeywords = allKeywords.filter(keyword => {
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Check exact match
    if (textLower.includes(keywordLower)) {
      return true;
    }
    
    // Check parts of compound keywords (for multi-word terms)
    if (keywordLower.includes(' ')) {
      const parts = keywordLower.split(' ');
      // If all significant parts are found in proximity, consider it a match
      if (parts.filter(part => part.length > 3).every(part => textLower.includes(part))) {
        return true;
      }
    }
    
    // Check for singular/plural variations
    if (keywordLower.endsWith('s') && textLower.includes(keywordLower.slice(0, -1))) {
      return true;
    }
    if (!keywordLower.endsWith('s') && textLower.includes(keywordLower + 's')) {
      return true;
    }
    
    return false;
  });
  
  // Ajouter des mots-clés spécifiques du texte (mots commençant par une majuscule)
  const specificKeywords = text
    .split(/\s+/)
    .filter(word => word.length > 5 && word[0] === word[0].toUpperCase())
    .filter(word => !word.match(/^[^a-zA-Z]/)) // Éliminer les mots commençant par des non-lettres
    .slice(0, 5); // Limiter à 5 noms propres
  
  return [...new Set([...foundKeywords, ...specificKeywords])]; // Éliminer les doublons
};

// Ajouter cette fonction utilitaire en dehors de toute autre fonction
const roundScore = (score: number): number => Math.round(score);

// Fonction pour générer une analyse mock détaillée
const generateMockAnalysis = (data: { cv: string; jobTitle: string; company: string; jobDescription: string }): ATSAnalysis => {
  // Simuler le temps de traitement
  const cvText = data.cv.toLowerCase();
  const jobDesc = data.jobDescription.toLowerCase();
  
  // Définir les listes de mots-clés pour l'analyse
  const technicalKeywords = [
    "javascript", "typescript", "react", "angular", "vue", "node", "express", 
    "python", "django", "flask", "java", "spring", "mongodb", "sql", "nosql", 
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "agile", 
    "scrum", "rest", "api", "graphql", "redux", "jest", "testing", "responsive", 
    "mobile", "web", "frontend", "backend", "fullstack", "design", "ui", "ux",
    "product", "management", "analytics", "data", "machine learning", "ai",
    "php", "laravel", "symfony", "c#", ".net", "ruby", "rails", "go", "scala",
    "terraform", "devops", "seo", "marketing", "content", "project management"
  ];
  
  // Ajouter la fonction de calcul de pertinence des compétences
  const calculateSkillRelevance = (skill: string, jobDesc: string, cvText: string): number => {
    const jobDescLower = jobDesc.toLowerCase();
    const cvTextLower = cvText ? cvText.toLowerCase() : "";
    const skillLower = skill.toLowerCase();
    
    // Base relevance from job description
    let relevance = 70; // Base relevance score
    
    // If the skill is mentioned multiple times in the job description, it's more relevant
    const jobOccurrences = (jobDescLower.match(new RegExp(`\\b${skillLower}\\b`, 'g')) || []).length;
    relevance += Math.min(jobOccurrences * 5, 20); // Up to 20% bonus for frequent mentions
    
    // Check if it appears in important sections (requirements, qualifications, etc.)
    const importantSections = ["required", "requirement", "qualification", "essential", "must have", "key skill"];
    const isInImportantSection = importantSections.some(section => {
      const sectionIndex = jobDescLower.indexOf(section);
      if (sectionIndex === -1) return false;
      
      // Check if the skill is mentioned within 200 characters of the important section
      const sectionContext = jobDescLower.substring(
        Math.max(0, sectionIndex - 100),
        Math.min(jobDescLower.length, sectionIndex + 300)
      );
      
      return sectionContext.includes(skillLower);
    });
    
    if (isInImportantSection) {
      relevance += 10; // Bonus for being in an important section
    }
    
    // If the skill is found in the CV text, calculate how prominently it's featured
    if (cvTextLower && cvTextLower.includes(skillLower)) {
      const cvOccurrences = (cvTextLower.match(new RegExp(`\\b${skillLower}\\b`, 'g')) || []).length;
      relevance += Math.min(cvOccurrences * 2, 15); // Up to 15% bonus for CV prominence
      
      // Check if the skill is mentioned in the first third of the CV (often more prominent)
      if (cvTextLower.substring(0, cvTextLower.length / 3).includes(skillLower)) {
        relevance += 5; // Bonus for early mention in CV
      }
    }
    
    // Add slight random variation for natural feel
    relevance += Math.round(Math.random() * 6) - 3; // -3 to +3 random adjustment
    
    // Ensure relevance is within reasonable bounds
    return Math.max(40, Math.min(98, Math.round(relevance)));
  };
  
  // Advanced Keyword Extraction with Categories and Weights
  const keywordCategories = {
    technicalSkills: {
      weight: 0.40,
      keywords: technicalKeywords,
      found: [] as string[]
    },
    softSkills: {
      weight: 0.20,
      keywords: ["leadership", "communication", "teamwork", "problem solving", "critical thinking", 
                "creativity", "adaptability", "time management", "collaboration", "negotiation",
                "conflict resolution", "presentation", "decision making", "emotional intelligence"],
      found: [] as string[]
    },
    toolsAndPlatforms: {
      weight: 0.15,
      keywords: ["github", "gitlab", "bitbucket", "jira", "confluence", "slack", "trello", "asana",
                "figma", "sketch", "photoshop", "illustrator", "aws", "azure", "gcp", "heroku",
                "netlify", "vercel", "jenkins", "travis", "circle ci", "amplitude", "mixpanel", 
                "google analytics", "segment", "hotjar", "hubspot", "salesforce"],
      found: [] as string[]
    },
    domainKnowledge: {
      weight: 0.15,
      keywords: ["fintech", "healthtech", "edtech", "e-commerce", "saas", "marketplace", "cybersecurity",
                "blockchain", "crypto", "iot", "ar/vr", "ai/ml", "big data", "cloud computing",
                "mobile apps", "web apps", "enterprise", "b2b", "b2c", "social media"],
      found: [] as string[]
    },
    education: {
      weight: 0.10,
      keywords: ["bachelor", "master", "phd", "mba", "certification", "degree", "diploma", "bootcamp",
                "online course", "university", "college", "school", "graduate", "post-graduate"],
      found: [] as string[]
    }
  };

  // Find exact matches in job description
  const exactPhrases = data.jobDescription.match(/"([^"]*)"/g) || [];
  const exactPhrasesInCV = exactPhrases.filter(phrase => 
    cvText.includes(phrase.toLowerCase().replace(/"/g, ''))
  );
  
  const exactPhraseBonus = exactPhrasesInCV.length > 0 ? 
    Math.min(10, exactPhrasesInCV.length * 2) : 0;

  // Extract job requirements using regex patterns
  const requirementPatterns = [
    /required:([^.]*)/gi,
    /requirements:([^.]*)/gi,
    /qualifications:([^.]*)/gi,
    /must have:([^.]*)/gi,
    /essential:([^.]*)/gi
  ];
  
  let criticalRequirements: string[] = [];
  
  requirementPatterns.forEach(pattern => {
    const matches = [...jobDesc.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        const requirementSection = match[1].toLowerCase();
        // Extract key terms from requirement sections
        const terms = requirementSection.split(/[,;]/).map(term => term.trim());
        criticalRequirements.push(...terms);
      }
    });
  });
  
  // Filter out common words and duplicates
  criticalRequirements = [...new Set(criticalRequirements.filter(req => 
    req.length > 3 && !["and", "the", "with", "for", "etc"].includes(req)
  ))];
  
  // Count critical requirements met
  const criticalRequirementsMet = criticalRequirements.filter(req => 
    cvText.includes(req)
  ).length;
  
  const criticalRequirementsScore = criticalRequirements.length > 0 ?
    (criticalRequirementsMet / criticalRequirements.length) * 100 : 50; // Default to middle score if no critical requirements
  
  // Extract keywords by category
  for (const [category, data] of Object.entries(keywordCategories)) {
    const categoryKeywords = data.keywords;
    data.found = categoryKeywords.filter(keyword => 
      jobDesc.includes(keyword.toLowerCase()) && 
      cvText.includes(keyword.toLowerCase())
    );
  }
  
  // Calculate job title match level
  let titleMatchScore = 0;
  const jobTitleWords = data.jobTitle.toLowerCase().split(/\s+/);
  const titleWordsInCV = jobTitleWords.filter(word => 
    word.length > 3 && cvText.includes(word)
  ).length;
  
  if (titleWordsInCV === jobTitleWords.length) {
    titleMatchScore = 15; // Exact title match
  } else if (titleWordsInCV > 0) {
    titleMatchScore = (titleWordsInCV / jobTitleWords.length) * 10; // Partial match
  }
  
  // Calculate years of experience match
  let experienceYearsScore = 0;
  const experiencePattern = /(\d+)[\+]?\s+years?/gi;
  const expMatches = [...jobDesc.matchAll(experiencePattern)];
  
  if (expMatches.length > 0) {
    // Extract required years from job description
    const requiredYears = Math.max(...expMatches.map(m => parseInt(m[1], 10)));
    
    // Check if CV has that many years
    const cvExpMatches = [...cvText.matchAll(experiencePattern)];
    if (cvExpMatches.length > 0) {
      const cvYears = Math.max(...cvExpMatches.map(m => parseInt(m[1], 10)));
      
      if (cvYears >= requiredYears) {
        experienceYearsScore = 15; // Meets or exceeds required experience
      } else if (cvYears >= requiredYears * 0.7) {
        experienceYearsScore = 8; // Close to required experience
      } else {
        experienceYearsScore = 3; // Some experience but below requirement
      }
    }
  } else {
    // If no specific experience years mentioned, default to a moderate score
    experienceYearsScore = 8;
  }
  
  // Extract all keywords from job description
  const jobKeywords = extractKeywords(jobDesc);
  
  // Vérifier lesquels sont dans le CV - FIX: Ensure we get more matching by checking for word presence, not exact match
  const matchingKeywords = jobKeywords.filter(keyword => {
    // Check if the keyword or parts of it appear in the CV
    const keywordLower = keyword.toLowerCase();
    const cvTextLower = cvText.toLowerCase();
    
    // Check exact match
    if (cvTextLower.includes(keywordLower)) {
      return true;
    }
    
    // Check parts of compound keywords (for multi-word terms)
    if (keywordLower.includes(' ')) {
      const parts = keywordLower.split(' ');
      // If all significant parts are found, consider it a match
      if (parts.filter(part => part.length > 3).every(part => cvTextLower.includes(part))) {
        return true;
      }
    }
    
    // Check for singular/plural variations
    if (keywordLower.endsWith('s') && cvTextLower.includes(keywordLower.slice(0, -1))) {
      return true;
    }
    if (!keywordLower.endsWith('s') && cvTextLower.includes(keywordLower + 's')) {
      return true;
    }
    
    // Check for word stems and related forms
    const keywordParts = keywordLower.split(/\s+/);
    return keywordParts.some(part => {
      if (part.length <= 3) return false; // Skip very short words
      
      // Try to match word stems (first 5 chars for longer words)
      if (part.length > 5) {
        const stem = part.substring(0, 5);
        if (cvTextLower.includes(stem)) {
          // Verify it's not a false positive by checking surrounding context
          const index = cvTextLower.indexOf(stem);
          const wordInContext = cvTextLower.substring(
            Math.max(0, index - 10),
            Math.min(cvTextLower.length, index + stem.length + 10)
          );
          // If the context seems related, count it as a match
          if (keywordParts.some(kp => kp !== part && wordInContext.includes(kp))) {
            return true;
          }
        }
      }
      
      return cvTextLower.includes(part);
    });
  });
  
  // Only include as missing those that are truly not found after our enhanced matching
  const missingKeywords = jobKeywords.filter(keyword => 
    !matchingKeywords.includes(keyword)
  );
  
  // Trouver des compétences alternatives que le candidat pourrait avoir
  const alternativeSkills: { name: string; alternativeTo: string }[] = [];
  
  // Définir des groupes de compétences similaires/alternatives
  const skillGroups = [
    ["react", "angular", "vue", "svelte"],
    ["node", "express", "koa", "fastify", "nestjs"],
    ["python", "django", "flask", "fastapi"],
    ["java", "spring", "kotlin"],
    ["javascript", "typescript"],
    ["mongodb", "mongoose", "firebase"],
    ["postgresql", "mysql", "sql", "sql server", "oracle"],
    ["aws", "azure", "gcp", "cloud"],
    ["docker", "kubernetes", "containerization"],
    ["php", "laravel", "symfony", "wordpress"],
    ["ruby", "rails"],
    ["go", "golang"],
    ["c#", ".net", "asp.net"],
    ["design", "figma", "sketch", "adobe xd", "ui", "ux"],
    ["agile", "scrum", "kanban", "jira"],
    ["devops", "ci/cd", "jenkins", "github actions", "gitlab ci"],
    ["mobile", "react native", "flutter", "ionic", "swift", "kotlin"],
    ["data", "sql", "analytics", "tableau", "power bi", "looker"],
    ["machine learning", "ai", "tensorflow", "pytorch", "scikit-learn"]
  ];
  
  // Pour chaque compétence manquante, chercher des alternatives possibles
  missingKeywords.forEach(missingSkill => {
    const missingLower = missingSkill.toLowerCase();
    
    // Chercher le groupe contenant cette compétence manquante
    const group = skillGroups.find(group => 
      group.some(skill => skill.toLowerCase().includes(missingLower) || missingLower.includes(skill.toLowerCase()))
    );
    
    if (group) {
      // Chercher si le candidat a des compétences alternatives dans ce même groupe
      const alternatives = group.filter(skill => 
        skill.toLowerCase() !== missingLower && 
        matchingKeywords.some(match => 
          match.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(match.toLowerCase())
        )
      );
      
      // Ajouter l'alternative trouvée
      if (alternatives.length > 0) {
        alternativeSkills.push({ 
          name: alternatives[0], 
          alternativeTo: missingSkill 
        });
      }
    }
  });
  
  // FIX: Ensure we have a base level of match even if few keywords are found
  const keywordMatchScore = jobKeywords.length > 0 ?
    Math.max(35, (matchingKeywords.length / Math.max(1, jobKeywords.length)) * 100) : 50;
  
  // Calculate weighted category scores with a minimum base value
  let weightedCategoryScore = 0;
  for (const [category, data] of Object.entries(keywordCategories)) {
    const totalKeywordsInCategory = jobDesc.split(/\s+/).filter(word => 
      data.keywords.includes(word.toLowerCase())
    ).length;
    
    // FIX: Apply a minimum category score to avoid excessively low scores
    const categoryScore = totalKeywordsInCategory > 0 ? 
      Math.max(40, (data.found.length / totalKeywordsInCategory) * 100) : 50;
    
    weightedCategoryScore += categoryScore * data.weight;
  }
  
  // SEVERE SCORING: Apply critical requirement penalties FIRST
  // If critical requirements are missing, apply severe penalties
  let criticalPenalty = 0;
  const criticalRequirementsMetRatio = criticalRequirements.length > 0 ?
    (criticalRequirementsMet / criticalRequirements.length) : 1;
  
  // Calculate penalty based on missing critical requirements
  if (criticalRequirements.length > 0) {
    const missingCritical = 1 - criticalRequirementsMetRatio;
    if (missingCritical > 0.5) {
      // Missing more than 50% of critical requirements = severe penalty
      criticalPenalty = 50 + (missingCritical - 0.5) * 30; // 50-80 point penalty
    } else if (missingCritical > 0.25) {
      // Missing 25-50% of critical requirements = significant penalty
      criticalPenalty = 30 + (missingCritical - 0.25) * 20; // 30-50 point penalty
    } else if (missingCritical > 0) {
      // Missing less than 25% but still missing some = moderate penalty
      criticalPenalty = 20 + missingCritical * 10; // 20-30 point penalty
    }
  }
  
  // Calculate base score without minimum baseline (more severe)
  const baseScore = (
    (keywordMatchScore * 0.30) + // Base keyword matching (30%)
    (weightedCategoryScore * 0.25) + // Category-specific matches (25%)  
    (criticalRequirementsScore * 0.20) + // Critical requirements (20%)
    (titleMatchScore) + // Job title match bonus (0-15%)
    (experienceYearsScore) + // Experience years match (0-15%)
    (exactPhraseBonus) + // Exact phrase matches (0-10%)
    (Math.random() * 5) // Small random variation for natural feel (0 to +5)
  );
  
  // Apply critical penalty (SEVERE - this is the key change)
  const matchScore = Math.round(Math.max(0, baseScore - criticalPenalty));
  
  // Constrain score to realistic range (no artificial minimum)
  const finalMatchScore = Math.min(98, Math.max(0, matchScore));
  
  // Calculate highly specific category scores
  
  // Skills score - focuses on technical skill matches specifically with a base minimum
  const skillsScore = Math.round(
    Math.max(40, 
      // Match of technical keywords (60%)
      ((keywordCategories.technicalSkills.found.length / 
        Math.max(1, keywordCategories.technicalSkills.keywords.filter(k => jobDesc.includes(k)).length)) * 60) +
      // Tool and platform matches (20%)  
      ((keywordCategories.toolsAndPlatforms.found.length / 
        Math.max(1, keywordCategories.toolsAndPlatforms.keywords.filter(k => jobDesc.includes(k)).length)) * 20) +
      // Domain knowledge relevance (15%)
      ((keywordCategories.domainKnowledge.found.length / 
        Math.max(1, keywordCategories.domainKnowledge.keywords.filter(k => jobDesc.includes(k)).length)) * 15) +
      // Random variation (0 to +5%)
      (Math.random() * 5)
    )
  );
  
  // Experience score - based on years, seniority terms, and relevant roles with base minimum
  const seniorityTerms = ["senior", "lead", "head", "manager", "director", "principal", "architect"];
  const hasSeniorityTerm = seniorityTerms.some(term => data.jobTitle.toLowerCase().includes(term));
  const cvHasSeniorityTerm = seniorityTerms.some(term => cvText.includes(term));
  
  // Get role-specific experience indicators
  const matchingRoles = data.jobTitle.toLowerCase().split(/\s+/)
    .filter(word => word.length > 4)
    .filter(word => cvText.includes(word));
  
  const experienceScore = Math.round(
    Math.max(40,
      // Base from experience years match (0-50%)
      experienceYearsScore * 3.3 +
      // Seniority match (0-15%)
      (hasSeniorityTerm && cvHasSeniorityTerm ? 15 : 0) +
      // Role-specific experience (0-30%)
      (matchingRoles.length > 0 ? Math.min(30, matchingRoles.length * 15) : 0) +
      // Random variation for realism
      (Math.random() * 8)
    )
  );
  
  // Education score - based on education terms, degrees, and certifications
  const educationTerms = ["degree", "bachelor", "master", "phd", "mba", "certification", "diploma", "university"];
  const educationInJob = educationTerms.filter(term => jobDesc.includes(term));
  const educationInCV = educationTerms.filter(term => cvText.includes(term));
  
  let educationScore = 0;
  
  if (educationInJob.length === 0) {
    // If job doesn't specify education, give benefit of doubt
    educationScore = 85 + (Math.random() * 10);
  } else {
    // Calculate match based on educational requirements with minimum
    const educationMatch = educationInCV.filter(term => educationInJob.includes(term)).length;
    educationScore = Math.round(
      Math.max(50,
        (educationMatch / Math.max(1, educationInJob.length)) * 85 +
        (educationInCV.length > 0 ? 10 : 0) +
        (Math.random() * 8)
      )
    );
  }
  
  // Industry fit score - based on company and industry terms
  const industryTerms = data.company.toLowerCase().split(/\s+/)
    .filter(word => word.length > 4); // Company name words
    
  const companyInCV = industryTerms.some(term => cvText.includes(term));
  
  // Extract industry/domain keywords from job description
  const industryKeywords = keywordCategories.domainKnowledge.keywords.filter(k => 
    jobDesc.includes(k)
  );
  
  const industryKeywordMatches = industryKeywords.filter(k => cvText.includes(k)).length;
  
  const industryFitScore = Math.round(
    Math.max(40,
      // Domain knowledge matches (0-60%)
      (industryKeywords.length > 0 ? 
        (industryKeywordMatches / industryKeywords.length) * 60 : 40) +
      // Company name mention (0-15%)
      (companyInCV ? 15 : 0) +
      // Base industry awareness (15-30%)
      (15 + (industryKeywordMatches > 0 ? 15 : 0)) +
      // Random variation
      (Math.random() * 10)
    )
  );
  
  // Normalize all scores between 35 and 98 to avoid excessively low scores
  const normalizeScore = (score: number) => Math.max(35, Math.min(98, score));
  
  // Analyze experience with precise insights
  const experienceAnalysis = [
    {
      aspect: "Relevant Experience",
      analysis: matchScore > 75 
        ? `Your professional experience demonstrates ${finalMatchScore > 85 ? 'exceptional' : 'strong'} alignment with this role. Your background in ` +
          `${matchingKeywords.slice(0, 2).join(' and ')} is particularly relevant for this ${data.jobTitle} position. To strengthen your application further, ` +
          "emphasize quantifiable achievements that demonstrate measurable impact in these areas."
        : finalMatchScore > 60
          ? `Your experience shows moderate alignment with this role. While your background in ${matchingKeywords.slice(0, 2).join(' and ')} is valuable, ` +
            `consider highlighting more specifically how your experience applies to ${missingKeywords.slice(0, 2).join(' and ')}. ` +
            "Concrete examples demonstrating relevant skills would strengthen your application."
          : `There appears to be a notable gap (${finalMatchScore}% match) between your current experience and what this role requires. The position emphasizes ` +
            `${missingKeywords.slice(0, 3).join(', ')}, which aren't prominently featured in your resume. Consider emphasizing transferable skills and gaining ` +
            "additional exposure to these areas through projects or certifications."
    },
    {
      aspect: "Experience Duration",
      analysis: experienceScore > 75
        ? `Your resume demonstrates ${experienceScore > 90 ? 'extensive' : 'substantial'} relevant experience, which is highly advantageous for this position. ` + 
          `The ${data.jobTitle} role typically requires seasoned professionals, and your experience level positions you well. ` +
          "Consider structuring your experience section to highlight progressive responsibilities and long-term impact."
        : experienceScore > 60
          ? `Your experience duration appears adequate for this ${data.jobTitle} position, though not exceptional. ` +
            "Focus on depth rather than just length - highlight intensive projects, complex problem-solving, and significant contributions within your experience timeframe."
          : `Your experience duration in this specific field may benefit from further development. The ${data.jobTitle} position typically seeks candidates with ` +
            `${experienceYearsScore > 0 ? 'more years of' : 'demonstrated'} experience. Consider highlighting the depth and quality of your relevant projects, ` +
            "even if the overall duration is limited."
    },
    {
      aspect: "Industry Knowledge",
      analysis: industryFitScore > 80 
        ? `Your industry knowledge appears comprehensive and well-aligned with this position at ${data.company || "this company"}. ` + 
          `Your familiarity with ${keywordCategories.domainKnowledge.found.slice(0, 2).join(' and ')} is particularly valuable in this context. ` +
          "To stand out further, emphasize any specialized domain expertise or industry insights you've developed."
        : industryFitScore > 60
          ? `You demonstrate moderate industry knowledge relevant to this role. While you show familiarity with ${keywordCategories.domainKnowledge.found.length > 0 ? keywordCategories.domainKnowledge.found[0] : 'some aspects'}, ` +
            `deepening your expertise in ${industryKeywords.filter(k => !cvText.includes(k)).slice(0, 2).join(' and ')} would strengthen your profile for this ${data.jobTitle} position.`
          : `Strengthening your specific industry knowledge would significantly enhance your application. Your resume shows limited familiarity with ` +
            `${data.company || "this industry"}'s domain. Consider researching current trends and challenges, and incorporating relevant industry terminology into your resume.`
    },
    {
      aspect: "Career Progression",
      analysis: experienceScore > 70
        ? `Your career progression demonstrates clear advancement and increasing responsibility, which is attractive for this ${data.jobTitle} position. ` +
          "Your professional growth trajectory suggests readiness for this role. To maximize impact, ensure each position clearly shows your evolution and the expanding scope of your contributions."
        : `Your career progression could be presented more strategically to demonstrate professional growth relevant to this ${data.jobTitle} role. ` +
          "Consider restructuring your experience section to highlight how each role built upon previous skills and added new responsibilities applicable to this position. " +
          "Even lateral moves can be framed to show skill expansion and professional development."
    }
  ];
  
  // Generate more precisely tailored key findings
  const keyFindings = [
    finalMatchScore > 80 
      ? `Your profile demonstrates a strong ${finalMatchScore}% match with the core requirements for this ${data.jobTitle} position` 
      : finalMatchScore > 60
        ? `Your profile shows a moderate ${finalMatchScore}% match with the requirements for this ${data.jobTitle} position, with specific areas for targeted enhancement`
        : `Your profile currently shows a ${finalMatchScore}% match with the requirements for this ${data.jobTitle} position, suggesting several critical areas need development`,
    matchingKeywords.length > 0 
      ? `Key strengths identified: ${matchingKeywords.slice(0, 3).join(', ')} - these align well with the position requirements` 
      : "Few directly matching skills were identified - consider reviewing the job description carefully",
    missingKeywords.length > 0 
      ? `Critical skills to develop: ${missingKeywords.slice(0, 3).join(', ')} - addressing these gaps would significantly strengthen your application` 
      : "Your resume appears to cover the essential skills required for this position"
  ];
  
  // Add more insights based on specific scores
  if (experienceScore < 60) {
    keyFindings.push(`Your experience level (${experienceScore}%) appears below what may be expected for this position`);
  } else if (experienceScore > 85) {
    keyFindings.push(`Your experience level (${experienceScore}%) is a significant strength in your application`);
  }
  
  if (educationScore > 80) {
    keyFindings.push(`Your educational background (${educationScore}%) is well-aligned with the requirements`);
  } else if (educationScore < 60 && educationTerms.some(term => jobDesc.includes(term))) {
    keyFindings.push(`Your educational qualifications (${educationScore}%) may need highlighting or enhancement for this role`);
  }
  
  if (titleMatchScore > 10) {
    keyFindings.push(`Your previous job titles closely align with this ${data.jobTitle} position, which strengthens your application`);
  }
  
  // Generate detailed and actionable recommendations
  const recommendations = [
    {
      title: missingKeywords.length > 0 ? "Address key skill gaps" : "Strengthen existing skills",
      description: missingKeywords.length > 0 
        ? `Your resume lacks explicit mention of ${missingKeywords.slice(0, 3).join(', ')}, which appear critical for this ${data.jobTitle} role. ` +
          "Consider acquiring these skills through courses, projects, or highlighting transferable experience you already have."
        : `While you have the required skills for this ${data.jobTitle} position, make them more prominent by detailing specific projects, achievements, and metrics that showcase your expertise.`,
      priority: "high" as const,
      examples: missingKeywords.length > 0 
        ? `For ${missingKeywords[0]}: "Completed ${missingKeywords[0]} certification and applied skills in a personal project resulting in [specific outcome]"`
        : `"Led development of [product/feature] using ${matchingKeywords[0]}, resulting in 35% improvement in [relevant metric]"`
    },
    {
      title: "Quantify achievements with metrics",
      description: `Transform generic statements into powerful proof points by adding specific numbers, percentages, and outcomes that demonstrate your impact as a ${data.jobTitle}.`,
      priority: "medium" as const,
      examples: "\"Increased client retention by 40% by implementing a new CRM strategy\" rather than \"Improved client retention through CRM implementation\""
    },
    {
      title: `Customize your resume specifically for ${data.company || "this company"}`,
      description: `Tailor your resume to highlight experience and achievements most relevant to this ${data.jobTitle} position at ${data.company || "the company"}. ` +
        `Align your language with keywords such as ${matchingKeywords.length > 0 ? matchingKeywords.slice(0, 3).join(', ') : jobKeywords.slice(0, 3).join(', ')} to increase both ATS match and resonance with hiring managers.`,
      priority: "high" as const,
      examples: `"Managed end-to-end implementation of [relevant project type] for clients in the ${data.company ? data.company + " market space" : industryKeywords.length > 0 ? industryKeywords[0] + " industry" : "same industry"}"`
    },
    {
      title: "Optimize resume structure and formatting",
      description: `Ensure your most relevant qualifications for this ${data.jobTitle} role appear in the top third of your resume where they'll get immediate attention. Use a clean, professional format with consistent styling.`,
      priority: "low" as const,
      examples: `Move your experience with ${matchingKeywords.length > 0 ? matchingKeywords[0] : "relevant skills"} to a 'Core Competencies' section at the top of your resume`
    }
  ];
  
  // Add experience-specific recommendation if score is low
  if (experienceScore < 65) {
    recommendations.push({
      title: "Bridge the experience gap",
      description: `This ${data.jobTitle} position appears to value more ${experienceYearsScore > 0 ? 'years of' : ''} experience than your resume currently demonstrates. ` +
        "Consider adding a 'Professional Development' section highlighting relevant training, projects, or volunteer work that compensates for this gap.",
      priority: "medium" as const,
      examples: "\"While transitioning to this field, completed 3 enterprise-level projects applying directly relevant skills in [specific area]\""
    });
  }
  
  // Add education recommendation if score is low
  if (educationScore < 60 && educationTerms.some(term => jobDesc.includes(term))) {
    recommendations.push({
      title: "Highlight educational qualifications",
      description: `The ${data.jobTitle} position mentions specific educational requirements that appear underemphasized in your resume. ` +
        "Ensure your education section clearly presents your qualifications and consider adding relevant certifications or continuing education.",
      priority: "medium" as const,
      examples: "\"Actively pursuing [relevant certification] to complement my practical experience in [field]\""
    });
  }
  
  // Create a precise executive summary based on the match score
  let executiveSummary = "";
  if (finalMatchScore >= 85) {
    executiveSummary = `Excellent match (${finalMatchScore}%)! Your resume demonstrates strong alignment with this ${data.jobTitle} position at ${data.company || "the company"}. ` +
      `Your experience with ${matchingKeywords.slice(0, 2).join(' and ')} appears particularly relevant, and your ${experienceScore > 80 ? 'extensive experience' : 'skill set'} positions you well. ` +
      "Minor adjustments to highlight specific achievements and metrics could further strengthen your already competitive application.";
  } else if (finalMatchScore >= 70) {
    executiveSummary = `Good match (${finalMatchScore}%). Your resume shows solid alignment with this ${data.jobTitle} role, with clear strengths and some areas for enhancement. ` +
      `Your background in ${matchingKeywords.slice(0, 2).join(' and ')} is valuable, but developing expertise in ` +
      `${missingKeywords.slice(0, 2).join(' and ')} would significantly increase your competitiveness from ${finalMatchScore}% to potentially 85%+. ` +
      "Implementing our targeted recommendations would strengthen your candidacy considerably.";
  } else if (finalMatchScore >= 50) {
    executiveSummary = `Moderate match (${finalMatchScore}%). Your resume demonstrates some relevant qualifications for this ${data.jobTitle} position, but requires focused adjustments to better align with key requirements. ` +
      `While your experience with ${matchingKeywords.length > 0 ? matchingKeywords[0] : "some areas"} is relevant, there appear to be gaps in ` +
      `${missingKeywords.slice(0, 3).join(', ')}. ` +
      "Following our detailed recommendations would substantially improve your match rate and competitive position.";
  } else {
    executiveSummary = `Limited match (${finalMatchScore}%). Your current resume requires significant adjustments to align with this ${data.jobTitle} position. ` +
      `The core requirements emphasize ${missingKeywords.slice(0, 3).join(', ')}, which aren't prominently featured in your resume. ` +
      "We recommend targeted skill development and resume restructuring based on our detailed recommendations below.";
  }
  
  // Fonction pour arrondir les scores pour éviter les décimales bizarres
  const roundScore = (score: number): number => Math.round(score);

  // Lorsque vous créez l'objet retourné, arrondissez tous les scores
  return {
    id: crypto.randomUUID(),
    date: formatDateString(new Date().toISOString().split('T')[0]),
    jobTitle: data.jobTitle,
    company: data.company,
    matchScore: roundScore(finalMatchScore),
    userId: '',
    keyFindings,
    skillsMatch: {
      matching: matchingKeywords.map(keyword => ({ 
        name: keyword, 
        relevance: calculateSkillRelevance(keyword, jobDesc, cvText)
      })),
      missing: missingKeywords.map(keyword => ({ 
        name: keyword, 
        relevance: calculateSkillRelevance(keyword, jobDesc, "") 
      })),
      alternative: alternativeSkills
    },
    categoryScores: {
      skills: roundScore(normalizeScore(skillsScore)),
      experience: roundScore(normalizeScore(experienceScore)),
      education: roundScore(normalizeScore(educationScore)),
      industryFit: roundScore(normalizeScore(industryFitScore))
    },
    executiveSummary,
    experienceAnalysis,
    recommendations,
  };
};

// Generate job post summary using AI
const generateJobSummary = async (jobTitle: string, company: string, jobDescription: string): Promise<string | null> => {
  try {
    // Generate summary even if description is short, but skip if completely empty
    if (!jobDescription || jobDescription.trim().length === 0 || jobDescription === 'Not provided') {
      console.warn('Skipping job summary generation: no job description provided');
      return null;
    }
    
    // Log for debugging
    console.log('📝 Generating job summary for:', { jobTitle, company, descriptionLength: jobDescription.length });

    const prompt = `You are an expert career consultant. Analyze this job posting and create a clear, concise summary that highlights only the most important information.

JOB POSTING DETAILS:
- Job Title: ${jobTitle}
- Company: ${company}
- Full Job Description:
${jobDescription.substring(0, 4000)}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
You MUST return ONLY plain text with markdown-style formatting. DO NOT return JSON. DO NOT use code blocks. DO NOT use curly braces {} or square brackets [] for structure.

Create a well-structured summary EXACTLY in this format:

**Key Responsibilities**
• [Responsibility 1]
• [Responsibility 2]
• [Responsibility 3]

**Required Qualifications**
• [Qualification 1]
• [Qualification 2]
• [Qualification 3]

**Preferred Qualifications**
• [Qualification 1]
• [Qualification 2]

**Company/Team Context**
[Brief context about the company or team if available]

FORMATTING RULES:
1. Use ** (double asterisks) for section headers ONLY (e.g., **Key Responsibilities**)
2. Use bullet points (•) for list items
3. Each section header must be on its own line
4. Each bullet point must be on its own line starting with •
5. Sections must be separated by TWO blank lines
6. Return ONLY the formatted text - NO JSON, NO code blocks, NO curly braces, NO square brackets
7. Start directly with **Key Responsibilities** - no introduction, no explanation`;

    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv-edit', prompt }),
    });

    if (!response.ok) {
      console.warn('Failed to generate job summary, continuing without it');
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn('Failed to parse job summary response');
      return null;
    }

    if (data.status !== 'success') {
      return null;
    }

    let summary = '';
    if (typeof data.content === 'string') {
      summary = data.content;
    } else if (data.content && typeof data.content === 'object') {
      summary = JSON.stringify(data.content, null, 2);
    } else {
      return null;
    }

    // Clean up the summary - try to parse JSON if it's JSON format
    summary = summary.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Try to parse and format if it's JSON
    try {
      const parsed = JSON.parse(summary);
      
      // Handle different JSON structures
      let data: any = null;
      if (parsed.summary) {
        data = parsed.summary;
      } else if (parsed.content) {
        data = parsed.content;
      } else if (parsed['Key Responsibilities'] || parsed.keyResponsibilities) {
        data = parsed;
      } else {
        const keys = Object.keys(parsed);
        if (keys.length > 0 && typeof parsed[keys[0]] === 'object') {
          data = parsed[keys[0]];
        } else {
          data = parsed;
        }
      }
      
      if (data && typeof data === 'object') {
        let formatted = '';
        
        if (data['Key Responsibilities'] || data.keyResponsibilities) {
          formatted += '**Key Responsibilities**\n\n';
          const responsibilities = data['Key Responsibilities'] || data.keyResponsibilities || [];
          if (Array.isArray(responsibilities)) {
            responsibilities.forEach((item: string) => {
              formatted += `• ${item}\n`;
            });
          }
          formatted += '\n';
        }
        
        if (data['Required Qualifications'] || data.requiredQualifications) {
          formatted += '**Required Qualifications**\n\n';
          const required = data['Required Qualifications'] || data.requiredQualifications || [];
          if (Array.isArray(required)) {
            required.forEach((item: string) => {
              formatted += `• ${item}\n`;
            });
          }
          formatted += '\n';
        }
        
        if (data['Preferred Qualifications'] || data.preferredQualifications) {
          formatted += '**Preferred Qualifications**\n\n';
          const preferred = data['Preferred Qualifications'] || data.preferredQualifications || [];
          if (Array.isArray(preferred)) {
            preferred.forEach((item: string) => {
              formatted += `• ${item}\n`;
            });
          }
          formatted += '\n';
        }
        
        if (data['Company/Team Context'] || data.companyContext || data.context) {
          formatted += '**Company/Team Context**\n\n';
          const context = data['Company/Team Context'] || data.companyContext || data.context || '';
          if (typeof context === 'string') {
            formatted += `${context}\n`;
          } else if (Array.isArray(context)) {
            context.forEach((item: string) => {
              formatted += `• ${item}\n`;
            });
          }
          formatted += '\n';
        }
        
        if (formatted.trim()) {
          summary = formatted.trim();
        }
      }
    } catch (e) {
      // Not JSON, keep as is
    }
    
    return summary || null;
  } catch (e) {
    console.warn('Error generating job summary:', e);
    return null;
  }
};

// Fonction d'analyse plus sophistiquée
const analyzeCV = async (data: AnalysisRequest): Promise<ATSAnalysis> => {
  try {
    console.log('🔍 Analyzing CV with data:', data);
    
    // Variable pour détecter si on fait une analyse directe avec fichier PDF
    let directAnalysis = false;
    let cvFile: File | null = null;
    
    // Si un fichier PDF a été uploadé directement, on le récupère depuis le state
    if (typeof window !== 'undefined') {
      // Récupérer le cvFile depuis le state en utilisant une approche plus sûre
      try {
        // On utilise une assertion de type pour éviter l'erreur de TypeScript
        // En production, il serait préférable d'implémenter un state manager propre
        const appState = (window as any).__JOBZAI_STATE__;
        if (appState && appState.cvFile) {
          cvFile = appState.cvFile;
        }
      } catch (error) {
        console.warn('Impossible de récupérer le state du CV:', error);
      }
    }
    
    if (cvFile && cvFile.type === 'application/pdf') {
      console.log('📄 Utilisation directe du fichier PDF pour GPT Vision');
      directAnalysis = true;
      
      try {
        const base64CV = await fileToBase64(cvFile);
        
        // Appel direct à GPT Vision avec le PDF en base64
        const jobDetails = {
          jobTitle: data.jobTitle,
          company: data.company,
          jobDescription: data.jobDescription
        };
        
        // Utiliser la nouvelle fonction Claude API à la place
        const analysis = await analyzeCVWithClaude(cvFile, jobDetails);
        console.log('✅ Analyse Claude réussie!', analysis);
        
        return {
          ...analysis,
          id: `claude_analysis_${Date.now()}`,
          jobTitle: data.jobTitle,
          company: data.company,
          date: new Date().toISOString(),
          userId: auth.currentUser?.uid || 'unknown'
        };
      } catch (error) {
        console.error('❌ Erreur lors de l\'analyse directe avec Claude:', error);
        throw error;
      }
    }
    
    // Si pas d'analyse directe, continuer avec l'analyse traditionnelle via le texte
    // Reste du code existant...
    
    // Si on n'a pas pu utiliser le PDF directement, continuer avec l'approche standard
    if (!directAnalysis) {
      // Si le contenu du CV est une URL (commence par 'gs://' pour Firebase Storage)
      let cvUrl: string;
      let useTextAnalysis = false;
      
      if (typeof data.cvContent === 'string' && (data.cvContent.startsWith('gs://') || data.cvContent.startsWith('https://'))) {
        cvUrl = data.cvContent;
        console.log('Using provided CV URL for analysis:', { urlStart: cvUrl.substring(0, 30) + '...' });
      } 
      // Si c'est juste du texte extrait
      else if (typeof data.cvContent === 'string') {
        console.log('Warning: Using text-only CV content. Falling back to text-based analysis.');
        useTextAnalysis = true;
        cvUrl = '';
      } 
      else {
        throw new Error('Invalid CV content format for analysis');
      }
      
      const jobDetails = {
        jobTitle: data.jobTitle,
        company: data.company,
        jobDescription: data.jobDescription
      };
      
      let gptAnalysis;
      if (!useTextAnalysis) {
        try {
          gptAnalysis = await analyzeCVWithGPT(cvUrl, jobDetails);
        } catch (error) {
          console.error('GPT Vision analysis failed, falling back to text analysis:', error);
          useTextAnalysis = true;
        }
      }
      
      if (useTextAnalysis) {
        console.log('Falling back to mock text-based analysis');
        gptAnalysis = generateMockAnalysis({
          cv: typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable',
          jobTitle: data.jobTitle,
          company: data.company,
          jobDescription: data.jobDescription
        });
      }
      
      return {
        ...gptAnalysis,
        id: gptAnalysis.id || `analysis_${Date.now()}`,
        date: formatDateString(new Date().toISOString().split('T')[0]),
        userId: auth.currentUser?.uid || 'anonymous',
        jobTitle: data.jobTitle,
        company: data.company
      };
    }
    
    // Fallback return in case nothing else worked
    // This ensures a return in all code paths
    return generateMockAnalysis({
      cv: typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable',
      jobTitle: data.jobTitle,
      company: data.company,
      jobDescription: data.jobDescription
    });
    
  } catch (error: any) {
    console.error('Error during ATS analysis:', error);
    
    // En cas d'erreur, nous pouvons revenir à l'ancienne méthode simulative
    console.log('Falling back to mock analysis due to error');
    return generateMockAnalysis({
      cv: typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable',
      jobTitle: data.jobTitle,
      company: data.company,
      jobDescription: data.jobDescription
    });
  }
};

// Fonction temporaire pour créer un PDF simulé à partir de texte
// Cette fonction sera remplacée quand les utilisateurs uploadent toujours des PDF
async function createMockPdfFromText(text: string): Promise<string> {
  // Au lieu de simuler une URL Firebase Storage qui cause des problèmes avec getDownloadURL,
  // retournons simplement le texte comme contenu directement
  console.log('Using text content directly instead of simulating a PDF URL');
  
  // Générer une analyse simulée directement à partir du texte
  return text;
}

export default function CVAnalysisPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCV, setSelectedCV] = useState<string | null>('');
  const [userCV, setUserCV] = useState<{ url: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
    jobUrl: '',
  });
  const [jobInputMode, setJobInputMode] = useState<'ai' | 'manual'>('ai');
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLLabelElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string>('preparing');
  const [loadingMessage, setLoadingMessage] = useState<string>('Preparing to analyze your resume...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Add these state variables for CV selection modal
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [enableContentValidation, setEnableContentValidation] = useState(true);
  
  // States for search, filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'company'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Charger le CV depuis le profil utilisateur
  useEffect(() => {
    const fetchUserCV = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().cvUrl) {
          setUserCV({
            url: userDoc.data().cvUrl,
            name: userDoc.data().cvName || 'Profile CV'
          });
        }
      } catch (error) {
        console.error('Error fetching user CV:', error);
      }
    };
    fetchUserCV();
  }, [currentUser]);

  // Charger les analyses sauvegardées
  useEffect(() => {
    const fetchSavedAnalyses = async () => {
      if (!currentUser) return;
      
      try {
        console.log('Attempting to load analyses...');
        const analysesRef = collection(db, 'users', currentUser.uid, 'analyses');
        const q = query(analysesRef, orderBy('timestamp', 'desc'));
        
        try {
          const querySnapshot = await getDocs(q);
          
          const savedAnalyses: ATSAnalysis[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.deleted) { // Don't load analyses marked as deleted
              savedAnalyses.push({
                id: doc.id,
                date: data.date,
                jobTitle: data.jobTitle || 'Untitled Position',
                company: data.company || 'Unknown Company',
                matchScore: data.matchScore,
                userId: '', // Assuming userId is not provided in the saved data
                keyFindings: data.keyFindings,
                skillsMatch: data.skillsMatch,
                experienceAnalysis: data.experienceAnalysis,
                recommendations: data.recommendations,
                categoryScores: data.categoryScores,
                executiveSummary: data.executiveSummary,
                jobSummary: data.jobSummary || undefined, // Include job summary if available
              });
            }
          });
          
          if (savedAnalyses.length > 0) {
            console.log(`Loaded ${savedAnalyses.length} saved analyses`);
            setAnalyses(savedAnalyses);
          }
        } catch (firestoreError) {
          console.error('Error loading saved analyses:', firestoreError);
          // Vérifier si c'est une erreur de permission
          if (firestoreError instanceof Error && 
              firestoreError.toString().includes('permission')) {
            console.warn('Permission error detected. You need to update Firestore security rules.');
            toast.error('Permission error. Please check Firestore security rules.');
          } else {
            toast.error('Unable to load your saved analyses');
          }
        }
      } catch (error) {
        console.error('Unexpected error in fetchSavedAnalyses:', error);
        toast.error('An unexpected error occurred');
      }
    };
    
    fetchSavedAnalyses();
  }, [currentUser]);

  // Sauvegarder l'analyse dans Firestore
  const saveAnalysisToFirestore = async (analysis: ATSAnalysis) => {
    if (!currentUser) {
      console.warn('Cannot save analysis: User not logged in');
      return analysis;
    }
    
    try {
      console.log('Attempting to save analysis to Firestore...');
      const analysisToSave = {
        ...analysis,
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        deleted: false
      };
      
      const analysesRef = collection(db, 'users', currentUser.uid, 'analyses');
      const docRef = await addDoc(analysesRef, analysisToSave);
      
      console.log('Analysis saved to Firestore with ID:', docRef.id);
      toast.success('Analysis saved successfully!');
      return {
        ...analysis,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error saving analysis to Firestore:', error);
      
      // Vérifier si c'est une erreur de permission
      if (error instanceof Error && error.toString().includes('permission')) {
        console.warn('Permission error detected. You need to update Firestore security rules.');
        toast.error('Permission error during save. Please check Firestore security rules.');
      } else {
        toast.error('Unable to save analysis, but results are available');
      }
      
      // Retourner l'analyse avec un ID généré localement pour maintenir la fonctionnalité
      return {
        ...analysis,
        id: 'local_' + Date.now()
      };
    }
  };

  // Extraction de texte à partir d'un PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log("Début de l'extraction du texte du PDF");
      const arrayBuffer = await file.arrayBuffer();
      console.log("PDF chargé en mémoire, taille:", arrayBuffer.byteLength);
      
      // Utiliser un try/catch spécifique pour le chargement du PDF
      try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log(`PDF chargé avec succès: ${pdf.numPages} pages`);
        
        let fullText = '';
        
        // Extraire le texte de chaque page
        for (let i = 1; i <= pdf.numPages; i++) {
          console.log(`Traitement de la page ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items.map((item: any) => item.str).join(' ');
          fullText += textItems + '\n';
        }
        
        // Normalisation du texte pour améliorer la correspondance des compétences
        fullText = normalizeExtractedText(fullText);
        
        console.log("Extraction de texte terminée avec succès");
        return fullText || `Contenu du CV: ${file.name}`; // Fallback si aucun texte n'est extrait
      } catch (pdfError) {
        console.error("Erreur lors du traitement du PDF:", pdfError);
        // Solution de secours: utiliser le nom du fichier comme contenu
        console.log("Utilisation du nom du fichier comme solution de secours");
        return `Contenu du CV: ${file.name} (extraction de texte échouée)`;
      }
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      // Ne pas bloquer le flux, retourner une valeur par défaut
      return `Contenu du CV: ${file.name} (impossible d'extraire le texte)`;
    }
  };

  // Fonction pour normaliser le texte extrait
  const normalizeExtractedText = (text: string): string => {
    // Remplacer les caractères spéciaux et les accents
    let normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Remplacer les tirets et puces par des espaces
    normalized = normalized.replace(/[-–—•●]/g, ' ');
    
    // Remplacer les multiples espaces par un seul
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Convertir les dates au format standard pour une meilleure reconnaissance
    normalized = normalized.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, "$1/$2/$3");
    
    // Ajouter des espaces autour des ponctuation pour séparer les mots
    normalized = normalized.replace(/([.,;:!?()])/g, " $1 ");
    
    // Normalisation des termes techniques courants
    const technicalTermsMapping: {[key: string]: string} = {
      "js": "javascript",
      "ts": "typescript",
      "py": "python",
      "react.js": "react",
      "reactjs": "react",
      "node.js": "node",
      "nodejs": "node",
      "vue.js": "vue",
      "vuejs": "vue",
      "angular.js": "angular",
      "angularjs": "angular",
      "express.js": "express",
      "expressjs": "express",
      "front-end": "frontend",
      "back-end": "backend",
      "full-stack": "fullstack",
      "c++": "cpp",
      "c#": "csharp",
      ".net": "dotnet",
      "ui/ux": "ui ux",
      "html5": "html",
      "css3": "css",
    };
    
    // Appliquer les mappings de termes techniques
    let normalizedLower = normalized.toLowerCase();
    Object.entries(technicalTermsMapping).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalizedLower = normalizedLower.replace(regex, value);
    });
    
    // Ajouter des termes courants pour améliorer la correspondance
    const commonJobTitles = [
      "software engineer", "software developer", "web developer", "frontend developer", 
      "backend developer", "fullstack developer", "data scientist", "data analyst",
      "product manager", "project manager", "ux designer", "ui designer", "devops engineer"
    ];
    
    // Si un titre de poste est présent, le mettre en évidence pour une meilleure correspondance
    let jobTitleBoost = '';
    for (const title of commonJobTitles) {
      if (normalizedLower.includes(title)) {
        jobTitleBoost += ` ${title} ${title}`;  // Duplicated for emphasis
      }
    }
    
    // Ajouter les boosters de titre en fin de texte
    normalized = normalizedLower + jobTitleBoost;
    
    return normalized;
  };

  const handleFileUpload = (file: File | React.ChangeEvent<HTMLInputElement>) => {
    let fileToProcess: File;
    
    if (file instanceof File) {
      fileToProcess = file;
    } else {
      if (!file.target.files?.[0]) return;
      fileToProcess = file.target.files[0];
    }
    
    // Validate file type
    if (fileToProcess.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    
    setCvFile(fileToProcess);
    toast.success('CV selected successfully');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileUpload(file);
    }
  };

  // Fonction pour désactiver/activer la validation
  const toggleValidation = () => {
    const newState = !validationEnabled;
    setValidationEnabled(newState);
    setValidationOptions({ disableValidation: !newState });
    
    if (newState) {
      toast.success('Content validation has been enabled');
    } else {
      toast.success('Content validation has been temporarily disabled');
    }
  };

  // Fonction pour convertir un fichier en base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Extraire la partie base64 après le préfixe
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Fonction pour appeler directement l'API OpenAI sans passer par Firebase
  const callGptVisionApiDirect = async (
    base64PDF: string, 
    jobDetails: { jobTitle: string; company: string; jobDescription: string }
  ) => {
    const apiUrl = process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Clé API OpenAI manquante. Veuillez configurer NEXT_PUBLIC_OPENAI_API_KEY dans .env.local');
    }
    
    console.log('📡 Envoi direct à l\'API OpenAI en cours...');
    
    const prompt = `
# RUTHLESS ATS RESUME ANALYSIS ENGINE - BE SEVERE AND POLARIZED

## CRITICAL MISSION
You are a RUTHLESS, SEVERE, and BRUTALLY HONEST ATS specialist. Your job is to analyze this resume with SURGICAL PRECISION and deliver a TRUTHFUL assessment that the candidate can RELY ON. 

**CORE PHILOSOPHY**: 
- Distinguish PRIMORDIAL (critical) requirements from SECONDARY (nice-to-have) requirements
- Missing ONE critical requirement = SEVERE penalty (20-40 points)
- Missing multiple critical requirements = MASSIVE penalty (40-60+ points)
- Be POLARIZED in your scoring - use the FULL range (0-100)
- Don't inflate scores to be "nice" - be HONEST and SEVERE
- The candidate needs to TRUST your analysis - false high scores help NO ONE

## Job Position Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## STEP 1: EXTRACT & CATEGORIZE REQUIREMENTS (MOST CRITICAL STEP)

**BE RUTHLESS IN CATEGORIZATION. THIS DETERMINES EVERYTHING.**

**CRITICAL VERIFICATION RULE**: Before marking ANY requirement as MISSING, you MUST:
1. Search the ENTIRE resume (all sections, all pages, all text)
2. Search for EXACT terms, SYNONYMS, VARIATIONS, ABBREVIATIONS
3. For languages: "French" = "français" = "French native" = "French speaker" = "French language" = "native French" = "fluent in French" = "bilingual French/English"
4. For technical skills: "JavaScript" = "JS" = "javascript" = "JavaScript/ES6" = "JS/TS"
5. Check ALL sections: Summary, Skills, Experience, Education, Certifications, Projects, Languages, Personal Info
6. If you find it in ANY form, mark it as FOUND with the location
7. DO NOT mark as missing if you haven't thoroughly searched

From the job description, you MUST identify with surgical precision:

### A. CRITICAL MUST-HAVE REQUIREMENTS (DEAL-BREAKERS - PRIMORDIAL)
These are ABSOLUTE REQUIREMENTS that if missing, the candidate CANNOT get the job:
- Skills explicitly stated as "required", "must have", "essential", "mandatory"
- Minimum years of experience that are non-negotiable
- Critical certifications/licenses that are mandatory
- Education requirements explicitly stated as mandatory
- Core domain expertise that is fundamental to the role

**SCORING RULE**: Missing even ONE critical must-have = automatic 20-40 point penalty to overall match score. Missing 2+ = 40-60 point penalty. This is NON-NEGOTIABLE.

### B. HIGHLY IMPORTANT REQUIREMENTS (STRONG IMPACT)
- Skills mentioned multiple times in the job description
- Experience that is strongly preferred
- Certifications that are highly valued

**SCORING RULE**: Missing highly important requirements = 10-20 point penalty per missing item.

### C. NICE-TO-HAVE REQUIREMENTS (SECONDARY - BONUS POINTS)
- Skills mentioned once or in "nice to have" sections
- Additional certifications beyond core requirements
- Extra experience beyond minimum

**SCORING RULE**: Missing nice-to-haves = 0-5 point penalty. Having them = 0-5 point bonus.

**CRITICAL**: You MUST categorize EVERY requirement. If a skill is in "Required Qualifications" or mentioned 3+ times, it's CRITICAL. If mentioned once in passing, it's SECONDARY.

## Analysis Framework
1. EXTRACT ALL REQUIREMENTS and categorize them (CRITICAL vs SECONDARY)
2. COMPARE resume against CRITICAL requirements first - these determine the base score
3. EVALUATE resume against SECONDARY requirements - these adjust the score
4. IDENTIFY specific strengths and weaknesses with examples
5. PRIORITIZE recommendations - focus on CRITICAL gaps first

## Depth Requirements
- Provide PRECISE and SPECIFIC feedback with evidence
- DISTINGUISH between what's PRIMORDIAL and what's SECONDARY
- Be RUTHLESS - if critical requirements are missing, scores MUST be low
- Be POLARIZED - use full score range, don't cluster in middle
- Evaluate QUANTIFIABLE ACHIEVEMENTS and their relevance
- Assess FORMATTING, STRUCTURE, and CONTENT from ATS perspective

## SCORING PHILOSOPHY (STRICT ENFORCEMENT)

**Overall Match Score** (0-100) - Be RUTHLESS:

- **90-100**: EXCEPTIONAL - Exceeds ALL critical requirements. RARE.
- **80-89**: STRONG - Meets ALL critical requirements, most highly important ones
- **70-79**: GOOD - Meets ALL critical requirements, some highly important ones
- **60-69**: QUALIFIED - Meets ALL critical requirements but missing many highly important ones
- **50-59**: BORDERLINE - Missing 1 critical requirement OR missing most highly important ones
- **40-49**: WEAK - Missing 1-2 critical requirements OR missing most highly important ones
- **30-39**: POOR - Missing 2+ critical requirements
- **0-29**: UNQUALIFIED - Missing 3+ critical requirements

**MANDATORY RULES**:
1. Missing ANY critical must-have → Maximum score is 60
2. Missing 2+ critical must-haves → Maximum score is 40
3. Missing 3+ critical must-haves → Maximum score is 30
4. Perfect alignment with critical requirements → Score range 70-95
5. Exceeding all requirements → Score range 90-100 (RARE)

## Response Format
Return ONLY a structured JSON object with the following schema:

\`\`\`json
{
  "matchScore": <integer_0-100>,
  "keyFindings": [<array_of_5-7_specific_key_findings>],
  "skillsMatch": {
    "matching": [{"name": <skill_name>, "relevance": <relevance_0-100>}, ...],
    "missing": [{"name": <skill_name>, "relevance": <relevance_0-100>}, ...],
    "alternative": [{"name": <alternative_skill>, "alternativeTo": <required_skill>}, ...]
  },
  "categoryScores": {
    "skills": <score_0-100>,
    "experience": <score_0-100>,
    "education": <score_0-100>,
    "industryFit": <score_0-100>
  },
  "executiveSummary": <concise_overall_assessment>,
  "experienceAnalysis": [
    {"aspect": <experience_aspect>, "analysis": <detailed_analysis>},
    ...
  ],
  "marketPositioning": {
    "competitiveAdvantages": [<list_of_strengths_vs_typical_candidates>],
    "competitiveDisadvantages": [<list_of_weaknesses_vs_typical_candidates>],
    "industryTrends": <how_resume_aligns_with_current_industry_trends>
  },
  "atsOptimization": {
    "score": <score_0-100>,
    "formatting": <formatting_assessment>,
    "keywordOptimization": <keyword_assessment>,
    "improvements": [<specific_ats_improvement_points>]
  },
  "recommendations": [
    {
      "title": <recommendation_title>,
      "description": <detailed_recommendation>,
      "priority": <"high"|"medium"|"low">,
      "examples": <example_or_template_text>
    },
    ...
  ],
  "applicationStrategy": {
    "coverLetterFocus": <what_to_emphasize_in_cover_letter>,
    "interviewPreparation": <key_points_to_prepare_for_interviews>,
    "portfolioSuggestions": <portfolio_improvement_suggestions>
  },
  "criticalRequirementsAnalysis": {
    "criticalMustHave": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "deal-breaker",
        "scorePenalty": <0-40, penalty_if_missing>
      },
      ...
    ],
    "highlyImportant": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "strong",
        "scorePenalty": <0-20, penalty_if_missing>
      },
      ...
    ],
    "niceToHave": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "minor",
        "scorePenalty": <0-5, penalty_if_missing>
      },
      ...
    ],
    "summary": {
      "criticalMet": <integer>,
      "criticalTotal": <integer>,
      "highlyImportantMet": <integer>,
      "highlyImportantTotal": <integer>,
      "niceToHaveMet": <integer>,
      "niceToHaveTotal": <integer>
    }
  },
  "gapAnalysis": {
    "criticalGaps": [
      {
        "requirement": "<exact_missing_requirement>",
        "category": "<skill|experience|education|certification|domain>",
        "impact": "<detailed_explanation_of_why_this_is_critical_and_how_it_affects_candidacy>",
        "scoreImpact": <0-40, points_lost_due_to_this_gap>,
        "priority": "critical",
        "recommendations": ["<specific_actionable_recommendation_1>", ...],
        "alternatives": ["<alternative_skill_or_experience_or_null>", ...]
      },
      ...
    ],
    "importantGaps": [
      {
        "requirement": "<exact_missing_requirement>",
        "category": "<skill|experience|education|certification|domain>",
        "impact": "<detailed_explanation_of_why_this_is_important_and_how_it_affects_candidacy>",
        "scoreImpact": <0-20, points_lost_due_to_this_gap>,
        "priority": "<high|medium|low>",
        "recommendations": ["<specific_actionable_recommendation_1>", ...]
      },
      ...
    ],
    "overallImpact": {
      "totalScorePenalty": <integer>,
      "criticalGapsCount": <integer>,
      "importantGapsCount": <integer>,
      "estimatedInterviewProbability": <0-100>
    }
  }
}
\`\`\`

## Critical Guidelines (MANDATORY - BE RUTHLESS)

**SCORING PHILOSOPHY - STRICT ENFORCEMENT**:

1. **USE FULL RANGE (0-100)**: Don't cluster scores. Be POLARIZED.
   - Low match (0-50%): For missing critical requirements or significant misalignment
   - Medium match (51-70%): For meeting critical requirements but missing highly important ones
   - High match (71-95%): Only for meeting ALL critical requirements AND most highly important ones
   - Exceptional (96-100%): RARE - exceeds all requirements

2. **CRITICAL REQUIREMENT ENFORCEMENT**:
   - Missing 1 critical must-have → Maximum score: 60
   - Missing 2+ critical must-haves → Maximum score: 40
   - Missing 3+ critical must-haves → Maximum score: 30
   - This is NON-NEGOTIABLE. Be SEVERE.

3. **DISTINGUISH PRIMORDIAL vs SECONDARY**:
   - Primary (critical) requirements missing = SEVERE penalty (20-40 points)
   - Secondary (nice-to-have) requirements missing = MINOR penalty (0-5 points)
   - Always identify what's PRIMORDIAL first

4. **BRUTAL HONESTY**:
   - Never inflate scores to be "nice" - be REALISTIC and SEVERE
   - The candidate needs to TRUST your analysis
   - False high scores help NO ONE - they prevent improvement
   - If critical requirements are missing, the score MUST reflect that

5. **EVIDENCE-BASED**:
   - Provide SPECIFIC, ACTIONABLE recommendations with evidence
   - Focus on EVIDENCE from resume, not assumptions
   - Include BEFORE/AFTER examples when possible
   - Tie every finding to concrete resume elements

6. **RELIABILITY**:
   - The candidate must be able to DEPEND ON your analysis
   - Be the assessment they can TRUST
   - If you're not severe and honest, they can't rely on you
`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a RUTHLESS, SEVERE, and BRUTALLY HONEST ATS specialist with 15+ years of experience. You MUST distinguish between PRIMORDIAL (critical) requirements and SECONDARY (nice-to-have) requirements. Missing even ONE critical requirement MUST result in a significant score penalty (20-40 points). Missing multiple critical requirements MUST result in severe penalties (40-60+ points). Use the FULL score range (0-100) and be POLARIZED - don't inflate scores. The candidate needs to TRUST your analysis, so be HONEST and SEVERE. Your analysis must be exceptionally detailed, evidence-based, and actionable. Provide specific evidence from the resume for each point. Think step by step. If critical requirements are missing, scores MUST be low. If all critical requirements are met, scores can be high. Be the analysis the candidate can DEPEND ON. CRITICAL: Before marking ANY requirement as MISSING, you MUST thoroughly search the ENTIRE resume for EXACT terms, SYNONYMS, VARIATIONS, and ABBREVIATIONS. For languages, check for all forms: 'French' = 'français' = 'French native' = 'French speaker' = 'French language' = 'native French' = 'fluent in French'. For technical skills, check for abbreviations and variations. Search ALL sections of the resume. If you find it in ANY form, mark it as FOUND. DO NOT mark as missing if you haven't thoroughly searched."
            },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64PDF}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.2
        })
      });

      console.log('📊 Statut de la réponse OpenAI:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('🛑 Erreur OpenAI:', errorData);
        throw new Error(`Erreur API GPT Vision: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('📝 Réponse brute reçue:', data.choices[0].message.content.substring(0, 100) + '...');
      
      // Parser la réponse
      const analysisText = data.choices[0].message.content;
      
      try {
        // Tenter d'extraire la partie JSON
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                          analysisText.match(/{[\s\S]*}/);
                          
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
        const parsedAnalysis = JSON.parse(jsonStr);
        
        return parsedAnalysis;
      } catch (parseError) {
        console.error('❌ Erreur de parsing JSON:', parseError);
        throw new Error('Format d\'analyse invalide reçu de l\'IA. Veuillez réessayer.');
      }
    } catch (error) {
      throw error;
    }
  };

  const loadingMessages = {
    preparing: [
      "Preparing your resume analysis...",
      "Initializing AI analysis engine...",
      "Loading analysis tools...",
      "Setting up the analysis framework...",
      "Preparing to analyze your resume..."
    ],
    analyzing: [
      "Analyzing your resume content...",
      "Reading and processing your CV...",
      "Extracting key information...",
      "Analyzing your professional profile...",
      "Processing your qualifications..."
    ],
    matching: [
      "Matching your profile with job requirements...",
      "Calculating compatibility score...",
      "Analyzing skills alignment...",
      "Evaluating experience match...",
      "Assessing your qualifications..."
    ],
    finalizing: [
      "Generating personalized recommendations...",
      "Preparing your analysis report...",
      "Finalizing insights and suggestions...",
      "Compiling your results...",
      "Almost done..."
    ]
  };


  // Modifier l'effet pour les messages sans clignotement
  useEffect(() => {
    if (!isLoading) return;
    
    // Initialiser le message pour l'étape actuelle
    const messages = loadingMessages[loadingStep as keyof typeof loadingMessages];
    if (messages && messages.length > 0) {
      setLoadingMessage(messages[0]);
    }
    
    // Change message every 8 seconds (plus long pour éviter le clignotement)
    const messageInterval = setInterval(() => {
      const messages = loadingMessages[loadingStep as keyof typeof loadingMessages];
      
      if (messages && messages.length > 0) {
      setLoadingMessage(prev => {
        // Sélectionner un nouveau message différent de l'actuel
          const currentMessage = prev;
        let newMessage;
          let attempts = 0;
        do {
          const idx = Math.floor(Math.random() * messages.length);
          newMessage = messages[idx];
            attempts++;
            // Éviter une boucle infinie
            if (attempts > 10) break;
        } while (newMessage === currentMessage && messages.length > 1);
        
          return newMessage || messages[0];
      });
      }
    }, 8000); // Intervalle plus long pour réduire le clignotement
    
    // Simulate progress plus fluide et progressif
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // Cap progress based on current step
        const caps = {
          'preparing': 25,
          'analyzing': 65,
          'matching': 85,
          'finalizing': 95
        };
        const cap = caps[loadingStep as keyof typeof caps] || 95;
        
        if (prev >= cap) return prev;
        
        // Increment plus petit et plus progressif
        const remainingProgress = cap - prev;
        const increment = Math.max(0.1, remainingProgress * 0.01);
        return Math.min(prev + increment, cap);
      });
    }, 500); // Plus lent pour éviter les sauts
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading, loadingStep]);

  // Fonction pour extraire les informations du job depuis l'URL
  const handleExtractJobInfo = async () => {
    if (!formData.jobUrl || !formData.jobUrl.trim()) {
      toast.error('Please enter a job URL first');
      return;
    }

    setIsExtractingJob(true);
    toast.info('Extracting job information with AI...', { duration: 2000 });

    try {
      const jobUrl = formData.jobUrl.trim();
      const prompt = `
You are a precise web scraper. Your ONLY task is to visit this URL and extract EXACT information from the job posting page: ${jobUrl}

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:

1. YOU MUST VISIT THE URL: Use web browsing to access ${jobUrl} and read the ACTUAL page content
2. DO NOT USE TRAINING DATA: Extract ONLY what is VISIBLY DISPLAYED on the page - never guess or infer
3. DO NOT INVENT INFORMATION: If information is not on the page, do NOT make it up or use similar job postings
4. DO NOT SUMMARIZE: Extract the COMPLETE, FULL text - word for word when possible

EXTRACTION REQUIREMENTS:

For "companyName":
- Find the EXACT company name as displayed on the page
- Look in the header, job title area, or company information section
- Copy it EXACTLY as shown (case-sensitive, with exact spelling)

For "position":
- Find the EXACT job title as displayed on the page
- Look for <h1>, <h2>, title tags, or the main job title element
- Copy it EXACTLY as shown (case-sensitive, with exact spelling)
- This is CRITICAL for accurate CV matching

For "jobDescription" - THIS IS THE MOST IMPORTANT FIELD:
- Extract the COMPLETE, FULL job description with ABSOLUTELY EVERYTHING from the page
- Include ALL sections you see on the page, including but not limited to:
  * Job Overview/Summary/About the Role
  * Key Responsibilities/Duties/What You'll Do
  * Required Qualifications/Must Have
  * Preferred Qualifications/Nice to Have
  * Required Skills (technical and soft skills) - list EVERY skill mentioned
  * Preferred Skills
  * Experience Requirements (years, type, industry)
  * Education Requirements (degree, certifications)
  * Location/Remote work information
  * Salary/Benefits/Compensation (if mentioned)
  * Company Culture/Values/Mission
  * Team Information
  * Application Process
  * Equal Opportunity statements
  * Any other text, paragraphs, or sections visible on the page
- DO NOT summarize, shorten, or condense ANY section
- DO NOT skip any paragraphs or bullet points
- Include ALL text, even if it seems repetitive or long
- Preserve the structure, formatting, and ALL details
- If the description is 5000+ characters, that's fine - include EVERYTHING
- The jobDescription MUST be the COMPLETE, FULL description - nothing less
- This is CRITICAL: Missing information will make the CV analysis inaccurate

VALIDATION CHECKLIST - Before returning, verify:
1. ✓ The job title matches EXACTLY what's on the page
2. ✓ The company name matches EXACTLY what's on the page
3. ✓ The job description includes EVERY section visible on the page
4. ✓ You have NOT summarized or shortened any section
5. ✓ You have NOT skipped any paragraphs or bullet points
6. ✓ You have NOT added any information that wasn't on the page
7. ✓ The jobDescription field contains the FULL, COMPLETE text from the page

IMPORTANT: The jobDescription field should typically be 1000-5000+ characters for a complete job posting. If it's shorter than 500 characters, you likely missed sections.

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations, no additional text):
{
  "companyName": "exact company name from page",
  "position": "exact job title from page",
  "jobDescription": "COMPLETE FULL job description with ALL sections, ALL paragraphs, ALL bullet points, ALL text from the page - nothing omitted"
}

URL to visit: ${jobUrl}
`;

      const response = await queryPerplexityForJobExtraction(prompt);
      
      if (response.error) {
        throw new Error(response.errorMessage || 'Failed to analyze job posting');
      }

      // Parser la réponse JSON avec amélioration pour gérer les descriptions longues
      let extractedData;
      try {
        let jsonString = response.text || '';
        
        // Nettoyer la réponse pour extraire le JSON
        jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        jsonString = jsonString.trim();
        
        // Trouver le JSON object - chercher le premier { jusqu'au dernier }
        // Utiliser une approche plus robuste pour gérer les descriptions longues avec guillemets
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        // Fonction pour réparer les erreurs JSON communes (surtout pour les descriptions longues)
        const tryParseJSON = (str: string) => {
          try {
            return JSON.parse(str);
          } catch (e) {
            console.log('Initial JSON parse failed, attempting repair...');
            // Essayer de réparer les erreurs communes
            let repaired = str
              // Réparer les guillemets échappés dans les chaînes
              .replace(/\\"/g, '\\"')  // Préserver les guillemets échappés
              // Réparer les sauts de ligne dans les chaînes JSON
              .replace(/("jobDescription"\s*:\s*")([\s\S]*?)(")/g, (_match, prefix, content, suffix) => {
                // Échapper les guillemets et sauts de ligne dans le contenu
                const escaped = content
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
                return prefix + escaped + suffix;
              })
              // Réparer les virgules finales
              .replace(/,\s*\]/g, ']')
              .replace(/,\s*\}/g, '}')
              // Réparer les clés non citées
              .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
              // Réparer les valeurs avec guillemets simples
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            
            try {
              return JSON.parse(repaired);
            } catch (e2) {
              console.error('JSON repair failed:', e2);
              // Dernière tentative : extraire manuellement avec regex amélioré
              return null;
            }
          }
        };
        
        // Essayer de parser le JSON
        extractedData = tryParseJSON(jsonString);
        
        // Si le parsing échoue, essayer une extraction manuelle améliorée
        if (!extractedData) {
          console.log('JSON parsing failed, attempting manual extraction...');
        const text = response.text || '';
        
          // Extraction améliorée avec support pour descriptions longues
        let companyName = '';
          const companyMatch = text.match(/"companyName"\s*:\s*"((?:[^"\\]|\\.)*)"/i) || 
                           text.match(/companyName["\s]*:["\s]*([^",\n}]+)/i);
        if (companyMatch) companyName = companyMatch[1].trim();
        
        let position = '';
          const positionMatch = text.match(/"position"\s*:\s*"((?:[^"\\]|\\.)*)"/i) || 
                              text.match(/position["\s]*:["\s]*"((?:[^"\\]|\\.)*)"/i);
        if (positionMatch) position = positionMatch[1].trim();
        
          // Extraction améliorée pour jobDescription (peut être très long)
        let jobDescription = '';
          // Chercher jobDescription avec support pour chaînes multi-lignes
          const descMatch = text.match(/"jobDescription"\s*:\s*"((?:[^"\\]|\\.|\\n|\\r)*)"/s) ||
                           text.match(/"jobDescription"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
          
          if (descMatch && descMatch[1]) {
            // Décoder les séquences d'échappement
            jobDescription = descMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
              .trim();
          }
          
          // Si on a au moins le titre et la company, créer l'objet
        if (position && companyName) {
            extractedData = {
              companyName,
              position,
              jobDescription: jobDescription || ''
            };
          } else {
            throw new Error('Could not extract required fields from the response');
          }
        }
        
        // Validation des données extraites
        if (!extractedData.position || !extractedData.companyName) {
          throw new Error('Missing required fields: position and companyName are required');
        }
        
        // Validation stricte de la longueur de la description
        const descriptionLength = extractedData.jobDescription?.length || 0;
        const description = (extractedData.jobDescription || '').toLowerCase();
        
        // Vérifications de complétude
        const hasRequirements = description.includes('requirement') || description.includes('qualification') || description.includes('skill') || description.includes('must have');
        const hasResponsibilities = description.includes('responsibilit') || description.includes('dutie') || description.includes('role') || description.includes('what you');
        const hasExperience = description.includes('experience') || description.includes('years') || description.includes('minimum');
        const hasEducation = description.includes('education') || description.includes('degree') || description.includes('bachelor') || description.includes('master');
        
        // Avertissements selon la longueur et le contenu
        if (descriptionLength < 300) {
          console.warn('Job description seems very short. It may be incomplete.');
          toast.warning('The job description extracted seems very short (< 300 chars). Please verify it contains all sections from the page.');
        } else if (descriptionLength < 800) {
          console.warn('Job description may be incomplete. Most job postings are longer.');
          toast.warning('The extracted description may be incomplete. Please review and ensure all sections were captured.');
        }
        
        // Vérifier les sections critiques manquantes
        const missingSections = [];
        if (!hasRequirements && !hasResponsibilities) {
          missingSections.push('requirements or responsibilities');
        }
        if (!hasExperience && descriptionLength < 1000) {
          missingSections.push('experience requirements');
        }
        
        if (missingSections.length > 0 && descriptionLength < 1000) {
          console.warn(`Job description may be missing key sections: ${missingSections.join(', ')}`);
          toast.warning(`The extracted description may be missing some sections (${missingSections.join(', ')}). Please review the original page and add missing information manually if needed.`);
        }
        
        // Log pour vérification
        console.log(`Extracted job description length: ${descriptionLength} characters`);
        if (descriptionLength > 2000) {
          console.log('✓ Long description extracted - likely complete');
        }
        
        // Mettre à jour le formulaire avec les données extraites
        const extractedJobTitle = extractedData.position?.trim() || '';
        const extractedCompany = extractedData.companyName?.trim() || '';
        const extractedDescription = (extractedData.jobDescription || '').trim();
        
        console.log('📥 Extracted data:', {
          jobTitle: extractedJobTitle,
          company: extractedCompany,
          descriptionLength: extractedDescription.length
        });
        
        if (!extractedJobTitle || !extractedCompany) {
          throw new Error('Failed to extract job title or company name. Please try again or enter manually.');
        }
        
        setFormData({
          ...formData,
          jobTitle: extractedJobTitle,
          company: extractedCompany,
          jobDescription: extractedDescription,
        });
        
        console.log('✅ FormData updated:', {
          jobTitle: extractedJobTitle,
          company: extractedCompany,
          descriptionLength: extractedDescription.length
        });
        
        // Message de succès avec information sur la longueur
        const descLength = extractedDescription.length;
        if (descLength > 500) {
          toast.success(`Job information extracted successfully! (${descLength} characters)`);
        } else {
          toast.success('Job information extracted successfully!');
        }
      } catch (parseError: any) {
        console.error('Error parsing extracted data:', parseError);
        toast.error(`Failed to parse extracted information: ${parseError.message || 'Unknown error'}. Please try again or enter the information manually.`);
        throw parseError;
      }
    } catch (error: any) {
      console.error('Error extracting job info:', error);
      toast.error(`Failed to extract job information: ${error.message || 'Unknown error'}. Please try again or enter the information manually.`);
    } finally {
      setIsExtractingJob(false);
    }
  };

  // Modifier la fonction handleAnalysis pour fermer le modal avant d'activer le chargement
  const handleAnalysis = async () => {
    try {
      // Force disable validation to ensure we use the real API
      setValidationOptions({
        disableValidation: true,
        logLevel: 2
      });
      
      console.log("🚀 STARTING ANALYSIS - Using GPT-4o Vision for PDF analysis");
      
      // Fermer le modal avant d'afficher l'écran de chargement
      setIsModalOpen(false);
      
      // Petit délai pour permettre à l'animation de fermeture du modal de se terminer
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Maintenant activer l'écran de chargement
      setIsLoading(true);
      setLoadingStep('preparing');
      setLoadingProgress(0);
      
      if (!cvFile && !selectedCV) {
        toast.error('Please select a resume');
        setIsLoading(false);
        return;
      }

      // Use PDF file for GPT-4o Vision analysis
      if (cvFile && cvFile.type === 'application/pdf') {
        console.log('📄 Using GPT-4o Vision for PDF analysis:', cvFile.name);
        
        try {
          // Step 1: Convert PDF to images
          console.log('📸 Converting PDF to images...');
          setLoadingStep('preparing');
          setLoadingProgress(10);
          
          // Convert PDF to images (max 2 pages, optimized scale)
          const images = await pdfToImages(cvFile, 2, 1.5);
          console.log(`✅ PDF converted to ${images.length} image(s)`);
          
          setLoadingProgress(30);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Prepare job details - use actual formData values, not defaults
          const jobTitle = formData.jobTitle?.trim() || '';
          const company = formData.company?.trim() || '';
          const jobDescription = formData.jobDescription?.trim() || '';
          
          console.log('🔍 Current formData before analysis:', {
            jobTitle,
            company,
            jobDescriptionLength: jobDescription.length,
            formDataKeys: Object.keys(formData),
            fullFormData: formData
          });
          
          if (!jobTitle || !company || jobTitle === 'Untitled Position' || company === 'Unknown Company') {
            toast.error('Job title and company are required. Please extract or enter them first.');
            console.error('❌ Missing job information:', { jobTitle, company });
            setIsLoading(false);
            return;
          }
          
          const jobDetails = {
            jobTitle,
            company,
            jobDescription: jobDescription || 'Not provided'
          };
          
          console.log('📋 Job details for analysis:', { jobTitle, company, descriptionLength: jobDescription.length });
          
          // Generate job summary in parallel with analysis
          setLoadingStep('analyzing');
          setLoadingProgress(40);
          
          const [analysis, jobSummary] = await Promise.all([
            analyzeCVWithGPT4Vision(images, jobDetails),
            generateJobSummary(jobTitle, company, jobDescription)
          ]);
          
          console.log('✅ GPT-4o Vision analysis successful!', analysis);
          console.log('✅ Job summary generated:', jobSummary ? `Yes (${jobSummary.length} chars)` : 'No');
          if (jobSummary) {
            console.log('📄 Job summary preview:', jobSummary.substring(0, 200));
          }
          
          // Update loading step
          setLoadingStep('matching');
          setLoadingProgress(80);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Create analysis object with actual values
          const fullAnalysis = {
            ...analysis,
            id: `analysis_${Date.now()}`,
            date: formatDateString(analysis.date),
            userId: auth.currentUser?.uid || 'anonymous',
            jobTitle: jobTitle, // Use actual value, not from jobDetails
            company: company, // Use actual value, not from jobDetails
            jobSummary: jobSummary || undefined
          };
          
          console.log('💾 Saving analysis with:', { 
            jobTitle: fullAnalysis.jobTitle, 
            company: fullAnalysis.company, 
            hasJobSummary: !!fullAnalysis.jobSummary,
            jobSummaryLength: fullAnalysis.jobSummary?.length || 0
          });
          
          // Verify the data before saving
          if (!fullAnalysis.jobTitle || fullAnalysis.jobTitle === 'Untitled Position') {
            console.error('⚠️ WARNING: jobTitle is missing or default value!');
          }
          if (!fullAnalysis.company || fullAnalysis.company === 'Unknown Company') {
            console.error('⚠️ WARNING: company is missing or default value!');
          }
          if (!fullAnalysis.jobSummary) {
            console.warn('⚠️ WARNING: jobSummary is missing!');
          }
          
          // Update loading step
          setLoadingStep('finalizing');
          setLoadingProgress(90);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Save and update UI
          const savedAnalysis = await saveAnalysisToFirestore(fullAnalysis);
          setAnalyses(prev => [savedAnalysis, ...prev]);
          setCurrentStep(1);
          setCvFile(null);
          setSelectedCV('');
          setLoadingProgress(100);
          
          // Short delay before hiding loading screen for a smooth transition
          await new Promise(resolve => setTimeout(resolve, 500));
          setIsLoading(false);
          
          toast.dismiss();
          toast.success('CV analysis with GPT-4o Vision completed!');
        } catch (error: any) {
          console.error('❌ GPT-4o Vision API call failed:', error);
          setIsLoading(false);
          toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
          throw error;
        }
      } else {
        toast.error('Please upload a PDF file for analysis');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.dismiss();
      toast.error(`Analysis failed: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleAnalysis();
    }
  };

  // Filter and sort analyses
  const filteredAndSortedAnalyses = () => {
    let filtered = [...analyses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.jobTitle.toLowerCase().includes(query) ||
          a.company.toLowerCase().includes(query) ||
          a.date.toLowerCase().includes(query)
      );
    }

    // Score filter
    if (filterScore !== 'all') {
      filtered = filtered.filter((a) => {
        if (filterScore === 'high') return a.matchScore >= 80;
        if (filterScore === 'medium') return a.matchScore >= 65 && a.matchScore < 80;
        if (filterScore === 'low') return a.matchScore < 65;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'score') {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'company') {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

    return filtered;
  };

  // Calculate statistics
  const stats = {
    total: analyses.length,
    averageScore: analyses.length > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.matchScore, 0) / analyses.length)
      : 0,
    highMatch: analyses.filter((a) => a.matchScore >= 80).length,
    mediumMatch: analyses.filter((a) => a.matchScore >= 65 && a.matchScore < 80).length,
    lowMatch: analyses.filter((a) => a.matchScore < 65).length,
  };

  // Supprimer une analyse
  const deleteAnalysis = async (analysisId: string) => {
    if (!currentUser) return;
    
    // Si c'est une analyse locale, la supprimer uniquement de l'état local
    if (analysisId.startsWith('local_')) {
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      toast.success('Analysis deleted');
      return;
    }
    
    try {
      console.log('Tentative de suppression de l\'analyse:', analysisId);
      // Supprimer de Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid, 'analyses', analysisId));
      
      // Mettre à jour l'UI
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      toast.success('Analysis deleted');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      
      // Vérifier si c'est une erreur de permission
      if (error instanceof Error && error.toString().includes('permission')) {
        console.warn('Permission error detected. You need to update Firestore security rules.');
        toast.error('Permission error during delete. Please check Firestore security rules.');
      } else {
        toast.error('Unable to delete analysis');
      }
    }
  };

  // Dupliquer une analyse
  const duplicateAnalysis = async (analysis: ATSAnalysis) => {
    try {
      const copy: ATSAnalysis = {
        ...analysis,
        id: `local_${Date.now()}`,
        jobTitle: `${analysis.jobTitle} (Copy)`,
        date: formatDateString(new Date().toISOString().split('T')[0]),
      };
      const saved = await saveAnalysisToFirestore(copy);
      setAnalyses(prev => [saved, ...prev]);
      toast.success('Analysis duplicated');
    } catch (e) {
      console.error('Error duplicating analysis:', e);
      toast.error('Unable to duplicate analysis');
    }
  };

  // Helpers: logo from company name (best-effort) with placeholder fallback
  const getDomainFromCompanyName = (name?: string | null) => {
    if (!name) return null;
    try {
      const slug = name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!slug) return null;
      return `${slug}.com`;
    } catch {
      return null;
    }
  };

  const getCompanyLogoUrl = (company?: string | null) => {
    const placeholder = '/images/logo-placeholder.svg';
    const domain = getDomainFromCompanyName(company || '');
    if (domain) {
      return `https://logo.clearbit.com/${domain}`;
    }
    return placeholder;
  };

  const AnalysisCard = ({ 
    analysis, 
    onDelete, 
    viewMode = 'list',
    onSelect
  }: { 
    analysis: ATSAnalysis, 
    onDelete: (id: string) => void,
    viewMode?: 'grid' | 'list',
    onSelect?: () => void
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    
    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        setExpandedSection(null);
      }
    };
    
    const toggleSection = (section: string) => {
      if (expandedSection === section) {
        setExpandedSection(null);
      } else {
        setExpandedSection(section);
      }
    };

    const confirmDelete = () => {
      onDelete(analysis.id);
      setIsDeleteDialogOpen(false);
    };
    
    // Formater la date en format simple (fonction helper)
    const formatDate = (dateString: string): string => {
      return formatDateString(dateString);
    };

    const isGrid = viewMode === 'grid';
    
    return (
      <motion.div
        key={analysis.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="relative group rounded-xl p-5 border shadow-sm bg-white dark:bg-[#1E1F22] dark:border-[#2A2A2E] dark:text-gray-100 dark:shadow-none hover:shadow-md transition-all cursor-pointer dark:hover:bg-[#26262B]"
        onClick={() => {
          if (onSelect) {
            onSelect();
          } else {
            toggleExpand();
          }
        }}
      >
        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center items-start gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-[#2A2A2E] bg-gray-50 dark:bg-[#26262B] flex items-center justify-center">
              <img
                src={getCompanyLogoUrl(analysis.company)}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/logo-placeholder.svg'; }}
                alt={`${analysis.company} logo`}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                {analysis.jobTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="truncate">{analysis.company}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatDateString(analysis.date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border dark:border-[#2A2A2E] ${
                analysis.matchScore >= 80 
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-[#26262B] dark:text-green-400 dark:border-[#2A2A2E]'
                  : analysis.matchScore >= 65
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-[#26262B] dark:text-blue-400 dark:border-[#2A2A2E]'
                  : 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-[#26262B] dark:text-pink-400 dark:border-[#2A2A2E]'
              }`}>
                {analysis.matchScore}% match
              </span>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(!isActionMenuOpen); }}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#26262B] transition-opacity opacity-0 group-hover:opacity-100"
                  aria-label="Card actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {isActionMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 dark:border-[#2A2A2E] bg-white dark:bg-[#1E1F22] shadow-lg z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setIsActionMenuOpen(false); onSelect && onSelect(); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#26262B]"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => { setIsActionMenuOpen(false); duplicateAnalysis(analysis); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#26262B] flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Duplicate analysis
                    </button>
                    <button
                      onClick={() => { setIsActionMenuOpen(false); setIsDeleteDialogOpen(true); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#26262B] flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Skills preview (compact pills) */}
          {!isExpanded && analysis.skillsMatch.matching.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.skillsMatch.matching
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, 5)
                .map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-[#26262B] dark:text-gray-300"
                  >
                    {skill.name}
                  </span>
                ))}
              {analysis.skillsMatch.matching.length > 5 && (
                <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-[#26262B] dark:text-gray-400">
                  +{analysis.skillsMatch.matching.length - 5}
                </span>
              )}
            </div>
          )}
          
          {/* Divider and footer */}
          <div className="h-px bg-gray-200 dark:bg-[#2A2A2E] my-3"></div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{formatDateString(analysis.date)}</span>
            </div>
            <div className="text-xs">
              {analysis.skillsMatch.matching.length} matched skill{analysis.skillsMatch.matching.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Score Explanation Card */}
            <div className="mb-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-500" />
                    Match Score Explained
                  </h3>
                  <div className={`text-2xl font-bold ${getScoreColorClass(analysis.matchScore)}`}>
                    {analysis.matchScore}%
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {analysis.matchScore >= 80 ? 
                    "Your resume is very well aligned with this position! You appear to be a strong candidate based on the requirements." :
                    analysis.matchScore >= 65 ?
                    "Your resume meets many of the key requirements, but there are some areas that could be improved." :
                    "Your resume needs significant adjustments to better align with this position's requirements."
                  }
                </p>
                
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysis.matchScore >= 80 ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 
                      analysis.matchScore >= 65 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                      'bg-gradient-to-r from-pink-500 to-rose-500'
                    }`}
                    style={{ width: `${analysis.matchScore}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 text-xs text-center gap-2">
                  <div className="text-pink-600 dark:text-pink-400">
                    <div className="font-medium">Low Match</div>
                    <div className="text-gray-500 dark:text-gray-400">30-65%</div>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400">
                    <div className="font-medium">Medium Match</div>
                    <div className="text-gray-500 dark:text-gray-400">66-79%</div>
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">
                    <div className="font-medium">Strong Match</div>
                    <div className="text-gray-500 dark:text-gray-400">80-95%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 mb-5">
              {Object.entries(analysis.categoryScores).map(([category, score], idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 flex flex-col items-center justify-center">
                  <div className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColorClass(score)}`}>
                    {Math.round(score)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable sections */}
            <div className="space-y-3">
              {/* Executive Summary */}
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('summary')}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-500" />
                    <span className="font-medium">Executive Summary</span>
                  </div>
                  {expandedSection === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'summary' && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <p className="text-gray-700 dark:text-gray-300">{analysis.executiveSummary}</p>
                  </div>
                )}
              </div>

              {/* Skills Match */}
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('skills')}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    <span className="font-medium">Matching Skills</span>
                  </div>
                  {expandedSection === 'skills' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'skills' && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {analysis.skillsMatch.matching.map((skill, idx) => (
                        <SkillTag 
                          key={idx} 
                          skill={skill.name} 
                          matched={true} 
                          relevance={skill.relevance} 
                        />
                      ))}
                    </div>
                    
                    {analysis.skillsMatch.missing.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.skillsMatch.missing.map((skill, idx) => (
                            <SkillTag 
                              key={idx} 
                              skill={skill.name} 
                              matched={false} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Experience Analysis */}
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('experience')}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="font-medium">Experience Analysis</span>
                  </div>
                  {expandedSection === 'experience' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'experience' && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="space-y-4">
                      {analysis.experienceAnalysis.map((item, idx) => (
                        <div key={idx} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">{item.aspect}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Critical Requirements Analysis - NEW SECTION */}
              {analysis.criticalRequirementsAnalysis && (
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('criticalRequirements')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 transition-colors"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                      <span className="font-medium">Critical Requirements Analysis</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
                        {analysis.criticalRequirementsAnalysis.summary.criticalMet}/{analysis.criticalRequirementsAnalysis.summary.criticalTotal} Critical Met
                      </span>
                    </div>
                    {expandedSection === 'criticalRequirements' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'criticalRequirements' && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Critical Must-Have</span>
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {analysis.criticalRequirementsAnalysis.summary.criticalMet}/{analysis.criticalRequirementsAnalysis.summary.criticalTotal}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {analysis.criticalRequirementsAnalysis.summary.criticalTotal > 0 
                              ? Math.round((analysis.criticalRequirementsAnalysis.summary.criticalMet / analysis.criticalRequirementsAnalysis.summary.criticalTotal) * 100) 
                              : 100}% Met
                          </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Highly Important</span>
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {analysis.criticalRequirementsAnalysis.summary.highlyImportantMet}/{analysis.criticalRequirementsAnalysis.summary.highlyImportantTotal}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {analysis.criticalRequirementsAnalysis.summary.highlyImportantTotal > 0 
                              ? Math.round((analysis.criticalRequirementsAnalysis.summary.highlyImportantMet / analysis.criticalRequirementsAnalysis.summary.highlyImportantTotal) * 100) 
                              : 100}% Met
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Nice-to-Have</span>
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analysis.criticalRequirementsAnalysis.summary.niceToHaveMet}/{analysis.criticalRequirementsAnalysis.summary.niceToHaveTotal}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {analysis.criticalRequirementsAnalysis.summary.niceToHaveTotal > 0 
                              ? Math.round((analysis.criticalRequirementsAnalysis.summary.niceToHaveMet / analysis.criticalRequirementsAnalysis.summary.niceToHaveTotal) * 100) 
                              : 100}% Met
                          </div>
                        </div>
                      </div>

                      {/* Critical Must-Have Requirements */}
                      {analysis.criticalRequirementsAnalysis.criticalMustHave.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                            Critical Must-Have Requirements (Deal-Breakers)
                          </h4>
                          <div className="space-y-3">
                            {analysis.criticalRequirementsAnalysis.criticalMustHave.map((req, idx) => (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-lg border-2 ${
                                  req.found 
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800' 
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {req.found ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                      ) : (
                                        <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                      )}
                                      <span className="font-semibold text-gray-900 dark:text-white">{req.requirement}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        req.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                        req.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        req.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                        req.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                      }`}>
                                        {req.category}
                                      </span>
                                      {!req.found && (
                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                          -{req.scorePenalty} points
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {req.found && req.location && (
                                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                                    ✓ Found in: {req.location}
                                  </p>
                                )}
                                {!req.found && (
                                  <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-medium">
                                    ⚠ Missing - This is a DEAL-BREAKER. Your application will likely be rejected without this.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Highly Important Requirements */}
                      {analysis.criticalRequirementsAnalysis.highlyImportant.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                            Highly Important Requirements
                          </h4>
                          <div className="space-y-2">
                            {analysis.criticalRequirementsAnalysis.highlyImportant.map((req, idx) => (
                              <div 
                                key={idx} 
                                className={`p-3 rounded-lg border ${
                                  req.found 
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                    : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {req.found ? (
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <X className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white">{req.requirement}</span>
                                  </div>
                                  {!req.found && (
                                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                      -{req.scorePenalty} pts
                                    </span>
                                  )}
                                </div>
                                {req.found && req.location && (
                                  <p className="text-xs text-green-700 dark:text-green-400 mt-1 ml-6">
                                    Found in: {req.location}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nice-to-Have Requirements */}
                      {analysis.criticalRequirementsAnalysis.niceToHave.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                            Nice-to-Have Requirements (Secondary)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {analysis.criticalRequirementsAnalysis.niceToHave.map((req, idx) => (
                              <div 
                                key={idx} 
                                className={`p-2 rounded-lg border text-sm ${
                                  req.found 
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {req.found ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 flex-shrink-0">•</span>
                                  )}
                                  <span className="text-gray-700 dark:text-gray-300">{req.requirement}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gap Analysis - NEW SECTION */}
              {analysis.gapAnalysis && (
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('gapAnalysis')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 transition-colors"
                  >
                    <div className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                      <span className="font-medium">Gap Analysis - What's Missing & Why It Matters</span>
                      {analysis.gapAnalysis.overallImpact.criticalGapsCount > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
                          {analysis.gapAnalysis.overallImpact.criticalGapsCount} Critical Gaps
                        </span>
                      )}
                    </div>
                    {expandedSection === 'gapAnalysis' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'gapAnalysis' && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      {/* Overall Impact Summary */}
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Overall Impact Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Score Penalty</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              -{analysis.gapAnalysis.overallImpact.totalScorePenalty}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Critical Gaps</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {analysis.gapAnalysis.overallImpact.criticalGapsCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Important Gaps</div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {analysis.gapAnalysis.overallImpact.importantGapsCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Interview Probability</div>
                            <div className={`text-2xl font-bold ${getScoreColorClass(analysis.gapAnalysis.overallImpact.estimatedInterviewProbability)}`}>
                              {analysis.gapAnalysis.overallImpact.estimatedInterviewProbability}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Critical Gaps */}
                      {analysis.gapAnalysis.criticalGaps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Critical Gaps (Deal-Breakers) - {analysis.gapAnalysis.criticalGaps.length} Missing
                          </h4>
                          <div className="space-y-4">
                            {analysis.gapAnalysis.criticalGaps.map((gap, idx) => (
                              <div 
                                key={idx} 
                                className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border-2 border-red-300 dark:border-red-800"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                      <span className="font-semibold text-gray-900 dark:text-white text-lg">{gap.requirement}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        gap.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                        gap.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        gap.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                        gap.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                      }`}>
                                        {gap.category}
                                      </span>
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                        -{gap.scoreImpact} points | CRITICAL
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-red-200 dark:border-red-800">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Why This Matters:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{gap.impact}</p>
                                </div>
                                {gap.alternatives && gap.alternatives.length > 0 && (
                                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Alternative Skills/Experience You Have:</p>
                                    <ul className="list-disc list-inside text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                      {gap.alternatives.map((alt, altIdx) => (
                                        <li key={altIdx}>{alt}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2 uppercase tracking-wide">Action Plan:</p>
                                  <ul className="space-y-2">
                                    {gap.recommendations.map((rec, recIdx) => (
                                      <li key={recIdx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">→</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Important Gaps */}
                      {analysis.gapAnalysis.importantGaps.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Important Gaps - {analysis.gapAnalysis.importantGaps.length} Missing
                          </h4>
                          <div className="space-y-3">
                            {analysis.gapAnalysis.importantGaps.map((gap, idx) => (
                              <div 
                                key={idx} 
                                className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <X className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                      <span className="font-semibold text-gray-900 dark:text-white">{gap.requirement}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        gap.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                        gap.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        gap.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                        gap.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                      }`}>
                                        {gap.category}
                                      </span>
                                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                        -{gap.scoreImpact} points | {gap.priority.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 mb-2 border border-orange-200 dark:border-orange-800">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{gap.impact}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-2 border border-yellow-200 dark:border-yellow-800">
                                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Recommendations:</p>
                                  <ul className="space-y-1">
                                    {gap.recommendations.map((rec, recIdx) => (
                                      <li key={recIdx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">→</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    <span className="font-medium">Recommendations</span>
                  </div>
                  {expandedSection === 'recommendations' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'recommendations' && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              rec.priority === 'high' 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                                : rec.priority === 'medium'
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                          {rec.examples && (
                            <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-700/30 p-2 rounded-md text-gray-700 dark:text-gray-300">
                              <span className="font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Example</span>
                              {rec.examples}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* ATS Optimization Section */}
              {analysis.atsOptimization && (
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('atsOptimization')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <SearchCheck className="w-5 h-5 mr-2 text-purple-500" />
                      <span className="font-medium">ATS Optimization</span>
                      {analysis.atsOptimization.score && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getScoreColorClass(analysis.atsOptimization.score)}`}>
                          {analysis.atsOptimization.score}%
                        </span>
                      )}
                    </div>
                    {expandedSection === 'atsOptimization' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'atsOptimization' && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Formatting</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.atsOptimization.formatting}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Keyword Optimization</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.atsOptimization.keywordOptimization}</p>
                        </div>
                        
                        {/* Keyword Density Analysis */}
                        {analysis.atsOptimization.keywordDensity && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <Target className="w-4 h-4 mr-2 text-purple-500" />
                              Keyword Density Analysis
                            </h4>
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Density</span>
                                <span className={`text-sm font-semibold ${getScoreColorClass(analysis.atsOptimization.keywordDensity.overallDensity)}`}>
                                  {analysis.atsOptimization.keywordDensity.overallDensity}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    analysis.atsOptimization.keywordDensity.overallDensity >= 80 
                                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                      : analysis.atsOptimization.keywordDensity.overallDensity >= 60
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                      : 'bg-gradient-to-r from-pink-500 to-rose-500'
                                  }`}
                                  style={{ width: `${analysis.atsOptimization.keywordDensity.overallDensity}%` }}
                                />
                              </div>
                            </div>
                            {analysis.atsOptimization.keywordDensity.criticalKeywords.length > 0 && (
                              <div className="space-y-2 mb-3">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Critical Keywords</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {analysis.atsOptimization.keywordDensity.criticalKeywords.slice(0, 10).map((kw, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                      <div className="flex items-center">
                                        {kw.found ? (
                                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                        ) : (
                                          <X className="w-4 h-4 text-red-500 mr-2" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{kw.keyword}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {kw.found && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {kw.frequency}/{kw.optimalFrequency}
                                          </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          kw.found 
                                            ? kw.frequency >= kw.optimalFrequency 
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                          {kw.found ? (kw.frequency >= kw.optimalFrequency ? 'Optimal' : 'Low') : 'Missing'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {analysis.atsOptimization.keywordDensity.recommendations.length > 0 && (
                          <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recommendations</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {analysis.atsOptimization.keywordDensity.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Section Completeness */}
                        {analysis.atsOptimization.sectionCompleteness && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                              Section Completeness
                            </h4>
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Score</span>
                                <span className={`text-sm font-semibold ${getScoreColorClass(analysis.atsOptimization.sectionCompleteness.overallScore)}`}>
                                  {analysis.atsOptimization.sectionCompleteness.overallScore}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {analysis.atsOptimization.sectionCompleteness.sections.map((section, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                  <div className="flex items-center">
                                    {section.present ? (
                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    ) : (
                                      <X className="w-4 h-4 text-red-500 mr-2" />
                                    )}
                                    <span className="text-sm text-gray-900 dark:text-white">{section.name}</span>
                                  </div>
                                  {section.present && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreColorClass(section.quality)}`}>
                                      {section.quality}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Readability */}
                        {analysis.atsOptimization.readability && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <Eye className="w-4 h-4 mr-2 text-blue-500" />
                              Readability Score
                            </h4>
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                                <span className={`text-sm font-semibold ${getScoreColorClass(analysis.atsOptimization.readability.score)}`}>
                                  {analysis.atsOptimization.readability.score}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    analysis.atsOptimization.readability.score >= 80 
                                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                      : analysis.atsOptimization.readability.score >= 60
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                      : 'bg-gradient-to-r from-pink-500 to-rose-500'
                                  }`}
                                  style={{ width: `${analysis.atsOptimization.readability.score}%` }}
                                />
                              </div>
                            </div>
                            {analysis.atsOptimization.readability.issues.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Issues</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {analysis.atsOptimization.readability.issues.map((issue, idx) => (
                                    <li key={idx}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.atsOptimization.readability.recommendations.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recommendations</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {analysis.atsOptimization.readability.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {analysis.atsOptimization.improvements.length > 0 && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Recommended Improvements</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {analysis.atsOptimization.improvements.map((improvement, idx) => (
                                <li key={idx}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Market Positioning Section */}
              {analysis.marketPositioning && (
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('marketPositioning')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <LineChart className="w-5 h-5 mr-2 text-indigo-500" />
                      <span className="font-medium">Competitive Analysis</span>
                    </div>
                    {expandedSection === 'marketPositioning' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'marketPositioning' && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1.5 text-green-500" /> 
                            Your Competitive Advantages
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {analysis.marketPositioning.competitiveAdvantages.map((advantage, idx) => (
                              <li key={idx} className="text-sm">{advantage}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center">
                            <TrendingDown className="w-4 h-4 mr-1.5 text-orange-500" />
                            Areas for Improvement
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {analysis.marketPositioning.competitiveDisadvantages.map((disadvantage, idx) => (
                              <li key={idx} className="text-sm">{disadvantage}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center">
                          <Activity className="w-4 h-4 mr-1.5 text-blue-500" />
                          Industry Trends Alignment
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {analysis.marketPositioning.industryTrends}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Application Strategy Section */}
              {analysis.applicationStrategy && (
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('applicationStrategy')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-teal-500" />
                      <span className="font-medium">Application Strategy</span>
                    </div>
                    {expandedSection === 'applicationStrategy' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'applicationStrategy' && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                            <FileText className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                            Cover Letter Focus
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {analysis.applicationStrategy.coverLetterFocus}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                            <UserRound className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                            Interview Preparation
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {analysis.applicationStrategy.interviewPreparation}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                            <Palette className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                            Portfolio Suggestions
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {analysis.applicationStrategy.portfolioSuggestions}
                          </p>
                        </div>
                        {analysis.applicationStrategy.networkingTips && analysis.applicationStrategy.networkingTips.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                              <UserRound className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                              Networking Tips
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {analysis.applicationStrategy.networkingTips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                      </div>
                        )}
                        {analysis.applicationStrategy.followUpStrategy && (
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                              <Activity className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                              Follow-Up Strategy
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.applicationStrategy.followUpStrategy}
                            </p>
                    </div>
                  )}
                      </div>
                </div>
              )}
            </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {isDeleteDialogOpen && (
            <Dialog
              open={isDeleteDialogOpen}
              onClose={() => setIsDeleteDialogOpen(false)}
              className="fixed inset-0 z-[60] overflow-y-auto"
            >
              <div className="flex items-center justify-center min-h-screen px-4">
                <Dialog.Overlay 
                  as={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-5 mx-auto"
                >
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 mb-4">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete this analysis?</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      This action is irreversible. Are you sure you want to delete this analysis for the position "{analysis.jobTitle}"?
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* User Guidance Section - shows when analysis is expanded */}
        {isExpanded && (
          <div className="px-5 pt-1 pb-5">
            <details className="bg-purple-50 dark:bg-purple-900/10 rounded-xl overflow-hidden text-sm border border-purple-100 dark:border-purple-800/20">
              <summary className="cursor-pointer p-3 font-medium text-purple-700 dark:text-purple-300 flex items-center">
                <InformationCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>How to use this analysis</span>
              </summary>
              <div className="p-3 pt-0 text-gray-600 dark:text-gray-400 space-y-3 text-sm">
                <div className="border-t border-purple-100 dark:border-purple-800/20 pt-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Understanding Your Results</h4>
                  <p>
                    This AI-powered analysis compares your resume to the job description and industry standards, providing scores and recommendations to improve your application.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">Match Score</h5>
                    <p className="text-xs">Indicates your overall alignment with the job requirements. A score above 75% is considered strong.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">Skills Match</h5>
                    <p className="text-xs">Shows which skills from the job you have and which are missing. Focus on adding missing high-relevance skills.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">ATS Optimization</h5>
                    <p className="text-xs">Evaluates how well your resume will perform in Applicant Tracking Systems. Implement formatting suggestions for better results.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">Competitive Analysis</h5>
                    <p className="text-xs">Shows how you compare to typical candidates for this role. Highlight your advantages in your application.</p>
                  </div>
                </div>
                
                <div className="border-t border-purple-100 dark:border-purple-800/20 pt-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Action Steps</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Review high-priority recommendations first</li>
                    <li>Update your resume with missing skills you actually possess</li>
                    <li>Implement formatting improvements for better ATS compatibility</li>
                    <li>Use the Application Strategy section to prepare your complete application package</li>
                    <li>After making changes, run a new analysis to see your improved score</li>
                  </ol>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-lg text-xs italic">
                  Note: This analysis is powered by AI and should be used as a helpful guide, not as a definitive assessment of your qualifications.
                </div>
              </div>
            </details>
          </div>
        )}
      </motion.div>
    );
  };

  // Ajouter un composant pour le contrôle de validation
  const ValidationToggle = () => (
    <div className="flex items-center text-sm text-gray-500 mt-4 mb-2">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="validation-toggle"
          checked={validationEnabled}
          onChange={toggleValidation}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="validation-toggle" className="ml-2 text-gray-700 dark:text-gray-300">
          Enable content validation
        </label>
      </div>
      <button
        type="button"
        className="ml-2 inline-flex items-center text-xs text-gray-500 hover:text-indigo-600"
        onClick={() => toast.info(
          "Content validation helps ensure that you've uploaded a proper CV and job description. " +
          "If you're having issues with legitimate files being rejected, you can temporarily disable validation.", 
          { duration: 8000 }
        )}
      >
        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.75.75 0 00.736-.736v-3.08a.75.75 0 00-.75-.75h-.5a.75.75 0 000 1.5h.237v2.566z" clipRule="evenodd" />
        </svg>
        Info
      </button>
    </div>
  );

  const renderFileUpload = () => (
    <div className="mt-4">
      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
        Upload your resume
      </label>
      
      {/* Ajout du contrôle de validation */}
      <ValidationToggle />
      
      <div 
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Utiliser l'input file global
          const input = document.getElementById("global-file-input") as HTMLInputElement;
          if (input) input.click();
        }}
      >
        {cvFile ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{cvFile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(cvFile.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Resume selected successfully
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Upload your resume (PDF)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click to browse or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Accepted format: PDF only
            </p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setCvFile(e.target.files[0]);
            }
          }}
          className="hidden"
          accept=".pdf"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Your resume will be analyzed to determine its match with the job posting
      </p>
    </div>
  );

  // Components for enhanced analysis interface
  const CircularProgressWithCenterText = ({ value, size = 64, strokeWidth = 6, textSize = "text-lg", colorClass = "text-purple-600" }: { value: number, size?: number, strokeWidth?: number, textSize?: string, colorClass?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (100 - value) / 100 * circumference;
    
    const getGradientColors = () => {
      // Modern gradient colors - more sophisticated and cohesive
      if (value >= 80) return { 
        start: '#8B5CF6',   // Purple-500
        end: '#6366F1',    // Indigo-500
        mid: '#7C3AED'     // Purple-600
      };
      if (value >= 65) return { 
        start: '#3B82F6',  // Blue-500
        end: '#06B6D4',    // Cyan-500
        mid: '#2563EB'     // Blue-600
      };
      return { 
        start: '#EC4899',  // Pink-500
        end: '#F43F5E',    // Rose-500
        mid: '#DB2777'     // Pink-600
      };
    };
    
    const { start, end, mid } = getGradientColors();
    
    return (
      <div className="relative inline-flex">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Circle - softer and more subtle */}
          <defs>
            <linearGradient id={`bgGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(243, 244, 246, 0.4)" />
              <stop offset="100%" stopColor="rgba(229, 231, 235, 0.6)" />
            </linearGradient>
          </defs>
          
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius}
            strokeWidth={strokeWidth}
            stroke={`url(#bgGradient-${value})`}
            fill="transparent"
            className="dark:opacity-10"
          />
          
          {/* Progress Circle with Modern Gradient */}
          <defs>
            <linearGradient id={`circleGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={start} />
              <stop offset="50%" stopColor={mid} />
              <stop offset="100%" stopColor={end} />
            </linearGradient>
            <filter id={`glow-${value}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius}
            strokeWidth={strokeWidth}
            stroke={`url(#circleGradient-${value})`}
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{ filter: value >= 80 ? `url(#glow-${value})` : 'none' }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${textSize} font-semibold ${colorClass}`}>
          <span className="animate-fadeIn">{value}%</span>
        </div>
      </div>
    );
  };

  const ScoreCard = ({ title, score, icon, description }: { title: string, score: number, icon: React.ReactNode, description: string }) => {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        title={description}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50/20 to-gray-100/20 dark:from-gray-700/20 dark:to-gray-600/20 rounded-full -mr-10 -mt-10 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <div className={`p-2.5 rounded-lg ${getScoreColorClass(score).replace('text-', 'bg-').replace('600', '100').replace('400', '900/30')}`}>
            {icon}
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">{title}</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold" style={{ color: `var(--${getScoreColorClass(score).replace('text-', '')})` }}>
                {score}
              </span>
              <span className="text-sm ml-0.5 opacity-80" style={{ color: `var(--${getScoreColorClass(score).replace('text-', '')})` }}>%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100/80 dark:border-gray-700/80 text-xs text-gray-500 dark:text-gray-400 max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300">
          {description}
        </div>
      </div>
    );
  };

  const SkillTag = ({ skill, matched, relevance }: { skill: string; matched: boolean; relevance?: number }) => (
    <div 
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200 backdrop-blur-sm ${
        matched 
          ? "bg-green-50/60 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-800/30 hover:bg-green-100/80 dark:hover:bg-green-900/30"
          : "bg-red-50/60 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/30 hover:bg-red-100/80 dark:hover:bg-red-900/30"
      }`}
    >
      {matched ? (
        <Check className="w-3 h-3 mr-1.5 text-green-600 dark:text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 mr-1.5 text-red-600 dark:text-red-500 flex-shrink-0" />
      )}
      <span className="truncate max-w-[120px]">{skill}</span>
      {matched && relevance && (
        <span className="ml-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
          {Math.round(relevance)}%
        </span>
      )}
    </div>
  );

  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h4>
  );

  const getScoreColorClass = (score: number): string => {
    // Modern, cohesive color scheme matching the gradient circles
    if (score >= 80) return "text-purple-600 dark:text-purple-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    return "text-pink-600 dark:text-pink-400";
  };

  const generateExecutiveSummary = (matchScore: number, keyFindings: any[]): string => {
    if (matchScore >= 80) {
      return "Excellent match! Your resume aligns very well with this job offer. Minor adjustments could further enhance your application.";
    } else if (matchScore >= 60) {
      return "Good match. Your resume aligns fairly well with this offer, but some improvements to key skills would significantly increase your score.";
    } else {
      return "Moderate match. Your resume needs adjustments to better align with this job offer. Follow our recommendations to improve your application.";
    }
  };

  // Ajouter la fonction de calcul de pertinence des compétences
  const calculateSkillRelevance = (skill: string, jobDesc: string, cvText: string): number => {
    const jobDescLower = jobDesc.toLowerCase();
    const cvTextLower = cvText ? cvText.toLowerCase() : "";
    const skillLower = skill.toLowerCase();
    
    // Base relevance from job description
    let relevance = 70; // Base relevance score
    
    // If the skill is mentioned multiple times in the job description, it's more relevant
    const jobOccurrences = (jobDescLower.match(new RegExp(`\\b${skillLower}\\b`, 'g')) || []).length;
    relevance += Math.min(jobOccurrences * 5, 20); // Up to 20% bonus for frequent mentions
    
    // Check if it appears in important sections (requirements, qualifications, etc.)
    const importantSections = ["required", "requirement", "qualification", "essential", "must have", "key skill"];
    const isInImportantSection = importantSections.some(section => {
      const sectionIndex = jobDescLower.indexOf(section);
      if (sectionIndex === -1) return false;
      
      // Check if the skill is mentioned within 200 characters of the important section
      const sectionContext = jobDescLower.substring(
        Math.max(0, sectionIndex - 100),
        Math.min(jobDescLower.length, sectionIndex + 300)
      );
      
      return sectionContext.includes(skillLower);
    });
    
    if (isInImportantSection) {
      relevance += 10; // Bonus for being in an important section
    }
    
    // If the skill is found in the CV text, calculate how prominently it's featured
    if (cvTextLower && cvTextLower.includes(skillLower)) {
      const cvOccurrences = (cvTextLower.match(new RegExp(`\\b${skillLower}\\b`, 'g')) || []).length;
      relevance += Math.min(cvOccurrences * 2, 15); // Up to 15% bonus for CV prominence
      
      // Check if the skill is mentioned in the first third of the CV (often more prominent)
      if (cvTextLower.substring(0, cvTextLower.length / 3).includes(skillLower)) {
        relevance += 5; // Bonus for early mention in CV
      }
    }
    
    // Add slight random variation for natural feel
    relevance += Math.round(Math.random() * 6) - 3; // -3 to +3 random adjustment
    
    // Ensure relevance is within reasonable bounds
    return Math.max(40, Math.min(98, Math.round(relevance)));
  };

  const getScoreExplanation = (title: string, score: number): string => {
    const roundedScore = Math.round(score);
    
    switch(title) {
      case "Skills":
        if (roundedScore >= 80) return "Your technical skills are a strong match for this position.";
        if (roundedScore >= 60) return "Your skills partially match the job requirements.";
        return "There's a significant gap between your skills and job requirements.";
      
      case "Experience":
        if (roundedScore >= 80) return "Your experience history is very relevant to this role.";
        if (roundedScore >= 60) return "Your experience is somewhat relevant but could be enhanced.";
        return "Your experience needs to be better aligned with this position's requirements.";
      
      case "Education":
        if (roundedScore >= 80) return "Your educational background exceeds or matches requirements.";
        if (roundedScore >= 60) return "Your education is relevant but may need highlighting.";
        return "Consider enhancing or highlighting educational qualifications.";
      
      case "Industry":
        if (roundedScore >= 80) return "You demonstrate strong industry knowledge.";
        if (roundedScore >= 60) return "You have moderate familiarity with this industry.";
        return "Strengthening industry-specific knowledge would be beneficial.";
      
      default:
        return "";
    }
  };

  // Fonction pour analyser directement un fichier PDF avec GPT Vision
  const directGptVisionAnalysis = async (pdfFile: File, jobDetails: { jobTitle: string; company: string; jobDescription: string }): Promise<ATSAnalysis | null> => {
    try {
      console.log('📄 Tentative d\'analyse directe du fichier PDF avec GPT Vision:', pdfFile.name);
      
      if (!pdfFile || pdfFile.type !== 'application/pdf') {
        console.log('❌ Le fichier fourni n\'est pas un PDF valide');
        return null;
      }
      
      const base64PDF = await fileToBase64(pdfFile);
      console.log('✅ PDF converti en base64 avec succès, taille:', Math.round(base64PDF.length / 1024), 'KB');
      
      // Log pour vérifier la clé API
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      console.log('🔑 Vérification de la clé API:', 
                apiKey ? 
                'Présente (commence par ' + apiKey.substring(0, 3) + '...)' : 
                'MANQUANTE');
      
      if (!apiKey) {
        console.error('❌ Clé API OpenAI manquante dans .env.local');
        toast.error('La clé API OpenAI est manquante. Veuillez configurer votre .env.local');
        return null;
      }
      
      // Appel direct à l'API Vision
      toast.loading('Analyse avancée du CV avec GPT Vision en cours...');
      
      const analysis = await callGptVisionApiDirect(base64PDF, jobDetails);
      console.log('✅ Analyse GPT Vision réussie!', analysis);
      
      return {
        ...analysis,
        id: `analysis_${Date.now()}`,
        date: formatDateString(analysis.date),
        userId: auth.currentUser?.uid || 'anonymous',
        jobTitle: jobDetails.jobTitle,
        company: jobDetails.company
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse directe avec GPT Vision:', error);
      toast.error('Erreur lors de l\'analyse avancée. Utilisation de l\'analyse standard.');
      return null;
    }
  };

  const steps = [
    {
      title: "Upload Resume",
      description: "Select or upload your resume for analysis",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4">
            <label
              ref={dropZoneRef}
              htmlFor="cv-upload-input-modal"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex items-center p-4 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200 ease-out
                backdrop-blur-sm
                group
                ${
                  isDragging
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : cvFile
                    ? 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-gray-200/60 dark:border-gray-700/50 hover:border-purple-400/60 dark:hover:border-purple-600/60 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-transform duration-200
                ${
                  isDragging
                    ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/30 scale-105'
                    : cvFile
                    ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-900/20 group-hover:scale-105'
                }`}>
                {cvFile ? 
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" /> : 
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`} />
                }
              </div>
              <div className="flex-1 text-left">
                <h3 className={`font-semibold text-sm mb-1 ${
                  isDragging
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {cvFile ? "Resume Selected" : isDragging ? "Drop your CV here" : "Upload Your Resume"}
                </h3>
                {cvFile ? (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {cvFile.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {(cvFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <p className={`text-xs ${
                    isDragging
                      ? 'text-purple-600 dark:text-purple-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {isDragging ? "Release to upload" : "Click to select or drag and drop a PDF file"}
                  </p>
                )}
              </div>
              {cvFile && (
                <span className="ml-3 flex-shrink-0 rounded-full bg-green-100/60 dark:bg-green-900/30 backdrop-blur-sm p-2 border border-green-200/50 dark:border-green-800/30">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </span>
              )}
              <input
                id="cv-upload-input-modal"
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
            </label>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center mt-2 
            bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm 
            px-3 py-2 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
            <Info className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Your resume will be analyzed to determine its match with the job description</span>
          </div>
        </motion.div>
      ),
    },
    {
      title: "Job Information",
      description: "Provide job details using AI or manual entry",
      icon: <Briefcase className="w-5 h-5" />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setJobInputMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ease-out ${
                jobInputMode === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Extraction
            </button>
            <button
              onClick={() => setJobInputMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ease-out ${
                jobInputMode === 'manual'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Manual Entry
            </button>
          </div>

          {/* AI Mode */}
          {jobInputMode === 'ai' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
          <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Job Posting URL
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
                    <div className="relative flex rounded-xl bg-white dark:bg-gray-800/95 overflow-hidden">
                      <input
                        type="url"
                        value={formData.jobUrl}
                        onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                        className="flex-1 px-4 py-3.5 rounded-l-xl bg-transparent border-0 focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="https://linkedin.com/jobs/view/..."
                        autoFocus
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExtractJobInfo}
                        disabled={isExtractingJob || !formData.jobUrl || !formData.jobUrl.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-r-xl bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title="Extract job information with AI"
                      >
                        {isExtractingJob ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap">Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap">Extract</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>Paste the job posting URL and our AI will extract all information automatically</span>
                </p>
              </div>

              {/* Extracted/Manual Fields */}
              <div className="space-y-3 pt-3 border-t border-gray-100/50 dark:border-gray-800/50">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                dark:bg-gray-800/30 dark:text-white text-xs
                bg-gray-50/50 backdrop-blur-sm
                transition-all duration-200"
              placeholder="e.g., Full Stack Developer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                dark:bg-gray-800/30 dark:text-white text-xs
                bg-gray-50/50 backdrop-blur-sm
                transition-all duration-200"
              placeholder="e.g., Google"
            />
          </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                      focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                      dark:bg-gray-800/30 dark:text-white h-36 text-xs resize-none
                      bg-gray-50/50 backdrop-blur-sm
                      transition-all duration-200"
                    placeholder="Job description will be extracted automatically, or paste it manually..."
                  />
        </div>
              </div>
            </motion.div>
          )}

          {/* Manual Mode */}
          {jobInputMode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
        <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white text-xs
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white text-xs
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="e.g., Google"
                />
              </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white h-40 text-xs resize-none
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="Paste the complete job description here..."
          />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>Include the full job description for the most accurate results</span>
                </p>
        </div>
            </motion.div>
          )}
        </motion.div>
      )
    }
  ];

  useEffect(() => {
    // Créer un input file global pour l'upload
    const createGlobalFileInput = () => {
      // Supprimer l'ancien input s'il existe
      const oldInput = document.getElementById("global-file-input");
      if (oldInput) {
        document.body.removeChild(oldInput);
      }
      
      // Créer un nouvel input file
      const input = document.createElement("input");
      input.type = "file";
      input.id = "global-file-input";
      input.accept = ".pdf";
      input.style.display = "none";
      
      // Ajouter un gestionnaire d'événement pour l'upload
      input.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          // Validate file type
          if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file');
            return;
          }
          setCvFile(file);
          toast.success('CV selected successfully');
        }
      });
      
      // Ajouter l'input au body
      document.body.appendChild(input);
      
      // Nous n'assignons pas directement à fileInputRef.current
      // car c'est une propriété en lecture seule
      // À la place, nous utiliserons l'id pour retrouver l'élément
    };
    
    createGlobalFileInput();
    
    // Nettoyer lors du démontage
    return () => {
      const input = document.getElementById("global-file-input");
      if (input) {
        document.body.removeChild(input);
      }
    };
  }, []);

  const filteredAnalyses = filteredAndSortedAnalyses();

  return (
    <AuthLayout>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLoading ? 'overflow-hidden' : ''}`}>
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-600 dark:text-white">
                  ATS Check
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Get detailed insights on how your resume matches specific job positions. Improve your chances with AI-powered recommendations.
              </p>
            </div>
            <button
              onClick={() => {
                // Reset form when opening modal
                setFormData({
                  jobTitle: '',
                  company: '',
                  jobDescription: '',
                  jobUrl: '',
                });
                setCvFile(null);
                setCurrentStep(1);
                setJobInputMode('ai');
                setIsModalOpen(true);
              }}
              className="group px-4 py-2.5 rounded-xl 
                bg-gradient-to-r from-purple-600 to-indigo-600
                hover:opacity-90 transition-all duration-200
                shadow-lg shadow-purple-500/20"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="h-4 w-4 text-white flex-shrink-0" />
              <span className="text-sm font-medium text-white">New Analysis</span>
              </div>
            </button>
          </div>
  
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Analyses</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageScore}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.highMatch}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High Match (80%+)</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.mediumMatch + stats.lowMatch}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Needs Improvement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters and View Toggle */}
        {analyses.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company, or date..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Score Filter */}
              <div className="relative">
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value as any)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High (80%+)</option>
                  <option value="medium">Medium (65-79%)</option>
                  <option value="low">Low (&lt;65%)</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                  <option value="company">Sort by Company</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* View Toggle Buttons */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg flex items-center justify-center ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg flex items-center justify-center ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analyses List/Grid */}
        {filteredAnalyses.length > 0 ? (
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
            {filteredAnalyses.map((analysis) => (
              <AnalysisCard 
                key={analysis.id} 
                analysis={analysis} 
                onDelete={deleteAnalysis}
                viewMode={viewMode}
                onSelect={() => navigate(`/ats-analysis/${analysis.id}`)}
              />
            ))}
          </div>
        ) : analyses.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  No analyses yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                  Analyze your resume against specific job descriptions to see how well it matches and get personalized improvement suggestions.
                </p>
                <button
                  onClick={() => {
                    // Reset form when opening modal
                    setFormData({
                      jobTitle: '',
                      company: '',
                      jobDescription: '',
                      jobUrl: '',
                    });
                    setCvFile(null);
                    setCurrentStep(1);
                    setJobInputMode('ai');
                    setIsModalOpen(true);
                  }}
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto whitespace-nowrap"
                >
                  <Sparkles className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-medium text-white">Start your first analysis</span>
                </button>
              </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              No results found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterScore('all');
              }}
              className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
        </div>
        
        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: "100%" }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: "100%" }}
                onClick={(e) => e.stopPropagation()}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 w-full rounded-2xl max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Drag handle for mobile */}
                <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
                  {/* Step Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center w-full relative px-2">
                      {/* Progress Bar Background */}
                      <div className="absolute h-0.5 bg-gray-200 dark:bg-gray-700 left-8 right-8 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>
                      {/* Progress Bar Fill */}
                      <div 
                        className="absolute h-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 left-8 top-1/2 -translate-y-1/2 z-10 transition-all duration-500 ease-out rounded-full"
                        style={{ 
                          width: currentStep === 1 
                            ? '0%' 
                            : `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                          maxWidth: 'calc(100% - 4rem)'
                        }}
                      ></div>
                      
                      {/* Step Circles */}
                      {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        
                        return (
                          <div 
                            key={step.title} 
                            className="z-20 flex flex-col items-center flex-1 relative"
                          >
                            <div 
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center mb-2
                                transition-all duration-300 ease-out
                                ${isActive 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white ring-4 ring-purple-100 dark:ring-purple-900/30 shadow-lg shadow-purple-500/20 scale-110' 
                                  : isCompleted 
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/10' 
                                    : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600'
                                }
                              `}
                            >
                              {isCompleted ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-semibold">
                                  {stepNumber}
                                </span>
                              )}
                            </div>
                            <span className={`
                              text-xs font-medium text-center transition-colors duration-300
                              ${isActive 
                                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                                : isCompleted
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-400 dark:text-gray-500'
                              }
                            `}>
                              {step.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Title Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <span className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400">
                          {steps[currentStep - 1].icon}
                        </span>
                        {steps[currentStep - 1].title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-14">
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95 ml-4 flex-shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                  {steps[currentStep - 1].content}
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                      }
                    }}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 ${
                      currentStep === 1 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                    }`}
                  >
                    <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                    Back
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentStep < steps.length) {
                        // Validate step 2 before proceeding
                        if (currentStep === 2) {
                          if (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim()) {
                            toast.error('Please fill in all job information fields');
                            return;
                          }
                        }
                        setCurrentStep(currentStep + 1);
                      } else {
                        // Call handleAnalysis instead of just closing the modal
                        handleAnalysis();
                      }
                    }}
                    disabled={
                      (currentStep === 1 && !cvFile) || 
                      (currentStep === 2 && (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim())) ||
                      isLoading
                    }
                    className={`px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 
                      hover:from-indigo-700 hover:to-violet-700 disabled:from-gray-400 disabled:to-gray-500 
                      text-white rounded-lg text-sm font-semibold flex items-center 
                      transition-all duration-200 ease-out
                      disabled:cursor-not-allowed 
                      shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
                      hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/40
                      disabled:shadow-none disabled:hover:shadow-none`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        <span>Analysis in progress...</span>
                      </>
                    ) :
                      <>
                        {currentStep === steps.length ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            <span>Analyze Resume</span>
                          </>
                        ) : (
                          <>
                            <span>Continue</span>
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </>
                    }
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay - Bird animation */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center px-6"
            >
              <div className="cvopt-walker mb-8" aria-label="Loading">
                <div className="loader">
                  <svg className="legl" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20.69332" height="68.19944" viewBox="0,0,20.69332,68.19944">
                    <g transform="translate(-201.44063,-235.75466)">
                      <g strokeMiterlimit={10}>
                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                        <path d="M218.11971,301.20087c-2.20708,1.73229 -4.41416,0 -4.41416,0l-1.43017,-1.1437c-1.42954,-1.40829 -3.04351,-2.54728 -4.56954,-3.87927c-0.95183,-0.8308 -2.29837,-1.49883 -2.7652,-2.55433c-0.42378,-0.95815 0.14432,-2.02654 0.29355,-3.03399c0.41251,-2.78499 1.82164,-5.43386 2.41472,-8.22683c1.25895,-4.44509 2.73863,-8.98683 3.15318,-13.54796c0.22615,-2.4883 -0.21672,-5.0155 -0.00278,-7.50605c0.30636,-3.56649 1.24602,-7.10406 1.59992,-10.6738c0.29105,-2.93579 -0.00785,-5.9806 -0.00785,-8.93046c0,0 0,-2.44982 3.12129,-2.44982c3.12129,0 3.12129,2.44982 3.12129,2.44982c0,3.06839 0.28868,6.22201 -0.00786,9.27779c-0.34637,3.56935 -1.30115,7.10906 -1.59992,10.6738c-0.2103,2.50918 0.22586,5.05326 -0.00278,7.56284c-0.43159,4.7371 -1.94029,9.46317 -3.24651,14.07835c-0.47439,2.23403 -1.29927,4.31705 -2.05805,6.47156c-0.18628,0.52896 -0.1402,1.0974 -0.327,1.62624c-0.09463,0.26791 -0.64731,0.47816 -0.50641,0.73323c0.19122,0.34617 0.86423,0.3445 1.2346,0.58502c1.88637,1.22503 3.50777,2.79494 5.03,4.28305l0.96971,0.73991c0,0 2.20708,1.73229 0,3.46457z" fill="none" stroke="#191e2e" strokeWidth={7} />
                      </g>
                    </g>
                  </svg>
                  <svg className="legr" version="1.1" xmlns="http://www.w3.org/2000/svg" width="41.02537" height="64.85502" viewBox="0,0,41.02537,64.85502">
                    <g transform="translate(-241.54137,-218.44347)">
                      <g strokeMiterlimit={10}>
                        <path d="M279.06674,279.42662c-2.27967,1.98991 -6.08116,0.58804 -6.08116,0.58804l-2.47264,-0.92915c-2.58799,-1.18826 -5.31176,-2.08831 -7.99917,-3.18902c-1.67622,-0.68654 -3.82471,-1.16116 -4.93147,-2.13229c-1.00468,-0.88156 -0.69132,-2.00318 -0.92827,-3.00935c-0.65501,-2.78142 0.12275,-5.56236 -0.287,-8.37565c-0.2181,-4.51941 -0.17458,-9.16283 -1.60696,-13.68334c-0.78143,-2.46614 -2.50162,-4.88125 -3.30086,-7.34796c-1.14452,-3.53236 -1.40387,-7.12078 -2.48433,-10.66266c-0.88858,-2.91287 -2.63779,-5.85389 -3.93351,-8.74177c0,0 -1.07608,-2.39835 3.22395,-2.81415c4.30003,-0.41581 2.41605,1.98254 2.41605,1.98254c1.34779,3.00392 3.13072,6.05282 4.06444,9.0839c1.09065,3.54049 1.33011,7.13302 2.48433,10.66266c0.81245,2.48448 2.5308,4.917 3.31813,7.40431c1.48619,4.69506 1.48366,9.52281 1.71137,14.21503c0.32776,2.25028 0.10631,4.39942 0.00736,6.60975c-0.02429,0.54266 0.28888,1.09302 0.26382,1.63563c-0.01269,0.27488 -0.68173,0.55435 -0.37558,0.78529c0.41549,0.31342 1.34191,0.22213 1.95781,0.40826c3.13684,0.94799 6.06014,2.26892 8.81088,3.52298l1.66093,0.59519c0,0 6.76155,1.40187 4.48187,3.39177z" fill="none" stroke="#000000" strokeWidth={7} />
                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                      </g>
                    </g>
                  </svg>
                  <div className="bod">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="144.10576" height="144.91623" viewBox="0,0,144.10576,144.91623">
                      <g transform="translate(-164.41679,-112.94712)">
                        <g strokeMiterlimit={10}>
                          <path d="M166.9168,184.02633c0,-36.49454 35.0206,-66.07921 72.05288,-66.07921c37.03228,0 67.05288,29.58467 67.05288,66.07921c0,6.94489 -1.08716,13.63956 -3.10292,19.92772c-2.71464,8.46831 -7.1134,16.19939 -12.809,22.81158c-2.31017,2.68194 -7.54471,12.91599 -7.54471,12.91599c0,0 -5.46714,-1.18309 -8.44434,0.6266c-3.86867,2.35159 -10.95356,10.86714 -10.95356,10.86714c0,0 -6.96906,-3.20396 -9.87477,-2.58085c-2.64748,0.56773 -6.72538,5.77072 -6.72538,5.77072c0,0 -5.5023,-4.25969 -7.5982,-4.25969c-3.08622,0 -9.09924,3.48259 -9.09924,3.48259c0,0 -6.0782,-5.11244 -9.00348,-5.91884c-4.26461,-1.17561 -12.23343,0.75049 -12.23343,0.75049c0,0 -5.18164,-8.26065 -7.60688,-9.90388c-3.50443,-2.37445 -8.8271,-3.95414 -8.8271,-3.95414c0,0 -5.33472,-8.81718 -7.27019,-11.40895c-4.81099,-6.44239 -13.46422,-9.83437 -15.65729,-17.76175c-1.53558,-5.55073 -2.35527,-21.36472 -2.35527,-21.36472z" fill="#191e2e" stroke="#000000" strokeWidth={5} strokeLinecap="butt" />
                          <path d="M167.94713,180c0,-37.03228 35.0206,-67.05288 72.05288,-67.05288c37.03228,0 67.05288,30.0206 67.05288,67.05288c0,7.04722 -1.08716,13.84053 -3.10292,20.22135c-2.71464,8.59309 -7.1134,16.43809 -12.809,23.14771c-2.31017,2.72146 -7.54471,13.1063 -7.54471,13.1063c0,0 -5.46714,-1.20052 -8.44434,0.63584c-3.86867,2.38624 -10.95356,11.02726 -10.95356,11.02726c0,0 -6.96906,-3.25117 -9.87477,-2.61888c-2.64748,0.5761 -6.72538,5.85575 -6.72538,5.85575c0,0 -5.5023,-4.32246 -7.5982,-4.32246c-3.08622,0 -9.09924,3.5339 -9.09924,3.5339c0,0 -6.0782,-5.18777 -9.00348,-6.00605c-4.26461,-1.19293 -12.23343,0.76155 -12.23343,0.76155c0,0 -5.18164,-8.38236 -7.60688,-10.04981c-3.50443,-2.40943 -8.8271,-4.0124 -8.8271,-4.0124c0,0 -5.33472,-8.9471 -7.27019,-11.57706c-4.81099,-6.53732 -13.46422,-9.97928 -15.65729,-18.02347c-1.53558,-5.63252 -2.35527,-21.67953 -2.35527,-21.67953z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="M216.22445,188.06994c0,0 1.02834,11.73245 -3.62335,21.11235c-4.65169,9.3799 -13.06183,10.03776 -13.06183,10.03776c0,0 7.0703,-3.03121 10.89231,-10.7381c4.34839,-8.76831 5.79288,-20.41201 5.79288,-20.41201z" fill="none" stroke="#2f3a50" strokeWidth={3} strokeLinecap="round" />
                        </g>
                      </g>
                    </svg>
                    <svg className="head" version="1.1" xmlns="http://www.w3.org/2000/svg" width="115.68559" height="88.29441" viewBox="0,0,115.68559,88.29441">
                      <g transform="translate(-191.87889,-75.62023)">
                        <g strokeMiterlimit={10}>
                          <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="M195.12889,128.77752c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,0.60102 -9.22352,20.49284 -9.22352,20.49284l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="butt" />
                          <path d="M195.31785,124.43649c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,1.03481 -0.08666,2.8866 -0.08666,2.8866c0,0 16.8538,15.99287 16.21847,17.23929c-0.66726,1.30905 -23.05667,-4.14265 -23.05667,-4.14265l-2.29866,4.5096l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="M271.10348,122.46768l10.06374,-3.28166l24.06547,24.28424" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="round" />
                          <path d="M306.56448,144.85764l-41.62024,-8.16845l2.44004,-7.87698" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M276.02738,115.72434c-0.66448,-4.64715 2.56411,-8.95308 7.21127,-9.61756c4.64715,-0.66448 8.95309,2.56411 9.61757,7.21126c0.46467,3.24972 -1.94776,8.02206 -5.96624,9.09336c-2.11289,-1.73012 -5.08673,-5.03426 -5.08673,-5.03426c0,0 -4.12095,1.16329 -4.60481,1.54229c-0.16433,-0.04891 -0.62732,-0.38126 -0.72803,-0.61269c-0.30602,-0.70328 -0.36302,-2.02286 -0.44303,-2.58239z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="M242.49281,125.6424c0,-4.69442 3.80558,-8.5 8.5,-8.5c4.69442,0 8.5,3.80558 8.5,8.5c0,4.69442 -3.80558,8.5 -8.5,8.5c-4.69442,0 -8.5,-3.80558 -8.5,-8.5z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                        </g>
                      </g>
                    </svg>
                  </div>
                  <svg id="gnd" version="1.1" xmlns="http://www.w3.org/2000/svg" width={475} height={530} viewBox="0,0,163.40011,85.20095">
                    <g transform="translate(-176.25,-207.64957)">
                      <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeMiterlimit={10}>
                        <path d="M295.5,273.1829c0,0 -57.38915,6.69521 -76.94095,-9.01465c-13.65063,-10.50609 15.70098,-20.69467 -2.5451,-19.94465c-30.31027,2.05753 -38.51396,-26.84135 -38.51396,-26.84135c0,0 6.50084,13.30023 18.93224,19.17888c9.53286,4.50796 26.23632,-1.02541 32.09529,4.95137c3.62417,3.69704 2.8012,6.33005 0.66517,8.49452c-3.79415,3.84467 -11.7312,6.21103 -6.24682,10.43645c22.01082,16.95812 72.55412,12.73944 72.55412,12.73944z" fill="#000000" />
                        <path d="M338.92138,217.76285c0,0 -17.49626,12.55408 -45.36424,10.00353c-8.39872,-0.76867 -17.29557,-6.23066 -17.29557,-6.23066c0,0 3.06461,-2.23972 15.41857,0.72484c26.30467,6.31228 47.24124,-4.49771 47.24124,-4.49771z" fill="#000000" />
                        <path d="M209.14443,223.00182l1.34223,15.4356l-10.0667,-15.4356" fill="none" />
                        <path d="M198.20391,230.41806l12.95386,7.34824l6.71113,-12.08004" fill="none" />
                        <path d="M211.19621,238.53825l8.5262,-6.09014" fill="none" />
                        <path d="M317.57068,215.80173l5.27812,6.49615l0.40601,-13.39831" fill="none" />
                        <path d="M323.66082,222.70389l6.09014,-9.33822" fill="none" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="w-[min(60vw,520px)] h-2 rounded-full bg-white/20 dark:bg-white/15 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                />
              </div>
              <p className="text-base font-semibold text-white">
                {loadingMessage}
              </p>
              <p className="mt-2 text-sm text-white/80">
                This may take up to 2 minutes.
              </p>
            </motion.div>
            <style>
              {`
                .cvopt-walker .loader {
                  position: relative;
                  width: 200px;
                  height: 200px;
                  transform: translate(10px, -20px) scale(0.75);
                }
                .cvopt-walker .loader svg {
                  position: absolute;
                  top: 0;
                  left: 0;
                }
                .cvopt-walker .head {
                  transform: translate(27px, -30px);
                  z-index: 3;
                  animation: bob-head 1s infinite ease-in;
                }
                .cvopt-walker .bod {
                  transform: translate(0px, 30px);
                  z-index: 3;
                  animation: bob-bod 1s infinite ease-in-out;
                }
                .cvopt-walker .legr {
                  transform: translate(75px, 135px);
                  z-index: 0;
                  animation: rstep-full 1s infinite ease-in;
                }
                .cvopt-walker .legr {
                  animation-delay: 0.45s;
                }
                .cvopt-walker .legl {
                  transform: translate(30px, 155px);
                  z-index: 3;
                  animation: lstep-full 1s infinite ease-in;
                }
                @keyframes bob-head {
                  0% { transform: translate(27px, -30px) rotate(3deg); }
                  5% { transform: translate(27px, -30px) rotate(3deg); }
                  25% { transform: translate(27px, -25px) rotate(0deg); }
                  50% { transform: translate(27px, -30px) rotate(-3deg); }
                  70% { transform: translate(27px, -25px) rotate(0deg); }
                  100% { transform: translate(27px, -30px) rotate(3deg); }
                }
                @keyframes bob-bod {
                  0% { transform: translate(0px, 30px) rotate(3deg); }
                  5% { transform: translate(0px, 30px) rotate(3deg); }
                  25% { transform: translate(0px, 35px) rotate(0deg); }
                  50% { transform: translate(0px, 30px) rotate(-3deg); }
                  70% { transform: translate(0px, 35px) rotate(0deg); }
                  100% { transform: translate(0px, 30px) rotate(3deg); }
                }
                @keyframes lstep-full {
                  0% { transform: translate(30px, 155px) rotate(-5deg); }
                  33% { transform: translate(62px, 140px) rotate(35deg); }
                  66% { transform: translate(55px, 155px) rotate(-25deg); }
                  100% { transform: translate(30px, 155px) rotate(-5deg); }
                }
                @keyframes rstep-full {
                  0% { transform: translate(75px, 135px) rotate(-5deg); }
                  33% { transform: translate(105px, 125px) rotate(35deg); }
                  66% { transform: translate(95px, 135px) rotate(-25deg); }
                  100% { transform: translate(75px, 135px) rotate(-5deg); }
                }
                .cvopt-walker #gnd {
                  transform: translate(-140px, 0) rotate(10deg);
                  z-index: -1;
                  filter: blur(0.5px) drop-shadow(1px 3px 5px #000000);
                  opacity: 0.25;
                  animation: scroll 5s infinite linear;
                }
                @keyframes scroll {
                  0% { transform: translate(50px, 25px); opacity: 0; }
                  33% { opacity: 0.25; }
                  66% { opacity: 0.25; }
                  100% { transform: translate(-100px, -50px); opacity: 0; }
                }
              `}
            </style>
          </div>
        )}

      
      {/* CV Selection Modal */}
      {cvModalOpen && false && (
        <CVSelectionModal
          isOpen={cvModalOpen}
          onClose={() => setCvModalOpen(false)}
          onCVSelected={(file) => {
            if (file instanceof File) {
              setCvFile(file);
              setSelectedCV(null);
            } else {
              setSelectedCV(file);
              setCvFile(null);
            }
            setCvModalOpen(false);
          }}
          enableContentValidation={enableContentValidation}
          setEnableContentValidation={setEnableContentValidation}
        />
      )}
      
      {/* Input file global pour s'assurer qu'il est toujours accessible */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf"
      />
    </AuthLayout>
  );
}

// Composants utilitaires
const Section = ({ title, icon, children }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// Fonction utilitaire pour formater la date (ajoutée en haut du fichier)
function formatDateString(dateString: string): string {
  // Si la date contient le format ISO avec T, extraire seulement la partie date
  if (dateString && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
}