// CV Review AI Types

export type SuggestionTag = 
  | 'missing_info'      // Info manquante (tel, location)
  | 'ats_optimize'      // Optimisation ATS
  | 'add_impact'        // Ajouter metriques/resultats
  | 'stay_relevant'     // Garder pertinent au job
  | 'be_concise'        // Raccourcir
  | 'tailor_resume';    // Adapter au poste

export type SuggestionPriority = 'high' | 'medium' | 'low';

export type CVSectionType = 
  | 'contact'
  | 'about'
  | 'experiences'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'languages';

export interface SuggestionAction {
  type: 'add' | 'update' | 'remove' | 'rewrite';
  targetSection: CVSectionType;
  targetField?: string;           // e.g., 'phone', 'location', 'summary'
  targetItemId?: string;          // For array items like experiences[id]
  targetBulletIndex?: number;     // For bullet points in experiences
  suggestedValue?: string;        // The new value to apply
  currentValue?: string;          // Current value for comparison
}

export interface CVSuggestion {
  id: string;
  title: string;
  description: string;
  section: CVSectionType;
  priority: SuggestionPriority;
  tags: SuggestionTag[];
  action: SuggestionAction;
  isApplicable: boolean;          // Can be auto-applied
}

export interface CVReviewSummary {
  greeting: string;               // Personalized AI greeting
  overallScore: number;           // 0-100 ATS score
  strengths: string[];            // What's good about the CV
  mainIssues: string[];           // Key areas to improve
}

export interface CVReviewResult {
  summary: CVReviewSummary;
  suggestions: CVSuggestion[];
  analyzedAt: string;             // ISO timestamp
}

export interface CVReviewState {
  isLoading: boolean;
  error: string | null;
  result: CVReviewResult | null;
  selectedIds: Set<string>;
  groupBy: 'section' | 'priority';
  ignoredIds: Set<string>;
}

// Highlight target for preview sync
export interface HighlightTarget {
  section: CVSectionType;
  itemId?: string;
  field?: string;
  suggestedValue?: string;
  currentValue?: string;
}

// Tag display configuration
export const TAG_CONFIG: Record<SuggestionTag, { label: string; color: string; bgColor: string }> = {
  missing_info: { 
    label: 'Missing Info', 
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50'
  },
  ats_optimize: { 
    label: 'ATS Optimize', 
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/50'
  },
  add_impact: { 
    label: 'Add Impact', 
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50'
  },
  stay_relevant: { 
    label: 'Stay Relevant', 
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50'
  },
  be_concise: { 
    label: 'Be Concise', 
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/50'
  },
  tailor_resume: { 
    label: 'Tailor Resume', 
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50'
  }
};

// Section display configuration
export const SECTION_CONFIG: Record<CVSectionType, { label: string; icon: string; color: string }> = {
  contact: { label: 'Contact', icon: 'User', color: 'text-blue-500' },
  about: { label: 'About', icon: 'FileText', color: 'text-emerald-500' },
  experiences: { label: 'Experiences', icon: 'Briefcase', color: 'text-amber-500' },
  education: { label: 'Education', icon: 'GraduationCap', color: 'text-violet-500' },
  skills: { label: 'Skills', icon: 'Code', color: 'text-cyan-500' },
  certifications: { label: 'Certifications', icon: 'Award', color: 'text-rose-500' },
  projects: { label: 'Projects', icon: 'FolderOpen', color: 'text-orange-500' },
  languages: { label: 'Languages', icon: 'Globe', color: 'text-teal-500' }
};

// Priority display configuration
export const PRIORITY_CONFIG: Record<SuggestionPriority, { label: string; color: string; bgColor: string }> = {
  high: { 
    label: 'High Priority', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20'
  },
  medium: { 
    label: 'Medium Priority', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20'
  },
  low: { 
    label: 'Low Priority', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  }
};

