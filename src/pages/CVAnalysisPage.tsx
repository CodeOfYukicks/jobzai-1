import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Briefcase, Building, Target, 
  ChevronRight, X, Sparkles, Brain,
  CheckCircle, AlertCircle, Trophy, Lightbulb, Upload, Check,
  Flame as FireIcon, AlertTriangle as ExclamationTriangleIcon, 
  Info as InformationCircleIcon, Code as CodeBracketIcon,
  BarChart as ChartBarIcon
} from 'lucide-react';
import { Dialog, Disclosure } from '@headlessui/react';
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
  CheckIcon
} from '@heroicons/react/24/outline';
import { validateCVContent, validateJobDescription, setValidationOptions, analyzeCVWithGPT } from '../lib/cvAnalysis';
// Import Claude Analysis functions
import { analyzeCVWithClaude, fileToBase64 } from '../lib/claudeAnalysis';

// Configurer le worker correctement
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

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
    console.log('🚀 Démarrage de l\'analyse ATS avec GPT Vision');
    
    // Si nous avons un CV téléchargé directement (au lieu d'une URL de stockage)
    let directAnalysis = false;
    
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
        
        // Log pour vérifier la clé API
        console.log('🔑 Vérification de la clé API:', 
                   process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 
                   'Présente (commence par ' + process.env.NEXT_PUBLIC_OPENAI_API_KEY.substring(0, 3) + '...)' : 
                   'MANQUANTE');
        
        // Utiliser la nouvelle fonction Claude API à la place
        const analysis = await analyzeCVWithClaude(cvFile, jobDetails);
        console.log('✅ Analyse Claude réussie!', analysis);
        
        return {
          ...analysis,
          id: `analysis_${Date.now()}`,
          date: formatDateString(analysis.date),
          userId: auth.currentUser?.uid || 'anonymous',
          jobTitle: data.jobTitle,
          company: data.company
        };
      } catch (error) {
        console.error('❌ Erreur lors de l\'appel à l\'API Claude:', error);
        console.log('Fallback to standard analysis...');
        directAnalysis = false;
      }
    }
    
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
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [userCV, setUserCV] = useState<{ url: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string>('preparing');
  const [loadingMessage, setLoadingMessage] = useState<string>('Preparing to analyze your resume...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

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
# Analyse ATS de CV

## Instructions
Analysez le CV fourni par rapport à la description de poste ci-dessous.
Fournissez une analyse détaillée, précise et véritablement utile de la correspondance entre le CV et les exigences du poste.

## Détails du poste
- Poste: ${jobDetails.jobTitle}
- Entreprise: ${jobDetails.company}
- Description du poste:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## Exigences d'analyse
1. Examinez ATTENTIVEMENT à la fois le CV et la description du poste
2. Fournissez une analyse de correspondance HONNÊTE et PRÉCISE sans gonflement artificiel des scores
3. Variez vos scores de manière significative en fonction de la qualité réelle de la correspondance
4. Identifiez les forces et lacunes SPÉCIFIQUES, pas des conseils génériques

## Format de sortie
Retournez UNIQUEMENT un objet JSON avec la structure suivante:

\`\`\`json
{
  "matchScore": <entier_entre_0_et_100>,
  "keyFindings": [<tableau_de_5-7_constats_clés_spécifiques>],
  "skillsMatch": {
    "matching": [{"name": <nom_compétence>, "relevance": <entier_0-100>}, ...],
    "missing": [{"name": <nom_compétence>, "relevance": <entier_0-100>}, ...],
    "alternative": [{"name": <nom_compétence>, "alternativeTo": <compétence_requise>}, ...]
  },
  "categoryScores": {
    "skills": <entier_entre_0_et_100>,
    "experience": <entier_entre_0_et_100>,
    "education": <entier_entre_0_et_100>,
    "industryFit": <entier_entre_0_et_100>
  },
  "executiveSummary": <résumé_de_la_qualité_globale_de_correspondance>,
  "experienceAnalysis": [
    {"aspect": <nom_aspect>, "analysis": <analyse_détaillée>},
    ...
  ],
  "recommendations": [
    {
      "title": <titre_recommandation>,
      "description": <recommandation_détaillée>,
      "priority": <"high"|"medium"|"low">,
      "examples": <exemple_texte_ou_null>
    },
    ...
  ]
}
\`\`\`

## Directives importantes
- Assurez-vous que les scores soient SIGNIFICATIFS et DIFFÉRENCIÉS (pas regroupés dans la plage 70-80%)
- Attribuez des scores plus bas (30-60%) pour les mauvaises correspondances
- Attribuez des scores plus élevés (80-95%) uniquement pour les correspondances exceptionnellement fortes
- N'INFLATIONNER JAMAIS automatiquement les scores - soyez honnête et précis
- Incluez des MOTS-CLÉS pertinents pour le poste trouvés/manquants dans le CV
- Fournissez des recommandations détaillées et exploitables, spécifiques à ce CV et à ce poste
- Donnez des exemples réels et des solutions dans vos recommandations
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
              content: "Vous êtes un analyste ATS expert et coach de carrière. Votre tâche est de fournir une analyse détaillée, précise et utile de la correspondance entre un CV et une description de poste spécifique."
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

  // Ajouter un composant LoadingScreen minimal sans animation complexe
  const LoadingScreen = () => {
    return (
      <div className="fixed inset-0 bg-purple-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* Logo statique */}
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex gap-2 mb-8">
            {['preparing', 'analyzing', 'matching', 'finalizing'].map((step) => (
              <div 
                key={step} 
                className={`w-3 h-3 rounded-full ${
                  loadingStep === step 
                    ? 'bg-white' 
                    : (Object.keys(loadingMessages).indexOf(step) <= Object.keys(loadingMessages).indexOf(loadingStep)) 
                      ? 'bg-purple-400' 
                      : 'bg-purple-800'
                }`}
              />
            ))}
          </div>
          
          {/* Message statique sans animation */}
          <div className="h-16 flex items-center justify-center mb-6">
            <h2 className="text-xl md:text-2xl font-medium text-center">
              {loadingMessage}
            </h2>
          </div>
          
          {/* Progress bar simple */}
          <div className="w-full h-3 bg-purple-800/50 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-sm font-medium text-purple-200 mb-8">
            {Math.round(loadingProgress)}% Complete
          </p>
          
          <p className="text-xs text-purple-300 mt-4 text-center max-w-xs">
            We're analyzing your resume with Claude AI to provide the most accurate job match insights. 
            This may take a minute...
          </p>
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

  // Modifier la fonction handleAnalysis pour fermer le modal avant d'activer le chargement
  const handleAnalysis = async () => {
    try {
      // Force disable validation to ensure we use the real API
      setValidationOptions({
        disableValidation: true,
        logLevel: 2
      });
      
      console.log("🚀 STARTING ANALYSIS - Validation disabled - Using Claude API for PDF analysis");
      
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

      // Use PDF file for Claude analysis
      if (cvFile && cvFile.type === 'application/pdf') {
        console.log('📄 Using Claude API for PDF analysis:', cvFile.name);
        
        try {
          // Artificial delay for better UX on preparation step (1.5 seconds)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Prepare job details
          const jobDetails = {
            jobTitle: formData.jobTitle || 'Not specified',
            company: formData.company || 'Not specified',
            jobDescription: formData.jobDescription || 'Not provided'
          };
          
          // Get API key safely using Vite's import.meta.env
          const apiKey = window.ENV?.VITE_ANTHROPIC_API_KEY || 
                        import.meta.env.VITE_ANTHROPIC_API_KEY as string;
          
          if (!apiKey) {
            throw new Error('Anthropic API key is missing. Please check your .env file and restart the server');
          }
          
          console.log('📡 Sending request to Claude API for PDF analysis...');
          
          // Update loading step
          setLoadingStep('analyzing');
          
          // Call Claude API with the PDF file
          const analysis = await analyzeCVWithClaude(cvFile, jobDetails);
          
          console.log('✅ Claude analysis successful!', analysis);
          
          // Update loading step
          setLoadingStep('matching');
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
          toast.success('CV analysis with Claude completed!');
        } catch (error: any) {
          console.error('❌ Claude API call failed:', error);
          setIsLoading(false);
          throw new Error(`Claude analysis failed: ${error.message}`);
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

  const steps = [
    {
      title: "Select CV",
      description: "Choose which CV you want to analyze",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {userCV && (
              <button
                onClick={() => {
                  setSelectedCV(userCV.url);
                  setCvFile(null);
                }}
                className={`flex items-center p-4 border-2 rounded-xl transition-all ${
                  selectedCV === userCV.url
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Use Profile CV
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userCV.name}
                  </p>
                </div>
                {selectedCV === userCV.url && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </button>
            )}

            <div
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                cvFile 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Upload New CV
                </h3>
                {cvFile ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cvFile.name} ({(cvFile.size/1024).toFixed(1)} KB)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload a different CV for this analysis
                  </p>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              {cvFile && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </div>
          </div>

          {!selectedCV && !cvFile && (
            <p className="text-sm text-red-500">
              Please select or upload a CV to continue
            </p>
          )}
        </div>
      )
    },
    {
      title: "Job Details",
      description: "Enter the position details you're applying for",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Full Stack Developer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the exact job title for better analysis
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Google"
            />
          </div>
        </div>
      )
    },
    {
      title: "Job Description",
      description: "Paste the job description for analysis",
      content: (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            className="w-full h-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
            placeholder="Copy and paste the complete job description here..."
          />
          <p className="text-xs text-gray-500 mt-2">
            The more detailed the description, the more accurate the analysis. Include required skills, responsibilities, and qualifications.
          </p>
        </div>
      )
    }
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedCV) {
      toast.error('Please select or upload a CV first');
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Call handleAnalysis instead of just closing the modal
      handleAnalysis();
    }
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

  const AnalysisCard = ({ analysis, onDelete }: { analysis: ATSAnalysis, onDelete: (id: string) => void }) => {
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
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6 border border-gray-100 dark:border-gray-700">
        {/* Card Header - Always visible and clickable */}
        <div 
          className="flex items-center p-6 cursor-pointer relative group"
          onClick={toggleExpand}
        >
          <div className="mr-5 transition-transform duration-300 group-hover:scale-105">
            <CircularProgressWithCenterText 
              value={analysis.matchScore} 
              size={80} 
              strokeWidth={8}
              textSize="text-xl font-bold"
              colorClass={getScoreColorClass(analysis.matchScore)}
            />
          </div>
          
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {analysis.jobTitle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {analysis.company} • <span className="text-gray-500 dark:text-gray-500">{formatDate(analysis.date)}</span>
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {analysis.skillsMatch.matching.slice(0, 2).map((skill, idx) => (
                    <SkillTag key={idx} skill={skill.name} matched={true} relevance={skill.relevance} />
                  ))}
                  {analysis.skillsMatch.missing.slice(0, 1).map((skill, idx) => (
                    <SkillTag key={idx} skill={skill.name} matched={false} relevance={skill.relevance} />
                  ))}
                  {(analysis.skillsMatch.matching.length > 2 || analysis.skillsMatch.missing.length > 1) && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 rounded-full ml-1">+{analysis.skillsMatch.matching.length + analysis.skillsMatch.missing.length - 3} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <p className="text-xs text-gray-500 mr-3">{formatDate(analysis.date)}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                  className="ml-3 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Confirmation Dialog for Delete */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Overlay 
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-auto p-6"
            >
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Deletion
              </Dialog.Title>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete this analysis for "{analysis.jobTitle}" at {analysis.company}? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        </Dialog>
        
        {/* Category Scores */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/40 dark:to-gray-800/10">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <ChartBarIcon className="h-4 w-4 text-purple-500" />
                Category Scores
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ScoreCard
                  title="Skills"
                  score={analysis.categoryScores.skills}
                  icon={<PuzzlePieceIcon className="h-5 w-5" />}
                  description={getScoreExplanation("Skills", analysis.categoryScores.skills)}
                />
                <ScoreCard
                  title="Experience"
                  score={analysis.categoryScores.experience}
                  icon={<BriefcaseIcon className="h-5 w-5" />}
                  description={getScoreExplanation("Experience", analysis.categoryScores.experience)}
                />
                <ScoreCard
                  title="Education"
                  score={analysis.categoryScores.education}
                  icon={<AcademicCapIcon className="h-5 w-5" />}
                  description={getScoreExplanation("Education", analysis.categoryScores.education)}
                />
                <ScoreCard
                  title="Industry"
                  score={analysis.categoryScores.industryFit}
                  icon={<BuildingOfficeIcon className="h-5 w-5" />}
                  description={getScoreExplanation("Industry", analysis.categoryScores.industryFit)}
                />
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Executive Summary */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-5 border-t border-gray-100 dark:border-gray-700"
          >
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 inline" />
                Executive Summary
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.executiveSummary}
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Accordion Sections */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="px-5 pb-5"
          >
            {/* Skills and Technologies */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('skills')}
                className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
              >
                <SectionTitle 
                  icon={<PuzzlePieceIcon className="h-5 w-5 text-purple-500" />} 
                  title="Skills and Technologies" 
                />
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'skills' ? 'transform rotate-180' : ''}`} />
              </button>
              
              {expandedSection === 'skills' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Matching Skills</h3>
                    <div className="flex flex-wrap">
                      {analysis.skillsMatch.matching.map((skill, idx) => (
                        <SkillTag key={idx} skill={skill.name} matched={true} relevance={skill.relevance} />
                      ))}
                      {analysis.skillsMatch.matching.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 italic">No matching skills found.</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Missing Skills 
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                        (Skills mentioned in the job description but not found in your CV)
                      </span>
                    </h3>
                    <div className="flex flex-wrap">
                      {analysis.skillsMatch.missing.map((skill, idx) => (
                        <SkillTag key={idx} skill={skill.name} matched={false} relevance={skill.relevance} />
                      ))}
                      {analysis.skillsMatch.missing.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 italic">Great! No missing skills detected.</p>
                      )}
                    </div>
                  </div>
                
                  {analysis.skillsMatch.alternative.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Alternative Skills</h3>
                      <div className="flex flex-wrap">
                        {analysis.skillsMatch.alternative.map((skill, idx) => (
                          <div key={idx} className="flex items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border border-blue-100 dark:border-blue-800/30 rounded-full px-3 py-1 mr-2 mb-2">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">{skill.name}</span>
                            <span className="mx-1 text-gray-400">→</span>
                            <span className="text-gray-600 dark:text-gray-300 text-sm">{skill.alternativeTo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            
            {/* Experience Analysis */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('experience')}
                className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
              >
                <SectionTitle 
                  icon={<BriefcaseIcon className="h-5 w-5 text-purple-500" />} 
                  title="Experience Analysis" 
                />
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'experience' ? 'transform rotate-180' : ''}`} />
              </button>
              
              {expandedSection === 'experience' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  {analysis.experienceAnalysis.map((item, idx) => (
                    <div key={idx} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{item.aspect}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.analysis}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Recommendations */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
              >
                <SectionTitle 
                  icon={<Lightbulb className="h-5 w-5 text-purple-500" />} 
                  title="Recommendations" 
                />
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'recommendations' ? 'transform rotate-180' : ''}`} />
              </button>
              
              {expandedSection === 'recommendations' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 grid gap-4"
                >
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="relative overflow-hidden group">
                      <div className={`
                        absolute top-0 left-0 h-full w-1 rounded-full
                        ${rec.priority === 'high' ? 'bg-gradient-to-b from-red-400 to-red-600' : 
                          rec.priority === 'medium' ? 'bg-gradient-to-b from-orange-400 to-orange-600' : 
                          'bg-gradient-to-b from-blue-400 to-blue-600'}
                      `}></div>
                      <div className="p-4 pl-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:translate-x-1">
                        <div className="flex items-center mb-2">
                          <div className={`
                            mr-2 p-1.5 rounded-lg
                            ${rec.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                              rec.priority === 'medium' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}
                          `}>
                            {rec.priority === 'high' ? 
                              <FireIcon className="h-4 w-4" /> : 
                              rec.priority === 'medium' ? 
                              <ExclamationTriangleIcon className="h-4 w-4" /> : 
                              <InformationCircleIcon className="h-4 w-4" />
                            }
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{rec.title}</h4>
                          <span className={`
                            ml-2 px-2 py-0.5 text-xs rounded-full
                            ${rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                              rec.priority === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
                          `}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.description}</p>
                        {rec.examples && (
                          <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
                            <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                              <CodeBracketIcon className="h-3 w-3 mr-1" />
                              Example
                            </h5>
                            <p className="text-sm italic text-gray-700 dark:text-gray-300">{rec.examples}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Key Findings */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('findings')}
                className="w-full flex justify-between items-center py-3 text-left focus:outline-none"
              >
                <SectionTitle 
                  icon={<MagnifyingGlassIcon className="h-5 w-5 text-purple-500" />} 
                  title="Key Findings" 
                />
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'findings' ? 'transform rotate-180' : ''}`} />
              </button>
              
              {expandedSection === 'findings' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <ul className="space-y-2">
                    {analysis.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 dark:text-green-400 mr-2 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{finding}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
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
        onClick={() => fileInputRef.current?.click()}
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
              toast.success('Resume selected successfully');
            }
          }}
          accept=".pdf"
          className="hidden"
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
    // Arrondir la valeur pour le calcul du cercle progressif
    const roundedValue = Math.round(value);
    const strokeDashoffset = circumference - (roundedValue / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 2px rgba(var(--shadow-color, 0, 0, 0), 0.1))' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${textSize} ${colorClass}`}>{roundedValue}%</span>
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
    <span 
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-sm ${
        matched 
          ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-900/30 dark:to-green-800/40 dark:text-green-300 border border-green-200/50 dark:border-green-700/30' 
          : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 dark:from-red-900/30 dark:to-red-800/40 dark:text-red-300 border border-red-200/50 dark:border-red-700/30'
      }`}
    >
      {skill}{relevance ? ` (${relevance}%)` : ''}
    </span>
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

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                  ATS Resume Analysis
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Get detailed insights on how your resume matches specific job positions. Improve your chances with AI-powered recommendations.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200 transform hover:scale-105 shadow-sm flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              New Analysis
            </button>
          </div>

          {/* List of analyses */}
          <div className="mt-8 space-y-6">
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} onDelete={deleteAnalysis} />
            ))}
            
            {analyses.length === 0 && (
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
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="h-5 w-5" />
                  Start your first analysis
                </button>
              </div>
            )}
          </div>
        </div>
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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-auto p-6 md:p-8 overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {steps[currentStep - 1].title}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {steps[currentStep - 1].description}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="max-h-[70vh] overflow-y-auto pr-1 -mr-1 mb-6">
                  {currentStep === 1 && renderFileUpload()}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Full Stack Developer"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the exact job title for better analysis
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Google"
                        />
                      </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Job Description
                      </label>
                      <textarea
                        value={formData.jobDescription}
                        onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                        className="w-full h-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                        placeholder="Copy and paste the complete job description here..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        The more detailed the description, the more accurate the analysis. Include required skills, responsibilities, and qualifications.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentStep < steps.length) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        // Call handleAnalysis instead of just closing the modal
                        handleAnalysis();
                      }
                    }}
                    className={`px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium flex items-center ${
                      (currentStep === 1 && !cvFile) || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={(currentStep === 1 && !cvFile) || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analysis in progress...
                      </>
                    ) : (
                      <>
                        {currentStep === steps.length ? 'Analyze' : 'Next'}
                        {currentStep < steps.length && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </>
                    )}
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