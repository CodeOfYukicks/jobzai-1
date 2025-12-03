/**
 * CV Comparison Types
 * TypeScript definitions for the Before/After comparison feature
 */

import { CVData, CVExperience, CVEducation, CVSkill } from './cvEditor';

// ============================================================================
// DIFF SEGMENT TYPES
// ============================================================================

export type DiffType = 'unchanged' | 'added' | 'removed' | 'modified';

/**
 * A segment of text with its diff status
 */
export interface DiffSegment {
  type: DiffType;
  value: string;
}

/**
 * Word-level diff result for a single text block
 */
export interface WordDiffResult {
  segments: DiffSegment[];
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

// ============================================================================
// SECTION COMPARISON TYPES
// ============================================================================

export type ComparisonSectionType = 
  | 'summary' 
  | 'experiences' 
  | 'education' 
  | 'skills' 
  | 'certifications' 
  | 'languages'
  | 'projects';

/**
 * Base comparison result for any section
 */
export interface SectionComparisonBase {
  sectionType: ComparisonSectionType;
  hasChanges: boolean;
  changeStats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

/**
 * Summary section comparison
 */
export interface SummaryComparison extends SectionComparisonBase {
  sectionType: 'summary';
  original: string;
  modified: string;
  diff: WordDiffResult;
}

/**
 * Single bullet point comparison
 */
export interface BulletComparison {
  id: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: string;
  modified?: string;
  diff?: WordDiffResult;
}

/**
 * Single experience comparison
 */
export interface ExperienceComparisonItem {
  id: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  };
  modified?: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  };
  titleDiff?: WordDiffResult;
  companyDiff?: WordDiffResult;
  bulletComparisons: BulletComparison[];
  changeStats: {
    bulletsAdded: number;
    bulletsRemoved: number;
    bulletsModified: number;
    bulletsUnchanged: number;
  };
}

/**
 * Experiences section comparison
 */
export interface ExperiencesComparison extends SectionComparisonBase {
  sectionType: 'experiences';
  items: ExperienceComparisonItem[];
}

/**
 * Single education comparison
 */
export interface EducationComparisonItem {
  id: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: {
    degree: string;
    institution: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  };
  modified?: {
    degree: string;
    institution: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  };
  degreeDiff?: WordDiffResult;
  institutionDiff?: WordDiffResult;
  fieldDiff?: WordDiffResult;
}

/**
 * Education section comparison
 */
export interface EducationComparison extends SectionComparisonBase {
  sectionType: 'education';
  items: EducationComparisonItem[];
}

/**
 * Single skill comparison
 */
export interface SkillComparisonItem {
  name: string;
  status: 'added' | 'removed' | 'unchanged';
}

/**
 * Skills section comparison
 */
export interface SkillsComparison extends SectionComparisonBase {
  sectionType: 'skills';
  items: SkillComparisonItem[];
}

/**
 * Union type for all section comparisons
 */
export type SectionComparison = 
  | SummaryComparison 
  | ExperiencesComparison 
  | EducationComparison 
  | SkillsComparison;

// ============================================================================
// FULL CV COMPARISON
// ============================================================================

/**
 * Complete CV comparison result
 */
export interface CVComparisonResult {
  hasAnyChanges: boolean;
  timestamp: string;
  summary?: SummaryComparison;
  experiences?: ExperiencesComparison;
  education?: EducationComparison;
  skills?: SkillsComparison;
  totalStats: {
    sectionsChanged: number;
    totalAdded: number;
    totalRemoved: number;
    totalModified: number;
  };
}

// ============================================================================
// MODAL STATE
// ============================================================================

export type ComparisonViewMode = 'diff' | 'before' | 'after' | 'split';

/**
 * Modal state for the comparison overlay
 */
export interface ComparisonModalState {
  isOpen: boolean;
  selectedSection: ComparisonSectionType | null;
  viewMode: ComparisonViewMode;
  expandedExperienceIds: Set<string>;
  expandedEducationIds: Set<string>;
}

/**
 * Original CV data structure (parsed from initial_cv markdown)
 */
export interface OriginalCVData {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    title?: string;
  };
  summary?: string;
  experiences?: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education?: Array<{
    id: string;
    degree: string;
    institution: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  languages?: Array<{
    name: string;
    level?: string;
  }>;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useBeforeAfterComparison hook
 */
export interface UseBeforeAfterComparisonReturn {
  // Data
  originalCV: OriginalCVData | null;
  comparison: CVComparisonResult | null;
  isLoading: boolean;
  
  // Modal state
  modalState: ComparisonModalState;
  
  // Actions
  openModal: (section?: ComparisonSectionType) => void;
  closeModal: () => void;
  setViewMode: (mode: ComparisonViewMode) => void;
  selectSection: (section: ComparisonSectionType) => void;
  toggleExperienceExpanded: (id: string) => void;
  toggleEducationExpanded: (id: string) => void;
  
  // Revert actions
  revertSection: (section: ComparisonSectionType) => void;
  revertAll: () => void;
}





