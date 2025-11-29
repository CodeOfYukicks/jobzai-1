/**
 * useBeforeAfterComparison Hook
 * Manages state for the Before/After CV comparison feature
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CVComparisonResult,
  ComparisonSectionType,
  ComparisonViewMode,
  ComparisonModalState,
  OriginalCVData,
  UseBeforeAfterComparisonReturn,
} from '../types/cvComparison';
import { CVData } from '../types/cvEditor';
import {
  parseOriginalCVMarkdown,
  computeFullCVComparison,
  convertStructuredDataToOriginalCVData,
} from '../lib/cvComparisonEngine';

/** Original structured data from cv_rewrite.original_structured_data */
interface OriginalStructuredData {
  personalInfo?: any;
  summary?: string;
  experiences?: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    location?: string;
    bullets: string[];
  }>;
  educations?: Array<{
    id: string;
    degree: string;
    institution: string;
    startDate?: string;
    endDate?: string;
    year?: string;
  }>;
  skills?: string[];
  languages?: Array<{ name: string; level: string }>;
  certifications?: Array<{ name: string; issuer?: string; date?: string }>;
}

interface UseBeforeAfterComparisonProps {
  /** Initial CV markdown from cv_rewrite.initial_cv (legacy, fallback) */
  initialCVMarkdown?: string;
  /** Original CV structured data (PREFERRED - accurate experience parsing) */
  originalStructuredData?: OriginalStructuredData;
  /** Current CV data (AI-rewritten) */
  currentCVData: CVData | null;
  /** Callback when user wants to revert a section */
  onRevertSection?: (section: ComparisonSectionType, originalData: any) => void;
  /** Callback when user wants to revert all changes */
  onRevertAll?: (originalCVData: OriginalCVData) => void;
}

const initialModalState: ComparisonModalState = {
  isOpen: false,
  selectedSection: null,
  viewMode: 'diff',
  expandedExperienceIds: new Set(),
  expandedEducationIds: new Set(),
};

export function useBeforeAfterComparison({
  initialCVMarkdown,
  originalStructuredData,
  currentCVData,
  onRevertSection,
  onRevertAll,
}: UseBeforeAfterComparisonProps): UseBeforeAfterComparisonReturn {
  // State
  const [modalState, setModalState] = useState<ComparisonModalState>(initialModalState);
  const [isLoading, setIsLoading] = useState(false);

  // Get original CV data - PRIORITIZE structured data over markdown parsing
  const originalCV = useMemo((): OriginalCVData | null => {
    // PRIORITY 1: Use originalStructuredData if available (most accurate)
    if (originalStructuredData) {
      try {
        const converted = convertStructuredDataToOriginalCVData(originalStructuredData);
        console.log('✅ Using original_structured_data for comparison:', {
          experiences: converted.experiences?.length || 0,
          education: converted.education?.length || 0,
        });
        return converted;
      } catch (error) {
        console.error('Error converting original structured data:', error);
      }
    }
    
    // PRIORITY 2: Fallback to parsing markdown (legacy data)
    if (initialCVMarkdown && initialCVMarkdown.trim().length > 0) {
      try {
        console.log('⚠️ Falling back to markdown parsing for comparison');
        return parseOriginalCVMarkdown(initialCVMarkdown);
      } catch (error) {
        console.error('Error parsing original CV markdown:', error);
      }
    }
    
    return null;
  }, [originalStructuredData, initialCVMarkdown]);

  // Compute comparison when both original and current data are available
  const comparison = useMemo((): CVComparisonResult | null => {
    if (!originalCV || !currentCVData) {
      return null;
    }

    try {
      return computeFullCVComparison(originalCV, currentCVData);
    } catch (error) {
      console.error('Error computing CV comparison:', error);
      return null;
    }
  }, [originalCV, currentCVData]);

  // Modal actions
  const openModal = useCallback((section?: ComparisonSectionType) => {
    setModalState(prev => ({
      ...prev,
      isOpen: true,
      selectedSection: section || prev.selectedSection,
      // Auto-expand first experience when opening experiences section
      expandedExperienceIds: section === 'experiences' && comparison?.experiences?.items[0]
        ? new Set([comparison.experiences.items[0].id])
        : prev.expandedExperienceIds,
    }));
  }, [comparison]);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setViewMode = useCallback((mode: ComparisonViewMode) => {
    setModalState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const selectSection = useCallback((section: ComparisonSectionType) => {
    setModalState(prev => ({
      ...prev,
      selectedSection: section,
      // Auto-expand first item when selecting experiences or education
      expandedExperienceIds: section === 'experiences' && comparison?.experiences?.items[0]
        ? new Set([comparison.experiences.items[0].id])
        : prev.expandedExperienceIds,
      expandedEducationIds: section === 'education' && comparison?.education?.items[0]
        ? new Set([comparison.education.items[0].id])
        : prev.expandedEducationIds,
    }));
  }, [comparison]);

  const toggleExperienceExpanded = useCallback((id: string) => {
    setModalState(prev => {
      const newSet = new Set(prev.expandedExperienceIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        ...prev,
        expandedExperienceIds: newSet,
      };
    });
  }, []);

  const toggleEducationExpanded = useCallback((id: string) => {
    setModalState(prev => {
      const newSet = new Set(prev.expandedEducationIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        ...prev,
        expandedEducationIds: newSet,
      };
    });
  }, []);

  // Revert actions
  const revertSection = useCallback((section: ComparisonSectionType) => {
    if (!originalCV || !onRevertSection) return;

    switch (section) {
      case 'summary':
        onRevertSection(section, originalCV.summary);
        break;
      case 'experiences':
        onRevertSection(section, originalCV.experiences);
        break;
      case 'education':
        onRevertSection(section, originalCV.education);
        break;
      case 'skills':
        onRevertSection(section, originalCV.skills);
        break;
      default:
        break;
    }
  }, [originalCV, onRevertSection]);

  const revertAll = useCallback(() => {
    if (!originalCV || !onRevertAll) return;
    onRevertAll(originalCV);
  }, [originalCV, onRevertAll]);

  return {
    // Data
    originalCV,
    comparison,
    isLoading,

    // Modal state
    modalState,

    // Actions
    openModal,
    closeModal,
    setViewMode,
    selectSection,
    toggleExperienceExpanded,
    toggleEducationExpanded,

    // Revert actions
    revertSection,
    revertAll,
  };
}

/**
 * Helper hook to check if comparison is available
 */
export function useHasComparison(
  initialCVMarkdown?: string,
  currentCVData?: CVData | null,
  originalStructuredData?: OriginalStructuredData
): boolean {
  return useMemo(() => {
    // Check if we have original data (either structured or markdown)
    const hasOriginalData = originalStructuredData || (initialCVMarkdown && initialCVMarkdown.trim().length > 0);
    
    if (!hasOriginalData || !currentCVData) return false;
    
    // Check if current CV has meaningful data
    const hasExperiences = currentCVData.experiences && currentCVData.experiences.length > 0;
    const hasSummary = currentCVData.summary && currentCVData.summary.trim().length > 0;
    const hasEducation = currentCVData.education && currentCVData.education.length > 0;
    
    return hasExperiences || hasSummary || hasEducation;
  }, [initialCVMarkdown, currentCVData, originalStructuredData]);
}

export default useBeforeAfterComparison;

