import { useState, useEffect, useRef, Fragment } from 'react';
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
  Search, Filter, LayoutGrid, List, ArrowUpDown, Link2, Wand2, Loader2
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
    matching: { name: string; relevance: number }[];
    missing: { name: string; relevance: number }[];
    alternative: { name: string; alternativeTo: string }[];
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
  };
  applicationStrategy?: {
    coverLetterFocus: string;
    interviewPreparation: string;
    portfolioSuggestions: string;
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
  
  // FIX: Add a minimum baseline score to avoid excessively low overall scores
  const baselineScore = 40;
  
  // Calculate overall match score with weighted components and fixed minimum
  const matchScore = Math.round(
    Math.max(
      baselineScore,
      (keywordMatchScore * 0.30) + // Base keyword matching (30%)
      (weightedCategoryScore * 0.25) + // Category-specific matches (25%)  
      (criticalRequirementsScore * 0.20) + // Critical requirements (20%)
      (titleMatchScore) + // Job title match bonus (0-15%)
      (experienceYearsScore) + // Experience years match (0-15%)
      (exactPhraseBonus) + // Exact phrase matches (0-10%)
      (Math.random() * 5) // Small random variation for natural feel (0 to +5)
    )
  );
  
  // Constrain score to realistic range with proper minimum
  const finalMatchScore = Math.min(98, matchScore);
  
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
  const [selectedAnalysis, setSelectedAnalysis] = useState<ATSAnalysis | null>(null);

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
                jobTitle: data.jobTitle,
                company: data.company,
                matchScore: data.matchScore,
                userId: '', // Assuming userId is not provided in the saved data
                keyFindings: data.keyFindings,
                skillsMatch: data.skillsMatch,
                experienceAnalysis: data.experienceAnalysis,
                recommendations: data.recommendations,
                categoryScores: data.categoryScores,
                executiveSummary: data.executiveSummary,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setCvFile(file);
    toast.success('CV selected successfully');
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
# Enhanced ATS Resume Analysis Engine

## Core Instructions
Perform a comprehensive, highly nuanced analysis of the provided resume against the job description below.
Your goal is to deliver actionable, evidence-based insights that will genuinely help the candidate improve their application.

## Job Position Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## Analysis Framework
1. EXTRACT ALL RELEVANT INFORMATION from both the resume and job description
2. COMPARE the resume against industry standards for ${jobDetails.jobTitle} positions
3. EVALUATE the resume against ATS optimization best practices
4. IDENTIFY specific strengths and weaknesses with examples from the resume
5. PRIORITIZE recommendations based on potential impact on application success

## Depth Requirements
- Provide PRECISE and SPECIFIC feedback rather than generic observations
- Consider both EXPLICIT requirements and IMPLICIT expectations for the role
- Analyze for KEYWORD optimization without suggesting keyword stuffing
- Evaluate QUANTIFIABLE ACHIEVEMENTS and their relevance to the position
- Assess FORMATTING, STRUCTURE, and CONTENT from an ATS perspective
- Identify CAREER PROGRESSION patterns and their alignment with the role
- Check for INDUSTRY-SPECIFIC conventions and best practices

## Competitive Analysis Section
- Compare candidate's profile against typical competitive candidates
- Identify unique selling points and competitive disadvantages
- Suggest positioning strategies to stand out from other applicants

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
  }
}
\`\`\`

## Critical Guidelines
- Ensure score differentiation: Use the FULL RANGE between 30-95% based on genuine fit
- Low match (30-50%): For significant misalignment with core requirements
- Medium match (51-75%): For meeting basic requirements with notable gaps
- High match (76-95%): Only for exceptional alignment with most requirements
- Never inflate scores artificially - honesty helps candidates improve
- Provide SPECIFIC, ACTIONABLE recommendations tied to concrete resume elements
- Focus on EVIDENCE-BASED analysis rather than assumptions
- Include BEFORE/AFTER examples in recommendations when possible
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
              content: "You are an elite ATS optimization expert, career coach, and industry analyst. Your analysis must be exceptionally detailed, honest, and actionable. Provide specific evidence from the resume for each point you make. Think step by step, and ensure all feedback is constructive and implementation-ready."
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
      "Warming up the AI engines...",
      "Dusting off the digital magnifying glass...",
      "Powering up the resume analyzer...",
      "Preparing the virtual interview room...",
      "Loading professional assessment tools..."
    ],
    analyzing: [
      "Scanning your resume with AI-powered vision...",
      "Comparing your skills with job requirements...",
      "Analyzing your professional experience...",
      "Evaluating career progression patterns...",
      "Identifying your unique strengths..."
    ],
    matching: [
      "Calculating match score with scientific precision...",
      "Finding perfect-fit skills in your profile...",
      "Discovering hidden talents in your experience...",
      "Measuring educational alignment with requirements...",
      "Quantifying your industry expertise..."
    ],
    finalizing: [
      "Crafting personalized recommendations...",
      "Polishing the final analysis report...",
      "Preparing actionable insights...",
      "Formatting results for maximum clarity...",
      "Adding final touches to your career advice..."
    ]
  };

  // LoadingScreen component with elegant UI and animations
  const LoadingScreen = () => {
    const steps = [
      { key: 'preparing', label: 'Preparing Analysis', icon: '🔍' },
      { key: 'analyzing', label: 'Analyzing Resume', icon: '📄' },
      { key: 'matching', label: 'Matching Skills', icon: '🎯' },
      { key: 'finalizing', label: 'Finalizing Report', icon: '📊' }
    ];

    // Find current step index
    const currentStepIndex = steps.findIndex(step => step.key === loadingStep);

    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white dark:bg-gray-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-xl p-8 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
          {/* Logo + Title */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="animate-pulse absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 blur-lg"></div>
              <div className="w-24 h-24 relative flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                <div className="text-4xl">✨</div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              AI Resume Analysis
            </span>
          </h2>

          {/* Message with typing animation */}
          <div className="text-center mb-6 h-16">
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium animate-fade-in">
              {loadingMessage}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {loadingStep === 'analyzing' && 'This might take up to a minute...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          {/* Steps visualization */}
          <div className="w-full flex justify-between mb-2 relative">
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
            <div 
              className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 z-0 transition-all duration-700"
              style={{ 
                width: `${currentStepIndex >= 0 
                  ? (currentStepIndex / (steps.length - 1)) * 100 
                  : 0}%` 
              }}
            ></div>
            
            {/* Steps */}
            {steps.map((step, index) => {
              // Calculate step status
              const isActive = loadingStep === step.key;
              const isCompleted = steps.findIndex(s => s.key === loadingStep) > index;
              
              return (
                <div 
                  key={step.key} 
                  className="flex flex-col items-center relative z-10"
                >
                  {/* Step circle */}
                  <div 
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 border-2 
                    ${isActive 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300 dark:border-purple-700 scale-110 shadow-lg shadow-purple-500/20' 
                      : isCompleted 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-transparent' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {step.icon}
                      </span>
                    )}
                  </div>
                  
                  {/* Step label */}
                  <span 
                    className={`mt-2 text-xs font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : isCompleted 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-500 dark:text-gray-500'}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Percentage indicator */}
          <div className="flex justify-center mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(loadingProgress)}% complete
            </span>
          </div>
        </div>
        
        {/* Processing hints */}
        <div className="mt-6 max-w-md text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Our AI is carefully analyzing your resume against job requirements to provide the most accurate feedback.
          </p>
          
          {/* ATS Tip */}
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg inline-flex items-center max-w-sm text-sm">
              <Lightbulb className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
              <p className="text-purple-700 dark:text-purple-300 text-xs">
                {loadingStep === 'preparing' && "75% of resumes are rejected by ATS before a human sees them. Our analysis helps beat these systems."}
                {loadingStep === 'analyzing' && "Including relevant keywords from the job description can boost your ATS score significantly."}
                {loadingStep === 'matching' && "Quantify your achievements with specific numbers and percentages to stand out from other applicants."}
                {loadingStep === 'finalizing' && "Customizing your resume for each application improves interview chances by up to 70%!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modifier l'effet pour les messages sans clignotement
  useEffect(() => {
    if (!isLoading) return;
    
    // Change message every 5 seconds avec une transition plus douce
    const messageInterval = setInterval(() => {
      const messages = loadingMessages[loadingStep as keyof typeof loadingMessages];
      
      // Animation de fondu entre les messages
      setLoadingMessage(prev => {
        // Sauvegarder le message actuel pour éviter la répétition
        const currentMessage = prev;
        // Sélectionner un nouveau message différent de l'actuel
        let newMessage;
        do {
          const idx = Math.floor(Math.random() * messages.length);
          newMessage = messages[idx];
        } while (newMessage === currentMessage && messages.length > 1);
        
        return newMessage;
      });
    }, 5000); // Intervalle plus long
    
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
        const cap = caps[loadingStep as keyof typeof caps];
        
        if (prev >= cap) return prev;
        
        // Increment plus petit et plus progressif
        const remainingProgress = cap - prev;
        const increment = Math.max(0.2, remainingProgress * 0.02);
        return Math.min(prev + increment, cap);
      });
    }, 350);
    
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
    toast.info('Analyzing job posting with AI...', { duration: 2000 });

    try {
      const jobUrl = formData.jobUrl.trim();
      const prompt = `
You are a web scraper. Your task is to visit this URL and extract job posting information: ${jobUrl}

MANDATORY STEPS - DO NOT SKIP:
1. You MUST use web search/browsing to visit: ${jobUrl}
2. Read the ACTUAL HTML content of the page
3. Find the job title in the page HTML (look for <h1>, <h2>, or title tags)
4. Find the company name (usually in the header or near the job title)
5. Extract the FULL job description from the page
6. Extract these EXACT strings as they appear in the page content

CRITICAL: Do NOT use your training data or make assumptions. You MUST visit the URL and read the actual page.

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "companyName": "the exact company name from the page",
  "position": "the EXACT job title from the page - copy it exactly as shown",
  "jobDescription": "the complete job description from the page - include all requirements, responsibilities, and details"
}

VERY IMPORTANT:
- The "position" field is CRITICAL - it must be the exact job title shown on the page
- The "jobDescription" must be the COMPLETE description including all sections
- Do NOT return generic titles or descriptions
- Visit the URL and read the actual content

URL to visit: ${jobUrl}
`;

      const response = await queryPerplexityForJobExtraction(prompt);
      
      if (response.error) {
        throw new Error(response.errorMessage || 'Failed to analyze job posting');
      }

      // Parser la réponse JSON
      let extractedData;
      try {
        let jsonString = response.text || '';
        jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        extractedData = JSON.parse(jsonString);
        
        if (!extractedData.position || !extractedData.companyName) {
          throw new Error('Missing required fields in extracted data');
        }
        
        // Mettre à jour le formulaire avec les données extraites
        setFormData({
          ...formData,
          jobTitle: extractedData.position || '',
          company: extractedData.companyName || '',
          jobDescription: extractedData.jobDescription || '',
        });
        
        toast.success('Job information extracted successfully!');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Essayer d'extraire manuellement avec regex
        const text = response.text || '';
        
        let companyName = '';
        const companyMatch = text.match(/"companyName"\s*:\s*"([^"]+)"/i) || 
                           text.match(/companyName["\s]*:["\s]*([^",\n}]+)/i);
        if (companyMatch) companyName = companyMatch[1].trim();
        
        let position = '';
        const positionMatch = text.match(/"position"\s*:\s*"([^"]+)"/i) || 
                            text.match(/position["\s]*:["\s]*"([^"]+)"/i);
        if (positionMatch) position = positionMatch[1].trim();
        
        let jobDescription = '';
        const descMatch = text.match(/"jobDescription"\s*:\s*"([^"]+)"/i);
        if (descMatch) jobDescription = descMatch[1].trim();
        
        if (position && companyName) {
          setFormData({
            ...formData,
            jobTitle: position,
            company: companyName,
            jobDescription: jobDescription || formData.jobDescription,
          });
          toast.success('Job information extracted successfully!');
        } else {
          throw new Error('Could not extract job information from the response');
        }
      }
    } catch (error: any) {
      console.error('Error extracting job info:', error);
      toast.error(`Failed to extract job information: ${error.message || 'Unknown error'}`);
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
          
          // Prepare job details
          const jobDetails = {
            jobTitle: formData.jobTitle || 'Not specified',
            company: formData.company || 'Not specified',
            jobDescription: formData.jobDescription || 'Not provided'
          };
          
          console.log('📡 Sending request to GPT-4o Vision API...');
          
          // Update loading step
          setLoadingStep('analyzing');
          setLoadingProgress(40);
          
          // Call GPT-4o Vision API with the images
          const analysis = await analyzeCVWithGPT4Vision(images, jobDetails);
          
          console.log('✅ GPT-4o Vision analysis successful!', analysis);
          
          // Update loading step
          setLoadingStep('matching');
          setLoadingProgress(80);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Create analysis object
          const fullAnalysis = {
            ...analysis,
            id: `analysis_${Date.now()}`,
            date: formatDateString(analysis.date),
            userId: auth.currentUser?.uid || 'anonymous',
            jobTitle: jobDetails.jobTitle,
            company: jobDetails.company
          };
          
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 
          hover:shadow-lg transition-all duration-300 overflow-hidden
          ${isGrid ? 'h-full flex flex-col' : ''}`}
      >
        {/* Card Header - Always visible and clickable */}
        <div 
          onClick={() => {
            if (onSelect) {
              onSelect();
            } else {
              toggleExpand();
            }
          }}
          className={`${isGrid ? 'p-6' : 'p-5'} cursor-pointer flex ${isGrid ? 'flex-col' : 'items-center justify-between'} group`}
        >
          <div className={`flex ${isGrid ? 'flex-col items-center text-center space-y-4' : 'items-center space-x-5 flex-1'}`}>
            {/* Score Circle */}
            <div className="relative">
              <CircularProgressWithCenterText 
                value={analysis.matchScore} 
                size={isGrid ? 80 : 70}
                strokeWidth={7}
                textSize={isGrid ? "text-2xl font-semibold" : "text-xl font-semibold"}
                colorClass={getScoreColorClass(analysis.matchScore)}
              />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <Trophy className={`${isGrid ? 'w-6 h-6' : 'w-5 h-5'} ${
                  analysis.matchScore >= 80 
                    ? 'text-yellow-500' 
                    : analysis.matchScore >= 65 
                    ? 'text-blue-400' 
                    : 'text-red-400'
                }`} />
              </div>
            </div>
            
            {/* Job Title and Company */}
            <div className={`flex-1 ${isGrid ? 'w-full' : ''}`}>
              <div className={`flex items-center ${isGrid ? 'justify-center flex-col' : ''}`}>
                <h3 className={`${isGrid ? 'text-xl' : 'text-lg md:text-xl'} font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${isGrid ? 'mb-2' : ''}`}>
                  {analysis.jobTitle}
                </h3>
                {analysis.matchScore >= 80 && (
                  <div className={`${isGrid ? 'mt-2' : 'ml-2'} flex items-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    High match
                  </div>
                )}
              </div>
              <div className={`flex items-center ${isGrid ? 'flex-col space-y-1 mt-3' : 'mt-1'}`}>
                <p className={`text-sm text-gray-500 dark:text-gray-400 flex items-center ${isGrid ? 'justify-center' : ''}`}>
                  <Building2 className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" /> 
                  {analysis.company}
                </p>
                {!isGrid && <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>}
                <p className={`text-sm text-gray-500 dark:text-gray-400 flex items-center ${isGrid ? 'justify-center' : ''}`}>
                  <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" /> 
                  {formatDate(analysis.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className={`flex items-center ${isGrid ? 'justify-center mt-4' : 'space-x-2'}`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              aria-label="Delete analysis"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {!onSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
            </button>
            )}
          </div>
        </div>

        {/* Skill Badges */}
        {!isExpanded && (
          <div className={`${isGrid ? 'px-6' : 'px-5'} pb-5 pt-0 flex flex-wrap gap-2 ${isGrid ? 'justify-center' : ''}`}>
            {analysis.skillsMatch.matching
              .sort((a, b) => b.relevance - a.relevance)
              .slice(0, 3)
              .map((skill, idx) => (
                <SkillTag 
                  key={`match-${idx}`} 
                  skill={skill.name} 
                  matched={true} 
                  relevance={skill.relevance} 
                />
              ))}
            
            {/* Ajouter des skills manquantes (tags rouges) */}
            {analysis.skillsMatch.missing
              .slice(0, 2)
              .map((skill, idx) => (
                <SkillTag 
                  key={`missing-${idx}`} 
                  skill={skill.name} 
                  matched={false} 
                />
              ))}
              
            {/* Compteur pour les skills restantes */}
            {(analysis.skillsMatch.matching.length > 3 || analysis.skillsMatch.missing.length > 2) && (
              <div className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full">
                +{(analysis.skillsMatch.matching.length - 3) + (analysis.skillsMatch.missing.length - 2)} plus
              </div>
            )}
          </div>
        )}
        
        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5 pb-5"
          >
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
                
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      analysis.matchScore >= 80 ? 'bg-green-500' : 
                      analysis.matchScore >= 65 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${analysis.matchScore}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 text-xs text-center">
                  <div className="text-red-500">
                    <div className="font-medium">Low Match</div>
                    <div>30-65%</div>
                  </div>
                  <div className="text-yellow-500">
                    <div className="font-medium">Medium Match</div>
                    <div>66-79%</div>
                  </div>
                  <div className="text-green-500">
                    <div className="font-medium">Strong Match</div>
                    <div>80-95%</div>
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
                        {analysis.atsOptimization.improvements.length > 0 && (
                          <div>
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
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

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
      if (value >= 80) return { start: '#10B981', end: '#34D399', mid: '#059669' };  // Green
      if (value >= 65) return { start: '#F59E0B', end: '#FBBF24', mid: '#D97706' };  // Yellow/Orange
      return { start: '#DC2626', end: '#EF4444', mid: '#B91C1C' };  // Red
    };
    
    const { start, end, mid } = getGradientColors();
    
    return (
      <div className="relative inline-flex">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Circle with subtle gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(229, 231, 235, 0.5)" />
              <stop offset="100%" stopColor="rgba(209, 213, 219, 0.8)" />
            </linearGradient>
          </defs>
          
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius}
            strokeWidth={strokeWidth}
            stroke="url(#bgGradient)"
            fill="transparent"
            className="dark:opacity-20"
          />
          
          {/* Progress Circle with Gradient */}
          <defs>
            <linearGradient id={`circleGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={start} />
              <stop offset="50%" stopColor={mid} />
              <stop offset="100%" stopColor={end} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
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
            className="transition-all duration-1000 ease-out-expo"
            filter={value >= 80 ? "url(#glow)" : ""}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold ${colorClass}`}>
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
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
        matched 
          ? "bg-gradient-to-r from-green-50 to-teal-50 text-green-700 border border-green-100/80 dark:from-green-900/20 dark:to-teal-900/20 dark:text-green-400 dark:border-green-800/30 hover:shadow-sm hover:from-green-100 hover:to-teal-100 dark:hover:from-green-900/30 dark:hover:to-teal-900/30"
          : "bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-100/80 dark:from-red-900/20 dark:to-orange-900/20 dark:text-red-400 dark:border-red-800/30 hover:shadow-sm hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30"
      }`}
    >
      {matched ? (
        <Check className="w-4 h-4 mr-1.5 text-green-600 dark:text-green-500" />
      ) : (
        <X className="w-4 h-4 mr-1.5 text-red-600 dark:text-red-500" />
      )}
      <span>{skill}</span>
      {matched && relevance && (
        <span className="ml-1.5 bg-white dark:bg-gray-800 text-xs px-1.5 py-0.5 rounded-full text-gray-600 dark:text-gray-400 shadow-inner">
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
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                {cvFile ? 
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" /> : 
                  <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                }
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {cvFile ? "Resume Selected" : "Upload Your Resume"}
                </h3>
                {cvFile ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {cvFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(cvFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to select a PDF file for ATS analysis
                  </p>
                )}
              </div>
              {cvFile && (
                <span className="ml-3 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </span>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-2 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
            Your resume will be analyzed to determine its match with the job description
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
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setJobInputMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                jobInputMode === 'ai'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Extraction
            </button>
            <button
              onClick={() => setJobInputMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                jobInputMode === 'manual'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Job Posting URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.jobUrl}
                    onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="https://linkedin.com/jobs/view/..."
                  />
                  <button
                    onClick={handleExtractJobInfo}
                    disabled={!formData.jobUrl.trim() || isExtractingJob}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    {isExtractingJob ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Extract
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Paste the job posting URL and our AI will extract all information automatically
                </p>
              </div>

              {/* Extracted/Manual Fields */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., Full Stack Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., Google"
            />
          </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-36 text-sm resize-none"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., Google"
                />
              </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-40 text-sm resize-none"
                  placeholder="Paste the complete job description here..."
          />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
            Include the full job description for the most accurate results
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
          setCvFile(target.files[0]);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ATS Resume Analysis
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
              <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
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
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredAnalyses.map((analysis) => (
              <AnalysisCard 
                key={analysis.id} 
                analysis={analysis} 
                onDelete={deleteAnalysis}
                viewMode={viewMode}
                onSelect={() => setSelectedAnalysis(analysis)}
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
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="h-5 w-5 text-white" />
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
            <Dialog
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              className="fixed inset-0 z-[50] overflow-y-auto"
            >
              <div className="flex items-center justify-center min-h-screen px-4">
                <Dialog.Overlay 
                  as={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-auto p-5 md:p-6 overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  {/* Step Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center w-full relative">
                      {/* Progress Bar */}
                      <div className="absolute h-1 bg-gray-200 dark:bg-gray-700 left-0 right-0 top-1/2 -translate-y-1/2 z-0"></div>
                      <div 
                        className="absolute h-1 bg-gradient-to-r from-purple-500 to-indigo-600 left-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-300"
                        style={{ width: `${(currentStep / steps.length) * 100 - (100 / steps.length / 2)}%` }}
                      ></div>
                      
                      {/* Step Circles */}
                      {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        
                        return (
                          <div 
                            key={step.title} 
                            className="z-20 flex flex-col items-center"
                          >
                            <div 
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center mb-1
                                transition-all duration-300 transform
                                ${isActive 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white ring-2 ring-purple-100 dark:ring-purple-900/30 scale-105' 
                                  : isCompleted 
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-400 border-2 border-gray-200 dark:border-gray-600'
                                }
                              `}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-medium">
                                  {stepNumber}
                                </span>
                              )}
                            </div>
                            <span className={`
                              text-xs font-medium hidden md:block transition-colors duration-300
                              ${isActive 
                                ? 'text-purple-600 dark:text-purple-400'
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
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <span className="mr-2 inline-flex p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          {steps[currentStep - 1].icon}
                        </span>
                        {steps[currentStep - 1].title}
                      </Dialog.Title>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="max-h-[50vh] overflow-y-auto pr-1 -mr-1 mb-5">
                    {steps[currentStep - 1].content}
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        if (currentStep > 1) {
                          setCurrentStep(currentStep - 1);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ${
                        currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                      }`}
                      disabled={currentStep === 1}
                    >
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Back
                    </button>
                    
                    <button
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
                      className={`px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium flex items-center shadow hover:shadow-md transition-all ${
                        (currentStep === 1 && !cvFile) || 
                        (currentStep === 2 && (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim())) ||
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-700 hover:to-indigo-700'
                      }`}
                      disabled={
                        (currentStep === 1 && !cvFile) || 
                        (currentStep === 2 && (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim())) ||
                        isLoading
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Analysis in progress...
                        </>
                      ) :
                        <>
                          {currentStep === steps.length ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Analyze Resume
                            </>
                          ) : (
                            <>
                              Continue
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </>
                      }
                    </button>
                  </div>
                </motion.div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* LoadingScreen */}
        <AnimatePresence>
          {isLoading && <LoadingScreen />}
        </AnimatePresence>

      {/* Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <Dialog
            open={!!selectedAnalysis}
            onClose={() => setSelectedAnalysis(null)}
            className="fixed inset-0 z-[60] overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <Dialog.Overlay 
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedAnalysis(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <CircularProgressWithCenterText 
                        value={selectedAnalysis.matchScore} 
                        size={70}
                        strokeWidth={7}
                        textSize="text-xl font-semibold"
                        colorClass={getScoreColorClass(selectedAnalysis.matchScore)}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <Trophy className={`w-5 h-5 ${
                          selectedAnalysis.matchScore >= 80 
                            ? 'text-yellow-500' 
                            : selectedAnalysis.matchScore >= 65 
                            ? 'text-blue-400' 
                            : 'text-red-400'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedAnalysis.jobTitle}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          {selectedAnalysis.company}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDateString(selectedAnalysis.date)}
                        </div>
                        {selectedAnalysis.matchScore >= 80 && (
                          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            High match
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ml-4"
                  >
                    <X className="w-5 h-5" />
                  </button>
      </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Match Score Overview */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-700/30 dark:to-gray-700/30 rounded-xl p-6 border border-purple-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Overall Match Score
                      </h3>
                      <div className={`text-3xl font-bold ${getScoreColorClass(selectedAnalysis.matchScore)}`}>
                        {selectedAnalysis.matchScore}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selectedAnalysis.matchScore >= 80 ? 
                        "Your resume is very well aligned with this position! You appear to be a strong candidate based on the requirements." :
                        selectedAnalysis.matchScore >= 65 ?
                        "Your resume meets many of the key requirements, but there are some areas that could be improved." :
                        "Your resume needs significant adjustments to better align with this position's requirements."
                      }
                    </p>
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedAnalysis.matchScore >= 80 ? 'bg-green-500' : 
                          selectedAnalysis.matchScore >= 65 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${selectedAnalysis.matchScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Category Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedAnalysis.categoryScores).map(([category, score], idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                        <div className="text-xs uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-2">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColorClass(score)}`}>
                          {Math.round(score)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Executive Summary
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedAnalysis.executiveSummary}
                    </p>
                  </div>

                  {/* Skills Match */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Matched Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedAnalysis.skillsMatch.matching
                        .sort((a, b) => b.relevance - a.relevance)
                        .map((skill, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {skill.name}
                            <span className="text-xs opacity-75">({skill.relevance}%)</span>
                          </div>
                        ))}
                    </div>

                    {selectedAnalysis.skillsMatch.missing.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 mt-6">
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          Missing Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.skillsMatch.missing
                            .sort((a, b) => b.relevance - a.relevance)
                            .map((skill, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm font-medium"
                              >
                                <AlertCircle className="w-4 h-4" />
                                {skill.name}
                                <span className="text-xs opacity-75">({skill.relevance}%)</span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Recommendations */}
                  {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        Recommendations
                      </h3>
                      <div className="space-y-4">
                        {selectedAnalysis.recommendations.map((rec, idx) => (
                          <div 
                            key={idx}
                            className={`p-4 rounded-lg border-l-4 ${
                              rec.priority === 'high' 
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-500' 
                                : rec.priority === 'medium'
                                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500'
                                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {rec.title}
                              </h4>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                rec.priority === 'high' 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                  : rec.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {rec.description}
                            </p>
                            {rec.examples && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 font-mono">
                                {rec.examples}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Findings */}
                  {selectedAnalysis.keyFindings && selectedAnalysis.keyFindings.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {selectedAnalysis.keyFindings.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <button
                    onClick={() => {
                      deleteAnalysis(selectedAnalysis.id);
                      setSelectedAnalysis(null);
                    }}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Analysis
                  </button>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
      
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
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setCvFile(e.target.files[0]);
          }
        }}
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