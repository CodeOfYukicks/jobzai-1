import { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Eye, Zap, MoreHorizontal, Copy, MapPin, Image, Camera
} from 'lucide-react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import AuthLayout from '../components/AuthLayout';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { getDoc, doc, setDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { JobApplication } from '../types/job';
import { getDownloadURL, ref, getStorage, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { notify } from '@/lib/notify';
import { db, storage, auth } from '../lib/firebase';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
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
// Import Premium ATS Analysis (new elite-level analysis)
import { pdfToBase64Images, analyzePDFWithPremiumATS } from '../lib/premiumATSAnalysis';
// Add this import
import CVSelectionModal from '../components/CVSelectionModal';
import PremiumPDFViewer from '../components/resume-builder/PremiumPDFViewer';
import { ImportedDocument } from '../components/resume-builder/PDFPreviewCard';
import { Resume } from './ResumeBuilderPage';
import jsPDF from 'jspdf';
// Import Perplexity for job extraction
import { queryPerplexityForJobExtraction } from '../lib/perplexity';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';

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
  _isLoading?: boolean; // Flag pour identifier les analyses en cours
  _premiumAnalysis?: any; // Store full premium analysis data
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

// FEATURE 1: Extract employment experiences with dates from CV text
interface EmploymentExperience {
  title: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  context: 'professional' | 'project' | 'education' | 'volunteer' | 'unknown';
}

const extractEmploymentExperiences = (cvText: string): EmploymentExperience[] => {
  const experiences: EmploymentExperience[] = [];
  const lines = cvText.split('\n');

  // Patterns to detect experience sections
  const experienceSectionMarkers = [
    /^(experience|work experience|employment|professional experience|career|career history)/i,
    /^(work|employment|professional)/i
  ];

  // Patterns to detect dates (various formats)
  const datePatterns = [
    /(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|present|current|actuel|présent)/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*[-–—]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|present|current)/i,
    /(\d{4})\s*[-–—]\s*(\d{4}|present|current)/i
  ];

  let inExperienceSection = false;
  let currentExp: Partial<EmploymentExperience> | null = null;
  let currentDescription: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if we're entering an experience section
    if (experienceSectionMarkers.some(pattern => pattern.test(line))) {
      inExperienceSection = true;
      continue;
    }

    // Check if we're leaving experience section (entering education, skills, etc.)
    if (/^(education|skills|projects|certifications|awards|hobbies|interests|references)/i.test(line)) {
      if (currentExp) {
        experiences.push({
          ...currentExp as EmploymentExperience,
          description: currentDescription.join(' '),
          context: determineContext(currentExp.title || '', currentExp.company || '', currentDescription.join(' '))
        });
        currentExp = null;
        currentDescription = [];
      }
      inExperienceSection = false;
      continue;
    }

    if (inExperienceSection || i < lines.length * 0.6) { // Focus on first 60% of CV (usually experience section)
      // Try to extract date patterns
      let dateFound = false;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateFound = true;
          // If we have a current experience, finalize it
          if (currentExp && (currentExp.startDate || currentExp.endDate)) {
            experiences.push({
              ...currentExp as EmploymentExperience,
              description: currentDescription.join(' '),
              context: determineContext(currentExp.title || '', currentExp.company || '', currentDescription.join(' '))
            });
          }

          // Start new experience
          const startDate = match[1];
          const endDate = match[2] || match[3] || 'present';
          const isCurrent = /present|current|actuel|présent/i.test(endDate);

          // Try to extract title and company from surrounding lines
          const prevLine = i > 0 ? lines[i - 1].trim() : '';
          const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

          let title = '';
          let company = '';

          // Pattern: "Title - Company" or "Title at Company"
          if (prevLine) {
            const titleCompanyMatch = prevLine.match(/^(.+?)\s*(?:[-–—]|at)\s*(.+)$/);
            if (titleCompanyMatch) {
              title = titleCompanyMatch[1].trim();
              company = titleCompanyMatch[2].trim();
            } else {
              title = prevLine;
            }
          }

          if (!company && nextLine && !datePatterns.some(p => p.test(nextLine))) {
            company = nextLine;
          }

          currentExp = {
            title: title || 'Unknown Position',
            company: company || 'Unknown Company',
            startDate: normalizeDateString(startDate),
            endDate: normalizeDateString(endDate),
            isCurrent
          };
          currentDescription = [];
          break;
        }
      }

      // If no date found but we have a current experience, collect description
      if (!dateFound && currentExp) {
        // Check if this looks like a bullet point or description
        if (line.match(/^[-•*]\s+/) || line.length > 20) {
          currentDescription.push(line);
        }
      }
    }
  }

  // Add last experience if exists
  if (currentExp) {
    experiences.push({
      ...currentExp as EmploymentExperience,
      description: currentDescription.join(' '),
      context: determineContext(currentExp.title || '', currentExp.company || '', currentDescription.join(' '))
    });
  }

  return experiences;
};

// Normalize date strings to YYYY-MM format for easier calculation
const normalizeDateString = (dateStr: string): string | null => {
  if (!dateStr || /present|current|actuel|présent/i.test(dateStr)) {
    return null; // Will be treated as current date
  }

  // Try to parse various formats
  // Format: "Jan 2020" or "January 2020"
  const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    const monthNames: { [key: string]: string } = {
      'jan': '01', 'january': '01', 'janvier': '01',
      'feb': '02', 'february': '02', 'février': '02',
      'mar': '03', 'march': '03', 'mars': '03',
      'apr': '04', 'april': '04', 'avril': '04',
      'may': '05', 'mai': '05',
      'jun': '06', 'june': '06', 'juin': '06',
      'jul': '07', 'july': '07', 'juillet': '07',
      'aug': '08', 'august': '08', 'août': '08',
      'sep': '09', 'september': '09', 'septembre': '09',
      'oct': '10', 'october': '10', 'octobre': '10',
      'nov': '11', 'november': '11', 'novembre': '11',
      'dec': '12', 'december': '12', 'décembre': '12'
    };
    const month = monthNames[monthYearMatch[1].toLowerCase().substring(0, 3)];
    const year = monthYearMatch[2];
    if (month) return `${year}-${month}`;
  }

  // Format: "2020" or "2020-01"
  const yearMatch = dateStr.match(/(\d{4})(?:-(\d{1,2}))?/);
  if (yearMatch) {
    const year = yearMatch[1];
    const month = yearMatch[2] ? yearMatch[2].padStart(2, '0') : '01';
    return `${year}-${month}`;
  }

  return null;
};

// FEATURE 2: Determine context of experience (professional vs project vs education)
const determineContext = (title: string, company: string, description: string): 'professional' | 'project' | 'education' | 'volunteer' | 'unknown' => {
  const titleLower = title.toLowerCase();
  const companyLower = company.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = `${titleLower} ${companyLower} ${descLower}`;

  // Education indicators
  if (
    /university|college|school|student|internship|stage|stagiare|étudiant|baccalauréat|master|phd|doctorate|diploma|degree/i.test(combined) ||
    titleLower.includes('student') || titleLower.includes('intern')
  ) {
    return 'education';
  }

  // Project indicators
  if (
    /project|projet|personal|personnel|side|freelance|freelancing|github|portfolio|open source|open-source/i.test(combined) ||
    titleLower.includes('project') || titleLower.includes('developer') && companyLower.includes('personal')
  ) {
    return 'project';
  }

  // Volunteer indicators
  if (
    /volunteer|bénévolat|non-profit|nonprofit|ngo|charity|charité/i.test(combined) ||
    titleLower.includes('volunteer')
  ) {
    return 'volunteer';
  }

  // Professional indicators (default if company name exists and not education/project)
  if (company && company.length > 2 && !/university|college|school|project|personal/i.test(combined)) {
    return 'professional';
  }

  return 'unknown';
};

// Calculate actual years of experience with a specific skill based on employment dates
const calculateSkillExperienceYears = (
  skill: string,
  experiences: EmploymentExperience[]
): number => {
  const skillVariations: string[] = [skill.toLowerCase()];

  // Add variations
  if (skill.includes('python')) skillVariations.push('python', 'py', 'python3');
  if (skill.includes('machine learning') || skill.includes('ml')) {
    skillVariations.push('machine learning', 'ml', 'machine-learning', 'deep learning', 'neural network');
  }
  if (skill.includes('sql')) skillVariations.push('sql', 'mysql', 'postgresql');
  if (skill.includes('javascript')) skillVariations.push('javascript', 'js', 'node', 'nodejs');

  let totalMonths = 0;
  const now = new Date();

  experiences.forEach(exp => {
    // Check if skill is mentioned in this experience
    const expText = `${exp.title} ${exp.company} ${exp.description}`.toLowerCase();
    const skillMentioned = skillVariations.some(variation => {
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(expText);
    });

    if (!skillMentioned) return;

    // Calculate months for this experience
    if (!exp.startDate) return;

    const startParts = exp.startDate.split('-');
    if (startParts.length !== 2) return;

    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
    let end: Date;

    if (exp.isCurrent || !exp.endDate) {
      end = now;
    } else {
      const endParts = exp.endDate.split('-');
      if (endParts.length !== 2) {
        end = now;
      } else {
        end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, 1);
      }
    }

    if (end >= start) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  });

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
};

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

// ============================================
// NOUVEAU SYSTÈME DE SCORING AVANCÉ
// ============================================

// Fonction pour analyser la progression de carrière
const analyzeCareerProgression = (experiences: EmploymentExperience[]): number => {
  if (experiences.length < 2) return 50; // Pas assez de données

  const professionalExp = experiences.filter(e => e.context === 'professional');
  if (professionalExp.length < 2) return 50;

  // Analyser les titres pour détecter une progression
  const seniorityLevels: { [key: string]: number } = {
    'intern': 1,
    'junior': 2,
    'associate': 2,
    'developer': 3,
    'engineer': 3,
    'analyst': 3,
    'specialist': 4,
    'senior': 5,
    'lead': 6,
    'principal': 6,
    'architect': 7,
    'manager': 7,
    'director': 8,
    'head': 8,
    'vp': 9,
    'vice president': 9,
    'chief': 10,
    'cto': 10,
    'ceo': 10
  };

  const levels = professionalExp.map(exp => {
    const titleLower = exp.title.toLowerCase();
    for (const [keyword, level] of Object.entries(seniorityLevels)) {
      if (titleLower.includes(keyword)) {
        return level;
      }
    }
    return 3; // Default mid-level
  });

  // Vérifier si c'est une progression ascendante
  let progressionScore = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1]) {
      progressionScore += 20; // Progression positive
    } else if (levels[i] < levels[i - 1]) {
      progressionScore -= 10; // Rétrogradation
    }
  }

  return Math.max(0, Math.min(100, 50 + progressionScore));
};

// Fonction pour analyser l'optimisation ATS
const analyzeATSOptimization = (cvText: string): number => {
  let score = 50; // Base

  // Vérifier la structure (sections communes)
  const sections = ['experience', 'education', 'skills', 'summary', 'objective'];
  const foundSections = sections.filter(section =>
    cvText.toLowerCase().includes(section)
  );
  score += (foundSections.length / sections.length) * 20;

  // Vérifier la longueur (optimal: 1-2 pages = ~400-800 mots)
  const wordCount = cvText.split(/\s+/).length;
  if (wordCount >= 400 && wordCount <= 800) {
    score += 15;
  } else if (wordCount < 300) {
    score -= 10; // Trop court
  } else if (wordCount > 1200) {
    score -= 5; // Trop long
  }

  // Vérifier les verbes d'action
  const actionVerbs = ['achieved', 'delivered', 'improved', 'increased', 'managed', 'led', 'created', 'developed'];
  const hasActionVerbs = actionVerbs.some(verb => cvText.toLowerCase().includes(verb));
  if (hasActionVerbs) score += 10;

  // Vérifier la présence de chiffres (quantification)
  const hasNumbers = /\d+/.test(cvText);
  if (hasNumbers) score += 5;

  return Math.max(0, Math.min(100, score));
};

// Fonction pour calculer la densité optimale de keywords
const calculateOptimalKeywordDensity = (
  cvText: string,
  jobKeywords: Array<{ keyword: string; frequency: number; context: string }>
): number => {
  const cvWords = cvText.toLowerCase().split(/\s+/);
  const totalWords = cvWords.length;

  if (totalWords === 0) return 0;

  // Compter les occurrences des keywords importants
  let keywordCount = 0;
  jobKeywords
    .filter(kw => kw.context === 'requirement' || kw.context === 'preferred')
    .forEach(kw => {
      const regex = new RegExp(`\\b${kw.keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      keywordCount += (cvText.toLowerCase().match(regex) || []).length;
    });

  // Densité optimale: 2-5% des mots sont des keywords importants
  const density = (keywordCount / totalWords) * 100;

  if (density >= 2 && density <= 5) {
    return 100; // Optimal
  } else if (density < 2) {
    return Math.max(0, density * 50); // Trop peu
  } else {
    return Math.max(0, 100 - (density - 5) * 10); // Trop (keyword stuffing)
  }
};

// Fonction pour calculer le score d'éducation
const calculateEducationScore = (cvText: string, jobDescription: string): number => {
  const educationTerms = ['degree', 'bachelor', 'master', 'phd', 'mba', 'certification', 'diploma', 'university', 'college'];
  const jobHasEducation = educationTerms.some(term => jobDescription.toLowerCase().includes(term));

  if (!jobHasEducation) {
    return 50; // Pas d'exigence = score vraiment neutre (pas optimiste)
  }

  const cvHasEducation = educationTerms.some(term => cvText.toLowerCase().includes(term));
  if (!cvHasEducation) {
    return 20; // Exigence mais pas trouvé
  }

  // Vérifier la correspondance exacte
  const jobEducation = educationTerms.filter(term => jobDescription.toLowerCase().includes(term));
  const cvEducation = educationTerms.filter(term => cvText.toLowerCase().includes(term));

  const matchRatio = jobEducation.filter(j => cvEducation.includes(j)).length / Math.max(1, jobEducation.length);

  return Math.round(50 + matchRatio * 50);
};

// Fonction pour calculer le score d'industry fit
const calculateIndustryFitScore = (cvText: string, jobDescription: string, company: string): number => {
  let score = 50; // Base

  // Domain keywords du job
  const domainKeywords = extractKeywords(jobDescription)
    .filter(kw => {
      const kwLower = kw.toLowerCase();
      return !['years', 'experience', 'required', 'must', 'have', 'skills'].includes(kwLower) &&
        kw.length > 4;
    });

  const domainMatches = domainKeywords.filter(kw =>
    cvText.toLowerCase().includes(kw.toLowerCase())
  ).length;

  score += (domainMatches / Math.max(1, domainKeywords.length)) * 40;

  // Mention de la company
  if (company && cvText.toLowerCase().includes(company.toLowerCase())) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

// Fonction pour calculer les pénalités critiques
const calculateCriticalPenalty = (
  criticalRequirements: Array<{ years: number, skill: string }>,
  employmentExperiences: EmploymentExperience[],
  cvText: string
): number => {
  if (criticalRequirements.length === 0) return 0;

  let missingCount = 0;
  criticalRequirements.forEach(({ years, skill }) => {
    const actualYears = calculateSkillExperienceYears(skill, employmentExperiences);
    const professionalExp = employmentExperiences.filter(e =>
      e.context === 'professional' &&
      `${e.title} ${e.company} ${e.description}`.toLowerCase().includes(skill)
    );
    const professionalYears = calculateSkillExperienceYears(skill, professionalExp);
    const effectiveYears = years >= 5 ? professionalYears : actualYears;

    if (effectiveYears < years) {
      missingCount++;
    }
  });

  const missingRatio = missingCount / criticalRequirements.length;

  // Pénalités sévères et différenciantes
  if (missingRatio >= 1.0) return 85; // ÉNORME pénalité - presque tout le score perdu
  if (missingRatio >= 0.75) return 65; // 75% manquants - très pénalisant
  if (missingRatio >= 0.5) return 45;  // 50% manquants
  if (missingRatio >= 0.25) return 30; // 25% manquants
  if (missingRatio > 0) return 15;     // Quelques manquants

  return 0; // Tous présents
};

// NOUVELLE FONCTION: Calcul de score amélioré avec différenciation qualitative
const calculateAdvancedMatchScore = (
  cvText: string,
  jobDescription: string,
  jobTitle: string,
  company: string,
  employmentExperiences: EmploymentExperience[]
): {
  matchScore: number;
  categoryScores: { skills: number; experience: number; education: number; industryFit: number };
  qualityFactors: {
    keywordDensity: number;
    achievementQuantification: number;
    careerProgression: number;
    atsOptimization: number;
  };
} => {
  const cvTextLower = cvText.toLowerCase();
  const jobDescLower = jobDescription.toLowerCase();

  // ============================================
  // 1. ANALYSE QUALITATIVE DES KEYWORDS
  // ============================================

  // Extraire keywords avec leur contexte et importance
  const extractKeywordsWithContext = (text: string) => {
    const keywords = extractKeywords(text);
    const keywordsWithContext: Array<{
      keyword: string;
      frequency: number;
      context: 'requirement' | 'preferred' | 'nice-to-have' | 'general';
      position: number; // Position dans le texte (0-1)
    }> = [];

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const matches = [...text.toLowerCase().matchAll(new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'))];
      const frequency = matches.length;

      // Déterminer le contexte
      let context: 'requirement' | 'preferred' | 'nice-to-have' | 'general' = 'general';
      matches.forEach(match => {
        const start = Math.max(0, match.index! - 100);
        const end = Math.min(text.length, match.index! + match[0].length + 100);
        const contextText = text.substring(start, end).toLowerCase();

        if (contextText.match(/\b(required|must|essential|mandatory|critical)\b/)) {
          context = 'requirement';
        } else if (contextText.match(/\b(preferred|nice to have|bonus|plus)\b/)) {
          context = 'nice-to-have';
        } else if (contextText.match(/\b(strong|extensive|significant|proven)\b/)) {
          context = 'preferred';
        }
      });

      // Position moyenne dans le texte
      const avgPosition = matches.reduce((sum, m) => sum + (m.index! / text.length), 0) / matches.length;

      keywordsWithContext.push({
        keyword,
        frequency,
        context,
        position: avgPosition
      });
    });

    return keywordsWithContext;
  };

  const jobKeywordsWithContext = extractKeywordsWithContext(jobDescription);
  const cvKeywordsWithContext = extractKeywordsWithContext(cvText);

  // Calculer le score de matching avec pondération qualitative
  let skillsScore = 0;
  let totalWeight = 0;
  let matchedWeight = 0;

  jobKeywordsWithContext.forEach(jobKw => {
    const weight =
      (jobKw.context === 'requirement' ? 3.0 :
        jobKw.context === 'preferred' ? 2.0 :
          jobKw.context === 'nice-to-have' ? 0.5 : 1.0) *
      (1 + Math.log(jobKw.frequency + 1)) * // Plus de mentions = plus important
      (jobKw.position < 0.3 ? 1.2 : 1.0); // Mentionné tôt = plus important

    totalWeight += weight;

    // Chercher dans le CV avec analyse qualitative
    const cvMatch = cvKeywordsWithContext.find(cvKw =>
      cvKw.keyword.toLowerCase() === jobKw.keyword.toLowerCase() ||
      cvKw.keyword.toLowerCase().includes(jobKw.keyword.toLowerCase()) ||
      jobKw.keyword.toLowerCase().includes(cvKw.keyword.toLowerCase())
    );

    if (cvMatch) {
      // Score basé sur la fréquence et le contexte dans le CV
      const cvWeight =
        (cvMatch.frequency > 1 ? 1.0 + Math.log(cvMatch.frequency) * 0.3 : 1.0) *
        (cvMatch.position < 0.3 ? 1.1 : 1.0); // Mentionné tôt = mieux

      matchedWeight += weight * Math.min(1.0, cvWeight);
    }
  });

  skillsScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

  // ============================================
  // 2. ANALYSE QUALITATIVE DE L'EXPÉRIENCE
  // ============================================

  let experienceScore = 0;

  // Analyser les années d'expérience avec contexte professionnel
  const specificExpPatterns = [
    /(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
    /over\s+(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
    /(\d+)[\+]?\s+years?[^.]*?(?:building|developing|coding|working|with|in)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
  ];

  const criticalRequirements: Array<{ years: number, skill: string }> = [];
  specificExpPatterns.forEach(pattern => {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(jobDescription)) !== null) {
      const years = parseInt(match[1], 10);
      let skill = match[2].trim().toLowerCase();
      skill = skill.replace(/\b(experience|with|in|of|using|working|building|developing|coding|models?|systems?|platforms?|applications?|solutions?)\b/g, '').trim();
      if (skill && skill.length > 2) {
        criticalRequirements.push({ years, skill });
      }
    }
  });

  // Calculer le score d'expérience avec analyse qualitative
  if (criticalRequirements.length > 0) {
    let totalExpScore = 0;
    criticalRequirements.forEach(({ years, skill }) => {
      const actualYears = calculateSkillExperienceYears(skill, employmentExperiences);
      const professionalExp = employmentExperiences.filter(e =>
        e.context === 'professional' &&
        `${e.title} ${e.company} ${e.description}`.toLowerCase().includes(skill)
      );
      const professionalYears = calculateSkillExperienceYears(skill, professionalExp);

      const effectiveYears = years >= 5 ? professionalYears : actualYears;

      if (effectiveYears >= years) {
        // Bonus si dépasse les exigences
        const excessRatio = Math.min((effectiveYears - years) / years, 0.5); // Max 50% bonus
        totalExpScore += 100 + (excessRatio * 50);
      } else if (effectiveYears >= years * 0.8) {
        // Proche mais pas tout à fait
        totalExpScore += 70 + ((effectiveYears - years * 0.8) / (years * 0.2)) * 20;
      } else if (effectiveYears >= years * 0.5) {
        // Moitié des exigences
        totalExpScore += 40 + ((effectiveYears - years * 0.5) / (years * 0.3)) * 30;
      } else if (effectiveYears > 0) {
        // Quelque expérience mais insuffisante
        totalExpScore += (effectiveYears / years) * 30;
      }
      // 0 si aucune expérience
    });

    experienceScore = criticalRequirements.length > 0 ? totalExpScore / criticalRequirements.length : 0;
  } else {
    // Pas d'exigences spécifiques, analyser l'expérience générale
    const totalYears = employmentExperiences
      .filter(e => e.context === 'professional')
      .reduce((sum, e) => {
        if (!e.startDate) return sum;
        const start = new Date(parseInt(e.startDate.split('-')[0]), parseInt(e.startDate.split('-')[1]) - 1);
        const end = e.isCurrent ? new Date() : (e.endDate ? new Date(parseInt(e.endDate.split('-')[0]), parseInt(e.endDate.split('-')[1]) - 1) : new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return sum + Math.max(0, months);
      }, 0) / 12;

    // Analyser la progression de carrière
    const progressionScore = analyzeCareerProgression(employmentExperiences);

    experienceScore = Math.min(100, (totalYears / 10) * 50 + progressionScore * 50);
  }

  // ============================================
  // 3. ANALYSE DE LA QUALITÉ DU CV
  // ============================================

  // Quantification des achievements
  const achievementPatterns = [
    /\b(increased|improved|reduced|decreased|achieved|delivered|managed|led|grew|optimized|saved|generated|built|created|developed)\b[^.!?]*?(\d+[%]?|[0-9,]+)\b/gi,
    /\b(\d+[%]?|[0-9,]+)\s*(increase|decrease|improvement|reduction|growth|users|customers|revenue|sales|efficiency|performance)\b/gi,
  ];

  let quantifiedAchievements = 0;
  let totalAchievements = 0;

  achievementPatterns.forEach(pattern => {
    const matches = [...cvText.matchAll(pattern)];
    quantifiedAchievements += matches.length;
  });

  // Compter les verbes d'action (achievements potentiels)
  const actionVerbs = ['achieved', 'delivered', 'improved', 'increased', 'reduced', 'managed', 'led', 'created', 'developed', 'built', 'implemented', 'optimized', 'designed', 'launched'];
  actionVerbs.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    totalAchievements += (cvText.match(regex) || []).length;
  });

  const achievementQuantification = totalAchievements > 0
    ? Math.min(100, (quantifiedAchievements / totalAchievements) * 100)
    : 0;

  // Progression de carrière
  const careerProgression = analyzeCareerProgression(employmentExperiences);

  // ATS Optimization (formatting, structure)
  const atsOptimization = analyzeATSOptimization(cvText);

  // Keyword density (pas trop, pas trop peu)
  const keywordDensity = calculateOptimalKeywordDensity(cvText, jobKeywordsWithContext);

  // ============================================
  // 4. CALCUL DU SCORE GLOBAL AVEC PONDÉRATION
  // ============================================

  // Score de base avec facteurs de qualité
  const qualityMultiplier =
    (achievementQuantification * 0.25 +
      careerProgression * 0.25 +
      atsOptimization * 0.25 +
      keywordDensity * 0.25) / 100;

  // Score ajusté avec facteurs de qualité (0.7 à 1.3)
  const adjustedSkillsScore = skillsScore * (0.7 + qualityMultiplier * 0.6);
  const adjustedExperienceScore = experienceScore * (0.7 + qualityMultiplier * 0.6);

  // Score d'éducation (simplifié mais différenciant)
  const educationScore = calculateEducationScore(cvText, jobDescription);

  // Score d'industry fit
  const industryFitScore = calculateIndustryFitScore(cvText, jobDescription, company);

  // Score global avec pondération intelligente
  const baseMatchScore =
    (adjustedSkillsScore * 0.35) +      // Compétences (35%)
    (adjustedExperienceScore * 0.30) +   // Expérience (30%)
    (educationScore * 0.15) +            // Éducation (15%)
    (industryFitScore * 0.20);           // Industry fit (20%)

  // Appliquer des pénalités sévères pour les exigences critiques manquantes
  const criticalPenalty = calculateCriticalPenalty(
    criticalRequirements,
    employmentExperiences,
    cvText
  );

  const finalMatchScore = Math.max(0, Math.min(100, baseMatchScore - criticalPenalty));

  return {
    matchScore: Math.round(finalMatchScore),
    categoryScores: {
      skills: Math.round(Math.max(0, Math.min(100, adjustedSkillsScore))),
      experience: Math.round(Math.max(0, Math.min(100, adjustedExperienceScore))),
      education: Math.round(Math.max(0, Math.min(100, educationScore))),
      industryFit: Math.round(Math.max(0, Math.min(100, industryFitScore)))
    },
    qualityFactors: {
      keywordDensity: Math.round(keywordDensity),
      achievementQuantification: Math.round(achievementQuantification),
      careerProgression: Math.round(careerProgression),
      atsOptimization: Math.round(atsOptimization)
    }
  };
};

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
    let relevance = 50; // Base neutre, pas optimiste

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

  // CRITICAL: Detect SPECIFIC experience requirements (e.g., "5 years experience with Python")
  // This is much more important than general experience years
  const specificExpMatches: Array<{ years: number, skill: string }> = [];

  // Pattern 1: "5 years experience with Python" or "5 years of experience with Python"
  const pattern1 = /(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi;
  let match;
  while ((match = pattern1.exec(jobDesc)) !== null) {
    const years = parseInt(match[1], 10);
    let skill = match[2].trim().toLowerCase();
    // Clean up the skill
    skill = skill.replace(/\b(experience|with|in|of|using|working|building|developing|coding)\b/g, '').trim();
    if (skill && skill.length > 2) {
      specificExpMatches.push({ years, skill });
    }
  }

  // Pattern 2: "Over 5 years of experience with Python" or "Over 5 years experience with Python"
  const pattern2 = /over\s+(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi;
  while ((match = pattern2.exec(jobDesc)) !== null) {
    const years = parseInt(match[1], 10);
    let skill = match[2].trim().toLowerCase();
    skill = skill.replace(/\b(experience|with|in|of|using|working|building|developing|coding)\b/g, '').trim();
    if (skill && skill.length > 2 && !specificExpMatches.some(m => m.years === years && m.skill === skill)) {
      specificExpMatches.push({ years, skill });
    }
  }

  // Pattern 3: "5+ years Python" or "5+ years of Python" (simpler pattern)
  const pattern3 = /(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  while ((match = pattern3.exec(jobDesc)) !== null) {
    const years = parseInt(match[1], 10);
    let skill = match[2].trim().toLowerCase();
    // Skip if it's just "experience" or "years"
    if (skill && skill.length > 2 &&
      !['experience', 'years', 'working', 'building'].includes(skill) &&
      !specificExpMatches.some(m => m.years === years && m.skill === skill)) {
      specificExpMatches.push({ years, skill });
    }
  }

  // Pattern 4: "5 years building ML models" or "5 years building machine learning models"
  const pattern4 = /(\d+)[\+]?\s+years?[^.]*?(?:building|developing|coding|working|with|in)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi;
  while ((match = pattern4.exec(jobDesc)) !== null) {
    const years = parseInt(match[1], 10);
    let skill = match[2].trim().toLowerCase();
    // Extract key skill words (e.g., "ML models" -> "ML", "machine learning models" -> "machine learning")
    skill = skill.replace(/\b(models?|systems?|platforms?|applications?|solutions?)\b/g, '').trim();
    if (skill && skill.length > 2 &&
      !specificExpMatches.some(m => m.years === years &&
        (m.skill.includes(skill) || skill.includes(m.skill)))) {
      specificExpMatches.push({ years, skill });
    }
  }

  // Pattern 5: "5 years Python, R, SQL" (multiple skills in one requirement)
  const pattern5 = /(\d+)[\+]?\s+years?[^.]*?(?:with|in|of|using|experience|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi;
  while ((match = pattern5.exec(jobDesc)) !== null) {
    const years = parseInt(match[1], 10);
    const skillsText = match[2].trim().toLowerCase();
    // Split by comma, semicolon, or "and" to get individual skills
    const individualSkills = skillsText.split(/[,;]|\sand\s/).map(s => s.trim());

    individualSkills.forEach(skillText => {
      let skill = skillText.replace(/\b(experience|with|in|of|using|working|building|developing|coding)\b/g, '').trim();
      // Handle abbreviations like "ML" or "K8S"
      if (skill && skill.length >= 2 &&
        !specificExpMatches.some(m => m.years === years &&
          (m.skill === skill || m.skill.includes(skill) || skill.includes(m.skill)))) {
        specificExpMatches.push({ years, skill });
      }
    });
  }

  // FEATURE 1 & 2: Extract employment experiences and calculate real experience years
  const employmentExperiences = extractEmploymentExperiences(cvText);

  // CRITICAL: Check if CV has the required specific experience
  let missingCriticalExperience = 0;
  let totalCriticalExperience = 0;

  specificExpMatches.forEach(({ years, skill }) => {
    totalCriticalExperience++;

    // Normalize skill names for better matching
    const normalizedSkill = skill.toLowerCase().trim();
    const skillVariations: string[] = [normalizedSkill];

    // Add common variations (e.g., "machine learning" = "ML" = "ml")
    if (normalizedSkill.includes('machine learning')) {
      skillVariations.push('ml', 'machine learning', 'machine-learning');
    }
    if (normalizedSkill.includes('python')) {
      skillVariations.push('python', 'py', 'python3', 'python 3');
    }
    if (normalizedSkill.includes('sql')) {
      skillVariations.push('sql', 'mysql', 'postgresql', 'sql server');
    }
    if (normalizedSkill.includes('r ')) {
      skillVariations.push('r ', 'r programming', 'r language');
    }

    // FEATURE 1: Calculate actual years of experience based on employment dates
    const actualYears = calculateSkillExperienceYears(normalizedSkill, employmentExperiences);

    // FEATURE 2: Analyze context - professional experience is more valuable than projects/education
    const relevantExperiences = employmentExperiences.filter(exp => {
      const expText = `${exp.title} ${exp.company} ${exp.description}`.toLowerCase();
      return skillVariations.some(variation => {
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(expText);
      });
    });

    const professionalExp = relevantExperiences.filter(e => e.context === 'professional');
    const projectExp = relevantExperiences.filter(e => e.context === 'project');
    const educationExp = relevantExperiences.filter(e => e.context === 'education');

    // Calculate professional years (most credible)
    const professionalYears = calculateSkillExperienceYears(normalizedSkill, professionalExp);

    // Check if CV mentions this skill (STRICT CHECK)
    let skillMentioned = false;
    for (const variation of skillVariations) {
      // Check for exact word match (not substring to avoid false positives)
      const skillRegex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (skillRegex.test(cvText)) {
        skillMentioned = true;
        break;
      }
    }

    // Also check for skill in context (e.g., "Python developer" or "worked with Python")
    if (!skillMentioned) {
      const contextPatterns = [
        new RegExp(`${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(developer|engineer|programmer|specialist|expert)`, 'i'),
        new RegExp(`(worked|using|with|experience|proficient|skilled|expert|familiar)\\s+(in|with|using)?\\s+${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
      ];

      for (const pattern of contextPatterns) {
        if (pattern.test(cvText)) {
          skillMentioned = true;
          break;
        }
      }
    }

    if (!skillMentioned) {
      // Skill not mentioned at all = CRITICAL MISSING - SEVERE PENALTY
      missingCriticalExperience++;
      criticalRequirements.push(`${years}+ years experience with ${skill}`);
    } else {
      // FEATURE 1: Use calculated actual years from employment dates
      // For high requirements (5+ years), prioritize professional experience
      const effectiveYears = years >= 5 ? professionalYears : actualYears;

      if (effectiveYears < years) {
        // Not enough experience based on actual dates
        const contextInfo: string[] = [];
        if (professionalYears > 0) contextInfo.push(`${professionalYears} years professional`);
        if (projectExp.length > 0) contextInfo.push(`${projectExp.length} project(s)`);
        if (educationExp.length > 0) contextInfo.push(`${educationExp.length} education context(s)`);

        const contextStr = contextInfo.length > 0 ? ` (${contextInfo.join(', ')})` : '';
        missingCriticalExperience++;
        criticalRequirements.push(`${years}+ years experience with ${skill} (CV shows ${effectiveYears.toFixed(1)} years${contextStr})`);
      } else if (actualYears >= years && professionalYears < years && years >= 5) {
        // Has enough total experience but not enough professional experience for high requirements
        // This is a concern for senior roles
        missingCriticalExperience += 0.5;
        criticalRequirements.push(`${years}+ years professional experience with ${skill} (has ${actualYears.toFixed(1)} years total but only ${professionalYears.toFixed(1)} years professional)`);
      }

      // Also check text-based mentions as fallback
      const cvExpPatterns = [
        new RegExp(`(\\d+)[\\+]?\\s+years?[^.]*?${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
        new RegExp(`${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*?(\\d+)[\\+]?\\s+years?`, 'i'),
        new RegExp(`(\\d+)[\\+]?\\s+years?[^.]*?(?:of|with|in|using)\\s+${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
      ];

      let cvExpMatch = null;
      for (const pattern of cvExpPatterns) {
        const match = cvText.match(pattern);
        if (match) {
          cvExpMatch = match;
          break;
        }
      }

      // If text mentions years but dates don't support it, flag inconsistency
      if (cvExpMatch && actualYears === 0) {
        const cvYears = parseInt(cvExpMatch[1], 10);
        if (cvYears >= years) {
          // Text claims years but dates don't support it - potential inconsistency
          missingCriticalExperience += 0.3;
          criticalRequirements.push(`${years}+ years experience with ${skill} (text claims ${cvYears} years but dates don't support this)`);
        }
      }
    }
  });

  // Calculate years of experience match (general, not skill-specific)
  let experienceYearsScore = 0;
  const experiencePattern = /(\d+)[\+]?\s+years?/gi;
  const expMatches = [...jobDesc.matchAll(experiencePattern)];

  if (expMatches.length > 0 && specificExpMatches.length === 0) {
    // Only use general experience if no specific experience requirements found
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
    } else {
      // No years mentioned in CV = missing requirement
      experienceYearsScore = 0;
    }
  } else if (specificExpMatches.length > 0) {
    // If specific experience requirements exist, they take precedence
    // Score based on how many are met
    const metRatio = (totalCriticalExperience - missingCriticalExperience) / totalCriticalExperience;
    if (metRatio >= 1.0) {
      experienceYearsScore = 15; // All met
    } else if (metRatio >= 0.75) {
      experienceYearsScore = 10; // Most met
    } else if (metRatio >= 0.5) {
      experienceYearsScore = 5; // Half met
    } else if (metRatio > 0) {
      experienceYearsScore = 2; // Few met
    } else {
      experienceYearsScore = 0; // None met - CRITICAL FAILURE
    }
  } else {
    // No specific experience requirements mentioned
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

  // ============================================
  // UTILISER LE NOUVEAU SYSTÈME DE SCORING AVANCÉ
  // ============================================

  // Utiliser le nouveau système de scoring amélioré
  const advancedScore = calculateAdvancedMatchScore(
    data.cv, // Utiliser le CV original (pas en lowercase)
    data.jobDescription, // Utiliser la description originale
    data.jobTitle,
    data.company,
    employmentExperiences
  );

  // Extraire les scores du nouveau système
  const finalMatchScore = advancedScore.matchScore;
  const skillsScore = advancedScore.categoryScores.skills;
  const experienceScore = advancedScore.categoryScores.experience;
  const educationScore = advancedScore.categoryScores.education;
  const industryFitScore = advancedScore.categoryScores.industryFit;

  // Normalize scores to realistic range (0-100) - NO artificial minimum floors
  const normalizeScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

  // Analyze experience with precise insights
  const experienceAnalysis = [
    {
      aspect: "Relevant Experience",
      analysis: finalMatchScore > 75
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
          `demonstrated experience. Consider highlighting the depth and quality of your relevant projects, ` +
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
          `deepening your expertise in relevant domain areas would strengthen your profile for this ${data.jobTitle} position.`
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

  const educationTerms = ['degree', 'bachelor', 'master', 'phd', 'mba', 'certification', 'diploma', 'university', 'college'];
  if (educationScore > 80) {
    keyFindings.push(`Your educational background (${educationScore}%) is well-aligned with the requirements`);
  } else if (educationScore < 60 && educationTerms.some(term => jobDesc.includes(term))) {
    keyFindings.push(`Your educational qualifications (${educationScore}%) may need highlighting or enhancement for this role`);
  }

  // Check job title match
  if (titleWordsInCV === jobTitleWords.length) {
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
      examples: `"Managed end-to-end implementation of [relevant project type] for clients in the ${data.company ? data.company + " market space" : "same industry"}"`
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
      description: `This ${data.jobTitle} position appears to value more experience than your resume currently demonstrates. ` +
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
// CRITICAL: Post-process AI analysis to enforce strict scoring rules
const validateAndEnforceStrictScoring = (
  analysis: ATSAnalysis,
  cvText: string,
  jobDescription: string
): ATSAnalysis => {
  const cvTextLower = cvText.toLowerCase();
  const jobDescLower = jobDescription.toLowerCase();

  // Detect specific experience requirements from job description - IMPROVED PATTERNS
  const specificExpPatterns = [
    // Pattern 1: "5 years experience with Python" or "5 years of experience with Python"
    /(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
    // Pattern 2: "Over 5 years of experience with Python"
    /over\s+(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?experience[^.]*?(?:with|in|using|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
    // Pattern 3: "5 years building ML models" or "5 years developing Python"
    /(\d+)[\+]?\s+years?[^.]*?(?:building|developing|coding|working|with|in)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
    // Pattern 4: "5+ years Python" (simpler pattern)
    /(\d+)[\+]?\s+years?[^.]*?(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    // Pattern 5: "5 years Python, R, SQL" (multiple skills)
    /(\d+)[\+]?\s+years?[^.]*?(?:with|in|of|using|experience|working|building|developing|coding)\s+([^.,;:!?]+?)(?:\.|,|;|:|!|\?|$)/gi,
  ];

  const criticalRequirements: Array<{ years: number, skill: string }> = [];
  const seenRequirements = new Set<string>();

  specificExpPatterns.forEach((pattern, patternIndex) => {
    let match;
    // Reset regex lastIndex to avoid issues
    pattern.lastIndex = 0;
    while ((match = pattern.exec(jobDescription)) !== null) {
      const years = parseInt(match[1], 10);
      let skill = match[2].trim().toLowerCase();

      // Clean up the skill
      skill = skill.replace(/\b(experience|with|in|of|using|working|building|developing|coding|models?|systems?|platforms?|applications?|solutions?)\b/g, '').trim();

      // Handle multiple skills separated by commas
      if (skill.includes(',')) {
        const skills = skill.split(',').map(s => s.trim()).filter(s => s.length > 2);
        skills.forEach(s => {
          const reqKey = `${years}-${s}`;
          if (!seenRequirements.has(reqKey) && s.length > 2) {
            criticalRequirements.push({ years, skill: s });
            seenRequirements.add(reqKey);
          }
        });
      } else if (skill && skill.length > 2) {
        const reqKey = `${years}-${skill}`;
        if (!seenRequirements.has(reqKey)) {
          criticalRequirements.push({ years, skill });
          seenRequirements.add(reqKey);
        }
      }
    }
  });

  console.log(`🔍 Detected ${criticalRequirements.length} critical experience requirements:`, criticalRequirements);

  // Check if CV has these critical requirements - BE MORE STRICT
  let missingCriticalCount = 0;
  let totalCriticalCount = criticalRequirements.length;

  if (totalCriticalCount > 0) {
    // First, check AI analysis results for missing skills (if available)
    const aiMissingSkills = (analysis.skillsMatch?.missing || []).map(s => s.name.toLowerCase());
    const aiMatchingSkills = (analysis.skillsMatch?.matching || []).map(s => s.name.toLowerCase());

    console.log(`🔍 AI marked as missing:`, aiMissingSkills);
    console.log(`🔍 AI marked as matching:`, aiMatchingSkills);

    // Extract employment experiences to calculate real years (if CV text available)
    const employmentExperiences = cvText.length > 100 ? extractEmploymentExperiences(cvText) : [];
    console.log(`🔍 Extracted ${employmentExperiences.length} employment experiences from CV`);

    criticalRequirements.forEach(({ years, skill }) => {
      const skillVariations: string[] = [skill];
      if (skill.includes('python')) skillVariations.push('python', 'py', 'python3');
      if (skill.includes('machine learning') || skill.includes('ml')) {
        skillVariations.push('ml', 'machine learning', 'machine-learning', 'deep learning');
      }
      if (skill.includes('sql')) skillVariations.push('sql', 'mysql', 'postgresql');
      if (skill.includes('r ')) skillVariations.push('r ', 'r programming', 'r language');

      console.log(`🔍 Checking requirement: ${years} years ${skill} (variations: ${skillVariations.join(', ')})`);

      // Check if AI already marked this as missing
      const aiMarkedAsMissing = aiMissingSkills.some(missing =>
        skillVariations.some(v => missing.includes(v) || v.includes(missing))
      );

      if (aiMarkedAsMissing) {
        console.log(`❌ ${skill} marked as MISSING by AI`);
        missingCriticalCount++;
      } else {
        // Check if skill is mentioned in CV text
        const skillMentioned = skillVariations.some(variation => {
          const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(cvTextLower);
        });

        // Also check if AI marked it as matching
        const aiMarkedAsMatching = aiMatchingSkills.some(m =>
          skillVariations.some(v => m.includes(v) || v.includes(m))
        );

        console.log(`🔍 ${skill}: CV mentions=${skillMentioned}, AI matches=${aiMarkedAsMatching}`);

        if (!skillMentioned && !aiMarkedAsMatching) {
          console.log(`❌ ${skill} NOT found in CV and NOT marked as matching by AI`);
          missingCriticalCount++;
        } else if (employmentExperiences.length > 0) {
          // Calculate actual years from employment dates
          const actualYears = calculateSkillExperienceYears(skill, employmentExperiences);
          const professionalExp = employmentExperiences.filter(e =>
            e.context === 'professional' &&
            `${e.title} ${e.company} ${e.description}`.toLowerCase().includes(skill)
          );
          const professionalYears = calculateSkillExperienceYears(skill, professionalExp);

          console.log(`🔍 ${skill}: actualYears=${actualYears}, professionalYears=${professionalYears}, required=${years}`);

          // For 5+ years requirements, prioritize professional experience
          const effectiveYears = years >= 5 ? professionalYears : actualYears;

          if (effectiveYears < years) {
            console.log(`❌ ${skill}: Only ${effectiveYears} years found, need ${years} years`);
            missingCriticalCount++;
          } else {
            console.log(`✅ ${skill}: ${effectiveYears} years found, meets requirement of ${years} years`);
          }
        }
        // If no employment data available but skill is mentioned, be STRICT for high requirements
        else if (years >= 5) {
          // For 5+ years requirements without proof, be conservative
          if (!aiMarkedAsMatching) {
            console.log(`⚠️ ${skill}: Skill mentioned but no proof of ${years} years - treating as missing`);
            missingCriticalCount++;
          } else {
            // AI says it matches, but we need to verify years
            // If no employment data, we can't verify - be conservative
            console.log(`⚠️ ${skill}: AI marked as matching but can't verify ${years} years - partial credit`);
            missingCriticalCount += 0.3; // Partial penalty
          }
        }
      }
    });

    // ENFORCE STRICT SCORING: If critical requirements are missing, force low score
    console.log(`🔍 Validation: Found ${totalCriticalCount} critical requirements, ${missingCriticalCount} missing`);
    console.log(`🔍 Critical requirements:`, criticalRequirements);

    if (totalCriticalCount > 0) {
      const missingRatio = missingCriticalCount / totalCriticalCount;

      // Calculate maximum allowed score based on missing requirements - BE MORE AGGRESSIVE
      let maxAllowedScore = 100;
      if (missingRatio >= 1.0) {
        // Missing ALL critical requirements - SEVERE PENALTY
        maxAllowedScore = 25; // Even lower - 25% max
      } else if (missingRatio >= 0.75) {
        // Missing 75%+ of critical requirements
        maxAllowedScore = 35; // Lowered from 40
      } else if (missingRatio >= 0.5) {
        // Missing 50-75% of critical requirements
        maxAllowedScore = 45; // Lowered from 50
      } else if (missingRatio >= 0.25) {
        // Missing 25-50% of critical requirements
        maxAllowedScore = 55; // Lowered from 60
      } else if (missingRatio > 0) {
        // Missing any critical requirements
        maxAllowedScore = 65; // New threshold
      }

      // ALWAYS enforce the limit if critical requirements exist and any are missing
      if (missingCriticalCount > 0) {
        if (analysis.matchScore > maxAllowedScore) {
          console.warn(`⚠️ CRITICAL: AI returned score ${analysis.matchScore}% but ${missingCriticalCount}/${totalCriticalCount} critical requirements missing. ` +
            `Enforcing maximum ${maxAllowedScore}%`);

          // Force the score down aggressively
          analysis.matchScore = maxAllowedScore;

          // Also adjust category scores proportionally (more aggressive)
          const adjustmentRatio = maxAllowedScore / (analysis.matchScore || 1);
          analysis.categoryScores.skills = Math.max(0, Math.round(analysis.categoryScores.skills * adjustmentRatio * 0.8));
          analysis.categoryScores.experience = Math.max(0, Math.round(analysis.categoryScores.experience * adjustmentRatio * 0.8));
          analysis.categoryScores.industryFit = Math.max(0, Math.round(analysis.categoryScores.industryFit * adjustmentRatio * 0.8));

          // Update executive summary to reflect the correction
          const missingReqs = criticalRequirements.slice(0, Math.min(missingCriticalCount, criticalRequirements.length))
            .map(r => `${r.years}+ years ${r.skill}`);
          analysis.executiveSummary = `VALIDATED SCORE: ${maxAllowedScore}% match (corrected from ${analysis.matchScore}%). ` +
            `CRITICAL ISSUE: Missing ${missingCriticalCount} out of ${totalCriticalCount} critical experience requirements: ` +
            `${missingReqs.join(', ')}. ` +
            `This is a deal-breaker for this position. The original analysis was too lenient.`;

          // Update key findings to reflect the critical gaps
          if (analysis.keyFindings && analysis.keyFindings.length > 0) {
            analysis.keyFindings.unshift(
              `CRITICAL: Missing ${missingCriticalCount} critical experience requirement(s): ${missingReqs.join(', ')} - This significantly impacts your match score.`
            );
          }
        } else {
          console.log(`✅ Score ${analysis.matchScore}% is already within allowed range (max ${maxAllowedScore}%)`);
        }
      } else if (missingCriticalCount === 0 && totalCriticalCount > 0) {
        console.log(`✅ All ${totalCriticalCount} critical requirements met`);
      }
    } else {
      console.log(`⚠️ No critical experience requirements detected in job description`);
      // Even if no critical requirements detected, check for common patterns that might indicate issues
      // This is a fallback safety check
      const commonCriticalPatterns = [
        /(\d+)[\+]?\s+years?[^.]*?(?:python|machine learning|ml|java|javascript|react|node)/i,
        /required.*?(\d+)[\+]?\s+years?/i,
        /must have.*?(\d+)[\+]?\s+years?/i
      ];

      const hasCriticalPatterns = commonCriticalPatterns.some(p => p.test(jobDescription));
      if (hasCriticalPatterns && analysis.matchScore > 70) {
        console.warn(`⚠️ WARNING: High score (${analysis.matchScore}%) but potential critical requirements detected. Being conservative.`);
        // Apply a conservative cap
        if (analysis.matchScore > 70) {
          analysis.matchScore = Math.min(analysis.matchScore, 70);
        }
      }
    }
  }

  // FINAL SAFETY CHECK: If score is suspiciously high (70+) and we have critical requirements, force review
  // This is a LAST RESORT check to ensure scores are never too high when critical requirements are missing
  if (totalCriticalCount > 0) {
    if (missingCriticalCount > 0 && analysis.matchScore > 50) {
      console.error(`🚨 CRITICAL ERROR: Score ${analysis.matchScore}% is too high given ${missingCriticalCount}/${totalCriticalCount} missing critical requirements. ` +
        `Forcing aggressive correction to maximum 30%.`);
      analysis.matchScore = 30; // Force to 30% maximum
      analysis.categoryScores.skills = Math.min(analysis.categoryScores.skills, 30);
      analysis.categoryScores.experience = Math.min(analysis.categoryScores.experience, 30);
      analysis.categoryScores.industryFit = Math.min(analysis.categoryScores.industryFit, 30);

      // Update summary
      const missingReqs = criticalRequirements.slice(0, Math.min(missingCriticalCount, criticalRequirements.length))
        .map(r => `${r.years}+ years ${r.skill}`);
      analysis.executiveSummary = `FINAL VALIDATION: 30% match (corrected from ${analysis.matchScore}%). ` +
        `CRITICAL: Missing ${missingCriticalCount} out of ${totalCriticalCount} critical experience requirements: ` +
        `${missingReqs.join(', ')}. ` +
        `This position requires these skills and your CV does not demonstrate them. Score adjusted accordingly.`;
    } else if (missingCriticalCount === 0 && analysis.matchScore > 90) {
      // If all critical requirements are met, allow high scores
      console.log(`✅ All critical requirements met, score ${analysis.matchScore}% is acceptable`);
    }
  } else {
    // Even if no critical requirements detected, check for suspiciously high scores
    // Look for common high-requirement patterns in job description
    const highRequirementIndicators = [
      /(\d+)[\+]?\s+years?/gi,
      /senior|lead|principal|architect|director/i,
      /required|must have|essential|mandatory/i
    ];

    const hasHighRequirements = highRequirementIndicators.some(p => p.test(jobDescription));
    if (hasHighRequirements && analysis.matchScore > 80) {
      console.warn(`⚠️ High score (${analysis.matchScore}%) but job description suggests high requirements. Being conservative.`);
      // Don't force it down, but log it
    }
  }

  console.log(`✅ Final validated score: ${analysis.matchScore}%`);

  return analysis;
};

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

        // CRITICAL: Validate and enforce strict scoring rules
        // Try to get CV text from various sources
        let cvText = typeof data.cvContent === 'string' ? data.cvContent : '';

        // If no text available, try to extract from analysis results (skills, experience, etc.)
        if (!cvText || cvText.length < 50) {
          // Build a pseudo-CV text from analysis results for validation
          const analysisText = [
            ...(analysis.skillsMatch?.matching?.map((s: any) => s.name) || []),
            ...(analysis.skillsMatch?.missing?.map((s: any) => s.name) || []),
            analysis.executiveSummary || '',
            ...(analysis.experienceAnalysis?.map((e: any) => e.analysis) || []),
          ].join(' ');
          cvText = analysisText || '';
        }

        const validatedAnalysis = validateAndEnforceStrictScoring(
          analysis,
          cvText,
          data.jobDescription
        );

        return {
          ...validatedAnalysis,
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
          // CRITICAL: Validate and enforce strict scoring rules for AI analysis
          const cvText = typeof data.cvContent === 'string' ? data.cvContent : '';
          gptAnalysis = validateAndEnforceStrictScoring(
            gptAnalysis,
            cvText,
            data.jobDescription
          );
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
        // Mock analysis already has strict rules, but validate anyway
        const cvText = typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable';
        gptAnalysis = validateAndEnforceStrictScoring(
          gptAnalysis,
          cvText,
          data.jobDescription
        );
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
    const fallbackAnalysis = generateMockAnalysis({
      cv: typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable',
      jobTitle: data.jobTitle,
      company: data.company,
      jobDescription: data.jobDescription
    });

    // CRITICAL: Always validate fallback analysis too
    const cvText = typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable';
    return validateAndEnforceStrictScoring(
      fallbackAnalysis,
      cvText,
      data.jobDescription
    );

  } catch (error: any) {
    console.error('Error during ATS analysis:', error);

    // En cas d'erreur, nous pouvons revenir à l'ancienne méthode simulative
    console.log('Falling back to mock analysis due to error');
    const errorFallbackAnalysis = generateMockAnalysis({
      cv: typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable',
      jobTitle: data.jobTitle,
      company: data.company,
      jobDescription: data.jobDescription
    });

    // CRITICAL: Always validate error fallback too
    const cvText = typeof data.cvContent === 'string' ? data.cvContent : 'CV content unavailable';
    return validateAndEnforceStrictScoring(
      errorFallbackAnalysis,
      cvText,
      data.jobDescription
    );
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
  const location = useLocation();
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
  const [jobInputMode, setJobInputMode] = useState<'ai' | 'manual' | 'saved'>('ai');
  const [savedJobs, setSavedJobs] = useState<JobApplication[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedSavedJob, setSelectedSavedJob] = useState<JobApplication | null>(null);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [isLoadingSavedJobs, setIsLoadingSavedJobs] = useState(false);
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLLabelElement>(null);
  const jobSelectorRef = useRef<HTMLDivElement>(null);
  const jobInputRef = useRef<HTMLInputElement>(null);
  const jobDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);

  // Add these state variables for CV selection modal
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [enableContentValidation, setEnableContentValidation] = useState(true);
  const [showCVPreview, setShowCVPreview] = useState(false);
  const [isDownloadingCV, setIsDownloadingCV] = useState(false);
  const [usingSavedCV, setUsingSavedCV] = useState(false);

  // States for search, filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'company'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // States for Resume Builder CV selector
  const [builderCVs, setBuilderCVs] = useState<Resume[]>([]);
  const [builderDocs, setBuilderDocs] = useState<ImportedDocument[]>([]);
  const [showCVSelector, setShowCVSelector] = useState(false);
  const [cvSelectorSearch, setCvSelectorSearch] = useState('');
  const [selectedBuilderItem, setSelectedBuilderItem] = useState<{ type: 'resume' | 'document'; item: Resume | ImportedDocument } | null>(null);
  const [isLoadingBuilderCVs, setIsLoadingBuilderCVs] = useState(false);

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null); // null = pas encore détecté, true = sombre, false = claire
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour charger le CV depuis le profil utilisateur
  const fetchUserCV = useCallback(async () => {
    if (!currentUser) {
      console.log('🔍 No current user, skipping CV fetch');
      return;
    }
    try {
      console.log('🔍 Fetching user CV for user:', currentUser.uid);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('🔍 User data:', { cvUrl: userData.cvUrl, cvName: userData.cvName });
        if (userData.cvUrl) {
          setUserCV({
            url: userData.cvUrl,
            name: userData.cvName || 'Profile CV'
          });
          console.log('✅ User CV loaded:', { url: userData.cvUrl, name: userData.cvName || 'Profile CV' });
        } else {
          console.log('⚠️ No cvUrl found in user document');
          setUserCV(null);
        }
      } else {
        console.log('⚠️ User document does not exist');
        setUserCV(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user CV:', error);
      setUserCV(null);
    }
  }, [currentUser]);

  // Charger le CV depuis le profil utilisateur au montage
  useEffect(() => {
    fetchUserCV();
  }, [fetchUserCV]);

  // Recharger le CV quand le modal s'ouvre pour avoir les dernières données
  useEffect(() => {
    if (isModalOpen && currentUser) {
      console.log('🔄 Modal opened, reloading CV...');
      fetchUserCV();
    }
  }, [isModalOpen, currentUser, fetchUserCV]);

  // Fetch CVs from Resume Builder (both structured CVs and imported PDFs)
  const fetchBuilderCVs = useCallback(async () => {
    if (!currentUser) return;

    setIsLoadingBuilderCVs(true);
    try {
      // Fetch structured CVs
      const cvsRef = collection(db, 'users', currentUser.uid, 'cvs');
      const cvsQuery = query(cvsRef, orderBy('updatedAt', 'desc'));
      const cvsSnapshot = await getDocs(cvsQuery);

      const cvsList: Resume[] = [];
      cvsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (docSnapshot.id !== 'default' && data.cvData) {
          cvsList.push({
            id: docSnapshot.id,
            name: data.name || 'Untitled Resume',
            cvData: data.cvData,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            template: data.template,
            layoutSettings: data.layoutSettings,
            folderId: data.folderId,
            tags: data.tags || []
          });
        }
      });

      setBuilderCVs(cvsList);

      // Fetch imported PDF documents
      const docsRef = collection(db, 'users', currentUser.uid, 'documents');
      const docsQuery = query(docsRef, orderBy('updatedAt', 'desc'));
      const docsSnapshot = await getDocs(docsQuery);

      const docsList: ImportedDocument[] = [];
      docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        docsList.push({
          id: docSnapshot.id,
          name: data.name || 'Untitled Document',
          fileUrl: data.fileUrl,
          fileSize: data.fileSize || 0,
          pageCount: data.pageCount,
          folderId: data.folderId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setBuilderDocs(docsList);
    } catch (error) {
      console.error('Error fetching builder CVs:', error);
    } finally {
      setIsLoadingBuilderCVs(false);
    }
  }, [currentUser]);

  // Load builder CVs when CV selector is opened or modal opens
  useEffect(() => {
    if ((showCVSelector || isModalOpen) && currentUser) {
      fetchBuilderCVs();
    }
  }, [showCVSelector, isModalOpen, currentUser, fetchBuilderCVs]);

  // Charger les job applications depuis Firestore
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!currentUser) return;

      setIsLoadingSavedJobs(true);
      try {
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const q = query(applicationsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const jobs: JobApplication[] = [];
        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as JobApplication;
          // Inclure tous les jobs, même ceux sans fullJobDescription
          // L'utilisateur pourra toujours utiliser description si disponible
          if (data.position && data.companyName) {
            jobs.push(data);
          }
        });

        setSavedJobs(jobs);
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        notify.error('Failed to load saved jobs');
      } finally {
        setIsLoadingSavedJobs(false);
      }
    };

    fetchSavedJobs();
  }, [currentUser]);

  // Handle prefill from location.state (when navigating from JobDetailPanel)
  useEffect(() => {
    const state = location.state as {
      jobTitle?: string;
      company?: string;
      jobDescription?: string;
      jobUrl?: string;
      fromApplication?: boolean;
      jobId?: string;
    } | null;

    if (!state || !state.fromApplication || !currentUser) return;

    // Wait for savedJobs to be loaded (or proceed if we have state data)
    const handlePrefill = () => {
      if (savedJobs.length > 0) {
        // Find matching job application
        const matchingJob = savedJobs.find(
          job => job.id === state.jobId
        ) || savedJobs.find(
          job => 
            job.position?.toLowerCase() === state.jobTitle?.toLowerCase() &&
            job.companyName?.toLowerCase() === state.company?.toLowerCase()
        );

        if (matchingJob) {
          // Set the selected job
          setSelectedSavedJob(matchingJob);
          setJobSearchQuery(`${matchingJob.companyName} - ${matchingJob.position}`);
          setJobInputMode('saved');

          // Prefill form data (but don't navigate to step 2 yet - user must choose CV first)
          setFormData({
            jobTitle: matchingJob.position,
            company: matchingJob.companyName,
            jobDescription: matchingJob.fullJobDescription || matchingJob.description || state.jobDescription || '',
            jobUrl: matchingJob.url || state.jobUrl || '',
          });

          // Open modal at step 1 (user must choose CV first)
          setIsModalOpen(true);
          setCurrentStep(1);

          // Clear location.state to prevent re-triggering
          window.history.replaceState({}, document.title);
          return;
        }
      }

      // If job not found in saved jobs or savedJobs not loaded yet, prefill with state data
      if (state.jobTitle && state.company) {
        setFormData({
          jobTitle: state.jobTitle,
          company: state.company,
          jobDescription: state.jobDescription || '',
          jobUrl: state.jobUrl || '',
        });
        setJobInputMode('manual');

        // Open modal at step 1 (user must choose CV first)
        setIsModalOpen(true);
        setCurrentStep(1);

        // Clear location.state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    };

    // If savedJobs are already loaded, handle immediately
    // Otherwise, wait a bit for them to load (they're fetched on mount)
    if (savedJobs.length > 0 || !isLoadingSavedJobs) {
      handlePrefill();
    } else {
      // Wait a bit for savedJobs to load
      const timeout = setTimeout(() => {
        handlePrefill();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [location.state, currentUser, savedJobs, isLoadingSavedJobs]);

  // Calculer la position du dropdown pour éviter qu'il soit coupé
  useEffect(() => {
    if (showJobDropdown && jobInputRef.current) {
      const updatePosition = () => {
        if (jobInputRef.current) {
          const rect = jobInputRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [showJobDropdown, jobSearchQuery, savedJobs.length]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (jobSelectorRef.current && !jobSelectorRef.current.contains(target) &&
        jobDropdownRef.current && !jobDropdownRef.current.contains(target)) {
        setShowJobDropdown(false);
      }
    };

    if (showJobDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showJobDropdown]);

  // Charger les analyses sauvegardées
  useEffect(() => {
    const fetchSavedAnalyses = async () => {
      if (!currentUser) return;

      try {
        console.log('Attempting to load analyses...');
        const analysesRef = collection(db, 'users', currentUser.uid, 'analyses');

        // Get all analyses without ordering first (to support both timestamp and date fields)
        const querySnapshot = await getDocs(analysesRef);

        const savedAnalyses: ATSAnalysis[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Normalize matchScore: for premium analyses, use match_scores.overall_score if available
          // This ensures consistency between card display and detail page
          const normalizedMatchScore = data.match_scores?.overall_score !== undefined
            ? data.match_scores.overall_score
            : (data.matchScore !== undefined ? data.matchScore : undefined);
          
          // Include loading analyses (_isLoading: true) and completed analyses
          if (!data.deleted && (normalizedMatchScore !== undefined || data._isLoading === true)) {
            // Support both old (timestamp) and new (date) formats
            const analysisDate = data.date || data.timestamp;

            // Normalize skillsMatch data - handle multiple formats
            let skillsMatch = { matching: [], missing: [], alternative: [] };

            if (data.skillsMatch) {
              // Standard format
              if (data.skillsMatch.matching && Array.isArray(data.skillsMatch.matching)) {
                skillsMatch = {
                  matching: data.skillsMatch.matching.map((skill: any) => ({
                    name: typeof skill === 'string' ? skill : (skill.name || ''),
                    relevance: typeof skill === 'object' && skill.relevance ? skill.relevance : 80,
                    location: typeof skill === 'object' ? skill.location : undefined
                  })),
                  missing: (data.skillsMatch.missing || []).map((skill: any) => ({
                    name: typeof skill === 'string' ? skill : (skill.name || ''),
                    relevance: typeof skill === 'object' && skill.relevance ? skill.relevance : 60
                  })),
                  alternative: data.skillsMatch.alternative || []
                };
              }
            } else if (data._premiumAnalysis?.match_breakdown?.skills) {
              // Premium analysis format
              const premiumSkills = data._premiumAnalysis.match_breakdown.skills;
              skillsMatch = {
                matching: (premiumSkills.matched || []).map((skill: string) => ({
                  name: skill,
                  relevance: 80
                })),
                missing: (premiumSkills.missing || []).map((skill: string) => ({
                  name: skill,
                  relevance: 60
                })),
                alternative: []
              };
            } else if (data.match_breakdown?.skills) {
              // Alternative premium format
              const premiumSkills = data.match_breakdown.skills;
              skillsMatch = {
                matching: (premiumSkills.matched || []).map((skill: string) => ({
                  name: skill,
                  relevance: 80
                })),
                missing: (premiumSkills.missing || []).map((skill: string) => ({
                  name: skill,
                  relevance: 60
                })),
                alternative: []
              };
            }

            console.log(`📋 Loaded analysis ${doc.id}:`, {
              jobTitle: data.jobTitle,
              skillsMatchCount: skillsMatch.matching.length,
              hasSkillsMatch: !!data.skillsMatch,
              matchScore: normalizedMatchScore,
              isPremium: !!data.match_scores
            });

            // Detect if analysis is completed even if _isLoading is true
            // Check for status: 'completed' or matchScore > 0 to fix stuck analyses
            const isCompleted = data.status === 'completed' ||
              (normalizedMatchScore !== undefined && normalizedMatchScore > 0) ||
              (data._isLoading === false);

            savedAnalyses.push({
              id: doc.id,
              date: analysisDate,
              jobTitle: data.jobTitle || 'Untitled Position',
              company: data.company || 'Unknown Company',
              matchScore: normalizedMatchScore || 0,
              userId: currentUser.uid,
              keyFindings: data.keyFindings || (Array.isArray(data.executive_summary) ? data.executive_summary : [data.executive_summary || '']),
              skillsMatch: skillsMatch,
              experienceAnalysis: data.experienceAnalysis || [],
              recommendations: data.recommendations || [],
              categoryScores: data.categoryScores || {
                skills: 0,
                experience: 0,
                education: 0,
                industryFit: 0
              },
              executiveSummary: data.executiveSummary || data.executive_summary || '',
              jobSummary: data.jobSummary || undefined,
              // Set loading state to false if analysis is completed
              _isLoading: isCompleted ? false : (data._isLoading || false),
              _premiumAnalysis: data._premiumAnalysis,
            });
          }
        });

        // Sort by date (most recent first)
        savedAnalyses.sort((a, b) => {
          const dateA = (a.date && typeof a.date === 'object' && 'toDate' in (a.date as any))
            ? (a.date as any).toDate()
            : new Date(a.date as string || 0);
          const dateB = (b.date && typeof b.date === 'object' && 'toDate' in (b.date as any))
            ? (b.date as any).toDate()
            : new Date(b.date as string || 0);
          return dateB.getTime() - dateA.getTime();
        });

        if (savedAnalyses.length > 0) {
          console.log(`✅ Loaded ${savedAnalyses.length} saved analyses`);
          setAnalyses(savedAnalyses);
        } else {
          console.log('ℹ️ No analyses found');
        }
      } catch (error) {
        console.error('Error loading saved analyses:', error);
        // Vérifier si c'est une erreur de permission
        if (error instanceof Error &&
          error.toString().includes('permission')) {
          console.warn('Permission error detected. You need to update Firestore security rules.');
          notify.error('Permission error. Please check Firestore security rules.');
        } else {
          notify.error('Unable to load your saved analyses');
        }
      }
    };

    fetchSavedAnalyses();
  }, [currentUser]);

  // Real-time listener for loading analyses to detect when Cloud Function completes
  useEffect(() => {
    if (!currentUser) return;

    // Find analyses that are currently loading
    const loadingAnalyses = analyses.filter(a => a._isLoading === true);

    if (loadingAnalyses.length === 0) {
      // No loading analyses, no need for listener
      return;
    }

    console.log(`👂 Setting up real-time listener for ${loadingAnalyses.length} loading analyses`);

    const unsubscribes: Unsubscribe[] = [];

    // Set up listeners for each loading analysis
    loadingAnalyses.forEach((analysis) => {
      const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', analysis.id);

      const unsubscribe = onSnapshot(
        analysisRef,
        (docSnapshot) => {
          if (!docSnapshot.exists()) {
            console.log(`⚠️ Analysis ${analysis.id} no longer exists`);
            return;
          }

          const data = docSnapshot.data();

          // Normalize matchScore: for premium analyses, use match_scores.overall_score if available
          const normalizedMatchScore = data.match_scores?.overall_score !== undefined
            ? data.match_scores.overall_score
            : (data.matchScore !== undefined ? data.matchScore : undefined);

          // Check if analysis is now completed
          const isCompleted = data.status === 'completed' ||
            (normalizedMatchScore !== undefined && normalizedMatchScore > 0) ||
            (data._isLoading === false);

          // Check if analysis failed
          const isFailed = data.status === 'failed' || data.error;

          if (isFailed) {
            console.log(`❌ Analysis ${analysis.id} failed! Updating local state...`);

            // Update the analysis in local state to mark as failed
            setAnalyses(prev => prev.map(a =>
              a.id === analysis.id
                ? { ...a, _isLoading: false, error: data.error || 'Analysis failed' }
                : a
            ));

            // Show error notification
            notify.error(`Analysis failed: ${data.error || 'Unknown error'}`, {
              duration: 8000,
              icon: '❌'
            });
          } else if (isCompleted && data._isLoading === false) {
            console.log(`✅ Analysis ${analysis.id} completed! Updating local state...`);

            // Update the analysis in local state
            setAnalyses(prev => prev.map(a =>
              a.id === analysis.id
                ? { ...a, _isLoading: false, matchScore: normalizedMatchScore || a.matchScore }
                : a
            ));

            // Show success notification
            notify.success(`Analysis complete! Match score: ${normalizedMatchScore || 0}%`, {
              duration: 5000,
              icon: '🎉'
            });
          }
        },
        (error) => {
          console.error(`❌ Error in real-time listener for analysis ${analysis.id}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // Cleanup: unsubscribe from all listeners when component unmounts or analyses change
    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, analyses]);

  // Timeout protection: Check for analyses that have been loading for more than 5 minutes
  useEffect(() => {
    if (!currentUser) return;

    const TIMEOUT_MS = 9 * 60 * 1000; // 9 minutes (matches Cloud Function timeout)
    const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

    const checkTimeouts = () => {
      const now = Date.now();
      const timedOutAnalyses = analyses.filter(analysis => {
        if (!analysis._isLoading) return false;

        // Parse the date to get timestamp
        let analysisStartTime: number;
        if (typeof analysis.date === 'string') {
          analysisStartTime = new Date(analysis.date).getTime();
        } else if (analysis.date && typeof analysis.date === 'object' && 'toDate' in (analysis.date as any)) {
          analysisStartTime = (analysis.date as any).toDate().getTime();
        } else {
          // If we can't parse the date, skip this analysis
          return false;
        }

        const elapsed = now - analysisStartTime;
        return elapsed > TIMEOUT_MS;
      });

      if (timedOutAnalyses.length > 0) {
        console.warn(`⏱️ Found ${timedOutAnalyses.length} analyses that exceeded timeout (9 minutes)`);

        timedOutAnalyses.forEach(async (analysis) => {
          console.log(`⏱️ Marking analysis ${analysis.id} as failed due to timeout`);

          // Update local state
          setAnalyses(prev => prev.map(a =>
            a.id === analysis.id
              ? { ...a, _isLoading: false }
              : a
          ));

          // Update Firestore to mark as failed
          try {
            const analysesRef = collection(db, 'users', currentUser.uid, 'analyses');
            await setDoc(doc(analysesRef, analysis.id), {
              _isLoading: false,
              status: 'failed',
              error: 'Analysis timed out after 9 minutes. Please try again.',
              updatedAt: serverTimestamp(),
            }, { merge: true });

            console.log(`✅ Marked analysis ${analysis.id} as failed in Firestore`);
          } catch (error) {
            console.error(`❌ Error updating timed-out analysis ${analysis.id}:`, error);
          }

          // Show error notification
          notify.error(`Analysis timed out for ${analysis.jobTitle} at ${analysis.company}. Please try again.`, {
            duration: 8000,
            icon: '⏱️'
          });
        });
      }
    };

    // Check immediately
    checkTimeouts();

    // Set up interval to check periodically
    const intervalId = setInterval(checkTimeouts, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, analyses]);

  // Load page preferences (cover photo) and detect brightness
  useEffect(() => {
    if (!currentUser) return;

    const loadPagePreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const pagePreferences = userData.pagePreferences || {};
          const cvAnalysisPrefs = pagePreferences.cvAnalysis || {};
          if (cvAnalysisPrefs.coverPhoto) {
            setCoverPhoto(cvAnalysisPrefs.coverPhoto);
            // Detect brightness
            const isDark = await detectCoverBrightness(cvAnalysisPrefs.coverPhoto);
            setIsCoverDark(isDark);
          } else {
            setIsCoverDark(null);
          }
        }
      } catch (error) {
        console.error('Error loading page preferences:', error);
      }
    };

    loadPagePreferences();
  }, [currentUser]);

  // Sauvegarder l'analyse dans Firestore
  const saveAnalysisToFirestore = async (analysis: ATSAnalysis, jobApplication?: JobApplication | null) => {
    if (!currentUser) {
      console.warn('Cannot save analysis: User not logged in');
      return analysis;
    }

    try {
      console.log('Attempting to save analysis to Firestore...');

      // Normalize skillsMatch data before saving to ensure consistency
      const normalizedSkillsMatch = {
        matching: Array.isArray(analysis.skillsMatch?.matching)
          ? analysis.skillsMatch.matching.map((skill: any) => ({
            name: typeof skill === 'string' ? skill : (skill.name || ''),
            relevance: typeof skill === 'object' && skill.relevance ? skill.relevance : 80,
            location: typeof skill === 'object' ? skill.location : undefined
          }))
          : [],
        missing: Array.isArray(analysis.skillsMatch?.missing)
          ? analysis.skillsMatch.missing.map((skill: any) => ({
            name: typeof skill === 'string' ? skill : (skill.name || ''),
            relevance: typeof skill === 'object' && skill.relevance ? skill.relevance : 60
          }))
          : [],
        alternative: Array.isArray(analysis.skillsMatch?.alternative)
          ? analysis.skillsMatch.alternative
          : []
      };

      console.log('💾 Saving analysis with normalized skillsMatch:', {
        matchingCount: normalizedSkillsMatch.matching.length,
        missingCount: normalizedSkillsMatch.missing.length
      });

      const analysisToSave = {
        ...analysis,
        skillsMatch: normalizedSkillsMatch, // Use normalized version
        timestamp: serverTimestamp(),
        date: analysis.date || new Date().toISOString(), // Ensure date is set
        userId: currentUser.uid,
        deleted: false
      };

      const analysesRef = collection(db, 'users', currentUser.uid, 'analyses');
      const docRef = await addDoc(analysesRef, analysisToSave);

      console.log('✅ Analysis saved to Firestore with ID:', docRef.id);
      console.log('🔍 Checking if analysis should be linked to job application...');
      console.log('🔍 jobApplication parameter:', jobApplication);
      console.log('🔍 selectedSavedJob state (will be deprecated):', selectedSavedJob);

      // Use parameter if provided, fallback to state
      const jobToLink = jobApplication || selectedSavedJob;

      // If this analysis is linked to a saved job, update the job application with cvAnalysisIds
      if (jobToLink?.id) {
        console.log(`🔗 Attempting to link analysis ${docRef.id} to job application ${jobToLink.id}`);
        try {
          const jobRef = doc(db, 'users', currentUser.uid, 'jobApplications', jobToLink.id);
          
          // Fetch current job to get existing cvAnalysisIds
          const jobDoc = await getDoc(jobRef);
          const existingData = jobDoc.exists() ? jobDoc.data() : {};
          
          // Get existing analysis IDs (support both old single ID and new array)
          const existingIds: string[] = existingData.cvAnalysisIds || [];
          if (existingData.cvAnalysisId && !existingIds.includes(existingData.cvAnalysisId)) {
            existingIds.push(existingData.cvAnalysisId);
          }
          
          // Add new analysis ID if not already present
          if (!existingIds.includes(docRef.id)) {
            existingIds.push(docRef.id);
          }
          
          await updateDoc(jobRef, {
            cvAnalysisId: docRef.id, // Keep for backwards compatibility
            cvAnalysisIds: existingIds, // New array field
            updatedAt: serverTimestamp()
          });
          console.log(`✅ Successfully linked analysis ${docRef.id} to job application ${jobToLink.id}`);
          console.log(`📊 Total analyses linked: ${existingIds.length}`);
          notify.success(`Analysis linked to ${jobToLink.companyName} - ${jobToLink.position}`, {
            duration: 5000
          });
        } catch (linkError) {
          console.error('❌ Error linking analysis to job application:', linkError);
          notify.error('Analysis saved but could not be linked to job application');
          // Don't fail the entire operation if linking fails
        }
      } else {
        console.log('⚠️ No saved job provided or selected, analysis will not be linked to any job application');
      }

      notify.success('Analysis saved successfully!');
      return {
        ...analysis,
        skillsMatch: normalizedSkillsMatch, // Return normalized version
        id: docRef.id
      };
    } catch (error) {
      console.error('Error saving analysis to Firestore:', error);

      // Vérifier si c'est une erreur de permission
      if (error instanceof Error && error.toString().includes('permission')) {
        console.warn('Permission error detected. You need to update Firestore security rules.');
        notify.error('Permission error during save. Please check Firestore security rules.');
      } else {
        notify.error('Unable to save analysis, but results are available');
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

  // Function to download CV from Firebase Storage URL and convert to File object
  // Uses Cloud Function to avoid CORS issues by downloading server-side
  const downloadCVFromUrl = async (cvUrl: string, cvName: string): Promise<File> => {
    try {
      setIsDownloadingCV(true);
      console.log('📥 Downloading CV from URL:', cvUrl);

      // Ensure user is authenticated
      if (!currentUser) {
        throw new Error('User must be authenticated to download CV');
      }

      // Use Firebase Storage SDK directly (no CORS issues!)
      // This works because Firebase Storage SDK handles authentication automatically
      let storagePath = '';

      // Determine the storage path from the URL
      if (cvUrl.startsWith('gs://')) {
        // gs://bucket/path format - extract the path after bucket name
        const parts = cvUrl.replace('gs://', '').split('/');
        storagePath = parts.slice(1).join('/'); // Remove bucket name, keep path
        console.log('🔍 Extracted path from gs:// URL:', storagePath);
      } else if (cvUrl.includes('firebasestorage.googleapis.com')) {
        // Extract path from Firebase Storage download URL
        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
        const urlMatch = cvUrl.match(/\/o\/(.+?)\?/);
        if (urlMatch && urlMatch[1]) {
          storagePath = decodeURIComponent(urlMatch[1]);
          console.log('🔍 Extracted path from download URL:', storagePath);
        } else {
          throw new Error('Could not extract storage path from URL');
        }
      } else {
        // Assume it's already a storage path
        storagePath = cvUrl;
        console.log('🔍 Using URL as storage path:', storagePath);
      }

      if (!storagePath) {
        throw new Error('Could not determine storage path');
      }

      console.log('📥 Downloading CV using authenticated request...');

      // Get authentication token
      const token = await currentUser.getIdToken();

      // Use Firebase Storage REST API with authentication (bypasses CORS)
      // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      const bucket = 'jobzai.firebasestorage.app';
      const encodedPath = encodeURIComponent(storagePath);
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

      console.log('📥 Downloading from:', downloadUrl);

      // Make authenticated request
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Failed to download CV: ${response.statusText} (${response.status})`);
      }

      const blob = await response.blob();

      console.log('✅ CV downloaded successfully:', {
        size: blob.size,
        type: blob.type
      });

      // Convert blob to File object
      const file = new File([blob], cvName, { type: blob.type || 'application/pdf' });

      setIsDownloadingCV(false);
      notify.success('CV loaded successfully');
      return file;
    } catch (error: any) {
      setIsDownloadingCV(false);
      console.error('❌ Error downloading CV:', error);

      // More detailed error message
      let errorMessage = 'Failed to download CV';
      if (error.code === 'storage/object-not-found' || error.code === 'not-found') {
        errorMessage = 'CV file not found in storage. Please upload it again.';
      } else if (error.code === 'storage/unauthorized' || error.code === 'permission-denied') {
        errorMessage = 'Access denied to CV file. Please check your permissions.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Please log in to download your CV.';
      } else if (error.message) {
        errorMessage = `Failed to download CV: ${error.message}`;
      }

      notify.error(errorMessage);
      throw error;
    }
  };

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
    const technicalTermsMapping: { [key: string]: string } = {
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
      notify.error('Please upload a PDF file');
      return;
    }

    setCvFile(fileToProcess);
    setUsingSavedCV(false); // Reset saved CV flag when uploading new file
    setSelectedBuilderItem(null); // Reset builder item when uploading new file
    notify.success('CV selected successfully');
  };

  // Handle selecting saved CV from profile
  const handleUseSavedCV = async () => {
    if (!userCV) return;

    try {
      const file = await downloadCVFromUrl(userCV.url, userCV.name);
      setCvFile(file);
      setUsingSavedCV(true);
      setSelectedBuilderItem(null); // Reset builder item when using saved CV
      notify.success('Saved CV selected successfully');
    } catch (error) {
      console.error('Error using saved CV:', error);
      // Error toast is already shown in downloadCVFromUrl
    }
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
      notify.success('Content validation has been enabled');
    } else {
      notify.success('Content validation has been temporarily disabled');
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
# ATS Resume Analysis Task - RUTHLESS & PRECISE

## Instructions
Analyze the provided resume PDF against the job description below. Your goal is to provide a brutally honest assessment.
**CORE DIRECTIVE**: You must distinguish between a candidate who "knows about" a topic and one who "does" the job. 
**EXAMPLE**: A "Functional Consultant" is NOT a "Technical Developer" even if they know Salesforce. A "Project Manager" is NOT a "Software Engineer".

## Job Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## SCORING ALGORITHM: ZERO-BASED SCORING
Do NOT start at 100 and deduct. Start at **0** and ADD points only for proven matches.

### PHASE 1: THE ROLE ALIGNMENT GATE (CRITICAL)
Before checking keywords, you MUST validate the ROLE TYPE.
1. **Title/Level Check**: Does the candidate's recent history match the target role's level (e.g., Junior vs Senior, Lead vs Manager)?
2. **Nature of Work**: Is there a functional vs. technical mismatch?
   - *Example*: Functional Salesforce Consultant applying for Salesforce Developer role -> MISMATCH.
   - *Example*: Project Manager applying for Coding role -> MISMATCH.

**GATE RULE**: If there is a fundamental Role/Nature mismatch, **STOP SCORING HIGHER THAN 45%**. 
- The match score MUST be between 0-45%.
- Do NOT look at keyword matches to inflate this. Wrong role = Fail.

### PHASE 2: CALCULATE SCORE (Only if Phase 1 passes)
Start at 0. Add points as follows:

1. **Role Alignment (Max 20 pts)**: 
   - Perfect title/level match: +20
   - Adjacent role but same domain: +10
   - Mismatch: +0

2. **Hard Skills & Tools (Max 30 pts)**:
   - Meets ALL critical technical skills with required depth: +30
   - Meets most critical skills: +20
   - Missing key tools (e.g., Python for ML role): +0

3. **Experience Depth (Max 20 pts)**:
   - Meets/Exceeds years of experience in RELEVANT tasks: +20
   - Slightly under experienced: +10
   - Significantly junior/senior misalignment: +0

4. **Education & Certifications (Max 15 pts)**:
   - Degree/Certs match requirements: +15
   - Partial match: +5 to +10
   - Missing required degree/certs: +0

5. **Soft Skills & Culture (Max 15 pts)**:
   - Communication, leadership, etc. as evidenced by achievements: +15

**TOTAL SCORE = Sum of above.**

## SCORING TIERS (STRICT ENFORCEMENT)
- **0-45% (Mismatch)**: Fundamental role mismatch (e.g., Functional vs Technical) OR missing >50% critical skills.
- **46-60% (Weak)**: Right role type, but significantly underqualified or missing critical "Must-Haves".
- **61-75% (Potential)**: Good role alignment, has core skills, but missing some specific requirements or years of exp.
- **76-89% (Strong)**: Strong role alignment, meets ALL critical requirements, good experience depth.
- **90-100% (Perfect)**: Unicorn candidate. Exact role match, exceeds years, has all nice-to-haves.

## Output Format
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

## Final Check
- Did you check for Functional vs Technical mismatch?
- If the candidate is a "Consultant" applying for a "Developer" role, did you cap the score at 45?
- Did you start at 0 and add points?
- **AVOID CLUSTERING**: Do not default to 75%. If they are a 40% match, say 40%.
`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.2", // Updated to latest (Dec 2025)
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

  // Loading messages removed - background analysis now

  // Fonction pour extraire les informations du job depuis l'URL
  const handleExtractJobInfo = async () => {
    if (!formData.jobUrl || !formData.jobUrl.trim()) {
      notify.error('Please enter a job URL first');
      return;
    }

    setIsExtractingJob(true);
    notify.info('Extracting job information with AI...', { duration: 2000 });

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
          notify.warning('The job description extracted seems very short (< 300 chars). Please verify it contains all sections from the page.');
        } else if (descriptionLength < 800) {
          console.warn('Job description may be incomplete. Most job postings are longer.');
          notify.warning('The extracted description may be incomplete. Please review and ensure all sections were captured.');
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
          notify.warning(`The extracted description may be missing some sections (${missingSections.join(', ')}). Please review the original page and add missing information manually if needed.`);
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
          notify.success(`Job information extracted successfully! (${descLength} characters)`);
        } else {
          notify.success('Job information extracted successfully!');
        }
      } catch (parseError: any) {
        console.error('Error parsing extracted data:', parseError);
        notify.error(`Failed to parse extracted information: ${parseError.message || 'Unknown error'}. Please try again or enter the information manually.`);
        throw parseError;
      }
    } catch (error: any) {
      console.error('Error extracting job info:', error);
      notify.error(`Failed to extract job information: ${error.message || 'Unknown error'}. Please try again or enter the information manually.`);
    } finally {
      setIsExtractingJob(false);
    }
  };

  // Fonction pour effectuer l'analyse en arrière-plan
  const handleAnalysis = async () => {
    // Capture selectedSavedJob at call time to avoid stale closure issues
    const jobToLink = selectedSavedJob;
    
    let placeholderId: string | null = null;

    try {
      // Force disable validation to ensure we use the real API
      setValidationOptions({
        disableValidation: true,
        logLevel: 2
      });

      console.log("🚀 STARTING ANALYSIS - Using GPT-4o Vision for PDF analysis");

      // Fermer le modal immédiatement
      setIsModalOpen(false);

      if (!cvFile && !selectedCV && !selectedBuilderItem) {
        notify.error('Please select a resume');
        return;
      }

      // Handle selected builder item (convert to cvFile)
      let effectiveCvFile = cvFile;
      if (selectedBuilderItem && !cvFile) {
        if (selectedBuilderItem.type === 'document') {
          // It's an imported PDF - fetch it as a File
          const doc = selectedBuilderItem.item as ImportedDocument;
          try {
            console.log('📥 Fetching PDF from Resume Builder:', doc.name);
            const response = await fetch(doc.fileUrl);
            const blob = await response.blob();
            effectiveCvFile = new File([blob], doc.name, { type: 'application/pdf' });
            console.log('✅ PDF fetched successfully:', effectiveCvFile.name);
          } catch (fetchError) {
            console.error('❌ Error fetching PDF:', fetchError);
            notify.error('Failed to load the selected PDF');
            return;
          }
        } else {
          // It's a structured Resume - convert CVData to text and create a mock PDF
          const resume = selectedBuilderItem.item as Resume;
          console.log('📝 Converting Resume Builder CV to text:', resume.name);
          
          // Convert CVData to structured text
          const cvData = resume.cvData;
          let textContent = '';
          
          // Personal Info
          if (cvData.personalInfo) {
            const p = cvData.personalInfo;
            textContent += `${p.firstName || ''} ${p.lastName || ''}\n`;
            if (p.title) textContent += `${p.title}\n`;
            if (p.email) textContent += `Email: ${p.email}\n`;
            if (p.phone) textContent += `Phone: ${p.phone}\n`;
            if (p.location) textContent += `Location: ${p.location}\n`;
            if (p.linkedin) textContent += `LinkedIn: ${p.linkedin}\n`;
            if (p.portfolio) textContent += `Portfolio: ${p.portfolio}\n`;
            if (p.github) textContent += `GitHub: ${p.github}\n`;
            textContent += '\n';
          }
          
          // Summary
          if (cvData.summary) {
            textContent += `PROFESSIONAL SUMMARY\n${cvData.summary}\n\n`;
          }
          
          // Experience
          if (cvData.experiences && cvData.experiences.length > 0) {
            textContent += 'WORK EXPERIENCE\n';
            for (const exp of cvData.experiences) {
              textContent += `${exp.title || ''} at ${exp.company || ''}\n`;
              textContent += `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}\n`;
              if (exp.location) textContent += `${exp.location}\n`;
              if (exp.description) textContent += `${exp.description}\n`;
              if (exp.achievements && exp.achievements.length > 0) {
                for (const achievement of exp.achievements) {
                  textContent += `• ${achievement}\n`;
                }
              }
              textContent += '\n';
            }
          }
          
          // Education
          if (cvData.education && cvData.education.length > 0) {
            textContent += 'EDUCATION\n';
            for (const edu of cvData.education) {
              textContent += `${edu.degree || ''} in ${edu.field || ''}\n`;
              textContent += `${edu.institution || ''}\n`;
              textContent += `${edu.startDate || ''} - ${edu.endDate || ''}\n`;
              if (edu.gpa) textContent += `GPA: ${edu.gpa}\n`;
              if (edu.achievements && edu.achievements.length > 0) {
                for (const achievement of edu.achievements) {
                  textContent += `• ${achievement}\n`;
                }
              }
              textContent += '\n';
            }
          }
          
          // Skills
          if (cvData.skills && cvData.skills.length > 0) {
            textContent += 'SKILLS\n';
            const skillsByCategory: Record<string, string[]> = {};
            for (const skill of cvData.skills) {
              const category = skill.category || 'Other';
              if (!skillsByCategory[category]) skillsByCategory[category] = [];
              skillsByCategory[category].push(skill.name);
            }
            for (const [category, skills] of Object.entries(skillsByCategory)) {
              textContent += `${category}: ${skills.join(', ')}\n`;
            }
            textContent += '\n';
          }
          
          // Certifications
          if (cvData.certifications && cvData.certifications.length > 0) {
            textContent += 'CERTIFICATIONS\n';
            for (const cert of cvData.certifications) {
              textContent += `${cert.name || ''} - ${cert.issuer || ''}\n`;
              if (cert.date) textContent += `Issued: ${cert.date}\n`;
              textContent += '\n';
            }
          }
          
          // Languages
          if (cvData.languages && cvData.languages.length > 0) {
            textContent += 'LANGUAGES\n';
            for (const lang of cvData.languages) {
              textContent += `${lang.name}: ${lang.proficiency || 'N/A'}\n`;
            }
            textContent += '\n';
          }
          
          // Projects
          if (cvData.projects && cvData.projects.length > 0) {
            textContent += 'PROJECTS\n';
            for (const proj of cvData.projects) {
              textContent += `${proj.name || ''}\n`;
              if (proj.description) textContent += `${proj.description}\n`;
              if (proj.technologies && proj.technologies.length > 0) {
                textContent += `Technologies: ${proj.technologies.join(', ')}\n`;
              }
              if (proj.url) textContent += `URL: ${proj.url}\n`;
              textContent += '\n';
            }
          }

          console.log('📄 CV text content generated, length:', textContent.length);
          
          // Create a PDF from the text content using jsPDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          // Configure PDF styling
          pdf.setFont('helvetica');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 15;
          const maxWidth = pageWidth - (margin * 2);
          let yPosition = margin;
          const lineHeight = 5;
          
          // Split text into lines and add to PDF
          const lines = textContent.split('\n');
          for (const line of lines) {
            // Check if we need a new page
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            // Check if it's a header (all caps)
            const isHeader = line === line.toUpperCase() && line.length > 3 && !line.includes(':');
            
            if (isHeader) {
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'bold');
              yPosition += 3; // Add some space before headers
            } else if (line.startsWith('•')) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
            } else {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
            }
            
            // Wrap long lines
            const wrappedLines = pdf.splitTextToSize(line, maxWidth);
            for (const wrappedLine of wrappedLines) {
              if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(wrappedLine, margin, yPosition);
              yPosition += lineHeight;
            }
          }
          
          // Convert PDF to blob and then to File
          const pdfBlob = pdf.output('blob');
          effectiveCvFile = new File([pdfBlob], `${resume.name}.pdf`, { type: 'application/pdf' });
          console.log('✅ PDF created from Resume Builder CV:', effectiveCvFile.name);
        }
      }

      // Créer une carte placeholder immédiatement pour une expérience non-bloquante
      placeholderId = crypto.randomUUID();
      const placeholderAnalysis: ATSAnalysis = {
        id: placeholderId,
        date: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous',
        jobTitle: formData.jobTitle || 'Analyzing...',
        company: formData.company || 'Processing...',
        matchScore: 0,
        keyFindings: [],
        skillsMatch: {
          matching: [],
          missing: [],
          alternative: []
        },
        categoryScores: {
          skills: 0,
          experience: 0,
          education: 0,
          industryFit: 0
        },
        executiveSummary: '',
        experienceAnalysis: [],
        recommendations: [],
        _isLoading: true, // Flag pour identifier les analyses en cours
      };

      // Sauvegarder immédiatement le placeholder dans Firestore pour persister l'état
      try {
        const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
        await setDoc(doc(analysesRef, placeholderId), {
          ...placeholderAnalysis,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        console.log('✅ Placeholder saved to Firestore:', placeholderId);
      } catch (error) {
        console.error('❌ Error saving placeholder:', error);
      }

      // Ajouter le placeholder à la liste
      setAnalyses(prev => [placeholderAnalysis, ...prev]);

      // Afficher un toast informatif
      notify.info('Analysis started in background. You can continue browsing.', {
        duration: 4000,
        icon: '🚀'
      });

      // Use PDF file for PREMIUM ATS Analysis
      if (effectiveCvFile && effectiveCvFile.type === 'application/pdf') {
        console.log('🎯 Using PREMIUM ATS Analysis for PDF:', effectiveCvFile.name);

        try {
          // Prepare job details - use actual formData values
          const jobTitle = formData.jobTitle?.trim() || '';
          const company = formData.company?.trim() || '';
          const jobDescription = formData.jobDescription?.trim() || '';

          console.log('🔍 Current formData before analysis:', {
            jobTitle,
            company,
            jobDescriptionLength: jobDescription.length,
          });

          if (!jobTitle || !company || jobTitle === 'Untitled Position' || company === 'Unknown Company') {
            notify.error('Job title and company are required. Please extract or enter them first.');
            console.error('❌ Missing job information:', { jobTitle, company });
            // Supprimer le placeholder de Firestore et de l'état local
            try {
              const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
              await deleteDoc(doc(analysesRef, placeholderId));
            } catch (deleteError) {
              console.error('❌ Error deleting placeholder:', deleteError);
            }
            setAnalyses(prev => prev.filter(a => a.id !== placeholderId));
            return;
          }

          console.log('📸 Converting PDF to images for premium analysis...');

          const result = await analyzePDFWithPremiumATS(
            effectiveCvFile,
            {
              jobTitle,
              company,
              jobDescription: jobDescription || 'Not provided',
              location: (formData as any).location || undefined,
              jobUrl: formData.jobUrl,
            },
            auth.currentUser?.uid || 'anonymous',
            placeholderId // Utiliser le placeholder ID
          );

          if (result.status === 'error') {
            // Mark analysis as failed in Firestore before throwing
            try {
              const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
              await setDoc(doc(analysesRef, placeholderId), {
                _isLoading: false,
                status: 'failed',
                error: result.message || 'Premium analysis failed',
                updatedAt: serverTimestamp(),
              }, { merge: true });
              console.log('✅ Marked analysis as failed in Firestore');
            } catch (firestoreError) {
              console.error('❌ Error updating Firestore:', firestoreError);
            }
            throw new Error(result.message || 'Premium analysis failed');
          }

          console.log('✅ Premium ATS analysis successful!', result.analysis);

          // Generate job summary in parallel
          const jobSummary = await generateJobSummary(jobTitle, company, jobDescription);
          console.log('✅ Job summary generated:', jobSummary ? `Yes (${jobSummary.length} chars)` : 'No');

          // The premium analysis already saved to Firestore in the Cloud Function
          // Extract cvText from the analysis (should be extracted by AI during analysis)
          const cvText = result.analysis?.analysis?.cvText || '';

          // CRITICAL: Validate and enforce strict scoring rules LOCALLY
          // This ensures that even if the Cloud Function returns an inflated score,
          // our local "Role Gate" and "Strict Scoring" logic will override it.
          // We need to construct a temporary analysis object to pass to validation
          const tempAnalysis: ATSAnalysis = {
            id: placeholderId,
            date: new Date().toISOString(),
            userId: auth.currentUser?.uid || 'anonymous',
            jobTitle: jobTitle,
            company: company,
            matchScore: result.analysis?.analysis?.match_scores?.overall_score || 0,
            keyFindings: result.analysis?.analysis?.top_strengths?.map((s: any) => s.name) || [],
            skillsMatch: {
              matching: result.analysis?.analysis?.match_breakdown?.skills?.matched?.map((skill: string) => ({
                name: skill,
                relevance: 65
              })) || [],
              missing: result.analysis?.analysis?.match_breakdown?.skills?.missing?.map((skill: string) => ({
                name: skill,
                relevance: 45
              })) || [],
              alternative: []
            },
            categoryScores: {
              skills: result.analysis?.analysis?.match_scores?.skills_score || 0,
              experience: result.analysis?.analysis?.match_scores?.experience_score || 0,
              education: result.analysis?.analysis?.match_scores?.education_score || 0,
              industryFit: result.analysis?.analysis?.match_scores?.industry_fit_score || 0,
            },
            executiveSummary: result.analysis?.analysis?.executive_summary || '',
            experienceAnalysis: [],
            recommendations: result.analysis?.analysis?.top_gaps?.map((gap: any) => ({
              title: gap.name,
              description: `${gap.why_it_matters}\n\n${gap.how_to_fix}`,
              priority: gap.severity === 'High' ? 'high' : gap.severity === 'Medium' ? 'medium' : 'low',
              examples: gap.how_to_fix
            })) || [],
            marketPositioning: {
              competitiveAdvantages: [],
              competitiveDisadvantages: [],
              industryTrends: ''
            }
          };

          // Apply validation
          const validatedTempAnalysis = validateAndEnforceStrictScoring(
            tempAnalysis,
            cvText || 'CV content unavailable',
            jobDescription
          );

          console.log(`✅ Premium Analysis Validated: ${tempAnalysis.matchScore}% -> ${validatedTempAnalysis.matchScore}%`);

          // Update the placeholder with real data (using validated scores)
          const fullAnalysis = {
            ...validatedTempAnalysis,
            jobSummary: jobSummary || undefined,
            // Store full premium analysis for future use
            _premiumAnalysis: result.analysis?.analysis,
          };

          console.log('💾 Analysis completed with:', {
            jobTitle: fullAnalysis.jobTitle,
            company: fullAnalysis.company,
            matchScore: fullAnalysis.matchScore,
            hasJobSummary: !!fullAnalysis.jobSummary,
            hasCvText: !!cvText,
            cvTextLength: cvText.length,
          });

          // Mettre à jour Firestore avec les vraies données
          // Note: cvText is already saved by Cloud Function, but we ensure it's included here too
          try {
            const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
            await setDoc(doc(analysesRef, placeholderId), {
              ...fullAnalysis,
              cvText: cvText, // ✅ Ensure cvText is saved (already saved by Cloud Function, but ensure it's here too)
              extractedText: cvText, // ✅ Fallback field
              jobDescription: jobDescription, // ✅ Ensure jobDescription is saved
              _isLoading: false, // Enlever le flag de chargement
              timestamp: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
            console.log('✅ Analysis updated in Firestore:', placeholderId);

            // 🔗 Link analysis to job application if jobToLink is set
            if (jobToLink?.id) {
              console.log(`🔗 Linking analysis ${placeholderId} to job ${jobToLink.id}`);
              try {
                const jobRef = doc(db, 'users', auth.currentUser.uid, 'jobApplications', jobToLink.id);
                await updateDoc(jobRef, {
                  cvAnalysisId: placeholderId,
                  updatedAt: serverTimestamp()
                });
                console.log(`✅ Successfully linked analysis to ${jobToLink.companyName} - ${jobToLink.position}`);
                notify.success(`Analysis linked to ${jobToLink.companyName}`);
              } catch (linkError) {
                console.error('❌ Error linking analysis:', linkError);
              }
            }
          } catch (error) {
            console.error('❌ Error updating analysis in Firestore:', error);
          }

          // Remplacer le placeholder par l'analyse complète dans l'état local
          setAnalyses(prev => prev.map(a =>
            a.id === placeholderId ? { ...fullAnalysis as any, _isLoading: false } : a
          ));

          // Reset form
          setCurrentStep(1);
          setCvFile(null);
          setUsingSavedCV(false);
          setSelectedCV('');
          setSelectedSavedJob(null);
          setJobSearchQuery('');
          setShowJobDropdown(false);
          setSelectedBuilderItem(null);
          setShowCVSelector(false);
          setCvSelectorSearch('');

          // Notification de succès
          notify.success(`Analysis complete! Match score: ${fullAnalysis.matchScore}%`, {
            duration: 5000,
            icon: '🎉'
          });
        } catch (error: any) {
          console.error('❌ Premium ATS analysis failed:', error);
          // Supprimer le placeholder de Firestore et de l'état local
          try {
            const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
            await deleteDoc(doc(analysesRef, placeholderId));
            console.log('✅ Placeholder removed from Firestore');
          } catch (deleteError) {
            console.error('❌ Error deleting placeholder from Firestore:', deleteError);
          }
          setAnalyses(prev => prev.filter(a => a.id !== placeholderId));
          notify.error(`Analysis failed: ${error.message || 'Unknown error'}`, {
            duration: 5000
          });
        }
      } else {
        notify.error('Please upload a PDF file for analysis');
        // Supprimer le placeholder de Firestore et de l'état local
        try {
          const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
          await deleteDoc(doc(analysesRef, placeholderId));
        } catch (deleteError) {
          console.error('❌ Error deleting placeholder:', deleteError);
        }
        setAnalyses(prev => prev.filter(a => a.id !== placeholderId));
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      // Supprimer le placeholder de Firestore et de l'état local si il existe
      if (placeholderId) {
        try {
          const analysesRef = collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'analyses');
          await deleteDoc(doc(analysesRef, placeholderId));
        } catch (deleteError) {
          console.error('❌ Error deleting placeholder:', deleteError);
        }
        setAnalyses(prev => prev.filter(a => a.id !== placeholderId));
      }
      notify.error(`Analysis failed: ${error.message || 'Unknown error'}`, {
        duration: 5000
      });
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

    // Helper to safely get date as string
    const getDateString = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toISOString().split('T')[0];
      }
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return String(date);
    };

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.jobTitle?.toLowerCase() || '').includes(query) ||
          (a.company?.toLowerCase() || '').includes(query) ||
          getDateString(a.date).toLowerCase().includes(query)
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
        const dateA = getDateString(a.date);
        const dateB = getDateString(b.date);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      if (sortBy === 'score') {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'company') {
        return (a.company || '').localeCompare(b.company || '');
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
      notify.success('Analysis deleted');
      return;
    }

    try {
      console.log('Tentative de suppression de l\'analyse:', analysisId);
      // Supprimer de Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid, 'analyses', analysisId));

      // Mettre à jour l'UI
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      notify.success('Analysis deleted');
    } catch (error) {
      console.error('Error deleting analysis:', error);

      // Vérifier si c'est une erreur de permission
      if (error instanceof Error && error.toString().includes('permission')) {
        console.warn('Permission error detected. You need to update Firestore security rules.');
        notify.error('Permission error during delete. Please check Firestore security rules.');
      } else {
        notify.error('Unable to delete analysis');
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
      notify.success('Analysis duplicated');
    } catch (e) {
      console.error('Error duplicating analysis:', e);
      notify.error('Unable to duplicate analysis');
    }
  };

  // Handle file select for cover
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    // Reset input
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  // Handle cropped cover
  const handleCroppedCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
  };

  // Handle direct cover apply from gallery (no cropper)
  const handleDirectApplyCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
  };

  // Function to detect if cover image is dark or light
  const detectCoverBrightness = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(true); // Default to dark if canvas fails
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Sample pixels from the image (sample every 10th pixel for performance)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let totalBrightness = 0;
          let sampleCount = 0;
          
          for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel (RGBA = 4 bytes)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Calculate luminance using relative luminance formula
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += luminance;
            sampleCount++;
          }
          
          const averageBrightness = totalBrightness / sampleCount;
          // If average brightness is less than 0.5, consider it dark
          resolve(averageBrightness < 0.5);
        } catch (error) {
          console.error('Error detecting cover brightness:', error);
          resolve(true); // Default to dark on error
        }
      };
      
      img.onerror = () => {
        resolve(true); // Default to dark on error
      };
      
      img.src = imageUrl;
    });
  };

  // Handle cover photo update
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const fileName = `cv_analysis_cover_${timestamp}.jpg`;
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      // Delete old cover if exists - extract path from URL
      if (coverPhoto) {
        try {
          // Extract the path from the full URL
          const urlParts = coverPhoto.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const oldCoverRef = ref(storage, decodedPath);
            await deleteObject(oldCoverRef);
          }
        } catch (e) {
          console.warn('Could not delete old cover photo from storage', e);
        }
      }

      // Save to Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentCvAnalysisPrefs = currentPagePreferences.cvAnalysis || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          cvAnalysis: {
            ...currentCvAnalysisPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);
      
      // Detect brightness of new cover
      const isDark = await detectCoverBrightness(coverUrl);
      setIsCoverDark(isDark);
      
      notify.success('Cover updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Handle cover photo removal
  const handleRemoveCover = async () => {
    if (!currentUser || !coverPhoto) return;

    setIsUpdatingCover(true);
    try {
      // Delete from storage - extract path from URL
      try {
        // Extract the path from the full URL
        const urlParts = coverPhoto.split('/o/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split('?')[0];
          const decodedPath = decodeURIComponent(pathPart);
          const coverRef = ref(storage, decodedPath);
          await deleteObject(coverRef);
        }
      } catch (e) {
        console.warn('Could not delete cover photo from storage', e);
      }

      // Remove from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentCvAnalysisPrefs = currentPagePreferences.cvAnalysis || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          cvAnalysis: {
            ...currentCvAnalysisPrefs,
            coverPhoto: null
          }
        }
      });

      setCoverPhoto(null);
      setIsCoverDark(null);
      notify.success('Cover removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Helpers: logo from company name (best-effort) with placeholder fallback
  // Functions removed - now using CompanyLogo component

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
    const isAnalysisLoading = analysis._isLoading || false;

    const toggleExpand = () => {
      // Ne pas permettre l'expansion si l'analyse est en cours
      if (isAnalysisLoading) return;
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

    // Minimal loading skeleton
    if (isAnalysisLoading) {
      return (
        <motion.div
          key={analysis.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-xl p-5 
            border border-dashed border-gray-300 dark:border-[#4a494b]"
        >
          <div className="flex items-start gap-3">
            {/* Logo placeholder */}
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-[#3d3c3e] 
              flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 dark:bg-[#3d3c3e] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-[#3d3c3e] rounded animate-pulse w-1/2" />
            </div>
            
            {/* Score placeholder */}
            <div className="w-12 h-6 bg-gray-100 dark:bg-[#3d3c3e] rounded-md animate-pulse" />
          </div>

          {/* Status */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]/50">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Analyzing...
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    // Get score color based on match score
    const getScoreBadgeStyles = (score: number) => {
      if (score >= 80) return {
        bg: 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10',
        text: 'text-[#635BFF] dark:text-[#a5a0ff]',
        border: 'border-[#635BFF]/20 dark:border-[#635BFF]/20',
        glow: 'group-hover:shadow-[#635BFF]/20'
      };
      if (score >= 65) return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-500/20',
        glow: 'group-hover:shadow-blue-500/20'
      };
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-500/20',
        glow: 'group-hover:shadow-rose-500/20'
      };
    };

    const scoreStyles = getScoreBadgeStyles(analysis.matchScore);

    return (
      <motion.div
        key={analysis.id}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        layout={false}
        className="group relative bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-xl p-5 
          border border-gray-200/60 dark:border-[#3d3c3e]/50
          hover:border-gray-300/80 dark:hover:border-gray-600/60
          shadow-sm hover:shadow-md
          cursor-pointer transition-all duration-200"
        onClick={() => {
          if (onSelect) {
            onSelect();
          } else {
            toggleExpand();
          }
        }}
      >
        <div className="relative">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Company Logo */}
            <CompanyLogo
              companyName={analysis.company}
              size="lg"
              className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {analysis.jobTitle}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    <span className="truncate">{analysis.company}</span>
                  </p>
                </div>

                {/* Score Badge - Minimal */}
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium tabular-nums
                  ${scoreStyles.bg} ${scoreStyles.text}
                  transition-colors duration-200`}
                >
                  {analysis.matchScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Skills preview - minimal */}
          {!isExpanded && (() => {
            const matchingSkills = Array.isArray(analysis.skillsMatch?.matching)
              ? analysis.skillsMatch.matching
              : [];

            const skillsToShow = matchingSkills.length > 0
              ? matchingSkills
              : (analysis.keyFindings && Array.isArray(analysis.keyFindings) && analysis.keyFindings.length > 0
                ? analysis.keyFindings.slice(0, 5).map((finding: string) => ({ name: finding, relevance: 70 }))
                : []);

            if (skillsToShow.length > 0) {
              return (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skillsToShow
                    .filter((skill: any) => skill && (typeof skill === 'string' ? skill : skill.name))
                    .map((skill: any, idx: number) => {
                      const skillName = typeof skill === 'string' ? skill : (skill.name || '');
                      return skillName ? (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-md 
                            bg-gray-100/80 dark:bg-[#3d3c3e]/60 
                            text-gray-600 dark:text-gray-400
                            font-normal"
                        >
                          {skillName}
                        </span>
                      ) : null;
                    })
                    .filter(Boolean)
                    .slice(0, 3)}
                  {skillsToShow.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-md 
                      text-gray-400 dark:text-gray-500">
                      +{skillsToShow.length - 3}
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Footer - minimal */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]/50">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDateString(analysis.date)}
            </span>

            {/* Quick actions - appear on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                  dark:hover:text-gray-300 dark:hover:bg-[#3d3c3e]
                  transition-colors"
                aria-label="View details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplicateAnalysis(analysis); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                  dark:hover:text-gray-300 dark:hover:bg-[#3d3c3e]
                  transition-colors"
                aria-label="Duplicate"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
                  dark:hover:text-red-400 dark:hover:bg-red-500/10
                  transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3d3c3e]">
              {/* Score Explanation Card */}
              <div className="mb-5 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] overflow-hidden">
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

                  <div className="w-full h-2.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${analysis.matchScore >= 80 ? 'bg-gradient-to-r from-purple-500 to-indigo-500' :
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
                  <div key={idx} className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-xl p-3 flex flex-col items-center justify-center">
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
                <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('summary')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-500" />
                      <span className="font-medium">Executive Summary</span>
                    </div>
                    {expandedSection === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'summary' && (
                    <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                      <p className="text-gray-700 dark:text-gray-300">{analysis.executiveSummary}</p>
                    </div>
                  )}
                </div>

                {/* Skills Match */}
                <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('skills')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                  >
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-[#635BFF]" />
                      <span className="font-medium">Matching Skills</span>
                    </div>
                    {expandedSection === 'skills' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'skills' && (
                    <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                      {analysis.skillsMatch?.matching && analysis.skillsMatch.matching.length > 0 ? (
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
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No skills data available</p>
                      )}

                      {analysis.skillsMatch?.missing && analysis.skillsMatch.missing.length > 0 && (
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
                <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('experience')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                  >
                    <div className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                      <span className="font-medium">Experience Analysis</span>
                    </div>
                    {expandedSection === 'experience' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'experience' && (
                    <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                      <div className="space-y-4">
                        {analysis.experienceAnalysis.map((item, idx) => (
                          <div key={idx} className="pb-4 border-b border-gray-100 dark:border-[#3d3c3e] last:border-0 last:pb-0">
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
                  <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
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
                      <div className="p-4 bg-white dark:bg-[#2b2a2c]">
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
                                  className={`p-4 rounded-lg border-2 ${req.found
                                    ? 'bg-[#635BFF]/5 dark:bg-[#5249e6]/10 border-[#635BFF]/30 dark:border-[#5249e6]/50'
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {req.found ? (
                                          <CheckCircle className="w-5 h-5 text-[#5249e6] dark:text-[#a5a0ff] flex-shrink-0" />
                                        ) : (
                                          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        )}
                                        <span className="font-semibold text-gray-900 dark:text-white">{req.requirement}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${req.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                          req.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            req.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                              req.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-400'
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
                                    <p className="text-xs text-[#635BFF] dark:text-[#a5a0ff] mt-2">
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
                                  className={`p-3 rounded-lg border ${req.found
                                    ? 'bg-[#635BFF]/5 dark:bg-[#5249e6]/10 border-[#635BFF]/20 dark:border-[#5249e6]/50'
                                    : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {req.found ? (
                                        <CheckCircle className="w-4 h-4 text-[#5249e6] dark:text-[#a5a0ff]" />
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
                                    <p className="text-xs text-[#635BFF] dark:text-[#a5a0ff] mt-1 ml-6">
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
                                  className={`p-2 rounded-lg border text-sm ${req.found
                                    ? 'bg-[#635BFF]/5 dark:bg-[#5249e6]/10 border-[#635BFF]/20 dark:border-[#5249e6]/50'
                                    : 'bg-gray-50 dark:bg-[#3d3c3e]/40 border-gray-200 dark:border-[#3d3c3e]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {req.found ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-[#5249e6] dark:text-[#a5a0ff] flex-shrink-0" />
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
                  <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
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
                      <div className="p-4 bg-white dark:bg-[#2b2a2c]">
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
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${gap.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                          gap.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            gap.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                              gap.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-400'
                                          }`}>
                                          {gap.category}
                                        </span>
                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                          -{gap.scoreImpact} points | CRITICAL
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-3 mb-3 border border-red-200 dark:border-red-800">
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
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${gap.category === 'skill' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                          gap.category === 'experience' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            gap.category === 'education' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                              gap.category === 'certification' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-400'
                                          }`}>
                                          {gap.category}
                                        </span>
                                        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                          -{gap.scoreImpact} points | {gap.priority.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-2 mb-2 border border-orange-200 dark:border-orange-800">
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
                <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('recommendations')}
                    className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                  >
                    <div className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                      <span className="font-medium">Recommendations</span>
                    </div>
                    {expandedSection === 'recommendations' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === 'recommendations' && (
                    <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec, idx) => (
                          <div key={idx} className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${rec.priority === 'high'
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
                              <div className="mt-2 text-sm bg-gray-50 dark:bg-[#3d3c3e]/40 p-2 rounded-md text-gray-700 dark:text-gray-300">
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
                  <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('atsOptimization')}
                      className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
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
                      <div className="p-4 bg-white dark:bg-[#2b2a2c]">
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
                            <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-4">
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
                                <div className="w-full h-2 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${analysis.atsOptimization.keywordDensity.overallDensity >= 80
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
                                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#3d3c3e]/60 rounded-md">
                                        <div className="flex items-center">
                                          {kw.found ? (
                                            <CheckCircle className="w-4 h-4 text-[#635BFF] mr-2" />
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
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${kw.found
                                            ? kw.frequency >= kw.optimalFrequency
                                              ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff]'
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
                            <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-4">
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
                                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#3d3c3e]/60 rounded-md">
                                    <div className="flex items-center">
                                      {section.present ? (
                                        <CheckCircle className="w-4 h-4 text-[#635BFF] mr-2" />
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
                            <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-4">
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
                                <div className="w-full h-2 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${analysis.atsOptimization.readability.score >= 80
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
                            <div className="border-t border-gray-200 dark:border-[#3d3c3e] pt-4">
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
                  <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('marketPositioning')}
                      className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                    >
                      <div className="flex items-center">
                        <LineChart className="w-5 h-5 mr-2 text-indigo-500" />
                        <span className="font-medium">Competitive Analysis</span>
                      </div>
                      {expandedSection === 'marketPositioning' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSection === 'marketPositioning' && (
                      <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1.5 text-[#635BFF]" />
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
                  <div className="border border-gray-100 dark:border-[#3d3c3e] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('applicationStrategy')}
                      className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/60 transition-colors"
                    >
                      <div className="flex items-center">
                        <Target className="w-5 h-5 mr-2 text-teal-500" />
                        <span className="font-medium">Application Strategy</span>
                      </div>
                      {expandedSection === 'applicationStrategy' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSection === 'applicationStrategy' && (
                      <div className="p-4 bg-white dark:bg-[#2b2a2c]">
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                              <FileText className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                              Cover Letter Focus
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.applicationStrategy.coverLetterFocus}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                              <UserRound className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                              Interview Preparation
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.applicationStrategy.interviewPreparation}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1.5 flex items-center">
                              <Palette className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                              Portfolio Suggestions
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.applicationStrategy.portfolioSuggestions}
                            </p>
                          </div>
                          {analysis.applicationStrategy.networkingTips && analysis.applicationStrategy.networkingTips.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-lg p-3">
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
                            <div className="bg-gray-50 dark:bg-[#3d3c3e]/40 rounded-lg p-3">
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

        {/* Premium Delete Confirmation Dialog */}
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
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative bg-white dark:bg-[#242325] rounded-2xl shadow-2xl max-w-sm w-full p-6 mx-auto border border-gray-100 dark:border-[#3d3c3e]"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl 
                      bg-rose-50 dark:bg-rose-500/10 text-rose-500 mb-4">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete analysis?</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      This will permanently delete the analysis for <span className="font-medium text-gray-700 dark:text-gray-300">"{analysis.jobTitle}"</span>
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 
                        dark:bg-[#2b2a2c] dark:hover:bg-[#3d3c3e] 
                        text-gray-700 dark:text-gray-300 
                        rounded-xl font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 
                        text-white rounded-xl font-medium text-sm transition-colors
                        shadow-lg shadow-rose-600/20"
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
                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">Match Score</h5>
                    <p className="text-xs">Indicates your overall alignment with the job requirements. A score above 75% is considered strong.</p>
                  </div>

                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">Skills Match</h5>
                    <p className="text-xs">Shows which skills from the job you have and which are missing. Focus on adding missing high-relevance skills.</p>
                  </div>

                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-2 shadow-sm">
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 text-xs mb-1">ATS Optimization</h5>
                    <p className="text-xs">Evaluates how well your resume will perform in Applicant Tracking Systems. Implement formatting suggestions for better results.</p>
                  </div>

                  <div className="bg-white dark:bg-[#2b2a2c] rounded-lg p-2 shadow-sm">
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
        onClick={() => notify.info(
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

  const renderFileUpload = () => {
    // Debug log
    console.log('🔍 renderFileUpload - userCV:', userCV);

    return (
      <div className="mt-4 space-y-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Upload your resume
        </label>

        {/* Ajout du contrôle de validation */}
        <ValidationToggle />

        {/* Saved CV Option - Show if user has a saved CV - MADE VERY VISIBLE */}
        {userCV && userCV.url ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 rounded-xl p-5 transition-all duration-200 shadow-sm ${usingSavedCV
              ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/20 shadow-purple-200 dark:shadow-purple-900/20'
              : 'border-purple-300 dark:border-purple-600 bg-white dark:bg-[#2b2a2c] hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md'
              }`}
          >
            {/* Header with badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${usingSavedCV
                  ? 'bg-purple-600 dark:bg-purple-500'
                  : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                  <FileText className={`w-4 h-4 ${usingSavedCV
                    ? 'text-white'
                    : 'text-purple-600 dark:text-purple-400'
                    }`} />
                </div>
                <div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${usingSavedCV
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-purple-600 dark:text-purple-400'
                    }`}>
                    Saved CV
                  </span>
                </div>
              </div>
              {usingSavedCV && (
                <div className="px-2 py-1 bg-purple-600 dark:bg-purple-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Selected
                </div>
              )}
            </div>

            {/* CV Name - Large and Visible */}
            <div className="mb-4">
              <p className={`text-lg font-semibold mb-1 ${usingSavedCV
                ? 'text-purple-900 dark:text-purple-100'
                : 'text-gray-900 dark:text-white'
                }`}>
                {userCV.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From your professional profile
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCVPreview(true);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4a494b] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUseSavedCV();
                }}
                disabled={isDownloadingCV || usingSavedCV}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${usingSavedCV
                  ? 'bg-purple-600 dark:bg-purple-500 text-white cursor-default shadow-md'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30'
                  }`}
              >
                {isDownloadingCV ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : usingSavedCV ? (
                  <>
                    <Check className="w-4 h-4" />
                    Selected
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Use This CV
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-xl p-4 bg-gray-50 dark:bg-[#2b2a2c]/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No saved CV found in your profile. Upload a new one below.
            </p>
          </div>
        )}

        {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#4a494b]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#2b2a2c] px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

        {/* Choose from My CVs (Resume Builder) */}
        <motion.div
          initial={false}
          animate={{ height: showCVSelector ? 'auto' : 'auto' }}
          className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
            selectedBuilderItem
              ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c]'
          }`}
        >
          {/* Header - Always visible */}
          <button
            onClick={() => setShowCVSelector(!showCVSelector)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedBuilderItem
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-indigo-100 dark:bg-indigo-900/30'
              }`}>
                <FileText className={`w-5 h-5 ${
                  selectedBuilderItem
                    ? 'text-white'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedBuilderItem ? (
                    selectedBuilderItem.type === 'resume' 
                      ? (selectedBuilderItem.item as Resume).name
                      : (selectedBuilderItem.item as ImportedDocument).name
                  ) : 'Choose from My CVs'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedBuilderItem 
                    ? `${selectedBuilderItem.type === 'resume' ? 'Resume Builder CV' : 'Imported PDF'} selected`
                    : `${builderCVs.length} resumes, ${builderDocs.length} documents`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedBuilderItem && (
                <span className="px-2 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Selected
                </span>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showCVSelector ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Expandable Content */}
          <AnimatePresence>
            {showCVSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 dark:border-[#3d3c3e]"
              >
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100 dark:border-[#3d3c3e]/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={cvSelectorSearch}
                      onChange={(e) => setCvSelectorSearch(e.target.value)}
                      placeholder="Search your CVs..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#3d3c3e]/60 border border-gray-200 dark:border-[#4a494b] rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* CV List */}
                <div className="max-h-64 overflow-y-auto">
                  {isLoadingBuilderCVs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Resume Builder CVs */}
                      {builderCVs
                        .filter(cv => cv.name.toLowerCase().includes(cvSelectorSearch.toLowerCase()))
                        .map((cv) => {
                          const isSelected = selectedBuilderItem?.type === 'resume' && selectedBuilderItem.item.id === cv.id;
                          const displayDate = cv.updatedAt?.toDate ? cv.updatedAt.toDate() : new Date(cv.updatedAt || Date.now());
                          
                          return (
                            <div
                              key={`cv-${cv.id}`}
                              onClick={() => {
                                setSelectedBuilderItem({ type: 'resume', item: cv });
                                setUsingSavedCV(false);
                                setCvFile(null);
                              }}
                              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 dark:bg-indigo-500'
                                  : 'bg-purple-100 dark:bg-purple-900/30'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {cv.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Resume Builder • {displayDate.toLocaleDateString()}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}

                      {/* Imported PDF Documents */}
                      {builderDocs
                        .filter(doc => doc.name.toLowerCase().includes(cvSelectorSearch.toLowerCase()))
                        .map((doc) => {
                          const isSelected = selectedBuilderItem?.type === 'document' && selectedBuilderItem.item.id === doc.id;
                          const displayDate = doc.updatedAt?.toDate ? doc.updatedAt.toDate() : new Date(doc.updatedAt || Date.now());
                          
                          return (
                            <div
                              key={`doc-${doc.id}`}
                              onClick={() => {
                                setSelectedBuilderItem({ type: 'document', item: doc });
                                setUsingSavedCV(false);
                                setCvFile(null);
                              }}
                              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 dark:bg-indigo-500'
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-red-600 dark:text-red-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {doc.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PDF • {displayDate.toLocaleDateString()}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}

                      {/* Empty State */}
                      {builderCVs.length === 0 && builderDocs.length === 0 && (
                        <div className="py-8 text-center">
                          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No CVs in Resume Builder yet
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Create one in the Resume Builder
                          </p>
                        </div>
                      )}

                      {/* No results */}
                      {cvSelectorSearch && 
                        builderCVs.filter(cv => cv.name.toLowerCase().includes(cvSelectorSearch.toLowerCase())).length === 0 &&
                        builderDocs.filter(doc => doc.name.toLowerCase().includes(cvSelectorSearch.toLowerCase())).length === 0 && (
                        <div className="py-6 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No results for "{cvSelectorSearch}"
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-[#4a494b]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-[#2b2a2c] px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              OR
            </span>
          </div>
        </div>

        {/* Upload New CV Option */}
        <div
          data-tour="cv-upload"
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${cvFile && !usingSavedCV
            ? 'border-[#635BFF] dark:border-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#5249e6]/20'
            : 'border-gray-300 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Utiliser l'input file global
            const input = document.getElementById("global-file-input") as HTMLInputElement;
            if (input) input.click();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {cvFile && !usingSavedCV ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-16 h-16 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#5249e6] dark:text-[#a5a0ff]" />
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white mb-1 break-words text-center max-w-md">
                {cvFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {(cvFile.size / 1024).toFixed(1)} KB
              </p>
              <div className="px-3 py-1 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 rounded-full">
                <p className="text-xs font-medium text-[#635BFF] dark:text-[#a5a0ff]">
                  ✓ Resume selected successfully
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDragging
                ? 'bg-purple-100 dark:bg-purple-900/30'
                : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                <Upload className={`w-6 h-6 ${isDragging
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-purple-600 dark:text-purple-400'
                  }`} />
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
            id="global-file-input"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
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
  };

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
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
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
        className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] p-4 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
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

        <div className="mt-2 p-2 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg border border-gray-100/80 dark:border-[#3d3c3e]/80 text-xs text-gray-500 dark:text-gray-400 max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300">
          {description}
        </div>
      </div>
    );
  };

  const SkillTag = ({ skill, matched, relevance }: { skill: string; matched: boolean; relevance?: number }) => (
    <div
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200 backdrop-blur-sm ${matched
        ? "bg-[#635BFF]/5 dark:bg-[#5249e6]/20 text-[#635BFF] dark:text-[#a5a0ff] border border-[#635BFF]/20 dark:border-[#5249e6]/30 hover:bg-[#635BFF]/10 dark:hover:bg-[#5249e6]/30"
        : "bg-red-50/60 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/30 hover:bg-red-100/80 dark:hover:bg-red-900/30"
      }`}
    >
      {matched ? (
        <Check className="w-3 h-3 mr-1.5 text-[#5249e6] dark:text-[#a5a0ff] flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 mr-1.5 text-red-600 dark:text-red-500 flex-shrink-0" />
      )}
      <span className="truncate max-w-[120px]">{skill}</span>
      {matched && relevance && (
        <span className="ml-1.5 bg-white/60 dark:bg-[#2b2a2c]/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-[#3d3c3e]/50">
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
    let relevance = 50; // Base neutre, pas optimiste

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

    switch (title) {
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
        notify.error('La clé API OpenAI est manquante. Veuillez configurer votre .env.local');
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
      notify.error('Erreur lors de l\'analyse avancée. Utilisation de l\'analyse standard.');
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
          className="space-y-4"
        >
          {/* Saved CV Option - Show if user has a saved CV */}
          {userCV && userCV.url ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-2 rounded-xl p-4 transition-all duration-200 ${usingSavedCV
                ? 'border-[#635BFF] dark:border-[#a5a0ff] bg-gradient-to-br from-[#635BFF]/5 to-[#7c75ff]/5 dark:from-[#635BFF]/10 dark:to-[#5249e6]/10 shadow-lg shadow-[#635BFF]/10 dark:shadow-[#635BFF]/20'
                : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#1A1A1A] hover:border-[#635BFF]/50 dark:hover:border-[#a5a0ff]/50 hover:shadow-md'
                }`}
            >
              {/* Header with badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${usingSavedCV
                    ? 'bg-[#635BFF] dark:bg-[#635BFF]'
                    : 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                    }`}>
                    <FileText className={`w-4 h-4 ${usingSavedCV
                      ? 'text-white'
                      : 'text-[#635BFF] dark:text-[#a5a0ff]'
                      }`} />
                  </div>
                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${usingSavedCV
                      ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                      : 'text-[#635BFF] dark:text-[#a5a0ff]'
                      }`}>
                      Saved CV
                    </span>
                  </div>
                </div>
                {usingSavedCV && (
                  <div className="px-2 py-1 bg-[#635BFF] dark:bg-[#635BFF] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Selected
                  </div>
                )}
              </div>

              {/* CV Name - Large and Visible */}
              <div className="mb-3">
                <p className={`text-base font-semibold mb-0.5 ${usingSavedCV
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-900 dark:text-white'
                  }`}>
                  {userCV.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  From your professional profile
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCVPreview(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4a494b] rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUseSavedCV();
                  }}
                  disabled={isDownloadingCV || usingSavedCV}
                  className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${usingSavedCV
                    ? 'bg-[#635BFF] dark:bg-[#635BFF] text-white cursor-default shadow-md'
                    : 'bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white hover:from-[#5249e6] hover:to-[#635BFF] dark:hover:from-[#5249e6] dark:hover:to-[#635BFF] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#635BFF]/30'
                    }`}
                >
                  {isDownloadingCV ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : usingSavedCV ? (
                    <>
                      <Check className="w-4 h-4" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Use This CV
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-xl p-3 bg-gray-50 dark:bg-[#2b2a2c]/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                No saved CV found in your profile. Upload a new one below.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#4a494b]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#2b2a2c] px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

          {/* Choose from My CVs (Resume Builder) */}
          <div
            className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
              selectedBuilderItem
                ? 'border-[#635BFF] dark:border-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#1A1A1A]'
            }`}
          >
            {/* Header - Always visible */}
            <button
              onClick={() => setShowCVSelector(!showCVSelector)}
              className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  selectedBuilderItem
                    ? 'bg-[#635BFF] dark:bg-[#635BFF]'
                    : 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                }`}>
                  <FileText className={`w-4 h-4 ${
                    selectedBuilderItem
                      ? 'text-white'
                      : 'text-[#635BFF] dark:text-[#a5a0ff]'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedBuilderItem ? (
                      selectedBuilderItem.type === 'resume' 
                        ? (selectedBuilderItem.item as Resume).name
                        : (selectedBuilderItem.item as ImportedDocument).name
                    ) : 'Choose from My CVs'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedBuilderItem 
                      ? `${selectedBuilderItem.type === 'resume' ? 'Resume Builder CV' : 'Imported PDF'} selected`
                      : 'Select from Resume Builder'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedBuilderItem && (
                  <span className="px-2 py-1 bg-[#635BFF] dark:bg-[#635BFF] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Selected
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCVSelector ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expandable Content */}
            {showCVSelector && (
              <div className="border-t border-gray-200 dark:border-[#3d3c3e]">
                {/* Search Input */}
                <div className="p-2.5 border-b border-gray-100 dark:border-[#3d3c3e]/50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={cvSelectorSearch}
                      onChange={(e) => setCvSelectorSearch(e.target.value)}
                      placeholder="Search your CVs..."
                      className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#3d3c3e]/60 border border-gray-200 dark:border-[#4a494b] rounded-lg focus:ring-2 focus:ring-[#635BFF]/50 focus:border-[#635BFF]/50 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* CV List */}
                <div className="max-h-40 overflow-y-auto">
                  {isLoadingBuilderCVs ? (
                    <div className="flex items-center justify-center py-5">
                      <Loader2 className="w-5 h-5 text-[#635BFF] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Resume Builder CVs */}
                      {builderCVs
                        .filter(cv => cv.name.toLowerCase().includes(cvSelectorSearch.toLowerCase()))
                        .map((cv) => {
                          const isSelected = selectedBuilderItem?.type === 'resume' && selectedBuilderItem.item.id === cv.id;
                          const displayDate = cv.updatedAt?.toDate ? cv.updatedAt.toDate() : new Date(cv.updatedAt || Date.now());
                          
                          return (
                            <div
                              key={`cv-${cv.id}`}
                              onClick={() => {
                                setSelectedBuilderItem({ type: 'resume', item: cv });
                                setUsingSavedCV(false);
                                setCvFile(null);
                              }}
                              className={`px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-[#635BFF] dark:bg-[#635BFF]'
                                  : 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-[#635BFF] dark:text-[#a5a0ff]'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {cv.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Resume Builder • {displayDate.toLocaleDateString()}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff] flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}

                      {/* Imported PDF Documents */}
                      {builderDocs
                        .filter(doc => doc.name.toLowerCase().includes(cvSelectorSearch.toLowerCase()))
                        .map((doc) => {
                          const isSelected = selectedBuilderItem?.type === 'document' && selectedBuilderItem.item.id === doc.id;
                          const displayDate = doc.updatedAt?.toDate ? doc.updatedAt.toDate() : new Date(doc.updatedAt || Date.now());
                          
                          return (
                            <div
                              key={`doc-${doc.id}`}
                              onClick={() => {
                                setSelectedBuilderItem({ type: 'document', item: doc });
                                setUsingSavedCV(false);
                                setCvFile(null);
                              }}
                              className={`px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-[#635BFF] dark:bg-[#635BFF]'
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-red-600 dark:text-red-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {doc.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PDF • {displayDate.toLocaleDateString()}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff] flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}

                      {/* Empty State */}
                      {builderCVs.length === 0 && builderDocs.length === 0 && (
                        <div className="py-5 text-center">
                          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No CVs in Resume Builder yet
                          </p>
                        </div>
                      )}

                      {/* No results */}
                      {cvSelectorSearch && 
                        builderCVs.filter(cv => cv.name.toLowerCase().includes(cvSelectorSearch.toLowerCase())).length === 0 &&
                        builderDocs.filter(doc => doc.name.toLowerCase().includes(cvSelectorSearch.toLowerCase())).length === 0 && (
                        <div className="py-4 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No results for "{cvSelectorSearch}"
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-[#3d3c3e]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#2b2a2c] px-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                OR
              </span>
            </div>
          </div>

          {/* Upload New CV Option */}
          <div className="mb-3">
            <label
              ref={dropZoneRef}
              htmlFor="cv-upload-input-modal"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex items-center p-3 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200 ease-out
                backdrop-blur-sm
                group
                ${isDragging
                  ? 'border-[#635BFF] dark:border-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                  : cvFile && !usingSavedCV
                    ? 'border-[#635BFF]/50 dark:border-[#a5a0ff]/50 bg-[#635BFF]/5 dark:bg-[#5249e6]/10'
                    : 'border-gray-200 dark:border-[#3d3c3e] hover:border-[#635BFF]/50 dark:hover:border-[#a5a0ff]/50 bg-gray-50/50 dark:bg-[#2b2a2c]/30 hover:bg-gray-100/60 dark:hover:bg-[#1A1A1A]'
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-transform duration-200
                ${isDragging
                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20 scale-105'
                  : cvFile && !usingSavedCV
                    ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                    : 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20 group-hover:scale-105'
                }`}>
                {cvFile && !usingSavedCV ?
                  <Check className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" /> :
                  <Upload className={`w-5 h-5 ${isDragging ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-[#635BFF] dark:text-[#a5a0ff]'}`} />
                }
              </div>
              <div className="flex-1 text-left">
                <h3 className={`font-semibold text-sm mb-0.5 ${isDragging
                  ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                  : 'text-gray-900 dark:text-white'
                  }`}>
                  {cvFile && !usingSavedCV ? "Resume Selected" : isDragging ? "Drop your CV here" : "Upload Your Resume"}
                </h3>
                {cvFile && !usingSavedCV ? (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {cvFile.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {(cvFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <p className={`text-xs ${isDragging
                    ? 'text-[#635BFF] dark:text-[#a5a0ff] font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {isDragging ? "Release to upload" : "Click to select or drag and drop a PDF file"}
                  </p>
                )}
              </div>
              {cvFile && !usingSavedCV && (
                <span className="ml-2 flex-shrink-0 rounded-full bg-[#635BFF]/10 dark:bg-[#5249e6]/30 backdrop-blur-sm p-1.5 border border-[#635BFF]/20 dark:border-[#5249e6]/30">
                  <Check className="w-3.5 h-3.5 text-[#635BFF] dark:text-[#a5a0ff]" />
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
          <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center 
            bg-[#635BFF]/5 dark:bg-[#635BFF]/10 backdrop-blur-sm 
            px-2.5 py-1.5 rounded-lg border border-[#635BFF]/10 dark:border-[#635BFF]/20">
            <Info className="w-3 h-3 mr-1.5 text-[#635BFF] dark:text-[#a5a0ff] flex-shrink-0" />
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
          <div data-tour="job-input-mode" className="flex items-center gap-1.5 p-1 bg-gray-100/50 dark:bg-[#2b2a2c]/30 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-[#3d3c3e]/50">
            <button
              onClick={() => {
                setJobInputMode('ai');
                setSelectedSavedJob(null);
                setJobSearchQuery('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ease-out ${jobInputMode === 'ai'
                ? 'bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white shadow-lg shadow-[#635BFF]/20 dark:shadow-[#635BFF]/30'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-[#3d3c3e]/50'
                }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Extraction</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={() => {
                setJobInputMode('manual');
                setSelectedSavedJob(null);
                setJobSearchQuery('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ease-out ${jobInputMode === 'manual'
                ? 'bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white shadow-lg shadow-[#635BFF]/20 dark:shadow-[#635BFF]/30'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-[#3d3c3e]/50'
                }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </button>
            <button
              onClick={() => {
                setJobInputMode('saved');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ease-out ${jobInputMode === 'saved'
                ? 'bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white shadow-lg shadow-[#635BFF]/20 dark:shadow-[#635BFF]/30'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-[#3d3c3e]/50'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved Jobs</span>
              <span className="sm:hidden">Saved</span>
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#635BFF] dark:text-[#a5a0ff]" />
                  Job Posting URL
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#635BFF] via-[#7c75ff] to-[#5249e6] opacity-60 blur-sm group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-[#635BFF] via-[#7c75ff] to-[#5249e6]">
                    <div className="relative flex rounded-lg bg-white dark:bg-[#1A1A1A] overflow-hidden">
                      <input
                        type="url"
                        value={formData.jobUrl}
                        onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                        className="flex-1 px-3 py-2.5 rounded-l-lg bg-transparent border-0 focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="https://linkedin.com/jobs/view/..."
                        autoFocus
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExtractJobInfo}
                        disabled={isExtractingJob || !formData.jobUrl || !formData.jobUrl.trim()}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-r-lg bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white hover:from-[#5249e6] hover:to-[#635BFF] dark:hover:from-[#5249e6] dark:hover:to-[#635BFF] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="e.g., Google"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Job Description
                </label>
                <textarea
                  data-tour="job-description"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all h-36 resize-none"
                  placeholder="Paste the complete job description here..."
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>Include the full job description for the most accurate results</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Saved Jobs Mode */}
          {jobInputMode === 'saved' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="relative job-selector-container" ref={jobSelectorRef}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#635BFF] dark:text-[#a5a0ff]" />
                  Select a Saved Job
                </label>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={jobInputRef}
                    type="text"
                    value={selectedSavedJob ? `${selectedSavedJob.companyName} - ${selectedSavedJob.position}` : jobSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setJobSearchQuery(value);
                      // Si on efface la sélection, réinitialiser
                      if (selectedSavedJob && !value.includes(selectedSavedJob.companyName)) {
                        setSelectedSavedJob(null);
                        setFormData({
                          jobTitle: '',
                          company: '',
                          jobDescription: '',
                          jobUrl: '',
                        });
                      }
                      setShowJobDropdown(true);
                    }}
                    onFocus={() => {
                      if (savedJobs.length > 0) {
                        setShowJobDropdown(true);
                      }
                    }}
                    onClick={() => {
                      if (savedJobs.length > 0) {
                        setShowJobDropdown(true);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border-transparent focus:bg-white dark:focus:bg-[#1A1A1A] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all"
                    placeholder="Search by company or position..."
                  />
                  {selectedSavedJob && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSavedJob(null);
                        setJobSearchQuery('');
                        setFormData({
                          jobTitle: '',
                          company: '',
                          jobDescription: '',
                          jobUrl: '',
                        });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Dropdown avec les jobs */}
                {createPortal(
                  <AnimatePresence>
                    {showJobDropdown && savedJobs.length > 0 && (
                      <motion.div
                        ref={jobDropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed z-[100] bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/50 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                        style={dropdownPosition ? {
                          position: 'fixed',
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width}px`,
                          zIndex: 100
                        } : {
                          position: 'fixed',
                          zIndex: 100
                        }}
                      >
                        {isLoadingSavedJobs ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading jobs...</p>
                          </div>
                        ) : (
                          <>
                            {savedJobs
                              .filter(job =>
                                !jobSearchQuery ||
                                job.companyName.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                                job.position.toLowerCase().includes(jobSearchQuery.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((job) => (
                                <button
                                  key={job.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSavedJob(job);
                                    setJobSearchQuery(`${job.companyName} - ${job.position}`);
                                    setShowJobDropdown(false);

                                    // Pré-remplir les champs
                                    setFormData({
                                      jobTitle: job.position,
                                      company: job.companyName,
                                      jobDescription: job.fullJobDescription || job.description || '',
                                      jobUrl: job.url || '',
                                    });

                                    notify.success('Job selected successfully');
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors border-b border-gray-100 dark:border-[#3d3c3e]/50 last:border-b-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <CompanyLogo
                                      companyName={job.companyName}
                                      size="md"
                                      className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {job.companyName}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                        {job.position}
                                      </p>
                                      {job.location && (
                                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {job.location}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                      {job.fullJobDescription ? (
                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff]">
                                          Complete
                                        </span>
                                      ) : job.description ? (
                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                          Summary
                                        </span>
                                      ) : null}
                                      {job.appliedDate && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                          {new Date(job.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            {savedJobs.filter(job =>
                              !jobSearchQuery ||
                              job.companyName.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                              job.position.toLowerCase().includes(jobSearchQuery.toLowerCase())
                            ).length === 0 && (
                                <div className="p-4 text-center">
                                  <Briefcase className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No jobs found</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {jobSearchQuery ? 'Try a different search term' : 'Start tracking jobs in Applications to use them here'}
                                  </p>
                                </div>
                              )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}

                {/* Job sélectionné - Affichage de confirmation compact */}
                {selectedSavedJob && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 bg-[#635BFF]/5 dark:bg-[#635BFF]/10 border border-[#635BFF]/20 dark:border-[#635BFF]/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedSavedJob.companyName} - {selectedSavedJob.position}
                        </p>
                        {selectedSavedJob.fullJobDescription && (
                          <p className="text-xs text-[#635BFF] dark:text-[#a5a0ff] mt-0.5">
                            Full job description loaded
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Message d'aide - seulement si aucun job sélectionné */}
                {!selectedSavedJob && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    <span>Select a job you've already tracked to quickly fill in the details</span>
                  </p>
                )}
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
            notify.error('Please upload a PDF file');
            return;
          }
          setCvFile(file);
          notify.success('CV selected successfully');
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

  // Register page data with AI Assistant - Enhanced with actionable insights
  const cvAnalysisSummary = useMemo(() => {
    // Calculate average score across analyses
    const avgScore = analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + (a.matchScore || 0), 0) / analyses.length)
      : null;
    
    // Find best and worst performing analyses
    const sortedByScore = [...analyses].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const bestMatch = sortedByScore[0];
    const worstMatch = sortedByScore[sortedByScore.length - 1];
    
    // Extract common weak areas across analyses
    const allWeakAreas: string[] = [];
    analyses.forEach(a => {
      if (a.weakAreas) allWeakAreas.push(...a.weakAreas);
    });
    const weakAreaCounts = allWeakAreas.reduce((acc, area) => {
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topWeakAreas = Object.entries(weakAreaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    // Generate quick win suggestions
    const quickWins: string[] = [];
    if (avgScore && avgScore < 70) {
      quickWins.push('Add more quantifiable achievements (numbers, percentages)');
    }
    if (topWeakAreas.includes('keywords')) {
      quickWins.push('Add industry-specific keywords to your CV');
    }
    if (topWeakAreas.includes('experience')) {
      quickWins.push('Expand on your work experience descriptions');
    }

    // Determine the current view mode based on state
    const isCreatingNewAnalysis = isModalOpen;
    const currentWizardStep = isCreatingNewAnalysis ? currentStep : null;
    const wizardStepName = currentWizardStep ? ['Select CV', 'Job Details', 'Review'][currentWizardStep - 1] : null;

    // Categorize analyses by score
    const highScoreAnalyses = analyses.filter(a => (a.matchScore || 0) >= 80);
    const mediumScoreAnalyses = analyses.filter(a => (a.matchScore || 0) >= 60 && (a.matchScore || 0) < 80);
    const lowScoreAnalyses = analyses.filter(a => (a.matchScore || 0) < 60);

    // Get industry/company trends
    const companiesAnalyzed = [...new Set(analyses.map(a => a.company).filter(Boolean))];
    const industriesMap: Record<string, number> = {};
    analyses.forEach(a => {
      if (a.industry) {
        industriesMap[a.industry] = (industriesMap[a.industry] || 0) + 1;
      }
    });
    const topIndustries = Object.entries(industriesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([industry, count]) => ({ industry, count }));

    // Detailed list of ALL analyses (limited to top 20 to avoid payload overload)
    const detailedAnalyses = analyses.slice(0, 20).map(a => {
      // Categorize score
      let scoreCategory: 'high' | 'medium' | 'low';
      if ((a.matchScore || 0) >= 80) scoreCategory = 'high';
      else if ((a.matchScore || 0) >= 60) scoreCategory = 'medium';
      else scoreCategory = 'low';

      return {
        id: a.id,
        jobTitle: a.jobTitle,
        company: a.company,
        matchScore: a.matchScore,
        scoreCategory,
        date: a.date,
        // Premium analysis fields
        isPremium: a.type === 'premium' || !!a.match_scores,
        // Key findings (top 5 for context)
        keyFindings: a.keyFindings?.slice(0, 5) || a.key_findings?.slice(0, 5) || [],
        // Category scores if available
        categoryScores: a.categoryScores || a.category_scores || null,
        // Skills information
        skillsMatchCount: a.skillsMatch?.matching?.length || 0,
        skillsMissingCount: a.skillsMatch?.missing?.length || 0,
        topMatchingSkills: a.skillsMatch?.matching?.slice(0, 5).map((s: any) => s.name || s) || [],
        topMissingSkills: a.skillsMatch?.missing?.slice(0, 5).map((s: any) => s.name || s) || [],
        // ATS score if available
        atsScore: a.atsOptimization?.score || a.ats_score || null,
        // Has CV rewrite generated
        hasCVRewrite: !!(a.cv_rewrite || a.cvRewrite),
      };
    });

    return {
      // Page context
      pagePath: '/cv-analysis',
      viewMode: isCreatingNewAnalysis ? 'creating-analysis' : 'analysis-list',
      wizardStep: wizardStepName,
      totalAnalyses: analyses.length,
      // Performance overview
      performance: {
        averageScore: avgScore,
        bestMatch: bestMatch ? {
          id: bestMatch.id,
          jobTitle: bestMatch.jobTitle,
          company: bestMatch.company,
          score: bestMatch.matchScore,
        } : null,
        worstMatch: worstMatch && analyses.length > 1 ? {
          id: worstMatch.id,
          jobTitle: worstMatch.jobTitle,
          company: worstMatch.company,
          score: worstMatch.matchScore,
        } : null,
      },
      // Score distribution
      scoreDistribution: {
        high: highScoreAnalyses.length,
        medium: mediumScoreAnalyses.length,
        low: lowScoreAnalyses.length,
      },
      // Industry/company trends
      trends: {
        companiesAnalyzed: companiesAnalyzed.slice(0, 10),
        topIndustries,
        totalCompanies: companiesAnalyzed.length,
      },
      // Actionable insights
      insights: {
        topWeakAreas,
        quickWins,
        improvementPriority: topWeakAreas[0] || 'Keep optimizing your CV',
      },
      // Detailed list of analyses (up to 20)
      allAnalyses: detailedAnalyses,
      // Legacy field for backward compatibility
      recentAnalyses: analyses.slice(0, 8).map(a => ({
        id: a.id,
        jobTitle: a.jobTitle,
        company: a.company,
        matchScore: a.matchScore,
        date: a.date,
        keyFindings: a.keyFindings?.slice(0, 3),
      })),
      currentForm: formData.jobTitle || formData.company ? {
        jobTitle: formData.jobTitle,
        company: formData.company,
        hasJobDescription: !!formData.jobDescription,
      } : null,
      selectedCV: userCV?.name || (cvFile ? cvFile.name : null),
      isAnalyzing: isLoading,
    };
  }, [analyses, formData, userCV, cvFile, isLoading, isModalOpen, currentStep]);

  useAssistantPageData('cvAnalysis', cvAnalysisSummary, analyses.length > 0 || !!formData.jobTitle);

  return (
    <AuthLayout>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Cover Photo Section with all header elements */}
        <div 
          className="relative group/cover flex-shrink-0"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area - Height adjusted to contain all header elements */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${coverPhoto ? 'h-auto min-h-[160px] sm:min-h-[180px]' : 'h-auto min-h-[120px] sm:min-h-[140px]'}`}>
            {/* Cover Background */}
            {coverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  key={coverPhoto}
                  src={coverPhoto} 
                  alt="CV Analysis cover" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                   style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
              </div>
            )}

            {/* Cover Controls - Visible on hover - Centered */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <AnimatePresence>
                {(isHoveringCover || !coverPhoto) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 pointer-events-auto"
                  >
                    {!coverPhoto ? (
                      <button
                        onClick={() => setIsCoverGalleryOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                          bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#3d3c3e]
                          border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-sm transition-all duration-200
                          hover:shadow-md group"
                      >
                        <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        <span>Add cover</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-[#242325]/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Change cover
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />
                        
                        <button
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUpdatingCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          {isUpdatingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>
                        
                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />
                        
                        <button
                          onClick={handleRemoveCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 
                            hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          title="Remove cover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Header Content - Positioned directly on cover */}
            <div className="relative z-10 px-4 sm:px-6 pt-6 pb-3 flex flex-col gap-2">
              {/* Title and New Analysis Button Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
              >
                {/* Title left */}
          <div>
                  <h1 className={`text-2xl font-bold ${coverPhoto 
                    ? 'text-white drop-shadow-2xl'
                    : 'text-gray-900 dark:text-white'
                  }`}>Resume Lab</h1>
                  <p className={`text-sm mt-0.5 ${coverPhoto 
                    ? 'text-white/90 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
              AI-powered resume analysis for smarter applications
            </p>
          </div>

                {/* New Analysis Button right */}
                <motion.button
                  data-tour="start-analysis-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormData({
                jobTitle: '',
                company: '',
                jobDescription: '',
                jobUrl: '',
              });
              setCvFile(null);
              setCurrentStep(1);
              setJobInputMode('ai');
              setSelectedSavedJob(null);
              setJobSearchQuery('');
              setShowJobDropdown(false);
              setIsModalOpen(true);
            }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200
                    text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015]"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Analysis</span>
                </motion.button>
              </motion.div>
        </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={coverFileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileSelect}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 pt-6 pb-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">

        {/* Minimal Search and Filters - Notion Style */}
        {analyses.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 
                  bg-transparent
                  border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                  focus:border-gray-300 dark:focus:border-gray-600
                  focus:ring-0 focus:outline-none
                  text-sm text-gray-900 dark:text-white placeholder-gray-400
                  transition-colors duration-200"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Score Filter */}
              <div className="relative">
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value as any)}
                  className="appearance-none bg-transparent border border-gray-200 dark:border-[#3d3c3e] rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 dark:text-gray-300 focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 focus:outline-none cursor-pointer transition-colors duration-200"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-transparent border border-gray-200 dark:border-[#3d3c3e] rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 dark:text-gray-300 focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 focus:outline-none cursor-pointer transition-colors duration-200"
                >
                  <option value="date">Date</option>
                  <option value="score">Score</option>
                  <option value="company">Company</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 dark:border-[#3d3c3e] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analyses Grid/List */}
        {filteredAnalyses.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
          }>
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
          /* Minimal Empty State - First Time */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] 
              flex items-center justify-center mx-auto mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1.5">
              No analyses yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
              Upload your resume and a job description to get started.
            </p>

            <button
              onClick={() => {
                setFormData({
                  jobTitle: '',
                  company: '',
                  jobDescription: '',
                  jobUrl: '',
                });
                setCvFile(null);
                setUsingSavedCV(false);
                setCurrentStep(1);
                setJobInputMode('ai');
                setSelectedSavedJob(null);
                setJobSearchQuery('');
                setShowJobDropdown(false);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
                text-gray-900 
                bg-[#b7e219] 
                border border-[#9fc015] rounded-lg
                hover:bg-[#a5cb17] 
                shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          </motion.div>
        ) : (
          /* Minimal Empty State - No Search Results */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] 
              flex items-center justify-center mx-auto mb-3">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
              No results
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterScore('all');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 
                hover:text-gray-900 dark:hover:text-white 
                underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        )}
        </div>
      </div>

      {/* Premium Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsModalOpen(false);
              setSelectedSavedJob(null);
              setJobSearchQuery('');
              setShowJobDropdown(false);
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              data-tour="analysis-modal"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl rounded-t-2xl max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/5"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3d3c3e]/50 flex items-center justify-between bg-white/95 dark:bg-[#2b2a2c]/95 backdrop-blur-xl z-10 sticky top-0">
                <div>
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white tracking-tight">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSavedJob(null);
                    setJobSearchQuery('');
                    setShowJobDropdown(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 overflow-x-visible">
                <div className="relative">
                  {steps[currentStep - 1].content}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-[#3d3c3e]/50 bg-white dark:bg-[#2b2a2c] flex justify-between items-center z-10">
                <button
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  disabled={currentStep === 1}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${currentStep === 1
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                    }`}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back
                </button>

                <button
                  data-tour={currentStep === steps.length ? "analyze-button" : "continue-button"}
                  onClick={() => {
                    if (currentStep < steps.length) {
                      if (currentStep === 2) {
                        if (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim()) {
                          notify.error('Please fill in all job information fields');
                          return;
                        }
                      }
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleAnalysis();
                    }
                  }}
                  disabled={
                    (currentStep === 1 && !cvFile && !usingSavedCV && !selectedBuilderItem) ||
                    (currentStep === 2 && (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim())) ||
                    isDownloadingCV
                  }
                  className="px-5 py-2 bg-gradient-to-r from-[#635BFF] to-[#7c75ff] dark:from-[#635BFF] dark:to-[#5249e6] text-white rounded-lg hover:from-[#5249e6] hover:to-[#635BFF] dark:hover:from-[#5249e6] dark:hover:to-[#635BFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[#635BFF]/20 dark:shadow-[#635BFF]/30 flex items-center gap-2"
                >
                  {currentStep === steps.length ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Analyze Resume</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay removed - analyses now load in background */}


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

      {/* CV Preview Modal - Using Premium PDF Viewer */}
      <PremiumPDFViewer
        pdfDocument={userCV ? {
          id: 'preview-cv',
          name: userCV.name,
          fileUrl: userCV.url,
          fileSize: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        } : null}
        isOpen={showCVPreview && !!userCV}
          onClose={() => setShowCVPreview(false)}
        />

      {/* Input file global pour s'assurer qu'il est toujours accessible */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf"
      />

      {/* Cover Photo Modals */}
      <CoverPhotoCropper
        isOpen={isCoverCropperOpen}
        file={selectedCoverFile}
        onClose={() => {
          setIsCoverCropperOpen(false);
          setSelectedCoverFile(null);
        }}
        onCropped={handleCroppedCover}
        exportWidth={1584}
        exportHeight={396}
      />
      
      <CoverPhotoGallery
        isOpen={isCoverGalleryOpen}
        onClose={() => setIsCoverGalleryOpen(false)}
        onDirectApply={handleDirectApplyCover}
        onRemove={coverPhoto ? handleRemoveCover : undefined}
        currentCover={coverPhoto || undefined}
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
function formatDateString(dateInput: any): string {
  // Si c'est null ou undefined
  if (!dateInput) {
    return new Date().toISOString().split('T')[0];
  }

  // Si c'est un Timestamp Firestore (a une méthode toDate)
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    return dateInput.toDate().toISOString().split('T')[0];
  }

  // Si c'est un objet Date
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }

  // Si c'est une string
  if (typeof dateInput === 'string') {
    // Si la date contient le format ISO avec T, extraire seulement la partie date
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    return dateInput;
  }

  // Fallback: retourner la date actuelle
  return new Date().toISOString().split('T')[0];
}